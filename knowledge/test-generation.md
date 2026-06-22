# Test Generation Templates — ITGD Mobile

## Stack
- **Unit tests:** JUnit 4, MockK, Kotlin Coroutines Test, Turbine (Flow testing)
- **UI tests:** Compose Testing, Hilt Testing
- **Integration tests:** MockWebServer (OkHttp), Hilt

## Dependencies (build.gradle.kts)
```kotlin
// Unit
testImplementation("junit:junit:4.13.2")
testImplementation("io.mockk:mockk:1.13.10")
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
testImplementation("app.cash.turbine:turbine:1.1.0")

// UI / Compose
androidTestImplementation("androidx.compose.ui:ui-test-junit4")
androidTestImplementation("com.google.dagger:hilt-android-testing:2.51")
debugImplementation("androidx.compose.ui:ui-test-manifest")

// Integration
androidTestImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
```

---

## 1. ViewModel Unit Test Template

```kotlin
// test/java/com/tvtoday/mobile/ui/<feature>/<Feature>ViewModelTest.kt
@OptIn(ExperimentalCoroutinesApi::class)
class PlayerViewModelTest {

    // Replace main dispatcher with test dispatcher
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    // Mock dependencies
    private val getStreamUrlUseCase: GetStreamUrlUseCase = mockk()
    private lateinit var viewModel: PlayerViewModel

    @Before
    fun setup() {
        viewModel = PlayerViewModel(getStreamUrlUseCase)
    }

    @Test
    fun `loadStream emits Ready state on success`() = runTest {
        // Arrange
        val fakeUrl = "https://stream.tvtoday.in/live.m3u8"
        coEvery { getStreamUrlUseCase("content123") } returns Result.success(fakeUrl)

        // Act & Assert (Turbine)
        viewModel.uiState.test {
            viewModel.loadStream("content123")
            assertEquals(PlayerUiState.Loading, awaitItem())
            assertEquals(PlayerUiState.Ready(fakeUrl), awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `loadStream emits Error state on failure`() = runTest {
        coEvery { getStreamUrlUseCase(any()) } returns Result.failure(Exception("Network error"))

        viewModel.uiState.test {
            viewModel.loadStream("content123")
            awaitItem() // Loading
            val error = awaitItem()
            assertTrue(error is PlayerUiState.Error)
            cancelAndIgnoreRemainingEvents()
        }
    }
}

// Helper — MainDispatcherRule.kt (add once to test utilities)
class MainDispatcherRule(
    private val dispatcher: TestCoroutineDispatcher = TestCoroutineDispatcher()
) : TestWatcher() {
    override fun starting(description: Description) = Dispatchers.setMain(dispatcher)
    override fun finished(description: Description) = Dispatchers.resetMain()
}
```

---

## 2. Repository Unit Test Template

```kotlin
// test/java/com/tvtoday/mobile/data/repository/StreamRepositoryTest.kt
@OptIn(ExperimentalCoroutinesApi::class)
class StreamRepositoryTest {

    private val contentApiService: ContentApiService = mockk()
    private lateinit var repository: StreamRepository

    @Before
    fun setup() {
        repository = StreamRepositoryImpl(contentApiService)
    }

    @Test
    fun `getStreamUrl returns success when API succeeds`() = runTest {
        // Arrange
        val response = StreamUrlResponse(url = "https://stream.tvtoday.in/live.m3u8", drmLicenseUrl = null)
        coEvery { contentApiService.getStreamUrl("content123") } returns response

        // Act
        val result = repository.getStreamUrl("content123")

        // Assert
        assertTrue(result.isSuccess)
        assertEquals("https://stream.tvtoday.in/live.m3u8", result.getOrNull())
    }

    @Test
    fun `getStreamUrl returns failure when API throws`() = runTest {
        coEvery { contentApiService.getStreamUrl(any()) } throws IOException("Timeout")

        val result = repository.getStreamUrl("content123")

        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is IOException)
    }

    @Test
    fun `getHomeFeed maps DTO to domain model correctly`() = runTest {
        val dto = HomeFeedResponse(items = listOf(ContentDto(id = "1", title = "News at 9", thumbnailUrl = "https://img.tvtoday.in/1.jpg")))
        coEvery { contentApiService.getHomeFeed() } returns dto

        val result = repository.getHomeFeed()

        assertTrue(result.isSuccess)
        val items = result.getOrNull()!!
        assertEquals("1", items.first().id)
        assertEquals("News at 9", items.first().title)
    }
}
```

