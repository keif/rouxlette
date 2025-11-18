# Repository Guidelines

## Project Structure & Module Organization
- Core app entry lives in `App.tsx`; navigation is defined under `navigation/`.
- UI is split into `components/` (shared widgets) and `screens/` (route-level views); styles that are reused sit in `AppStyles.ts`.
- Data/state helpers live in `context/` (global state), `hooks/`, `utils/` and `util/`, and `constants/`.
- API integrations (Yelp, Google geocoding) are under `api/`; assets live in `assets/`.
- Tests mirror the app under `__tests__/` with matching folder names (e.g., `components`, `screens`, `api`).

## Build, Test, and Development Commands
- `npm run start` — launch Expo dev server; use `npm run ios` / `npm run android` / `npm run web` for platform-specific simulators.
- `npm test` — run Jest (watch mode) with the Expo preset and `@testing-library/react-native`.
- `npm run lint:unsafe-logging` — check for disallowed console logging; runs automatically on `npm run precommit`.
- `npm run clean` — clear Metro/watchman caches if the packager behaves oddly.
- Log noise control: set `EXPO_PUBLIC_LOG_LEVEL=debug|info|warn|error|silent` (default `warn`) to tune Metro output.

## Coding Style & Naming Conventions
- TypeScript is strict; prefer typed props/params/returns, not `any`.
- Favor functional React components with hooks; keep effects in hooks or context actions.
- Components and screens: PascalCase file and export names (`BusinessCardModal.tsx`); utilities/hooks/constants: camelCase for functions/variables, SCREAMING_SNAKE_CASE for config constants.
- Use 2-space indentation and align with surrounding files; keep imports sorted by scope (libs, then internal modules).
- Match file-level formatting choices.

## Testing Guidelines
- Place specs next to their domain mirror in `__tests__/` using `*.test.ts` or `*.test.tsx`.
- Prefer `@testing-library/react-native` for interaction and rendering; use module mocks under `__tests__/mocks/` for APIs/env.
- Add focused coverage for reducers (`context/`), hooks, and screen/component behaviors; include regression cases for reported bugs.
- Run `npm test -- --runInBand` if flakiness appears in CI-like environments.

## Commit & Pull Request Guidelines
- Follow the existing Conventional Commit style (`feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`); keep subjects in the imperative.
- In PRs, include: summary of changes, verification steps (`npm run start`, `npm test`, platform/device used), and screenshots or screen recordings for UI changes.
- Link related issues/tasks when available and mention any lingering TODOs or follow-ups.

## Security & Configuration Tips
- API keys and secrets should stay outside the repo; load them via `react-native-dotenv` and ensure `.env` is gitignored.
- Never log sensitive values—use `npm run lint:unsafe-logging` before pushing to catch unsafe console output.
