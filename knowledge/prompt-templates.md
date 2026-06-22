# Prompt Templates — ITGD Mobile Token Optimization

## Ask CIO Framework
Format every Claude Code prompt as:
```
ASK:     What you want Claude to do (one clear sentence)
CONTEXT: Relevant files, current state, constraints
INPUT:   The actual code / error / data to work with
OUTPUT:  Exact format you want back (file path, function, PR description, etc.)
```

### Example — Add a new screen
```
ASK:     Add a SearchScreen with ViewModel and Retrofit integration
CONTEXT: Follow MVVM pattern, Hilt DI, StateFlow<SearchUiState>. Screen goes in ui/search/. Use shared LoadingIndicator() and ErrorView() components.
INPUT:   ContentApiService already has GET /v1/search?q= endpoint returning List<ContentDto>
OUTPUT:  Three files: SearchScreen.kt, SearchViewModel.kt, SearchRepository.kt — no other files
```

### Example — Fix a bug
```
ASK:     Fix janky scroll on HomeScreen LazyColumn
CONTEXT: Running on Pixel 6, Android 14. Jank appears when feed has 50+ items. No Graphify installed.
INPUT:   [paste HomeScreen.kt]
OUTPUT:  Patched HomeScreen.kt only — explain the root cause in 2 sentences above the diff
```

### Example — Write tests
```
ASK:     Write unit tests for PlayerViewModel
CONTEXT: Uses MockK, Turbine, MainDispatcherRule. Test file goes in test/java/com/tvtoday/mobile/ui/player/
INPUT:   [paste PlayerViewModel.kt]
OUTPUT:  PlayerViewModelTest.kt — cover success, failure, and loading states
```

---

## Few-Shot Chain of Thought (CoT) Template
Teach Claude your reasoning model by showing an example first:

```
Here is how we handle repository errors in this project:

EXAMPLE:
When getStreamUrl() throws IOException:
  → catch in repository with runCatching {}
  → return Result.failure(IOException)
  → ViewModel receives failure → emits PlayerUiState.Error
  → Screen shows ErrorView("Network error. Try again.")

Now apply the same pattern to getHomeFeed() which currently lets exceptions propagate uncaught.
INPUT: [paste StreamRepository.kt]
OUTPUT: Patched getHomeFeed() only
```

---

## Compact Task Patterns
Use these for common repetitive tasks — minimum tokens, maximum precision:

### Rename refactor
```
Rename [OldName] → [NewName] across the project. Update imports. No logic changes.
```

### Add Hilt binding
```
Add @HiltViewModel binding for [FeatureViewModel]. Module: [FeatureModule.kt]. No other changes.
```

### Migrate to StateFlow
```
Migrate [ViewModel] from LiveData to StateFlow<[UiState]>. Keep same states. Update screen collector.
```

### Add test tag
```
Add Modifier.testTag("[tag_name]") to [composable] in [Screen].kt. No other changes.
```

### Bump dependency
```
Update [library] from [old_version] to [new_version] in libs.versions.toml. Run ./gradlew build and report errors only.
```

---

## Anti-Patterns (avoid these — they waste tokens)

| Anti-pattern | Why it wastes tokens | Better alternative |
|---|---|---|
| "Fix all issues in this file" | Claude explores entire file + generates unrequested changes | Specify exact function/line |
| "Review my code" | Open-ended = verbose response | "List only critical bugs in [function]" |
| Pasting entire files | Full file in context even if 90% irrelevant | Paste only the relevant function |
| "Make it better" | Claude guesses intent = multiple passes | State exact metric: "reduce recompositions in HomeScreen to < 3" |
| Asking in separate turns | Each turn re-reads context | Batch related questions into one prompt |

---

## Session Start Template (copy into CLAUDE.md)
```markdown
## Session Start Protocol
1. Call get_full_context from android-mobile-mcp MCP server
2. Ask me what task we are doing today before writing any code
3. Confirm the target file(s) before starting
4. Make only the changes requested — no refactoring unless asked
```
