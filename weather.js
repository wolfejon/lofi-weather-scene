/* Tiny Weather Window — shared weather, season, palette helpers (no deps). */
(function (root) {
'use strict';
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t) => a + (b-a)*t;
function rng(seed){ let s = seed >>> 0 || 1; return () => (s = (s*1664525 + 1013904223) >>> 0) / 4294967296; }
function hex(c){ const n = parseInt(c.slice(1),16); return [n>>16, (n>>8)&255, n&255]; }
function toHex(r,g,b){ return '#' + [r,g,b].map(v => clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join(''); }
function mix(a,b,t){ const A = hex(a), B = hex(b); return toHex(lerp(A[0],B[0],t), lerp(A[1],B[1],t), lerp(A[2],B[2],t)); }
function grey(a,t){ const [r,g,b] = hex(a); const y = r*.3+g*.59+b*.11; return toHex(lerp(r,y,t), lerp(g,y,t), lerp(b,y,t)); }

function seasonFor(lat, d){
  let m = d.getMonth();
  if (lat < 0) m = (m + 6) % 12;
  if (Math.abs(lat) < 12) return 'summer';
  return m <= 1 || m === 11 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';
}
function weatherFromCode(c){
  if (c === 0 || c === 1) return 'clear';
  if (c === 2 || c === 3) return 'cloudy';
  if (c === 45 || c === 48) return 'fog';
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
  if (c >= 95) return 'storm';
  return 'cloudy';
}
const LABELS = {0:'Clear sky',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Frosty fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Freezing drizzle',57:'Freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Rain showers',81:'Rain showers',82:'Big showers',85:'Snow showers',86:'Snow showers',95:'Thunderstorm',96:'Thunder + hail',99:'Thunder + hail'};
const ICON = { clear:['☀️','🌙'], cloudy:['⛅','☁️'], rain:['🌧️','🌧️'], snow:['🌨️','🌨️'], fog:['🌫️','🌫️'], storm:['⛈️','⛈️'] };
const SEASON_WORD = { spring:'spring 🌸', summer:'summer 🌻', autumn:'autumn 🍂', winter:'winter ❄️' };

const PAL = {
  spring: { skyT:'#8fc6ee', skyB:'#f6d8e6', far:'#a9c3d9', mid:'#8fc98a', near:'#6db36e', grass:'#7cc274', grass2:'#5a9e5c', road:'#e7cfa6', road2:'#cfb187',
            leaf:['#7fc77a','#5ea962','#a6dd8c'], bloom:['#f7b6cf','#f9d3e1','#ee93b6'], trunk:'#7a5640', wall:['#fbeedd','#f4e1c6','#e9d4f0'], roof:['#e7837a','#7aa7d8','#b98bd6'], flower:['#ffffff','#ffd86b','#f39bbd','#b9a2ff'] },
  summer: { skyT:'#59b4f0', skyB:'#cdeefd', far:'#8db7d9', mid:'#5fb36a', near:'#3f9a55', grass:'#5fb85d', grass2:'#45964b', road:'#ead2a0', road2:'#d2b47c',
            leaf:['#4fa857','#3b8d47','#78c46a'], bloom:['#ffd35c','#ff9f6b','#ffffff'], trunk:'#6e4b33', wall:['#fff3df','#ffe9c2','#e6f1f5'], roof:['#e86b5a','#4f8fd1','#f2a541'], flower:['#ffe066','#ff8fa3','#ffffff','#ff9f43'] },
  autumn: { skyT:'#f0a982', skyB:'#ffe2b8', far:'#c79b97', mid:'#c68a4b', near:'#a8693a', grass:'#b9a453', grass2:'#9a8641', road:'#e3c393', road2:'#c9a271',
            leaf:['#e9772f','#d6532b','#f2b33d','#c43d2b'], bloom:['#f2b33d','#e9772f'], trunk:'#5d3f2c', wall:['#fbe9cf','#f1d7b3','#efe0cf'], roof:['#a8462f','#6b4a8a','#4f6e5a'], flower:['#f2b33d','#e46a3a','#fff1c1'] },
  winter: { skyT:'#9fb9da', skyB:'#e8eff8', far:'#c6d3e6', mid:'#e3ebf5', near:'#cfdcec', grass:'#eef4fb', grass2:'#d4e1ef', road:'#c9d4e2', road2:'#b0bed1',
            leaf:['#3f6b5f','#2f5a50','#55806f'], bloom:['#ffffff'], trunk:'#5b4a44', wall:['#f6efe6','#efe4d6','#e2e9f2'], roof:['#b7524a','#4e6a9a','#6f5a8c'], flower:['#ffffff'] },
};
const NIGHT = '#141a3a';
function palette(season, weather, night){
  const p = JSON.parse(JSON.stringify(PAL[season]));
  const dull = weather === 'clear' ? 0 : weather === 'cloudy' ? .35 : weather === 'fog' ? .55 : .5;
  if (dull){ p.skyT = mix(grey(p.skyT, dull), '#9aa3b5', dull*.5); p.skyB = mix(grey(p.skyB, dull), '#c8ccd6', dull*.5); p.far = grey(p.far, dull*.6); }
  if (night){
    p.skyT = mix(p.skyT, '#0d1030', .86); p.skyB = mix(p.skyB, '#3b3f78', .7);
    const dim = (c, t=.58) => mix(c, NIGHT, t);
    for (const k of ['far','mid','near','grass','grass2','road','road2','trunk']) p[k] = dim(p[k], k==='far'?.62:.58);
    for (const k of ['leaf','bloom','wall','roof','flower']) p[k] = p[k].map(c => dim(c));
  }
  return p;
}

const TZ = { 'America/Los_Angeles':[34.05,-118.24,'Los Angeles'], 'America/Vancouver':[49.28,-123.12,'Vancouver'], 'America/Denver':[39.74,-104.99,'Denver'], 'America/Phoenix':[33.45,-112.07,'Phoenix'],
  'America/Chicago':[41.88,-87.63,'Chicago'], 'America/New_York':[40.71,-74.01,'New York'], 'America/Toronto':[43.65,-79.38,'Toronto'], 'America/Anchorage':[61.22,-149.9,'Anchorage'], 'Pacific/Honolulu':[21.31,-157.86,'Honolulu'],
  'America/Mexico_City':[19.43,-99.13,'Mexico City'], 'America/Sao_Paulo':[-23.55,-46.63,'São Paulo'], 'Europe/London':[51.51,-0.13,'London'], 'Europe/Paris':[48.86,2.35,'Paris'], 'Europe/Berlin':[52.52,13.4,'Berlin'],
  'Europe/Madrid':[40.42,-3.7,'Madrid'], 'Europe/Rome':[41.9,12.5,'Rome'], 'Europe/Amsterdam':[52.37,4.9,'Amsterdam'], 'Asia/Tokyo':[35.68,139.69,'Tokyo'], 'Asia/Seoul':[37.57,126.98,'Seoul'], 'Asia/Shanghai':[31.23,121.47,'Shanghai'],
  'Asia/Kolkata':[28.61,77.21,'Delhi'], 'Asia/Singapore':[1.35,103.82,'Singapore'], 'Australia/Sydney':[-33.87,151.21,'Sydney'], 'Australia/Melbourne':[-37.81,144.96,'Melbourne'], 'Pacific/Auckland':[-36.85,174.76,'Auckland'] };
function getPosition(){
  return new Promise(res => {
    const fallback = () => { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; const g = TZ[tz];
      res(g ? { lat: g[0], lon: g[1], name: `near ${g[2]} (from your time zone)` } : { lat: 47.61, lon: -122.33, name: 'Seattle (default)' }); };
    if (!navigator.geolocation) return fallback();
    const to = setTimeout(fallback, 9000);
    navigator.geolocation.getCurrentPosition(p => { clearTimeout(to); res({ lat: p.coords.latitude, lon: p.coords.longitude, name: null }); },
      () => { clearTimeout(to); fallback(); }, { maximumAge: 30*60*1000, timeout: 8000, enableHighAccuracy: false });
  });
}
const imperial = () => /^en-US/.test(navigator.language) || /^America\/(?!Sao|Mexico|Toronto|Vancouver)/.test(Intl.DateTimeFormat().resolvedOptions().timeZone);
async function fetchWeather(pos){
  const imp = imperial();
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat.toFixed(3)}&longitude=${pos.lon.toFixed(3)}&current=temperature_2m,weather_code,is_day,wind_speed_10m&wind_speed_unit=kmh&timezone=auto${imp ? '&temperature_unit=fahrenheit' : ''}`;
  const r = await fetch(u); const j = await r.json(); const c = j.current;
  return { temp: c.temperature_2m, unit: imp ? 'F' : 'C', code: c.weather_code, weather: weatherFromCode(c.weather_code), night: c.is_day === 0, wind: c.wind_speed_10m || 0 };
}
async function placeName(pos){
  try { const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.lat}&longitude=${pos.lon}&localityLanguage=en`);
    const j = await r.json(); const n = j.city || j.locality || j.principalSubdivision;
    return n ? `📍 ${n}${j.principalSubdivisionCode ? ', ' + j.principalSubdivisionCode.split('-').pop() : ''}` : null; } catch { return null; }
}
/* Fills a state.auto object step by step and calls onChange() after each step. */
async function loadInto(state, onChange){
  const pos = await getPosition(); state.lat = pos.lat; state.lon = pos.lon;
  const a = state.auto;
  a.season = seasonFor(pos.lat, new Date());
  const h = new Date().getHours(); a.night = h < 6 || h >= 19;
  a.place = pos.name || 'your spot'; onChange();
  try { Object.assign(a, await fetchWeather(pos)); }
  catch (err){ a.code = null; a.place = (a.place || '') + ' · offline, imagining the weather'; }
  onChange();
  if (!pos.name){ const n = await placeName(pos); if (n){ a.place = n; onChange(); } }
}

root.CozyWeather = { clamp, lerp, rng, hex, toHex, mix, grey, seasonFor, weatherFromCode, LABELS, ICON, SEASON_WORD, PAL, NIGHT, palette, getPosition, fetchWeather, placeName, loadInto };
})(window);
