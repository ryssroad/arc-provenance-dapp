import { PublicClient, Address, Hash } from 'viem'
import { PROVENANCE_REGISTRY_ADDRESS } from './contracts'

// Types
export interface ProvenanceNode {
    assetId: bigint
    parentId: bigint
    actor: Address
    action: 'publish' | 'derive'
    recipeHash: Hash
    recipeURI: string
    txHash: Hash
    blockNumber: bigint
    children: ProvenanceNode[]
    attestations: AttestationNode[]
}

export interface AttestationNode {
    assetId: bigint
    actor: Address
    claimHash: Hash
    claimURI: string
    txHash: Hash
    blockNumber: bigint
}

export interface ProvenanceGraph {
    roots: ProvenanceNode[]
    totalAssets: number
    totalDerivatives: number
    totalAttestations: number
    maxDepth: number
}

interface AssetCreatedEventArgs {
    assetId: bigint
    parentId: bigint
    actor: Address
    action: number
    recipeHash: Hash
    recipeURI: string
}

interface AssetAttestedEventArgs {
    assetId: bigint
    actor: Address
    claimHash: Hash
    claimURI: string
}

// Constants
const CHUNK_SIZE = 9000n // RPC limit is 10000, use 9000 for safety
const CONTRACT_DEPLOY_BLOCK = 0n // Start from genesis, will find events quickly

// Event definitions
const ASSET_CREATED_EVENT = {
    type: 'event' as const,
    name: 'AssetCreated',
    inputs: [
        { indexed: true, name: 'assetId', type: 'uint256' },
        { indexed: true, name: 'parentId', type: 'uint256' },
        { indexed: true, name: 'actor', type: 'address' },
        { indexed: false, name: 'action', type: 'uint8' },
        { indexed: false, name: 'recipeHash', type: 'bytes32' },
        { indexed: false, name: 'recipeURI', type: 'string' },
    ],
}

const ASSET_ATTESTED_EVENT = {
    type: 'event' as const,
    name: 'AssetAttested',
    inputs: [
        { indexed: true, name: 'assetId', type: 'uint256' },
        { indexed: true, name: 'actor', type: 'address' },
        { indexed: false, name: 'claimHash', type: 'bytes32' },
        { indexed: false, name: 'claimURI', type: 'string' },
    ],
}

// Fetch events in chunks to work around RPC limits
async function fetchLogsInChunks<T>(
    client: PublicClient,
    event: typeof ASSET_CREATED_EVENT | typeof ASSET_ATTESTED_EVENT,
    fromBlock: bigint,
    toBlock: bigint,
    parseLog: (log: { args: unknown; transactionHash: Hash | null; blockNumber: bigint }) => T
): Promise<T[]> {
    const results: T[] = []
    let currentFrom = fromBlock

    while (currentFrom <= toBlock) {
        const currentTo = currentFrom + CHUNK_SIZE > toBlock ? toBlock : currentFrom + CHUNK_SIZE

        try {
            const logs = await client.getLogs({
                address: PROVENANCE_REGISTRY_ADDRESS,
                event,
                fromBlock: currentFrom,
                toBlock: currentTo,
            })

            for (const log of logs) {
                results.push(parseLog({
                    args: log.args,
                    transactionHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                }))
            }
        } catch (error) {
            console.error(`Failed to fetch logs from ${currentFrom} to ${currentTo}:`, error)
            // Continue with next chunk
        }

        currentFrom = currentTo + 1n
    }

    return results
}

// Fetch events from the blockchain
export async function fetchAssetCreatedEvents(
    client: PublicClient,
    fromBlock?: bigint
): Promise<ProvenanceNode[]> {
    const currentBlock = await client.getBlockNumber()
    const startBlock = fromBlock ?? CONTRACT_DEPLOY_BLOCK

    const parseLog = (log: { args: unknown; transactionHash: Hash | null; blockNumber: bigint }): ProvenanceNode => {
        const args = log.args as unknown as AssetCreatedEventArgs
        return {
            assetId: args.assetId,
            parentId: args.parentId,
            actor: args.actor,
            action: args.action === 0 ? 'publish' : 'derive',
            recipeHash: args.recipeHash,
            recipeURI: args.recipeURI,
            txHash: log.transactionHash as Hash,
            blockNumber: log.blockNumber,
            children: [],
            attestations: [],
        }
    }

    return fetchLogsInChunks(
        client,
        ASSET_CREATED_EVENT,
        startBlock,
        currentBlock,
        parseLog
    )
}

export async function fetchAssetAttestedEvents(
    client: PublicClient,
    fromBlock?: bigint
): Promise<AttestationNode[]> {
    const currentBlock = await client.getBlockNumber()
    const startBlock = fromBlock ?? CONTRACT_DEPLOY_BLOCK

    const parseLog = (log: { args: unknown; transactionHash: Hash | null; blockNumber: bigint }): AttestationNode => {
        const args = log.args as unknown as AssetAttestedEventArgs
        return {
            assetId: args.assetId,
            actor: args.actor,
            claimHash: args.claimHash,
            claimURI: args.claimURI,
            txHash: log.transactionHash as Hash,
            blockNumber: log.blockNumber,
        }
    }

    return fetchLogsInChunks(
        client,
        ASSET_ATTESTED_EVENT,
        startBlock,
        currentBlock,
        parseLog
    )
}

// Build hierarchical graph from flat events
export function buildProvenanceGraph(
    assets: ProvenanceNode[],
    attestations: AttestationNode[]
): ProvenanceGraph {
    // Create a map for quick lookup
    const assetMap = new Map<string, ProvenanceNode>()

    // Index all assets by their ID
    for (const asset of assets) {
        assetMap.set(asset.assetId.toString(), { ...asset, children: [], attestations: [] })
    }

    // Attach attestations to assets
    for (const attestation of attestations) {
        const asset = assetMap.get(attestation.assetId.toString())
        if (asset) {
            asset.attestations.push(attestation)
        }
    }

    // Build parent-child relationships
    const roots: ProvenanceNode[] = []

    for (const asset of assetMap.values()) {
        if (asset.parentId === 0n) {
            // This is a root asset
            roots.push(asset)
        } else {
            // This is a derivative, find parent
            const parent = assetMap.get(asset.parentId.toString())
            if (parent) {
                parent.children.push(asset)
            }
        }
    }

    // Calculate stats
    const totalAssets = assets.length
    const totalDerivatives = assets.filter(a => a.action === 'derive').length
    const totalAttestations = attestations.length

    // Calculate max depth
    function getDepth(node: ProvenanceNode): number {
        if (node.children.length === 0) return 1
        return 1 + Math.max(...node.children.map(getDepth))
    }

    const maxDepth = roots.length > 0 ? Math.max(...roots.map(getDepth)) : 0

    return {
        roots,
        totalAssets,
        totalDerivatives,
        totalAttestations,
        maxDepth,
    }
}

// Helper to fetch and build in one call
export async function fetchProvenanceGraph(client: PublicClient): Promise<ProvenanceGraph> {
    const [assets, attestations] = await Promise.all([
        fetchAssetCreatedEvents(client),
        fetchAssetAttestedEvents(client),
    ])

    return buildProvenanceGraph(assets, attestations)
}
