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
- MCP config for **Claude Code** (via `claude mcp add`) and **Claude Desktop** (via `claude_desktop_config.json`)
- CLAUDE.md block in current project
- Git hooks (pre-commit lint + commit-msg Conventional Commits)

`android-dev-mcp init` registers the server in both places it can be used — the `claude` CLI's own MCP config (for Claude Code / the VSCode extension) and `claude_desktop_config.json` (for the Claude Desktop app). If the `claude` CLI isn't on `PATH`, Claude Code registration is skipped with a warning and the manual command to run instead (see below).

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

```bash
claude mcp get android-dev-mcp
```

```
android-dev-mcp:
  Status: ✔ Connected
  Type: stdio
  Command: node
  Args: <path-to-package>/dist/index.js
```

Then inside Claude Code, **start a new session** (registration only takes effect on session start):
```
/mcp   → should show android-dev-mcp with 24 tools
```

### Manual registration (Claude Code)

If `init` reports it couldn't find the `claude` CLI, or you're setting this up without the installer, register it directly:

```bash
claude mcp add android-dev-mcp -- node "$(npm root -g)/@maheshmishra271090-design/android-dev-mcp/dist/index.js"
```

Or, when working from a local clone/checkout of this repo:
```bash
npm run build
claude mcp add android-dev-mcp -- node "$(pwd)/dist/index.js"
```

Remove it with:
```bash
claude mcp remove android-dev-mcp -s local
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

