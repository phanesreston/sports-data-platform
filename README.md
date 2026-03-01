# WeLikeSportz

A sports odds comparison platform that helps users make smarter betting decisions by surfacing the best available odds across 40+ sports and 80+ bookmakers.

## Vision

Real-time odds aggregation + statistical insights — all in one clean, fast interface.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Odds Data | [The Odds API](https://the-odds-api.com/) |
| Sports Stats | [API-Sports](https://api-sports.io/) |
| Horse Racing | [The Racing API](https://theracingapi.com/) |
| Stats Data | Sample data (v1) |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.local.example` to `.env.local` and add your API key:

```bash
cp .env.local.example .env.local
```

```
ODDS_API_KEY=your_key_from_the_odds_api
API_SPORTS_KEY=your_key_from_api_sports_io
RACING_API_KEY=your_key_from_theracingapi
```

## Project Structure

```
app/              # Next.js App Router pages + layout
components/       # UI components
  Header.tsx      # Sticky nav with WeLikeSportz branding
  Hero.tsx        # Landing hero section
  SportFilter.tsx # Filter tabs by sport
  OddsCard.tsx    # Individual event odds card
  OddsFeed.tsx    # Filterable odds grid
  Footer.tsx      # Site footer
data/
  sampleOdds.ts   # Sample odds data + helper functions
```

## Roadmap

- [x] V1: Homepage with live odds feed + sport filter
- [ ] V2: Live Odds API integration (The Odds API)
- [ ] V3: Sports stats integration (API-Sports)
- [ ] V4: Horse racing — racecards, results, form & analysis (The Racing API)
- [ ] V5: Statistical insights & value indicators
- [ ] V6: User accounts, saved events, alerts
