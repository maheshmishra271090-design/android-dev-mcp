import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process";

const KNOWLEDGE_DIR = path.join(__dirname, "../knowledge");

function loadKnowledge(file: string): string {
  const fp = path.join(KNOWLEDGE_DIR, file);
  return fs.existsSync(fp) ? fs.readFileSync(fp, "utf-8")
    : `[Knowledge file '${file}' not found. Add it to /knowledge/]`;
}

function runCLI(command: string, cwd?: string): { stdout: string; error?: string } {
  try {
    const opts: ExecSyncOptionsWithStringEncoding = {
      encoding: "utf-8",
      timeout: 30000,
      cwd: cwd ?? process.cwd(),
    };
    const stdout = execSync(`android ${command}`, opts);
    return { stdout: stdout.trim() };
  } catch (e: any) {
    return {
      stdout: e.stdout?.toString().trim() ?? "",
      error: e.stderr?.toString().trim() ?? e.message,
    };
  }
}

function androidCLIAvailable(): boolean {
  try { execSync("which android", { encoding: "utf-8" }); return true; }
  catch { return false; }
}

// ─── SERVER ──────────────────────────────────────────────────
const server = new Server(
  { name: "android-dev-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ─── TOOLS ───────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ── KNOWLEDGE LAYER ──────────────────────────────────────
    {
      name: "get_full_context",
      description: "Returns complete ITGD Android project context — all knowledge domains. Call once at session start.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_project_structure",
      description: "Returns module layout, package naming, and file naming conventions.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_architecture_patterns",
      description: "Returns MVVM, Hilt DI, ViewModel, StateFlow, and Coroutine patterns.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_ui_compose_standards",
      description: "Returns Compose screen structure, Material 3, Navigation, and Player UI standards.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_api_backend_patterns",
      description: "Returns Retrofit, AuthInterceptor, repository patterns, error handling, and streaming API conventions.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_player_patterns",
      description: "Returns ExoPlayer/Media3 setup, HLS, Widevine DRM, and lifecycle management in Compose.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_cicd_commands",
      description: "Returns Gradle build commands, flavors, signing config, and CI pipeline steps.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "check_ui_fluidity",
      description: "Returns frame rate thresholds, ADB commands, Macrobenchmark templates, ACR crash analysis, and screen-specific guidance. screen: home|player|search|all",
      inputSchema: {
        type: "object",
        properties: {
          screen: { type: "string", enum: ["home", "player", "search", "all"] },
        },
        required: [],
      },
    },
    {
      name: "generate_tests",
      description: "Returns test templates. target: viewmodel:X | repository:X | ui:X | api:X | all",
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string", description: "e.g. 'viewmodel:PlayerViewModel' or 'all'" },
        },
        required: [],
      },
    },
    {
      name: "get_git_workflow",
      description: "Returns branch strategy, Conventional Commits, Git hooks, and alias setup. topic: branches|commits|commands|hooks|all",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", enum: ["branches", "commits", "commands", "hooks", "all"] },
        },
        required: [],
      },
    },
    {
      name: "get_prompt_templates",
      description: "Returns token-efficient prompt templates: Ask CIO, few-shot CoT, compact tasks, anti-patterns. topic: ask-cio|few-shot|compact-tasks|anti-patterns|all",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", enum: ["ask-cio", "few-shot", "compact-tasks", "anti-patterns", "all"] },
        },
        required: [],
      },
    },
    {
      name: "get_session_hygiene",
      description: "Returns /clear vs /compact rules, context window facts, autocompact buffer thresholds, and CLAUDE.md hygiene.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_model_routing",
      description: "Returns Haiku/Sonnet/Opus routing guide. Optionally pass task description for a specific recommendation.",
      inputSchema: {
        type: "object",
        properties: {
          task: { type: "string", description: "Describe the task for a model recommendation." },
        },
        required: [],
      },
    },
    {
      name: "get_tooling_setup",
      description: "Returns install guides for Graphify, RTK, Caveman, Superpowers. tool: graphify|rtk|caveman|superpowers|all",
      inputSchema: {
        type: "object",
        properties: {
          tool: { type: "string", enum: ["graphify", "rtk", "caveman", "superpowers", "all"] },
        },
        required: [],
      },
    },

    // ── ANDROID CLI INTEGRATION LAYER ────────────────────────
    {
      name: "get_android_cli_guide",
      description: "Returns the full Android CLI command reference, available Google Skills, and ITGD agentic workflow protocols (new feature, fluidity debug, onboarding, dependency upgrade).",
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: ["commands", "skills", "workflows", "all"],
            description: "Which section to return. Defaults to 'all'.",
          },
        },
        required: [],
      },
    },
    {
      name: "run_android_cli",
      description: "Executes an Android CLI command and returns stdout. Use for: android create, android run, android studio analyze-file, android studio version-lookup, android layout, android screen capture, android emulator, android skills, android docs. Requires Android CLI installed.",
      inputSchema: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The android sub-command and args. e.g. 'studio version-lookup agp kotlin compose' or 'studio analyze-file app/src/main/java/com/example/PlayerScreen.kt'",
          },
          cwd: {
            type: "string",
            description: "Optional working directory (project root). Defaults to current directory.",
          },
        },
        required: ["command"],
      },
    },
    {
      name: "get_live_versions",
      description: "Fetches live recommended dependency versions from Google Maven via Android CLI (agp, kotlin, compose, media3, hilt). Returns current versions to use in build.gradle.kts. Requires Android Studio + Android CLI.",
      inputSchema: {
        type: "object",
        properties: {
          packages: {
            type: "string",
            description: "Space-separated package identifiers. Defaults to 'agp kotlin compose media3 androidx.hilt:hilt-navigation-compose'.",
          },
        },
        required: [],
      },
    },
    {
      name: "scaffold_feature",
      description: "Agentic workflow: loads ITGD conventions + fetches live versions + scaffolds a new feature. Returns the context + version data + Android CLI scaffold command for Claude to execute. Steps: get_full_context → get_live_versions → android create guidance.",
      inputSchema: {
        type: "object",
        properties: {
          feature_name: {
            type: "string",
            description: "Name of the feature to scaffold (e.g. 'PlayerScreen', 'SearchFeature').",
          },
          template: {
            type: "string",
            description: "Android CLI template name. Defaults to 'empty-activity-agp-9'.",
          },
        },
        required: ["feature_name"],
      },
    },
    {
      name: "verify_ui",
      description: "Agentic workflow: renders a @Preview composable via Android CLI and cross-checks its semantics tree against ITGD Compose standards. Returns render command + standards to validate against.",
      inputSchema: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "Path to the Kotlin file containing the @Preview composable.",
          },
          composable_name: {
            type: "string",
            description: "Name of the composable @Preview function to render.",
          },
        },
        required: ["file_path", "composable_name"],
      },
    },
    {
      name: "fluidity_debug_workflow",
      description: "Agentic workflow: runs the full fluidity debug protocol — loads fluidity standards + generates Android CLI commands for layout inspection, screenshot capture, and ACR analysis. screen: home|player|search",
      inputSchema: {
        type: "object",
        properties: {
          screen: {
            type: "string",
            enum: ["home", "player", "search"],
            description: "Which screen to debug.",
          },
          project_dir: {
            type: "string",
            description: "Optional project directory path.",
          },
        },
        required: ["screen"],
      },
    },
  ],
}));

