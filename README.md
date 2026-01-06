# OpenAI API Deal Sizer

Standalone, deployable calculator for estimating **OpenAI API** costs from imperfect inputs. Supports pricing tiers (Batch/Flex/Standard/Priority), scenario ranges (low/base/high), and model comparisons.

## What’s Included

- Next.js (App Router) + TypeScript + Tailwind
- Route:
  - `/` – Calculator + “How to Use” section
- Pricing snapshots (no runtime scraping): `src/lib/pricing/{batch|flex|standard|priority}.json`
- Unit tests for estimator math: Vitest (`tests/estimator.test.ts`)

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

Other useful commands:

```bash
npm run test
npm run lint
npm run build
```

## Deploy To Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** the repo.
3. Deploy (no special config required).

## Updating Pricing

Pricing is versioned and loaded from:

- `src/lib/pricing/{batch|flex|standard|priority}.json`

To update:

1. Open the Standard pricing source:
   - https://platform.openai.com/docs/pricing?latest-pricing=standard
2. Update the relevant entries in `src/lib/pricing/standard.json`.
3. Bump `meta.lastUpdated` (ISO `YYYY-MM-DD`).

To update other tiers, use:

- https://platform.openai.com/docs/pricing?latest-pricing=priority
- https://platform.openai.com/docs/pricing?latest-pricing=flex
- https://platform.openai.com/docs/pricing?latest-pricing=batch

If a price is `null`, the UI will show “—” and may prompt for a custom override (per-image mode).

## Notes / Assumptions

- **Reasoning tokens are billed as output tokens.**
- Scenario multipliers apply to volume (not rates).
- Cached input % is only relevant for models with cached pricing.
