import { Address, Hash } from 'viem'
import { ProvenanceNode, AttestationNode, ProvenanceGraph } from './graph-builder'
import { ATTESTATION_KIND } from './contracts'

// Mock addresses
const MOCK_ACTORS: Address[] = [
    '0x1234567890123456789012345678901234567890',
    '0xabcdef0123456789abcdef0123456789abcdef01',
    '0x9876543210987654321098765432109876543210',
    '0xfedcba9876543210fedcba9876543210fedcba98',
]

const MOCK_HASH = '0x' + 'a'.repeat(64) as Hash

// Generate mock provenance data for MVP 1
export function generateMockProvenanceGraph(): ProvenanceGraph {
    // Root assets (parentId = null)
    const root1: ProvenanceNode = {
        tokenId: 1n,
        parentId: null,
        actor: MOCK_ACTORS[0],
        ref: MOCK_HASH,
        txHash: '0x' + '1'.repeat(64) as Hash,
        blockNumber: 1000n,
        children: [],
        attestations: [],
    }

    const root2: ProvenanceNode = {
        tokenId: 2n,
        parentId: null,
        actor: MOCK_ACTORS[1],
        ref: MOCK_HASH,
        txHash: '0x' + '2'.repeat(64) as Hash,
        blockNumber: 1050n,
        children: [],
        attestations: [],
    }

    // Derivatives of root1
    const derivative1: ProvenanceNode = {
        tokenId: 3n,
        parentId: 1n,
        actor: MOCK_ACTORS[2],
        ref: MOCK_HASH,
        txHash: '0x' + '3'.repeat(64) as Hash,
        blockNumber: 1100n,
        children: [],
        attestations: [],
    }

    const derivative2: ProvenanceNode = {
        tokenId: 4n,
        parentId: 1n,
        actor: MOCK_ACTORS[3],
        ref: MOCK_HASH,
        txHash: '0x' + '4'.repeat(64) as Hash,
        blockNumber: 1150n,
        children: [],
        attestations: [],
    }

    // Sub-derivative (depth 3)
    const subDerivative: ProvenanceNode = {
        tokenId: 5n,
        parentId: 3n,
        actor: MOCK_ACTORS[0],
        ref: MOCK_HASH,
        txHash: '0x' + '5'.repeat(64) as Hash,
        blockNumber: 1200n,
        children: [],
        attestations: [],
    }

    // Attestations with kind
    const attestation1: AttestationNode = {
        tokenId: 1n,
        attester: MOCK_ACTORS[1],
        kind: ATTESTATION_KIND.SOURCE,
        ref: '0x' + 'b'.repeat(64) as Hash,
        payloadHash: '0x' + 'c'.repeat(64) as Hash,
        txHash: '0x' + 'a1'.padEnd(64, '0') as Hash,
        blockNumber: 1075n,
    }

    const attestation2: AttestationNode = {
        tokenId: 1n,
        attester: MOCK_ACTORS[2],
        kind: ATTESTATION_KIND.QUALITY,
        ref: '0x' + 'd'.repeat(64) as Hash,
        payloadHash: '0x' + 'e'.repeat(64) as Hash,
        txHash: '0x' + 'a2'.padEnd(64, '0') as Hash,
        blockNumber: 1080n,
    }

    const attestation3: AttestationNode = {
        tokenId: 3n,
        attester: MOCK_ACTORS[3],
        kind: ATTESTATION_KIND.REVIEW,
        ref: '0x' + 'f'.repeat(64) as Hash,
        payloadHash: '0x' + '0'.repeat(64) as Hash,
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

// Get all attestations from mock data
export function getMockAttestations(): AttestationNode[] {
    const graph = generateMockProvenanceGraph()
    const attestations: AttestationNode[] = []

    function collectFromNode(node: ProvenanceNode) {
        attestations.push(...node.attestations)
        for (const child of node.children) {
            collectFromNode(child)
        }
    }

    for (const root of graph.roots) {
        collectFromNode(root)
    }

    return attestations
}
