Ок, дальше — “контракты как интерфейс для фронта”. Дам точные сигнатуры, события, и минимальный ABI-скелет.

Ниже я специально делаю так, чтобы:

• фронт мог строить граф только по event logs (без чтения storage),
• динамика NFT была в отдельном контракте, но не обязательна для графа,
• tokenId == assetId и нет маппингов.

A) ProvenanceRegistry (ядро, 2 event типа)

События (то, что индексируем)

// ребро графа: parent -> child
event Derived(
  address indexed nft,
  uint256 indexed parentId,
  uint256 indexed childId,
  address actor,
  bytes32 ref
);

// аттестация по конкретному токену
event Attested(
  address indexed nft,
  uint256 indexed tokenId,
  address indexed attester,
  uint8 kind,
  bytes32 ref,
  bytes32 payloadHash
);Функции (то, что dApp может дергать)

function derive(
  address nft,
  uint256 parentId,
  uint256 childId,
  bytes32 ref
) external;

function attest(
  address nft,
  uint256 tokenId,
  uint8 kind,
  bytes32 ref,
  bytes32 payloadHash
) external;Правила MVP (простые, но достаточные)

• derive: проверяем, что оба токена существуют (через ownerOf) — иначе revert.
• attest: проверяем, что токен существует.
• никаких ролей/админки в MVP (позже можно добавить allowlist аттесторов, если надо).
Как проверить существование ERC-721 без лишней возни:
try IERC721(nft).ownerOf(id) returns (address) {}


B) DigitalObjectNFT (ERC‑721 + агрегаты динамики)

Storage агрегатов (минимум)

struct Stats {
  uint32 forksOut;
  uint32 forksIn;
  uint32 attestCount;
  uint16 score;      // 0..10000 (basis points) или 0..100
}

mapping(uint256 => Stats) public stats;Событие

event StatsUpdated(
  uint256 indexed tokenId,
  uint32 forksOut,
  uint32 forksIn,
  uint32 attestCount,
  uint16 score,
  bytes32 ref
);Функции

function mint(address to, string calldata seedURI) external returns (uint256 tokenId);

// scorer updates aggregates after reading registry logs offchain
function updateStats(
  uint256 tokenId,
  uint32 forksOut,
  uint32 forksIn,
  uint32 attestCount,
  uint16 score,
  bytes32 ref
) external;Access control для updateStats (MVP-лайт):

• simplest: onlyOwner (Ownable), owner = deployer
• нормально: SCORER_ROLE (AccessControl)
Я бы взял Ownable на MVP, чтобы не разводить роли.
tokenURI (вариант 1 — динамика в metadata)

Чтобы было “видно глазами” без отдельного API:

• tokenURI может отдавать базовый JSON (data URI) с attributes из stats[tokenId].
• seedURI можно хранить как “static part” (name/description/external_url).
На MVP можно даже проще:

• tokenURI = seedURI (как сейчас принято),
• а динамику показывать в dApp (читать stats()).
Но ты просил “динамическое NFT” — значит лучше сделать data URI.

Минимальные ABI-пункты для dApp (что точно надо в viem/wagmi)

Registry ABI (только events + write)

• Derived event
• Attested event
• derive(...)
• attest(...)
NFT ABI (read)

• ownerOf(uint256) (для existence)
• tokenURI(uint256) (опционально)
• stats(uint256) (если хотим показывать агрегаты)

Как это ложится в твой текущий UI

“Provenance Tree”

• строится по Derived(nft, parentId, childId, ...)
• корни — те tokenId, которые ни разу не встречались как childId
“Attestations”

• просто count Attested по всем tokenId в подграфе
• плюс можно подсветить узлы, у которых attestCount > 0
“Transactions table”

• каждая строка = событие Derived/Attested + txHash + blockNumber + actor

контракт деплоим с использованием Standard JSON input для того чтоб иметь возможность верифицировать full