---

## 3. Compose UI Test Template

```kotlin
// androidTest/java/com/tvtoday/mobile/ui/<feature>/<Feature>ScreenTest.kt
@HiltAndroidTest
class HomeScreenTest {

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Before
    fun setup() {
        hiltRule.inject()
    }

    @Test
    fun homeScreen_showsLoadingIndicator_initially() {
        composeRule.onNodeWithTag("loading_indicator").assertIsDisplayed()
    }

    @Test
    fun homeScreen_showsContentList_afterLoad() {
        // Wait for data
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("content_card").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onAllNodesWithTag("content_card").onFirst().assertIsDisplayed()
    }

    @Test
    fun homeScreen_navigatesToPlayer_onContentTap() {
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("content_card").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onAllNodesWithTag("content_card").onFirst().performClick()
        composeRule.onNodeWithTag("player_screen").assertIsDisplayed()
    }

    @Test
    fun homeScreen_showsError_onNetworkFailure() {
        // Requires Hilt test module injecting a failing fake repository
        composeRule.onNodeWithTag("error_view").assertIsDisplayed()
    }
}
```

### Semantic Tags Convention
Add `Modifier.testTag("...")` to all key composables:
| Composable | testTag |
|---|---|
| `LoadingIndicator` | `"loading_indicator"` |
| `ErrorView` | `"error_view"` |
| `ContentCard` | `"content_card"` |
| `PlayerScreen` | `"player_screen"` |
| Home feed `LazyColumn` | `"home_feed"` |

---

## 4. API / Retrofit Integration Test Template

```kotlin
// androidTest/java/com/tvtoday/mobile/data/remote/ContentApiServiceTest.kt
class ContentApiServiceTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var apiService: ContentApiService

    @Before
    fun setup() {
        mockWebServer = MockWebServer()
        mockWebServer.start()

        val retrofit = Retrofit.Builder()
            .baseUrl(mockWebServer.url("/"))
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        apiService = retrofit.create(ContentApiService::class.java)
    }

    @After
    fun teardown() {
        mockWebServer.shutdown()
    }

    @Test
    fun getStreamUrl_parsesResponseCorrectly() = runTest {
        // Enqueue a mock response
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody("""{"url":"https://stream.tvtoday.in/live.m3u8","drmLicenseUrl":null}""")
                .addHeader("Content-Type", "application/json")
        )

        val response = apiService.getStreamUrl("content123")

        assertEquals("https://stream.tvtoday.in/live.m3u8", response.url)
        assertNull(response.drmLicenseUrl)
    }

    @Test
    fun getStreamUrl_sendsCorrectPath() = runTest {
        mockWebServer.enqueue(MockResponse().setResponseCode(200).setBody("""{"url":"x","drmLicenseUrl":null}"""))

        apiService.getStreamUrl("abc99")

        val request = mockWebServer.takeRequest()
        assertEquals("/v1/stream/abc99", request.path)
    }

    @Test
    fun getHomeFeed_returns401_throwsHttpException() = runTest {
        mockWebServer.enqueue(MockResponse().setResponseCode(401))

        assertThrows(HttpException::class.java) {
            runBlocking { apiService.getHomeFeed() }
        }
    }
}
```

---

## MCP Tool Usage
Claude Code calls `generate_tests` with a `target` parameter:
- `"viewmodel:<ClassName>"` → Generates ViewModel test file
- `"repository:<ClassName>"` → Generates Repository test file
- `"ui:<ScreenName>"` → Generates Compose UI test file
- `"api:<ServiceName>"` → Generates Retrofit integration test file
- `"all"` → Returns all templates with guidance on where to place files
