/* Tiny Weather Window · Bookstore — cozy 16-bit bookstore interior. Uses weather.js + lofi.js. */
(() => {
'use strict';
const CW = window.CozyWeather;
const { clamp, lerp, rng, mix, palette, NIGHT, LABELS, ICON, SEASON_WORD, seasonFor } = CW;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOTION = reduceMotion ? 0.35 : 1;
const $ = s => document.querySelector(s);

// ---------------------------------------------------------------- state
const state = { auto: { season: null, weather: 'cloudy', night: false, temp: null, code: 3, place: '', wind: 0 }, over: { season: 'auto', weather: 'auto', time: 'auto' }, lat: 47.61, lon: -122.33 };
const eff = () => ({
  season: state.over.season !== 'auto' ? state.over.season : (state.auto.season || seasonFor(state.lat, new Date())),
  weather: state.over.weather !== 'auto' ? state.over.weather : state.auto.weather,
  night: state.over.time !== 'auto' ? state.over.time === 'night' : state.auto.night,
});
const COZY = {
  clear:['sunlight through the window, pages turning','stars outside, lamps on inside'],
  cloudy:['soft grey light, perfect reading weather','a quiet cloudy night in the shop'],
  rain:['rain on the glass, nobody in a hurry','rain on the glass, lamps glowing'],
  snow:['snow drifting past the window','snow outside, warm blanket inside'],
  fog:['mist outside, tea inside','foggy lamplight out on the street'],
  storm:['a storm rolls by — stay a while','thunder far away, safe and warm'],
};

// ---------------------------------------------------------------- colors
const C = {
  wall:'#ead9bd', wall2:'#e2ceac', wain:'#8a5a3c', wainL:'#9e6c49', wainD:'#6c442e', base:'#4f3122',
  plank:['#a8714a','#9d6743','#b27a50'], seam:'#76492f',
  wood:'#6d442c', woodL:'#88593a', woodD:'#4a2d1d', shelfBack:'#3e2a22',
  books:['#a8433a','#3f6e8c','#d6a64b','#5e7f4f','#7b4b7a','#c97b4a','#2f4a5e','#e3d3b0','#8c3a4e','#4f7d78','#b9895a'],
  leather:'#7b3b26', leatherL:'#9a5233', leatherH:'#b86c45', leatherD:'#55271a',
  rug:'#b35e5e', rugB:'#ecd9b6', rugI:'#3f6f73', rugA:'#d9a24b',
  sweater:'#5f7f6a', sweaterD:'#4a6655', sweaterL:'#77987f', skin:'#efc19c', skinD:'#d9a07c', hairM:'#6b4428', hairMD:'#4f301b', beard:'#5a3820',
  hairF:'#3a2219', hairFL:'#5c3729', blush:'#f29a9a', lid:'#3a2620',
  blank:'#e9d7b9', blankD:'#cdb894', blankL:'#f7ecd8', blankS:'#c46a5d', blankS2:'#7f9a8a',
  cat:'#e0974f', catD:'#b9692e', catW:'#fbeedd', catK:'#3a2a24', catP:'#f2a1b5',
};

// ---------------------------------------------------------------- canvas
const cv = $('#scene'), ctx = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); return [c, c.getContext('2d')]; };
const [back, bg] = mk(), [front, fg] = mk(), [dark, dg] = mk(), [glow, gg] = mk();
let W = 240, H = 160, PX = 4, L = {};
function resize(){
  const vw = innerWidth, vh = innerHeight;
  PX = vh > vw ? Math.max(2, Math.floor(vw / 128)) : Math.max(2, Math.floor(Math.max(vw, vh) / 250));
  W = Math.ceil(vw / PX); H = Math.ceil(vh / PX);
  for (const c of [cv, back, front, dark, glow]){ c.width = W; c.height = H; }
  ctx.imageSmoothingEnabled = false;
  layout(); build();
}
function layout(){
  const portrait = H > W * 1.15;
  const floorY = Math.round(H * (portrait ? .67 : .70));
  const cw = 84, chh = 34;
  const cx = Math.round((W - (cw + 22)) / 2) - (portrait ? 0 : 6);
  const cBot = floorY + 7, cTop = cBot - chh;
  const ww = Math.round(clamp(W * (portrait ? .58 : .38), 60, 128));
  const winX = Math.round(W / 2 - ww / 2), sill = cTop + 3;
  const wh = Math.round(Math.min(ww * .9, sill - 10)), winY = sill - wh;
  const gap = portrait ? 3 : 11;
  L = { portrait, floorY, cw, chh, cx, cTop, cBot, ww, wh, winX, winY, sill, gap,
        table: { x: cx + cw + 2, y: floorY - 5, w: 19 },
        rug: { x: cx + cw / 2 + 8, y: Math.round(floorY + (H - floorY) * .58), rx: Math.min(W * .34, 74), ry: Math.max(5, Math.round((H - floorY) * .2)) },
        catY: Math.round(floorY + (H - floorY) * .5) };
}
const P = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function ellipse(g, c, cx, cy, rx, ry){ for (let y = -ry; y <= ry; y++){ const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y*y)/(ry*ry)))); P(g, c, cx - hw, cy + y, hw * 2, 1); } }
function rows(g, pal, list, x, y, dir = 1){ const w = Math.max(...list.map(r => r.length));
  list.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.' && pal[ch]) P(g, pal[ch], dir > 0 ? x + i : x + w - 1 - i, y + j); })); return w; }
const FONT = { B:['##.','#.#','##.','#.#','##.'], O:['.#.','#.#','#.#','#.#','.#.'], K:['#.#','#.#','##.','#.#','#.#'], S:['.##','#..','.#.','..#','##.'] };
function text(g, c, str, x, y){ for (const ch of str){ const f = FONT[ch]; if (f) f.forEach((r, j) => [...r].forEach((p, i) => { if (p === '#') P(g, c, x + i, y + j); })); x += 4; } }

// ---------------------------------------------------------------- static build
let OP, scn = {};
function drawOutside(g, e){
  const { winX: x0, winY: y0, ww: w, wh: h } = L, R = rng(99 + w);
  const hz = y0 + Math.round(h * .58), gy = y0 + Math.round(h * .78);
  for (let y = y0; y < y0 + h; y++){ const t = (y - y0) / h, bi = Math.floor(t * 10), fr = t * 10 - bi;
    P(g, mix(OP.skyT, OP.skyB, bi / 10), x0, y, w, 1);
    if (fr > .5) for (let x = x0 + (y & 1); x < x0 + w; x += 2) P(g, mix(OP.skyT, OP.skyB, (bi + 1) / 10), x, y); }
  const sx = x0 + Math.round(w * .74), sy = y0 + Math.round(h * .22);
  if (e.night){ ellipse(g, '#fff4d6', sx, sy, 4, 4); P(g, '#e2d4ae', sx + 1, sy - 1, 2, 2); }
  else if (e.weather === 'clear' || e.weather === 'cloudy'){ g.globalAlpha = .3; ellipse(g, '#ffffff', sx, sy, 9, 9); g.globalAlpha = 1; ellipse(g, e.season === 'autumn' ? '#ffd27a' : '#fff1a8', sx, sy, 5, 5); }
  for (let x = x0; x < x0 + w; x++){ const hh = 10 + Math.sin(x * .07) * 5 + Math.sin(x * .19 + 1) * 2; P(g, OP.far, x, hz - hh, 1, hh + 2);
    if (e.season === 'winter') P(g, mix(OP.far, '#ffffff', e.night ? .25 : .6), x, hz - hh, 1, 2); }
  for (let x = x0; x < x0 + w; x++){ const hh = 5 + Math.sin(x * .09 + 2) * 3; P(g, OP.mid, x, hz - hh + 4, 1, gy - (hz - hh + 4)); }
  scn.outLights = [];
  // little street across the way: houses + trees
  let hx = x0 + 3 + (R() * 6 | 0);
  while (hx < x0 + w - 10){
    if (R() < .4){ const r = 4 + (R() * 2 | 0); P(g, OP.trunk, hx + r - 1, gy - 5, 2, 5);
      const col = e.season === 'winter' ? '#ffffff' : OP.leaf[(R() * OP.leaf.length) | 0];
      if (e.season === 'winter'){ for (let i = 0; i < 4; i++) P(g, OP.trunk, hx + r - 2 + i, gy - 6 - i, 1, 1); P(g, mix('#ffffff', NIGHT, e.night ? .5 : 0), hx + r - 2, gy - 9, 5, 1); }
      else ellipse(g, col, hx + r, gy - 5 - r, r, r);
      hx += r * 2 + 3; continue; }
    const bw = 10 + (R() * 3 | 0) * 2, bh = 7 + (R() * 3 | 0), wall = OP.wall[(R() * OP.wall.length) | 0], roof = OP.roof[(R() * OP.roof.length) | 0];
    if (hx + bw > x0 + w - 1) break;
    P(g, wall, hx, gy - bh, bw, bh); P(g, mix(wall, '#000000', .12), hx + bw - 2, gy - bh, 2, bh);
    for (let i = 0; i < Math.ceil(bw / 2) + 1; i++){ const rw = bw + 2 - i * 2; if (rw <= 0) break; P(g, roof, hx - 1 + i, gy - bh - 1 - i, rw, 1);
      if (e.season === 'winter') P(g, mix('#ffffff', NIGHT, e.night ? .45 : 0), hx - 1 + i, gy - bh - 2 - i, Math.min(2, rw), 1); }
    const lit = e.night ? '#ffd27a' : '#bfe3f2';
    P(g, lit, hx + 2, gy - bh + 2, 2, 2); P(g, lit, hx + bw - 5, gy - bh + 2, 2, 2); P(g, mix(roof, '#2a1a1a', .3), hx + Math.floor(bw / 2) - 1, gy - 4, 2, 4);
    if (e.night) scn.outLights.push({ x: hx + 3, y: gy - bh + 3 }, { x: hx + bw - 4, y: gy - bh + 3 });
    hx += bw + 3 + (R() * 4 | 0);
  }
  // street lamp
  const lx = x0 + Math.round(w * .18); P(g, '#3b3346', lx, gy - 11, 1, 11); P(g, e.night ? '#ffe39a' : '#f2e6c9', lx - 1, gy - 13, 3, 2); scn.streetLamp = { x: lx, y: gy - 12 };
  for (let y = gy; y < y0 + h; y++) P(g, y < gy + 2 ? OP.road2 : OP.road, x0, y, w, 1);
  if (e.season === 'winter') for (let x = x0; x < x0 + w; x++) if (R() < .4) P(g, '#ffffff', x, gy + (R() * (y0 + h - gy)) | 0);
  if (e.season === 'autumn') for (let x = x0; x < x0 + w; x += 2) if (R() < .25) P(g, OP.leaf[(R() * 4) | 0], x, gy + 1 + (R() * (y0 + h - gy - 1)) | 0);
  scn.hz = hz; scn.gy = gy;
  scn.stars = []; if (e.night && (e.weather === 'clear' || e.weather === 'cloudy')) for (let i = 0; i < w * h / 90; i++) scn.stars.push({ x: x0 + (R() * w) | 0, y: y0 + (R() * (hz - y0 - 12)) | 0, p: R() * 6.28 });
  const cloudN = { clear: 2, cloudy: 5, rain: 6, snow: 5, fog: 3, storm: 7 }[e.weather];
  scn.clouds = Array.from({ length: cloudN }, (_, i) => ({ x: x0 + R() * w, y: y0 + 4 + R() * h * .3, w: 12 + R() * 18, v: (.5 + R() * .6) * (e.weather === 'storm' ? 2.4 : 1), seed: i }));
  scn.cloudCol = e.weather === 'clear' || e.weather === 'cloudy' ? (e.night ? '#4a4f82' : '#ffffff') : (e.night ? '#3a3d5e' : '#d3d6df');
  scn.cloudShade = mix(scn.cloudCol, e.night ? '#20234a' : '#a7aec2', .45);
}
function shelfUnit(g, x, y0, w, y1, R){
  P(g, C.shelfBack, x, y0, w, y1 - y0); P(g, C.woodD, x, y0, 2, y1 - y0); P(g, C.wood, x + w - 2, y0, 2, y1 - y0); P(g, C.woodL, x - 1, y0 - 3, w + 2, 3); P(g, C.woodD, x - 1, y0 - 1, w + 2, 1);
  const rowH = 12;
  for (let sy = y0 + rowH; sy <= y1 - 2; sy += rowH){
    P(g, C.woodL, x + 1, sy, w - 2, 2); P(g, C.woodD, x + 1, sy + 2, w - 2, 1);
    let bx = x + 2;
    while (bx < x + w - 3){
      const r = R();
      if (r < .08){ bx += 2 + (R() * 3 | 0); continue; }
      if (r < .13 && x + w - 2 - bx > 6){ // little plant or candle or globe
        const kind = R(); if (kind < .5){ P(g, '#b5643c', bx, sy - 4, 4, 4); P(g, '#5e8f5a', bx - 1, sy - 7, 2, 3); P(g, '#78a86c', bx + 2, sy - 8, 2, 4); P(g, '#5e8f5a', bx + 1, sy - 6, 1, 2); }
        else { P(g, '#3f6e8c', bx, sy - 6, 4, 4); P(g, '#6aa06a', bx + 1, sy - 5, 2, 1); P(g, C.woodD, bx + 1, sy - 2, 2, 2); }
        bx += 5; continue; }
      if (r < .22){ // horizontal mini stack
        let hy = sy; const n = 2 + (R() * 2 | 0), bw = Math.min(6, x + w - 3 - bx); for (let i = 0; i < n; i++){ hy -= 2; P(g, C.books[(R() * C.books.length) | 0], bx, hy, bw - (i & 1), 2); P(g, '#efe3c8', bx + bw - 1 - (i & 1), hy, 1, 1); }
        bx += bw + 1; continue; }
      const bw = 2 + (R() < .3 ? 1 : 0), bh = 6 + (R() * 4 | 0), col = C.books[(R() * C.books.length) | 0];
      if (bx + bw > x + w - 2) break;
      P(g, col, bx, sy - bh, bw, bh); P(g, mix(col, '#ffffff', .25), bx, sy - bh, 1, bh); if (bh > 7) P(g, mix(col, '#f5d98b', .6), bx, sy - bh + 2, bw, 1);
      bx += bw;
    }
  }
}
function bookStack(g, x, y, n, R){ let yy = y; for (let i = 0; i < n; i++){ const bw = 8 + (R() * 5 | 0), off = (R() * 3 | 0) - 1, col = C.books[(R() * C.books.length) | 0];
  yy -= 3; P(g, col, x + off, yy, bw, 3); P(g, mix(col, '#000000', .2), x + off, yy + 2, bw, 1); P(g, '#f2e6cc', x + off + bw - 1, yy, 1, 2); } return yy; }
function couchStatic(g){
  const ox = L.cx, oy = L.cTop, c = C;
  // back
  P(g, c.leather, ox + 6, oy + 1, 72, 17); P(g, c.leather, ox + 7, oy, 70, 1); P(g, c.leatherL, ox + 8, oy + 1, 66, 1); P(g, c.leatherH, ox + 10, oy + 1, 20, 1);
  P(g, c.leatherD, ox + 6, oy + 15, 72, 2);
  for (let i = 0; i < 7; i++){ P(g, c.leatherD, ox + 12 + i * 10, oy + 5); if (i < 6) P(g, c.leatherD, ox + 17 + i * 10, oy + 10); P(g, c.leatherL, ox + 12 + i * 10, oy + 4); }
  // seat
  P(g, c.leatherL, ox + 8, oy + 17, 68, 8); P(g, c.leatherH, ox + 9, oy + 17, 66, 1);
  // front panel + legs
  P(g, c.leather, ox + 2, oy + 25, 80, 6); P(g, c.leatherD, ox + 2, oy + 30, 80, 1); P(g, c.leatherL, ox + 3, oy + 25, 78, 1);
  P(g, '#3e2618', ox + 4, oy + 31, 2, 3); P(g, '#3e2618', ox + 78, oy + 31, 2, 3);
  // arms (rolled)
  for (const ax of [ox, ox + 74]){ P(g, c.leather, ax, oy + 10, 10, 21); P(g, c.leatherL, ax + 1, oy + 8, 8, 3); P(g, c.leatherH, ax + 2, oy + 8, 5, 1); P(g, c.leather, ax, oy + 9, 10, 2);
    P(g, c.leatherD, ax + 1, oy + 12, 8, 1); P(g, c.leatherD, ax + (ax === ox ? 9 : 0), oy + 10, 1, 21); P(g, c.leatherD, ax, oy + 30, 10, 1); P(g, '#c79a5a', ax + 4, oy + 10, 2, 2); }
}
function build(){
  const e = eff(); OP = palette(e.season, e.weather, e.night); scn = { e };
  const R = rng(4242 + W * 7 + H);
  for (const g of [bg, fg, dg, gg]) g.clearRect(0, 0, W, H);
  const g = bg, { floorY, winX, winY, ww, wh, sill } = L;
  // wall + wallpaper
  P(g, C.wall, 0, 0, W, floorY); for (let x = 2; x < W; x += 7) P(g, C.wall2, x, 0, 2, floorY);
  for (let x = 5; x < W; x += 14) for (let y = 6 + (x % 28 ? 6 : 0); y < floorY - 18; y += 12) P(g, '#d9bfa0', x, y, 1, 1);
  P(g, '#c7a983', 0, 0, W, 2); // ceiling trim
  // wainscot
  const wy = floorY - 16; P(g, C.wain, 0, wy, W, 16); P(g, C.wainL, 0, wy, W, 2); P(g, C.wainD, 0, wy + 2, W, 1);
  for (let x = 3; x < W; x += 16){ P(g, C.wainD, x, wy + 5, 12, 1); P(g, C.wainD, x, wy + 5, 1, 9); P(g, C.wainL, x + 1, wy + 13, 11, 1); P(g, C.wainL, x + 11, wy + 5, 1, 9); }
  P(g, C.base, 0, floorY - 2, W, 2);
  // floor planks
  for (let y = floorY, i = 0; y < H; y += 4, i++){ P(g, C.plank[i % 3], 0, y, W, 4); P(g, C.seam, 0, y + 3, W, 1);
    for (let x = (i * 23) % 31; x < W; x += 31) P(g, C.seam, x, y, 1, 3); for (let x = (i * 7) % 13; x < W; x += 13) if (R() < .3) P(g, mix(C.plank[i % 3], '#ffffff', .12), x, y + 1, 3, 1); }
  // window
  drawOutside(g, e);
  scn.panes = [];
  const fx = winX - 3, fy = winY - 3, fw = ww + 6, fh = wh + 6;
  P(g, C.woodD, fx, fy, fw, 3); P(g, C.woodD, fx, fy, 3, fh); P(g, C.woodD, fx + fw - 3, fy, 3, fh); P(g, C.woodL, fx + 1, fy + 1, fw - 2, 1); P(g, C.woodL, fx + 1, fy + 1, 1, fh - 2);
  const mx = winX + Math.floor(ww / 2), my = winY + Math.floor(wh * .45);
  P(g, C.wood, mx - 1, winY, 2, wh); P(g, C.wood, winX, my - 1, ww, 2); P(g, C.woodL, mx - 1, winY, 1, wh);
  // sill
  P(g, C.woodL, fx - 3, sill, fw + 6, 2); P(g, C.woodD, fx - 2, sill + 2, fw + 4, 2);
  // frost / mist on glass
  if (e.season === 'winter' || e.weather === 'snow'){ for (const [cx, cy] of [[winX, winY], [winX + ww - 1, winY], [winX, winY + wh - 1], [winX + ww - 1, winY + wh - 1], [mx, my], [mx - 1, my]])
    for (let i = 0; i < 26; i++){ const dx = (R() * 7) | 0, dy = (R() * 7) | 0; if (dx + dy > 7) continue; g.globalAlpha = .55; P(g, '#f4f8ff', cx + (cx < mx ? dx : -dx), cy + (cy < my ? dy : -dy)); } g.globalAlpha = 1; }
  // curtains (tied back)
  const cur = e.season === 'winter' ? '#8c3a4e' : e.season === 'autumn' ? '#b8703c' : e.season === 'spring' ? '#c98ba0' : '#5f8f8a';
  for (const [x, d] of [[fx - 7, 1], [fx + fw + 1, -1]]){ for (let y = fy - 4; y < sill - 1; y++){ const pinch = y > fy + fh * .55 && y < fy + fh * .65 ? 2 : 0, wd = 6 - pinch;
      P(g, cur, d > 0 ? x : x + pinch, y, wd, 1); P(g, mix(cur, '#000000', .2), d > 0 ? x + 2 : x + 3, y, 1, 1); }
    P(g, '#d9a24b', d > 0 ? x + 1 : x + 2, fy + Math.round(fh * .58), 4, 1); }
  P(g, C.woodD, fx - 9, fy - 5, fw + 18, 1); // rod
  // sill items: seasonal pot + mini book stack + candle
  const sx = fx - 1, ex = fx + fw - 2;
  const seasonal = { autumn: () => { P(g, '#e9772f', sx + 1, sill - 3, 5, 3); P(g, '#c4561f', sx + 3, sill - 3, 1, 3); P(g, '#4b6b3a', sx + 3, sill - 4, 1, 1); },
    winter: () => { for (let i = 0; i < 5; i++) P(g, '#3f6b5f', sx + 3 - (i >> 1), sill - 2 - (4 - i) * 1 - 1, 1 + (i >> 1) * 2, 1); P(g, '#ffd35c', sx + 3, sill - 7); P(g, '#b5643c', sx + 2, sill - 1, 3, 1); },
    spring: () => { P(g, '#9fc6d9', sx + 2, sill - 3, 3, 3); P(g, '#5e8f5a', sx + 3, sill - 6, 1, 3); P(g, '#f39bbd', sx + 2, sill - 8, 3, 2); P(g, '#ee6f9a', sx + 3, sill - 8); },
    summer: () => { P(g, '#cfe6ef', sx + 2, sill - 3, 3, 3); P(g, '#5e8f5a', sx + 3, sill - 7, 1, 4); P(g, '#ffd35c', sx + 2, sill - 9, 3, 3); P(g, '#7a4a22', sx + 3, sill - 8); } };
  seasonal[e.season]();
  bookStack(g, ex - 10, sill, 2, R); P(g, '#f3e6c8', ex - 2, sill - 4, 2, 4); scn.candle = { x: ex - 2, y: sill - 6 };
  // fairy lights along the curtain rod
  scn.fairy = []; for (let x = fx - 6; x < fx + fw + 6; x += 4){ const t = (x - fx + 6) / (fw + 12), y = fy - 4 + Math.round(Math.sin(t * Math.PI * 3) ** 2 * 3); P(g, '#5a4a3a', x, y - 1, 4, 1); scn.fairy.push({ x, y, c: ['#ffd27a', '#f39bbd', '#9fd3c7', '#ffb36b'][(x >> 2) % 4], p: R() * 6.28 }); }
  // shelves
  const leftEnd = winX - 3 - 9 - L.gap, rightStart = winX + ww + 3 + 9 + L.gap, shelfTop = L.portrait ? 10 : 6;
  for (let x = leftEnd; x > -30; ){ const w = 26 + (R() * 10 | 0); shelfUnit(g, x - w, shelfTop + (R() * 3 | 0), w, floorY - 2, R); x -= w + 2; }
  for (let x = rightStart; x < W + 30; ){ const w = 26 + (R() * 10 | 0); shelfUnit(g, x, shelfTop + (R() * 3 | 0), w, floorY - 2, R); x += w + 2; }
  // wall decor above window (portrait) / beside it (landscape)
  scn.clock = null;
  if (winY - 3 > 22){ const sy = Math.round((winY - 9) / 2) - 4; P(g, C.woodD, W / 2 - 13, sy - 2, 1, 2); P(g, C.woodD, W / 2 + 11, sy - 2, 1, 2); P(g, C.wood, W / 2 - 14, sy, 26, 9); P(g, C.woodL, W / 2 - 14, sy, 26, 1); text(g, '#f3e2bf', 'BOOKS', W / 2 - 11, sy + 2);
    scn.clock = { x: Math.round(W / 2 + 22), y: sy + 4 }; }
  else if (L.gap >= 9){ scn.clock = { x: winX - 3 - 9 - Math.floor(L.gap / 2) + 4, y: winY + 12 };
    const px0 = winX + ww + 3 + 9 + Math.floor(L.gap / 2) - 4, py0 = winY + 8; P(g, C.woodD, px0 - 4, py0, 9, 10); P(g, '#f1e4c8', px0 - 3, py0 + 1, 7, 8); rows(g, { k: '#3a2a24', o: C.cat }, ['o.o..', 'ooo..', 'oooo.', '.ooo.', '.o.o.'], px0 - 2, py0 + 3); }
  if (scn.clock){ const { x, y } = scn.clock; ellipse(g, C.woodD, x, y, 5, 5); ellipse(g, '#fbf1dc', x, y, 4, 4); for (const [dx, dy] of [[0, -3], [3, 0], [0, 3], [-3, 0]]) P(g, '#8a7a6a', x + dx, y + dy); }
  // pendant lamp in tall layouts
  scn.lamps = [];
  if (L.portrait && winY > 30){ const lx = Math.round(W * .22), ly = Math.round(winY * .55); P(g, '#3a2a24', lx, 0, 1, ly); P(g, '#c8833a', lx - 4, ly, 9, 2); P(g, '#e0a050', lx - 3, ly - 2, 7, 2); P(g, '#ffe7a8', lx - 2, ly + 2, 5, 1); scn.lamps.push({ x: lx, y: ly + 3, r: 30, pend: true }); }
  // rug
  const r = L.rug; ellipse(g, C.rugB, r.x, r.y, r.rx, r.ry); ellipse(g, C.rug, r.x, r.y, r.rx - 2, Math.max(2, r.ry - 1)); ellipse(g, C.rugI, r.x, r.y, r.rx * .55, Math.max(1, r.ry * .5));
  for (let x = -r.rx + 6; x < r.rx - 6; x += 6) P(g, C.rugA, r.x + x, r.y, 2, 1);
  for (let x = -r.rx + 2; x < r.rx - 2; x += 2){ P(g, C.rugB, r.x + x, r.y - r.ry - 1); P(g, C.rugB, r.x + x, r.y + r.ry + 1); }

  // -------- front layer: couch, table, lamps, floor stacks
  const f = fg;
  couchStatic(f);
  const t = L.table; // side table (round top, single pedestal)
  P(f, C.woodL, t.x, t.y, t.w, 2); P(f, C.woodD, t.x + 1, t.y + 2, t.w - 2, 1); P(f, C.wood, t.x + Math.floor(t.w / 2) - 1, t.y + 3, 3, 9); P(f, C.woodD, t.x + 4, t.y + 11, t.w - 8, 2);
  // table lamp
  const lx = t.x + 4; P(f, '#7a5a3a', lx, t.y - 2, 3, 2); P(f, '#9a7a4a', lx + 1, t.y - 7, 1, 5); P(f, '#e9b465', lx - 2, t.y - 11, 7, 4); P(f, '#f6cf85', lx - 1, t.y - 12, 5, 1); P(f, '#c98a3e', lx - 2, t.y - 8, 7, 1);
  scn.lamps.push({ x: lx + 1, y: t.y - 8, r: 34 }); scn.tableLamp = { x: lx + 1, y: t.y - 10 };
  // her red glasses + his mug
  const gx = t.x + 9, gy = t.y - 2; rows(f, { r: '#d8353a', g: '#f7e9e9', d: '#9c2125' }, ['rrr.rrr', 'rgr.rgr', 'rrrdrrr'], gx, gy - 1); scn.glasses = { x: gx + 1, y: gy }; P(f, '#9c2125', gx - 1, gy - 1); P(f, '#9c2125', gx + 7, gy - 1);
  P(f, '#f1e4c8', t.x + 16, t.y - 4, 3, 4); P(f, '#c46a5d', t.x + 16, t.y - 3, 3, 1); scn.mug = { x: t.x + 17, y: t.y - 5 };
  // floor lamp (if room)
  if (L.cx > 16){ const fx2 = L.cx - 7; P(f, '#3a2a24', fx2 - 2, L.floorY + 6, 6, 1); P(f, '#5a4a3a', fx2, L.floorY - 36, 1, 42); P(f, '#e9b465', fx2 - 4, L.floorY - 43, 9, 6); P(f, '#f6cf85', fx2 - 3, L.floorY - 44, 7, 1); P(f, '#c98a3e', fx2 - 4, L.floorY - 38, 9, 1); scn.lamps.push({ x: fx2, y: L.floorY - 37, r: 40 }); }
  // book stacks here and there
  const FR = rng(55 + W);
  if (L.cx > 30) bookStack(f, L.cx - 24, L.floorY + 8, 4, FR);
  const rs = L.table.x + L.table.w + 3; if (rs + 12 < W) { const top = bookStack(f, rs, L.floorY + 9, 5, FR); P(f, '#f1e4c8', rs + 3, top - 3, 3, 3); }
  if (H - L.floorY > 30){ bookStack(f, Math.round(W * .08), H - 4, 3, FR); if (W > 200) bookStack(f, Math.round(W * .86), H - 6, 6, FR); }

  // -------- lighting: darkness with warm holes, + additive glow
  const a = e.night ? .46 : e.weather === 'storm' ? .22 : e.weather === 'rain' || e.weather === 'fog' ? .15 : e.weather === 'snow' || e.weather === 'cloudy' ? .1 : .04;
  dg.fillStyle = `rgba(28,16,38,${a})`; dg.fillRect(0, 0, W, H);
  dg.globalCompositeOperation = 'destination-out';
  for (const l of scn.lamps) for (let k = 3; k >= 1; k--){ dg.fillStyle = `rgba(0,0,0,${.3})`; ellipse(dg, 'rgba(0,0,0,.3)', l.x, l.y + (l.pend ? 6 : 4), Math.round(l.r * k / 3), Math.round(l.r * k / 3 * .7)); }
  if (e.night){ dg.fillStyle = 'rgba(0,0,0,.25)'; dg.fillRect(winX, winY, ww, wh); }
  dg.globalCompositeOperation = 'source-over';
  for (const l of scn.lamps) for (let k = 3; k >= 1; k--) ellipse(gg, `rgba(255,190,110,${e.night ? .05 : .025})`, l.x, l.y + 4, Math.round(l.r * k / 4), Math.round(l.r * k / 4 * .7));
  scn.beam = !e.night && (e.weather === 'clear' || e.weather === 'cloudy') ? (e.weather === 'clear' ? .09 : .045) : 0;
  resetParticles(); resetMotes();
}

// ---------------------------------------------------------------- outside particles (clipped to the window)
let parts = [], drops = [], motes = [];
function resetParticles(){
  const e = scn.e, { winX: x0, winY: y0, ww: w, wh: h } = L; parts = []; drops = [];
  const area = w * h / 5000, add = (n, f) => { for (let i = 0; i < Math.round(n * area * MOTION); i++) parts.push(f(true)); };
  const rnd = () => ({ x: x0 + Math.random() * w, y: y0 + Math.random() * h });
  scn.spawn = {
    r: i => ({ t: 'r', x: x0 + Math.random() * w * 1.2, y: i ? y0 + Math.random() * h : y0 - 3, v: 110 + Math.random() * 50 }),
    s: i => ({ t: 's', x: x0 + Math.random() * w, y: i ? y0 + Math.random() * h : y0 - 2, v: 6 + Math.random() * 8, p: Math.random() * 6.28 }),
    l: i => ({ t: 'l', x: x0 - 4 + Math.random() * w, y: i ? y0 + Math.random() * h : y0 - 3, v: 8 + Math.random() * 6, p: Math.random() * 6.28, c: e.night ? mix(CW.PAL.autumn.leaf[(Math.random() * 4) | 0], NIGHT, .45) : CW.PAL.autumn.leaf[(Math.random() * 4) | 0] }),
    p: i => ({ t: 'l', x: x0 - 4 + Math.random() * w, y: i ? y0 + Math.random() * h : y0 - 3, v: 5 + Math.random() * 5, p: Math.random() * 6.28, c: Math.random() < .5 ? '#f9d3e1' : '#f7b6cf' }),
    f: () => ({ t: 'f', ...rnd(), p: Math.random() * 6.28 }),
  };
  const S = scn.spawn;
  if (e.weather === 'rain' || e.weather === 'storm') add(e.weather === 'storm' ? 36 : 26, S.r);
  if (e.weather === 'snow' || (e.season === 'winter' && e.weather !== 'rain' && e.weather !== 'storm')) add(e.weather === 'snow' ? 30 : 9, S.s);
  if (e.season === 'autumn' && e.weather !== 'snow') add(e.weather === 'rain' ? 3 : 7, S.l);
  if (e.season === 'spring' && e.weather !== 'snow' && e.weather !== 'rain') add(5, S.p);
  if (e.season === 'summer' && e.night && e.weather !== 'rain' && e.weather !== 'storm') add(6, S.f);
  if (e.weather === 'rain' || e.weather === 'storm') for (let i = 0; i < Math.round(w / 9); i++) drops.push({ x: x0 + 1 + Math.random() * (w - 2), y: y0 + Math.random() * h, hold: Math.random() * 3, trail: [] });
}
function resetMotes(){ motes = []; if (!scn.beam) return; for (let i = 0; i < 16 * MOTION; i++) motes.push({ x: L.winX + Math.random() * (L.ww + 30), y: L.winY + Math.random() * (H - L.winY), p: Math.random() * 6.28, v: .5 + Math.random() }); }

// ---------------------------------------------------------------- the couple
const SNUG = -4; // pull her into his chest
const her = { book: false, pose: 0, shift: 0, sighAt: performance.now() + 12000 + Math.random() * 10000, zAt: 0, quiet: 0 };
const him = { glance: 0, flip: -1, flipAt: performance.now() + 9000, heart: 0, stroke: 0, strokeAt: performance.now() + 25000 + Math.random() * 15000, squeeze: 0, squeezeAt: performance.now() + 50000 + Math.random() * 40000 };
const RIBBON = { autumn: '#c46a5d', winter: '#8c3a4e', spring: '#e98fb0', summer: '#d9a24b' };
let moth = { a: Math.random() * 6.28 }, glint = 0, lastFl = 0;
let zs = [], puffs = [];
function blanketTop(x, pose, br, k){
  const bump = (c, w, h) => h * Math.max(0, 1 - ((x - SNUG - c) / w) ** 2);
  if (x <= 28) return 17;
  const A = [[42, 9, 3 + br], [55, 10, 4 + br], [67, 7, 3], [73, 4, 1]], B = [[43, 9, 3 + br], [58, 10, 4 + br], [68, 6, 4], [74, 3, 1]];
  const from = pose ? A : B, to = pose ? B : A; let s = 0;
  for (let i = 0; i < 4; i++){ const f = from[i], t2 = to[i]; s = Math.max(s, bump(lerp(f[0], t2[0], k), lerp(f[1], t2[1], k), lerp(f[2], t2[2], k))); }
  return Math.round(18 - s);
}
function drawCouple(T, now){
  const ox = L.cx, oy = L.cTop, g = ctx, c = C;
  const p = (col, x, y, w = 1, h = 1) => P(g, col, ox + x, oy + y, w, h);
  // ----- him: torso + arms + book
  p(c.sweater, 12, 3, 16, 15); p(c.sweater, 11, 4, 18, 14); p(c.sweaterD, 11, 4, 2, 14); p(c.sweaterL, 14, 3, 4, 1);
  // head
  const gl = him.glance > 0 ? 1 : 0;
  p(c.hairM, 15, -9, 8, 1); p(c.hairM, 14, -8, 10, 2); p(c.hairMD, 14, -6, 2, 3); p(c.hairMD, 22, -6, 2, 3);
  p(c.skin, 15, -6, 8, 8); p(c.skinD, 14, -4, 1, 2); p(c.skinD, 23, -4, 1, 2); p(c.hairM, 16, -6, 4, 1); p(c.hairMD, 18, -7, 3, 1);
  p(c.hairMD, 16 + gl, -5, 2, 1); p(c.hairMD, 20 + gl, -5, 2, 1);
  p(c.lid, 16 + gl, -3, 2, 1); p(c.lid, 20 + gl, -3, 2, 1);
  p(c.skinD, 19, -2, 1, 1);
  p(c.beard, 15, -1, 2, 1); p(c.beard, 21, -1, 2, 1); p(c.beard, 17, -1, 4, 1); p(c.beard, 15, 0, 8, 2); p(c.beard, 16, 2, 6, 1); p('#7a5236', 18, 0, 2, 1);
  if (gl){ p('#c9806a', 18, 1, 2, 1); p('#c9806a', 17, 0, 1, 1); p('#c9806a', 20, 0, 1, 1); g.globalAlpha = .55; p(c.blush, 22, -2, 1, 1); p(c.blush, 15, -2, 1, 1); g.globalAlpha = 1; } // soft smile while he looks at her
  // book (open) with optional page flip
  p('#8a2f2f', 17, 5, 15, 7); p('#f6ecd4', 18, 5, 6, 6); p('#f6ecd4', 25, 5, 6, 6); p('#6a2222', 24, 5, 1, 7);
  for (const y of [6, 8, 10]){ p('#cbbd9f', 19, y, 4, 1); p('#cbbd9f', 26, y, 4, 1); }
  if (him.flip >= 0){ const k = him.flip, col = Math.round(lerp(30, 18, k)), lift = Math.round(Math.sin(k * Math.PI) * 2); p('#fffaf0', col, 5 - lift, 1, 6); p('#e8dcc0', col + (k < .5 ? -1 : 1), 5 - lift, 1, 6); }
  { const rib = RIBBON[scn.e.season] || '#c46a5d', k = him.flip, sw = k >= 0 ? Math.round(Math.sin(k * Math.PI * 2) * 1.4) : 0, up = k >= 0 ? Math.round(Math.sin(k * Math.PI) * 1.5) : 0; // bookmark ribbon
    p(rib, 24, 12 - up, 1, 2); p(rib, 24 + sw, 14 - up, 1, 1); p(mix(rib, '#000000', .2), 24 + (sw || 1), 15 - up, 1, 1); }
  p(c.sweater, 13, 8, 4, 4); p(c.skin, 16, 10, 2, 2); p(c.sweater, 28, 5, 3, 6); p(c.skin, 30, 10, 2, 2);
  // ----- blanket over both
  const br = Math.sin(T * Math.PI * 2 / 4.6) > .2 ? 1 : 0, k = her.shift > 0 ? 1 - her.shift : 1, pose = her.pose;
  for (let x = 10; x <= 75; x++){
    const top = blanketTop(x, pose, br, k);
    p(c.blankL, x, top, 1, 1); p(c.blank, x, top + 1, 1, 26 - top);
    if (x % 9 === 3) p(c.blankS, x, top + 1, 1, 26 - top);
    if (x % 9 === 7) p(c.blankS2, x, top + 1, 1, 26 - top);
    p(c.blankS, x, 22, 1, 1); p(c.blankD, x, 25, 1, 1);
    if (x >= 14 && x <= 71){ p(c.blank, x, 26, 1, 2); p(c.blankD, x, 27, 1, 1); if (x % 2 === 0) p(c.blankL, x, 28, 1, 1); }
  }
  if (pose === 1 && k > .6){ p('#a8c4d8', 74, 19, 2, 2); p('#ffffff', 75, 19, 1, 1); } // her socks peeking out
  // ----- her head (bob) resting on his chest
  const lift = her.shift > 0 ? Math.round(Math.sin(her.shift * Math.PI) * -1) : 0, dx = pose + SNUG, dy = lift;
  const h = (col, x, y, w = 1, hh = 1) => p(col, x + dx, y + dy, w, hh);
  h(c.hairF, 32, 9, 6); h(c.hairF, 31, 10, 8); h(c.hairFL, 34, 10, 2); h(c.hairF, 30, 11, 9);
  h(c.hairF, 30, 12, 2); h(c.skin, 32, 12, 4); h(c.hairF, 36, 12, 3);
  h(c.hairF, 30, 13, 1); h(c.skin, 31, 13, 5); h(c.hairF, 36, 13, 3); h(c.hairFL, 37, 12, 1);
  h(c.skin, 31, 14, 5); h(c.lid, 32, 14, 2); h(c.hairF, 36, 14, 3);
  h(c.skin, 31, 15, 5); h(c.blush, 34, 15); h(c.hairF, 36, 15, 3);
  h(c.skin, 32, 16, 3); h(c.hairF, 35, 16, 3); h(c.hairF, 36, 17, 2);
  if (pose === 0) h(c.skin, 29, 16, 2, 1);
  p('#c98ba0', 36 + dx, 16 + dy, 5, 2); p('#b5778c', 36 + dx, 17 + dy, 5, 1); // her cardigan shoulder
  // his arm around her, over the blanket
  p(c.sweater, 34, 17, 9, 2); p(c.sweaterD, 34, 18, 9, 1); if (him.stroke <= 0) p(c.skin, 43, 17, 2, 2);
  // now and then he strokes her hair: the hand around her slides up onto her bob and drifts 1px
  if (him.stroke > 0){ const s = Math.sin((1 - him.stroke / 1.2) * Math.PI * 2) > 0 ? 1 : 0, hx0 = 36 + dx + s, hy0 = 10 + dy;
    p(c.sweater, 41, 16, 2, 1); p(c.sweater, hx0 + 2, 15 + dy, Math.max(1, 42 - (hx0 + 2)), 1); p(c.sweaterD, hx0 + 3, 16 + dy, Math.max(1, 41 - (hx0 + 3)), 1); p(c.sweater, hx0 + 2, hy0 + 2, 2, 15 + dy - hy0 - 2); p(c.skin, hx0, hy0, 2, 2); p(c.skinD, hx0, hy0 + 2, 2, 1); p(c.skinD, hx0 + 2, hy0 + 1, 1, 2); p(c.hairFL, hx0 - 1, hy0, 1, 1); }
  // hands finding each other under the blanket
  if (him.squeeze > 0){ const t2 = 1 - him.squeeze / 2, ty = blanketTop(52, pose, br, k), pz = t2 > .35 && t2 < .7 ? 1 : 0;
    g.globalAlpha = Math.min(1, him.squeeze * 3, t2 * 6);
    p(c.skin, 49 + dx + pz, ty + 1, 2, 1); p(c.skinD, 49 + dx + pz, ty + 2, 1, 1); p(c.skin, 52 + dx - pz, ty + 1, 2, 1); p(c.skinD, 53 + dx - pz, ty + 2, 1, 1); p(c.skinD, 51 + dx, ty + 1, 1, 1);
    g.globalAlpha = 1; }
  // sometimes she dozed off with a book of her own, tucked under her hand on the blanket
  if (her.book && k > .5){ const bx = 46 + dx, by = 15 + dy; p('#2f5d6a', bx, by, 8, 4); p('#3f7a88', bx, by, 8, 1); p('#f6ecd4', bx + 1, by + 4, 7, 1); p('#d9b45a', bx + 3, by + 1, 3, 1); p('#c98ba0', bx - 2, by + 2, 3, 2); p(c.skin, bx - 1, by + 1, 2, 1); }
  // zzz from her
  const hx = ox + 38 + dx, hy = oy + 8 + dy;
  if (now > her.zAt && her.quiet <= 0){ zs.push({ x: hx, y: hy, t: 0, big: zs.length % 3 === 2 }); her.zAt = now + 1500 / Math.max(.6, MOTION); }
  return { hx, hy };
}
const ZS = ['####', '..#.', '.#..', '####'], ZB = ['#####', '...#.', '..#..', '.#...', '#####'];
function drawZs(dt){
  for (const z of zs){ z.t += dt; const life = 3.6, k = z.t / life; if (k >= 1) continue;
    const x = z.x + k * 9 + Math.sin(z.t * 2.2) * 1.5, y = z.y - k * 16;
    ctx.globalAlpha = Math.min(1, k * 6) * Math.min(1, (1 - k) * 2.5);
    rows(ctx, { '#': '#4a2e44' }, z.big ? ZB : ZS, Math.round(x) + 1, Math.round(y) + 1);
    rows(ctx, { '#': '#fff4dc' }, z.big ? ZB : ZS, Math.round(x), Math.round(y)); }
  ctx.globalAlpha = 1; zs = zs.filter(z => z.t < 3.6);
  for (const pf of puffs){ pf.t += dt; const k = pf.t / 2; if (k >= 1) continue; ctx.globalAlpha = (1 - k) * .8;
    const x = Math.round(pf.x - k * 7), y = Math.round(pf.y - k * 5); ctx.fillStyle = '#fff4dc'; ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1); ctx.fillRect(x + 2, y, 1, 1); ctx.fillRect(x + 3, y - 1, 1, 1); }
  puffs = puffs.filter(pf => pf.t < 2);
  if (him.heart > 0){ const k = 1 - him.heart / 2.2; ctx.globalAlpha = Math.min(1, (1 - k) * 2); ctx.fillStyle = '#f37a9c';
    const x = L.cx + 25, y = Math.round(L.cTop - 12 - k * 6); ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + 2, y, 1, 1); ctx.fillRect(x, y + 1, 3, 1); ctx.fillRect(x + 1, y + 2, 1, 1); ctx.globalAlpha = 1; }
}
function sigh(now){
  her.shift = 1; her.pose ^= 1; if (Math.random() < .35) her.book = !her.book; her.quiet = 2.6; her.sighAt = now + (16000 + Math.random() * 20000);
  puffs.push({ x: L.cx + 29 + her.pose, y: L.cTop + 15, t: 0 }); audio.sigh();
  setTimeout(() => { him.glance = 3; him.heart = 2.2; if (Math.random() < .4) setTimeout(() => { if (him.squeeze <= 0) him.squeeze = 2; }, 1600); }, 900);
}
function updateCouple(dt, now){
  if (her.shift > 0) her.shift = Math.max(0, her.shift - dt / 1.3);
  if (her.quiet > 0) her.quiet -= dt;
  if (now > her.sighAt) sigh(now);
  if (him.glance > 0) him.glance -= dt; if (him.heart > 0) him.heart -= dt;
  if (him.stroke > 0) him.stroke -= dt; else if (now > him.strokeAt && her.shift <= 0){ him.stroke = 1.2; him.strokeAt = now + 25000 + Math.random() * 15000; }
  if (him.squeeze > 0) him.squeeze -= dt; else if (now > him.squeezeAt){ him.squeeze = 2; him.squeezeAt = now + 60000 + Math.random() * 40000; }
  if (him.flip >= 0){ him.flip += dt / .7; if (him.flip >= 1) him.flip = -1; }
  else if (now > him.flipAt){ him.flip = 0; him.flipAt = now + 14000 + Math.random() * 16000; }
}

