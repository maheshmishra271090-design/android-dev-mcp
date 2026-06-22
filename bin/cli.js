#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PACKAGE_DIR = path.join(__dirname, "..");
const SERVER_ENTRY = path.join(PACKAGE_DIR, "dist", "index.js");
const CLAUDE_CONFIG = path.join(os.homedir(), ".claude", "claude_desktop_config.json");
const MCP_NAME = "android-dev-mcp";
const args = process.argv.slice(2);
const command = args[0] || "start";

const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
};

// ─── MCP BLOCK ────────────────────────────────────────────────
const MCP_MARKER_START = "<!-- android-dev-mcp:start -->";
const MCP_MARKER_END   = "<!-- android-dev-mcp:end -->";

const MCP_BLOCK = `${MCP_MARKER_START}
## android-dev-mcp Session Protocol

### Session Start (run in order)
1. Call \`get_full_context\` from the \`android-dev-mcp\` MCP server
2. Call \`run_android_cli\` with command \`studio check\`
3. Call \`get_live_versions\` to load current dependency versions
4. Ask me what we are building or fixing today before writing any code

### When to use which tool
| Situation | Tool |
|---|---|
| Adding a new screen or module | \`scaffold_feature\` |
| Player jank, frame drops, crashes | \`fluidity_debug_workflow("player")\` |
| Written a Compose screen | \`verify_ui\` |
| Need test templates | \`generate_tests("viewmodel:ClassName")\` |
| Context getting large | \`get_session_hygiene\` |
| Unsure which model to use | \`get_model_routing("describe task")\` |
| Installing optimization tools | \`get_tooling_setup\` |
${MCP_MARKER_END}`;

function setupClaudeMd(targetDir) {
  const claudeMdPath = path.join(targetDir, "CLAUDE.md");
  const exists = fs.existsSync(claudeMdPath);

  // ── Case 1: No CLAUDE.md — create it
  if (!exists) {
    fs.writeFileSync(claudeMdPath, MCP_BLOCK + "\n");
    console.log(c.green("✔ Created CLAUDE.md with android-dev-mcp block"));
    return;
  }

  const content = fs.readFileSync(claudeMdPath, "utf8");

  // ── Case 2: Block already present — update it
  if (content.includes(MCP_MARKER_START)) {
    const updated = content.replace(
      new RegExp(`${MCP_MARKER_START}[\\s\\S]*?${MCP_MARKER_END}`),
      MCP_BLOCK
    );
    fs.writeFileSync(claudeMdPath, updated);
    console.log(c.green("✔ Updated existing android-dev-mcp block in CLAUDE.md"));
    return;
  }

  // ── Case 3: CLAUDE.md exists but no block — append
  const separator = content.endsWith("\n") ? "\n" : "\n\n";
  fs.writeFileSync(claudeMdPath, content + separator + MCP_BLOCK + "\n");
  console.log(c.green("✔ Appended android-dev-mcp block to existing CLAUDE.md"));

  // Warn if file is getting large
  const words = fs.readFileSync(claudeMdPath, "utf8").split(/\s+/).length;
  const approxTokens = Math.round(words / 0.75);
  if (approxTokens > 500) {
    console.log(c.yellow(`  ⚠ CLAUDE.md is ~${approxTokens} tokens (target: <500). Consider moving detailed content to knowledge/ files.`));
  } else {
    console.log(c.cyan(`  CLAUDE.md is ~${approxTokens} tokens ✔`));
  }
}

