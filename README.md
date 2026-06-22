# android-dev-mcp

> Unified MCP server for Android mobile development — combines project knowledge, Android CLI execution, live dependency versions, and agentic workflow tools for Claude Code.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/maheshmishra271090-design/android-dev-mcp/main/scripts/install.sh | bash
```

That's it. No cloning, no manual steps. The installer handles everything:

- Node.js ≥ 18 (installs or upgrades)
- Git + ITGD aliases
- Android CLI + Google Android Skills
- android-dev-mcp global npm package
- Claude Code MCP config
- CLAUDE.md block in current project
- Git hooks (pre-commit lint + commit-msg Conventional Commits)

### After install — verify

```bash
android-dev-mcp check
```

```
  MCP server built:    ✔
  Claude configured:   ✔
  Android CLI:         ✔  android 1.x.x
  CLAUDE.md (cwd):     ✔  block present
```

Then inside Claude Code:
```
/mcp   → should show android-dev-mcp with 19 tools
```

---

## What It Does

One MCP server that gives Claude Code both the knowledge **and** the execution power to complete full Android development workflows autonomously:

| Layer | Tools | What it provides |
|---|---|---|
| **Knowledge** | 14 | MVVM, Hilt, Compose, ExoPlayer, Retrofit, tests, git, prompts, model routing |
| **Android CLI** | 5 | Scaffold, lint, render @Preview, deploy APK, live dep versions |
| **Execution** | 4 | Direct adb, git, gradle, and shell command execution |

## Tools (24 total)

### Knowledge Layer (14)
| Tool | Returns |
|---|---|
| `get_full_context` | All 14 knowledge domains — call at session start |
| `get_project_structure` | Module layout, package naming, file conventions |
| `get_architecture_patterns` | MVVM, Hilt, ViewModel, StateFlow, Coroutines |
| `get_ui_compose_standards` | Compose screens, Material 3, Navigation, Player UI |
| `get_api_backend_patterns` | Retrofit, AuthInterceptor, DTO mapping, error codes |
| `get_player_patterns` | ExoPlayer/Media3, HLS, Widevine DRM, lifecycle |
| `get_cicd_commands` | Gradle flavors, signing, CI pipeline |
| `check_ui_fluidity` | Frame rate · jank · recomposition · ACR crash analysis |
| `generate_tests` | ViewModel · Repository · Compose UI · API templates |
| `get_git_workflow` | Branch strategy, Conventional Commits, hooks |
| `get_prompt_templates` | Ask CIO, few-shot CoT, compact tasks |
| `get_session_hygiene` | /clear vs /compact, context window rules |
| `get_model_routing` | Haiku/Sonnet/Opus routing + task recommendation |
| `get_tooling_setup` | Graphify, RTK, Caveman, Superpowers guides |

### Android CLI Integration Layer (5)
| Tool | What it does |
|---|---|
| `get_android_cli_guide` | Full CLI command reference + workflow protocols |
| `run_android_cli` | Executes any `android` command, returns stdout |
| `get_live_versions` | Current agp/kotlin/compose/media3 from Google Maven* |
| `scaffold_feature` | Context + live versions + CLI scaffold in one call |
| `verify_ui` | Renders @Preview + validates against ITGD Compose standards* |
| `fluidity_debug_workflow` | Full debug protocol: ADB + layout tree + screenshot + ACR + lint |

*Requires Android Studio running with Gemini signed in.

### Execution Layer (4)
| Tool | What it does |
|---|---|
| `run_adb` | Executes any `adb` command, returns stdout |
| `run_git` | Executes any `git` command, returns stdout |
| `run_gradle` | Executes a Gradle task — uses `./gradlew` if present, else global `gradle` |
| `run_bash` | Executes an arbitrary shell command, returns stdout/stderr |

## Agentic Workflows

### New Feature
```
get_full_context → get_live_versions → scaffold_feature → studio analyze-file → verify_ui → android run
```

### Fluidity Debug
```
fluidity_debug_workflow("player") → android layout --diff → android screen capture → ACR → fix → verify
```

### New Developer Onboarding
```bash
curl -fsSL https://raw.githubusercontent.com/maheshmishra271090-design/android-dev-mcp/main/scripts/install.sh | bash
# Done in ~3 minutes — no pair session needed
```

## Per-Project CLAUDE.md

To add or update the MCP block in any project:
```bash
android-dev-mcp setup-claude-md                       # current project
android-dev-mcp setup-claude-md --dir=~/projects/App  # specific project
```

Safe to re-run — never overwrites existing content.

## Customising Knowledge
All knowledge is plain markdown in `knowledge/`. Edit to match your project.

## License
MIT

