# android-dev-mcp — Session Protocol

## Stack
Android mobile · Kotlin · MVVM · Hilt · Jetpack Compose · ExoPlayer/Media3 · Retrofit · GitHub Actions

## Session Start (run these in order)
1. Call `get_full_context` from the `android-dev-mcp` MCP server
2. Call `run_android_cli` with command `studio check` to verify Android Studio connection
3. Call `get_live_versions` to load current agp/kotlin/compose/media3 versions
4. Ask me what we are building or fixing today before writing any code

## Rules
- Follow ITGD MVVM conventions from get_full_context — never deviate
- Always run `android studio analyze-file` after generating a new file
- Commit messages must follow Conventional Commits (enforced by pre-commit hook)
- Use `check_ui_fluidity` before and after any UI performance work
- Use `get_model_routing` if unsure which model to use for a task
- Use `fluidity_debug_workflow` for any jank or crash investigation
- Use `scaffold_feature` when adding a new screen or module
- Use `verify_ui` after writing any Compose screen with @Preview

<!-- android-dev-mcp:start -->
## android-dev-mcp Session Protocol

### Session Start (run in order)
1. Call `get_full_context` from the `android-dev-mcp` MCP server
2. Call `run_android_cli` with command `studio check`
3. Call `get_live_versions` to load current dependency versions
4. Ask me what we are building or fixing today before writing any code

### When to use which tool
| Situation | Tool |
|---|---|
| Adding a new screen or module | `scaffold_feature` |
| Player jank, frame drops, crashes | `fluidity_debug_workflow("player")` |
| Written a Compose screen | `verify_ui` |
| Need test templates | `generate_tests("viewmodel:ClassName")` |
| Context getting large | `get_session_hygiene` |
| Unsure which model to use | `get_model_routing("describe task")` |
| Installing optimization tools | `get_tooling_setup` |
<!-- android-dev-mcp:end -->
