import { Address } from 'viem'

export const PROVENANCE_REGISTRY_ADDRESS: Address = '0x21473cd6d832a3d6BC933a2f59DAE7311276132C'

export const PROVENANCE_REGISTRY_ABI = [
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'assetId', type: 'uint256' },
            { indexed: true, name: 'parentId', type: 'uint256' },
            { indexed: true, name: 'actor', type: 'address' },
            { indexed: false, name: 'action', type: 'uint8' },
            { indexed: false, name: 'recipeHash', type: 'bytes32' },
            { indexed: false, name: 'recipeURI', type: 'string' },
        ],
        name: 'AssetCreated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'assetId', type: 'uint256' },
            { indexed: true, name: 'actor', type: 'address' },
            { indexed: false, name: 'claimHash', type: 'bytes32' },
            { indexed: false, name: 'claimURI', type: 'string' },
        ],
        name: 'AssetAttested',
        type: 'event',
    },
    {
        inputs: [],
        name: 'nextAssetId',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

export const EXPLORER_URL = 'https://testnet.arcscan.app'

export function getExplorerTxUrl(txHash: string): string {
    return `${EXPLORER_URL}/tx/${txHash}`
}

export function getExplorerAddressUrl(address: string): string {
    return `${EXPLORER_URL}/address/${address}`
}
