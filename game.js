"use strict";
(function () {
  const STORAGE_KEY = "keystroke:v1:mini-game";
  const words = "kiwi green forest meadow leaf grove fresh moss lime sunny bright calm focus rhythm swift clever typing keys keyboard garden bamboo pebble breeze branch flower nature smooth steady quick agile happy spring trail river stone apple lemon cloud earth planet little wonder energy magic simple practice sprint skill speed light color warm soft vivid kind quiet grow bloom seed root fruit shade field".split(" ");
  const layouts = [
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", ["backspace", "⌫", "wide"]],
    [["tab", "Tab", "wide"], ..."qwertyuiop".split(""), "[", "]", "\\"],
    [["caps", "Caps", "wide"], ..."asdfghjkl".split(""), ";", "'", ["enter", "Enter", "wide"]],
    [["shift", "Shift", "wide"], ..."zxcvbnm".split(""), ",", ".", "/", ["shift", "Shift", "wide"]],
    [["ctrl", "Ctrl", "mod"], ["alt", "Alt", "mod"], ["space", "", "space"], ["alt", "Alt", "mod"], ["left", "←", "arrow"], ["down", "↓", "arrow"], ["right", "→", "arrow"]],
  ];
  const shiftedKeys = { "!": "1", "@": "2", "#": "3", $: "4", "%": "5", "^": "6", "&": "7", "*": "8", "(": "9", ")": "0", _: "-", "+": "=", "{": "[", "}": "]", "|": "\\", ":": ";", '"': "'", "<": ",", ">": ".", "?": "/" };
  const palette = { deep: "#2a7c13", leaf: "#76c457", cream: "#fff8cf", sand: "#fbe6c2" };
  const raceLength = 12;
  const players = {
    car: `<svg viewBox="0 0 64 36" aria-hidden="true"><path d="M9 22h46l-4-11a5 5 0 0 0-5-3H21a5 5 0 0 0-5 3L9 22Z" fill="var(--game-green)"/><path d="M18 12h24l4 8H14l4-8Z" fill="var(--bg)"/><path d="M5 22h54v8H5z" fill="var(--game-green)"/><circle cx="17" cy="30" r="5" fill="var(--tx)"/><circle cx="48" cy="30" r="5" fill="var(--tx)"/></svg>`,
    bike: `<svg viewBox="0 0 64 44" aria-hidden="true"><circle cx="15" cy="29" r="10" fill="none" stroke="var(--game-green)" stroke-width="3"/><circle cx="50" cy="29" r="10" fill="none" stroke="var(--game-green)" stroke-width="3"/><path d="m15 29 10-15 10 15H15l9-11h15l11 11m-8-18h8" fill="none" stroke="var(--tx)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="30" cy="7" r="5" fill="var(--game-green)"/></svg>`,
    runner: `<svg viewBox="0 0 48 56" aria-hidden="true"><circle cx="29" cy="8" r="7" fill="var(--game-green)"/><path d="m24 18 11 8-8 9-9-6-7 9m16-12 10 8 7-2M26 35l-9 10-1 8m6-18 8 8 11 3" fill="none" stroke="var(--game-green)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    animal: `<svg viewBox="0 0 58 46" aria-hidden="true"><path d="m5 21 7-15 12 9h13l11-9 5 16-4 12H14L5 21Z" fill="var(--game-green)"/><path d="m12 9 4 9-7-2m37-7-7 9 7-2" fill="var(--tx)"/><circle cx="20" cy="24" r="2" fill="var(--bg)"/><circle cx="39" cy="24" r="2" fill="var(--bg)"/><path d="m26 30 4 3 4-3" fill="none" stroke="var(--bg)" stroke-width="2" stroke-linecap="round"/></svg>`,
  };
  let settings = loadSettings();
  let round = { status: "idle", seconds: settings.seconds, remaining: settings.seconds, score: 0, errors: 0, correctChars: 0, typedChars: 0, streak: 0, typed: "", queue: [], timer: null, message: "Press start, then type the word shown." };

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { seconds: [30, 60, 90].includes(saved.seconds) ? saved.seconds : 60, player: players[saved.player] ? saved.player : "animal" };
    } catch { return { seconds: 60, player: "animal" }; }
  }
  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }
  function chooseWord() { return words[Math.floor(Math.random() * words.length)]; }
  function fillQueue() { while (round.queue.length < 6) round.queue.push(chooseWord()); }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
  function normalizeKey(key) {
    if (key.length === 1) return key.toLowerCase();
    return ({ Backspace: "backspace", Enter: "enter", " ": "space", Shift: "shift", Tab: "tab", CapsLock: "caps", Control: "ctrl", Alt: "alt", ArrowLeft: "left", ArrowDown: "down", ArrowRight: "right" })[key] || "";
  }
  function targetKey() {
    const char = round.queue[0]?.[round.typed.length];
    if (char) return char.toLowerCase();
    return "space";
  }
  function testKeyFor(char) {
    if (char === " ") return "space";
    return shiftedKeys[char] || String(char || "").toLowerCase();
  }
  function keyboardMarkup(mode = "game") {
    const expected = mode === "test" ? window.KEYSTROKE_APP?.nextKey?.() : targetKey();
    const nextKey = mode === "test" ? testKeyFor(expected) : expected;
    return `<div class="game-keyboard" role="group" aria-label="Interactive keyboard">${layouts.map((row, i) => `<div class="game-key-row game-key-row-${i + 1}">${row.map(item => {
      const [key, label, size = ""] = Array.isArray(item) ? item : [item, item, ""];
      const shown = label || (key === "space" ? "space" : key);
      const display = /^[a-z]$/.test(shown) ? shown.toUpperCase() : shown;
      const next = key === nextKey && (mode === "test" || round.status === "running") ? " is-next" : "";
      const pressed = round.pressed === key ? " is-pressed" : "";
      return `<button class="game-key ${size ? `key-${size}` : ""}${next}${pressed}" type="button" data-game-key="${esc(key)}" aria-label="${esc(shown || "Space")}" ${["tab", "caps", "ctrl", "alt"].includes(key) ? "tabindex=-1" : ""}>${shown === "space" ? "" : esc(display)}</button>`;
    }).join("")}</div>`).join("")}</div>`;
  }
  function updateTestKeyboard() {
    const root = document.querySelector("#testKeyboard");
    if (!root) return;
    const expected = window.KEYSTROKE_APP?.nextKey?.();
    const key = testKeyFor(expected);
    root.querySelectorAll(".game-key").forEach(button => button.classList.toggle("is-next", Boolean(key) && button.dataset.gameKey === key));
    const nextLabel = root.querySelector(".test-keyboard-next strong");
    if (nextLabel) nextLabel.textContent = expected ? expected === " " ? "Space" : expected : "Ready";
  }
  function renderTest() {
    const root = document.querySelector("#testKeyboard");
    if (!root) return;
    root.innerHTML = `<div class="test-keyboard-heading"><div><b>On-screen keyboard</b><span>Tap a key or type on your keyboard</span></div><span class="test-keyboard-next">NEXT KEY <strong>${esc(window.KEYSTROKE_APP?.nextKey?.() || "Ready")}</strong></span></div>${keyboardMarkup("test")}`;
    root.querySelectorAll(".game-key").forEach(button => {
      button.onpointerdown = event => event.preventDefault();
      button.onclick = () => {
        const key = button.dataset.gameKey;
        const next = window.KEYSTROKE_APP?.nextKey?.();
        let value = key;
        if (key === "backspace") value = "Backspace";
        else if (key === "space") value = " ";
        else if (["tab", "caps", "ctrl", "alt", "shift", "left", "down", "right"].includes(key)) return;
        else if (next && testKeyFor(next) === key) value = next;
        else if (/^[a-z]$/.test(key) && /^[A-Z]$/.test(next || "")) value = key.toUpperCase();
        button.classList.add("is-pressed");
        window.KEYSTROKE_APP?.typeKey?.(value);
        setTimeout(() => button.classList.remove("is-pressed"), 110);
      };
    });
  }
  function queueMarkup() {
    fillQueue();
    return round.queue.slice(0, 6).map((word, index) => {
      const label = index === 0 ? [...word].map((char, position) => {
        const typed = round.typed[position];
        const status = typed == null ? position === round.typed.length ? " is-letter-next" : "" : typed === char ? " is-letter-done" : " is-letter-error";
        return `<span class="${status.trim()}">${esc(char)}</span>`;
      }).join("") : esc(word);
      return `<span class="game-word${index === 0 ? " is-current" : ""}" ${index === 0 ? 'aria-current="true"' : ""}>${label}</span>`;
    }).join("");
  }
  function raceTrackMarkup() {
    const progress = Math.min(1, round.score / raceLength);
    const player = players[settings.player] || players.animal;
    return `<section class="sprint-race" id="sprintRaceTrack" aria-label="Typing race progress"><div class="sprint-race-label"><span>YOUR RACE</span><span id="raceProgress">${round.score} / ${raceLength} words</span></div><div class="sprint-track"><span class="sprint-finish">FINISH</span><div class="sprint-track-line" aria-hidden="true"></div><span class="sprint-racer" style="left:${5 + progress * 87}%">${player}</span></div><p class="sprint-race-caption">${progress >= 1 ? "You crossed the finish line!" : `${Math.round(progress * 100)}% to the finish`}</p></section>`;
  }
  function renderSection() {
    const main = document.querySelector("#main");
    if (!main) return;
    if (round.status === "idle") { round.seconds = settings.seconds; round.remaining = settings.seconds; fillQueue(); }
    const wpm = round.status !== "idle" ? Math.round(round.correctChars / 5 / Math.max((settings.seconds - round.remaining) / 60, 1 / 60)) : 0;
    const accuracy = round.typedChars ? Math.round(round.correctChars / round.typedChars * 100) : 100;
    const isFinished = round.status === "finished";
    const primaryLabel = round.status === "running" ? "Round in progress" : round.status === "paused" ? "Resume round" : isFinished ? "Play again" : "Start typing";
    main.innerHTML = `<section class="sprint-game" aria-labelledby="gameTitle" style="--game-green:${palette.deep};--game-leaf:${palette.leaf};--game-cream:${palette.cream};--game-sand:${palette.sand}">
      <div class="sprint-game-head"><div><p class="sprint-eyebrow">KEYSTROKE ARCADE <span aria-hidden="true">✳</span></p><h2 id="gameTitle">Word sprint</h2><p class="sprint-subtitle">Find your flow, one word at a time.</p></div><div class="sprint-controls"><label for="gameDuration">Round</label><select id="gameDuration" aria-label="Round duration" ${round.status === "running" ? "disabled" : ""}>${[30, 60, 90].map(n => `<option value="${n}" ${settings.seconds === n ? "selected" : ""}>${n} seconds</option>`).join("")}</select><label for="gamePlayer">Racer</label><select id="gamePlayer" aria-label="Choose your racer" ${round.status === "running" ? "disabled" : ""}>${[["animal", "Kiwi runner"], ["car", "Speedy car"], ["bike", "Trail bike"], ["runner", "Sprinter"]].map(([id, label]) => `<option value="${id}" ${settings.player === id ? "selected" : ""}>${label}</option>`).join("")}</select><button id="gameStart" class="pri" type="button" ${round.status === "running" ? "disabled" : ""}>${primaryLabel}</button></div></div>
      <div class="sprint-stats" aria-label="Round statistics"><div><small>TIME</small><strong id="gameTime">${round.remaining}s</strong></div><div><small>WPM</small><strong id="gameWpm">${wpm}</strong></div><div><small>WORDS</small><strong id="gameScore">${round.score}</strong></div><div><small>ACCURACY</small><strong id="gameAccuracy">${accuracy}%</strong></div><div><small>STREAK</small><strong id="gameStreak">${round.streak}</strong></div></div>
      ${raceTrackMarkup()}
      <div class="sprint-play-area"><div class="sprint-words" id="gameWords" aria-label="Word queue">${queueMarkup()}</div><label class="sr-only" for="gameInput">Type the highlighted word and press space or enter</label><div class="sprint-input-wrap"><span class="sprint-input-caret" aria-hidden="true">›</span><input id="gameInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type the highlighted word…" ${round.status !== "running" ? "disabled" : ""} value="${esc(round.typed)}" aria-describedby="gameMessage"/><span class="sprint-input-tip">SPACE <span aria-hidden="true">↵</span></span></div><p class="sprint-message" id="gameMessage" role="status" aria-live="polite">${esc(round.message)}</p>${isFinished ? `<div class="sprint-result" role="status"><b>Round complete</b><span>${round.score} words · ${wpm} WPM · ${accuracy}% accuracy</span></div>` : ""}</div>
      <div class="sprint-footer"><span><i class="game-dot"></i> GREENHOUSE WORD SET</span><span>Type the word, then press <kbd>Space</kbd> or <kbd>Enter</kbd></span></div>
    </section>`;
    bind(main);
  }
  function updateLive() {
    const time = document.querySelector("#gameTime");
    if (!time) return;
    const elapsed = Math.max(1, settings.seconds - round.remaining);
    const wpm = Math.round(round.correctChars / 5 / (elapsed / 60));
    const accuracy = round.typedChars ? Math.round(round.correctChars / round.typedChars * 100) : 100;
    time.textContent = `${round.remaining}s`;
    document.querySelector("#gameWpm").textContent = wpm;
    document.querySelector("#gameScore").textContent = round.score;
    document.querySelector("#gameAccuracy").textContent = `${accuracy}%`;
    document.querySelector("#gameStreak").textContent = round.streak;
    document.querySelector("#gameWords").innerHTML = queueMarkup();
    const race = document.querySelector("#sprintRaceTrack");
    const racer = document.querySelector(".sprint-racer");
    const raceLabel = document.querySelector("#raceProgress");
    const progress = Math.min(1, round.score / raceLength);
    if (racer) racer.style.left = `${5 + progress * 87}%`;
    if (raceLabel) raceLabel.textContent = `${round.score} / ${raceLength} words`;
    if (race) race.querySelector(".sprint-race-caption").textContent = progress >= 1 ? "You crossed the finish line!" : `${Math.round(progress * 100)}% to the finish`;
    document.querySelector("#gameMessage").textContent = round.message;
    const input = document.querySelector("#gameInput");
    if (input && input.value !== round.typed) input.value = round.typed;
    document.querySelectorAll(".game-key").forEach(button => button.classList.toggle("is-next", round.status === "running" && button.dataset.gameKey === targetKey()));
  }
  function startRound() {
    if (round.status === "paused") {
      round.status = "running";
      round.message = "Welcome back. Keep your rhythm going.";
      round.timer = setInterval(tick, 1000);
      renderSection();
      document.querySelector("#gameInput")?.focus({ preventScroll: true });
      return;
    }
    clearInterval(round.timer);
    round = { status: "running", seconds: settings.seconds, remaining: settings.seconds, score: 0, errors: 0, correctChars: 0, typedChars: 0, streak: 0, typed: "", queue: Array.from({ length: 6 }, chooseWord), timer: null, message: "Type the highlighted word, then press space." };
    round.timer = setInterval(tick, 1000);
    renderSection();
    document.querySelector("#gameInput")?.focus({ preventScroll: true });
  }
  function finishRound() {
    if (round.status !== "running") return;
    round.status = "finished";
    round.remaining = Math.max(round.remaining, 0);
    round.message = "You made it to the finish. Lovely run!";
    clearInterval(round.timer);
    renderSection();
  }
  function tick() {
    if (round.status !== "running") return;
    round.remaining = Math.max(0, round.remaining - 1);
    if (!round.remaining) {
      round.status = "finished";
      round.message = "Lovely run. Ready for another?";
      clearInterval(round.timer);
      renderSection();
      return;
    }
    updateLive();
  }
  function pauseRound() {
    if (round.status !== "running") return;
    clearInterval(round.timer);
    round.status = "paused";
    round.message = "Round paused. Pick up where you left off.";
  }
  function submitWord() {
    if (round.status !== "running" || !round.typed) return;
    const answer = round.queue[0];
    round.typedChars += Math.max(round.typed.length, answer.length);
    if (round.typed === answer) {
      round.score++;
      round.correctChars += answer.length;
      round.streak++;
      round.message = round.streak > 2 ? `Beautiful rhythm · ${round.streak} word streak!` : "Nice one. Keep going.";
    } else {
      round.errors++;
      round.streak = 0;
      const matched = [...round.typed].filter((char, i) => char === answer[i]).length;
      round.correctChars += matched;
      round.message = `The word was “${answer}”. Keep your flow.`;
    }
    round.queue.shift();
    round.queue.push(chooseWord());
    round.typed = "";
    updateLive();
    if (round.score >= raceLength) {
      finishRound();
      return;
    }
    document.querySelector("#gameInput")?.focus({ preventScroll: true });
  }
  function handleVirtualKey(key) {
    if (round.status !== "running") return;
    if (key === "backspace") round.typed = round.typed.slice(0, -1);
    else if (key === "enter" || key === "space") return submitWord();
    else if (/^[a-z]$/.test(key) && round.typed.length < 32) round.typed += key;
    updateLive();
    document.querySelector("#gameInput")?.focus({ preventScroll: true });
  }
  function bind(main) {
    main.querySelector("#gameDuration").onchange = event => {
      settings.seconds = Number(event.target.value);
      saveSettings();
      round.seconds = settings.seconds;
      round.remaining = settings.seconds;
      renderSection();
    };
    main.querySelector("#gameStart").onclick = startRound;
    main.querySelector("#gamePlayer").onchange = event => {
      settings.player = event.target.value;
      saveSettings();
      renderSection();
    };
    const input = main.querySelector("#gameInput");
    input.oninput = () => {
      round.typed = input.value.replace(/[^a-z]/gi, "").toLowerCase().slice(0, 32);
      input.value = round.typed;
      round.message = "Type the highlighted word, then press space.";
      updateLive();
    };
    input.onkeydown = event => {
      round.pressed = normalizeKey(event.key);
      main.querySelectorAll(".game-key").forEach(button => button.classList.toggle("is-pressed", button.dataset.gameKey === round.pressed));
      if ((event.key === " " || event.key === "Enter") && round.status === "running") {
        event.preventDefault();
        submitWord();
      }
    };
    input.onkeyup = () => {
      round.pressed = "";
      main.querySelectorAll(".game-key").forEach(button => button.classList.remove("is-pressed"));
    };
    main.querySelectorAll(".game-key").forEach(button => {
      button.onpointerdown = event => event.preventDefault();
      button.onclick = () => {
        const key = button.dataset.gameKey;
        round.pressed = key;
        button.classList.add("is-pressed");
        handleVirtualKey(key);
        setTimeout(() => button.classList.remove("is-pressed"), 110);
      };
    });
  }
  window.addEventListener("keystroke-view-change", event => {
    if (event.detail !== "game") pauseRound();
  });
  window.addEventListener("keystroke-test-progress", updateTestKeyboard);
  window.addEventListener("keystroke-test-reset", updateTestKeyboard);
  window.KEYSTROKE_GAME = { renderSection, renderTest };
  VIEWS.splice(4, 0, ["game", "Mini Game"]);
  draw();
})();
