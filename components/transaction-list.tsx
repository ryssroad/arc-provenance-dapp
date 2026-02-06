'use client'

import { ProvenanceNode, AttestationNode } from '@/lib/graph-builder'
import { getExplorerTxUrl, getExplorerAddressUrl } from '@/lib/contracts'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

interface TransactionListProps {
    nodes: ProvenanceNode[]
    attestations: AttestationNode[]
}

function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

type TransactionRow = {
    type: 'publish' | 'derive' | 'attest'
    txHash: string
    actor: string
    assetId: string
    blockNumber: bigint
}

export function TransactionList({ nodes, attestations }: TransactionListProps) {
    // Flatten all nodes recursively
    const flattenNodes = (nodeList: ProvenanceNode[]): ProvenanceNode[] => {
        const result: ProvenanceNode[] = []
        for (const node of nodeList) {
            result.push(node)
            if (node.children.length > 0) {
                result.push(...flattenNodes(node.children))
            }
        }
        return result
    }

    const allNodes = flattenNodes(nodes)

    // Combine all transactions
    const transactions: TransactionRow[] = [
        ...allNodes.map((n) => ({
            type: n.action as 'publish' | 'derive',
            txHash: n.txHash,
            actor: n.actor,
            assetId: n.assetId.toString(),
            blockNumber: n.blockNumber,
        })),
        ...attestations.map((a) => ({
            type: 'attest' as const,
            txHash: a.txHash,
            actor: a.actor,
            assetId: a.assetId.toString(),
            blockNumber: a.blockNumber,
        })),
    ]

    // Sort by block number descending
    transactions.sort((a, b) => Number(b.blockNumber - a.blockNumber))

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No transactions found
            </div>
        )
    }

    const getBadgeVariant = (type: string) => {
        switch (type) {
            case 'publish': return 'default'
            case 'derive': return 'secondary'
            case 'attest': return 'outline'
            default: return 'default'
        }
    }

    return (
        <div className="rounded-lg border border-border/30 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/30">
                        <TableHead className="w-24">Type</TableHead>
                        <TableHead>Asset ID</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Block</TableHead>
                        <TableHead className="text-right">Transaction</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.slice(0, 20).map((tx, idx) => (
                        <TableRow key={`${tx.txHash}-${idx}`} className="border-border/30">
                            <TableCell>
                                <Badge variant={getBadgeVariant(tx.type)} className="capitalize text-xs">
                                    {tx.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                                #{tx.assetId}
                            </TableCell>
                            <TableCell>
                                <a
                                    href={getExplorerAddressUrl(tx.actor)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-violet-400 hover:underline inline-flex items-center gap-1"
                                >
                                    {formatAddress(tx.actor)}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                                {tx.blockNumber.toString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <a
                                    href={getExplorerTxUrl(tx.txHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 justify-end"
                                >
                                    {formatAddress(tx.txHash)}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
