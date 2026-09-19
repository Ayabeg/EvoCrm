# Mobile CI/CD

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript  
**SUPERSEDED:** Xcode Cloud / dual Gradle+xcodebuild ownership as the daily path (PR #235).  
Linux CI is the required gate. Local Xcode is **not** required for normal development.

## Current pipeline

[`.github/workflows/mobile.yml`](../../.github/workflows/mobile.yml) runs on `ubuntu-latest` when `mobile/**` or `docs/mobile/**` change:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `expo config --type public`
6. `expo-doctor`
7. `expo export --platform android` (JS bundle validation — not a store binary)

The existing Laravel [`.github/workflows/tests.yml`](../../.github/workflows/tests.yml) remains the API source of truth.

M07 uses the same Linux job (`Expo M07 checks`). EAS binaries remain **NOT EXECUTED** without `EXPO_TOKEN`.

## EAS (prepared, not executed in M06R or M07)

[`mobile/eas.json`](../../mobile/eas.json) defines:

| Profile | Intent |
|---|---|
| `development` | Development client, internal, Android without credentials, iOS simulator |
| `preview` | Internal APK / iOS simulator |
| `production` | Future store binaries — **no App Store / Play credentials configured** |

Do not run `eas submit` or store credential setup in M06R.

## Secrets

GitHub Actions needs no mobile production secrets today. Future EAS:

- `EXPO_TOKEN` in GitHub Secrets
- iOS / Android signing via EAS (not committed)

Never put Laravel or provider credentials in mobile CI.

## Versioning

App version (`0.6.0` foundation) is independent of Laravel deploy. Block a production app release if required `/api/v1` gaps are not deployed.
