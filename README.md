# Satch

**Create drawings for 100 SATS and sell them to the highest bidder — a Bitcoin Lightning‑powered art marketplace.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![Fabric.js](https://img.shields.io/badge/Fabric.js-7-orange)](http://fabricjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

Satch is a full-stack web application where artists can:

1. **Draw** — Use the built-in canvas editor (brushes, shapes, text, colors)
2. **Mint** — Pay 100 SATS via Lightning Network to mint a drawing on the platform
3. **Sell** — Start an English auction and let bidders compete for the artwork

Built with Next.js 16 (App Router), Fabric.js, and Prisma. Payments use a mock Lightning Network that can be swapped for real LNbits.

---

## Features

- **Drawing Canvas** — Freehand brush, eraser, rectangle, ellipse, line, text, undo/redo, color picker, size control
- **Minting** — Pay 100 SATS to mint a drawing (mock Lightning auto-confirms in ~8s)
- **English Auctions** — Create auctions with custom starting bid and duration, place bids with Lightning payments
- **Bid History** — Live-refreshing bid list on each auction page
- **Marketplace** — Browse active auctions and recent minted drawings
- **User Profiles** — View artist's drawings, active auctions, and won items
- **Wallet** — Transaction history (mints, bids, wins, payouts)
- **Authentication** — Email/password registration and login via Auth.js
- **Dark Theme** — Built with Tailwind CSS dark design, amber accents

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma 7 (upgradeable to PostgreSQL) |
| Canvas | Fabric.js 7 |
| Auth | Auth.js v5 (Credentials provider) |
| Payments | Mock Lightning Network (swap for LNbits) |
| Styling | Tailwind CSS 4 |

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm

### Installation

```bash
git clone https://github.com/yourusername/satch.git
cd satch
npm install
```

### Database Setup

```bash
npx prisma db push
```

### Seed Data (optional)

```bash
npm run db:seed
```

Test accounts:
- `alice@test.com` / `password123`
- `bob@test.com` / `password123`

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

---

## How It Works

### 1. Create a Drawing

Open the `/draw` page and use the canvas toolbar:
- **Brush** — Freehand drawing with customizable color and size
- **Eraser** — Erase by painting over (uses background color)
- **Shapes** — Rectangle, circle, line with current color
- **Text** — Add editable text boxes
- **Undo/Redo** — Full history support (50 states)

### 2. Mint for 100 SATS

Click "Mint for 100 SATS" to create a Lightning invoice. During development, the mock payment auto-confirms after ~8 seconds. Once paid, the drawing is saved to your collection.

### 3. Start an Auction

On your minted drawing page, click "Start Auction". Set a starting bid and duration (1 hour to 7 days). The auction becomes visible on the marketplace.

### 4. Place Bids

Browse active auctions on `/explore`. Each bid requires a Lightning payment. Outbid users get noted for refund (mock). When the auction ends, the highest bidder wins.

---

## Project Structure

```
satch/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── explore/           # Marketplace browse
│   │   ├── draw/              # Drawing canvas + mint
│   │   ├── drawing/[id]/      # Drawing detail
│   │   ├── auction/
│   │   │   ├── [id]/          # Auction + bidding
│   │   │   └── create/[id]/   # Auction creation
│   │   ├── profile/[id]/      # User profile
│   │   ├── wallet/            # Transaction history
│   │   ├── auth/              # Login/Register
│   │   └── api/               # REST API routes
│   ├── components/
│   │   ├── canvas/            # Fabric.js editor + toolbar
│   │   ├── auction/           # Bid panel, timer, history
│   │   └── shared/            # Navbar, layout
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # Auth.js config
│   │   ├── lightning.ts       # Mock LN service
│   │   └── utils.ts           # Helpers
│   └── types/                 # TypeScript declarations
├── .env.example
└── package.json
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in (via Auth.js) |
| GET | `/api/drawings` | List drawings |
| POST | `/api/drawings` | Create drawing (minted) |
| GET | `/api/drawings/[id]` | Get drawing detail |
| DELETE | `/api/drawings/[id]` | Delete drawing |
| POST | `/api/payments/mint-invoice` | Create 100 SATS invoice |
| GET | `/api/payments/check` | Check payment status |
| GET | `/api/auctions` | List auctions |
| POST | `/api/auctions` | Create auction |
| GET | `/api/auctions/[id]` | Get auction with bids |
| POST | `/api/auctions/[id]/bid` | Place bid |
| GET | `/api/wallet/transactions` | User transaction history |

---

## Switching to Real Lightning Payments

The mock payment system is in `src/lib/lightning.ts`. To connect real Lightning:

1. Install and run [LNbits](https://github.com/lnbits/lnbits) (Docker)
2. Set `MOCK_LIGHTNING=false` in `.env`
3. Replace the function bodies in `lightning.ts` with LNbits API calls:

```typescript
// Example LNbits integration
const LNBITS_URL = process.env.LNBITS_URL;
const LNBITS_API_KEY = process.env.LNBITS_API_KEY;

export async function createInvoice(amountSats: number, memo?: string) {
  const res = await fetch(`${LNBITS_URL}/api/v1/payments`, {
    method: "POST",
    headers: {
      "X-Api-Key": LNBITS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ out: false, amount: amountSats, memo }),
  });
  return res.json();
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `AUTH_SECRET` | - | Auth.js secret (change in production) |
| `AUTH_URL` | `http://localhost:3000` | App URL |
| `MOCK_LIGHTNING` | `true` | Use mock payment system |
| `PLATFORM_FEE_PERCENT` | `5` | Platform fee on auction sales |
| `MINT_COST_SATS` | `100` | Cost to mint a drawing |


Warning: This shit was totally vibe coded

---

## License

MIT

---

## Tags

`satch` `bitcoin` `lightning-network` `art-marketplace` `nft-alternative` `drawing` `canvas` `fabricjs` `nextjs` `prisma` `sqlite` `auction` `typescript` `tailwindcss`
