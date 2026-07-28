/**
 * EAS build hook — runs automatically as `eas-build-pre-install`.
 *
 * react-native-dotenv inlines `@env` imports from a `.env` FILE at build time,
 * but the real `.env` is gitignored and never reaches the EAS cloud builder.
 * This materializes `.env` from EAS environment variables so the build resolves
 * @env the same way local/CI does.
 *
 * SET THESE AS EAS ENVIRONMENT VARIABLES (visibility: Secret) on the build
 * profile you use (e.g. production):
 *   YELP_API_KEY, GOOGLE_API_KEY, DEV_USE_MOCK
 *
 *   eas env:create --scope project --name YELP_API_KEY   --value "..." --visibility secret
 *   eas env:create --scope project --name GOOGLE_API_KEY --value "..." --visibility secret
 *   eas env:create --scope project --name DEV_USE_MOCK   --value "false"
 */
const fs = require('fs');

const KEYS = ['YELP_API_KEY', 'GOOGLE_API_KEY', 'DEV_USE_MOCK'];
const missing = KEYS.filter((k) => !process.env[k]);
if (missing.length) {
  // Warn but do not fail: react-native-dotenv (allowUndefined:false) will throw
  // during bundling if a referenced key is truly missing, which surfaces clearly.
  console.warn(`[eas-write-env] warning: missing EAS env vars: ${missing.join(', ')}`);
}

const lines = KEYS.map((k) => `${k}=${process.env[k] ?? ''}`);
fs.writeFileSync('.env', lines.join('\n') + '\n');
console.log(`[eas-write-env] wrote .env with ${KEYS.length} keys (${KEYS.length - missing.length} present)`);
