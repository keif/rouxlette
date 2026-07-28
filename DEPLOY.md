# Deploying Rouxlette

Rouxlette ships through **EAS** (Expo Application Services). This covers the first
iOS / TestFlight release.

## One-time setup

1. **Apple Developer Program** membership ($99/yr) — required for TestFlight/App Store.
2. `eas login` — sign in to your Expo account (`npx eas-cli` if `eas` isn't global).
3. `eas init` — links this repo to an Expo project and writes `extra.eas.projectId`
   into `app.json`. Run once.

## Secrets (Yelp / Google API keys)

The app reads `YELP_API_KEY`, `GOOGLE_API_KEY`, `DEV_USE_MOCK` via `@env`
(react-native-dotenv) from a **gitignored `.env`**. EAS cloud builders don't have
your local `.env`, so register them as EAS environment variables once:

```
eas env:create --scope project --name YELP_API_KEY   --value "<key>"  --visibility secret
eas env:create --scope project --name GOOGLE_API_KEY --value "<key>"  --visibility secret
eas env:create --scope project --name DEV_USE_MOCK   --value "false"
```

The `eas-build-pre-install` hook (`scripts/eas-write-env.js`) writes these into a
`.env` on the builder so react-native-dotenv can inline them at build time.

## Build + submit to TestFlight

```
eas build  --platform ios --profile production
eas submit --platform ios --latest
```

`eas submit` uploads to App Store Connect; the build shows up in **TestFlight**
after Apple processes it (usually minutes). Add testers in
App Store Connect → TestFlight.

## Versioning

`eas.json` uses `appVersionSource: remote` + `autoIncrement`, so EAS manages the iOS
`buildNumber` for you. Bump the marketing `version` in `app.json` for user-facing
releases.

## Bundle identifier

`com.fullybakedlabs.rouxlette` (iOS + Android). It transfers with the app if you
later move from a personal to an organization Apple account.

## Follow-ups (not blocking a first build)

- **Splash/icon background** is still `#1B5E20` (old green) in `app.json`; update to
  the Supper Club espresso `#1A1013` (and regenerate the splash asset) to match the app.
- **OTA updates:** add `expo-updates` + a `runtimeVersion` to ship JS-only changes via
  `eas update` without a store review.
- **Android:** the same profiles build a `.aab`; add a Play Console account + `eas submit -p android` when ready.
