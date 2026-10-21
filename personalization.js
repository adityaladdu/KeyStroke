"use strict";
(function () {
  const DB_NAME = "keystroke:v1:personalization";
  const MAX_IMAGE = 8 * 1024 * 1024;
  const MAX_AUDIO = 10 * 1024 * 1024;
  const SIZE = 256;
  const categories = {
    Animals: [
      ["cat", "Cat", "🐱", "#ffe6cf"],
      ["dog", "Dog", "🐶", "#f2dfc8"],
      ["fox", "Fox", "🦊", "#ffd9b8"],
      ["panda", "Panda", "🐼", "#e9edf0"],
      ["rabbit", "Rabbit", "🐰", "#f6dce7"],
      ["frog", "Frog", "🐸", "#d8f2d5"],
      ["tiger", "Tiger", "🐯", "#ffe2ad"],
      ["penguin", "Penguin", "🐧", "#dcecff"],
    ],
    Fruits: [
      ["strawberry", "Strawberry", "🍓", "#ffe0e6"],
      ["orange", "Orange", "🍊", "#ffead1"],
      ["mango", "Mango", "🥭", "#fff0bf"],
      ["watermelon", "Watermelon", "🍉", "#d9f3dc"],
      ["banana", "Banana", "🍌", "#fff4be"],
      ["cherry", "Cherry", "🍒", "#f8dce3"],
      ["pineapple", "Pineapple", "🍍", "#fff0b5"],
      ["peach", "Peach", "🍑", "#ffe0d2"],
    ],
    Illustrations: [
      ["geo", "Geometric", "◉", "linear-gradient(135deg,#85a9ff,#d7b4ff)"],
      ["pixel", "Pixel art", "▦", "linear-gradient(135deg,#324d9b,#62d7b4)"],
      ["cartoon", "Cartoon face", "☻", "linear-gradient(135deg,#ffd56b,#ff8f9d)"],
      ["gradient", "Abstract", "◒", "linear-gradient(135deg,#ff7cbd,#7c83ff)"],
      ["mono", "Monochrome", "◐", "linear-gradient(135deg,#333944,#8993a2)"],
      ["colorful", "Colorful", "✿", "linear-gradient(135deg,#55d6a0,#4c8dff 55%,#b48cff)"],
    ],
  };
  const events = [
    ["correct", "Correct character"],
    ["incorrect", "Incorrect character"],
    ["backspace", "Backspace"],
    ["word", "Word completed"],
    ["testComplete", "Test completed"],
    ["personalBest", "Personal best achieved"],
  ];
  const emptyAudio = () => ({
    mode: "presets",
    activeId: "",
    collection: [],
    eventMap: {},
    cooldown: 80,
    catIncorrect: false,
    catIncorrectId: "",
    catWord: false,
    catWordId: "",
  });
  let dbPromise;
  let profileUrl = "";
  let pendingImage = null;
  let pendingFile = null;
  let pendingUrl = "";
  let pendingPreview = null;
  let activeCategory = "Animals";
  let soundUrls = new Map();
  let soundPlayers = new Map();
  let lastSoundAt = 0;
  let rotation = 0;
  let priorityTimer = 0;
  let ownerLoadSeq = 0;
  let bundledSounds = [];
  let bundledSoundsFailed = false;
  fetch("audio-manifest.json")
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Audio manifest unavailable")))
    .then((manifest) => {
      bundledSounds = Array.isArray(manifest.soundLibrary) ? manifest.soundLibrary : [];
      window.dispatchEvent(new Event("keystroke-audio-library-ready"));
    })
    .catch(() => {
      bundledSoundsFailed = true;
      window.dispatchEvent(new Event("keystroke-audio-library-ready"));
    });
  const state = {
    owner: "guest",
    profile: { owner: "guest", avatarKind: "builtin", avatarId: "cat", audio: emptyAudio() },
    sounds: [],
    error: "",
  };

  function openDb() {
    if (!window.indexedDB) return Promise.reject(new Error("IndexedDB is unavailable"));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("profiles")) db.createObjectStore("profiles", { keyPath: "owner" });
        if (!db.objectStoreNames.contains("sounds")) db.createObjectStore("sounds", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open local personalization storage"));
    });
    return dbPromise;
  }

  async function request(storeName, mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const req = action(tx.objectStore(storeName));
      let value;
      req.onsuccess = () => { value = req.result; };
      req.onerror = () => reject(req.error || new Error("Local storage request failed"));
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error || new Error("Local storage transaction failed"));
      tx.onabort = () => reject(tx.error || new Error("Local storage transaction was cancelled"));
    });
  }

  const ownerKey = () => {
    const uid = window.KEYSTROKE_AUTH?.getState?.().user?.uid;
    return uid ? `user:${uid}` : "guest";
  };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const avatarById = (id) => Object.values(categories).flat().find((item) => item[0] === id) || categories.Animals[0];

  function avatarMarkup(profile = state.profile) {
    if (profile.avatarKind === "upload" && profile.avatarBlob) {
      if (!profileUrl) profileUrl = URL.createObjectURL(profile.avatarBlob);
      return `<span class="keystroke-avatar"><img src="${profileUrl}" alt="Selected custom avatar"></span>`;
    }
    const item = avatarById(profile.avatarId);
    return `<span class="keystroke-avatar" style="background:${item[3]}" aria-label="${esc(item[1])} avatar"><span aria-hidden="true">${item[2]}</span></span>`;
  }

  function galleryMarkup() {
    const selected = state.profile.avatarKind === "builtin" ? state.profile.avatarId : "";
    return categories[activeCategory].map(([id, label, glyph, color]) =>
      `<button type="button" class="avatar-choice ${selected === id ? "selected" : ""}" data-avatar-id="${id}" aria-label="Choose ${label} avatar" aria-pressed="${selected === id}" style="--avatar-bg:${color}"><span aria-hidden="true">${glyph}</span><small>${label}</small></button>`,
    ).join("");
  }

  function profileMarkup() {
    return `<section class="personal-card" aria-label="Profile avatar settings"><div class="personal-profile-head"><div id="profileAvatarPreview">${avatarMarkup()}</div><div class="personal-profile-copy"><strong>Profile avatar</strong><p class="hint">Choose an avatar for this ${state.owner === "guest" ? "guest profile" : "Google account"}. Your Google name and email stay separate.</p><button type="button" id="editProfileAvatar" aria-expanded="false">Edit Profile</button></div></div><div id="profileAvatarEditor" class="avatar-editor" hidden><div class="personal-tabs" role="tablist" aria-label="Avatar categories">${Object.keys(categories).map((name, i) => `<button type="button" role="tab" data-avatar-category="${name}" aria-selected="${i === 0}" class="${i === 0 ? "on" : ""}">${name}</button>`).join("")}</div><div id="avatarGallery" class="avatar-gallery">${galleryMarkup()}</div><div class="avatar-upload"><label class="avatar-upload-label">Upload an image<input id="avatarFile" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"></label><p class="hint">PNG, JPG, or WebP; up to 8 MB. Drag to position, then zoom and crop.</p><canvas id="avatarCrop" width="256" height="256" role="img" aria-label="Square avatar crop preview"></canvas><label class="avatar-zoom">Zoom <input id="avatarZoom" type="range" min="1" max="3" step="0.05" value="1" aria-label="Avatar crop zoom"></label><div class="row"><button id="avatarReset" type="button">Reset crop</button><button id="avatarCancel" type="button">Cancel</button><button id="avatarSave" class="pri" type="button" disabled>Save avatar</button></div></div><p class="hint" id="avatarMessage" role="status" aria-live="polite">${esc(state.error)}</p></div></section>`;
  }

  function drawCrop() {
    const canvas = document.querySelector("#avatarCrop");
    if (!canvas || !pendingImage) return;
    const ctx = canvas.getContext("2d");
    const w = pendingImage.width, h = pendingImage.height;
    const crop = Math.min(w, h) / (Number(document.querySelector("#avatarZoom")?.value) || 1);
    const maxX = Math.max(0, w - crop), maxY = Math.max(0, h - crop);
    pendingImage.x = Math.max(0, Math.min(maxX, pendingImage.x));
    pendingImage.y = Math.max(0, Math.min(maxY, pendingImage.y));
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(pendingImage.bitmap, pendingImage.x, pendingImage.y, crop, crop, 0, 0, SIZE, SIZE);
  }

  function drawGallery() {
    const gallery = document.querySelector("#avatarGallery");
    if (!gallery) return;
    gallery.innerHTML = galleryMarkup();
    gallery.querySelectorAll("[data-avatar-id]").forEach((button) => {
      button.onclick = async () => {
        const id = button.dataset.avatarId;
        try {
          await saveProfile({ avatarKind: "builtin", avatarId: id, avatarBlob: null });
          updateAvatarPreview();
          drawGallery();
          setProfileMessage("Avatar selected.");
        } catch {
          setProfileMessage("Avatar could not be saved. Your previous avatar is unchanged.");
        }
      };
    });
  }

  function updateAvatarPreview() {
    const preview = document.querySelector("#profileAvatarPreview");
    if (preview) preview.innerHTML = avatarMarkup();
  }
  function setProfileMessage(message) {
    const note = document.querySelector("#avatarMessage");
    if (note) note.textContent = message;
  }
  async function saveProfile(changes) {
    const nextProfile = { ...state.profile, ...changes, owner: state.owner };
    await request("profiles", "readwrite", (store) => store.put(nextProfile));
    if (state.owner === nextProfile.owner) state.profile = nextProfile;
    if (profileUrl) URL.revokeObjectURL(profileUrl);
    profileUrl = "";
    if (state.profile.avatarKind === "upload") avatarMarkup();
  }

  function bindProfileEditor() {
    const toggle = document.querySelector("#editProfileAvatar");
    const editor = document.querySelector("#profileAvatarEditor");
    if (!toggle || !editor) return;
    toggle.onclick = () => {
      editor.hidden = !editor.hidden;
      toggle.setAttribute("aria-expanded", String(!editor.hidden));
    };
    document.querySelectorAll("[data-avatar-category]").forEach((button) => {
      button.onclick = () => {
        activeCategory = button.dataset.avatarCategory;
        document.querySelectorAll("[data-avatar-category]").forEach((tab) => {
          const selected = tab === button;
          tab.classList.toggle("on", selected);
          tab.setAttribute("aria-selected", String(selected));
        });
        drawGallery();
      };
    });
    const canvas = document.querySelector("#avatarCrop");
    const fileInput = document.querySelector("#avatarFile");
    const save = document.querySelector("#avatarSave");
    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const allowed = ["image/png", "image/jpeg", "image/webp"];
      if (!allowed.includes(file.type) || file.size > MAX_IMAGE) {
        setProfileMessage(file.size > MAX_IMAGE ? "Choose an image smaller than 8 MB." : "Choose a PNG, JPG, or WebP image.");
        fileInput.value = "";
        return;
      }
      setProfileMessage("Loading image…");
      try {
        const bitmap = await createImageBitmap(file);
        pendingImage = { bitmap, file, x: Math.max(0, (bitmap.width - Math.min(bitmap.width, bitmap.height)) / 2), y: Math.max(0, (bitmap.height - Math.min(bitmap.width, bitmap.height)) / 2) };
        document.querySelector("#avatarZoom").value = "1";
        save.disabled = false;
        drawCrop();
        setProfileMessage("Drag the image to position it, then save.");
      } catch {
        pendingImage = null;
        save.disabled = true;
        setProfileMessage("That image could not be opened. Try another file.");
      }
    };
    document.querySelector("#avatarZoom").oninput = drawCrop;
    let drag = null;
    canvas.onpointerdown = (event) => {
      if (!pendingImage) return;
      drag = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    };
    canvas.onpointermove = (event) => {
      if (!drag || !pendingImage) return;
      const crop = Math.min(pendingImage.bitmap.width, pendingImage.bitmap.height) / (Number(document.querySelector("#avatarZoom").value) || 1);
      pendingImage.x -= (event.clientX - drag.x) * crop / canvas.clientWidth;
      pendingImage.y -= (event.clientY - drag.y) * crop / canvas.clientHeight;
      drag = { x: event.clientX, y: event.clientY };
      drawCrop();
    };
    canvas.onpointerup = canvas.onpointercancel = () => { drag = null; };
    document.querySelector("#avatarReset").onclick = () => {
      if (!pendingImage) return;
      pendingImage.x = Math.max(0, (pendingImage.bitmap.width - Math.min(pendingImage.bitmap.width, pendingImage.bitmap.height)) / 2);
      pendingImage.y = Math.max(0, (pendingImage.bitmap.height - Math.min(pendingImage.bitmap.width, pendingImage.bitmap.height)) / 2);
      document.querySelector("#avatarZoom").value = "1";
      drawCrop();
    };
    document.querySelector("#avatarCancel").onclick = () => {
      pendingImage?.bitmap.close?.();
      pendingImage = null;
      fileInput.value = "";
      save.disabled = true;
      editor.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      setProfileMessage("");
    };
    save.onclick = async () => {
      if (!pendingImage) return;
      setProfileMessage("Saving avatar…");
      save.disabled = true;
      try {
        const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not crop image")), "image/webp", 0.88));
        await saveProfile({ avatarKind: "upload", avatarId: "uploaded", avatarBlob: blob });
        pendingImage.bitmap.close?.();
        pendingImage = null;
        updateAvatarPreview();
        drawGallery();
        fileInput.value = "";
        setProfileMessage("Avatar saved on this device for this profile.");
      } catch {
        save.disabled = false;
        setProfileMessage("Avatar could not be saved. Your previous avatar is unchanged.");
      }
    };
  }

  function soundSelect(event, audio) {
    return `<label class="sound-assignment">${event[1]}<select data-sound-event="${event[0]}" aria-label="Sound for ${event[1]}"><option value="">No sound</option>${state.sounds.map((sound) => `<option value="${esc(sound.id)}" ${audio.eventMap?.[event[0]] === sound.id ? "selected" : ""}>${esc(sound.name)}</option>`).join("")}</select></label>`;
  }
  function soundCard(sound, audio) {
    const active = audio.activeId === sound.id;
    const chosen = (audio.collection || []).includes(sound.id);
    return `<article class="sound-card"><div class="sound-card-head"><div><strong>${esc(sound.name)}</strong><small>${Math.max(1, Math.round(sound.blob.size / 1024))} KB</small></div><button type="button" data-play-custom="${esc(sound.id)}">Preview</button></div><div class="sound-card-controls"><label><input type="radio" name="activeCustomSound" data-active-custom="${esc(sound.id)}" ${active ? "checked" : ""}> Active</label><label><input type="checkbox" data-custom-collection="${esc(sound.id)}" ${chosen ? "checked" : ""}> Include in rotation</label><label>Volume <input type="range" min="0" max="1" step=".05" value="${sound.volume ?? 0.7}" data-custom-volume="${esc(sound.id)}" aria-label="Volume for ${esc(sound.name)}"></label><button type="button" data-delete-custom="${esc(sound.id)}">Delete</button></div></article>`;
  }
  function soundStudioMarkup() {
    const audio = { ...emptyAudio(), ...(state.profile.audio || {}) };
    const hasSounds = state.sounds.length > 0;
    return `<section class="personal-card custom-sound-studio" aria-label="My Sounds"><h2>My Sounds</h2><p class="hint">Uploaded sounds stay in this browser profile. They do not replace the built-in keyboard presets.</p><div class="set"><label for="customSoundMode">Typing sound mode</label><select id="customSoundMode"><option value="presets" ${audio.mode === "presets" ? "selected" : ""}>Existing keyboard presets</option><option value="library" ${audio.mode === "library" ? "selected" : ""}>Unverified bundled clip</option><option value="every" ${audio.mode === "every" ? "selected" : ""}>Every Keystroke</option><option value="random" ${audio.mode === "random" ? "selected" : ""}>Random Rotation</option><option value="alternate" ${audio.mode === "alternate" ? "selected" : ""}>Alternating Sounds</option><option value="special" ${audio.mode === "special" ? "selected" : ""}>Special Events</option><option value="cat" ${audio.mode === "cat" ? "selected" : ""}>Cat Mode — use your own meow</option></select></div><div class="set"><label for="soundCooldown">Sound cooldown</label><input id="soundCooldown" type="range" min="0" max="1000" step="25" value="${audio.cooldown ?? 80}" aria-label="Sound cooldown in milliseconds"><output id="soundCooldownValue">${audio.cooldown ?? 80} ms</output></div>${bundledSoundMarkup(audio)}<div id="customSoundAssignments" ${audio.mode === "special" ? "" : "hidden"}><h3>Assign sounds to events</h3><div class="sound-assignments">${events.map((event) => soundSelect(event, audio)).join("")}</div></div><div id="catSoundOptions" ${audio.mode === "cat" ? "" : "hidden"}><p class="hint">Select any uploaded sound as the meow. No sample is bundled.</p><label><input type="checkbox" id="catIncorrect" ${audio.catIncorrect ? "checked" : ""}> Use a different sound for incorrect keys</label><select id="catIncorrectSound" aria-label="Cat Mode incorrect sound"><option value="">Choose an incorrect sound</option>${state.sounds.map((sound) => `<option value="${esc(sound.id)}" ${audio.catIncorrectId === sound.id ? "selected" : ""}>${esc(sound.name)}</option>`).join("")}</select><label><input type="checkbox" id="catWord" ${audio.catWord ? "checked" : ""}> Play an optional word-complete sound</label><select id="catWordSound" aria-label="Cat Mode word-complete sound"><option value="">Choose a word sound</option>${state.sounds.map((sound) => `<option value="${esc(sound.id)}" ${audio.catWordId === sound.id ? "selected" : ""}>${esc(sound.name)}</option>`).join("")}</select></div><div class="sound-upload"><label>Sound name<input id="newSoundName" type="text" maxlength="48" placeholder="Name your sound"></label><label class="avatar-upload-label">Upload audio<input id="customSoundFile" type="file" accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/webm"></label><div class="row"><button type="button" id="previewNewSound" disabled>Preview upload</button><button type="button" id="saveNewSound" class="pri" disabled>Save sound</button></div><p class="hint" id="customSoundMessage" role="status" aria-live="polite">${hasSounds ? "" : "No custom sounds yet. Upload an audio file to get started."}</p></div><div id="customSoundList" class="sound-library">${state.sounds.map((sound) => soundCard(sound, audio)).join("")}</div></section>`;
  }

  async function saveAudioSettings(changes) {
    const nextProfile = {
      ...state.profile,
      audio: { ...emptyAudio(), ...(state.profile.audio || {}), ...changes },
    };
    await request("profiles", "readwrite", (store) => store.put(nextProfile));
    if (state.owner === nextProfile.owner) state.profile = nextProfile;
  }
  async function saveSoundAndSettings(sound, audio) {
    const db = await openDb();
    const nextProfile = { ...state.profile, audio };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(["sounds", "profiles"], "readwrite");
      tx.objectStore("sounds").add(sound);
      tx.objectStore("profiles").put(nextProfile);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Could not save sound"));
      tx.onabort = () => reject(tx.error || new Error("Could not save sound"));
    });
    if (state.owner === nextProfile.owner) state.profile = nextProfile;
  }
  async function deleteSoundAndSettings(id, audio) {
    const db = await openDb();
    const nextProfile = { ...state.profile, audio };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(["sounds", "profiles"], "readwrite");
      tx.objectStore("sounds").delete(id);
      tx.objectStore("profiles").put(nextProfile);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Could not delete sound"));
      tx.onabort = () => reject(tx.error || new Error("Could not delete sound"));
    });
    if (state.owner === nextProfile.owner) state.profile = nextProfile;
  }
  function setSoundMessage(message) {
    const node = document.querySelector("#customSoundMessage");
    if (node) node.textContent = message;
  }
  function refreshSoundStudio() {
    const container = document.querySelector(".custom-sound-studio");
    if (!container) return;
    const holder = document.createElement("div");
    holder.innerHTML = soundStudioMarkup();
    container.replaceWith(holder.firstElementChild);
    bindSoundStudio();
  }
  function previewBlob(id, media, volume = 0.7, onError = () => {}) {
    for (const [otherId, other] of soundPlayers) {
      if (otherId !== id) {
        other.pause();
        other.currentTime = 0;
      }
    }
    let player = soundPlayers.get(id);
    if (!player) {
      let source = typeof media === "string" ? media : soundUrls.get(id);
      if (!source) {
        source = URL.createObjectURL(media);
        soundUrls.set(id, source);
      }
      player = new Audio(source);
      player.preload = "auto";
      soundPlayers.set(id, player);
    }
    try {
      player.pause();
      player.currentTime = 0;
      player.volume = Math.max(0, Math.min(1, volume));
      const playback = player.play();
      playback?.catch(onError);
    } catch {
      onError();
    }
  }

  function bundledSoundMarkup(audio) {
    if (!bundledSounds.length) return bundledSoundsFailed ? `<p class="hint" role="status">The bundled audio catalog could not be loaded.</p>` : "";
    return `<section class="bundled-sounds" aria-label="Bundled audio clips"><h3>Unverified clips</h3><p class="hint">These local MP3 files have not been listened to or identified. Preview each clip before selecting it. A selected clip restarts from the beginning on every eligible keypress.</p><div class="bundled-sound-grid">${bundledSounds.map((sound) => {
      const active = audio.mode === "library" && audio.activeId === sound.id;
      return `<article class="sound-card ${active ? "sel" : ""}"><div class="sound-card-head"><div><strong>${esc(sound.displayName)}</strong><small>${esc(sound.category)} · ${Number(sound.durationSeconds).toFixed(1)} sec</small></div></div><div class="sound-card-controls"><button type="button" data-preview-bundled="${esc(sound.id)}">Play preview</button><button type="button" data-stop-bundled="${esc(sound.id)}">Stop preview</button><button type="button" class="${active ? "on" : ""}" aria-pressed="${active}" data-select-bundled="${esc(sound.id)}">${active ? "Active" : "Use for typing"}</button></div></article>`;
    }).join("")}</div></section>`;
  }

  function bindSoundStudio() {
    const mode = document.querySelector("#customSoundMode");
    if (!mode) return;
    const currentAudio = () => ({ ...emptyAudio(), ...(state.profile.audio || {}) });
    const persist = async (changes) => {
      try {
        await saveAudioSettings(changes);
        return true;
      } catch {
        setSoundMessage("Could not save sound settings in this browser.");
        return false;
      }
    };
    mode.onchange = async () => {
      if (!(await persist({ mode: mode.value }))) return refreshSoundStudio();
      refreshSoundStudio();
    };
    const cooldown = document.querySelector("#soundCooldown");
    cooldown.oninput = () => {
      document.querySelector("#soundCooldownValue").textContent = `${cooldown.value} ms`;
    };
    cooldown.onchange = () => persist({ cooldown: Number(cooldown.value) });
    document.querySelectorAll("[data-sound-event]").forEach((select) => {
      select.onchange = () => persist({ eventMap: { ...currentAudio().eventMap, [select.dataset.soundEvent]: select.value } });
    });
    const catIncorrect = document.querySelector("#catIncorrect");
    if (catIncorrect) catIncorrect.onchange = () => persist({ catIncorrect: catIncorrect.checked });
    const catWord = document.querySelector("#catWord");
    if (catWord) catWord.onchange = () => persist({ catWord: catWord.checked });
    const catErrorSound = document.querySelector("#catIncorrectSound");
    if (catErrorSound) catErrorSound.onchange = () => persist({ catIncorrectId: catErrorSound.value });
    const catWordSound = document.querySelector("#catWordSound");
    if (catWordSound) catWordSound.onchange = () => persist({ catWordId: catWordSound.value });

    document.querySelectorAll("[data-play-custom]").forEach((button) => {
      button.onclick = () => {
        const sound = state.sounds.find((item) => item.id === button.dataset.playCustom);
        if (sound) previewBlob(sound.id, sound.blob, sound.volume ?? 0.7);
      };
    });
    document.querySelectorAll("[data-preview-bundled]").forEach((button) => {
      button.onclick = () => {
        const sound = bundledSounds.find((item) => item.id === button.dataset.previewBundled);
        if (sound) previewBlob(sound.id, sound.src, 0.7, () => setSoundMessage("This MP3 could not be played by this browser."));
      };
    });
    document.querySelectorAll("[data-stop-bundled]").forEach((button) => {
      button.onclick = () => {
        const player = soundPlayers.get(button.dataset.stopBundled);
        if (!player) return;
        try { player.pause(); player.currentTime = 0; } catch {}
      };
    });
    document.querySelectorAll("[data-select-bundled]").forEach((button) => {
      button.onclick = async () => {
        const sound = bundledSounds.find((item) => item.id === button.dataset.selectBundled);
        if (!sound) return;
        if (!(await persist({ mode: "library", activeId: sound.id }))) return refreshSoundStudio();
        refreshSoundStudio();
      };
    });
    document.querySelectorAll("[data-active-custom]").forEach((radio) => {
      radio.onchange = async () => {
        if (!radio.checked) return;
        if (!(await persist({ activeId: radio.dataset.activeCustom }))) return refreshSoundStudio();
        refreshSoundStudio();
      };
    });
    document.querySelectorAll("[data-custom-collection]").forEach((checkbox) => {
      checkbox.onchange = () => {
        const collection = new Set(currentAudio().collection || []);
        if (checkbox.checked) collection.add(checkbox.dataset.customCollection);
        else collection.delete(checkbox.dataset.customCollection);
        persist({ collection: [...collection] });
      };
    });
    document.querySelectorAll("[data-custom-volume]").forEach((range) => {
      range.onchange = async () => {
        const sound = state.sounds.find((item) => item.id === range.dataset.customVolume);
        if (!sound) return;
        sound.volume = Number(range.value);
        try { await request("sounds", "readwrite", (store) => store.put(sound)); } catch { setSoundMessage("Could not save the sound volume."); }
      };
    });
    document.querySelectorAll("[data-delete-custom]").forEach((button) => {
      button.onclick = async () => {
        const id = button.dataset.deleteCustom;
        if (!window.confirm("Delete this uploaded sound?")) return;
        try {
          const audio = currentAudio();
          audio.collection = audio.collection.filter((soundId) => soundId !== id);
          if (audio.activeId === id) audio.activeId = "";
          for (const event of Object.keys(audio.eventMap)) if (audio.eventMap[event] === id) delete audio.eventMap[event];
          if (audio.catIncorrectId === id) audio.catIncorrectId = "";
          if (audio.catWordId === id) audio.catWordId = "";
          await deleteSoundAndSettings(id, audio);
          state.sounds = state.sounds.filter((sound) => sound.id !== id);
          if (soundUrls.has(id)) URL.revokeObjectURL(soundUrls.get(id));
          soundUrls.delete(id);
          soundPlayers.delete(id);
          refreshSoundStudio();
        } catch { setSoundMessage("Could not delete this sound."); }
      };
    });

    const fileInput = document.querySelector("#customSoundFile");
    const previewButton = document.querySelector("#previewNewSound");
    const saveButton = document.querySelector("#saveNewSound");
    fileInput.onchange = () => {
      pendingFile = fileInput.files?.[0] || null;
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
      pendingUrl = "";
      pendingPreview = null;
      previewButton.disabled = saveButton.disabled = true;
      if (!pendingFile) return;
      const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm"];
      const audioExtension = pendingFile.name.split(".").pop()?.toLowerCase();
      const allowedExtension = ["mp3", "wav", "ogg", "webm"].includes(audioExtension);
      if ((!allowed.includes(pendingFile.type) && !allowedExtension) || pendingFile.size > MAX_AUDIO) {
        setSoundMessage(pendingFile.size > MAX_AUDIO ? "Choose an audio file smaller than 10 MB." : "Choose an MP3, WAV, OGG, or WebM audio file.");
        pendingFile = null;
        fileInput.value = "";
        return;
      }
      if (!document.querySelector("#newSoundName").value) document.querySelector("#newSoundName").value = pendingFile.name.replace(/\.[^.]+$/, "").slice(0, 48);
      pendingUrl = URL.createObjectURL(pendingFile);
      pendingPreview = new Audio(pendingUrl);
      pendingPreview.preload = "metadata";
      previewButton.disabled = saveButton.disabled = false;
      setSoundMessage("Audio loaded. Preview it, name it, then save.");
    };
    previewButton.onclick = () => {
      if (!pendingPreview) return;
      try {
        pendingPreview.pause();
        pendingPreview.currentTime = 0;
        pendingPreview.play()?.catch(() => setSoundMessage("This audio format could not be previewed by your browser."));
      } catch {
        setSoundMessage("This audio format could not be previewed by your browser.");
      }
    };
    saveButton.onclick = async () => {
      if (!pendingFile) return;
      const name = document.querySelector("#newSoundName").value.trim().slice(0, 48);
      if (!name) { setSoundMessage("Enter a name for this sound."); return; }
      saveButton.disabled = true;
      try {
        const id = crypto.randomUUID?.() || `sound-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const sound = { id, owner: state.owner, name, type: pendingFile.type, blob: pendingFile, volume: 0.7, createdAt: Date.now() };
        const audio = currentAudio();
        audio.activeId = id;
        audio.collection = [...new Set([...(audio.collection || []), id])];
        await saveSoundAndSettings(sound, audio);
        if (state.owner === sound.owner) state.sounds.push(sound);
        if (pendingUrl) URL.revokeObjectURL(pendingUrl);
        pendingFile = pendingUrl = pendingPreview = null;
        refreshSoundStudio();
        setSoundMessage("Sound saved in this browser profile.");
      } catch {
        saveButton.disabled = false;
        setSoundMessage("Sound could not be saved. Your existing sound library is unchanged.");
      }
    };
  }

  function handlesTypingAudio(event = "correct") {
    const audio = { ...emptyAudio(), ...(state.profile.audio || {}) };
    if (audio.mode === "presets") return false;
    if (audio.mode === "library") return ["correct", "incorrect", "backspace", "word"].includes(event) && bundledSounds.some((sound) => sound.id === audio.activeId);
    if (audio.mode === "every" || audio.mode === "cat") return state.sounds.some((sound) => sound.id === audio.activeId);
    if (audio.mode === "random" || audio.mode === "alternate") return ["correct", "incorrect", "backspace", "word"].includes(event) && (audio.collection || []).some((id) => state.sounds.some((sound) => sound.id === id));
    if (audio.mode === "special") return state.sounds.some((sound) => sound.id === audio.eventMap?.[event]);
    return false;
  }

  function playTypingEvent(event, masterVolume = 1, muted = false, priority = false) {
    if (muted || !handlesTypingAudio(event)) return;
    const audio = { ...emptyAudio(), ...(state.profile.audio || {}) };
    let id = "";
    if (audio.mode === "every") id = ["correct", "incorrect", "backspace", "word"].includes(event) ? audio.activeId : "";
    else if (audio.mode === "library") id = audio.activeId;
    else if (audio.mode === "cat") {
      if (event === "incorrect" && audio.catIncorrect && audio.catIncorrectId) id = audio.catIncorrectId;
      else if (event === "word" && audio.catWord && audio.catWordId) id = audio.catWordId;
      else if (["correct", "incorrect", "backspace", "word"].includes(event)) id = audio.activeId;
    } else if (audio.mode === "random" || audio.mode === "alternate") {
      const list = (audio.collection || []).filter((item) => state.sounds.some((sound) => sound.id === item));
      if (list.length) {
        if (audio.mode === "random") id = list[Math.floor(Math.random() * list.length)];
        else { id = list[rotation % list.length]; rotation++; }
      }
    } else if (audio.mode === "special") id = audio.eventMap?.[event] || "";
    if (!id) return;
    const now = performance.now();
    const isKeypress = ["correct", "incorrect", "backspace", "word"].includes(event);
    const wait = isKeypress ? 0 : Math.max(0, (Number(audio.cooldown) || 0) - (now - lastSoundAt));
    if (wait > 0) {
      if (priority && !priorityTimer) priorityTimer = window.setTimeout(() => { priorityTimer = 0; playTypingEvent(event, masterVolume, muted, false); }, wait);
      return;
    }
    const sound = state.sounds.find((item) => item.id === id) || bundledSounds.find((item) => item.id === id);
    if (!sound) return;
    lastSoundAt = now;
    previewBlob(sound.id, sound.blob || sound.src, (Number(masterVolume) || 0) * (sound.volume ?? 0.7));
  }

  async function loadOwner() {
    const nextOwner = ownerKey();
    if (nextOwner === state.owner && state.loaded) return;
    const loadSeq = ++ownerLoadSeq;
    window.clearTimeout(priorityTimer);
    priorityTimer = 0;
    state.owner = nextOwner;
    state.loaded = false;
    state.profile = { owner: nextOwner, avatarKind: "builtin", avatarId: "cat", audio: emptyAudio() };
    state.sounds = [];
    state.error = "";
    if (profileUrl) URL.revokeObjectURL(profileUrl);
    profileUrl = "";
    for (const url of soundUrls.values()) URL.revokeObjectURL(url);
    soundUrls = new Map();
    soundPlayers = new Map();
    try {
      const [profile, sounds] = await Promise.all([
        request("profiles", "readonly", (store) => store.get(nextOwner)),
        request("sounds", "readonly", (store) => store.getAll()),
      ]);
      if (loadSeq !== ownerLoadSeq) return;
      state.profile = { owner: nextOwner, avatarKind: "builtin", avatarId: "cat", audio: emptyAudio(), ...(profile || {}) };
      state.profile.audio = { ...emptyAudio(), ...(profile?.audio || {}) };
      state.sounds = sounds.filter((sound) => sound.owner === nextOwner);
      state.error = "";
    } catch {
      if (loadSeq !== ownerLoadSeq) return;
      state.profile = { owner: nextOwner, avatarKind: "builtin", avatarId: "cat", audio: emptyAudio() };
      state.sounds = [];
      state.error = "Personalization storage is unavailable in this browser.";
    }
    state.loaded = true;
    window.dispatchEvent(new Event("keystroke-personalization-changed"));
  }

  window.KEYSTROKE_PERSONALIZATION = {
    profileMarkup,
    bindProfileEditor,
    soundStudioMarkup,
    bindSoundStudio,
    handlesTypingAudio,
    playTypingEvent,
  };
  window.addEventListener("keystroke-auth-state", loadOwner);
  loadOwner();
})();
