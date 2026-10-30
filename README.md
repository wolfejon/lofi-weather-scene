# Tiny Weather Window 🌸🌻🍂❄️

A cozy, 16-bit-style pixel village that matches your real weather, season, and time of day, with gentle generative lofi music.

## Open it
- **On your computer:** double-click `index.html` (any modern browser). Allow location for local weather. If you say no, it guesses from your time zone (or uses Seattle).
- **On your phone:** open the hosted URL (if published), or serve the folder: `python3 -m http.server 8080`, then go to `http://<your-ip>:8080`.

## Controls
- **Start lofi sound**: tap to start or mute the music (browsers block autoplay). A volume slider shows up while it plays.
- **✨ play with the weather**: pretend chips for season / weather / day–night. Set them back to `auto` for real conditions.
- **Tap the scene** to call over a friend (cat, fox, bunny, or cyclist). **Double-tap** to hide the UI.
- URL presets: `index.html?season=winter&weather=snow&time=night`

## How it works
- Weather comes from Open-Meteo (no key). Place name comes from BigDataCloud's free client reverse-geocode. Both are best-effort, so animation and music work offline.
- Season comes from latitude + month, so the southern hemisphere is flipped.
- Everything is drawn on a low-res Canvas and scaled up crisp. The music is made live with Web Audio: jazzy 7th-chord progressions that change with the season, swung keys, a sine bass, soft drums, vinyl crackle, and a rain bed.
- Respects `prefers-reduced-motion` (fewer particles, slower motion, no lightning flashes).

Single file, no build, no dependencies.