if (command === "start") {
  require(SERVER_ENTRY);

} else if (command === "setup-claude-md") {
  // Optional --dir flag: android-dev-mcp setup-claude-md --dir=/path/to/project
  const dirArg = args.find(a => a.startsWith("--dir="));
  const targetDir = dirArg ? dirArg.split("=")[1] : process.cwd();

  console.log(c.bold(`\n android-dev-mcp — CLAUDE.md Setup\n`));
  console.log(`  Target: ${c.cyan(path.resolve(targetDir))}\n`);

  setupClaudeMd(targetDir);

  console.log(`
  The block is wrapped in HTML comment markers so future runs
  can update it safely without touching the rest of your file:

    ${c.cyan(MCP_MARKER_START)}
    ...
    ${c.cyan(MCP_MARKER_END)}

  To update the block later (e.g. after upgrading android-dev-mcp):
    ${c.bold("android-dev-mcp setup-claude-md")}
`);

} else if (command === "init") {
  console.log(c.bold("\n android-dev-mcp — Unified Android AI Workflow Setup\n"));

  if (!fs.existsSync(SERVER_ENTRY)) {
    console.log(c.yellow("Building server..."));
    execSync("npm run build", { cwd: PACKAGE_DIR, stdio: "inherit" });
  }

  const mcpEntry = { command: "npx", args: [`@maheshmishra271090-design/android-dev-mcp`, "start"] };
  let config = { mcpServers: {} };
  const configDir = path.dirname(CLAUDE_CONFIG);

  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  if (fs.existsSync(CLAUDE_CONFIG)) {
    try { config = JSON.parse(fs.readFileSync(CLAUDE_CONFIG, "utf8")); config.mcpServers = config.mcpServers || {}; }
    catch { console.log(c.yellow("Existing config unreadable — creating fresh.")); }
  }

  if (config.mcpServers[MCP_NAME]) {
    console.log(c.yellow(`'${MCP_NAME}' already configured in Claude Desktop config. No changes made.`));
  } else {
    config.mcpServers[MCP_NAME] = mcpEntry;
    fs.writeFileSync(CLAUDE_CONFIG, JSON.stringify(config, null, 2));
    console.log(c.green(`✔ Added '${MCP_NAME}' to Claude Desktop config`));
  }

  // Claude Code (CLI / VSCode extension) reads its own config, not
  // claude_desktop_config.json — register there too via `claude mcp add`.
  const claudeCodeAvailable = (() => {
    try { execSync("command -v claude", { stdio: "ignore" }); return true; }
    catch { return false; }
  })();

  if (claudeCodeAvailable) {
    try {
      execSync(`claude mcp get ${MCP_NAME}`, { stdio: "pipe" });
      console.log(c.yellow(`'${MCP_NAME}' already configured in Claude Code. No changes made.`));
    } catch {
      try {
        execSync(`claude mcp add ${MCP_NAME} -- node "${SERVER_ENTRY}"`, { stdio: "inherit" });
        console.log(c.green(`✔ Added '${MCP_NAME}' to Claude Code`));
      } catch (e) {
        console.log(c.yellow(`⚠ Could not auto-register with Claude Code: ${e.message}`));
        console.log(c.cyan(`  Run manually: claude mcp add ${MCP_NAME} -- node "${SERVER_ENTRY}"`));
      }
    }
  } else {
    console.log(c.yellow("⚠ 'claude' CLI not found on PATH — skipping Claude Code registration."));
    console.log(c.cyan(`  If you use Claude Code, run manually: claude mcp add ${MCP_NAME} -- node "${SERVER_ENTRY}"`));
  }

  // Auto-run CLAUDE.md setup in current directory
  console.log(c.cyan("\nSetting up CLAUDE.md in current directory..."));
  setupClaudeMd(process.cwd());

  console.log(`
${c.bold("Setup complete!")}

  Verify:        ${c.cyan("/mcp")}
  Session start: ${c.cyan("get_full_context")}

  ${c.bold("Knowledge tools (14)")} — project context, architecture, UI, API,
    player, CI/CD, fluidity+ACR, tests, git, prompts, hygiene,
    model routing, tooling, Android CLI guide

  ${c.bold("CLI integration tools (5)")}
    ${c.cyan("run_android_cli")}          execute any android command
    ${c.cyan("get_live_versions")}        live agp/kotlin/compose/media3 from Google Maven
    ${c.cyan("scaffold_feature")}         context + versions + CLI scaffold in one call
    ${c.cyan("verify_ui")}               render @Preview + validate against ITGD standards
    ${c.cyan("fluidity_debug_workflow")}  full debug protocol with CLI commands

  ${c.bold("Execution tools (4)")}
    ${c.cyan("run_adb")}     execute any adb command
    ${c.cyan("run_git")}     execute any git command
    ${c.cyan("run_gradle")}  execute a gradle task (auto-detects ./gradlew)
    ${c.cyan("run_bash")}    execute an arbitrary shell command

  ${c.bold("CLAUDE.md:")}
    To add/update the MCP block in any project:
    ${c.cyan("android-dev-mcp setup-claude-md")}
    ${c.cyan("android-dev-mcp setup-claude-md --dir=/path/to/project")}
`);

} else if (command === "check") {
  const androidAvailable = (() => { try { execSync("which android", {encoding:"utf8"}); return true; } catch { return false; } })();
  const serverBuilt = fs.existsSync(SERVER_ENTRY);
  const configExists = fs.existsSync(CLAUDE_CONFIG);
  const configured = configExists && fs.readFileSync(CLAUDE_CONFIG,"utf8").includes(MCP_NAME);
  const claudeMdExists = fs.existsSync(path.join(process.cwd(), "CLAUDE.md"));
  const claudeMdHasBlock = claudeMdExists && fs.readFileSync(path.join(process.cwd(), "CLAUDE.md"), "utf8").includes(MCP_MARKER_START);

  console.log(`\n${c.bold("android-dev-mcp — Status Check")}\n`);
  console.log(`  MCP server built:    ${serverBuilt     ? c.green("✔") : c.red("✘  run: npm run build")}`);
  console.log(`  Claude configured:   ${configured      ? c.green("✔") : c.red("✘  run: android-dev-mcp init")}`);
  console.log(`  Android CLI:         ${androidAvailable ? c.green("✔") : c.yellow("✘  install for CLI tools")}`);
  console.log(`  CLAUDE.md (cwd):     ${claudeMdHasBlock ? c.green("✔  block present") : claudeMdExists ? c.yellow("✘  block missing — run: android-dev-mcp setup-claude-md") : c.yellow("✘  not found — run: android-dev-mcp setup-claude-md")}`);
  console.log();

} else if (command === "help" || command === "--help") {
  console.log(`
${c.bold("android-dev-mcp")} — Unified Android AI Workflow MCP Server

${c.bold("Commands:")}
  ${c.cyan("init")}                  Wire into Claude Code + setup CLAUDE.md in cwd
  ${c.cyan("setup-claude-md")}       Add/update MCP block in CLAUDE.md (safe — never overwrites existing content)
    ${c.cyan("--dir=<path>")}        Target a specific project directory (default: cwd)
  ${c.cyan("start")}                 Start MCP server (used by Claude Code)
  ${c.cyan("check")}                 Verify installation status
  ${c.cyan("help")}                  Show this help

${c.bold("Examples:")}
  android-dev-mcp setup-claude-md                    # current project
  android-dev-mcp setup-claude-md --dir=~/projects/MyApp
  android-dev-mcp setup-claude-md --dir=~/projects/GiftAR

${c.bold("Install everything:")}
  bash install.sh
`);

} else {
  console.error(c.red(`Unknown command: ${command}`));
  console.error(`Run ${c.cyan("android-dev-mcp help")} for usage.`);
  process.exit(1);
}
