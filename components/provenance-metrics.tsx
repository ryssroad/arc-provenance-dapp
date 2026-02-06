'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProvenanceGraph } from '@/lib/graph-builder'
import { FileText, GitBranch, CheckCircle, Layers } from 'lucide-react'

interface ProvenanceMetricsProps {
    graph: ProvenanceGraph
    isLoading?: boolean
}

export function ProvenanceMetrics({ graph, isLoading }: ProvenanceMetricsProps) {
    const metrics = [
        {
            title: 'Total Assets',
            value: graph.totalAssets,
            icon: FileText,
            description: 'Root + Derivatives',
            color: 'text-violet-400',
        },
        {
            title: 'Derivatives',
            value: graph.totalDerivatives,
            icon: GitBranch,
            description: 'Derived works',
            color: 'text-blue-400',
        },
        {
            title: 'Attestations',
            value: graph.totalAttestations,
            icon: CheckCircle,
            description: 'Verifications',
            color: 'text-emerald-400',
        },
        {
            title: 'Max Depth',
            value: graph.maxDepth,
            icon: Layers,
            description: 'Tree depth',
            color: 'text-amber-400',
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric) => (
                <Card key={metric.title} className="bg-card/50 backdrop-blur border-border/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {metric.title}
                        </CardTitle>
                        <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{isLoading ? '—' : metric.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
