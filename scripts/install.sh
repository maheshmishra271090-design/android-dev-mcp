#!/usr/bin/env bash
# ============================================================
#  android-dev-mcp — One-Line Installer
#  Usage:
#    curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/android-dev-mcp/main/scripts/install.sh | bash
#
#  What it does (no cloning required):
#    1. Detects OS (Mac / Linux)
#    2. Installs Homebrew if missing (Mac)
#    3. Installs / upgrades Node.js ≥ 18
#    4. Installs Git + configures ITGD aliases
#    5. Tries to install Android CLI, warns if it fails
#    6. Installs android-dev-mcp globally via npm
#    7. Runs android-dev-mcp init (wires Claude config)
#    8. Runs android-dev-mcp setup-claude-md (CLAUDE.md in cwd)
#    9. Installs Git hooks in current project (if inside a repo)
# ============================================================
set -e

# ─── COLORS ──────────────────────────────────────────────────
BOLD="\033[1m"; GREEN="\033[0;32m"; YELLOW="\033[0;33m"
RED="\033[0;31m"; CYAN="\033[0;36m"; RESET="\033[0m"
DIM="\033[2m"

PACKAGE="@maheshmishra271090-design/android-dev-mcp"
MCP_NAME="android-dev-mcp"

log()    { echo -e "${CYAN}[android-dev-mcp]${RESET} $1"; }
ok()     { echo -e "${GREEN}  ✔${RESET}  $1"; }
warn()   { echo -e "${YELLOW}  ⚠${RESET}  $1"; }
fail()   { echo -e "${RED}  ✘${RESET}  $1"; }
header() { echo -e "\n${BOLD}── $1 ──${RESET}"; }
dim()    { echo -e "${DIM}     $1${RESET}"; }

# ─── BANNER ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}"
echo "  ┌─────────────────────────────────────────┐"
echo "  │        android-dev-mcp installer        │"
echo "  │   Unified Android AI Workflow for       │"
echo "  │         Claude Code  v1.0.0             │"
echo "  └─────────────────────────────────────────┘"
echo -e "${RESET}"

# ─── 1. OS DETECTION ─────────────────────────────────────────
header "1/9  Detecting system"
OS="$(uname -s)"
ARCH="$(uname -m)"
case "$OS" in
  Linux*)  PLATFORM="linux" ;;
  Darwin*) PLATFORM="mac"   ;;
  *)       fail "Unsupported OS: $OS"; exit 1 ;;
esac
ok "Platform: $PLATFORM ($ARCH)"

