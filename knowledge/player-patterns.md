# Player Patterns — ITGD Mobile (ExoPlayer / Media3)

## Library
```kotlin
// build.gradle.kts
implementation("androidx.media3:media3-exoplayer:1.3.1")
implementation("androidx.media3:media3-exoplayer-hls:1.3.1")
implementation("androidx.media3:media3-exoplayer-dash:1.3.1")
implementation("androidx.media3:media3-ui:1.3.1")
implementation("androidx.media3:media3-datasource-okhttp:1.3.1")
```

## Player Initialization
```kotlin
val player = ExoPlayer.Builder(context)
    .setLoadControl(
        DefaultLoadControl.Builder()
            .setBufferDurationsMs(
                /* minBuffer */  15_000,
                /* maxBuffer */  50_000,
                /* playback  */   2_500,
                /* rebuffer  */   5_000
            )
            .build()
    )
    .build()
```

## HLS Playback
```kotlin
val mediaItem = MediaItem.Builder()
    .setUri(streamUrl)
    .setMimeType(MimeTypes.APPLICATION_M3U8)
    .build()
player.setMediaItem(mediaItem)
player.prepare()
player.playWhenReady = true
```

## DRM (Widevine)
```kotlin
val mediaItem = MediaItem.Builder()
    .setUri(streamUrl)
    .setDrmConfiguration(
        MediaItem.DrmConfiguration.Builder(C.WIDEVINE_UUID)
            .setLicenseUri(drmLicenseUrl)
            .setLicenseRequestHeaders(mapOf("Authorization" to "Bearer $token"))
            .build()
    )
    .build()
```

## Lifecycle Management in Compose
```kotlin
val player = remember { ExoPlayer.Builder(context).build() }

DisposableEffect(Unit) {
    onDispose {
        player.release()
    }
}

// Pause/resume with lifecycle
val lifecycle = LocalLifecycleOwner.current.lifecycle
DisposableEffect(lifecycle) {
    val observer = LifecycleEventObserver { _, event ->
        when (event) {
            Lifecycle.Event.ON_PAUSE -> player.pause()
            Lifecycle.Event.ON_RESUME -> player.play()
            else -> {}
        }
    }
    lifecycle.addObserver(observer)
    onDispose { lifecycle.removeObserver(observer) }
}
```

## Player State Rules
- Player instance owned by ViewModel (survives recomposition)
- Expose playback state as `StateFlow<PlaybackState>` to UI
- Never hold player reference in Composable — pass via `AndroidView` or `PlayerView`

## Quality Selection
- Default: `TrackSelectionParameters.DEFAULT` (auto adaptive)
- Manual: override via `player.trackSelectionParameters`