// ---------------------------------------------------------------- bookstore cat
const CAT = {
  walk: [['...........o.o', 'o..........ooo', 'o..........oko', '.o.ododdodooop', '..oooooooooo..', '..oo.oo..oo.o.', '..o...o...o..o'],
         ['...........o.o', '.o.........ooo', 'o..........oko', '.o.ododdodooop', '..oooooooooo..', '...oo.o.oo.o..', '...o..o..o..o.']],
  sit: [['......o.o.', '......ooo.', '......oko.', '.....oooop', 'o...ooooo.', 'o..ododdo.', '.oooooooo.', '..ooooooo.', '..w.w..ww.'],
        ['......o.o.', '......ooo.', '......oko.', '.....oooop', '....ooooo.', 'o..ododdo.', 'ooooooooo.', '..ooooooo.', '..w.w..ww.']],
  curl: [['........o.o', '.ooooooooo.', 'oododdooko.', 'ooooooooooo', '.wwwoooooo.'],
          ['........o.o', '.ooooooooo.', 'oododdooko.', 'oooooooooop', '.wwwoooooo.']],
  stretch: [['o...............', '.oooo...........', '.odddoo.....o.o.', '..ooooooo...ooo.', '..oo.ooooooooko.', '..o....o.wwwwwp.']],
};
const CATPAL = { o: C.cat, d: C.catD, w: C.catW, k: C.catK, p: C.catP };
let cat = null, nextCat = performance.now() + 6000;
function spawnCat(route){
  const sillRoute = route ? route === 'sill' : Math.random() < .4, dir = Math.random() < .5 ? 1 : -1;
  if (sillRoute){ const x0 = L.winX - 16, x1 = L.winX + L.ww + 2; cat = { route: 'sill', dir, x: dir > 0 ? x0 : x1, end: dir > 0 ? x1 : x0, y: L.sill - 7, t: 0, stop: lerp(x0, x1, .3 + Math.random() * .4), state: 'walk', timer: 0, did: false }; }
  else { const couch = Math.random() < .25; cat = { route: 'floor', couch, dir, x: dir > 0 ? -18 : W + 2, end: dir > 0 ? W + 4 : -20, y: L.catY - 7, t: 0, stop: couch ? L.cx + 62 : L.cx + 10 + Math.random() * (L.cw - 10), state: 'walk', timer: 0, did: false }; }
}
function updateCat(dt, now, layer){
  if (!cat){ if (layer === 'floor' && now > nextCat) spawnCat(); return; }
  if (cat.route !== layer) return;
  const c = cat; c.t += dt;
  if (c.state === 'walk'){ c.x += c.dir * 10 * dt * Math.max(.6, MOTION);
    if (!c.did && Math.abs(c.x - c.stop) < 1){ c.did = true; c.x = c.stop;
      if (c.couch){ c.state = 'up'; c.timer = .6; }
      else { c.state = c.route === 'floor' && Math.random() < .55 ? 'stretch' : 'sit'; c.timer = c.state === 'stretch' ? 1.8 : 4 + Math.random() * 4; } } }
  else { c.timer -= dt; if (c.timer <= 0){
    if (c.state === 'stretch'){ c.state = 'sit'; c.timer = 3 + Math.random() * 3; }
    else if (c.state === 'up'){ c.state = 'curl'; c.timer = 5 + Math.random() * 4; }
    else if (c.state === 'curl'){ c.state = 'down'; c.timer = .6; }
    else c.state = 'walk'; } }
  // couch visit: hop up onto the blanket by their feet, curl up, hop back down
  if (c.state === 'up' || c.state === 'down' || c.state === 'curl'){
    const floorB = c.y + 7, couchB = L.cTop + 18, k = c.state === 'curl' ? 1 : c.state === 'up' ? 1 - c.timer / .6 : c.timer / .6;
    const b = Math.round(lerp(floorB, couchB, k) - (c.state === 'curl' ? 0 : Math.sin(k * Math.PI) * 6));
    const spr2 = c.state === 'curl' ? CAT.curl[Math.floor(c.t * .8) % 2] : CAT.walk[0];
    const pal2 = scn.e.night ? Object.fromEntries(Object.entries(CATPAL).map(([kk, v]) => [kk, mix(v, '#2a1c3a', .2)])) : CATPAL;
    rows(ctx, pal2, spr2, Math.round(c.x), b - spr2.length, c.dir);
    if (c.state === 'curl' && c.timer > 1){ const hk = (c.timer % 1.8) / 1.8; ctx.globalAlpha = hk; ctx.fillStyle = '#f39bbd'; const hx = Math.round(c.x + 4), hy = Math.round(b - 9 - (1 - hk) * 5);
      ctx.fillRect(hx, hy, 1, 1); ctx.fillRect(hx + 2, hy, 1, 1); ctx.fillRect(hx, hy + 1, 3, 1); ctx.fillRect(hx + 1, hy + 2, 1, 1); ctx.globalAlpha = 1; }
    return; }
  let spr, yo = 0;
  if (c.state === 'walk'){ spr = CAT.walk[Math.floor(c.t * 5) % 2]; }
  else if (c.state === 'sit'){ spr = CAT.sit[Math.floor(c.t * 1.2) % 2]; yo = -2; }
  else { spr = CAT.stretch[0]; yo = 1; }
  const yBase = c.y + 7 - spr.length + (c.state === 'sit' ? 0 : 0) + (c.state === 'walk' ? 0 : yo + 2);
  if (c.route === 'floor'){ ctx.fillStyle = 'rgba(40,20,20,.18)'; ctx.fillRect(Math.round(c.x + 2), c.y + 7, 11, 1); }
  if (c.route === 'sill'){ ctx.save(); ctx.beginPath(); ctx.rect(L.winX - 18, 0, L.ww + 36, L.sill + 1); ctx.clip(); }
  const night = scn.e.night, pal = night ? Object.fromEntries(Object.entries(CATPAL).map(([k, v]) => [k, mix(v, '#2a1c3a', .2)])) : CATPAL;
  rows(ctx, pal, spr, Math.round(c.x), Math.round(yBase), c.dir);
  if (c.route === 'sill') ctx.restore();
  if (c.state === 'sit' && c.route === 'floor' && c.timer > 1){ const k = (c.timer % 1.6) / 1.6; ctx.globalAlpha = k; ctx.fillStyle = '#f39bbd'; const hx = Math.round(c.x + (c.dir > 0 ? 7 : 1)), hy = Math.round(yBase - 4 - (1 - k) * 5);
    ctx.fillRect(hx, hy, 1, 1); ctx.fillRect(hx + 2, hy, 1, 1); ctx.fillRect(hx, hy + 1, 3, 1); ctx.fillRect(hx + 1, hy + 2, 1, 1); ctx.globalAlpha = 1; }
  if ((c.dir > 0 && c.x > c.end) || (c.dir < 0 && c.x < c.end)){ cat = null; nextCat = now + (16000 + Math.random() * 18000) / Math.max(.5, MOTION); }
}

