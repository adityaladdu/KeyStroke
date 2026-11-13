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
  const palette = { deep: "#2a7c13", leaf: "#76c457", cream: "#fff8cf", sand: "#fbe6c2" };
  let settings = loadSettings();
  let round = { status: "idle", seconds: settings.seconds, remaining: settings.seconds, score: 0, errors: 0, correctChars: 0, typedChars: 0, streak: 0, typed: "", queue: [], timer: null, message: "Press start, then type the word shown." };

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { seconds: [30, 60, 90].includes(saved.seconds) ? saved.seconds : 60 };
    } catch { return { seconds: 60 }; }
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
  function keyboardMarkup() {
    return `<div class="game-keyboard" role="group" aria-label="Interactive keyboard">${layouts.map((row, i) => `<div class="game-key-row game-key-row-${i + 1}">${row.map(item => {
      const [key, label, size = ""] = Array.isArray(item) ? item : [item, item, ""];
      const shown = label || (key === "space" ? "space" : key);
      const next = key === targetKey() && round.status === "running" ? " is-next" : "";
      const pressed = round.pressed === key ? " is-pressed" : "";
      return `<button class="game-key ${size ? `key-${size}` : ""}${next}${pressed}" type="button" data-game-key="${esc(key)}" aria-label="${esc(shown || "Space")}" ${["tab", "caps", "ctrl", "alt"].includes(key) ? "tabindex=-1" : ""}>${shown === "space" ? "" : esc(shown)}</button>`;
    }).join("")}</div>`).join("")}</div>`;
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
  function renderSection() {
    const main = document.querySelector("#main");
    if (!main) return;
    if (round.status === "idle") { round.seconds = settings.seconds; round.remaining = settings.seconds; fillQueue(); }
    const wpm = round.status !== "idle" ? Math.round(round.correctChars / 5 / Math.max((settings.seconds - round.remaining) / 60, 1 / 60)) : 0;
    const accuracy = round.typedChars ? Math.round(round.correctChars / round.typedChars * 100) : 100;
    const isFinished = round.status === "finished";
    const primaryLabel = round.status === "running" ? "Round in progress" : round.status === "paused" ? "Resume round" : isFinished ? "Play again" : "Start typing";
    main.innerHTML = `<section class="sprint-game" aria-labelledby="gameTitle" style="--game-green:${palette.deep};--game-leaf:${palette.leaf};--game-cream:${palette.cream};--game-sand:${palette.sand}">
      <div class="sprint-game-head"><div><p class="sprint-eyebrow">KEYSTROKE ARCADE <span aria-hidden="true">✳</span></p><h2 id="gameTitle">Word sprint</h2><p class="sprint-subtitle">Find your flow, one word at a time.</p></div><div class="sprint-controls"><label for="gameDuration">Round</label><select id="gameDuration" aria-label="Round duration" ${round.status === "running" ? "disabled" : ""}>${[30, 60, 90].map(n => `<option value="${n}" ${settings.seconds === n ? "selected" : ""}>${n} seconds</option>`).join("")}</select><button id="gameStart" class="pri" type="button" ${round.status === "running" ? "disabled" : ""}>${primaryLabel}</button></div></div>
      <div class="sprint-stats" aria-label="Round statistics"><div><small>TIME</small><strong id="gameTime">${round.remaining}s</strong></div><div><small>WPM</small><strong id="gameWpm">${wpm}</strong></div><div><small>WORDS</small><strong id="gameScore">${round.score}</strong></div><div><small>ACCURACY</small><strong id="gameAccuracy">${accuracy}%</strong></div><div><small>STREAK</small><strong id="gameStreak">${round.streak}</strong></div></div>
      <div class="sprint-play-area"><div class="sprint-words" id="gameWords" aria-label="Word queue">${queueMarkup()}</div><label class="sr-only" for="gameInput">Type the highlighted word and press space or enter</label><div class="sprint-input-wrap"><span class="sprint-input-caret" aria-hidden="true">›</span><input id="gameInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type the highlighted word…" ${round.status !== "running" ? "disabled" : ""} value="${esc(round.typed)}" aria-describedby="gameMessage"/><span class="sprint-input-tip">SPACE <span aria-hidden="true">↵</span></span></div><p class="sprint-message" id="gameMessage" role="status" aria-live="polite">${esc(round.message)}</p>${isFinished ? `<div class="sprint-result" role="status"><b>Round complete</b><span>${round.score} words · ${wpm} WPM · ${accuracy}% accuracy</span></div>` : ""}</div>
      ${keyboardMarkup()}
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
  window.KEYSTROKE_GAME = { renderSection };
  VIEWS.splice(4, 0, ["game", "Mini Game"]);
  draw();
})();
