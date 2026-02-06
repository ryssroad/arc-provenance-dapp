# Contracts

Smart contracts for ARC Provenance dApp.

## Setup

```bash
cd contracts
npm install
```

## Configuration

Create `.env.local` in the parent directory with:

```env
PRIVATE_KEY=your_private_key_here
```

## Compile

```bash
npm run compile
```

## Deploy

```bash
npm run deploy
```

## Contracts

### DigitalObjectNFT

ERC-721 NFT with dynamic stats for provenance tracking.

- `mint(to, seedURI)` - Mint a new token
- `updateStats(tokenId, forksOut, forksIn, attestCount, score, ref)` - Update stats (owner only)

### ProvenanceRegistry

Registry for tracking provenance relationships.

- `derive(nft, parentId, childId, ref)` - Create a derivative relationship
- `attest(nft, tokenId, kind, ref, payloadHash)` - Create an attestation
- `deriveBatch(...)` / `attestBatch(...)` - Batch operations

#### Attestation Kinds

- `1` = SOURCE (origin/created)
- `2` = QUALITY
- `3` = REVIEW
- `4` = LICENSE
