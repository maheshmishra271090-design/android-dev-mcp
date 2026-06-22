# UI Fluidity Standards — ITGD Mobile

## Target Thresholds
| Metric | Green (Pass) | Yellow (Warn) | Red (Fail) |
|---|---|---|---|
| Frame rate | ≥ 60 fps | 45–59 fps | < 45 fps |
| Janky frames | < 5% | 5–10% | > 10% |
| Recompositions per interaction | < 3 | 3–6 | > 6 |
| Scroll smoothness (RecyclerView/LazyColumn) | < 2 ms/frame | 2–4 ms | > 4 ms |
| Cold start time | < 1.5 s | 1.5–2.5 s | > 2.5 s |
| Warm start time | < 500 ms | 500–800 ms | > 800 ms |

---

## 1. Frame Rate & Janky Frames

### ADB Command (live measurement)
```bash
# Start measuring jank for your app
adb shell dumpsys gfxinfo com.tvtoday.mobile reset

# Trigger UI interaction (scroll, navigate), then capture
adb shell dumpsys gfxinfo com.tvtoday.mobile

# Key lines to read:
# "Janky frames: X (Y%)"
# "50th percentile: Xms"
# "90th percentile: Xms"
# "99th percentile: Xms"
```

### Automated via Macrobenchmark
```kotlin
// benchmark/src/androidTest/java/FrameRateBenchmark.kt
@RunWith(AndroidJUnit4::class)
class FrameRateBenchmark {

    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun scrollFeedFrameRate() = benchmarkRule.measureRepeated(
        packageName = "com.tvtoday.mobile",
        metrics = listOf(FrameTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.WARM,
        setupBlock = {
            pressHome()
            startActivityAndWait()
        }
    ) {
        // Scroll the home feed
        val feed = device.findObject(By.res("home_feed"))
        feed.setGestureMargin(device.displayWidth / 5)
        feed.fling(Direction.DOWN)
        device.waitForIdle()
    }
}
```

### ITGD Pass Criteria
- `frameRate` ≥ 60 fps
- `frameOverrunMs` p90 < 8 ms (half a frame at 60 fps)

---

## 2. Recomposition Count

### Layout Inspector (Manual)
1. Run app in debug
2. Android Studio → Layout Inspector → Enable "Show recomposition counts"
3. Interact with screen
4. Red highlight = recomposing too frequently

### Compose Recomposition Tracking (Code)
```kotlin
// Add to any composable under investigation
@Composable
fun HomeScreen(...) {
    val recomposeCount = remember { mutableIntStateOf(0) }
    SideEffect { recomposeCount.intValue++ }
    if (BuildConfig.DEBUG) {
        Text("Recompositions: ${recomposeCount.intValue}",
             color = Color.Red, fontSize = 10.sp)
    }
    // ... rest of screen
}
```

### Common Fixes
| Problem | Fix |
|---|---|
| Unstable lambda causing recompose | Wrap in `remember { {} }` or move to ViewModel |
| Data class not stable | Add `@Stable` annotation or use `@Immutable` |
| Reading State too high | Move `state.collectAsState()` lower in tree |
| List recomposing on each item | Use `key(item.id)` in `LazyColumn` |

---

## 3. Scroll Smoothness

### LazyColumn Best Practices (ITGD Standard)
```kotlin
LazyColumn(
    state = rememberLazyListState()
) {
    items(
        items = contentList,
        key = { item -> item.id }           // stable keys — prevents full recompose
    ) { item ->
        ContentCard(
            item = item,
            modifier = Modifier.animateItem() // smooth add/remove animations
        )
    }
}
```

### ADB Scroll Test
```bash
# Simulate fling scroll and measure frame timing
adb shell input swipe 540 1500 540 500 300   # fast fling
adb shell dumpsys gfxinfo com.tvtoday.mobile | grep -E "Janky|percentile"
```

### Macrobenchmark — Scroll
```kotlin
@Test
fun homeScrollSmoothness() = benchmarkRule.measureRepeated(
    packageName = "com.tvtoday.mobile",
    metrics = listOf(FrameTimingMetric()),
    iterations = 5,
    startupMode = StartupMode.WARM
) {
    val list = device.findObject(By.res("home_feed"))
    repeat(3) {
        list.fling(Direction.DOWN)
        device.waitForIdle(1000)
    }
}
```

---

## 4. Startup Time

### ADB Cold Start Measurement
```bash
# Force stop app first (cold start)
adb shell am force-stop com.tvtoday.mobile

# Launch and measure
adb shell am start-activity -W \
    -n com.tvtoday.mobile/.ui.MainActivity \
    | grep -E "TotalTime|WaitTime"

# Output:
# TotalTime: 1243   ← this is your cold start time in ms
# WaitTime: 1250
```

