# UI & Compose Standards — ITGD Mobile

## Versions
- Jetpack Compose BOM: latest stable
- Material 3
- Navigation Compose

## Screen Structure
```kotlin
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    onNavigateToPlayer: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is HomeUiState.Loading -> LoadingIndicator()
        is HomeUiState.Success -> HomeContent(state.items, onNavigateToPlayer)
        is HomeUiState.Error   -> ErrorView(state.message)
    }
}
```

## Theming
- All colors via `MaterialTheme.colorScheme.*` — never hardcoded
- Typography via `MaterialTheme.typography.*`
- Dark/light theme handled at `AppTheme` level only

## Component Rules
| Rule | Detail |
|---|---|
| Reusable components | Live in `ui/components/` |
| Screen-specific composables | Private functions within the screen file |
| Preview | Every composable must have `@Preview` |
| State hoisting | State always hoisted to ViewModel or parent |

## Navigation
```kotlin
// AppNavGraph.kt
NavHost(navController, startDestination = "home") {
    composable("home") { HomeScreen(onNavigateToPlayer = { id -> navController.navigate("player/$id") }) }
    composable("player/{contentId}") { backStackEntry ->
        PlayerScreen(contentId = backStackEntry.arguments?.getString("contentId") ?: "")
    }
}
```

## Player UI
- Player controls overlay as a separate composable `PlayerControlsOverlay`
- Use `DisposableEffect` to manage player lifecycle inside Compose
- Landscape lock on player screen via `SideEffect` + `requestedOrientation`

## Loading / Error States
- Use shared `LoadingIndicator()` and `ErrorView()` components from `ui/components/`
- Never duplicate loading UI per screen
