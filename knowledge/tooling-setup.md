# Tooling Setup — Token Optimization Tools for Claude Code

## Overview

| Tool | Type | Token Reduction | Install Time |
|---|---|---|---|
| Graphify | Knowledge graph | Up to 40× per navigation | ~10 min |
| RTK (Repo to Knowledge) | Codebase summariser | 30–50% session reduction | ~5 min |
| Caveman | Context pruner | 20–40% per session | ~5 min |
| Superpowers Plugin | Claude Code extension | Varies | ~5 min |

---

## 1. Graphify

### What it does
Converts your codebase into a queryable knowledge graph. A PreToolUse hook intercepts every Glob/Grep call and injects graph context — directing Claude straight to the right file instead of exploring blindly.

### When to use
- Project has **100+ files** (minimal benefit below 30–50)
- Claude keeps running expensive Glob/Grep searches at session start
- You want to reduce navigation cost from ~8,000 to ~210 tokens

### Install
```bash
pip install graphifyy          # note: double-y
graphify install
graphify claude install        # adds PreToolUse hook to Claude Code
```

### Build the graph
```bash
cd your-android-project
graphify run                   # first build: ~90s on 50K-line project
graphify run --watch           # auto-rebuild on file changes
```

### Verify
```bash
graphify status                # shows graph stats and hook status
```

### ITGD Note
On the Vega OS TV project (340 files): navigation dropped from 8 tool calls / ~8,400 tokens → 1 call / ~210 tokens per task. For a similar-sized Android mobile project, expect similar results.

---

## 2. RTK (Repo to Knowledge)

### What it does
Generates a compressed, Claude-readable summary of your entire repository. Instead of Claude reading raw source files, it reads RTK's structured summary — 30–50% fewer tokens for context-heavy tasks.

### Install
```bash
npm install -g repo-to-knowledge
```

### Generate summary
```bash
cd your-android-project
rtk generate                   # outputs knowledge.md in project root
rtk generate --output .claude/knowledge.md   # recommended location
```

### Use in Claude Code
Reference in CLAUDE.md:
```markdown
## Codebase Summary
See .claude/knowledge.md for a compressed summary of the project structure.
Always read this before exploring the codebase.
```

### Regenerate when
- After adding a new module
- After major refactor
- Run `rtk generate` as part of your CI pipeline to keep it current

---

## 3. Caveman

### What it does
Strips Claude Code context of irrelevant turns — removes tool results, old file contents, and noise that accumulated mid-session. Reduces context size by 20–40% without losing the thread.

### Install
```bash
npm install -g caveman-context
```

### Usage (inside Claude Code)
```bash
caveman prune                  # auto-prune current session context
caveman prune --keep-last 10   # keep only last 10 meaningful turns
caveman status                 # show current context size + savings estimate
```

### When to run
- After a long debug session before starting new code
- When you notice Claude referencing stale file versions
- Before pasting a large new file (pre-prune to make room)

---

## 4. Superpowers Plugin

### What it does
A Claude Code extension that adds token usage visibility, session analytics, and quick-action shortcuts. Helps your team spot expensive sessions and build better habits.

### Install
```bash
claude install superpowers
```

### Key features
| Feature | What it shows |
|---|---|
| Token counter | Live token usage in session sidebar |
| Session cost estimate | Approximate cost based on model + tokens |
| Expensive call alerts | Warns when a single tool call > 2,000 tokens |
| Quick /compact trigger | One-click compact when approaching 80% context |

---

## Recommended Install Order (ITGD Team)
```
1. RTK          → generate knowledge.md for the project
2. Graphify     → install + build graph (if project > 100 files)
3. Caveman      → add to Claude Code workflow
4. Superpowers  → install for visibility
```

Total setup time: ~25 minutes per developer.

## Full Stack Token Saving Estimate (ITGD Mobile project)

| Layer | Technique | Saving |
|---|---|---|
| MCP server | get_full_context instead of blind exploration | ~10,000 tk/session |
| Graphify | Navigation via graph instead of Glob/Grep | ~8,000 tk/task |
| RTK | Compressed repo summary | ~3,000 tk/session |
| Caveman | Context pruning mid-session | ~5,000 tk/session |
| Prompt hygiene | Scoped prompts, Ask CIO format | ~2,000 tk/task |
| Model routing | Haiku for simple tasks | ~60% cost reduction on those tasks |

Combined: **50–70% reduction** in total token spend vs. no optimisation.
