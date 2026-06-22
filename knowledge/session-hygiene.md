# Session Hygiene — Claude Code Token Management

## Context Window Facts
| Fact | Value |
|---|---|
| Claude Code context window | ~200K tokens |
| Autocompact triggers at | ~85% full (~170K tokens) |
| After autocompact | Last ~20% retained (~40K tokens) |
| Typical Android file | 200–600 tokens |
| get_full_context cost | ~3,000 tokens (one-time per session) |
| Each MCP tool call | ~500–800 tokens |

---

## /clear vs /compact — Decision Guide

### Use /clear when:
- Switching to a completely unrelated task
- Context has drifted (Claude is referencing wrong files)
- Starting a new feature from scratch
- After a long debug session — clear the noise before writing new code
- Cost: **loses all context** — run get_full_context again after

### Use /compact when:
- Mid-task and context is getting large but you want to continue
- Approaching autocompact threshold (Claude starts forgetting earlier turns)
- Finished a subtask, starting the next phase of the same feature
- Cost: **keeps ~20% of context** — cheaper than /clear but lossy

### Use neither when:
- Session is < 20K tokens (no need to manage yet)
- In the middle of a complex multi-step task (wait until a natural break)

---

## Autocompact Buffer Rules (ITGD Standard)

**Monitor context size** with `/context` in Claude Code — check before large operations.

**Pre-emptive compact triggers:**
- Before pasting a large file (> 500 lines)
- Before starting a new feature within the same session
- After finishing a PR review and moving to coding

**Post-compact checklist:**
```
1. Run get_full_context              ← restore ITGD project knowledge
2. Re-state the current task         ← Claude lost the conversation thread
3. Re-paste the target file if needed ← it may have been compacted away
```

---

## Session Window Management

### Single-task session (recommended)
```
Start → get_full_context → one task → /clear → next session
```
Best token efficiency. Each session is focused and cheap.

### Multi-task session
```
Start → get_full_context → Task A → /compact → re-state Task B → Task B → /clear
```
Use /compact between tasks, not /clear, to preserve ITGD context.

### Long debug session
```
Start → get_full_context → debug loop →
  (if context > 100K tokens) → /compact → get_full_context → continue
```
Refresh ITGD context after every compact in debug sessions.

---

## Token-Heavy Operations — Handle with Care

| Operation | Token cost | Mitigation |
|---|---|---|
| Paste full Kotlin file | 200–600 tk | Paste only the relevant function |
| Stack trace paste | 300–800 tk | Trim to first 20 lines + cause |
| Full `build.gradle.kts` | 400–1000 tk | Paste only the `dependencies {}` block |
| "Review entire PR" | 2000–8000 tk | Review file-by-file in separate sessions |
| Run Glob/Grep without Graphify | 8000–15000 tk | Install Graphify (see get_tooling_setup) |

---

## CLAUDE.md Hygiene Rules
Keep your CLAUDE.md under 500 tokens. Check with:
```bash
wc -w CLAUDE.md   # rough token estimate: words ÷ 0.75
```

**Include in CLAUDE.md:**
- Stack summary (5 lines max)
- Session start protocol (call get_full_context)
- 3–5 project-specific rules Claude must always follow

**Exclude from CLAUDE.md:**
- Full code examples (put in knowledge files, serve via MCP)
- Dependency lists (Claude can read build.gradle.kts directly)
- File trees (Graphify handles this better)
- Anything longer than 2 sentences per rule
