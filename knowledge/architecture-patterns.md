# Architecture Patterns — ITGD Mobile

## Stack
- **Architecture:** MVVM + Clean Architecture (Domain layer optional)
- **DI:** Hilt
- **Async:** Kotlin Coroutines + Flow
- **State:** StateFlow / UiState sealed class

## ViewModel Convention
```kotlin
@HiltViewModel
class PlayerViewModel @Inject constructor(
    private val getStreamUrlUseCase: GetStreamUrlUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<PlayerUiState>(PlayerUiState.Loading)
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()

    fun loadStream(contentId: String) {
        viewModelScope.launch {
            _uiState.value = PlayerUiState.Loading
            getStreamUrlUseCase(contentId)
                .onSuccess { _uiState.value = PlayerUiState.Ready(it) }
                .onFailure { _uiState.value = PlayerUiState.Error(it.message) }
        }
    }
}

sealed class PlayerUiState {
    object Loading : PlayerUiState()
    data class Ready(val streamUrl: String) : PlayerUiState()
    data class Error(val message: String?) : PlayerUiState()
}
```

## Hilt Module Setup
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides @Singleton
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor())
        .build()

    @Provides @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.BASE_URL)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
}
```

## Coroutine Scope Rules
| Scope | Use For |
|---|---|
| `viewModelScope` | All ViewModel async work |
| `lifecycleScope` | UI-bound coroutines in Activity/Fragment |
| `Dispatchers.IO` | Network / DB calls |
| `Dispatchers.Main` | UI updates |

## Repository Pattern
- Repository is the single source of truth
- Always returns `Result<T>` or `Flow<T>`
- Never expose raw API models to ViewModel — map to domain models

## UseCase Rules
- One public `invoke()` operator function
- Single responsibility
- Inject only repositories, not API services directly
