# Техническое задание: ARC Provenance dApp

## 1. Общее описание проекта

Разработать веб-приложение для визуализации onchain графа происхождения NFT активов на Arc Network Testnet.

**Суть:** Пользователь подключает кошелек, вводит адрес NFT контракта, приложение отображает граф провенанса (происхождения) актива: кто создал оригинал, какие derivative были созданы, кто их attestовал (подтвердил).

**Граф провенанса:**
```
Root Asset (оригинал)
  └── Derivative #1 (производная работа)
        ├── Attestation (подтверждение от третьей стороны)
        └── Derivative #2
              └── Attestation
```

---

## 2. Технические требования

### 2.1 Стек технологий
- **Framework:** Next.js 14+ (App Router)
- **Язык:** TypeScript
- **Стилизация:** Tailwind CSS
- **UI компоненты:** shadcn/ui
- **Web3 интеграция:** 
  - RainbowKit (wallet connection)
  - wagmi v2 (React hooks для Ethereum)
  - viem v2 (TypeScript библиотека для работы с EVM)
- **Графы/визуализация:** recharts или react-flow
- **Иконки:** lucide-react

### 2.2 Arc Network параметры
```
Chain: Arc Testnet
Chain ID: 5042002
RPC: https://rpc.testnet.arc.network
Explorer: https://testnet.arcscan.app
Native Currency: USDC
```

---

## 3. Функциональные требования (MVP)

### 3.1 Обязательные страницы

**Страница 1: Главная (`/`)**
- Wallet Connect кнопка (RainbowKit)
- Поле ввода адреса NFT контракта (Ethereum address validation)
- Кнопка "Analyze" → переход на `/nft/[address]`
- Краткое описание проекта
- Примеры адресов для тестирования (можно хардкодить фейковые)

**Страница 2: NFT Analysis (`/nft/[address]`)**
- Отображение адреса NFT
- Визуализация графа провенанса
- Метаинформация:
  - Количество derivative
  - Количество attestations
  - Глубина дерева (max depth)
  - Root assets (оригиналы)
- Список всех транзакций со ссылками на explorer

### 3.2 Интеграция с контрактом

**Важно:** Контракт уже развернут, нужно только читать события.

**События (примерная структура):**
```solidity
event AssetCreated(address indexed nft, uint256 indexed tokenId, address creator);
event DerivativeCreated(address indexed parent, address indexed child, uint256 indexed tokenId);
event Attested(address indexed nft, uint256 indexed tokenId, address attester, string metadata);
```

**Задача:**
1. Получить все события через `eth_getLogs` (viem)
2. Построить граф в памяти (JavaScript объект/граф)
3. Визуализировать дерево

**Минимальный подход для MVP:**
- Можно использовать публичный RPC Arc testnet
- Сканировать последние N блоков (например, 10000)
- Кэшировать в localStorage/state

---

## 4. UI/UX требования

### 4.1 Дизайн
- **Стиль:** Minimalist, профессиональный (как Vercel, Stripe)
- **Цветовая схема:** Dark mode с акцентами
- **Компоненты shadcn/ui:**
  - `Button` (для wallet connect, analyze)
  - `Input` (для address input)
  - `Card` (для метрик и графа)
  - `Badge` (для типов: root, derivative, attestation)
  - `Table` (для списка транзакций)

### 4.2 Граф провенанса
- **Вариант 1 (проще):** Tree view с boxes и стрелками (react-flow)
- **Вариант 2 (базовый):** Вертикальный список с отступами
- **Обязательно показывать:**
  - Тип ноды (Root/Derivative/Attestation) — разными цветами
  - Адрес создателя (сокращенный: `0x1234...5678`)
  - TokenID (если есть)
  - Ссылка на транзакцию в explorer

### 4.3 Адаптивность
- Desktop first (можно не оптимизировать для mobile в MVP)

---

## 5. Структура проекта

```
arc-provenance-ui/
├── app/
│   ├── layout.tsx           # Root layout с RainbowKit provider
│   ├── page.tsx             # Главная страница
│   ├── nft/
│   │   └── [address]/
│   │       └── page.tsx     # Страница анализа NFT
│   └── providers.tsx        # Web3 providers (wagmi, RainbowKit)
├── components/
│   ├── wallet-connect.tsx   # Кнопка подключения кошелька
│   ├── nft-search.tsx       # Форма поиска по адресу
│   ├── provenance-graph.tsx # Компонент графа
│   ├── transaction-list.tsx # Список транзакций
│   └── ui/                  # shadcn/ui компоненты
├── lib/
│   ├── chains.ts            # Arc testnet config
│   ├── contracts.ts         # ABI контракта провенанса (если нужен)
│   ├── graph-builder.ts     # Логика построения графа из событий
│   └── utils.ts             # Helpers (address formatting и т.д.)
├── public/
└── package.json
```

