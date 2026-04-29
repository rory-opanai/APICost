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

1. Open the official pricing source:
   - https://developers.openai.com/api/docs/pricing
2. Update the relevant entries in `src/lib/pricing/{standard,batch,flex,priority}.json`.
3. Bump `meta.lastUpdated` (ISO `YYYY-MM-DD`).
4. Run `npm run test && npm run lint && npm run build`.

The docs publish separate short-context and long-context rates for some GPT-5.5/GPT-5.4 family models. Keep the base model key on the short-context rate and use a `-long-context` key only when the source publishes a separate long-context rate.

If a price is `null`, the UI will show “—” and may prompt for a custom override (per-image mode).

## Notes / Assumptions

- **Reasoning tokens are billed as output tokens.**
- Scenario multipliers apply to volume (not rates).
- Cached input % is only relevant for models with cached pricing.
