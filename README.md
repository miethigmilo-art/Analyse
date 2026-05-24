# Helix Stocks — AI-Powered Stock Analysis

A Bloomberg/TradingView-grade stock analysis platform built with Next.js 15, TypeScript, and AI.

## Features

- **Live Stock Data** via Finnhub, Alpha Vantage, Polygon.io
- **AI Analysis** (OpenAI GPT-4o-mini): Strong Buy / Buy / Hold / Sell / Strong Sell
- **Price Charts** with interactive range selector (1W / 1M / 3M / 6M / 1Y)
- **Insider Trading** data from SEC filings
- **Analyst Consensus** — real-time ratings aggregation
- **Trading 212 Integration** — live portfolio sync
- **AI Recommendations** — Trending, Undervalued, High Growth, Hedge Fund Favs, AI Picks
- **News Panel** with sentiment
- **Redis Caching** — fast repeat loads

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in your API keys

# 3. Set up database
npm run db:push

# 4. Run development server
npm run dev
```

Open http://localhost:3000

## API Keys Required

| Service | Where to get | Free tier |
|---|---|---|
| Finnhub | https://finnhub.io | 60 calls/min |
| Alpha Vantage | https://alphavantage.co | 25 calls/day |
| Polygon.io | https://polygon.io | Delayed data |
| OpenAI | https://platform.openai.com | Pay-per-use |
| Trading 212 | App → Settings → API | Live account needed |

## Deploy to Vercel

```bash
npx vercel deploy
```

Add all environment variables in the Vercel dashboard.

## Deploy to Railway

1. Push to GitHub
2. Connect repo in Railway
3. Add PostgreSQL + Redis plugins
4. Set environment variables
5. Deploy

## Project Structure

```
helix-stocks/
├── app/
│   ├── api/
│   │   ├── stocks/      # Quote + historical data
│   │   ├── analyze/     # AI analysis endpoint
│   │   ├── search/      # Ticker search
│   │   ├── recommendations/ # Curated stock lists
│   │   └── t212/        # Trading 212 proxy
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx         # Main dashboard
├── components/
│   ├── layout/          # SearchBar, Sidebar, Ticker
│   ├── stock/           # StockCard, StockDetail, AIRatingCard, etc.
│   └── charts/          # PriceChart (Recharts)
├── lib/
│   ├── api/stocks.ts    # Data aggregator (Finnhub + AV + Polygon)
│   ├── ai/analyze.ts    # OpenAI analysis engine
│   ├── db.ts            # Prisma client
│   └── redis.ts         # Redis cache
├── prisma/
│   └── schema.prisma    # DB schema
├── vercel.json
└── railway.json
```
