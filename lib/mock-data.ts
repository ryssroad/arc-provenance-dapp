import { Address, Hash } from 'viem'
import { ProvenanceNode, AttestationNode, ProvenanceGraph } from './graph-builder'

// Mock addresses
const MOCK_ACTORS: Address[] = [
    '0x1234567890123456789012345678901234567890',
    '0xabcdef0123456789abcdef0123456789abcdef01',
    '0x9876543210987654321098765432109876543210',
    '0xfedcba9876543210fedcba9876543210fedcba98',
]

const MOCK_HASH = '0x' + 'a'.repeat(64) as Hash

// Generate mock provenance data
export function generateMockProvenanceGraph(): ProvenanceGraph {
    const now = BigInt(Math.floor(Date.now() / 1000))

    // Root assets
    const root1: ProvenanceNode = {
        assetId: 1n,
        parentId: 0n,
        actor: MOCK_ACTORS[0],
        action: 'publish',
        recipeHash: MOCK_HASH,
        recipeURI: 'ipfs://QmExample1/metadata.json',
        txHash: '0x' + '1'.repeat(64) as Hash,
        blockNumber: 1000n,
        children: [],
        attestations: [],
    }

    const root2: ProvenanceNode = {
        assetId: 2n,
        parentId: 0n,
        actor: MOCK_ACTORS[1],
        action: 'publish',
        recipeHash: MOCK_HASH,
        recipeURI: 'ipfs://QmExample2/metadata.json',
        txHash: '0x' + '2'.repeat(64) as Hash,
        blockNumber: 1050n,
        children: [],
        attestations: [],
    }

    // Derivatives of root1
    const derivative1: ProvenanceNode = {
        assetId: 3n,
        parentId: 1n,
        actor: MOCK_ACTORS[2],
        action: 'derive',
        recipeHash: MOCK_HASH,
        recipeURI: 'ipfs://QmDerivative1/metadata.json',
        txHash: '0x' + '3'.repeat(64) as Hash,
        blockNumber: 1100n,
        children: [],
        attestations: [],
    }

    const derivative2: ProvenanceNode = {
        assetId: 4n,
        parentId: 1n,
        actor: MOCK_ACTORS[3],
        action: 'derive',
        recipeHash: MOCK_HASH,
        recipeURI: 'ipfs://QmDerivative2/metadata.json',
        txHash: '0x' + '4'.repeat(64) as Hash,
        blockNumber: 1150n,
        children: [],
        attestations: [],
    }

    // Sub-derivative (depth 3)
    const subDerivative: ProvenanceNode = {
        assetId: 5n,
        parentId: 3n,
        actor: MOCK_ACTORS[0],
        action: 'derive',
        recipeHash: MOCK_HASH,
        recipeURI: 'ipfs://QmSubDerivative/metadata.json',
        txHash: '0x' + '5'.repeat(64) as Hash,
        blockNumber: 1200n,
        children: [],
        attestations: [],
    }

    // Attestations
    const attestation1: AttestationNode = {
        assetId: 1n,
        actor: MOCK_ACTORS[1],
        claimHash: '0x' + 'b'.repeat(64) as Hash,
        claimURI: 'ipfs://QmAttestation1/claim.json',
        txHash: '0x' + 'a1'.padEnd(64, '0') as Hash,
        blockNumber: 1075n,
    }

    const attestation2: AttestationNode = {
        assetId: 1n,
        actor: MOCK_ACTORS[2],
        claimHash: '0x' + 'c'.repeat(64) as Hash,
        claimURI: 'ipfs://QmAttestation2/claim.json',
        txHash: '0x' + 'a2'.padEnd(64, '0') as Hash,
        blockNumber: 1080n,
    }

    const attestation3: AttestationNode = {
        assetId: 3n,
        actor: MOCK_ACTORS[3],
        claimHash: '0x' + 'd'.repeat(64) as Hash,
        claimURI: 'ipfs://QmAttestation3/claim.json',
        txHash: '0x' + 'a3'.padEnd(64, '0') as Hash,
        blockNumber: 1125n,
    }

    // Build tree structure
    derivative1.children.push(subDerivative)
    root1.children.push(derivative1, derivative2)
    root1.attestations.push(attestation1, attestation2)
    derivative1.attestations.push(attestation3)

    return {
        roots: [root1, root2],
        totalAssets: 5,
        totalDerivatives: 3,
        totalAttestations: 3,
        maxDepth: 3,
    }
}

// Get all transactions from mock data for display
export function getMockTransactions(): Array<{
    txHash: Hash
    blockNumber: bigint
    type: 'publish' | 'derive' | 'attest'
    assetId: bigint
    actor: Address
}> {
    const graph = generateMockProvenanceGraph()
    const transactions: Array<{
        txHash: Hash
        blockNumber: bigint
        type: 'publish' | 'derive' | 'attest'
        assetId: bigint
        actor: Address
    }> = []

    function collectFromNode(node: ProvenanceNode) {
        transactions.push({
            txHash: node.txHash,
            blockNumber: node.blockNumber,
            type: node.action,
            assetId: node.assetId,
            actor: node.actor,
        })

        for (const attestation of node.attestations) {
            transactions.push({
                txHash: attestation.txHash,
                blockNumber: attestation.blockNumber,
                type: 'attest',
                assetId: attestation.assetId,
                actor: attestation.actor,
            })
        }

        for (const child of node.children) {
            collectFromNode(child)
        }
    }

    for (const root of graph.roots) {
        collectFromNode(root)
    }

    // Sort by block number descending
    return transactions.sort((a, b) => Number(b.blockNumber - a.blockNumber))
}