---

## 6. Конкретные задачи для реализации

### Этап 1: Базовая настройка
1. Создать Next.js проект с TypeScript и Tailwind
2. Установить зависимости: RainbowKit, wagmi, viem, shadcn/ui
3. Настроить Arc Testnet в wagmi config
4. Инициализировать shadcn/ui
5. Создать базовый layout с dark mode

### Этап 2: Wallet & Navigation
1. Интегрировать RainbowKit в layout
2. Создать главную страницу с полем ввода адреса NFT
3. Валидация Ethereum адреса
4. Роутинг на `/nft/[address]`

### Этап 3: Интеграция с блокчейном
1. Создать функцию для получения событий через viem `getLogs`
2. Создать builder для построения графа из событий (JS объект)
3. Типизировать структуру графа в TypeScript

### Этап 4: Визуализация
1. Компонент для отображения дерева провенанса
2. Метрики: количество assets, attestations, глубина дерева
3. Таблица транзакций со ссылками на explorer
4. Состояния загрузки/ошибок

### Этап 5: Polish
1. Улучшить UI (spacing, colors, animations)
2. Добавить примеры адресов на главную
3. README с инструкцией запуска

---

## 7. Данные для тестирования

**Для MVP можно использовать mock данные:**

```typescript
// Пример структуры графа
const mockGraph = {
  roots: [
    {
      id: "0x123...abc_1",
      address: "0x123...abc",
      tokenId: 1,
      creator: "0xArtist...123",
      type: "root",
      derivatives: [
        {
          id: "0x456...def_2",
          tokenId: 2,
          creator: "0xStudio...456",
          type: "derivative",
          attestations: [
            {
              id: "att_1",
              attester: "0xCollector...789",
              metadata: "Verified authentic"
            }
          ]
        }
      ]
    }
  ]
};
```

---

## 8. Критерии приемки MVP

✅ Приложение запускается локально (`npm run dev`)  
✅ Работает wallet connect через RainbowKit  
✅ Можно ввести адрес и перейти на страницу анализа  
✅ Отображается граф (хотя бы в виде списка/дерева)  
✅ Метрики подсчитываются корректно  
✅ UI выглядит профессионально (shadcn/ui используется)  
✅ Dark mode работает  
✅ Ссылки на explorer открываются корректно  

---

## 9. Что НЕ нужно в MVP

❌ Upload документов (это Phase 2)  
❌ Deploy NFT контрактов из UI  
❌ Редактирование/создание attestations  
❌ Backend/database  
❌ Аутентификация/пользователи  
❌ Mobile optimization  
❌ Поддержка mainnet  

---

## 10. Референсы дизайна

- **Etherscan:** таблицы транзакций
- **Uniswap:** wallet connect flow
- **Vercel Dashboard:** общий стиль, карточки
- **Dune Analytics:** графы и метрики

---

## 11. Дополнительные заметки

- Если нет реального контракта с событиями → используй mock данные для демонстрации UI
- Для графа можно начать с простого вертикального списка с отступами (не обязательно сложный flow-граф)
- Arc testnet RPC может быть медленным → добавь индикаторы загрузки
- Все адреса контрактов можно хардкодить в `lib/contracts.ts` для MVP

---

## 12. Примерный код для старта

### Arc Testnet config (`lib/chains.ts`)
```typescript
import { Chain } from 'wagmi/chains'

export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'ARC',
    symbol: 'ARC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { 
      name: 'ArcScan', 
      url: 'https://testnet.arcscan.app' 
    },
  },
} as const satisfies Chain
```

### RainbowKit setup (`app/providers.tsx`)
```typescript
'use client'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { arcTestnet } from '@/lib/chains'

const config = getDefaultConfig({
  appName: 'ARC Provenance',
  projectId: 'YOUR_WALLET_CONNECT_ID', // получить на walletconnect.com
  chains: [arcTestnet],
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

---

**Конец ТЗ. Начинай с Этапа 1, следуй структуре проекта, используй shadcn/ui для всех UI компонентов.**