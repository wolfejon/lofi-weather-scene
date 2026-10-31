# Tiny Weather Window 🌸🌻🍂❄️

Two cozy 16-bit pixel scenes that follow your real weather, season, and time of day, with gentle generative lofi music.

| Page | What it is |
|---|---|
| `index.html` (**Village**) | A little village with critters and cyclists wandering by, weather and seasonal particles, a robin that lands on fences and roofs, a steaming kettle chimney, distant windows that twinkle at night, and a seasonal sticker on one cottage window. |
| `bookstore.html` (**Bookstore**) | Inside a cozy bookshop: shelves, book stacks, lamps, a rug, and a big window onto the street outside. Rain runs down the glass, snow or leaves drift past, and fog or storms roll by. On a leather loveseat under a shared blanket, he reads (brown hair and a beard) while she sleeps curled on his chest (dark brown bob). Her red glasses sit on the side table. Little z's float up, she shifts and sighs now and then, and he glances over. The shop cat strolls the floor or the windowsill behind the couch, stopping to sit or stretch. Little touches: he strokes her hair now and then, their hands find each other under the blanket, he smiles softly when he glances at her, a ribbon bookmark sways when he turns a page, the candle sometimes glints off her glasses, a moth circles the table lamp at night, and sometimes the cat hops up to curl on the blanket by their feet. |

Each page has a nav button that goes to the other one.

## Open it
- Live: https://wolfejon.github.io/lofi-weather-scene/ and https://wolfejon.github.io/lofi-weather-scene/bookstore.html
- Local: `python3 -m http.server 8080` in this folder, then open `http://localhost:8080`. Allow location for local weather. If you don't, it guesses from your time zone.

## Controls (both pages)
- **Start lofi sound** starts or mutes the music (browsers block autoplay). While it plays you get:
  - **Track picker**: 🌧️ Soft Rain Piano · 🌆 Warm Evening Keys · 🌙 Midnight Walk · ☕ Sunday Dust · 🪟 Window Seat (a 6/8 waltz with brushes). Your last pick is remembered.
  - **Now playing** label, a **volume** slider, and an optional **🎞️ dust** toggle for very faint record texture. It's off by default, so there's no hiss.
- **✨ pretend chips** for season / weather / day–night. Set them back to `auto` for real conditions.
- Village: **tap** to call over a friend. Bookstore: **tap the couple** and she stirs and sighs. **Tap elsewhere** and the cat wanders by.
- **Double-tap** hides the UI.
- URL presets: `bookstore.html?season=winter&weather=snow&time=night`

## Sound
- Synthesized live with Web Audio. There are no samples, no constant crackle, and no hiss.
- Keys use detuned triangle/sine voices with a feedback-delay "room" reverb. Underneath are a sine bass, soft kick and snare, and gentle lowpassed hats.
- A soft brown-noise rain bed plays only when it's raining or stormy. A gentle wind whoosh plays only in storms or real winds of 25 km/h or more. Distant thunder comes with storms.
- In the bookstore, her sigh is a soft breathy swell.

## How it works
- `weather.js` handles shared weather, season, palettes and location. It uses Open-Meteo (no key), BigDataCloud for the place name, and falls back to your time zone. Season comes from latitude + month, so the southern hemisphere is flipped.
- `lofi.js` is the shared generative music engine and the track/volume UI.
- `bookstore.js` draws the bookstore scene. The village scene is inline in `index.html`.
- Everything is drawn on a low-res Canvas and scaled up crisp. It fills the screen on phones.
- Respects `prefers-reduced-motion` with fewer particles, slower motion, and no lightning flashes.

No build, no dependencies.