# ─── 2. HOMEBREW (Mac only) ──────────────────────────────────
header "2/9  Homebrew"
if [ "$PLATFORM" = "mac" ]; then
  if ! command -v brew &>/dev/null; then
    log "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # Add brew to PATH for Apple Silicon
    if [ "$ARCH" = "arm64" ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    ok "Homebrew installed"
  else
    ok "Homebrew $(brew --version | head -1)"
  fi
else
  dim "Skipped (Linux — using apt)"
fi

# ─── 3. NODE.JS ──────────────────────────────────────────────
header "3/9  Node.js (≥ 18 required)"
REQUIRED_NODE_MAJOR=18

install_node_mac()   { brew install node; }
install_node_linux() {
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null
  sudo apt-get install -y nodejs 2>/dev/null
}

if ! command -v node &>/dev/null; then
  warn "Node.js not found — installing..."
  [ "$PLATFORM" = "mac" ] && install_node_mac || install_node_linux
else
  NODE_MAJOR=$(node -e "process.stdout.write(process.version.split('.')[0].replace('v',''))")
  if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
    warn "Node.js v$NODE_MAJOR found but v$REQUIRED_NODE_MAJOR+ required — upgrading..."
    [ "$PLATFORM" = "mac" ] && install_node_mac || install_node_linux
  fi
fi
ok "Node.js $(node --version)  ·  npm $(npm --version)"

# ─── 4. GIT ──────────────────────────────────────────────────
header "4/9  Git"
if ! command -v git &>/dev/null; then
  warn "Git not found — installing..."
  if [ "$PLATFORM" = "mac" ]; then brew install git
  else sudo apt-get update -qq && sudo apt-get install -y git; fi
fi
ok "$(git --version)"

log "Configuring ITGD Git aliases..."
git config --global alias.st    status              2>/dev/null || true
git config --global alias.co    checkout            2>/dev/null || true
git config --global alias.lg    "log --oneline --graph --decorate --all" 2>/dev/null || true
git config --global alias.pf    "push --force-with-lease" 2>/dev/null || true
git config --global alias.rbd   "rebase origin/develop"   2>/dev/null || true
git config --global alias.undo  "reset --soft HEAD~1"     2>/dev/null || true
ok "Git aliases: st · co · lg · pf · rbd · undo"

# ─── 5. ANDROID CLI ──────────────────────────────────────────
header "5/9  Android CLI"
ANDROID_CLI_OK=false

if command -v android &>/dev/null; then
  ok "Android CLI already installed: $(android --version 2>/dev/null || echo 'version unknown')"
  ANDROID_CLI_OK=true
else
  log "Attempting to install Android CLI..."
  ANDROID_CLI_INSTALLED=false
  if [ "$PLATFORM" = "mac" ]; then
    if brew tap android/tap 2>/dev/null && brew trust --tap android/tap 2>/dev/null && brew install android-cli 2>/dev/null; then
      ANDROID_CLI_INSTALLED=true
    fi
  else
    if curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash 2>/dev/null; then
      ANDROID_CLI_INSTALLED=true
    fi
  fi

  if [ "$ANDROID_CLI_INSTALLED" = true ]; then
    # Reload PATH in case install added a new location
    export PATH="$PATH:$HOME/.local/bin:/usr/local/bin"
    if command -v android &>/dev/null; then
      ok "Android CLI installed: $(android --version 2>/dev/null || echo 'ok')"
      ANDROID_CLI_OK=true
    else
      warn "Android CLI installed but not found in PATH"
      warn "Add it to your PATH, then run: android init && android skills add --all"
    fi
  else
    warn "Android CLI auto-install failed."
    warn "Install manually from: https://developer.android.com/tools/agents/android-cli/download"
    warn "Knowledge tools (14) still work — CLI tools will be disabled until Android CLI is available."
  fi
fi

if [ "$ANDROID_CLI_OK" = true ]; then
  log "Initialising Android CLI for agents..."
  android init 2>/dev/null && ok "android init complete" || warn "android init skipped"
  log "Installing all Google Android Skills..."
  android skills add --all 2>/dev/null && ok "Android Skills installed (edge-to-edge, agp-9, nav-3, xml-to-compose, r8-perf)" \
    || warn "Skills install skipped — run manually: android skills add --all"
fi

# ─── 6. INSTALL android-dev-mcp VIA NPM ─────────────────────
header "6/9  Installing android-dev-mcp"

log "Installing $PACKAGE globally..."
if npm install -g "$PACKAGE"; then
  ok "$PACKAGE installed globally"
else
  fail "npm install failed. Try manually:"
  echo "    npm install -g $PACKAGE"
  exit 1
fi

# ─── 7. WIRE CLAUDE CODE CONFIG ──────────────────────────────
header "7/9  Configuring Claude Code"
if command -v android-dev-mcp &>/dev/null; then
  android-dev-mcp init
else
  # Fallback: write config directly
  CLAUDE_CONFIG="$HOME/.claude/claude_desktop_config.json"
  MCP_BIN="$(which android-dev-mcp 2>/dev/null || echo 'android-dev-mcp')"
  mkdir -p "$(dirname "$CLAUDE_CONFIG")"

  if [ ! -f "$CLAUDE_CONFIG" ]; then
    echo "{\"mcpServers\":{\"$MCP_NAME\":{\"command\":\"$MCP_BIN\",\"args\":[\"start\"]}}}" > "$CLAUDE_CONFIG"
  else
    node -e "
      const fs=require('fs');
      const c=JSON.parse(fs.readFileSync('$CLAUDE_CONFIG','utf8'));
      c.mcpServers=c.mcpServers||{};
      if(!c.mcpServers['$MCP_NAME']){
        c.mcpServers['$MCP_NAME']={command:'$MCP_BIN',args:['start']};
        fs.writeFileSync('$CLAUDE_CONFIG',JSON.stringify(c,null,2));
      }
    " 2>/dev/null
  fi
  ok "Claude config updated: $CLAUDE_CONFIG"
fi

# ─── 8. CLAUDE.MD SETUP ──────────────────────────────────────
header "8/9  CLAUDE.md"
if command -v android-dev-mcp &>/dev/null; then
  android-dev-mcp setup-claude-md
else
  warn "android-dev-mcp not in PATH — run manually: android-dev-mcp setup-claude-md"
fi

# ─── 9. GIT HOOKS ────────────────────────────────────────────
header "9/9  Git hooks"
if git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  HOOKS_DIR="$(git rev-parse --git-dir)/hooks"

  cat > "$HOOKS_DIR/pre-commit" << 'HOOK'
#!/bin/sh
echo "[android-dev-mcp] Running lint..."
./gradlew lint --quiet || exit 1
echo "[android-dev-mcp] Running unit tests..."
./gradlew test --quiet || exit 1
echo "[android-dev-mcp] Pre-commit checks passed."
HOOK
  chmod +x "$HOOKS_DIR/pre-commit"

  cat > "$HOOKS_DIR/commit-msg" << 'HOOK'
#!/bin/sh
MSG=$(cat "$1")
PATTERN="^(feat|fix|perf|refactor|test|chore|docs)(\(.+\))?: .{1,100}"
if ! echo "$MSG" | grep -qE "$PATTERN"; then
  echo ""
  echo "[android-dev-mcp] Commit message must follow Conventional Commits format."
  echo "  Example: feat(player): add DRM support"
  echo "  Types: feat | fix | perf | refactor | test | chore | docs"
  echo ""
  exit 1
fi
HOOK
  chmod +x "$HOOKS_DIR/commit-msg"
  ok "Git hooks installed (pre-commit · commit-msg)"
else
  dim "Not inside a Git repo — skipping hooks."
  dim "To install later, run this script from your project root."
fi

# ─── DONE ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔═══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║   android-dev-mcp installed successfully!     ║${RESET}"
echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}Verify in Claude Code:${RESET}   ${CYAN}/mcp${RESET}"
echo -e "  ${BOLD}Session start:${RESET}           ${CYAN}get_full_context${RESET}"
echo -e "  ${BOLD}Health check:${RESET}            ${CYAN}android-dev-mcp check${RESET}"
echo ""
echo -e "  ${BOLD}Knowledge tools (14):${RESET}    get_full_context · get_architecture_patterns · ..."
echo -e "  ${BOLD}CLI tools (5):${RESET}           run_android_cli · get_live_versions · scaffold_feature ..."
echo ""

if [ "$ANDROID_CLI_OK" = false ]; then
  echo -e "  ${YELLOW}⚠  Android CLI not installed — CLI tools disabled until available.${RESET}"
  echo -e "     Install from: https://developer.android.com/tools/agents"
  echo -e "     Then run:     android init && android skills add --all"
  echo ""
fi

echo -e "  ${DIM}Docs: https://github.com/maheshmishra271090-design/android-dev-mcp${RESET}"
echo ""
