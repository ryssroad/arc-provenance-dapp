'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import {
    RainbowKitProvider,
    connectorsForWallets,
    darkTheme
} from '@rainbow-me/rainbowkit'
import {
    metaMaskWallet,
    rabbyWallet,
    walletConnectWallet,
    coinbaseWallet,
    injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'
import '@rainbow-me/rainbowkit/styles.css'
import { arcTestnet } from '@/lib/chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo'

const connectors = connectorsForWallets(
    [
        {
            groupName: 'Popular',
            wallets: [
                rabbyWallet,
                metaMaskWallet,
                walletConnectWallet,
                coinbaseWallet,
                injectedWallet,
            ],
        },
    ],
    {
        appName: 'ARC Provenance',
        projectId,
    }
)

const config = createConfig({
    connectors,
    chains: [arcTestnet],
    transports: {
        [arcTestnet.id]: http(),
    },
    ssr: false,
})

const queryClient = new QueryClient()

export function ProvidersInner({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: '#7c3aed',
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                    })}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
