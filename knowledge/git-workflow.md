# Git Workflow — ITGD Mobile

## Branch Strategy
| Branch | Purpose | Merge Target |
|---|---|---|
| `main` | Production-ready code only | — |
| `develop` | Integration branch | `main` (via release) |
| `feature/<ticket>-<description>` | New features | `develop` |
| `fix/<ticket>-<description>` | Bug fixes | `develop` |
| `hotfix/<ticket>-<description>` | Critical prod fixes | `main` + `develop` |
| `release/<version>` | Release prep | `main` + `develop` |

### Examples
```
feature/ITGD-142-player-drm-support
fix/ITGD-156-home-scroll-jank
hotfix/ITGD-160-crash-on-launch
release/1.3.0
```

---

## Commit Message Format (Conventional Commits)
```
<type>(<scope>): <short description>

[optional body]
[optional footer: ITGD-<ticket>]
```

### Types
| Type | Use For |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `refactor` | Code refactor (no behaviour change) |
| `test` | Adding/updating tests |
| `chore` | Build, deps, CI changes |
| `docs` | Documentation only |

### Examples
```
feat(player): add Widevine DRM support for premium streams

fix(home): resolve LazyColumn recomposition on feed refresh

perf(player): reduce cold start time by deferring Hilt init

test(repository): add MockWebServer tests for StreamRepository

chore(deps): upgrade Media3 to 1.3.1
```

---

## Daily Git Commands

### Feature workflow
```bash
# Start a feature
git checkout develop
git pull origin develop
git checkout -b feature/ITGD-142-player-drm-support

# During work — commit often
git add -p                          # stage hunks interactively
git commit -m "feat(player): add DRM license URL extraction"

# Push and open PR
git push -u origin feature/ITGD-142-player-drm-support
```

### Keeping branch up to date
```bash
git fetch origin
git rebase origin/develop           # preferred over merge — keeps history clean
```

### Before PR — clean up commits
```bash
git rebase -i origin/develop        # squash WIP commits into logical units
```

---

## PR Checklist (ITGD Standard)
- [ ] Branch rebased on latest `develop`
- [ ] Lint passes (`./gradlew lint`)
- [ ] Unit tests pass (`./gradlew test`)
- [ ] No new recomposition warnings in Layout Inspector
- [ ] Commit messages follow Conventional Commits format
- [ ] PR title matches: `[ITGD-<ticket>] <description>`

---

## Git Hooks (via the install script)

### pre-commit — auto lint + test
```bash
#!/bin/sh
echo "Running lint..."
./gradlew lint --quiet || exit 1
echo "Running unit tests..."
./gradlew test --quiet || exit 1
echo "Pre-commit checks passed."
```

### commit-msg — enforce Conventional Commits
```bash
#!/bin/sh
COMMIT_MSG=$(cat "$1")
PATTERN="^(feat|fix|perf|refactor|test|chore|docs)(\(.+\))?: .{1,100}"
if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo "ERROR: Commit message must follow Conventional Commits format."
  echo "Example: feat(player): add DRM support"
  exit 1
fi
```

---

## Useful Aliases (added by install script to ~/.gitconfig)
```ini
[alias]
  st = status
  co = checkout
  lg = log --oneline --graph --decorate --all
  pf = push --force-with-lease        # safe force push
  rbd = rebase origin/develop
  undo = reset --soft HEAD~1
```
