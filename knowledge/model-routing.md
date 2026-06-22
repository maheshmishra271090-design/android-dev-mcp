# Model Routing Guide — ITGD Mobile

## The Three Tiers

| Model | Speed | Cost | Best For |
|---|---|---|---|
| Claude Haiku | Fastest | Cheapest | Simple, repetitive, high-volume |
| Claude Sonnet | Balanced | Mid | Most coding tasks — default choice |
| Claude Opus | Slowest | Most expensive | Complex reasoning, architecture decisions |

---

## Task → Model Decision Table

### Use Haiku for:
| Task | Example |
|---|---|
| Renaming / boilerplate | Rename variable, add import, reformat |
| Simple code generation | Add a data class, write a getter |
| Single-function fixes | Fix a null check, add a null-safety operator |
| Commit message generation | "Write a commit message for this diff" |
| Test data generation | Generate mock ContentDto objects |
| Quick syntax checks | "Is this Kotlin syntax correct?" |
| Log analysis (short) | Parse a 20-line logcat output |

### Use Sonnet for (default):
| Task | Example |
|---|---|
| Feature implementation | Add SearchScreen with ViewModel + Retrofit |
| Bug investigation | Debug a LazyColumn recomposition issue |
| Test writing | Write ViewModel unit tests with MockK + Turbine |
| Code review | Review a PR diff for ITGD standards |
| Refactoring | Migrate LiveData → StateFlow in a ViewModel |
| ExoPlayer integration | Set up HLS playback with DRM |
| CI/CD scripting | Write a GitHub Actions publish workflow |

### Use Opus for:
| Task | Example |
|---|---|
| Architecture decisions | "Should we go multi-module or single module?" |
| Complex debug | Crash with no clear stack trace, intermittent ANR |
| System design | Design the offline playback caching layer |
| Security review | Review auth token handling and storage |
| Performance investigation | Diagnose cold start > 2.5s with multiple potential causes |
| Large codebase refactor | Migrate entire data layer to repository pattern |

---

## ITGD Quick Rule
```
Simple task (< 5 min manually) → Haiku
Most tasks → Sonnet  ← default
Stuck or architectural → Opus
```

## Cost Context (relative)
Haiku ≈ 1x · Sonnet ≈ 5x · Opus ≈ 15x

For a 15-person team:
- Routing 40% of tasks to Haiku saves ~20–30% of total Claude spend
- Opus should be < 5% of total sessions

---

## Model Routing in Claude Code
In Claude Code CLI, switch model per session:
```bash
claude --model claude-haiku-4-5-20251001    # Haiku
claude --model claude-sonnet-4-6             # Sonnet (default)
claude --model claude-opus-4-6              # Opus
```

Or mid-session with `/model` command:
```
/model claude-opus-4-6
```
