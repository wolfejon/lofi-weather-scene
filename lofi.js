/* Tiny Weather Window — generative lofi engine (Web Audio, no samples).
   Clean by default: no constant vinyl hiss. Rain/wind beds are soft brown noise, gated to weather. */
(function (root) {
'use strict';
const TRACKS = [
  { id:'rain', name:'Soft Rain Piano', emoji:'🌧️', mood:'slow, hushed, Am–F–C–G',
    bpm:64, steps:8, swing:.12, lp:2000, verb:.28,
    prog:[[57,60,64,67],[53,57,60,64],[52,55,59,60],[55,57,60,62]], bassRoots:[45,41,36,43],
    scale:[69,72,74,76,79,81], mel:[.24,.12], melVel:.045,
    comp:{ step:3, p:.55 }, bass:{ 0:0, 4:[0,7] }, kick:{ 0:1, 5:.45 }, snare:{ 4:1 }, kickVol:.26, snareVol:.07, hat:.010 },
  { id:'evening', name:'Warm Evening Keys', emoji:'🌇', mood:'warm major, F–C–Am–G',
    bpm:76, steps:8, swing:.14, lp:2600, verb:.26,
    prog:[[57,60,64,67],[52,55,60,64],[57,60,64,67],[55,59,62,64]], bassRoots:[41,40,45,43],
    scale:[72,74,76,79,81,84], mel:[.3,.16], melVel:.048,
    comp:{ step:3, p:.65 }, bass:{ 0:0, 3:[0,0,7], 4:[0,7] }, kick:{ 0:1, 3:.35, 5:.4 }, snare:{ 4:1 }, kickVol:.28, snareVol:.075, hat:.012 },
  { id:'midnight', name:'Midnight Walk', emoji:'🌙', mood:'minor, deep bass, quiet drums',
    bpm:68, steps:8, swing:.16, lp:1500, verb:.32,
    prog:[[53,57,60,64],[50,53,57,58],[55,58,62,65],[55,61,64,70]], bassRoots:[38,34,43,45],
    scale:[62,65,67,69,72,74], mel:[.2,.08], melVel:.04,
    comp:{ step:5, p:.4 }, bass:{ 0:0, 2:[7,12], 4:[0,12], 6:[7,10,-2] }, bassVol:.3, kick:{ 0:1, 5:.3 }, snare:{ 4:.8 }, kickVol:.18, snareVol:.04, hat:0 },
  { id:'sunday', name:'Sunday Dust', emoji:'☕', mood:'very sparse, lots of space',
    bpm:58, steps:8, swing:.1, lp:1800, verb:.42, strum:.06,
    prog:[[52,55,59,62],[52,55,57,60],[53,57,59,64],[53,56,60,62]], bassRoots:[36,33,41,41],
    scale:[76,79,81,84,86,88], mel:[.1,.03], melVel:.04,
    comp:null, bass:{ 0:0 }, kick:{ 0:.5 }, snare:{}, kickVol:.14, snareVol:0, hat:0, chordLen:8 },
  { id:'window', name:'Window Seat', emoji:'🪟', mood:'gentle 6/8 sway',
    stepDur:.25, steps:6, swing:0, lp:2200, verb:.3,
    prog:[[55,58,62,63],[51,55,58,62],[55,60,63,67],[56,58,62,65]], bassRoots:[39,36,44,46],
    scale:[63,65,67,70,72,75], mel:[.3,.15], melVel:.045,
    comp:{ step:3, p:.7 }, bass:{ 0:0, 3:[7] }, kick:{ 0:1 }, snare:{ 3:.7 }, kickVol:.2, snareVol:.045, hat:.006, hatSteps:[1,2,4,5], brush:true, chordLen:5.5 },
  { id:'rainyminor', name:'Rainy Minor', emoji:'☔', mood:'moody, Dm9–Bbmaj7–Gm7–A7, sparse',
    bpm:60, steps:8, swing:.14, lp:1400, verb:.38,
    prog:[[50,53,57,64],[46,50,53,57],[43,46,50,53],[45,49,52,55]], bassRoots:[38,34,31,33],
    scale:[62,65,67,69,72,74], mel:[.16,.05], melVel:.038,
    comp:{ step:5, p:.35 }, bass:{ 0:0, 5:[7,12] }, bassVol:.28, kick:{ 0:1, 6:.25 }, snare:{ 4:.7 }, kickVol:.2, snareVol:.04, hat:0 },
  { id:'bluehour', name:'Blue Hour', emoji:'🌆', mood:'moody, Cm9–Abmaj7–Fm9–G7, deep bass',
    bpm:66, steps:8, swing:.18, lp:1300, verb:.34,
    prog:[[48,51,55,62],[44,48,51,55],[41,44,48,55],[43,47,50,53]], bassRoots:[36,32,29,31],
    scale:[60,63,65,67,70,72], mel:[.22,.08], melVel:.04,
    comp:{ step:3, p:.45 }, bass:{ 0:0, 3:[0,7], 6:[10,12] }, bassVol:.32, kick:{ 0:1, 3:.3, 5:.35 }, snare:{ 4:.9 }, kickVol:.22, snareVol:.045, hat:.006, hatSteps:[2,6] },
  { id:'quietstorm', name:'Quiet Storm', emoji:'⛈️', mood:'moody, very slow, Em–C–Am–B7, drone',
    bpm:54, steps:8, swing:.08, lp:1100, verb:.46, strum:.07,
    prog:[[52,55,59,62],[48,52,55,59],[45,48,52,55],[47,51,54,57]], bassRoots:[28,36,33,35],
    scale:[64,67,69,71,74,76], mel:[.12,.03], melVel:.036,
    comp:null, bass:{ 0:0, 4:[7] }, bassVol:.3, kick:{ 0:.8 }, snare:{ 4:.5 }, kickVol:.16, snareVol:.03, hat:0, brush:true, chordLen:8 },
  { id:'honeytea', name:'Honey Tea', emoji:'🍯', mood:'cozy, Fmaj7–Em7–Dm7–Cmaj7, soft bounce',
    bpm:80, steps:8, swing:.16, lp:2800, verb:.24,
    prog:[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]], bassRoots:[41,40,38,36],
    scale:[72,74,76,77,79,81,84], mel:[.32,.18], melVel:.046,
    comp:{ step:3, p:.7 }, bass:{ 0:0, 3:[7], 5:[0,12] }, kick:{ 0:1, 5:.5 }, snare:{ 4:1 }, kickVol:.26, snareVol:.06, hat:.012 },
  { id:'fireplace', name:'Fireplace', emoji:'🔥', mood:'cozy, Bbmaj9–Gm9–Ebmaj7–F7, brushes',
    bpm:70, steps:8, swing:.12, lp:2300, verb:.3,
    prog:[[46,50,53,57],[43,46,50,57],[51,55,58,62],[53,57,60,63]], bassRoots:[34,31,39,41],
    scale:[70,72,74,77,79,82], mel:[.26,.12], melVel:.044,
    comp:{ step:5, p:.6 }, bass:{ 0:0, 4:[0,7] }, kick:{ 0:1, 5:.35 }, snare:{ 4:1 }, kickVol:.2, snareVol:.05, hat:.008, hatSteps:[2,6], brush:true },
  { id:'blanket', name:'Soft Blanket', emoji:'🧶', mood:'cozy, lullaby 6/8, Gmaj7–Cmaj7',
    stepDur:.28, steps:6, swing:0, lp:2400, verb:.34,
    prog:[[55,59,62,66],[48,52,55,59],[52,55,59,62],[50,54,57,60]], bassRoots:[43,36,40,38],
    scale:[71,74,76,78,79,83], mel:[.28,.12], melVel:.042,
    comp:{ step:3, p:.6 }, bass:{ 0:0, 3:[7] }, kick:{ 0:.8 }, snare:{ 3:.5 }, kickVol:.16, snareVol:.035, hat:0, brush:true, chordLen:5.5 },
];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const pick = a => a[(Math.random()*a.length)|0];

function create(){
  let ac = null, master, lp, verbIn, hatBus, noiseBuf, brownBuf, rainGain, windGain, dustGain;
  let playing = false, nextTime = 0, step = 0, timer = null, vol = .55, melIdx = 2, dust = false;
  let track = TRACKS[0];
  try { const saved = localStorage.getItem('lofi.track'); const t = TRACKS.find(x => x.id === saved); if (t) track = t; dust = localStorage.getItem('lofi.dust') === '1'; } catch {}
  let wx = { weather:'clear', windy:false };

  function init(){
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0;
    lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = track.lp; lp.Q.value = .3;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -22; comp.ratio.value = 3; comp.knee.value = 12;
    lp.connect(comp); comp.connect(master); master.connect(ac.destination);
    verbIn = ac.createGain(); verbIn.gain.value = track.verb;
    const d1 = ac.createDelay(1), fb = ac.createGain(), dl = ac.createBiquadFilter();
    d1.delayTime.value = .27; fb.gain.value = .36; dl.type = 'lowpass'; dl.frequency.value = 1300;
    verbIn.connect(d1); d1.connect(dl); dl.connect(fb); fb.connect(d1); dl.connect(lp);
    hatBus = ac.createBiquadFilter(); hatBus.type = 'lowpass'; hatBus.frequency.value = 7500; hatBus.connect(comp);
    const n = ac.sampleRate * 2;
    noiseBuf = ac.createBuffer(1, n, ac.sampleRate); const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random()*2 - 1;
    brownBuf = ac.createBuffer(1, n, ac.sampleRate); const b = brownBuf.getChannelData(0); let last = 0;
    for (let i = 0; i < n; i++){ last = (last + .02 * (Math.random()*2-1)) / 1.02; b[i] = last * 3.2; }
    // smooth loop seam (avoid a click every 2s)
    const fade = 2048; for (let i = 0; i < fade; i++){ const k = i / fade; b[i] *= k; b[n-1-i] *= k; d[i] *= k; d[n-1-i] *= k; }
    const bed = (fType, freq, q) => { const s = ac.createBufferSource(); s.buffer = brownBuf; s.loop = true; s.loopStart = 0; s.loopEnd = n / ac.sampleRate;
      const f = ac.createBiquadFilter(); f.type = fType; f.frequency.value = freq; f.Q.value = q; const g = ac.createGain(); g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(master); s.start(ac.currentTime + Math.random()); return { g, f }; };
    // rain: soft, low, no fizz
    const rain = bed('lowpass', 650, .3); rainGain = rain.g;
    // wind: slow-breathing bandpassed whoosh (only when windy / stormy)
    const wind = bed('bandpass', 420, .9); windGain = wind.g;
    const lfo = ac.createOscillator(), lfoG = ac.createGain(); lfo.frequency.value = .07; lfoG.gain.value = 180; lfo.connect(lfoG); lfoG.connect(wind.f.frequency); lfo.start();
    // optional "dust": near-inaudible warm bed (off by default) + rare soft ticks scheduled below
    const du = bed('lowpass', 900, .3); dustGain = du.g;
  }
  const wob = t => Math.sin(t * 2 * Math.PI * .45) * 5;
  function keys(m, t, len, vel){
    const f = mtof(m); vel *= .85 + Math.random()*.3;
    for (const [type, mult, g, det] of [['triangle',1,.5,-4],['sine',1,.6,4],['sine',2,.1,0]]){
      const o = ac.createOscillator(), gn = ac.createGain(); o.type = type; o.frequency.value = f * mult; o.detune.setValueAtTime(det + wob(t), t);
      gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vel * g, t + .015); gn.gain.exponentialRampToValueAtTime(vel * g * .35, t + .45); gn.gain.exponentialRampToValueAtTime(.0001, t + len);
      o.connect(gn); gn.connect(lp); gn.connect(verbIn); o.start(t); o.stop(t + len + .05);
    }
  }
  function bass(m, t, len, v){ const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = mtof(m);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + len); o.connect(g); g.connect(lp); o.start(t); o.stop(t + len + .05); }
  function kick(t, v){ const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(105, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .32); o.connect(g); g.connect(lp); o.start(t); o.stop(t + .35); }
  function noiseHit(t, v, type, freq, q, len, dest, buf){ const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = buf || noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + len); s.connect(f); f.connect(g); g.connect(dest); s.start(t, .1 + Math.random()*1.5); s.stop(t + len + .02); }
  function schedule(){
    const tr = track, SD = tr.stepDur || 60 / tr.bpm / 2;
    while (nextTime < ac.currentTime + .3){
      const bar = Math.floor(step / tr.steps) % tr.prog.length, s = step % tr.steps, ch = tr.prog[bar], root = tr.bassRoots[bar];
      const t = nextTime + (s % 2 ? SD * tr.swing : 0);
      if (s === 0){ ch.forEach((m, i) => keys(m, t + i * (tr.strum || .025), SD * (tr.chordLen || 7), .08)); }
      if (tr.comp && s === tr.comp.step && Math.random() < tr.comp.p) ch.slice(1).forEach((m, i) => keys(m, t + i*.02, SD*2.5, .045));
      if (tr.bass[s] !== undefined){ const iv = Array.isArray(tr.bass[s]) ? pick(tr.bass[s]) : tr.bass[s]; bass(root + iv, t, SD * (s === 0 ? 3.5 : 2.6), tr.bassVol || .22); }
      const mp = tr.mel[s % 2];
      if (Math.random() < mp){ melIdx = Math.max(0, Math.min(tr.scale.length - 1, melIdx + pick([-2,-1,-1,1,1,2,0]))); keys(tr.scale[melIdx], t, SD*3.2, tr.melVel); }
      const drums = wx.weather !== 'fog';
      if (drums){
        if (tr.kick[s] && Math.random() < tr.kick[s]) kick(t, tr.kickVol);
        if (tr.snare[s] && Math.random() < tr.snare[s]) tr.brush ? noiseHit(t, tr.snareVol, 'bandpass', 1200, .6, .35, lp) : noiseHit(t, tr.snareVol, 'bandpass', 1700, .7, .18, lp);
        if (tr.hat && (!tr.hatSteps || tr.hatSteps.includes(s))) noiseHit(t, s % 2 ? tr.hat * .6 : tr.hat, 'bandpass', 6000, 1.2, .04, hatBus);
      }
      if (dust && Math.random() < .05) noiseHit(t + Math.random()*SD, .012 + Math.random()*.01, 'lowpass', 2500, .5, .012, master);
      nextTime += SD; step++;
    }
  }
  function applyBeds(){
    if (!ac) return; const now = ac.currentTime, w = wx.weather;
    rainGain.gain.setTargetAtTime(w === 'rain' ? .05 : w === 'storm' ? .07 : 0, now, 1.2);
    windGain.gain.setTargetAtTime(w === 'storm' ? .06 : wx.windy ? .04 : 0, now, 2);
    dustGain.gain.setTargetAtTime(dust ? .02 : 0, now, .5);
  }
  return {
    TRACKS,
    get on(){ return playing; },
    get track(){ return track; },
    get dust(){ return dust; },
    async toggle(){
      if (!ac) init();
      if (ac.state === 'suspended') await ac.resume();
      playing = !playing;
      const now = ac.currentTime; master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now);
      if (playing){ master.gain.linearRampToValueAtTime(vol * .9, now + 2.5); nextTime = now + .1; step = 0; schedule(); timer = setInterval(schedule, 80); applyBeds(); }
      else { master.gain.linearRampToValueAtTime(0, now + .6); clearInterval(timer); }
      return playing;
    },
    setVol(v){ vol = v; if (ac && playing) master.gain.setTargetAtTime(vol * .9, ac.currentTime, .1); },
    setTrack(id){ const t = TRACKS.find(x => x.id === id); if (!t) return; track = t; try { localStorage.setItem('lofi.track', id); } catch {}
      if (ac){ lp.frequency.setTargetAtTime(t.lp, ac.currentTime, .4); verbIn.gain.setTargetAtTime(t.verb, ac.currentTime, .4); if (playing){ step = 0; nextTime = Math.max(nextTime, ac.currentTime + .15); } } },
    setDust(on){ dust = !!on; try { localStorage.setItem('lofi.dust', dust ? '1' : '0'); } catch {} applyBeds(); },
    weather(w, windy){ wx = { weather: w, windy: !!windy }; applyBeds(); },
    thunder(){ if (!ac || !playing) return; const t = ac.currentTime + .4 + Math.random(), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = brownBuf; f.type = 'lowpass'; f.frequency.value = 160; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3, t + .4); g.gain.exponentialRampToValueAtTime(.0001, t + 3);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 3.1); },
    /* soft sleepy sigh: breathy filtered noise swell gliding down */
    sigh(){ if (!ac || !playing) return; const t = ac.currentTime + .05, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = noiseBuf; f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(380, t + 1.6);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.035, t + .45); g.gain.exponentialRampToValueAtTime(.0001, t + 1.8);
      s.connect(f); f.connect(g); g.connect(lp); s.start(t, Math.random()); s.stop(t + 1.9); },
  };
}
/* Shared sound controls: Start button, volume, track chips, "now playing", optional dust toggle. */
function mountUI(engine, opts){
  const $ = s => document.querySelector(s);
  const btn = $(opts.sound), label = $(opts.label), panel = $(opts.panel), list = $(opts.tracks), now = $(opts.now), vol = $(opts.vol), dustBtn = opts.dust && $(opts.dust);
  list.innerHTML = TRACKS.map(t => `<button class="chip" data-track="${t.id}" title="${t.mood}">${t.emoji} ${t.name}</button>`).join('');
  const sync = () => {
    list.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.track === engine.track.id));
    now.innerHTML = `${engine.on ? '♪ now playing' : 'up next'} · <b>${engine.track.name}</b>`;
    if (dustBtn){ dustBtn.setAttribute('aria-pressed', engine.dust); dustBtn.textContent = engine.dust ? '🎞️ dust on' : '🎞️ dust off'; }
  };
  btn.addEventListener('click', async () => {
    const on = await engine.toggle(); btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on);
    label.textContent = on ? 'Lofi on · tap to mute' : 'Start lofi sound'; panel.hidden = !on; sync();
    if (opts.onToggle) opts.onToggle(on);
  });
  list.addEventListener('click', ev => { const b = ev.target.closest('.chip'); if (!b) return; engine.setTrack(b.dataset.track); sync(); });
  vol.addEventListener('input', e => engine.setVol(e.target.value / 100));
  if (dustBtn) dustBtn.addEventListener('click', () => { engine.setDust(!engine.dust); sync(); });
  sync();
}
root.Lofi = { TRACKS, create, mountUI };
})(window);
