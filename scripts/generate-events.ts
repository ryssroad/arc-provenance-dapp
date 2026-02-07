/**
 * Generate real on-chain provenance events
 * Uses wallets from arc-automata/batches/batch_2.json
 */

import { createWalletClient, createPublicClient, http, parseAbi, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { join } from 'path';

// Contract addresses
const DIGITAL_OBJECT_NFT = '0x87020198e7595C60b200EA80be41548F44573365';
const PROVENANCE_REGISTRY = '0xF015b52C9739Dc8D0739e7f7700eC7bbaE9B77C7';

// Chain config
const arcTestnet = {
    id: 5042002,
    name: 'ARC Testnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.testnet.arc.network'] },
    },
};

// ABIs
const nftAbi = parseAbi([
    'function mint(address to, string seedURI) external returns (uint256 tokenId)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function totalSupply() view returns (uint256)',
]);

const registryAbi = parseAbi([
    'function derive(address nft, uint256 parentId, uint256 childId, bytes32 ref) external',
    'function attest(address nft, uint256 tokenId, uint8 kind, bytes32 ref, bytes32 payloadHash) external',
]);

// Attestation kinds
const KIND = {
    SOURCE: 1,
    QUALITY: 2,
    REVIEW: 3,
    LICENSE: 4,
};

interface Wallet {
    address: string;
    private_key: string;
}

