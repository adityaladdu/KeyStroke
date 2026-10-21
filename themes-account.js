"use strict";
(function () {
  const TKEY = "keystroke:v1:themes",
    HEX = /^#[0-9a-fA-F]{6}$/;
  const st = document.createElement("style");
  st.textContent =
    "#txt span.c{color:var(--cr,var(--tx))}.hc{min-height:0;width:14px;height:14px;padding:0;border-radius:3px;border-color:transparent}.tk{display:flex;width:100%;gap:8px;align-items:center;text-align:left;margin-bottom:4px}.sw{width:18px;height:18px;border-radius:4px;border:1px solid var(--bd);flex:none}#wh{border-radius:50%;cursor:crosshair;touch-action:none}.in{width:64px}input[type=text],input[type=number]{background:var(--el);border:1px solid var(--bd);border-radius:8px;padding:6px;min-height:36px}";
  document.head.appendChild(st);
  const mk = (id, n, d, a) => ({
    id,
    name: n,
    dark: !!d,
    builtin: true,
    c: {
      bg: a[0],
      bg2: a[1],
      el: a[2],
      tx: a[3],
      tx2: a[4],
      mu: a[5],
      bd: a[6],
      ac: a[7],
      er: a[8],
      cur: a[9],
      cr: a[3],
      ok: d ? "#55D6A0" : "#0E8F5E",
    },
  });
  const BI = [
    mk("obsidian", "Obsidian", 1, [
      "#1F1F1F",
      "#1B1B1B",
      "#262626",
      "#E5E5E5",
      "#9A9A9A",
      "#777777",
      "#303030",
      "#E33445",
      "#E05260",
      "#E33445",
    ]),
    mk("midnight", "Midnight", 1, [
      "#0B1220",
      "#0E1627",
      "#141E33",
      "#E6ECF8",
      "#9AA8C2",
      "#6B7A98",
      "#243049",
      "#4C8DFF",
      "#FF647C",
      "#8CB5FF",
    ]),
    mk("graphite", "Graphite", 1, [
      "#1C1D1F",
      "#17181A",
      "#232528",
      "#E4E6EA",
      "#9AA0A8",
      "#737A84",
      "#32353A",
      "#9AA7B8",
      "#E05260",
      "#C9D3E0",
    ]),
    mk("crimson", "Crimson", 1, [
      "#1A0F11",
      "#150C0E",
      "#241418",
      "#F2E6E8",
      "#B09098",
      "#86666D",
      "#3A2328",
      "#E33445",
      "#FF6B7D",
      "#FF6B7D",
    ]),
    mk("arctic", "Arctic", 0, [
      "#F5F7FA",
      "#FFFFFF",
      "#FFFFFF",
      "#1D2430",
      "#5B6575",
      "#7C8696",
      "#D6DCE5",
      "#0071E3",
      "#D92D20",
      "#0071E3",
    ]),
    mk("forest", "Forest", 1, [
      "#0F1A14",
      "#0B140F",
      "#16241C",
      "#E3EFE7",
      "#93AA9B",
      "#6C8774",
      "#25382C",
      "#55D6A0",
      "#FF7B7B",
      "#7FE3B8",
    ]),
    mk("lavender", "Lavender", 0, [
      "#F4F1FA",
      "#FFFFFF",
      "#FFFFFF",
      "#2A2340",
      "#6B6285",
      "#80789A",
      "#DCD5EC",
      "#6B4BE0",
      "#C21F3F",
      "#6B4BE0",
    ]),
    mk("amber", "Amber", 1, [
      "#17130C",
      "#120F09",
      "#221C10",
      "#F5ECD8",
      "#B5A582",
      "#8A7D5C",
      "#3A311C",
      "#F5A524",
      "#FF6B5B",
      "#FFC261",
    ]),
    mk("rose", "Rose", 0, [
      "#FFF5F7",
      "#FFFFFF",
      "#FFFFFF",
      "#3A1E27",
      "#7A5560",
      "#946C78",
      "#F0D5DC",
      "#D63A63",
      "#C21F3F",
      "#D63A63",
    ]),
    mk("mono", "Monochrome", 1, [
      "#121212",
      "#0D0D0D",
      "#1A1A1A",
      "#EDEDED",
      "#A0A0A0",
      "#7A7A7A",
      "#2B2B2B",
      "#FFFFFF",
      "#BBBBBB",
      "#FFFFFF",
    ]),
  ];
  const EXTRA_THEME_NAMES = "dino\nmagic girl\nmilkshake\nmodern ink\nms cupcakes\nsewing tin light\nvesper light\nlilac mist\nrose pine dawn\nsoaring skies\nrainbow trail\nnord light\nsolarized light\ntangerine\ncamping\nslambook\npaper\ndesert oasis\niceberg light\ncheesecake\n9009\nlil dragon\nblueberry light\nwitch girl\nterrazzo\ndarling\nserika\ngruvbox light\nrepose light\ngodspeed\ndollar\ndmg\nmodern dolch light\nolive\ntaro\nshoko\nbeach\nbreeze\nfroyo\nmr sleeves\nfruit chew\npeaches\nhanok\nretro\npastel\nvaporwave\nfrozen llama\nmizu\npink lemonade\ntiramisu\nmacroblank\nsnes\nstrawberry\ncreamsicle\nlavender\nbingsu\ncafe\nfleuriste\nmiami\niv clover\nmexican\nbotanical\nlime\nhoney\nleather\ndiner\nalpine\ndualshot\nfundamentals\nour theme\nez mode\nevil eye\nmenthol\ncomfy\ntrackday\nmuted\nred samurai\nsweden\npassion fruit\nsuisei\nstriker\ncy red\ngrand prix\ndeku\nhedge\npale nimbus\nretrocast\nsewing tin\nbento\n8008\nmatcha moccha\nfledgling\nonedark\ncopper\ngraen\ncherry blossom\ndiscord\nserika dark\nrepose dark\nrose pine moon\nblueberry dark\noblivion\nwatermelon\ncarbon\nfuture funk\nmint\nsonokai\nlaser\nviridescent\ndracula\nmaterial\nmodern dolch\nsuperuser\nrudy\nbushido\nmashu\nnord\nbouquet\nnebula\npeach blossom\n80s after dark\ngithub\nluna\nblue dolphin\ngruvbox dark\npurpleish\nbliss\ncatppuccin\nwavez\nearthsong\nmonokai\nnautilus\nnorse\nmetaverse\nrose pine\ndev\nhorizon\nnight runner\nsunset\nmoonlight\nishtar\ndark note\ndrowning\ngrape\nvscode\nmetropolis\nalduin\nolivia\niceberg dark\nsolarized dark\ndark magic girl\ncyberspace\nterminal\nchaos theory\njoker\ndots\neverblush\nmiami nights\naether\npulse\nanti hero\nryujinscales\nfloret\nterror below\ntron orange\naurora\nspiderman\nred dragon\ndark\nrgb\nvesper\nvoc\nmidnight\nmountain\narch\nincognito\nterra\ntrance\nsolarized osaka\niv spade\nhammerhead\nphantom\nfire\nstealth\nhusqy\nmatrix\nshadow".split(String.fromCharCode(10));
  const TOK = [
    ["bg", "Background"],
    ["bg2", "Secondary background"],
    ["el", "Surface / controls"],
    ["bd", "Border"],
    ["tx", "Primary text"],
    ["tx2", "Secondary text"],
    ["mu", "Upcoming characters"],
    ["cr", "Correct characters"],
    ["er", "Incorrect characters"],
    ["cur", "Cursor"],
    ["ac", "Accent"],
    ["ok", "Success"],
  ];
  const valid = (o) =>
    o &&
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    o.c &&
    TOK.every(([k]) => HEX.test(o.c[k]));
  let C = ls.get(TKEY, []);
  C = Array.isArray(C)
    ? C.filter(valid).map((o) => ({
        id: o.id,
        name: o.name.slice(0, 40),
        dark: !!o.dark,
        builtin: false,
        c: o.c,
      }))
    : [];
  const saveC = () => ls.set(TKEY, C);
  if (!Array.isArray(P.fav)) P.fav = [];
  P.tid = P.tid || "named-metaverse";
  P.rnd = P.rnd || "off";
  P.name = P.name || "Local user";
  const all = () => [...BI, ...C];
  let sessT = null,
    D = null,
    sel = "ac",
    hsv = [0, 1, 1],
    mob = false,
    fq = "",
    ff = "all";
  const sysDark = () =>
    window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  const curT = () =>
    sessT ||
    all().find(
      (t) => t.id === (P.auto ? (sysDark() ? "obsidian" : "arctic") : P.tid),
    ) ||
    BI[0];
  function applyT(t) {
    const r = document.documentElement;
    for (const k in t.c) r.style.setProperty("--" + k, t.c[k]);
    r.style.colorScheme = t.dark ? "dark" : "light";
  }
  /* color math */
  const h2r = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const r2h = (r, g, b) =>
    "#" +
    [r, g, b]
      .map((x) =>
        Math.round(Math.max(0, Math.min(255, x)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase();
  const hsv2r = (h, s, v) => {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
    };
    return [f(5), f(3), f(1)];
  };
  const r2hsv = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b),
      d = mx - mn;
    let h = d
      ? mx === r
        ? 60 * (((g - b) / d) % 6)
        : mx === g
          ? 60 * ((b - r) / d + 2)
          : 60 * ((r - g) / d + 4)
      : 0;
    if (h < 0) h += 360;
    return [h, mx ? d / mx : 0, mx];
  };
  const r2hsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b),
      l = (mx + mn) / 2,
      d = mx - mn;
    const h = r2hsv(r * 255, g * 255, b * 255)[0];
    return [h, d ? d / (1 - Math.abs(2 * l - 1)) : 0, l];
  };
  const hsl2r = (h, s, l) => {
    const a = s * Math.min(l, 1 - l),
      f = (n) => {
        const k = (n + h / 30) % 12;
        return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
      };
    return [f(0), f(8), f(4)];
  };
  const lum = (h) => {
    const [r, g, b] = h2r(h).map((x) => {
      x /= 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const x = lum(a),
      y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  function fix(fg, bg) {
    let [h, s, l] = r2hsl(...h2r(fg));
    const up = ratio("#FFFFFF", bg) > ratio("#000000", bg) ? -1 : 1;
    let o = fg;
    for (let i = 0; i < 50 && ratio(o, bg) < 4.5; i++) {
      l = Math.max(0, Math.min(1, l - up * 0.02));
      o = r2h(...hsl2r(h, s, l));
    }
    return o;
  }
  const lightThemeNames = new Set(EXTRA_THEME_NAMES.slice(0, 60));
  const themePalette = (name, index) => {
    let seed = index + 1;
    for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const hue = seed % 360;
    const light = lightThemeNames.has(name) || name.includes(" light") || name.includes(" dawn");
    const color = (h, s, l) => r2h(...hsl2r((h + 360) % 360, s, l));
    const bg = color(hue, light ? 0.16 : 0.24, light ? 0.965 : 0.105);
    const accent = fix(color(hue + 35 + (seed % 80), 0.72, light ? 0.42 : 0.66), bg);
    return mk("named-" + name.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name, !light, [
      bg,
      color(hue, light ? 0.12 : 0.22, light ? 0.985 : 0.08),
      color(hue, light ? 0.13 : 0.2, light ? 0.995 : 0.155),
      color(hue, light ? 0.22 : 0.16, light ? 0.12 : 0.93),
      color(hue, light ? 0.18 : 0.18, light ? 0.34 : 0.72),
      color(hue, light ? 0.08 : 0.1, 0.53),
      color(hue, light ? 0.18 : 0.2, light ? 0.82 : 0.26),
      accent,
      light ? "#C62828" : "#FF647C",
      accent,
    ]);
  };
  const existingThemeNames = new Set(BI.map((theme) => theme.name.toLowerCase()));
  BI.push(...EXTRA_THEME_NAMES.filter((name) => !existingThemeNames.has(name)).map(themePalette));
  /* theme page */
  function newD(t, keepId) {
    D = {
      id: keepId ? t.id : "custom-" + Date.now(),
      name: keepId ? t.name : t.name + " copy",
      dark: t.dark,
      base: { ...t.c },
      c: { ...t.c },
      saved: keepId ? { ...t.c } : null,
      builtin: false,
    };
    hsv = r2hsv(...h2r(D.c[sel]));
  }
  function card(t) {
    const cur = curT().id === t.id,
      f = P.fav.includes(t.id);
    return `<div class="card ${cur ? "sel" : ""}"><div style="height:56px;border-radius:8px;padding:8px;background:${t.c.bg};border:1px solid ${t.c.bd};font:13px monospace"><span style="color:${t.c.cr}">typ</span><span style="color:${t.c.er}">e</span><span style="color:${t.c.mu}"> test </span><span style="background:${t.c.ac};display:inline-block;width:10px;height:10px;border-radius:50%"></span></div><h4>${t.name}</h4><p>${t.dark ? "Dark" : "Light"} · ${t.builtin ? "Built-in" : "Custom"}${cur ? " · Current" : ""}</p><div class="row" data-t="${t.id}"><button data-a="ap" class="${cur ? "on" : ""}">Apply</button><button data-a="fv" aria-pressed="${f}" aria-label="Favorite">${f ? "★" : "☆"}</button><button data-a="du">Duplicate</button>${t.builtin ? "" : '<button data-a="ed">Edit</button><button data-a="dl">Delete</button>'}</div></div>`;
  }
  function grid() {
    const l = all().filter(
      (t) =>
        t.name.toLowerCase().includes(fq) &&
        (ff === "all" ||
          (ff === "dark" && t.dark) ||
          (ff === "light" && !t.dark) ||
          (ff === "fav" && P.fav.includes(t.id)) ||
          (ff === "custom" && !t.builtin)),
    );
    $("#tg").innerHTML = l.length
      ? l.map(card).join("")
      : '<div class="empty">No themes match.</div>';
  }
  function dThemes() {
    $("#main").innerHTML =
      `<h2 style="margin-top:0">Themes</h2><div class="row"><input type="text" id="sq" placeholder="Search themes" aria-label="Search themes" value="${fq}"><select id="sf" aria-label="Filter">${opt(
        [
          ["all", "All"],
          ["dark", "Dark"],
          ["light", "Light"],
          ["fav", "Favorites"],
          ["custom", "Custom"],
        ],
        ff,
      )}</select></div><div class="grid" id="tg" style="margin-top:16px"></div>
<div class="set"><span>Follow system light/dark (Obsidian / Arctic)</span><input type="checkbox" id="au" ${P.auto ? "checked" : ""}></div><div class="set"><span>Random theme after a test (this session only; your saved theme is never overwritten)</span><select id="rn">${opt(
        [
          ["off", "Off"],
          ["all", "Any"],
          ["fav", "Favorites"],
          ["dark", "Dark only"],
          ["light", "Light only"],
        ],
        P.rnd,
      )}</select></div>
<h2>Theme Studio</h2><div id="ed"></div>`;
    grid();
    studio();
    $("#sq").oninput = (e) => {
      fq = e.target.value.toLowerCase();
      grid();
    };
    $("#sf").onchange = (e) => {
      ff = e.target.value;
      grid();
    };
    $("#au").onchange = (e) => {
      P.auto = e.target.checked;
      save();
      sessT = null;
      draw();
    };
    $("#rn").onchange = (e) => {
      P.rnd = e.target.value;
      save();
    };
    $("#tg").onclick = (e) => {
      const b = e.target.closest("button[data-a]");
      if (!b) return;
      const id = b.parentNode.dataset.t,
        t = all().find((x) => x.id === id),
        a = b.dataset.a;
      if (a === "ap") {
        P.tid = id;
        P.auto = false;
        sessT = null;
        save();
        draw();
      } else if (a === "fv") {
        P.fav = P.fav.includes(id)
          ? P.fav.filter((x) => x !== id)
          : [...P.fav, id];
        save();
        grid();
      } else if (a === "du") {
        newD(t, false);
        studio();
        $("#ed").scrollIntoView();
      } else if (a === "ed") {
        newD(t, true);
        studio();
        $("#ed").scrollIntoView();
      } else if (a === "dl")
        confirmBox("Delete the custom theme “" + t.name + "”?", () => {
          C = C.filter((x) => x.id !== id);
          saveC();
          if (P.tid === id) {
            P.tid = "obsidian";
            save();
          }
          if (D && D.id === id) D = null;
          sessT = null;
          draw();
        });
    };
  }
  function studio() {
    const e = $("#ed");
    if (!D) {
      e.innerHTML =
        '<div class="row"><button class="pri" id="nw">New theme from current</button><button id="im">Import JSON</button></div><p class="hint">Built-in themes are never edited: duplicate one, or start a new theme, then customize.</p>';
      $("#nw").onclick = () => {
        newD(curT(), false);
        D.name = "My theme";
        studio();
      };
      $("#im").onclick = imp;
      return;
    }
    e.innerHTML = `<div class="row"><input type="text" id="dn" value="${D.name.replace(/"/g, "&quot;")}" aria-label="Theme name" maxlength="40"><button id="im">Import JSON</button><button id="ex">Export JSON</button></div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:16px"><div id="tl"></div><div id="pk"></div></div>
<h3>Harmony from accent</h3><div id="hm"></div><h3>Contrast (WCAG AA = 4.5:1)</h3><div id="ct"></div>
<h3>Live preview</h3><div class="row"><button id="pd" class="on">Desktop</button><button id="pm">Mobile</button></div><div id="pvw" style="margin-top:8px"></div>
<div class="row" style="margin-top:16px"><button class="pri" id="bA">Apply</button><button id="bS">Save changes</button><button id="bN">Save as new theme</button><button id="bR">Restore saved</button><button id="bB">Reset to base</button><button id="bD">Discard</button></div><p class="hint" id="fb"></p>`;
    $("#dn").oninput = (e) => {
      D.name = e.target.value;
    };
    $("#ex").onclick = async () => {
      try {
        await navigator.clipboard.writeText(
          JSON.stringify({ id: D.id, name: D.name, dark: D.dark, c: D.c }),
        );
        fb("Theme JSON copied.");
      } catch {
        fb("Copy failed.");
      }
    };
    $("#im").onclick = imp;
    $("#pd").onclick = () => {
      mob = false;
      $("#pd").classList.add("on");
      $("#pm").classList.remove("on");
      upd();
    };
    $("#pm").onclick = () => {
      mob = true;
      $("#pm").classList.add("on");
      $("#pd").classList.remove("on");
      upd();
    };
    $("#bA").onclick = () => {
      sessT = { id: D.id, name: D.name, dark: D.dark, c: { ...D.c } };
      applyT(sessT);
      fb("Applied for this session. Save to keep it.");
    };
    $("#bS").onclick = () => {
      const i = C.findIndex((x) => x.id === D.id);
      if (i < 0)
        return fb("Not a saved custom theme yet. Use Save as new theme.");
      C[i] = { ...C[i], name: D.name || "Untitled", c: { ...D.c } };
      saveC();
      D.saved = { ...D.c };
      fb("Saved.");
      grid();
    };
    $("#bN").onclick = () => {
      const t = {
        id: "custom-" + Date.now() + Math.floor(Math.random() * 1e3),
        name: (D.name || "Untitled").slice(0, 40),
        dark: D.dark,
        builtin: false,
        c: { ...D.c },
      };
      C.push(t);
      saveC();
      D.id = t.id;
      D.saved = { ...D.c };
      fb("Saved as a new theme.");
      grid();
    };
    $("#bR").onclick = () => {
      if (!D.saved) return fb("No saved version yet.");
      D.c = { ...D.saved };
      upd();
    };
    $("#bB").onclick = () => {
      D.c = { ...D.base };
      upd();
    };
    $("#bD").onclick = () => {
      D = null;
      sessT = null;
      applyT(curT());
      studio();
    };
    hsv = r2hsv(...h2r(D.c[sel]));
    pk();
    upd();
  }
  const fb = (m) => {
    const n = $("#fb");
    if (n) n.textContent = m;
  };
  function imp() {
    const t = prompt("Paste theme JSON:");
    if (!t) return;
    try {
      const o = JSON.parse(t);
      if (!valid(o)) throw 0;
      newD(
        { id: "x", name: o.name.slice(0, 40), dark: !!o.dark, c: o.c },
        false,
      );
      D.name = o.name.slice(0, 40);
      studio();
    } catch {
      alert("Invalid theme JSON. Every color must be a #RRGGBB hex value.");
    }
  }
  function setTok(hx, fromHsv) {
    D.c[sel] = hx;
    if (!fromHsv) hsv = r2hsv(...h2r(hx));
    upd(true);
  }
  function pk() {
    const k = TOK.find((x) => x[0] === sel);
    $("#pk").innerHTML =
      `<canvas id="wh" width="160" height="160" tabindex="0" role="slider" aria-label="Hue and saturation wheel for ${k[1]}. Arrow keys change hue and saturation"></canvas>
<div class="row" style="margin:8px 0"><label>Brightness <input type="range" id="vv" min="0" max="100"></label><label>Native <input type="color" id="nc"></label></div>
<div class="row"><label>HEX <input type="text" id="hx" class="in" maxlength="7"></label><button id="cp">Copy</button><button id="rc">Reset color</button></div>
<div class="row" style="margin-top:8px">${["r", "g", "b"].map((c) => `<label>${c.toUpperCase()} <input type="number" min="0" max="255" id="${c}" class="in"></label>`).join("")}</div>
<div class="row" style="margin-top:8px"><label>H <input type="number" min="0" max="360" id="hh" class="in"></label><label>S% <input type="number" min="0" max="100" id="ss" class="in"></label><label>L% <input type="number" min="0" max="100" id="ll" class="in"></label></div><p class="hint">Editing: ${k[1]}. Opacity is not supported (themes use opaque colors).</p>`;
    const cv = $("#wh"),
      mv = (e) => {
        const q = cv.getBoundingClientRect(),
          dx = ((e.clientX - q.left) / q.width) * 160 - 80,
          dy = ((e.clientY - q.top) / q.height) * 160 - 80;
        hsv = [
          ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360,
          Math.min(1, Math.hypot(dx, dy) / 80),
          hsv[2],
        ];
        setTok(r2h(...hsv2r(...hsv)), true);
      };
    cv.onpointerdown = (e) => {
      cv.setPointerCapture(e.pointerId);
      mv(e);
    };
    cv.onpointermove = (e) => {
      if (e.buttons) mv(e);
    };
    cv.onkeydown = (e) => {
      const d = {
        ArrowLeft: [-5, 0],
        ArrowRight: [5, 0],
        ArrowUp: [0, 0.05],
        ArrowDown: [0, -0.05],
      }[e.key];
      if (!d) return;
      e.preventDefault();
      hsv = [
        (hsv[0] + d[0] + 360) % 360,
        Math.max(0, Math.min(1, hsv[1] + d[1])),
        hsv[2],
      ];
      setTok(r2h(...hsv2r(...hsv)), true);
    };
    $("#vv").oninput = (e) => {
      hsv = [hsv[0], hsv[1], e.target.value / 100];
      setTok(r2h(...hsv2r(...hsv)), true);
    };
    $("#nc").oninput = (e) => setTok(e.target.value.toUpperCase());
    $("#hx").oninput = (e) => {
      let v = e.target.value.trim();
      if (v[0] !== "#") v = "#" + v;
      if (HEX.test(v)) setTok(v.toUpperCase());
    };
    ["r", "g", "b"].forEach(
      (c) =>
        ($("#" + c).oninput = () =>
          setTok(r2h(...["r", "g", "b"].map((x) => +$("#" + x).value || 0)))),
    );
    ["hh", "ss", "ll"].forEach(
      (c) =>
        ($("#" + c).oninput = () =>
          setTok(
            r2h(
              ...hsl2r(
                +$("#hh").value % 361,
                Math.min(100, +$("#ss").value) / 100,
                Math.min(100, +$("#ll").value) / 100,
              ),
            ),
          )),
    );
    $("#cp").onclick = async () => {
      try {
        await navigator.clipboard.writeText(D.c[sel]);
        fb("Copied " + D.c[sel]);
      } catch {
        fb("Copy failed.");
      }
    };
    $("#rc").onclick = () => setTok(D.base[sel]);
  }
  let wV = -1;
  function wheel() {
    if (wV === hsv[2]) return;
    wV = hsv[2];
    const cv = $("#wh");
    if (!cv) return;
    const x = cv.getContext("2d"),
      im = x.createImageData(160, 160);
    for (let y = 0; y < 160; y++)
      for (let i = 0; i < 160; i++) {
        const dx = i - 80,
          dy = y - 80,
          d = Math.hypot(dx, dy),
          o = (y * 160 + i) * 4;
        if (d <= 80) {
          const c = hsv2r(
            ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360,
            d / 80,
            hsv[2],
          );
          im.data[o] = c[0];
          im.data[o + 1] = c[1];
          im.data[o + 2] = c[2];
          im.data[o + 3] = 255;
        }
      }
    x.putImageData(im, 0, 0);
  }
  function upd(noPk) {
    if (!D) return;
    $("#tl").innerHTML = TOK.map(
      ([k, l]) =>
        `<button class="tk ${k === sel ? "on" : ""}" data-k="${k}"><span class="sw" style="background:${D.c[k]}"></span><span style="flex:1">${l}</span><code>${D.c[k]}</code></button>`,
    ).join("");
    $("#tl")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            sel = b.dataset.k;
            hsv = r2hsv(...h2r(D.c[sel]));
            pk();
            upd();
          }),
      );
    const cv = $("#wh");
    if (cv) {
      wheel();
      const [r, g, b] = h2r(D.c[sel]),
        l = r2hsl(r, g, b),
        s = (id, v) => {
          const n = $("#" + id);
          if (n && document.activeElement !== n) n.value = v;
        };
      s("hx", D.c[sel]);
      s("r", r);
      s("g", g);
      s("b", b);
      s("hh", Math.round(l[0]));
      s("ss", Math.round(l[1] * 100));
      s("ll", Math.round(l[2] * 100));
      s("vv", Math.round(hsv[2] * 100));
      $("#nc").value = D.c[sel].toLowerCase();
    }
    const a = hsv2r,
      ac = D.c.ac,
      [ar, ag, ab] = h2r(ac),
      [hh, hs, hl] = r2hsl(ar, ag, ab),
      rot = (d) => r2h(...hsl2r((hh + d + 360) % 360, hs, hl)),
      mono = (d) => r2h(...hsl2r(hh, hs, Math.max(0.1, Math.min(0.9, hl + d))));
    const H2 = {
      Complementary: [ac, rot(180)],
      Analogous: [rot(-30), ac, rot(30)],
      Triadic: [ac, rot(120), rot(240)],
      "Split-complementary": [ac, rot(150), rot(210)],
      Monochromatic: [mono(-0.2), ac, mono(0.2)],
    };
    $("#hm").innerHTML = Object.entries(H2)
      .map(
        ([n, a]) =>
          `<div class="row" style="margin-bottom:4px"><span style="width:150px;color:var(--tx2)">${n}</span>${a.map((c) => `<button class="hc" style="width:28px;height:28px;background:${c}" data-c="${c}" aria-label="Use ${c} as accent and cursor"></button>`).join("")}</div>`,
      )
      .join("");
    $("#hm")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            D.c.ac = b.dataset.c;
            D.c.cur = b.dataset.c;
            if (sel === "ac" || sel === "cur") hsv = r2hsv(...h2r(D.c[sel]));
            upd();
          }),
      );
    const pairs = [
      ["tx", "bg"],
      ["tx2", "bg"],
      ["mu", "bg"],
      ["cr", "bg"],
      ["er", "bg"],
      ["cur", "bg"],
      ["ac", "bg"],
      ["tx", "el"],
    ];
    let bad = pairs.filter(([f, b]) => ratio(D.c[f], D.c[b]) < 4.5);
    $("#ct").innerHTML =
      pairs
        .map(([f, b]) => {
          const r = ratio(D.c[f], D.c[b]);
          return `<div style="color:${r < 4.5 ? "var(--er)" : "var(--tx2)"}">${r < 4.5 ? "⚠ " : "✓ "}${f} on ${b}: ${r.toFixed(2)}:1${r < 4.5 ? " (below AA)" : ""}</div>`;
        })
        .join("") +
      (bad.length
        ? '<button id="fx" style="margin-top:8px">Apply suggested accessible colors</button>'
        : "");
    const fxb = $("#fx");
    if (fxb)
      fxb.onclick = () => {
        bad.forEach(([f, b]) => {
          D.c[f] = fix(D.c[f], D.c[b]);
        });
        hsv = r2hsv(...h2r(D.c[sel]));
        upd();
      };
    $("#pvw").style.cssText =
      Object.entries(D.c)
        .map(([k, v]) => `--${k}:${v}`)
        .join(";") +
      `;background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:12px;padding:16px;font-size:14px;max-width:${mob ? 360 : 9999}px`;
    $("#pvw").innerHTML =
      `<div style="display:flex;gap:12px;border-bottom:1px solid var(--bd);padding-bottom:8px"><b style="letter-spacing:.1em">KEYSTROKE</b><span style="color:var(--tx2)">Test</span><span style="color:var(--ac)">Themes</span></div><div style="display:flex;gap:16px;margin:12px 0"><span><small style="color:var(--mu)">WPM (sample)</small><br><b style="font-size:24px">72</b></span><span><small style="color:var(--mu)">ACC (sample)</small><br><b style="font-size:24px">97%</b></span></div><div style="font:18px/32px monospace"><span style="color:var(--cr)">the quick </span><span style="color:var(--er);text-decoration:underline">brwn</span><span style="box-shadow:-2px 0 0 var(--cur);color:var(--mu)"> fox</span><span style="color:var(--mu)"> jumps over</span></div><div class="row" style="margin-top:12px"><span style="background:var(--ac);color:var(--bg);padding:8px 16px;border-radius:999px">Restart</span><span style="background:var(--el);border:1px solid var(--bd);padding:6px 10px;border-radius:8px">Cherry MX Red-style</span><span style="color:var(--ok)">✓ success</span></div>`;
  }
  /* account + heatmap */
  let HP = "6m",
    selDay = null;
  const dk = (d) =>
    d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  const authHtml = (value) =>
    String(value || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function dAccount() {
    const authState = window.KEYSTROKE_AUTH?.getState() || {
      status: "loading",
      message: "Checking sign-in availability…",
    };
    const authUser = authState.status === "signing-out" ? null : authState.user;
    const authCard = authUser
      ? `<section class="auth-card auth-identity-card" aria-live="polite"><div class="auth-user"><div class="account-avatar-wrap" id="profileAvatarPreview">${window.KEYSTROKE_PERSONALIZATION?.avatarMarkup?.() || ""}<button class="account-avatar-edit" type="button" id="editProfileAvatar" aria-label="Edit profile avatar" title="Edit profile avatar">&#9998;</button></div><div class="auth-identity-copy"><strong>${authHtml(authUser.displayName || "Google user")}</strong><div class="hint">${authHtml(authUser.email || "")}</div></div></div><div class="auth-actions"><button id="editProfileAction" type="button" ${window.KEYSTROKE_PERSONALIZATION?.profileReady?.() ? "" : "disabled"}>Edit Profile</button><button id="googleSignOut" type="button" ${authState.status === "signing-out" ? "disabled" : ""}>${authState.status === "signing-out" ? "Signing out..." : "Sign out"}</button></div></section>`
      : `<section class="auth-card" aria-live="polite"><div><strong>Sign in with Google</strong><p class="hint" id="authMessage">${authState.status === "loading" ? "Checking your sign-in status..." : "Sign in to access your account and profile."}${["error", "unavailable"].includes(authState.status) ? ` ${authHtml(authState.message)}` : ""}</p></div><button id="googleSignIn" class="google-button" type="button" ${["loading", "signing-in", "signing-out"].includes(authState.status) || !authState.canSignIn ? "disabled" : ""}><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.89c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.37 37.96 46.98 31.94 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 0 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.91 23.91 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>${authState.status === "signing-in" ? "Connecting…" : authState.status === "signing-out" ? "Please wait…" : "Continue with Google"}</span></button></section>`;
    if (!authUser) {
      $("#main").innerHTML = `<h2 style="margin-top:0">Account</h2>${authCard}`;
      if ($("#googleSignIn"))
        $("#googleSignIn").onclick = () => window.KEYSTROKE_AUTH?.signIn();
      return;
    }
    const n = H.length,
      sum = (f) => H.reduce((a, h) => a + f(h), 0),
      tm = sum((h) => h.dur),
      words = sum((h) => h.c / 5),
      av = (a) => (n ? a / n : 0);
    const agg = {};
    H.forEach((h) => {
      const k = dk(new Date(h.t)),
        o = (agg[k] = agg[k] || { n: 0, t: 0, w: 0, s: 0 });
      o.n++;
      o.t += h.dur;
      o.w += h.c / 5;
      o.s += h.wpm;
    });
    const now = new Date(),
      td = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let streak = 0;
    for (let i = agg[dk(td)] ? 0 : 1; ; i++) {
      if (agg[dk(new Date(td.getFullYear(), td.getMonth(), td.getDate() - i))])
        streak++;
      else break;
    }
    const dm = { "30d": 30, "3m": 91, "6m": 182, "12m": 365, all: 0 };
    let days = dm[HP];
    if (!days) {
      const e = n ? Math.min(...H.map((h) => h.t)) : Date.now();
      days = Math.max(
        30,
        Math.round(
          (td -
            new Date(
              new Date(e).getFullYear(),
              new Date(e).getMonth(),
              new Date(e).getDate(),
            )) /
            864e5,
        ) + 1,
      );
    }
    const st0 = new Date(
        td.getFullYear(),
        td.getMonth(),
        td.getDate() - days + 1,
      ),
      sw = new Date(
        st0.getFullYear(),
        st0.getMonth(),
        st0.getDate() - st0.getDay(),
      );
    const lv = (c) => (c >= 7 ? 4 : c >= 4 ? 3 : c >= 2 ? 2 : c >= 1 ? 1 : 0),
      mixp = [0, 25, 45, 70, 100];
    let cells = "",
      tot = 0;
    for (let i = 0; ; i++) {
      const d = new Date(sw.getFullYear(), sw.getMonth(), sw.getDate() + i);
      if (d > td) break;
      if (d < st0) {
        cells += '<span class="hc" style="visibility:hidden"></span>';
        continue;
      }
      const k = dk(d),
        o = agg[k],
        c = o ? o.n : 0;
      tot += c;
      const L = lv(c);
      const lab =
        d.toLocaleDateString() +
        ": " +
        (o
          ? `${o.n} test${o.n > 1 ? "s" : ""}, ${Math.round(o.t)}s typing, ${Math.round(o.w)} words, avg ${Math.round(o.s / o.n)} WPM`
          : "no tests");
      cells += `<button class="hc" data-k="${k}" data-l="${lab}" aria-label="${lab}" style="background:${L ? `color-mix(in srgb,var(--ac) ${mixp[L]}%,var(--el))` : "var(--bd)"};${selDay === k ? "outline:2px solid var(--tx)" : ""}"></button>`;
    }
    const stat = (l, v) =>
        `<div class="stat"><small>${l}</small><b style="font-size:24px">${v}</b></div>`,
      fmt = (s) =>
        s >= 3600 ? (s / 3600).toFixed(1) + "h" : Math.round(s / 60) + "m";
    const rows = (
      selDay ? H.filter((h) => dk(new Date(h.t)) === selDay) : H.slice(-10)
    )
      .slice()
      .reverse();
    $("#main").innerHTML =
      `<h2 style="margin-top:0">Account</h2>${authCard}${window.KEYSTROKE_PERSONALIZATION?.profileMarkup?.() || ""}
<div class="stats">${stat("Tests completed", n)}${stat("Typing time", fmt(tm))}${stat("Words (est.)", Math.round(words))}${stat("Streak (days)", streak)}${stat("Highest WPM", n ? Math.round(Math.max(...H.map((h) => h.wpm))) : "—")}${stat("Avg WPM", n ? Math.round(av(sum((h) => h.wpm))) : "—")}${stat("Highest acc", n ? Math.round(Math.max(...H.map((h) => h.acc))) + "%" : "—")}${stat("Avg acc", n ? Math.round(av(sum((h) => h.acc))) + "%" : "—")}</div>
<div class="row"><h3 style="margin:0;flex:1">Activity · ${tot} test${tot === 1 ? "" : "s"} in period</h3><select id="hp" aria-label="Period">${opt(
        [
          ["30d", "Last 30 days"],
          ["3m", "Last 3 months"],
          ["6m", "Last 6 months"],
          ["12m", "Last 12 months"],
          ["all", "All history"],
        ],
        HP,
      )}</select></div>
${n ? "" : '<div class="empty" style="margin:8px 0">No tests yet. The grid fills in as you complete tests.</div>'}
<div style="display:flex;gap:6px;margin-top:8px;overflow-x:auto"><div style="display:grid;grid-template-rows:repeat(7,14px);gap:3px;font-size:10px;color:var(--mu)"><span>Sun</span><span></span><span>Tue</span><span></span><span>Thu</span><span></span><span>Sat</span></div><div style="display:grid;grid-template-rows:repeat(7,14px);grid-auto-flow:column;gap:3px">${cells}</div></div>
<div class="hint" id="hs" aria-live="polite">Hover, focus or click a day for details.</div><div class="row hint">Less ${[0, 1, 2, 3, 4].map((L) => `<span class="hc" style="display:inline-block;background:${L ? `color-mix(in srgb,var(--ac) ${mixp[L]}%,var(--el))` : "var(--bd)"}"></span>`).join("")} More (1, 2–3, 4–6, 7+ tests/day)</div>
<h3>${selDay ? "Tests on " + selDay + ' <button id="cf">Clear filter</button>' : "Last 10 tests"}</h3>${rows.length ? `<table><tr><th>When</th><th>Type</th><th>WPM</th><th>Acc</th></tr>${rows.map((h) => `<tr><td>${new Date(h.t).toLocaleString()}</td><td>${h.mode}</td><td>${Math.round(h.wpm)}</td><td>${Math.round(h.acc)}%</td></tr>`).join("")}</table>` : '<div class="empty">No tests.</div>'}
<div class="row" style="margin-top:24px"><button id="xp">Copy data as JSON</button><button id="cl">Clear history</button></div><p class="hint" id="xm"></p>`;
    window.KEYSTROKE_PERSONALIZATION?.bindProfileEditor?.();
    if ($("#editProfileAction")) $("#editProfileAction").onclick = () => $("#editProfileAvatar")?.click();
    if ($("#googleSignIn"))
      $("#googleSignIn").onclick = () => window.KEYSTROKE_AUTH?.signIn();
    if ($("#googleSignOut"))
      $("#googleSignOut").onclick = () => window.KEYSTROKE_AUTH?.signOut();
    $("#hp").onchange = (e) => {
      HP = e.target.value;
      dAccount();
    };
    const hs = $("#hs"),
      show = (e) => {
        const b = e.target.closest("button[data-k]");
        if (b) hs.textContent = b.dataset.l;
      };
    const gr = $("#main");
    gr.onmouseover = show;
    gr.onfocusin = show;
    gr.onclick = (e) => {
      const b = e.target.closest("button[data-k]");
      if (b) {
        selDay = selDay === b.dataset.k ? null : b.dataset.k;
        dAccount();
      }
    };
    if ($("#cf"))
      $("#cf").onclick = () => {
        selDay = null;
        dAccount();
      };
    $("#xp").onclick = async () => {
      try {
        await navigator.clipboard.writeText(
          JSON.stringify({ prefs: P, history: H, customThemes: C }),
        );
        $("#xm").textContent = "Copied.";
      } catch {
        $("#xm").textContent = "Copy failed.";
      }
    };
    $("#cl").onclick = () =>
      confirmBox("This permanently deletes all saved test history.", () => {
        H = [];
        ls.del(K.h);
        dAccount();
      });
  }
  window.addEventListener("keystroke-auth-state", () => {
    if (view === "account") dAccount();
    if (view === "leaderboard") dLeaderboard();
  });
  window.addEventListener("keystroke-personalization-changed", () => {
    if (view === "account") dAccount();
    if (view === "leaderboard") dLeaderboard();
  });
  window.addEventListener("keystroke-audio-library-ready", () => {
    if (view === "studio") dStudio();
  });
  /* wiring */
  VIEWS.splice(1, 0, ["themes", "Themes"]);
  VIEWS.splice(4, 0, ["account", "Account"]);
  const od = draw;
  draw = function () {
    if (view === "themes" || view === "account") {
      drawNav();
      (view === "themes" ? dThemes : dAccount)();
      applyT(curT());
      return;
    }
    od();
    applyT(curT());
    if (view === "settings") {
      const a = $("#a1");
      if (a) {
        a.closest(".set").innerHTML =
          '<span>Theme</span><button id="a1b">Open Themes</button>';
        $("#a1b").onclick = () => go("themes");
      }
    }
  };
  $("#bTheme").onclick = () => {
    P.tid = curT().dark ? "arctic" : "obsidian";
    P.auto = false;
    sessT = null;
    save();
    draw();
  };
  const osr = showResults;
  showResults = function (r, p) {
    osr(r, p);
    if (P.rnd === "off") return;
    const cur = curT().id,
      pool = all().filter(
        (t) =>
          t.id !== cur &&
          (P.rnd === "all" ||
            (P.rnd === "fav" && P.fav.includes(t.id)) ||
            (P.rnd === "dark" && t.dark) ||
            (P.rnd === "light" && !t.dark)),
      );
    if (pool.length) {
      sessT = pool[Math.floor(Math.random() * pool.length)];
      applyT(sessT);
    }
  };
  save();
  draw();
})();
