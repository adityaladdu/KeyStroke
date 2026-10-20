"use strict";
/* ---------- storage (versioned, safe) ---------- */
const K = { p: "keystroke:v1:prefs", h: "keystroke:v1:history" };
const ls = {
  get(k, d) {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v ?? d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};
const DEF = {
  theme: "dark",
  mode: "time",
  dur: 30,
  words: 25,
  diff: "normal",
  preset: "razer-green",
  vol: 0.5,
  intensity: "balanced",
  press: true,
  release: true,
  modkeys: false,
  caret: "line",
  mute: false,
  pv: {},
  custom: "",
  saveResults: true,
  celebrateRecords: true,
  celebrationSound: true,
  celebrationIntensity: "balanced",
  celebrationAutoDismiss: true,
  celebrationMinImprovement: 1,
};
let P = Object.assign({}, DEF, ls.get(K.p, {}));
if (typeof P.pv !== "object" || !P.pv) P.pv = {};
P.celebrationMinImprovement = Math.max(1, Math.min(1000, Math.round(Number(P.celebrationMinImprovement) || 1)));
let H = ls.get(K.h, []);
if (!Array.isArray(H)) H = [];
const save = () => ls.set(K.p, P);
/* ---------- presets (synthesized fallback; no recorded assets bundled) ---------- */
const PRE = [
  {
    id: "red",
    n: "Cherry MX Red-style",
    c: "Linear",
    d: "Smooth, clean, medium-pitched tap.",
    b: 180,
    nz: 1800,
    dc: 0.05,
  },
  {
    id: "yellow",
    n: "Gateron Yellow-style",
    c: "Linear",
    d: "Bright, light and slightly higher.",
    b: 200,
    nz: 2200,
    dc: 0.045,
  },
  {
    id: "thock",
    n: "Deep Thock",
    c: "Linear",
    d: "Low, rounded and full-bodied.",
    b: 110,
    nz: 900,
    dc: 0.09,
  },
  {
    id: "soft",
    n: "Soft Linear",
    c: "Linear",
    d: "Muted and gentle, very quiet.",
    b: 150,
    nz: 1200,
    dc: 0.06,
    g: 0.8,
  },
  {
    id: "brown",
    n: "Cherry MX Brown-style",
    c: "Tactile",
    d: "Soft bump with a mid-range tap.",
    b: 170,
    nz: 2000,
    dc: 0.055,
    bump: 1,
  },
  {
    id: "u4t",
    n: "Boba U4T-style",
    c: "Tactile",
    d: "Pronounced, dull and rounded bump.",
    b: 140,
    nz: 1500,
    dc: 0.07,
    bump: 1.4,
  },
  {
    id: "round",
    n: "Rounded Tactile",
    c: "Tactile",
    d: "Warm, mellow tactile feel.",
    b: 130,
    nz: 1300,
    dc: 0.065,
    bump: 1,
  },
  {
    id: "blue",
    n: "Cherry MX Blue-style",
    c: "Clicky",
    d: "Classic sharp click with a clack.",
    b: 220,
    nz: 3200,
    dc: 0.05,
    click: 1,
  },
  {
    id: "white",
    n: "Kailh Box White-style",
    c: "Clicky",
    d: "Crisp, high click, lighter body.",
    b: 240,
    nz: 3800,
    dc: 0.045,
    click: 1.2,
  },
  {
    id: "sharp",
    n: "Sharp Click",
    c: "Clicky",
    d: "Very bright, snappy click.",
    b: 260,
    nz: 4500,
    dc: 0.04,
    click: 1.5,
  },
  {
    id: "pebble",
    n: "Logitech Pebble Keys 2-style",
    c: "Soft",
    d: "Muted and flat: a soft, shallow laptop-style tap.",
    b: 140,
    nz: 900,
    dc: 0.035,
    g: 0.6,
    lp: 1400,
    bg: 0.5,
  },
  {
    id: "wave",
    n: "Logitech Wave Keys-style",
    c: "Soft",
    d: "Cushioned and dull: a gentle, padded membrane thud, no sharp click.",
    b: 110,
    nz: 700,
    dc: 0.06,
    g: 0.65,
    lp: 1000,
    bump: 0.7,
  },
  {
    id: "zh980",
    n: "ZH980 Mechanical-style",
    c: "Soft",
    d: "Deep and creamy: rhythmic marbles or rain on a roof.",
    b: 95,
    nz: 600,
    dc: 0.11,
    g: 0.9,
    lp: 1100,
    bump: 0.5,
    bg: 1.3,
  },
];
PRE.push(
  ...[
    ["off", "Off", "Effects", "Disable typing sounds.", { effect: "off" }],
    ["click", "Click", "Effects", "A short filtered key click.", { effect: "click" }],
    ["beep", "Beep", "Effects", "A short sine beep.", { effect: "beep" }],
    ["pop", "Pop", "Effects", "A soft descending pop.", { effect: "pop" }],
    ["typewriter", "Typewriter", "Effects", "A crisp, compact typewriter tap.", { effect: "typewriter" }],
    ["osu", "Osu", "Effects", "An original rhythm-game style tone.", { effect: "osu" }],
    ["hitmarker", "Hitmarker", "Effects", "A short two-tone confirmation.", { effect: "hitmarker" }],
    ["fist-fight", "Fist Fight", "Effects", "A soft, synthesized impact.", { effect: "punch" }],
    ["rubber-keys", "Rubber Keys", "Effects", "A muted, bouncy key tap.", { effect: "rubber" }],
    ["fart", "Fart", "Effects", "A brief low synthesized burst.", { effect: "fart" }],
    ["sine", "Sine", "Waveforms", "A smooth sine-wave tone.", { wave: "sine", b: 440, nz: 900, dc: 0.035 }],
    ["sawtooth", "Sawtooth", "Waveforms", "A bright sawtooth-wave tone.", { wave: "sawtooth", b: 330, nz: 1100, dc: 0.04 }],
    ["square", "Square", "Waveforms", "A hollow square-wave tone.", { wave: "square", b: 392, nz: 950, dc: 0.04 }],
    ["triangle", "Triangle", "Waveforms", "A mellow triangle-wave tone.", { wave: "triangle", b: 494, nz: 1000, dc: 0.04 }],
    ["pentatonic", "Pentatonic", "Waveforms", "A rotating pentatonic note.", { wave: "sine", b: 392, nz: 850, dc: 0.06, scale: [0, 3, 5, 7, 10, 12] }],
    ["wholetone", "Wholetone", "Waveforms", "A rotating whole-tone note.", { wave: "sine", b: 392, nz: 850, dc: 0.06, scale: [0, 2, 4, 6, 8, 10, 12] }],
    ["nk-creams", "NK Creams", "Switches", "A warm, rounded linear switch approximation.", { b: 150, nz: 1150, dc: 0.07, g: 0.9, lp: 1800, bg: 0.9 }],
    ["akko-lavenders", "Akko Lavenders", "Switches", "A bright, lightly tactile switch approximation.", { b: 205, nz: 2300, dc: 0.055, bump: 0.8 }],
    ["cherry-mx-black-abs", "Cherry MX Black ABS", "Switches", "A firm, deep ABS keycap approximation.", { b: 125, nz: 1200, dc: 0.07, g: 1.05, lp: 1900 }],
    ["cherry-mx-black-pbt", "Cherry MX Black PBT", "Switches", "A firm, slightly muted PBT keycap approximation.", { b: 115, nz: 900, dc: 0.075, g: 0.95, lp: 1450 }],
    ["cherry-mx-blue-abs", "Cherry MX Blue ABS", "Switches", "A crisp clicky ABS keycap approximation.", { b: 240, nz: 3500, dc: 0.05, click: 1.2 }],
    ["cherry-mx-blue-pbt", "Cherry MX Blue PBT", "Switches", "A crisp, slightly lower PBT keycap approximation.", { b: 220, nz: 2800, dc: 0.055, click: 1.05 }],
    ["cherry-mx-brown-pbt", "Cherry MX Brown PBT", "Switches", "A restrained tactile PBT switch approximation.", { b: 155, nz: 1650, dc: 0.06, bump: 0.85, lp: 2100 }],
    ["kailh-box-white", "Kailh Box White", "Switches", "A crisp, light clicky switch approximation.", { b: 245, nz: 3900, dc: 0.045, click: 1.25 }],
    ["razer-green", "Razer Green", "Switches", "A bright, clicky switch approximation.", { b: 235, nz: 3600, dc: 0.05, click: 1.15 }],
    ["tealios-v2", "Tealios V2", "Switches", "A smooth, clean linear switch approximation.", { b: 195, nz: 1850, dc: 0.045, g: 0.9 }],
    ["trust-gxt", "Trust GXT", "Switches", "A fuller, mid-pitched gaming keyboard approximation.", { b: 175, nz: 2100, dc: 0.06, click: 0.45, bump: 0.5 }],
  ].map(([id, n, c, d, sound]) => ({ id, n, c, d, b: 170, nz: 1800, dc: 0.05, ...sound })),
);
const INT = {
  quiet: { g: 0.5, bf: 1, nf: 0.8 },
  balanced: { g: 1, bf: 1, nf: 1 },
  crisp: { g: 1, bf: 1.1, nf: 1.35 },
  deep: { g: 1.05, bf: 0.75, nf: 0.65 },
};
const pre = (id) => PRE.find((x) => x.id === id) || PRE[0];
const Snd = {
  ctx: null,
  out: null,
  nb: null,
  voices: 0,
  note: 0,
  ok: true,
  init() {
    if (this.ctx || !this.ok) return;
    try {
      const A = window.AudioContext || window.webkitAudioContext;
      this.ctx = new A();
      const c = this.ctx.createDynamicsCompressor();
      this.out = this.ctx.createGain();
      this.out.connect(c);
      c.connect(this.ctx.destination);
      const L = this.ctx.sampleRate * 0.2,
        b = this.ctx.createBuffer(1, L, this.ctx.sampleRate),
        d = b.getChannelData(0);
      for (let i = 0; i < L; i++) d[i] = Math.random() * 2 - 1;
      this.nb = b;
    } catch {
      this.ok = false;
    }
  },
  play(down, id) {
    id = id || P.preset;
    const p = pre(id);
    if (p.effect === "off") return;
    if (P.mute || !this.ok) return;
    this.init();
    const x = this.ctx;
    if (!x) return;
    if (x.state === "suspended") x.resume();
    if (this.voices > 10) return;
    const i = INT[P.intensity] || INT.balanced,
      r = () => Math.random() * 2 - 1,
      t = x.currentTime;
    if (p.effect) {
      this.playEffect(p, down);
      return;
    }
    const vs = p.c === "Soft" ? (P.sv ?? 0.5) * 2 : 1;
    const g =
      P.vol *
      (P.pv[id] ?? 1) *
      i.g *
      (p.g || 1) *
      (1 + r() * 0.08 * vs) *
      (down ? 1 : 0.45);
    const dc = p.dc * (down ? 1 : 0.6);
    const mk = () => {
      this.voices++;
      return () => {
        this.voices--;
      };
    };
    const ns = x.createBufferSource();
    ns.buffer = this.nb;
    ns.playbackRate.value = 1 + r() * 0.05;
    const bp = x.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value =
      p.nz * i.nf * (down ? 1 : 1.25) * (1 + r() * 0.05 * vs);
    bp.Q.value = 1.2;
    const ng = x.createGain();
    ng.gain.setValueAtTime(g * 0.9, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dc);
    ns.connect(bp);
    if (p.lp) {
      const lf = x.createBiquadFilter();
      lf.type = "lowpass";
      lf.frequency.value = p.lp * (1 + r() * 0.1 * vs);
      bp.connect(lf);
      lf.connect(ng);
    } else bp.connect(ng);
    ng.connect(this.out);
    ns.start(t);
    ns.stop(t + dc + 0.02);
    ns.onended = mk();
    const o = x.createOscillator();
    o.type = p.wave || "sine";
    const semitone = p.scale ? p.scale[this.note++ % p.scale.length] : 0;
    o.frequency.setValueAtTime(
      p.b * Math.pow(2, semitone / 12) * i.bf * (1 + r() * 0.04 * vs) * (down ? 1 : 1.2),
      t,
    );
    o.frequency.exponentialRampToValueAtTime(p.b * 0.6, t + dc * 1.5);
    const og = x.createGain();
    og.gain.setValueAtTime(g * 0.7 * (p.bg ?? 1), t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + dc * 1.6);
    o.connect(og);
    og.connect(this.out);
    o.start(t);
    o.stop(t + dc * 1.7);
    if (down && p.bump) {
      const b = x.createBiquadFilter();
      b.type = "lowpass";
      b.frequency.value = 700;
      const bg = x.createGain();
      bg.gain.setValueAtTime(0, t);
      bg.gain.linearRampToValueAtTime(g * 0.5 * p.bump, t + 0.012);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      const n2 = x.createBufferSource();
      n2.buffer = this.nb;
      n2.connect(b);
      b.connect(bg);
      bg.connect(this.out);
      n2.start(t);
      n2.stop(t + 0.06);
    }
    if (p.click) {
      const h = x.createBiquadFilter();
      h.type = "highpass";
      h.frequency.value = p.nz * 1.2;
      const cg = x.createGain(),
        dl = down ? 0 : 0.002;
      cg.gain.setValueAtTime(g * 0.8 * p.click * (down ? 1 : 0.6), t + dl);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + dl + 0.012);
      const n3 = x.createBufferSource();
      n3.buffer = this.nb;
      n3.connect(h);
      h.connect(cg);
      cg.connect(this.out);
      n3.start(t + dl);
      n3.stop(t + dl + 0.02);
    }
  },
  playEffect(p, down) {
    const x = this.ctx, t = x.currentTime;
    const volume = P.vol * (P.pv[p.id] ?? 1) * (down ? 1 : 0.45);
    const tone = (hz, shape, duration, endHz = hz, level = 0.5, delay = 0) => {
      const osc = x.createOscillator(), gain = x.createGain(), at = t + delay;
      osc.type = shape;
      osc.frequency.setValueAtTime(hz, at);
      if (endHz !== hz) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endHz), at + duration);
      gain.gain.setValueAtTime(Math.max(0.0001, volume * level), at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(gain); gain.connect(this.out); osc.start(at); osc.stop(at + duration + 0.01);
    };
    const noise = (hz, duration, level = 0.5, filterType = "bandpass") => {
      const source = x.createBufferSource(), filter = x.createBiquadFilter(), gain = x.createGain();
      source.buffer = this.nb; filter.type = filterType; filter.frequency.value = hz;
      gain.gain.setValueAtTime(Math.max(0.0001, volume * level), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      source.connect(filter); filter.connect(gain); gain.connect(this.out); source.start(t); source.stop(t + duration + 0.01);
    };
    switch (p.effect) {
      case "click": noise(2200, 0.018, 0.55, "highpass"); break;
      case "beep": tone(880, "sine", 0.075, 880, 0.55); break;
      case "pop": tone(220, "sine", 0.09, 90, 0.75); noise(850, 0.025, 0.18); break;
      case "typewriter":
        noise(1900, 0.018, 0.5, "highpass");
        if (!down) tone(1280, "triangle", 0.06, 950, 0.22, 0.006);
        break;
      case "osu": tone(down ? 660 : 990, "triangle", 0.085, down ? 880 : 740, 0.5); break;
      case "hitmarker": tone(1450, "sine", 0.035, 1450, 0.48); tone(1900, "sine", 0.045, 1900, 0.35, 0.03); break;
      case "punch": noise(180, 0.09, 0.55, "lowpass"); tone(105, "triangle", 0.11, 48, 0.65); break;
      case "rubber": noise(560, 0.03, 0.25, "lowpass"); tone(170, "sine", 0.07, 105, 0.55); break;
      case "fart": tone(105, "sawtooth", 0.17, 52, 0.62); break;
    }
  },
};
/* ---------- text ---------- */
const W = {
  easy: "the be to of and a in it you he on is at as we do up so go me my no if or by an us all can had her was one our out day get has him his how man new now old see two way who boy did its let put say she too use cat dog sun run big red top hot cup pen map sit eat sea sky".split(
    " ",
  ),
  normal:
    "about after again almost always around because before between build change city company country different during early every family follow friend great group happen house important keep large learn light little local maybe mother never night number often other paper people place plant point right school second should simple small sound story study system thing think through today together under until water while without world write young".split(
      " ",
    ),
  adv: "Although,|Remarkably,|“Certainly”|throughout;|extraordinary|infrastructure|(approximately)|consequently,|Wednesday’s|philosophical|unprecedented|collaboration:|Environmental|sophisticated|responsibility.|Furthermore,|accommodate|characteristics|entrepreneurial|Mediterranean|bureaucratic|—however,|perspective|comprehensive|independently|Thursday.|“Whatever|extraordinary,|negotiation|archaeological".split(
    "|",
  ),
  code: "const let return function async await => import export from class extends if else for while switch case break default try catch throw new this null undefined true false map filter reduce push pop {} [] () === !== && || ?? ++ -- => console.log() Promise.all() JSON.parse() typeof void".split(
    " ",
  ),
};
function rng(s) {
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function genText() {
  if (P.diff === "custom" && P.custom.trim())
    return P.custom.trim().replace(/\s+/g, " ");
  const R = rng(Date.now()),
    n = P.mode === "words" ? P.words : 300,
    o = [];
  for (let i = 0; i < n; i++) {
    let w;
    if (P.diff === "numbers") w = String(Math.floor(R() * 100000));
    else {
      const l =
        P.diff === "easy"
          ? W.easy
          : P.diff === "advanced"
            ? W.adv
            : P.diff === "code"
              ? W.code
              : W.normal;
      w = l[Math.floor(R() * l.length)];
      if (P.diff === "punctuation" && R() < 0.3)
        w += ",.;!?"[Math.floor(R() * 5)];
    }
    o.push(w);
  }
  return o.join(" ");
}
/* ---------- engine ---------- */
const T = {
  st: "idle",
  text: "",
  typed: [],
  t0: 0,
  ks: 0,
  okKs: 0,
  samples: [],
  iv: 0,
  spans: [],
  lineByChar: [],
  lineTops: [],
  activeLine: 0,
  resizeObserver: null,
  layoutFrame: 0,
};
// WPM = correct chars / 5 / minutes; raw = all typed chars / 5 / minutes; accuracy = correct keystrokes / total keystrokes (backspace not counted).
const el = (h) => {
  const d = document.createElement("div");
  d.innerHTML = h;
  return d.firstElementChild;
};
const $ = (s) => document.querySelector(s);
const elapsed = () =>
  T.st === "running" ? (performance.now() - T.t0) / 1000 : 0;
function correctN() {
  let c = 0;
  for (let i = 0; i < T.typed.length; i++) if (T.typed[i] === T.text[i]) c++;
  return c;
}
function metrics(sec) {
  const m = Math.max(sec, 1 / 60) / 60,
    c = correctN();
  return {
    wpm: c / 5 / m,
    raw: T.typed.length / 5 / m,
    acc: T.ks ? (T.okKs / T.ks) * 100 : 100,
    c,
    w: T.typed.length - c,
  };
}
function newTest() {
  clearInterval(T.iv);
  Object.assign(T, {
    st: "idle",
    text: genText(),
    typed: [],
    ks: 0,
    okKs: 0,
    samples: [],
    t0: 0,
  });
  window.dispatchEvent(new Event("keystroke-test-reset"));
  if (view === "test") renderText();
}
function renderText() {
  const tx = $("#txt");
  const box = $("#box");
  if (!tx || !box) return;
  tx.className = P.caret === "block" ? "block" : "";
  tx.innerHTML = "";
  tx.style.transform = "translateY(0px)";
  T.lineByChar = [];
  T.lineTops = [];
  T.activeLine = 0;
  T.spans = [...T.text].map((ch) => {
    const s = document.createElement("span");
    s.textContent = ch;
    tx.appendChild(s);
    return s;
  });
  if (T.resizeObserver) T.resizeObserver.disconnect();
  T.resizeObserver = new ResizeObserver(() => scheduleLineLayout(true));
  T.resizeObserver.observe(box);
  if (document.fonts) document.fonts.ready.then(() => scheduleLineLayout(true));
  scheduleLineLayout(true);
  mark(0);
  liveStats();
}
function scheduleLineLayout(reset = false) {
  if (T.layoutFrame) cancelAnimationFrame(T.layoutFrame);
  T.layoutFrame = requestAnimationFrame(() => {
    T.layoutFrame = 0;
    layoutLines(reset);
  });
}
function layoutLines(reset = false) {
  if (!T.spans.length) return;
  const tops = [], map = [];
  let prior = NaN, line = -1;
  for (const span of T.spans) {
    const top = span.offsetTop;
    if (!Number.isFinite(prior) || Math.abs(top - prior) > 1) {
      line++;
      tops.push(top);
      prior = top;
    }
    map.push(line);
  }
  T.lineTops = tops;
  T.lineByChar = map;
  const next = map[Math.min(T.typed.length, map.length - 1)] || 0;
  if (reset || next !== T.activeLine) {
    T.activeLine = next;
    setTrackPosition(next, !reset);
  }
}
function setTrackPosition(line, animate) {
  const tx = $("#txt");
  if (!tx) return;
  tx.classList.toggle("moving", animate);
  tx.style.transform = `translateY(-${Math.max(0, (T.lineTops[line] || 0) - (T.lineTops[0] || 0))}px)`;
}
function mark(i) {
  T.spans.forEach((s) => s.classList.remove("cur"));
  const s = T.spans[i];
  if (s) s.classList.add("cur");
  const line = T.lineByChar[i] ?? T.lineByChar[T.lineByChar.length - 1] ?? 0;
  if (line !== T.activeLine) {
    T.activeLine = line;
    setTrackPosition(line, true);
  }
}
function press(ch) {
  if (T.st === "completed" || T.st === "aborted") return;
  if (T.st === "idle") {
    T.st = "running";
    T.t0 = performance.now();
    T.iv = setInterval(tick, 100);
    $("#hint") && ($("#hint").style.visibility = "hidden");
  }
  const i = T.typed.length;
  if (i >= T.text.length) return;
  T.ks++;
  const ok = ch === T.text[i];
  if (ok) T.okKs++;
  T.typed.push(ch);
  const s = T.spans[i];
  s.className = ok ? "c" : "w";
  mark(i + 1);
  window.dispatchEvent(new CustomEvent("keystroke-test-progress", { detail: { progress: T.text.length ? correctN() / T.text.length : 0 } }));
  if (P.press) window.KEYSTROKE_PERSONALIZATION?.playTypingEvent(ok && ch === " " ? "word" : ok ? "correct" : "incorrect", P.vol, P.mute);
  if (T.typed.length >= T.text.length) finish();
}
function back() {
  if (T.st !== "running" || !T.typed.length) return;
  T.typed.pop();
  T.spans[T.typed.length].className = "";
  mark(T.typed.length);
  if (P.press) window.KEYSTROKE_PERSONALIZATION?.playTypingEvent("backspace", P.vol, P.mute);
}
function tick() {
  const e = elapsed();
  if (P.mode === "time" && e >= P.dur) {
    finish();
    return;
  }
  const s = Math.floor(e);
  if (s > T.samples.length && s > 0) T.samples.push(metrics(s).wpm);
  liveStats();
}
function liveStats() {
  const e = T.st === "completed" ? T.dur : elapsed(),
    m = metrics(e);
  const set = (k, v) => {
    const n = $("#s_" + k);
    if (n) n.textContent = v;
  };
  set("wpm", T.st === "idle" ? "0" : Math.round(m.wpm));
  set("acc", Math.round(m.acc) + "%");
  set("raw", T.st === "idle" ? "0" : Math.round(m.raw));
  const tw = T.text.split(" ").length;
  set(
    "t",
    P.mode === "time"
      ? Math.max(0, Math.ceil(P.dur - e))
      : Math.min(
          tw,
          T.typed.length
            ? T.text.slice(0, T.typed.length).split(" ").length
            : 0,
        ) +
          "/" +
          tw,
  );
}
function qualifiesForCelebration(currentWpm, previousWpm, enabled, threshold) {
  const minimum = Math.max(0.1, Number(threshold) || 1);
  return Boolean(enabled && previousWpm != null && currentWpm > previousWpm && currentWpm - previousWpm >= minimum);
}
function finish() {
  if (T.st !== "running") return;
  clearInterval(T.iv);
  let e = elapsed();
  if (P.mode === "time") e = Math.min(e, P.dur);
  T.st = "completed";
  window.dispatchEvent(new CustomEvent("keystroke-test-complete", { detail: { progress: 1 } }));
  T.dur = e;
  const m = metrics(e);
  if (P.mode === "time" || T.samples.length < 2) T.samples.push(m.wpm);
  const prev = H.length ? Math.max(...H.map((h) => h.wpm)) : null;
  const r = {
    t: Date.now(),
    wpm: +m.wpm.toFixed(1),
    raw: +m.raw.toFixed(1),
    acc: +m.acc.toFixed(1),
    c: m.c,
    w: m.w,
    ks: T.ks,
    dur: +e.toFixed(1),
    mode: P.mode === "time" ? P.dur + "s" : P.words + " words",
    preset: P.preset,
    s: T.samples.map((x) => +x.toFixed(1)),
  };
  if (P.saveResults) {
    H.push(r);
    H = H.slice(-500);
    ls.set(K.h, H);
  }
  liveStats();
  const improvement = prev == null ? 0 : r.wpm - prev;
  if (P.press) window.KEYSTROKE_PERSONALIZATION?.playTypingEvent(P.saveResults && prev != null && r.wpm > prev ? "personalBest" : "testComplete", P.vol, P.mute, true);
  if (qualifiesForCelebration(r.wpm, prev, P.saveResults && P.celebrateRecords, P.celebrationMinImprovement)) {
    showCelebration(r, prev, improvement);
  } else {
    showResults(r, prev, P.saveResults);
  }
  $("#live").textContent =
    `Test complete. ${Math.round(r.wpm)} words per minute, ${Math.round(r.acc)} percent accuracy.`;
}
/* ---------- personal-best celebration ---------- */
// Manifest entry points to an optional licensed recording; no audio asset is bundled yet.
const CELEBRATION_AUDIO = "assets/audio/personal-best-applause.mp3";
let celebrationTimer = 0;
let celebrationAudio = null;
let pendingCelebrationResult = null;
function playCelebrationSound() {
  if (!P.celebrationSound || P.mute) return;
  if (!celebrationAudio) {
    celebrationAudio = new Audio(CELEBRATION_AUDIO);
    celebrationAudio.preload = "none";
  }
  celebrationAudio.currentTime = 0;
  celebrationAudio.play().catch(() => {});
}
function dismissCelebration(animate = false) {
  const overlay = $("#celebration");
  if (!overlay) return;
  clearTimeout(celebrationTimer);
  celebrationTimer = 0;
  if (animate && !overlay.classList.contains("leaving")) {
    overlay.classList.add("leaving");
    celebrationTimer = setTimeout(() => dismissCelebration(), 260);
    return;
  }
  overlay.remove();
  if (celebrationAudio) {
    celebrationAudio.pause();
    celebrationAudio.currentTime = 0;
  }
  const pending = pendingCelebrationResult;
  pendingCelebrationResult = null;
  if (pending) showResults(pending.result, pending.previous, pending.saved);
}
function showCelebration(result, previous, improvement) {
  if ($("#celebration")) return;
  pendingCelebrationResult = { result, previous, saved: true };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intensity = ["subtle", "balanced", "epic"].includes(P.celebrationIntensity) ? P.celebrationIntensity : "balanced";
  const duration = reduced ? 1000 : 3400;
  const particles = reduced ? "" : Array.from({ length: intensity === "epic" ? 52 : intensity === "subtle" ? 20 : 36 }, (_, i) =>
    `<i class="blast-particle" style="--i:${i};--x:${((i * 47) % 101) - 50}vw;--delay:${(i % 9) * 35}ms;--hue:${(i * 37) % 360}"></i>`,
  ).join("");
  const overlay = document.createElement("div");
  overlay.id = "celebration";
  overlay.className = `celebration ${intensity}${reduced ? " reduced" : ""}`;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "blast-title");
  overlay.innerHTML = `${particles}<button class="blast-close" type="button" aria-label="Close personal best celebration">Close <span aria-hidden="true">×</span></button><div class="blast-content"><p class="blast-kicker" id="blast-title">NEW PERSONAL BEST!</p><div class="blast-scores"><span>${previous} <small>WPM</small></span><b aria-hidden="true">→</b><strong>${result.wpm} <small>WPM</small></strong></div><div class="blast-gain"><span aria-hidden="true">↑</span> +${improvement.toFixed(1).replace(/\.0$/, "")} WPM</div><div class="blast-hurray">HURRAY! <span aria-hidden="true">✦</span></div></div>`;
  overlay.addEventListener("click", dismissCelebration);
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      overlay.querySelector(".blast-close").focus();
    }
  });
  overlay.querySelector(".blast-close").addEventListener("click", dismissCelebration);
  document.body.appendChild(overlay);
  overlay.querySelector(".blast-close").focus();
  playCelebrationSound();
  if (P.celebrationAutoDismiss) celebrationTimer = setTimeout(() => dismissCelebration(true), duration);
}
/* ---------- charts ---------- */
function chart(a, w = 560, h = 140) {
  if (!a.length) return "";
  const mx = Math.max(...a, 10),
    n = a.length,
    px = (i) => 30 + (n === 1 ? (w - 40) / 2 : (i * (w - 40)) / (n - 1)),
    py = (v) => h - 20 - (v / mx) * (h - 36);
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="WPM over time. Min ${Math.round(Math.min(...a))}, max ${Math.round(mx)}, ${n} points."><line x1="30" x2="${w - 10}" y1="${h - 20}" y2="${h - 20}" stroke="var(--bd)"/><text x="2" y="14">${Math.round(mx)}</text><text x="2" y="${h - 22}">0</text><polyline fill="none" stroke="var(--ac)" stroke-width="2" points="${a.map((v, i) => px(i) + "," + py(v)).join(" ")}"/>${a.map((v, i) => `<circle cx="${px(i)}" cy="${py(v)}" r="3" fill="var(--ac)"/>`).join("")}</svg>`;
}
/* ---------- modal ---------- */
let lastFocus;
function openModal(h) {
  lastFocus = document.activeElement;
  $("#panel").innerHTML = h;
  $("#modal").classList.add("open");
  const b = $("#panel").querySelector("button");
  b && b.focus();
}
function closeModal() {
  $("#modal").classList.remove("open");
  focusInput();
}
function showResults(r, prev, saved = true) {
  const pb =
    !saved
      ? "Result saving is disabled; personal best was not updated."
      : prev == null
      ? "First recorded test — no personal best yet."
      : r.wpm > prev
        ? `New personal best! Previous: ${Math.round(prev)} WPM.`
        : `Personal best: ${Math.round(prev)} WPM.`;
  openModal(
    `<h2 id="mt" style="margin-top:0">Result</h2><div class="stats" style="margin:0 0 16px"><div class="stat"><small>WPM</small><b>${Math.round(r.wpm)}</b></div><div class="stat"><small>Accuracy</small><b>${Math.round(r.acc)}%</b></div><div class="stat"><small>Raw</small><b>${Math.round(r.raw)}</b></div><div class="stat"><small>Chars ✓/✗</small><b>${r.c}/${r.w}</b></div><div class="stat"><small>Time</small><b>${r.dur}s</b></div></div>${chart(r.s)}<p style="color:var(--tx2)">${pb} Sound: ${pre(r.preset).n} (synthesized).</p><div class="row"><button class="pri" id="rRetry">Retry</button><button id="rNew">New test</button><button id="rShare">Copy result</button><button id="rSound">Sound profile</button><button id="rClose">Close</button></div>`,
  );
  $("#rRetry").onclick = $("#rNew").onclick = () => {
    closeModal();
    newTest();
  };
  $("#rClose").onclick = closeModal;
  $("#rSound").onclick = () => {
    closeModal();
    go("studio");
  };
  $("#rShare").onclick = async () => {
    const t = `KEYSTROKE: ${Math.round(r.wpm)} WPM, ${Math.round(r.acc)}% accuracy (${r.mode}, ${pre(r.preset).n})`;
    try {
      await navigator.clipboard.writeText(t);
      $("#rShare").textContent = "Copied";
    } catch {
      $("#rShare").textContent = "Copy failed";
    }
  };
}
function confirmBox(msg, fn) {
  openModal(
    `<h2 id="mt" style="margin-top:0">Are you sure?</h2><p>${msg}</p><div class="row"><button id="cY" class="pri">Confirm</button><button id="cN">Cancel</button></div>`,
  );
  $("#cN").onclick = closeModal;
  $("#cY").onclick = () => {
    closeModal();
    fn();
  };
}
/* ---------- views ---------- */
let view = "test";
const VIEWS = [
  ["test", "Test"],
  ["studio", "Sound Studio"],
  ["stats", "Statistics"],
  ["settings", "Settings"],
];
function go(v) {
  if (T.st === "running") {
    clearInterval(T.iv);
    T.st = "aborted";
  }
  view = v;
  draw();
}
function drawNav() {
  $("#nav").innerHTML = VIEWS.map(
    ([k, l]) =>
      `<button data-v="${k}" class="${k === view ? "on" : ""}" ${k === view ? 'aria-current="page"' : ""}>${l}</button>`,
  ).join("");
  $("#nav")
    .querySelectorAll("button")
    .forEach((b) => (b.onclick = () => go(b.dataset.v)));
  $("#bMute").style.opacity = P.mute ? 0.4 : 1;
  $("#bMute").setAttribute("aria-pressed", P.mute);
}
const opt = (arr, cur) =>
  arr
    .map(
      ([v, l]) =>
        `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${l}</option>`,
    )
    .join("");
const presetSel = (id) =>
  `<select id="${id}" aria-label="Sound profile">${[
    "Effects",
    "Waveforms",
    "Switches",
    "Soft",
    "Linear",
    "Tactile",
    "Clicky",
  ]
    .map(
      (c) =>
        `<optgroup label="${c}">${opt(
          PRE.filter((p) => p.c === c).map((p) => [p.id, p.n]),
          P.preset,
        )}</optgroup>`,
    )
    .join("")}</select>`;
function draw() {
  drawNav();
  document.documentElement.dataset.theme = P.theme;
  ({ test: dTest, studio: dStudio, stats: dStats, settings: dSettings, game: () => window.KEYSTROKE_GAME?.renderSection?.() })[
    view
  ]();
  if (view === "test") {
    if (T.st !== "running") {
      if (T.st !== "idle" || !T.text) newTest();
      else renderText();
    }
    focusInput();
  }
}
function dTest() {
  const tm = [
    ["time", 15],
    ["time", 30],
    ["time", 60],
    ["time", 120],
    ["words", 10],
    ["words", 25],
    ["words", 50],
    ["words", 100],
  ];
  $("#main").innerHTML =
    `<div class="row" role="group" aria-label="Test options">${tm.map(([m, v]) => `<button data-m="${m}" data-v="${v}" class="${P.mode === m && (m === "time" ? P.dur : P.words) === v ? "on" : ""}">${v}${m === "time" ? "s" : " words"}</button>`).join("")}<select id="dif" aria-label="Difficulty">${opt(
      [
        ["easy", "Easy"],
        ["normal", "Normal"],
        ["advanced", "Advanced"],
        ["code", "Code"],
        ["numbers", "Numbers"],
        ["punctuation", "Punctuation"],
        ["custom", "Custom text"],
      ],
      P.diff,
    )}</select><button id="rs" aria-label="Restart (Tab)">↻ Restart</button></div>
 <div class="stats" aria-label="Live statistics"><div class="stat"><small>WPM</small><b id="s_wpm">0</b></div><div class="stat"><small>Accuracy</small><b id="s_acc">100%</b></div><div class="stat"><small>Raw</small><b id="s_raw">0</b></div><div class="stat"><small>${P.mode === "time" ? "Time left" : "Words"}</small><b id="s_t">0</b></div><div class="stat"><small>Best</small><b>${H.length ? Math.round(Math.max(...H.map((h) => h.wpm))) : "—"}</b></div></div>
 <div id="box" class="blur"><div id="txt" aria-label="Text to type"></div><div id="msg">Click here to focus</div></div>
 <div id="miniGameTrack" hidden></div>
 <div class="hint" id="hint">Start typing to begin.</div>
 <div class="sp"></div><div class="row">${presetSel("pSel")}<button id="pPrev">Preview</button><label class="row" style="color:var(--tx2)">Volume <input type="range" id="vol" min="0" max="1" step=".05" value="${P.vol}" aria-label="Volume"></label></div>
 <p class="hint"><kbd>Tab</kbd> restart · <kbd>Esc</kbd> close dialog · <kbd>Alt</kbd>+<kbd>M</kbd> mute · Sounds are synthesized (no recordings bundled).</p>`;
  $("#main")
    .querySelectorAll("[data-m]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          P.mode = b.dataset.m;
          P[P.mode === "time" ? "dur" : "words"] = +b.dataset.v;
          save();
          newTest();
          draw();
        }),
    );
  $("#dif").onchange = (e) => {
    P.diff = e.target.value;
    if (P.diff === "custom") {
      const t = prompt("Paste your custom text:", P.custom);
      if (t) P.custom = t;
      else if (!P.custom.trim()) {
        P.diff = "normal";
      }
    }
    save();
    newTest();
    draw();
  };
  $("#rs").onclick = () => {
    newTest();
    focusInput();
  };
  $("#pSel").onchange = (e) => {
    P.preset = e.target.value;
    save();
    Snd.play(true);
    focusInput();
  };
  $("#pPrev").onclick = () => {
    Snd.play(true);
    setTimeout(() => Snd.play(false), 90);
    focusInput();
  };
  $("#vol").oninput = (e) => {
    P.vol = +e.target.value;
    save();
  };
  $("#box").onclick = focusInput;
  window.KEYSTROKE_GAME?.renderTest?.();
}
function swIcon() {
  return `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="5" y="5" width="30" height="26" rx="6"/><rect x="10" y="9" width="20" height="14" rx="3" opacity=".5"/><path d="M12 35h16" opacity=".4"/></svg>`;
}
function wave(p) {
  let b = "";
  for (let i = 0; i < 24; i++) {
    const h =
      4 +
      Math.round(
        26 *
          Math.exp(-i / (p.dc * 160)) *
          (0.7 + 0.3 * Math.sin((i * p.nz) / 900)),
      );
    b += `<rect x="${i * 5}" y="${16 - h / 2}" width="3" height="${h}" rx="1.5" fill="var(--ac)" opacity=".7"/>`;
  }
  return `<svg width="120" height="32" aria-hidden="true">${b}</svg>`;
}
let AB = ["red", "blue"];
function dStudio() {
  const grp = (c) =>
    `<h3>${c}</h3><div class="grid">${PRE.filter((p) => p.c === c)
      .map(
        (p) =>
          `<div class="card ${p.id === P.preset ? "sel" : ""}">${swIcon()}<h4>${p.n}</h4><p>${p.d} <i>(synthesized)</i></p>${wave(p)}<div class="row" style="margin-top:12px"><button data-pv="${p.id}">Preview</button><button data-sel="${p.id}" class="${p.id === P.preset ? "on" : ""}" aria-pressed="${p.id === P.preset}">${p.id === P.preset ? "Selected" : "Select"}</button></div></div>`,
      )
      .join("")}</div>`;
  $("#main").innerHTML =
    `<h2 style="margin-top:0">Sound Studio</h2><p style="color:var(--tx2)">Compare switch profiles without starting a test. Audio only plays when you press a button. Profiles are descriptive, not official or exact reproductions; sounds are generated with Web Audio.</p>
 ${grp("Effects")}${grp("Waveforms")}${grp("Switches")}${grp("Soft")}${grp("Linear")}${grp("Tactile")}${grp("Clicky")}
 <h2>A/B comparison</h2><div class="row"><select id="abA" aria-label="Profile A">${opt(
   PRE.map((p) => [p.id, p.n]),
   AB[0],
 )}</select><select id="abB" aria-label="Profile B">${opt(
   PRE.map((p) => [p.id, p.n]),
   AB[1],
 )}</select><button id="abP" class="pri">Play A → B</button><button id="abUse">Use B in test</button></div>
 <h2>Controls</h2>
 <div class="set"><span>Global volume</span><output id="gvValue">${P.vol.toFixed(1)}</output><input type="range" id="gv" min="0" max="1" step=".05" value="${P.vol}" aria-label="Sound volume"></div>
 <div class="set"><span>Volume for “${pre(P.preset).n}”</span><input type="range" id="pvv" min="0" max="1.5" step=".05" value="${P.pv[P.preset] ?? 1}"></div>
 <div class="set"><span>Intensity</span><select id="int">${opt(
   Object.keys(INT).map((k) => [k, k[0].toUpperCase() + k.slice(1)]),
   P.intensity,
 )}</select></div>
 <div class="set"><span>Soft sound variance (how much each keystroke varies; soft profiles only)</span><input type="range" id="sv" min="0" max="1" step=".05" value="${P.sv ?? 0.5}" aria-label="Soft sound variance"></div><div class="set"><span>Press sound</span><input type="checkbox" id="tp" ${P.press ? "checked" : ""}></div><div class="set"><span>Release sound</span><input type="checkbox" id="tr" ${P.release ? "checked" : ""}></div>
 <div class="row" style="margin-top:16px"><button id="toTest" class="pri">Back to test</button><button id="rst">Reset sound defaults</button></div>${window.KEYSTROKE_PERSONALIZATION?.soundStudioMarkup?.() || ""}`;
  window.KEYSTROKE_PERSONALIZATION?.bindSoundStudio?.();
  const pv = (id) => {
    Snd.play(true, id);
    setTimeout(() => Snd.play(false, id), 90);
  };
  $("#main")
    .querySelectorAll("[data-pv]")
    .forEach((b) => (b.onclick = () => pv(b.dataset.pv)));
  $("#main")
    .querySelectorAll("[data-sel]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          P.preset = b.dataset.sel;
          save();
          dStudio();
        }),
    );
  $("#abA").onchange = (e) => (AB[0] = e.target.value);
  $("#abB").onchange = (e) => (AB[1] = e.target.value);
  $("#abP").onclick = () => {
    pv(AB[0]);
    setTimeout(() => pv(AB[0]), 220);
    setTimeout(() => pv(AB[1]), 900);
    setTimeout(() => pv(AB[1]), 1120);
  };
  $("#abUse").onclick = () => {
    P.preset = AB[1];
    save();
    dStudio();
  };
  $("#gv").oninput = (e) => {
    P.vol = +e.target.value;
    $("#gvValue").textContent = P.vol.toFixed(1);
    save();
  };
  $("#pvv").oninput = (e) => {
    P.pv[P.preset] = +e.target.value;
    save();
  };
  $("#int").onchange = (e) => {
    P.intensity = e.target.value;
    save();
  };
  $("#sv").oninput = (e) => {
    P.sv = +e.target.value;
    save();
  };
  $("#tp").onchange = (e) => {
    P.press = e.target.checked;
    save();
  };
  $("#tr").onchange = (e) => {
    P.release = e.target.checked;
    save();
  };
  $("#toTest").onclick = () => go("test");
  $("#rst").onclick = () => {
    Object.assign(P, {
      vol: DEF.vol,
      intensity: "balanced",
      press: true,
      release: true,
      pv: {},
    });
    save();
    dStudio();
  };
}
function dStats() {
  if (!H.length) {
    $("#main").innerHTML =
      `<h2 style="margin-top:0">Statistics</h2><div class="empty"><b>No tests yet.</b><br>Complete a typing test and your results will appear here.<p><button class="pri" id="go">Start a test</button></p></div>`;
    $("#go").onclick = () => go("test");
    return;
  }
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length,
    by = {};
  H.forEach((h) => (by[h.mode] = by[h.mode] || []).push(h.wpm));
  const cnt = {};
  H.forEach((h) => (cnt[h.preset] = (cnt[h.preset] || 0) + 1));
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
  $("#main").innerHTML =
    `<h2 style="margin-top:0">Statistics</h2><div class="stats" style="margin-top:0"><div class="stat"><small>Tests</small><b>${H.length}</b></div><div class="stat"><small>Avg WPM</small><b>${Math.round(avg(H.map((h) => h.wpm)))}</b></div><div class="stat"><small>Best WPM</small><b>${Math.round(Math.max(...H.map((h) => h.wpm)))}</b></div><div class="stat"><small>Avg accuracy</small><b>${Math.round(avg(H.map((h) => h.acc)))}%</b></div></div>
 <h3>WPM across your last ${Math.min(30, H.length)} tests</h3>${chart(H.slice(-30).map((h) => h.wpm))}
 <h3>By test type</h3><table><tr><th>Type</th><th>Tests</th><th>Avg WPM</th></tr>${Object.entries(
   by,
 )
   .map(
     ([k, v]) =>
       `<tr><td>${k}</td><td>${v.length}</td><td>${Math.round(avg(v))}</td></tr>`,
   )
   .join("")}</table>
 <p style="color:var(--tx2)">Most-used sound: ${pre(top).n}</p>
 <h3>Recent</h3><table><tr><th>When</th><th>Type</th><th>WPM</th><th>Acc</th><th>Sound</th></tr>${H.slice(
   -10,
 )
   .reverse()
   .map(
     (h) =>
       `<tr><td>${new Date(h.t).toLocaleString()}</td><td>${h.mode}</td><td>${Math.round(h.wpm)}</td><td>${Math.round(h.acc)}%</td><td>${pre(h.preset).n}</td></tr>`,
   )
   .join("")}</table>`;
}
function dSettings() {
  const row = (l, c) => `<div class="set"><span>${l}</span>${c}</div>`;
  $("#main").innerHTML = `<h2 style="margin-top:0">Settings</h2>
 ${row(
   "Theme",
   `<select id="a1">${opt(
     [
       ["dark", "Dark"],
       ["light", "Light"],
     ],
     P.theme,
   )}</select>`,
 )}
 ${row(
   "Default duration",
   `<select id="a2">${opt(
     [15, 30, 60, 120].map((x) => [x, x + "s"]),
     P.dur,
   )}</select>`,
 )}
 ${row(
   "Default difficulty",
   `<select id="a3">${opt(
     [
       ["easy", "Easy"],
       ["normal", "Normal"],
       ["advanced", "Advanced"],
       ["code", "Code"],
       ["numbers", "Numbers"],
       ["punctuation", "Punctuation"],
     ],
     P.diff === "custom" ? "normal" : P.diff,
   )}</select>`,
 )}
 ${row("Default sound preset", presetSel("a4"))}
 ${row("Global volume", `<input type="range" id="a5" min="0" max="1" step=".05" value="${P.vol}">`)}
 ${row(
   "Sound intensity",
   `<select id="a6">${opt(
     Object.keys(INT).map((k) => [k, k[0].toUpperCase() + k.slice(1)]),
     P.intensity,
   )}</select>`,
 )}
 ${row("Press sound", `<input type="checkbox" id="a7" ${P.press ? "checked" : ""}>`)}${row("Release sound", `<input type="checkbox" id="a8" ${P.release ? "checked" : ""}>`)}
 ${row(
   "Caret style",
   `<select id="a9">${opt(
     [
       ["line", "Line"],
       ["block", "Block"],
     ],
     P.caret,
   )}</select>`,
 )}
 <h2>Achievements &amp; Celebrations</h2>
 ${row("Save test results and personal bests", `<input type="checkbox" id="saveResults" aria-label="Save test results and personal bests" ${P.saveResults ? "checked" : ""}>`)}
 ${row("Enable personal-best celebrations", `<input type="checkbox" id="celebrateRecords" aria-label="Enable personal-best celebrations" ${P.celebrateRecords ? "checked" : ""}>`)}
 ${row("Celebration sound", `<input type="checkbox" id="celebrationSound" aria-label="Celebration sound" ${P.celebrationSound ? "checked" : ""}>`)}
 ${row("Celebration intensity", `<select id="celebrationIntensity" aria-label="Celebration intensity">${opt([["subtle", "Subtle"], ["balanced", "Balanced"], ["epic", "Epic"]], P.celebrationIntensity)}</select>`)}
 ${row("Automatically dismiss celebration", `<input type="checkbox" id="celebrationAutoDismiss" aria-label="Automatically dismiss celebration" ${P.celebrationAutoDismiss ? "checked" : ""}>`)}
 ${row("Minimum personal-best improvement (WPM)", `<input type="number" id="celebrationMinImprovement" aria-label="Minimum personal-best improvement in WPM" min="1" max="1000" step="1" value="${P.celebrationMinImprovement}">`)}
 <div class="row" style="margin-top:24px"><button id="cH">Clear typing history</button><button id="rA">Reset all settings</button></div>`;
  const b = (id, k, f = (x) => x.value) => {
    $(id).onchange = $(id).oninput = (e) => {
      P[k] = f(e.target);
      if (k === "dur") {
        P.mode = "time";
      }
      save();
      if (k === "theme") draw();
      if (k === "diff" || k === "dur" || k === "caret") {
        T.st = "idle";
        T.text = "";
      }
    };
  };
  b("#a1", "theme");
  b("#a2", "dur", (x) => +x.value);
  b("#a3", "diff");
  b("#a4", "preset");
  b("#a5", "vol", (x) => +x.value);
  b("#a6", "intensity");
  b("#a7", "press", (x) => x.checked);
  b("#a8", "release", (x) => x.checked);
  b("#a9", "caret");
  for (const key of ["saveResults", "celebrateRecords", "celebrationSound", "celebrationAutoDismiss"]) {
    const input = $("#" + key);
    input.onchange = () => { P[key] = input.checked; save(); };
  }
  $("#celebrationIntensity").onchange = (e) => { P.celebrationIntensity = e.target.value; save(); };
  $("#celebrationMinImprovement").onchange = (e) => {
    const value = Number(e.target.value);
    P.celebrationMinImprovement = Number.isFinite(value) ? Math.max(1, Math.min(1000, Math.round(value))) : 1;
    e.target.value = P.celebrationMinImprovement;
    save();
  };
  $("#cH").onclick = () =>
    confirmBox("This permanently deletes all saved test history.", () => {
      H = [];
      ls.del(K.h);
    });
  $("#rA").onclick = () =>
    confirmBox("All settings return to their defaults.", () => {
      P = Object.assign({}, DEF, { pv: {} });
      save();
      T.text = "";
      draw();
    });
}
/* ---------- input ---------- */
const hid = $("#hid"),
  focusInput = () => {
    if (view === "test" && !$("#modal").classList.contains("open"))
      hid.focus({ preventScroll: true });
  };
hid.addEventListener(
  "focus",
  () => $("#box") && $("#box").classList.remove("blur"),
);
hid.addEventListener(
  "blur",
  () => $("#box") && $("#box").classList.add("blur"),
);
const isMod = (k) =>
  ["Shift", "Control", "Alt", "Meta", "CapsLock", "AltGraph", "Fn"].includes(k);
hid.addEventListener("keydown", (e) => {
  if (
    view !== "test" ||
    $("#modal").classList.contains("open") ||
    e.isComposing
  )
    return;
  if (e.key === "Tab") {
    e.preventDefault();
    newTest();
    return;
  }
  if (e.ctrlKey || e.metaKey) return;
  if (e.altKey && e.key.toLowerCase() === "m") return;
  if (e.key === "Backspace") {
    e.preventDefault();
    back();
    if (P.press && !e.repeat && !window.KEYSTROKE_PERSONALIZATION?.handlesTypingAudio?.("backspace")) Snd.play(true);
    return;
  }
  if (e.key.length === 1) {
    e.preventDefault();
    if (e.repeat) return;
    const event = T.text[T.typed.length] === e.key ? e.key === " " ? "word" : "correct" : "incorrect";
    if (P.press && !window.KEYSTROKE_PERSONALIZATION?.handlesTypingAudio?.(event)) Snd.play(true);
    press(e.key);
  } else if (isMod(e.key) && P.modkeys && !e.repeat && P.press) Snd.play(true);
});
hid.addEventListener("keyup", (e) => {
  if (
    view === "test" &&
    P.release &&
    (e.key.length === 1 || e.key === "Backspace")
  )
    Snd.play(false);
});
hid.addEventListener("input", () => {
  hid.value = "";
});
document.addEventListener("keydown", (e) => {
  if ($("#celebration")) {
    if (e.key === "Escape") { e.preventDefault(); dismissCelebration(); }
    return;
  }
  if (e.key === "Escape" && $("#modal").classList.contains("open"))
    closeModal();
  if (e.altKey && e.key.toLowerCase() === "m") {
    e.preventDefault();
    togMute();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && T.st === "running") {
    T.st = "aborted";
    clearInterval(T.iv);
  }
});
window.addEventListener("keystroke-personalization-changed", () => {
  if (view === "studio") dStudio();
});
$("#modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});
function togMute() {
  P.mute = !P.mute;
  save();
  drawNav();
}
$("#bMute").onclick = togMute;
$("#bTheme").onclick = () => {
  P.theme = P.theme === "dark" ? "light" : "dark";
  save();
  draw();
};
window.addEventListener("beforeunload", () => {
  clearInterval(T.iv);
});
draw();
