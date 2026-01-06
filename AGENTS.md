# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js (App Router) app. Keep additions aligned to the existing layout:

- `src/app/`: routes and layout (`src/app/page.tsx`, `src/app/layout.tsx`)
- `src/components/`: UI components (calculator in `src/components/home/`, primitives in `src/components/ui/`)
- `src/lib/`: pure logic + helpers
  - `src/lib/estimate/`: estimator math + presets
  - `src/lib/state/queryState.ts`: shareable URL state encoding/decoding
  - `src/lib/pricing/{batch|flex|standard|priority}.json`: versioned pricing snapshots (no runtime fetch)
- `public/howto/`: original SVG illustrations used by the “How to Use” section
- `tests/`: Vitest unit tests (e.g. `tests/estimator.test.ts`)

If you add a new top-level directory, document it here with a one-line purpose.

## Build, Test, and Development Commands

From repo root:

- `npm run dev`: start local dev server (http://localhost:3000)
- `npm run build`: production build (CI-equivalent)
- `npm run lint`: Next.js ESLint rules
- `npm run test`: run unit tests (Vitest)
- `npm run typecheck`: strict TypeScript check (no emit)

## Coding Style & Naming Conventions

- TypeScript `strict` is enabled; avoid `any` and validate inputs (Zod) at boundaries.
- Tailwind for styling; prefer small, reusable primitives in `src/components/ui/`.
- Naming: files/dirs `kebab-case` where practical; React components `PascalCase`.

## Testing Guidelines

- Add/update tests for estimator changes in `tests/estimator.test.ts`.
- Prefer testing pure functions in `src/lib/estimate/` (no DOM needed).

## Commit & Pull Request Guidelines

- Commit messages: use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`). If/when existing history establishes a different convention, follow that.
- PRs: include (1) what/why, (2) how to verify (exact commands), (3) config or data assumptions, and (4) screenshots for any user-facing output.

## Pricing Updates

- Update the selected tier JSON in `src/lib/pricing/` and bump `meta.lastUpdated` (`YYYY-MM-DD`).
- Keep model keys stable when possible (they power UI selections and share links).
- Note: reasoning tokens are billed as output tokens.

## Security & Configuration Tips

- Never commit secrets. Use environment variables and provide `.env.example` for required keys with safe defaults.
