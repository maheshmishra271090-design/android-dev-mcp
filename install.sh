#!/usr/bin/env bash
# ============================================================
#  android-dev-mcp — Unified Auto Installer
#  Installs: Node.js · Git · Android CLI · MCP server ·
#            Android Skills · Git hooks · Claude config
# ============================================================
set -e

BOLD="\033[1m"; GREEN="\033[0;32m"; YELLOW="\033[0;33m"
RED="\033[0;31m"; CYAN="\033[0;36m"; RESET="\033[0m"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_NAME="android-dev-mcp"
CLAUDE_CONFIG="$HOME/.claude/claude_desktop_config.json"

log()    { echo -e "${CYAN}[android-dev-mcp]${RESET} $1"; }
ok()     { echo -e "${GREEN}[✔]${RESET} $1"; }
warn()   { echo -e "${YELLOW}[!]${RESET} $1"; }
error()  { echo -e "${RED}[✘]${RESET} $1"; exit 1; }
header() { echo -e "\n${BOLD}$1${RESET}"; }

# ─── 1. OS detection ──────────────────────────────────────────
header "1/8 Detecting OS"
OS="$(uname -s)"
case "$OS" in Linux*) PLATFORM="linux";; Darwin*) PLATFORM="mac";; *) error "Unsupported OS: $OS";; esac
ok "Platform: $PLATFORM"

# ─── 2. Homebrew (Mac) ────────────────────────────────────────
if [ "$PLATFORM" = "mac" ]; then
  header "2/8 Checking Homebrew"
  if ! command -v brew &>/dev/null; then
    warn "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  ok "Homebrew $(brew --version | head -1)"
else
  header "2/8 Skipping Homebrew (Linux)"
fi

# ─── 3. Node.js ───────────────────────────────────────────────
header "3/8 Checking Node.js (≥18 required)"
install_node() {
  if [ "$PLATFORM" = "mac" ]; then brew install node
  else curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs; fi
}
if ! command -v node &>/dev/null; then warn "Installing Node.js..."; install_node
else
  NODE_MAJOR=$(node -e "process.stdout.write(process.version.split('.')[0].replace('v',''))")
  if [ "$NODE_MAJOR" -lt 18 ]; then warn "Node v$NODE_MAJOR found, upgrading..."; install_node; fi
fi
ok "Node.js $(node --version) · npm $(npm --version)"

# ─── 4. Git + ITGD aliases ────────────────────────────────────
header "4/8 Checking Git"
if ! command -v git &>/dev/null; then
  warn "Installing Git..."
  [ "$PLATFORM" = "mac" ] && brew install git || (sudo apt-get update -qq && sudo apt-get install -y git)
fi
ok "$(git --version)"
git config --global alias.st status 2>/dev/null || true
git config --global alias.co checkout 2>/dev/null || true
git config --global alias.lg "log --oneline --graph --decorate --all" 2>/dev/null || true
git config --global alias.pf "push --force-with-lease" 2>/dev/null || true
git config --global alias.rbd "rebase origin/develop" 2>/dev/null || true
git config --global alias.undo "reset --soft HEAD~1" 2>/dev/null || true
ok "Git aliases configured (st, co, lg, pf, rbd, undo)"

# ─── 5. Android CLI ───────────────────────────────────────────
header "5/8 Checking Android CLI"
if ! command -v android &>/dev/null; then
  warn "Installing Android CLI..."
  if [ "$PLATFORM" = "mac" ]; then
    (brew tap android/tap && brew trust --tap android/tap && brew install android-cli) 2>/dev/null \
      || warn "Android CLI auto-install failed — download manually from https://developer.android.com/tools/agents/android-cli/download"
  else
    curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash 2>/dev/null \
      || warn "Android CLI auto-install failed — download manually from https://developer.android.com/tools/agents/android-cli/download"
  fi
fi
if command -v android &>/dev/null; then
  ok "Android CLI $(android --version 2>/dev/null || echo 'installed')"
  log "Initialising Android CLI for agents..."
  android init 2>/dev/null || true
  log "Installing all Android Skills..."
  android skills add --all 2>/dev/null || warn "Skills install skipped (requires internet)"
  ok "Android Skills installed"
else
  warn "Android CLI not available — run_android_cli tools will be disabled until it is installed"
fi

# ─── 6. MCP server build ──────────────────────────────────────
header "6/8 Building MCP server"
cd "$SCRIPT_DIR"
npm ci 2>/dev/null || npm install
npm run build
ok "Built → dist/index.js"

# ─── 6b. CLAUDE.md auto-setup ─────────────────────────────────
log "Setting up CLAUDE.md in current directory..."
node "$SCRIPT_DIR/bin/cli.js" setup-claude-md 2>/dev/null || warn "CLAUDE.md setup skipped — run manually: android-dev-mcp setup-claude-md"

# ─── 7. Git hooks ─────────────────────────────────────────────
header "7/8 Installing Git hooks"
if git -C "$SCRIPT_DIR" rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  HOOKS_DIR=$(git -C "$SCRIPT_DIR" rev-parse --git-dir)/hooks
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
COMMIT_MSG=$(cat "$1")
PATTERN="^(feat|fix|perf|refactor|test|chore|docs)(\(.+\))?: .{1,100}"
if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo ""
  echo "[android-dev-mcp] ERROR: Use Conventional Commits format."
  echo "  Example: feat(player): add DRM support"
  exit 1
fi
HOOK
  chmod +x "$HOOKS_DIR/commit-msg"
  ok "Git hooks installed (pre-commit · commit-msg)"
else
  warn "Not inside a Git repo — skipping hooks. Run from your project root to enable."
fi

# ─── 8. Claude Code config ────────────────────────────────────
header "8/8 Configuring Claude Code"
MCP_ENTRY=$(node -e "console.log(JSON.stringify({command:'node',args:['$SCRIPT_DIR/dist/index.js']}))")
mkdir -p "$(dirname "$CLAUDE_CONFIG")"

if [ ! -f "$CLAUDE_CONFIG" ]; then
  echo "{\"mcpServers\":{\"$MCP_NAME\":$MCP_ENTRY}}" > "$CLAUDE_CONFIG"
  ok "Created Claude config at $CLAUDE_CONFIG"
else
  if grep -q "\"$MCP_NAME\"" "$CLAUDE_CONFIG"; then
    warn "'$MCP_NAME' already in Claude config — skipping"
  else
    node -e "
      const fs=require('fs'),c=JSON.parse(fs.readFileSync('$CLAUDE_CONFIG','utf8'));
      c.mcpServers=c.mcpServers||{};
      c.mcpServers['$MCP_NAME']=$MCP_ENTRY;
      fs.writeFileSync('$CLAUDE_CONFIG',JSON.stringify(c,null,2));
    "
    ok "Added '$MCP_NAME' to existing Claude config"
  fi
fi

# ─── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}✔ android-dev-mcp installed successfully!${RESET}"
echo ""
echo -e "  Verify in Claude Code:  ${CYAN}/mcp${RESET}"
echo -e "  Session start:          ${CYAN}get_full_context${RESET}"
echo ""
echo -e "  Knowledge tools (14):   get_full_context · get_architecture_patterns · ..."
echo -e "  CLI tools (5):          run_android_cli · get_live_versions · scaffold_feature · verify_ui · fluidity_debug_workflow"
echo ""
