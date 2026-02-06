'use client'

import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with WalletConnect localStorage
const ProvidersInner = dynamic(
    () => import('./providers-inner').then((mod) => mod.ProvidersInner),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        ),
    }
)

export function Providers({ children }: { children: React.ReactNode }) {
    return <ProvidersInner>{children}</ProvidersInner>
}
