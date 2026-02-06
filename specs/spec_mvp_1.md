0) Цель MVP

Показать на Arc testnet:

• объекты как ERC‑721 токены (digital objects)
• “форки” как деривативные связи между токенами (граф)
• аттестации как ончейн события
• динамическая мета (вариант 1): tokenURI отражает рост forks/attestations
1) Сущности и принцип идентификаторов

Вариант для простоты (рекомендую):

• assetId == tokenId (один и тот же uint256)
• значит любой provenance-ивент адресует (nftAddress, tokenId)
Так мы избегаем маппинга “registry assetId ↔ nft tokenId”.

2) Контракты (минимум 2)

A) DigitalObjectNFT (ERC‑721)

Функции:

• mint(address to, string tokenSeedURI) returns (uint256 tokenId)
• setBaseURI(string) (опционально)
• tokenURI(tokenId):  • либо возвращает baseURI + tokenId
  • либо data:application/json;base64,... (если хочешь ончейн JSON позже)

Динамика (вариант 1):

• Контракт хранит агрегаты:  • forksOut[tokenId]
  • forksIn[tokenId]
  • attestCount[tokenId]
  • uniqueAttesters[tokenId] (опционально, можно offchain)
  • score[tokenId] (опционально)

• Обновление агрегатов: updateStats(tokenId, forksOut, forksIn, attestCount, score, bytes32 ref) только ролью SCORER_ROLE.
Событие:

• event StatsUpdated(uint256 indexed tokenId, uint32 forksOut, uint32 forksIn, uint32 attestCount, uint16 score, bytes32 ref);
B) ProvenanceRegistry

Это “истина событий”, под которую строится граф.

1) Derive / Fork (главное ребро графа)

• event Derived(address indexed nft, uint256 indexed parentId, uint256 indexed childId, address actor, bytes32 ref);
• функция derive(nft, parentId, childId, bytes32 ref):  • проверяет что ownerOf(parentId) и ownerOf(childId) существуют (опционально)
  • эмитит Derived

2) Attest

• event Attested(address indexed nft, uint256 indexed tokenId, address indexed attester, uint8 kind, bytes32 ref, bytes32 payloadHash);
• функция attest(nft, tokenId, kind, ref, payloadHash) эмитит событие
kind на MVP:

• 1 = SOURCE / CREATED
• 2 = QUALITY
• 3 = REVIEW
• 4 = LICENSE (если понадобится)
Важно: payload на чейн не пихаем. Только payloadHash + ref (tx/commit/ipfs CID hash).

3) Потоки (user stories)

Mint root

1. пользователь минтит tokenId
2. attest(nft, tokenId, SOURCE, ref, payloadHash) — фиксируем “origin receipt”
Fork / derive

1. минтим новый childId
2. derive(nft, parentId, childId, ref) — появляется ребро в графе
3. (опц) attest(childId, QUALITY/REVIEW...)
“Рост динамики”

Индексер/скрипт:

• читает логи Derived/Attested
• считает агрегаты по токенам
• вызывает updateStats в NFT (1 транзакция на токен или батч)
4) Индексер/даш (что фронт реально делает)

Фронт (dApp) читает:

• getLogs по Derived и Attested для заданного nftAddress
• строит дерево/граф с depth limit
• считает:  • total assets (узлы)
  • derivatives (ребра)
  • attestations (кол-во Attested)
  • max depth

И отдельно может читать из NFT:

• tokenURI(tokenId) и/или stats(tokenId) для красивых карточек.
5) Что мы сознательно НЕ делаем в MVP

• EAS/внешние attest протоколы
• приватность/шифрование payload
• автоматический onchain подсчёт уникальных аттесторов (дорого)
• oracle-based динамику