// ---------------------------------------------------------------- frame
let last = performance.now(), T = 0, flash = 0, nextFlash = 7;
function cloud(cx, cy, w, seed){ const R = rng(seed * 977 + 3), n = Math.max(3, Math.floor(w / 6));
  for (let i = 0; i < n; i++){ const ox = (i / (n - 1)) * w - w / 2, r = 3 + Math.round(R() * 3 + Math.sin(i / (n - 1) * Math.PI) * 2);
    for (let y = -r; y <= Math.min(r, 2); y++){ const hw = Math.round(Math.sqrt(r * r - y * y)); ctx.fillStyle = y > 0 ? scn.cloudShade : scn.cloudCol; ctx.fillRect(Math.round(cx + ox - hw), Math.round(cy + y), hw * 2, 1); } } }
function frame(now){
  const dt = Math.min(.05, (now - last) / 1000) * (reduceMotion ? .6 : 1); last = now; T += dt;
  const e = scn.e, { winX: x0, winY: y0, ww: w, wh: h } = L;
  ctx.drawImage(back, 0, 0);
  // ---- outside, clipped to glass
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  for (const s of scn.stars){ ctx.globalAlpha = .4 + .6 * (Math.sin(T * 1.3 + s.p) * .5 + .5); ctx.fillStyle = '#fff6d8'; ctx.fillRect(s.x, s.y, 1, 1); } ctx.globalAlpha = 1;
  for (const c of scn.clouds){ c.x += c.v * dt * 1.6 * MOTION; if (c.x - c.w > x0 + w) c.x = x0 - c.w; cloud(c.x, c.y, c.w, c.seed); }
  if (e.night){ for (const l of scn.outLights){ ctx.fillStyle = `rgba(255,210,122,${.12 + Math.sin(T * 1.7 + l.x) * .04})`; ctx.fillRect(l.x - 2, l.y - 2, 4, 4); }
    const sl = scn.streetLamp; ctx.fillStyle = 'rgba(255,227,154,.14)'; ctx.fillRect(sl.x - 5, sl.y - 3, 11, 7); ctx.fillRect(sl.x - 3, sl.y - 5, 7, 11); }
  const S = scn.spawn, wind = e.weather === 'storm' ? 30 : 8;
  for (let i = 0; i < parts.length; i++){ const p = parts[i];
    if (p.t === 'r'){ p.y += p.v * dt; p.x -= p.v * dt * .15; ctx.fillStyle = e.night ? 'rgba(170,190,255,.5)' : 'rgba(225,238,255,.65)'; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 3); if (p.y > y0 + h) parts[i] = S.r(false); }
    else if (p.t === 's'){ p.p += dt; p.y += p.v * dt; p.x += Math.sin(p.p) * 5 * dt + 2 * dt; ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); if (p.y > y0 + h) parts[i] = S.s(false); }
    else if (p.t === 'l'){ p.p += dt * 2; p.y += p.v * dt; p.x += (Math.sin(p.p) * 10 + wind) * dt; ctx.fillStyle = p.c; const fl = Math.sin(p.p * 1.7) > 0; ctx.fillRect(Math.round(p.x), Math.round(p.y), fl ? 2 : 1, fl ? 1 : 2);
      if (p.y > y0 + h || p.x > x0 + w + 3) parts[i] = (p.c === '#f9d3e1' || p.c === '#f7b6cf') ? S.p(false) : S.l(false); }
    else if (p.t === 'f'){ p.p += dt * .7; const a = Math.sin(p.p * 3) * .5 + .5; ctx.fillStyle = `rgba(255,248,180,${a})`; ctx.fillRect(Math.round(p.x + Math.sin(p.p * 1.3) * 6), Math.round(p.y + Math.sin(p.p * 2.1) * 3), 1, 1); } }
  if (e.weather === 'fog'){ ctx.fillStyle = e.night ? 'rgba(170,175,210,.18)' : 'rgba(245,245,250,.26)'; for (let b = 0; b < 3; b++){ const yy = scn.hz - 6 + b * 7, off = (T * (2 + b) * MOTION) % 30; for (let x = x0 - 30; x < x0 + w + 30; x += 30){ ctx.fillRect(Math.round(x + off), yy, 22, 4); } } }
  // rain drops sliding down the glass
  for (const d of drops){ if (d.hold > 0){ d.hold -= dt; } else { d.y += (8 + Math.random() * 30) * dt * MOTION; d.trail.push(d.y); if (d.trail.length > 6) d.trail.shift(); if (Math.random() < dt * .6) d.hold = Math.random() * 1.5; }
    if (d.y > y0 + h){ d.y = y0 + Math.random() * h * .3; d.x = x0 + 1 + Math.random() * (w - 2); d.trail = []; d.hold = Math.random() * 2; }
    ctx.fillStyle = 'rgba(230,240,255,.28)'; for (const ty of d.trail) ctx.fillRect(Math.round(d.x), Math.round(ty) - 2, 1, 1);
    ctx.fillStyle = 'rgba(240,248,255,.75)'; ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(Math.round(d.x), Math.round(d.y) - 1, 1, 1); }
  if (e.weather === 'storm' && !reduceMotion){ nextFlash -= dt; if (nextFlash < 0){ flash = 1; nextFlash = 9 + Math.random() * 12; audio.thunder(); }
    if (flash > 0){ ctx.fillStyle = `rgba(255,255,240,${flash * .5})`; ctx.fillRect(x0, y0, w, h); flash -= dt * 2.5; } }
  ctx.restore();
  // fairy lights + candle
  for (const f of scn.fairy){ const a = .55 + .45 * Math.sin(T * 1.1 + f.p); ctx.globalAlpha = a; ctx.fillStyle = f.c; ctx.fillRect(f.x + 1, f.y, 1, 1); if (e.night){ ctx.globalAlpha = a * .25; ctx.fillRect(f.x, f.y - 1, 3, 3); } } ctx.globalAlpha = 1;
  { const cd = scn.candle, fl = Math.sin(T * 9) > .3 ? 1 : 0; if (fl !== lastFl){ lastFl = fl; if (glint <= 0 && Math.random() < .06) glint = .07; } ctx.fillStyle = '#ffd27a'; ctx.fillRect(cd.x + (fl ? 1 : 0), cd.y, 1, 2); ctx.fillStyle = '#fff4c4'; ctx.fillRect(cd.x, cd.y + 1, 1, 1); }
  // clock with real time
  if (scn.clock){ const d = new Date(), { x, y } = scn.clock, hA = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2, mA = d.getMinutes() / 60 * Math.PI * 2;
    ctx.fillStyle = '#3a2a24'; for (let i = 1; i <= 3; i++) ctx.fillRect(Math.round(x + Math.sin(mA) * i), Math.round(y - Math.cos(mA) * i), 1, 1);
    ctx.fillStyle = '#8a2f2f'; for (let i = 1; i <= 2; i++) ctx.fillRect(Math.round(x + Math.sin(hA) * i), Math.round(y - Math.cos(hA) * i), 1, 1); ctx.fillStyle = '#3a2a24'; ctx.fillRect(x, y, 1, 1); }
  updateCat(dt, now, 'sill');
  ctx.drawImage(front, 0, 0);
  // mug steam
  { const m = scn.mug; for (let i = 0; i < 4; i++){ const k = (T * .5 + i / 4) % 1; ctx.globalAlpha = (1 - k) * .5; ctx.fillStyle = '#fffaf0'; ctx.fillRect(Math.round(m.x + Math.sin(T * 2 + i * 2) * 1), Math.round(m.y - k * 7), 1, 1); } ctx.globalAlpha = 1; }
  updateCouple(dt, now); drawCouple(T, now);
  updateCat(dt, now, 'floor');
  // light
  ctx.drawImage(dark, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = .9 + Math.sin(T * 3.1) * .05 + Math.sin(T * 7.3) * .03; ctx.drawImage(glow, 0, 0); ctx.globalAlpha = 1;
  if (scn.beam){ ctx.fillStyle = `rgba(255,228,170,${scn.beam})`; ctx.beginPath(); ctx.moveTo(x0, y0 + 2); ctx.lineTo(x0 + w, y0 + 2); ctx.lineTo(x0 + w + 34, H); ctx.lineTo(x0 + 26, H); ctx.closePath(); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over';
  for (const m of motes){ m.p += dt * m.v * .4; const x = m.x + Math.sin(m.p) * 6 + (m.y - y0) * .2, y = m.y + Math.sin(m.p * .7) * 4; ctx.globalAlpha = .35 + .35 * Math.sin(m.p * 3); ctx.fillStyle = '#fff3d0'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); } ctx.globalAlpha = 1;
  // glasses glint when the candle flickers just right
  if (glint > 0){ glint -= dt; const gp = scn.glasses; ctx.fillStyle = '#ffffff'; ctx.fillRect(gp.x + 1, gp.y - 1, 1, 1); ctx.globalAlpha = .6; ctx.fillRect(gp.x, gp.y, 1, 1); ctx.globalAlpha = 1; }
  // night moth circling the table lamp
  if (e.night && scn.tableLamp){ moth.a += dt * (reduceMotion ? .35 : 1.1); const tl = scn.tableLamp,
      mx = Math.round(tl.x + Math.cos(moth.a) * 7), my = Math.round(tl.y - 1 + Math.sin(moth.a * 1.6) * 3);
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(mx, my, 1, 1); if (!reduceMotion && Math.sin(T * 24) > 0){ ctx.fillStyle = 'rgba(232,220,192,.6)'; ctx.fillRect(mx - 1, my, 1, 1); } }
  drawZs(dt);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- audio + HUD
const audio = window.Lofi.create();
const windy = () => (state.auto.wind || 0) >= 25 && state.over.weather === 'auto';
function renderHUD(){
  const e = eff(), a = state.auto, overridden = state.over.season !== 'auto' || state.over.weather !== 'auto' || state.over.time !== 'auto';
  $('#icon').textContent = ICON[e.weather][e.night ? 1 : 0];
  $('#temp').textContent = a.temp == null ? '--°' : `${Math.round(a.temp)}°${a.unit || 'C'}`;
  const label = state.over.weather === 'auto' && a.code != null && LABELS[a.code] ? LABELS[a.code] : e.weather[0].toUpperCase() + e.weather.slice(1);
  $('#desc').innerHTML = `${label} · ${SEASON_WORD[e.season]}${overridden ? '<span class="tag">pretend</span>' : ''}<br><span style="font-weight:600;color:var(--soft)">${COZY[e.weather][e.night ? 1 : 0]}</span>`;
  $('#place').textContent = a.place || '';
}
function applyAll(){ build(); renderHUD(); audio.weather(scn.e.weather, windy()); }
const loadWeather = () => CW.loadInto(state, applyAll);
window.Lofi.mountUI(audio, { sound: '#sound', label: '#soundLabel', panel: '#sndPanel', tracks: '#tracks', now: '#nowPlaying', vol: '#vol', dust: '#dust' });
$('#chipToggle').addEventListener('click', () => { const c = $('#chips'), open = c.hidden; c.hidden = !open; $('#chipToggle').setAttribute('aria-expanded', open); $('#chipToggle').textContent = open ? '✕ close' : '✨ change the weather outside'; });
document.querySelectorAll('.group[data-k]').forEach(g => g.addEventListener('click', ev => {
  const b = ev.target.closest('.chip'); if (!b) return;
  g.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); state.over[g.dataset.k] = b.dataset.v; applyAll();
}));
// tap the couple: she stirs & sighs. tap elsewhere: the cat wanders by. double-tap: hide UI
let lastTap = 0;
cv.addEventListener('pointerdown', ev => { const n = performance.now(), x = ev.clientX / PX, y = ev.clientY / PX;
  if (n - lastTap < 320){ document.body.classList.toggle('hide-ui'); lastTap = n; return; } lastTap = n;
  if (x > L.cx && x < L.cx + L.cw && y > L.cTop - 10 && y < L.cBot){ if (her.shift <= 0) sigh(n); }
  else if (!cat) spawnCat(y < L.floorY - 10 ? 'sill' : 'floor'); });
addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
setInterval(loadWeather, 15 * 60 * 1000);
const qs = new URLSearchParams(location.search);
for (const k of ['season', 'weather', 'time']) if (qs.get(k)){ state.over[k] = qs.get(k); document.querySelectorAll(`.group[data-k=${k}] .chip`).forEach(x => x.setAttribute('aria-pressed', x.dataset.v === qs.get(k))); }
resize(); renderHUD(); requestAnimationFrame(t => { last = t; frame(t); }); loadWeather();
})();