### Macrobenchmark — Startup
```kotlin
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {

    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun coldStartup() = benchmarkRule.measureRepeated(
        packageName = "com.tvtoday.mobile",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.COLD
    ) {
        pressHome()
        startActivityAndWait()
    }

    @Test
    fun warmStartup() = benchmarkRule.measureRepeated(
        packageName = "com.tvtoday.mobile",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.WARM
    ) {
        startActivityAndWait()
    }
}
```

### Startup Optimisation Rules (ITGD)
- No heavy work in `Application.onCreate()` — defer with `WorkManager` or lazy init
- Hilt init is synchronous — keep `@Singleton` providers lightweight
- Use Baseline Profiles for release builds (see `baselineprofile` module)

---

## MCP Tool Usage
Claude Code can call `check_ui_fluidity` with a `screen` parameter to get screen-specific guidance:
- `"home"` → LazyColumn scroll + feed recomposition checks
- `"player"` → Frame timing during playback + surface rendering
- `"search"` → Keyboard + list scroll combined
- `"all"` → Full audit checklist

---

## 5. ACR Crash Analysis

### What is ACR?
ACR (Android Crash Reporter / Automated Crash Reporting) captures crash metadata — stack traces, memory snapshots, ANR traces, and device state — that correlates directly with UI fluidity failures. Many jank and freeze issues surface as ANRs or fatal crashes under load.

### 4-Step ACR Debug Workflow (ITGD Standard)

**Step 1 — Metadata**
```bash
adb shell dumpsys meminfo com.tvtoday.mobile
adb shell dumpsys activity com.tvtoday.mobile
# Check: "Native Heap" > 80% = GC jank risk
# Check: leaked Activities = memory leak → eventual OOM crash
```

**Step 2 — Stack Trace**
```bash
adb pull /data/anr/traces.txt ./traces.txt
adb logcat -d -v time | grep -E "FATAL|AndroidRuntime|ANR" | tail -50
# "Input dispatching timed out" → main thread blocked > 5s (ANR)
# "Skipped XX frames"           → main thread doing heavy work
# "OutOfMemoryError"            → bitmap not recycled / memory leak
```

**Step 3 — Memory Snapshot**
```bash
adb shell am dumpheap com.tvtoday.mobile /data/local/tmp/heap.hprof
adb pull /data/local/tmp/heap.hprof ./heap.hprof
# Open in Android Studio → Memory Profiler → Load from file
# Look for: retained Bitmaps, multiple ExoPlayer instances, leaked ViewModels
```

**Step 4 — Source Correlation**
```bash
java -jar retrace.jar mapping.txt obfuscated-trace.txt
adb shell dumpsys gfxinfo com.tvtoday.mobile | grep -E "Janky|percentile|Total frames"
```

### ACR → Fluidity Correlation Table

| ACR Signal | Fluidity Impact | Fix |
|---|---|---|
| ANR in main thread | Total UI freeze > 5s | Move work to Dispatchers.IO |
| `Skipped 60+ frames` in logcat | Severe jank burst | Profile with Systrace, remove main-thread work |
| OOM crash after long session | Memory-induced jank before crash | Fix Bitmap recycling, release ExoPlayer in onDispose |
| `InputDispatchingTimedOut` on player | Player controls unresponsive | Check ExoPlayer prepare() not blocking main thread |
| High GC pressure in heap dump | Frame drops during GC pauses | Reduce object creation in Compose recomposition lambdas |
| Multiple ExoPlayer instances in heap | Janky playback, audio glitches | Single player per screen — release in DisposableEffect |

### ACR + Macrobenchmark Combined Workflow
```bash
# 1. Baseline frame timing
./gradlew :benchmark:connectedAndroidTest

# 2. Simulate memory pressure
adb shell am send-trim-memory com.tvtoday.mobile RUNNING_CRITICAL

# 3. Check if jank increases
adb shell dumpsys gfxinfo com.tvtoday.mobile | grep "Janky frames"

# 4. If spikes → pull heap dump
adb shell am dumpheap com.tvtoday.mobile /data/local/tmp/heap.hprof
adb pull /data/local/tmp/heap.hprof .
```

### Player-Specific ACR Patterns
```bash
adb logcat -d | grep -E "ExoPlayer|MediaCodec|DRM|Widevine" | tail -30
# "MediaCodecVideoRenderer error"  → hardware decoder crash → falls back to SW
# "DrmSessionException"            → Widevine license expired or network error
# "LoadException"                  → HLS segment 404/timeout → check stream URL
# "UnrecognizedInputFormatException" → MIME mismatch → verify setMimeType() call
```
