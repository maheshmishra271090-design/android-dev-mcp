# Project Structure — ITGD Android Mobile (Media/Streaming)

## Module Layout
```
itgd-mobile/
├── app/                        # Main application module
│   ├── src/main/
│   │   ├── java/com/tvtoday/mobile/
│   │   │   ├── di/             # Hilt modules
│   │   │   ├── ui/             # Compose screens & components
│   │   │   │   ├── home/
│   │   │   │   ├── player/
│   │   │   │   ├── search/
│   │   │   │   └── profile/
│   │   │   ├── data/
│   │   │   │   ├── remote/     # Retrofit APIs
│   │   │   │   ├── local/      # Room DB
│   │   │   │   └── repository/
│   │   │   ├── domain/
│   │   │   │   ├── model/
│   │   │   │   └── usecase/
│   │   │   └── util/
│   │   └── res/
├── core/                       # Shared utilities (optional multi-module)
├── player/                     # ExoPlayer / Media3 module (optional)
└── build.gradle.kts
```

## Package Naming Convention
`com.tvtoday.<appname>.<layer>.<feature>`

Example: `com.tvtoday.stream.ui.player`

## File Naming Conventions
| Type | Convention | Example |
|---|---|---|
| ViewModel | `<Feature>ViewModel.kt` | `PlayerViewModel.kt` |
| Screen | `<Feature>Screen.kt` | `HomeScreen.kt` |
| Repository | `<Feature>Repository.kt` | `StreamRepository.kt` |
| UseCase | `<Action><Feature>UseCase.kt` | `GetStreamUrlUseCase.kt` |
| API Service | `<Feature>ApiService.kt` | `ContentApiService.kt` |
| Hilt Module | `<Feature>Module.kt` | `NetworkModule.kt` |

## Key Entry Points
- `MainActivity.kt` — single Activity, hosts NavHost
- `MainApplication.kt` — @HiltAndroidApp
- `AppNavGraph.kt` — all navigation routes defined here
