# CI/CD Commands — ITGD Mobile

## Build Flavors
| Flavor | Purpose | Base URL |
|---|---|---|
| `dev` | Local development | `https://api-dev.tvtoday.in` |
| `staging` | QA testing | `https://api-staging.tvtoday.in` |
| `prod` | Production release | `https://api.tvtoday.in` |

## Common Gradle Commands

### Build
```bash
# Debug APK (dev flavor)
./gradlew assembleDevDebug

# Release APK (staging)
./gradlew assembleStagingRelease

# Production release APK
./gradlew assembleProdRelease

# Production AAB (for Play Store)
./gradlew bundleProdRelease
```

### Test
```bash
# Unit tests
./gradlew test

# Instrumentation tests
./gradlew connectedAndroidTest

# Lint
./gradlew lint

# All checks
./gradlew check
```

### Clean
```bash
./gradlew clean
./gradlew clean assembleProdRelease   # clean + build
```

## Signing Config
- Keystore path: `~/.signing/itgd-mobile.jks` (local, never committed)
- Credentials via environment variables:
  - `KEYSTORE_PASSWORD`
  - `KEY_ALIAS`
  - `KEY_PASSWORD`

```kotlin
// build.gradle.kts
signingConfigs {
    create("release") {
        storeFile = file(System.getenv("KEYSTORE_PATH") ?: "../keystore/itgd.jks")
        storePassword = System.getenv("KEYSTORE_PASSWORD")
        keyAlias = System.getenv("KEY_ALIAS")
        keyPassword = System.getenv("KEY_PASSWORD")
    }
}
```

## CI Pipeline (GitHub Actions / Bitrise)
```yaml
# Key steps
- Run lint
- Run unit tests
- Assemble staging release
- Upload to Firebase App Distribution (staging)
- On tag push: bundle prod release → upload to Play Store internal track
```

## Version Bumping
- `versionCode` auto-incremented by CI (build number)
- `versionName` follows `MAJOR.MINOR.PATCH` — updated manually in `build.gradle.kts`
