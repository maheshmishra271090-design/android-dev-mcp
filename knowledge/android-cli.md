# Android CLI Integration — android-dev-mcp

## What is Android CLI?
Android CLI (`android`) is Google's official command-line interface for agent-first Android development.
It provides environment setup, project scaffolding, virtual device management, SDK management,
app deployment, UI inspection, and Android Studio integration — all callable from Claude Code via this MCP.

## Install Android CLI
```bash
# Download (Mac/Linux)
curl -fsSL https://dl.google.com/android/android-cli/install.sh | bash

# Update to latest
android update

# Verify
android --version

# Set up for agents (installs android-cli skill)
android init
```

## Prerequisites
- Android Studio Quail 2 Canary 1+ (for studio commands)
- Gemini in Android Studio enabled + signed in
- Android SDK installed and ANDROID_HOME set

---

## Command Reference

### Project Setup
```bash
# Scaffold new project from template
android create --output=./MyApp empty-activity-agp-9
android create list                          # see all templates

# Describe existing project (outputs JSON with build targets + APK paths)
android describe --project_dir=./MyApp
```

### SDK Management
```bash
# Install packages
android sdk install platforms/android-35 build-tools/35.0.0

# List installed + available
android sdk list platforms/

# Update all
android sdk update

# Remove
android sdk remove build-tools/34.0.0
```

### Virtual Device Management
```bash
android emulator create --profile=medium_phone
android emulator list
android emulator start medium_phone
android emulator stop emulator-5554
```

### Deploy APK
```bash
# Single APK
android run --apks=app/build/outputs/apk/debug/app-debug.apk

# Multiple APKs (splits)
android run --apks=base.apk,density-hdpi.apk,lang-en.apk

# Specific device
android run --apks=app-debug.apk --device=emulator-5554

# Debug mode
android run --apks=app-debug.apk --debug
```

### UI Inspection (Agent-Optimized)
```bash
# Full layout tree as JSON
android layout --pretty --output=./layout.json

# Only changed elements since last snapshot (efficient for diffs)
android layout --diff

# Screenshot with labeled bounding boxes on all UI elements
android screen capture --output=ui.png --annotate

# Translate labeled element → screen coordinates
android screen resolve --screenshot=ui.png --string="input tap #5"
# Returns: input tap 500 1000
```

### Android Studio Integration (Preview)
```bash
# Check Studio instances
android studio check

# Lint a Kotlin/Java file using IDE engine
android studio analyze-file app/src/main/java/com/example/PlayerScreen.kt

# Find declaration of any symbol
android studio find-declaration --short HotelDetailScreen

# Find all usages of a symbol
android studio find-usages --short PlayerViewModel

# Render @Preview composable → PNG + semantics JSON
android studio render-compose-preview \
  --output-image-file=preview.png \
  --print-semantics \
  app/src/main/java/com/example/ui/PlayerScreen.kt \
  PlayerScreenPreview

# Live dependency version lookup (Google Maven)
android studio version-lookup agp kotlin compose media3 androidx.hilt:hilt-navigation-compose
```

### Knowledge Base
```bash
android docs search 'improve app startup time'
android docs fetch kb://android/topic/performance/overview
```

### Skills Management
```bash
android skills list --long
android skills add --all                     # install all Google skills
android skills add --skill edge-to-edge      # specific skill
android skills find 'performance'
android skills remove --skill edge-to-edge
```

---

## Android Skills Available (Google Official)

| Skill | What it does |
|---|---|
| `edge-to-edge` | Modernize UI to draw behind system bars |
| `upgrade-agp-9` | Upgrade Android Gradle Plugin to v9 |
| `navigation-3` | Set up Navigation 3 framework |
| `xml-to-compose` | Migrate XML layouts to Jetpack Compose |
| `r8-performance` | Audit and optimize R8 shrinking config |

Install all at once:
```bash
android skills add --all
```

---

## Configuration (~/.androidrc)
```
--sdk=<path-to-android-sdk>
```
Applies to every `android` invocation automatically.

---

## ITGD Agentic Workflow Protocols

### Protocol 1: New Feature
```
Step 1: get_full_context          → load ITGD conventions
Step 2: get_live_versions         → get current agp/kotlin/compose/media3 versions
Step 3: android create            → scaffold from template
Step 4: [Claude writes feature]
Step 5: android studio analyze-file → lint generated files
Step 6: render_compose_preview    → visual verify @Preview
Step 7: android run               → deploy and smoke test
```

### Protocol 2: Fluidity Debug
```
Step 1: check_ui_fluidity(screen) → thresholds + ACR workflow
Step 2: android layout --diff     → live UI tree changes
Step 3: android screen capture --annotate → screenshot + element labels
Step 4: [Claude diagnoses issue]
Step 5: android studio analyze-file → lint the fix
Step 6: android run + verify      → deploy + confirm fix
```

### Protocol 3: New Developer Onboarding
```
Step 1: bash install.sh           → everything installed automatically
Step 2: android init              → android-cli skill installed
Step 3: android skills add --all  → Google skills installed
Step 4: get_full_context          → ITGD project knowledge loaded
Step 5: Ready — no pair session needed
```

### Protocol 4: Dependency Upgrade
```
Step 1: get_live_versions         → current recommended versions
Step 2: android skills add --skill upgrade-agp-9  → skill loaded
Step 3: [Claude runs upgrade guided by skill + live versions]
Step 4: android studio analyze-file → verify no new warnings
Step 5: ./gradlew build           → confirm build passes
```
