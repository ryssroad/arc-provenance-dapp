# ARC Provenance dApp

Веб-приложение для визуализации onchain графа происхождения NFT активов на Arc Network Testnet.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск dev server
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000) в браузере.

## 📦 Стек технологий

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Web3:** RainbowKit + wagmi v2 + viem v2
- **Icons:** lucide-react

## 🌐 Arc Network

```
Chain: Arc Testnet
Chain ID: 5042002
RPC: https://rpc.testnet.arc.network
Explorer: https://testnet.arcscan.app
```

## 📋 Контракт ProvenanceRegistry

**Address:** `0x21473cd6d832a3d6BC933a2f59DAE7311276132C`

### События

```solidity
event AssetCreated(
    uint256 indexed assetId,
    uint256 indexed parentId,
    address indexed actor,
    uint8 action,        // 0 = publish (root), 1 = derive
    bytes32 recipeHash,
    string recipeURI
);

event AssetAttested(
    uint256 indexed assetId,
    address indexed actor,
    bytes32 claimHash,
    string claimURI
);
```

## 🏗️ Структура проекта

```
arc-provenance-dapp/
├── app/
│   ├── layout.tsx           # Root layout с Providers
│   ├── page.tsx             # Главная страница
│   ├── providers.tsx        # Dynamic import wrapper
│   ├── providers-inner.tsx  # Web3 providers
│   └── nft/
│       └── [address]/
│           └── page.tsx     # Страница анализа
├── components/
│   ├── wallet-connect.tsx   # RainbowKit кнопка
│   ├── nft-search.tsx       # Форма поиска
│   ├── provenance-graph.tsx # Tree view графа
│   ├── provenance-metrics.tsx # Метрики
│   ├── transaction-list.tsx # Список транзакций
│   └── ui/                  # shadcn/ui компоненты
├── lib/
│   ├── chains.ts            # Arc Testnet config
│   ├── contracts.ts         # ABI контракта
│   └── graph-builder.ts     # Построение графа
└── package.json
```

## 🔑 Конфигурация

Для production создайте `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

Получить Project ID: [WalletConnect Cloud](https://cloud.walletconnect.com/)

## 📄 Лицензия

MIT