// ─── HANDLERS ────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, string>;

  switch (name) {

    // ── KNOWLEDGE TOOLS ──────────────────────────────────────

    case "get_project_structure":
      return { content: [{ type: "text", text: loadKnowledge("project-structure.md") }] };

    case "get_architecture_patterns":
      return { content: [{ type: "text", text: loadKnowledge("architecture-patterns.md") }] };

    case "get_ui_compose_standards":
      return { content: [{ type: "text", text: loadKnowledge("ui-compose-standards.md") }] };

    case "get_api_backend_patterns":
      return { content: [{ type: "text", text: loadKnowledge("api-backend-patterns.md") }] };

    case "get_player_patterns":
      return { content: [{ type: "text", text: loadKnowledge("player-patterns.md") }] };

    case "get_cicd_commands":
      return { content: [{ type: "text", text: loadKnowledge("cicd-commands.md") }] };

    case "check_ui_fluidity": {
      const screen = a.screen ?? "all";
      const raw = loadKnowledge("ui-fluidity.md");
      if (screen === "all") return { content: [{ type: "text", text: raw }] };
      const focusMap: Record<string, string> = {
        home: "Focus: LazyColumn scroll + feed recomposition. Android CLI: android layout --diff to watch live changes.",
        player: "Focus: Frame timing + ExoPlayer surface + startup-to-first-frame + ACR crash patterns (MediaCodec, DRM, HLS). Android CLI: android screen capture --annotate for UI state.",
        search: "Focus: Keyboard latency + search list scroll + recomposition per keystroke. Android CLI: android layout --diff during typing.",
      };
      return { content: [{ type: "text", text: `## Screen Focus: ${screen}\n${focusMap[screen]}\n\n---\n\n${raw}` }] };
    }

    case "generate_tests": {
      const target = a.target ?? "all";
      const raw = loadKnowledge("test-generation.md");
      if (target === "all") return { content: [{ type: "text", text: raw }] };
      const [type, className] = target.split(":");
      const sectionMap: Record<string, string> = {
        viewmodel: "1. ViewModel Unit Test Template",
        repository: "2. Repository Unit Test Template",
        ui: "3. Compose UI Test Template",
        api: "4. API / Retrofit Integration Test Template",
      };
      return { content: [{ type: "text", text: `## ${sectionMap[type.toLowerCase()] ?? "Test"} for: ${className ?? "Unknown"}\n\n---\n\n${raw}` }] };
    }

    case "get_git_workflow": {
      const topic = a.topic ?? "all";
      const raw = loadKnowledge("git-workflow.md");
      if (topic === "all") return { content: [{ type: "text", text: raw }] };
      const topicMap: Record<string, string> = {
        branches: "Branch Strategy", commits: "Commit Message Format",
        commands: "Daily Commands", hooks: "Git Hooks",
      };
      return { content: [{ type: "text", text: `## ${topicMap[topic]}\n\n---\n\n${raw}` }] };
    }

    case "get_prompt_templates": {
      const topic = a.topic ?? "all";
      const raw = loadKnowledge("prompt-templates.md");
      if (topic === "all") return { content: [{ type: "text", text: raw }] };
      return { content: [{ type: "text", text: `## ${topic}\n\n---\n\n${raw}` }] };
    }

    case "get_session_hygiene":
      return { content: [{ type: "text", text: loadKnowledge("session-hygiene.md") }] };

    case "get_model_routing": {
      const task = a.task;
      const raw = loadKnowledge("model-routing.md");
      if (!task) return { content: [{ type: "text", text: raw }] };
      const lower = task.toLowerCase();
      let rec = "";
      if (lower.includes("rename") || lower.includes("boilerplate") || lower.includes("simple") || lower.includes("commit") || lower.includes("format"))
        rec = `**→ Haiku** for: "${task}"\n\`claude --model claude-haiku-4-5-20251001\``;
      else if (lower.includes("architect") || lower.includes("design") || lower.includes("complex") || lower.includes("crash") || lower.includes("security") || lower.includes("investigate"))
        rec = `**→ Opus** for: "${task}"\n\`claude --model claude-opus-4-6\``;
      else
        rec = `**→ Sonnet** for: "${task}"\n\`claude --model claude-sonnet-4-6\``;
      return { content: [{ type: "text", text: `## Model Recommendation\n${rec}\n\n---\n\n${raw}` }] };
    }

    case "get_tooling_setup": {
      const tool = a.tool ?? "all";
      const raw = loadKnowledge("tooling-setup.md");
      if (tool === "all") return { content: [{ type: "text", text: raw }] };
      return { content: [{ type: "text", text: `## Setup: ${tool}\n\n---\n\n${raw}` }] };
    }

    case "get_full_context": {
      const sections = [
        "# android-dev-mcp — Full Project Context\n",
        "## 1. Project Structure\n" + loadKnowledge("project-structure.md"),
        "## 2. Architecture Patterns\n" + loadKnowledge("architecture-patterns.md"),
        "## 3. UI & Compose Standards\n" + loadKnowledge("ui-compose-standards.md"),
        "## 4. API & Backend Patterns\n" + loadKnowledge("api-backend-patterns.md"),
        "## 5. Player Patterns\n" + loadKnowledge("player-patterns.md"),
        "## 6. CI/CD Commands\n" + loadKnowledge("cicd-commands.md"),
        "## 7. UI Fluidity & ACR\n" + loadKnowledge("ui-fluidity.md"),
        "## 8. Test Generation\n" + loadKnowledge("test-generation.md"),
        "## 9. Git Workflow\n" + loadKnowledge("git-workflow.md"),
        "## 10. Prompt Templates\n" + loadKnowledge("prompt-templates.md"),
        "## 11. Session Hygiene\n" + loadKnowledge("session-hygiene.md"),
        "## 12. Model Routing\n" + loadKnowledge("model-routing.md"),
        "## 13. Tooling Setup\n" + loadKnowledge("tooling-setup.md"),
        "## 14. Android CLI Integration\n" + loadKnowledge("android-cli.md"),
      ];
      return { content: [{ type: "text", text: sections.join("\n\n---\n\n") }] };
    }

    // ── ANDROID CLI INTEGRATION TOOLS ────────────────────────

    case "get_android_cli_guide": {
      const section = a.section ?? "all";
      const raw = loadKnowledge("android-cli.md");
      if (section === "all") return { content: [{ type: "text", text: raw }] };
      return { content: [{ type: "text", text: `## Android CLI: ${section}\n\n---\n\n${raw}` }] };
    }

    case "run_android_cli": {
      const command = a.command;
      if (!command) return { content: [{ type: "text", text: "Error: command parameter is required." }], isError: true };

      if (!androidCLIAvailable()) {
        return {
          content: [{ type: "text", text: [
            "## Android CLI Not Installed",
            "Install it first:",
            "```bash",
            "curl -fsSL https://dl.google.com/android/android-cli/install.sh | bash",
            "android update",
            "android init",
            "```",
            "Or run: `bash install.sh` — the unified installer handles this automatically.",
          ].join("\n") }],
          isError: true,
        };
      }

      const result = runCLI(command, a.cwd);
      const output = result.error
        ? `## Command: android ${command}\n\n### Output\n${result.stdout}\n\n### Error\n${result.error}`
        : `## Command: android ${command}\n\n### Output\n\`\`\`\n${result.stdout}\n\`\`\``;

      return { content: [{ type: "text", text: output }] };
    }

    case "get_live_versions": {
      const packages = a.packages ?? "agp kotlin compose media3 androidx.hilt:hilt-navigation-compose";

      if (!androidCLIAvailable()) {
        return {
          content: [{ type: "text", text: [
            "## Live Versions — Android CLI Not Available",
            "Install Android CLI to fetch live versions automatically.",
            "In the meantime, check manually at:",
            "- https://developer.android.com/jetpack/androidx/releases/compose",
            "- https://kotlinlang.org/docs/releases.html",
            "- https://developer.android.com/build/releases/gradle-plugin",
          ].join("\n") }],
        };
      }

      const result = runCLI(`studio version-lookup ${packages}`);
      if (result.error && !result.stdout) {
        return { content: [{ type: "text", text: `## Live Versions — Error\n${result.error}\n\nEnsure Android Studio is running with Gemini enabled.` }] };
      }

      return {
        content: [{ type: "text", text: [
          `## Live Dependency Versions`,
          `Fetched via: \`android studio version-lookup ${packages}\``,
          "",
          "```",
          result.stdout,
          "```",
          "",
          "Use these in your `libs.versions.toml` or `build.gradle.kts`.",
        ].join("\n") }],
      };
    }

    case "scaffold_feature": {
      const featureName = a.feature_name ?? "NewFeature";
      const template = a.template ?? "empty-activity-agp-9";

      const conventions = loadKnowledge("project-structure.md");
      const architecture = loadKnowledge("architecture-patterns.md");

      let liveVersions = "Run `get_live_versions` to fetch current dependency versions.";
      if (androidCLIAvailable()) {
        const vr = runCLI("studio version-lookup agp kotlin compose media3");
        if (!vr.error) liveVersions = vr.stdout;
      }

      return {
        content: [{ type: "text", text: [
          `# Scaffold Feature: ${featureName}`,
          "",
          "## Step 1 — ITGD Conventions Loaded",
          conventions,
          "",
          "## Step 2 — Current Dependency Versions",
          "```",
          liveVersions,
          "```",
          "",
          "## Step 3 — Architecture Pattern",
          architecture,
          "",
          "## Step 4 — CLI Scaffold Command",
          "```bash",
          `android create --output=./${featureName} ${template}`,
          "```",
          "",
          "## Step 5 — After Scaffolding",
          "Run these to verify the generated code:",
          "```bash",
          `android studio analyze-file app/src/main/java/com/tvtoday/mobile/ui/${featureName.toLowerCase()}/${featureName}Screen.kt`,
          "```",
          "",
          "Now create the following files following ITGD conventions:",
          `- ui/${featureName.toLowerCase()}/${featureName}Screen.kt`,
          `- ui/${featureName.toLowerCase()}/${featureName}ViewModel.kt`,
          `- data/repository/${featureName}Repository.kt`,
          `- domain/usecase/Get${featureName}UseCase.kt`,
        ].join("\n") }],
      };
    }

    case "verify_ui": {
      const filePath = a.file_path;
      const composableName = a.composable_name;

      if (!filePath || !composableName) {
        return { content: [{ type: "text", text: "Error: file_path and composable_name are required." }], isError: true };
      }

      const composeStandards = loadKnowledge("ui-compose-standards.md");

      const cliAvailable = androidCLIAvailable();
      const renderCmd = `android studio render-compose-preview --print-semantics --output-image-file=preview_${composableName.toLowerCase()}.png ${filePath} ${composableName}`;

      let renderResult = "";
      if (cliAvailable) {
        const r = runCLI(`studio render-compose-preview --print-semantics --output-image-file=preview_${composableName.toLowerCase()}.png ${filePath} ${composableName}`);
        renderResult = r.error ? `\n### Render Error\n${r.error}` : `\n### Semantics Tree\n\`\`\`json\n${r.stdout}\n\`\`\``;
      } else {
        renderResult = "\n### Android CLI not available — run the command manually:\n```bash\n" + renderCmd + "\n```";
      }

      return {
        content: [{ type: "text", text: [
          `# UI Verification: ${composableName}`,
          "",
          "## Render Command",
          "```bash",
          renderCmd,
          "```",
          renderResult,
          "",
          "## ITGD Compose Standards to Validate Against",
          composeStandards,
          "",
          "## Checklist",
          "- [ ] Screen uses `collectAsStateWithLifecycle()` not `collectAsState()`",
          "- [ ] Loading/Error/Success states all handled",
          "- [ ] `LoadingIndicator()` and `ErrorView()` shared components used",
          "- [ ] All colors via `MaterialTheme.colorScheme.*` — no hardcoded colors",
          "- [ ] `@Preview` provided with dark/light variants",
          "- [ ] All interactive elements have `Modifier.testTag()`",
        ].join("\n") }],
      };
    }

    case "fluidity_debug_workflow": {
      const screen = a.screen ?? "player";
      const projectDir = a.project_dir ?? ".";

      const fluidityKnowledge = loadKnowledge("ui-fluidity.md");

      const focusMap: Record<string, { issue: string; layoutFilter: string }> = {
        home: { issue: "LazyColumn scroll jank or feed recomposition", layoutFilter: "home_feed" },
        player: { issue: "Frame drops during playback or player controls freeze", layoutFilter: "player_screen" },
        search: { issue: "Keyboard latency or search list jank", layoutFilter: "search_results" },
      };
      const focus = focusMap[screen] ?? focusMap.player;

      return {
        content: [{ type: "text", text: [
          `# Fluidity Debug Workflow: ${screen} screen`,
          `**Suspected issue:** ${focus.issue}`,
          "",
          "## Step 1 — Baseline Frame Metrics",
          "```bash",
          "adb shell dumpsys gfxinfo com.tvtoday.mobile reset",
          `# Interact with the ${screen} screen for 10–15 seconds, then:`,
          "adb shell dumpsys gfxinfo com.tvtoday.mobile | grep -E 'Janky|percentile|Total frames'",
          "```",
          "",
          "## Step 2 — Live UI Layout Tree (Android CLI)",
          "```bash",
          `android layout --diff --output=${screen}_layout.json`,
          "```",
          "",
          "## Step 3 — Annotated Screenshot (Android CLI)",
          "```bash",
          `android screen capture --annotate --output=${screen}_ui.png`,
          `# Resolve a specific element's coordinates:`,
          `android screen resolve --screenshot=${screen}_ui.png --string="input tap #5"`,
          "```",
          "",
          "## Step 4 — ACR Crash Correlation",
          "```bash",
          "adb pull /data/anr/traces.txt ./traces.txt",
          `adb logcat -d | grep -E "FATAL|AndroidRuntime|ANR|ExoPlayer|MediaCodec" | tail -50`,
          "adb shell dumpsys meminfo com.tvtoday.mobile",
          "```",
          "",
          "## Step 5 — Lint the Problematic File (Android CLI)",
          "```bash",
          `android studio analyze-file app/src/main/java/com/tvtoday/mobile/ui/${screen}/${screen.charAt(0).toUpperCase() + screen.slice(1)}Screen.kt`,
          "```",
          "",
          "## Fluidity Standards & Fix Patterns",
          fluidityKnowledge,
        ].join("\n") }],
      };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
});

// ─── START ───────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("android-dev-mcp running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
