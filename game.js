"use strict";
(function () {
  const STORAGE_KEY = "keystroke:v1:mini-game";
  const players = {
    car: `<svg viewBox="0 0 64 36" aria-hidden="true"><path d="M9 22h46l-4-11a5 5 0 0 0-5-3H21a5 5 0 0 0-5 3L9 22Z" fill="var(--ac)"/><path d="M18 12h24l4 8H14l4-8Z" fill="var(--bg)"/><path d="M5 22h54v8H5z" fill="var(--ac)"/><circle cx="17" cy="30" r="5" fill="var(--tx)"/><circle cx="48" cy="30" r="5" fill="var(--tx)"/></svg>`,
    bike: `<svg viewBox="0 0 64 44" aria-hidden="true"><circle cx="15" cy="29" r="10" fill="none" stroke="var(--ac)" stroke-width="3"/><circle cx="50" cy="29" r="10" fill="none" stroke="var(--ac)" stroke-width="3"/><path d="m15 29 10-15 10 15H15l9-11h15l11 11m-8-18h8" fill="none" stroke="var(--tx)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="30" cy="7" r="5" fill="var(--ac)"/></svg>`,
    runner: `<svg viewBox="0 0 48 56" aria-hidden="true"><circle cx="29" cy="8" r="7" fill="var(--ac)"/><path d="m24 18 11 8-8 9-9-6-7 9m16-12 10 8 7-2M26 35l-9 10-1 8m6-18 8 8 11 3" fill="none" stroke="var(--ac)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    animal: `<svg viewBox="0 0 58 46" aria-hidden="true"><path d="m5 21 7-15 12 9h13l11-9 5 16-4 12H14L5 21Z" fill="var(--ac)"/><path d="m12 9 4 9-7-2m37-7-7 9 7-2" fill="var(--tx)"/><circle cx="20" cy="24" r="2" fill="var(--bg)"/><circle cx="39" cy="24" r="2" fill="var(--bg)"/><path d="m26 30 4 3 4-3" fill="none" stroke="var(--bg)" stroke-width="2" stroke-linecap="round"/></svg>`,
  };
  let settings = readSettings();
  let progress = 0;
  let completed = false;

  function readSettings() {
    try {
      return { enabled: false, player: "car", ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return { enabled: false, player: "car" };
    }
  }
  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }
  function playerMarkup(type = settings.player) {
    return players[type] || players.car;
  }
  function courseMarkup(extraClass = "") {
    const preview = extraClass === "mini-game-preview";
    const displayedProgress = preview ? 0 : progress;
    const label = completed
      ? displayedProgress >= 1 ? "Finished! Nice run." : `Test complete · ${(displayedProgress * 100).toFixed(1)}% progress`
      : `${(displayedProgress * 100).toFixed(displayedProgress > 0 && displayedProgress < 0.1 ? 1 : 0)}% through this test`;
    return `<div class="mini-game-course ${extraClass}" style="--game-progress:${displayedProgress}"><span class="mini-game-finish" aria-hidden="true">FINISH</span><span class="mini-game-player" style="left:${4 + displayedProgress * 88}%">${playerMarkup()}</span><div class="mini-game-road" aria-hidden="true"></div></div><p class="mini-game-progress">${label}</p>`;
  }
  function renderTest() {
    const container = document.querySelector("#miniGameTrack");
    if (!container) return;
    container.hidden = !settings.enabled;
    container.innerHTML = settings.enabled ? `<section class="mini-game-panel" aria-label="Typing game progress">${courseMarkup("mini-game-live")}</section>` : "";
  }
  function renderSection() {
    const main = document.querySelector("#main");
    if (!main) return;
    main.innerHTML = `<h2 style="margin-top:0">Mini Game</h2><p class="hint">Choose a player and turn on the optional track. Play opens the existing typing test; the track advances with correctly typed text and shares the active KEYSTROKE theme. Game settings are saved on this device.</p><section class="personal-card mini-game-settings"><label class="mini-game-toggle"><input id="miniGameEnabled" type="checkbox" ${settings.enabled ? "checked" : ""}> Show the mini-game beneath the typing text</label><label class="set" for="miniGamePlayer"><span>Player</span><select id="miniGamePlayer">${[["car", "Car"], ["bike", "Bike"], ["runner", "Running character"], ["animal", "Running animal"]].map(([id, label]) => `<option value="${id}" ${settings.player === id ? "selected" : ""}>${label}</option>`).join("")}</select></label><h3>Track preview</h3><div id="miniGamePreview">${courseMarkup("mini-game-preview")}</div><p class="hint">The game uses your real test progress. It does not change the timer, WPM, or accuracy.</p><div class="row"><button id="miniGamePlay" class="pri" type="button">Play Mini Game</button><button id="miniGameBack" type="button">Return to typing</button></div></section>`;
    main.querySelector("#miniGameEnabled").onchange = (event) => {
      settings.enabled = event.target.checked;
      saveSettings();
      renderSection();
    };
    main.querySelector("#miniGamePlayer").onchange = (event) => {
      settings.player = event.target.value;
      saveSettings();
      renderSection();
    };
    const openTypingGame = () => {
      settings.enabled = true;
      saveSettings();
      go("test");
    };
    main.querySelector("#miniGamePlay").onclick = openTypingGame;
    main.querySelector("#miniGameBack").onclick = openTypingGame;
  }
  function updateProgress(detail = {}, isComplete = false) {
    const raw = typeof detail === "number" ? detail : detail?.progress;
    progress = Math.max(0, Math.min(1, Number(raw) || 0));
    completed = isComplete;
    const container = document.querySelector("#miniGameTrack");
    if (container && !container.hidden) {
      const player = container.querySelector(".mini-game-player");
      const label = container.querySelector(".mini-game-progress");
      if (player) player.style.left = `${4 + progress * 88}%`;
      if (label) label.textContent = completed
        ? progress >= 1 ? "Finished! Nice run." : `Test complete · ${(progress * 100).toFixed(1)}% progress`
        : `${(progress * 100).toFixed(progress > 0 && progress < 0.1 ? 1 : 0)}% through this test`;
    }
  }

  window.addEventListener("keystroke-test-progress", (event) => updateProgress(event.detail));
  window.addEventListener("keystroke-test-reset", () => updateProgress(0));
  window.addEventListener("keystroke-test-complete", (event) => updateProgress(event.detail?.progress ?? 1, true));
  window.KEYSTROKE_GAME = { renderTest, renderSection };
  VIEWS.splice(4, 0, ["game", "Mini Game"]);
  renderTest();
  draw();
})();