async function main() {
    console.log('🚀 Generating on-chain provenance events...\n');

    // Load wallets
    const walletsPath = join(__dirname, '../../arc-automata/batches/batch_2.json');
    const wallets: Wallet[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));
    console.log(`Loaded ${wallets.length} wallets\n`);

    // Create clients
    const publicClient = createPublicClient({
        chain: arcTestnet,
        transport: http(),
    });

    // Use first 4 wallets for different actors
    const actors = wallets.slice(0, 4).map((w) => ({
        account: privateKeyToAccount(w.private_key as Hex),
        client: createWalletClient({
            chain: arcTestnet,
            transport: http(),
            account: privateKeyToAccount(w.private_key as Hex),
        }),
    }));

    console.log('Actors:');
    actors.forEach((a, i) => console.log(`  ${i + 1}. ${a.account.address}`));
    console.log();

    // Check balances
    for (const actor of actors) {
        const balance = await publicClient.getBalance({ address: actor.account.address });
        console.log(`Balance ${actor.account.address}: ${Number(balance) / 1e18} ETH`);
        if (balance < BigInt(1e16)) {
            console.error(`❌ Insufficient balance for ${actor.account.address}`);
            process.exit(1);
        }
    }
    console.log();

    // Step 1: Mint 5 tokens (2 roots, 3 will become derivatives)
    console.log('📦 Step 1: Minting tokens...');
    const tokenIds: bigint[] = [];

    // Actor 0 mints root 1
    console.log('  Minting token 1 (root) by actor 0...');
    let hash = await actors[0].client.writeContract({
        address: DIGITAL_OBJECT_NFT,
        abi: nftAbi,
        functionName: 'mint',
        args: [actors[0].account.address, 'ipfs://QmRoot1/metadata.json'],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    tokenIds.push(1n);
    console.log(`    ✅ Token 1 minted, tx: ${hash}`);

    // Actor 1 mints root 2
    console.log('  Minting token 2 (root) by actor 1...');
    hash = await actors[1].client.writeContract({
        address: DIGITAL_OBJECT_NFT,
        abi: nftAbi,
        functionName: 'mint',
        args: [actors[1].account.address, 'ipfs://QmRoot2/metadata.json'],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    tokenIds.push(2n);
    console.log(`    ✅ Token 2 minted, tx: ${hash}`);

    // Actor 2 mints derivative 3
    console.log('  Minting token 3 (derivative) by actor 2...');
    hash = await actors[2].client.writeContract({
        address: DIGITAL_OBJECT_NFT,
        abi: nftAbi,
        functionName: 'mint',
        args: [actors[2].account.address, 'ipfs://QmDerivative1/metadata.json'],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    tokenIds.push(3n);
    console.log(`    ✅ Token 3 minted, tx: ${hash}`);

    // Actor 3 mints derivative 4
    console.log('  Minting token 4 (derivative) by actor 3...');
    hash = await actors[3].client.writeContract({
        address: DIGITAL_OBJECT_NFT,
        abi: nftAbi,
        functionName: 'mint',
        args: [actors[3].account.address, 'ipfs://QmDerivative2/metadata.json'],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    tokenIds.push(4n);
    console.log(`    ✅ Token 4 minted, tx: ${hash}`);

    // Actor 0 mints sub-derivative 5
    console.log('  Minting token 5 (sub-derivative) by actor 0...');
    hash = await actors[0].client.writeContract({
        address: DIGITAL_OBJECT_NFT,
        abi: nftAbi,
        functionName: 'mint',
        args: [actors[0].account.address, 'ipfs://QmSubDerivative/metadata.json'],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    tokenIds.push(5n);
    console.log(`    ✅ Token 5 minted, tx: ${hash}`);

    console.log();

    // Step 2: Create derivations
    console.log('🔗 Step 2: Creating derivation relationships...');

    // Token 3 derives from Token 1
    console.log('  Deriving: Token 3 from Token 1...');
    hash = await actors[2].client.writeContract({
        address: PROVENANCE_REGISTRY,
        abi: registryAbi,
        functionName: 'derive',
        args: [DIGITAL_OBJECT_NFT, 1n, 3n, '0x' + 'a'.repeat(64) as Hex],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`    ✅ Derived, tx: ${hash}`);

    // Token 4 derives from Token 1
    console.log('  Deriving: Token 4 from Token 1...');
    hash = await actors[3].client.writeContract({
        address: PROVENANCE_REGISTRY,
        abi: registryAbi,
        functionName: 'derive',
        args: [DIGITAL_OBJECT_NFT, 1n, 4n, '0x' + 'b'.repeat(64) as Hex],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`    ✅ Derived, tx: ${hash}`);

    // Token 5 derives from Token 3 (depth 3)
    console.log('  Deriving: Token 5 from Token 3 (depth 3)...');
    hash = await actors[0].client.writeContract({
        address: PROVENANCE_REGISTRY,
        abi: registryAbi,
        functionName: 'derive',
        args: [DIGITAL_OBJECT_NFT, 3n, 5n, '0x' + 'c'.repeat(64) as Hex],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`    ✅ Derived, tx: ${hash}`);

    console.log();

    // Step 3: Create attestations
    console.log('✅ Step 3: Creating attestations...');

    // Actor 1 attests to Token 1 (SOURCE)
    console.log('  Attesting: Token 1 by actor 1 (SOURCE)...');
    hash = await actors[1].client.writeContract({
        address: PROVENANCE_REGISTRY,
        abi: registryAbi,
        functionName: 'attest',
        args: [DIGITAL_OBJECT_NFT, 1n, KIND.SOURCE, '0x' + 'd'.repeat(64) as Hex, '0x' + 'e'.repeat(64) as Hex],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`    ✅ Attested, tx: ${hash}`);

    // Actor 2 attests to Token 1 (QUALITY)
    console.log('  Attesting: Token 1 by actor 2 (QUALITY)...');
    hash = await actors[2].client.writeContract({
        address: PROVENANCE_REGISTRY,
        abi: registryAbi,
        functionName: 'attest',
        args: [DIGITAL_OBJECT_NFT, 1n, KIND.QUALITY, '0x' + 'f'.repeat(64) as Hex, '0x' + '0'.repeat(64) as Hex],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`    ✅ Attested, tx: ${hash}`);

    // Actor 3 attests to Token 3 (REVIEW)
    console.log('  Attesting: Token 3 by actor 3 (REVIEW)...');
    hash = await actors[3].client.writeContract({
        address: PROVENANCE_REGISTRY,
        abi: registryAbi,
        functionName: 'attest',
        args: [DIGITAL_OBJECT_NFT, 3n, KIND.REVIEW, '0x' + '1'.repeat(64) as Hex, '0x' + '2'.repeat(64) as Hex],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`    ✅ Attested, tx: ${hash}`);

    console.log();
    console.log('🎉 Done! Generated:');
    console.log('   - 5 tokens (2 roots, 3 derivatives)');
    console.log('   - 3 derivation relationships (depth 3)');
    console.log('   - 3 attestations (SOURCE, QUALITY, REVIEW)');
    console.log();
    console.log(`View in dApp: http://localhost:3000/nft/${DIGITAL_OBJECT_NFT}`);
}

main().catch(console.error);
