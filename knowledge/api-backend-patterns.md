# API & Backend Patterns — ITGD Mobile

## Networking Stack
- **HTTP Client:** Retrofit 2 + OkHttp
- **Serialization:** Gson (or Kotlinx Serialization — update if changed)
- **Auth:** Bearer token via `AuthInterceptor`
- **Base URL:** Defined in `BuildConfig.BASE_URL` per flavor

## API Service Interface
```kotlin
interface ContentApiService {

    @GET("v1/content/{id}")
    suspend fun getContent(@Path("id") id: String): ContentResponse

    @GET("v1/stream/{id}")
    suspend fun getStreamUrl(
        @Path("id") id: String,
        @Query("quality") quality: String = "auto"
    ): StreamUrlResponse

    @GET("v1/home/feed")
    suspend fun getHomeFeed(): HomeFeedResponse
}
```

## Auth Interceptor
```kotlin
class AuthInterceptor @Inject constructor(
    private val tokenProvider: TokenProvider
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer ${tokenProvider.getToken()}")
            .build()
        return chain.proceed(request)
    }
}
```

## Response Handling
- All API responses wrapped in `Result<T>` at repository layer
- Map DTO → Domain model inside repository, never in ViewModel
```kotlin
override suspend fun getStreamUrl(id: String): Result<StreamUrl> = runCatching {
    val response = contentApiService.getStreamUrl(id)
    response.toDomain()   // extension function maps DTO → domain
}
```

## Streaming / Media API
- Stream URL endpoint returns signed URL valid for 4 hours
- Refresh token before expiry using OkHttp `Authenticator`
- DRM license URL returned alongside stream URL in `StreamUrlResponse`

## Error Handling
| HTTP Code | Handling |
|---|---|
| 401 | Refresh token → retry once → force logout |
| 403 | Show "not subscribed" paywall screen |
| 404 | Show "content unavailable" |
| 5xx | Retry with exponential backoff (max 3 attempts) |
