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
      [
        "cartoon",
        "Cartoon face",
        "☻",
        "linear-gradient(135deg,#ffd56b,#ff8f9d)",
      ],
      ["gradient", "Abstract", "◒", "linear-gradient(135deg,#ff7cbd,#7c83ff)"],
      ["mono", "Monochrome", "◐", "linear-gradient(135deg,#333944,#8993a2)"],
      [
        "colorful",
        "Colorful",
        "✿",
        "linear-gradient(135deg,#55d6a0,#4c8dff 55%,#b48cff)",
      ],
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
  let pendingAudioType = "";
  let pendingAudioDuration = null;
  let draftProfile = null;
  let pendingUrl = "";
  let pendingPreview = null;
  let activeCategory = "Animals";
  let soundUrls = new Map();
  let soundPlayers = new Map();
  let playbackStopTimer = 0;
  let activeSoundId = "";
  let lastSoundAt = 0;
  let rotation = 0;
  let priorityTimer = 0;
  let ownerLoadSeq = 0;
  let bundledSounds = [];
  let bundledSoundsFailed = false;
  fetch("audio-manifest.json")
    .then((response) =>
      response.ok
        ? response.json()
        : Promise.reject(new Error("Audio manifest unavailable")),
    )
    .then((manifest) => {
      bundledSounds = Array.isArray(manifest.soundLibrary)
        ? manifest.soundLibrary
        : [];
      window.dispatchEvent(new Event("keystroke-audio-library-ready"));
    })
    .catch(() => {
      bundledSoundsFailed = true;
      window.dispatchEvent(new Event("keystroke-audio-library-ready"));
    });
  const state = {
    owner: "guest",
    profile: {
      owner: "guest",
      avatarKind: "builtin",
      avatarId: "cat",
      audio: emptyAudio(),
    },
    sounds: [],
    error: "",
  };

  function openDb() {
    if (!window.indexedDB)
      return Promise.reject(new Error("IndexedDB is unavailable"));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("profiles"))
          db.createObjectStore("profiles", { keyPath: "owner" });
        if (!db.objectStoreNames.contains("sounds"))
          db.createObjectStore("sounds", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          request.error ||
            new Error("Could not open local personalization storage"),
        );
    });
    return dbPromise;
  }

  async function request(storeName, mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const req = action(tx.objectStore(storeName));
      let value;
      req.onsuccess = () => {
        value = req.result;
      };
      req.onerror = () =>
        reject(req.error || new Error("Local storage request failed"));
      tx.oncomplete = () => resolve(value);
      tx.onerror = () =>
        reject(tx.error || new Error("Local storage transaction failed"));
      tx.onabort = () =>
        reject(
          tx.error || new Error("Local storage transaction was cancelled"),
        );
    });
  }

  const ownerKey = () => {
    const uid = window.KEYSTROKE_AUTH?.getState?.().user?.uid;
    return uid ? `user:${uid}` : "guest";
  };
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const avatarById = (id) =>
    Object.values(categories)
      .flat()
      .find((item) => item[0] === id) || categories.Animals[0];

  function avatarMarkup(profile = state.profile) {
    if (profile.avatarKind === "upload" && profile.avatarBlob) {
      if (!profileUrl) profileUrl = URL.createObjectURL(profile.avatarBlob);
      return `<span class="keystroke-avatar"><img src="${profileUrl}" alt="Selected custom avatar"></span>`;
    }
    const item = avatarById(profile.avatarId);
    return `<span class="keystroke-avatar" role="img" style="background:${item[3]}" aria-label="${esc(item[1])} avatar"><span aria-hidden="true">${item[2]}</span></span>`;
  }
  function accountAvatarMarkup() {
    return state.loaded && state.owner === ownerKey()
      ? avatarMarkup(state.profile)
      : `<span class="auth-avatar" aria-label="Profile avatar loading" aria-busy="true">…</span>`;
  }

  function galleryMarkup() {
    const profile = draftProfile || state.profile;
    const selected = profile.avatarKind === "builtin" ? profile.avatarId : "";
    return categories[activeCategory]
      .map(
        ([id, label, glyph, color]) =>
          `<button type="button" class="avatar-choice ${selected === id ? "selected" : ""}" data-avatar-id="${id}" aria-label="Choose ${label} avatar" aria-pressed="${selected === id}" style="--avatar-bg:${color}"><span aria-hidden="true">${glyph}</span><small>${label}</small></button>`,
      )
      .join("");
  }

  function profileMarkup() {
    return `<dialog id="profileEditorDialog" class="profile-dialog" aria-labelledby="profileEditorTitle"><div class="profile-dialog-head"><div><h2 id="profileEditorTitle">Edit Profile</h2><p class="hint">Your Google name and email stay unchanged.</p></div><button type="button" id="editProfileClose" aria-label="Close profile editor">×</button></div><div class="personal-profile-head"><div class="profile-avatar-preview">${avatarMarkup()}</div><div class="personal-profile-copy"><strong>Profile avatar</strong><p class="hint">Choose an avatar or upload a cropped image.</p></div></div><div class="avatar-editor"><div class="personal-tabs" role="tablist" aria-label="Avatar categories">${Object.keys(
      categories,
    )
      .map(
        (name, i) =>
          `<button type="button" role="tab" data-avatar-category="${name}" aria-selected="${i === 0}" class="${i === 0 ? "on" : ""}">${name}</button>`,
      )
      .join(
        "",
      )}</div><div id="avatarGallery" class="avatar-gallery">${galleryMarkup()}</div><div class="avatar-upload"><label class="avatar-upload-label">Upload an image<input id="avatarFile" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"></label><p class="hint">PNG, JPG, or WebP; up to 8 MB. Drag to position, then zoom and crop.</p><canvas id="avatarCrop" width="256" height="256" role="img" aria-label="Circular avatar crop preview"></canvas><label class="avatar-zoom">Zoom <input id="avatarZoom" type="range" min="1" max="3" step="0.05" value="1" aria-label="Avatar crop zoom"></label><button id="avatarReset" type="button">Reset crop</button></div><p class="hint" id="avatarMessage" role="status" aria-live="polite">${esc(state.error)}</p></div><div class="row profile-dialog-actions"><button id="avatarCancel" type="button">Cancel</button><button id="avatarSave" class="pri" type="button">Save Changes</button></div></dialog>`;
  }

  function drawCrop() {
    const canvas = document.querySelector("#avatarCrop");
    if (!canvas || !pendingImage) return;
    const ctx = canvas.getContext("2d");
    const w = pendingImage.bitmap.width,
      h = pendingImage.bitmap.height;
    const crop =
      Math.min(w, h) /
      (Number(document.querySelector("#avatarZoom")?.value) || 1);
    const maxX = Math.max(0, w - crop),
      maxY = Math.max(0, h - crop);
    pendingImage.x = Math.max(0, Math.min(maxX, pendingImage.x));
    pendingImage.y = Math.max(0, Math.min(maxY, pendingImage.y));
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(
      pendingImage.bitmap,
      pendingImage.x,
      pendingImage.y,
      crop,
      crop,
      0,
      0,
      SIZE,
      SIZE,
    );
  }
  function clearCrop() {
    const canvas = document.querySelector("#avatarCrop");
    canvas?.getContext("2d")?.clearRect(0, 0, SIZE, SIZE);
  }

  function drawGallery() {
    const gallery = document.querySelector("#avatarGallery");
    if (!gallery) return;
    gallery.innerHTML = galleryMarkup();
    gallery.querySelectorAll("[data-avatar-id]").forEach((button) => {
      button.onclick = () => {
        const id = button.dataset.avatarId;
        pendingImage?.bitmap.close?.();
        pendingImage = null;
        clearCrop();
        draftProfile = {
          ...state.profile,
          ...(draftProfile || {}),
          avatarKind: "builtin",
          avatarId: id,
          avatarBlob: null,
        };
        updateAvatarPreview();
        drawGallery();
        setProfileMessage("Avatar selected. Save Changes to keep it.");
      };
    });
  }

  function updateAvatarPreview() {
    document
      .querySelectorAll("#profileAvatarPreview, .profile-avatar-preview")
      .forEach((preview) => {
        preview.innerHTML = avatarMarkup(draftProfile || state.profile);
      });
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
    const dialog = document.querySelector("#profileEditorDialog");
    if (!dialog) return;
    dialog.oncancel = (event) => {
      event.preventDefault();
      cancelEditor();
    };
    const openButton = document.querySelector("#editProfileAvatar");
    if (openButton)
      openButton.disabled = !state.loaded || state.owner !== ownerKey();
    if (openButton)
      openButton.onclick = async () => {
        if (!state.loaded || state.owner !== ownerKey()) return;
        draftProfile = { ...state.profile };
        pendingImage?.bitmap.close?.();
        pendingImage = null;
        clearCrop();
        document.querySelector("#avatarSave").disabled = false;
        dialog.showModal();
        if (draftProfile.avatarKind === "upload" && draftProfile.avatarBlob) {
          try {
            const bitmap = await createImageBitmap(draftProfile.avatarBlob);
            pendingImage = {
              bitmap,
              x: Math.max(
                0,
                (bitmap.width - Math.min(bitmap.width, bitmap.height)) / 2,
              ),
              y: Math.max(
                0,
                (bitmap.height - Math.min(bitmap.width, bitmap.height)) / 2,
              ),
            };
            document.querySelector("#avatarZoom").value = "1";
            drawCrop();
          } catch {
            setProfileMessage("The saved avatar preview could not be opened.");
          }
        }
        drawGallery();
      };
    document.querySelector("#editProfileClose").onclick = () => cancelEditor();
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
      pendingImage?.bitmap.close?.();
      pendingImage = null;
      clearCrop();
      if (draftProfile?.avatarKind === "upload")
        draftProfile = { ...state.profile };
      const allowed = ["image/png", "image/jpeg", "image/webp"];
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (
        (!allowed.includes(file.type) &&
          !(
            file.type === "" &&
            ["png", "jpg", "jpeg", "webp"].includes(extension)
          )) ||
        file.size > MAX_IMAGE
      ) {
        setProfileMessage(
          file.size > MAX_IMAGE
            ? "Choose an image smaller than 8 MB."
            : "Choose a PNG, JPG, or WebP image.",
        );
        fileInput.value = "";
        return;
      }
      setProfileMessage("Loading image…");
      try {
        const bitmap = await createImageBitmap(file);
        pendingImage?.bitmap.close?.();
        pendingImage = {
          bitmap,
          file,
          x: Math.max(
            0,
            (bitmap.width - Math.min(bitmap.width, bitmap.height)) / 2,
          ),
          y: Math.max(
            0,
            (bitmap.height - Math.min(bitmap.width, bitmap.height)) / 2,
          ),
        };
        draftProfile = {
          ...state.profile,
          ...(draftProfile || {}),
          avatarKind: "upload",
          avatarId: "uploaded",
        };
        document.querySelector("#avatarZoom").value = "1";
        save.disabled = false;
        drawCrop();
        setProfileMessage("Drag the image to position it, then save.");
      } catch {
        pendingImage = null;
        clearCrop();
        if (draftProfile?.avatarKind === "upload")
          draftProfile = { ...state.profile };
        save.disabled = false;
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
      const crop =
        Math.min(pendingImage.bitmap.width, pendingImage.bitmap.height) /
        (Number(document.querySelector("#avatarZoom").value) || 1);
      pendingImage.x -= ((event.clientX - drag.x) * crop) / canvas.clientWidth;
      pendingImage.y -= ((event.clientY - drag.y) * crop) / canvas.clientHeight;
      drag = { x: event.clientX, y: event.clientY };
      drawCrop();
    };
    canvas.onpointerup = canvas.onpointercancel = () => {
      drag = null;
    };
    document.querySelector("#avatarReset").onclick = () => {
      if (!pendingImage) return;
      pendingImage.x = Math.max(
        0,
        (pendingImage.bitmap.width -
          Math.min(pendingImage.bitmap.width, pendingImage.bitmap.height)) /
          2,
      );
      pendingImage.y = Math.max(
        0,
        (pendingImage.bitmap.height -
          Math.min(pendingImage.bitmap.width, pendingImage.bitmap.height)) /
          2,
      );
      document.querySelector("#avatarZoom").value = "1";
      drawCrop();
    };
    function cancelEditor() {
      pendingImage?.bitmap.close?.();
      pendingImage = null;
      draftProfile = null;
      fileInput.value = "";
      dialog.close();
      updateAvatarPreview();
      setProfileMessage("");
    }
    document.querySelector("#avatarCancel").onclick = cancelEditor;
    save.onclick = async () => {
      if (!draftProfile) return;
      setProfileMessage("Saving profile…");
      save.disabled = true;
      try {
        let changes = {};
        if (draftProfile.avatarKind === "upload" && pendingImage) {
          const blob = await new Promise((resolve, reject) =>
            canvas.toBlob(
              (value) =>
                value
                  ? resolve(value)
                  : reject(new Error("Could not crop image")),
              "image/webp",
              0.88,
            ),
          );
          changes = {
            avatarKind: "upload",
            avatarId: "uploaded",
            avatarBlob: blob,
          };
        }
        await saveProfile({ ...draftProfile, ...changes });
        pendingImage?.bitmap.close?.();
        pendingImage = null;
        draftProfile = null;
        updateAvatarPreview();
        drawGallery();
        fileInput.value = "";
        dialog.close();
      } catch {
        save.disabled = false;
        setProfileMessage(
          "Profile could not be saved. Your previous avatar is unchanged.",
        );
      }
    };
  }

  function soundSelect(event, audio) {
    return `<label class="sound-assignment">${event[1]}<select data-sound-event="${event[0]}" aria-label="Sound for ${event[1]}"><option value="">No sound</option>${state.sounds.map((sound) => `<option value="${esc(sound.id)}" ${audio.eventMap?.[event[0]] === sound.id ? "selected" : ""}>${esc(sound.name)}</option>`).join("")}</select></label>`;
  }
  function soundCard(sound, audio) {
    const active = audio.activeId === sound.id;
    const chosen = (audio.collection || []).includes(sound.id);
    const duration = Number.isFinite(sound.duration)
      ? `${sound.duration.toFixed(1)} sec`
      : "Duration unavailable";
    return `<article class="sound-card ${active ? "sel" : ""}"><div class="sound-card-head"><div><strong>${esc(sound.name)}</strong><small>${esc(sound.fileName || sound.name)} · ${Math.max(1, Math.round(sound.blob.size / 1024))} KB · ${duration}</small></div><button type="button" data-play-custom="${esc(sound.id)}">Preview</button></div><div class="sound-card-controls"><button type="button" data-active-custom="${esc(sound.id)}" aria-pressed="${active}">${active ? "Deselect" : "Select for typing"}</button><label><input type="checkbox" data-custom-collection="${esc(sound.id)}" ${chosen ? "checked" : ""}> Include in rotation</label><label>Volume <input type="range" min="0" max="1" step=".05" value="${sound.volume ?? 0.7}" data-custom-volume="${esc(sound.id)}" aria-label="Volume for ${esc(sound.name)}"></label><button type="button" data-delete-custom="${esc(sound.id)}">Delete</button></div></article>`;
  }
  function soundStudioMarkup() {
    const audio = { ...emptyAudio(), ...(state.profile.audio || {}) };
    const hasSounds = state.sounds.length > 0;
    return `<section class="personal-card custom-sound-studio" aria-label="My Sounds"><h2>My Sounds</h2><p class="hint">Uploaded sounds stay in this browser profile. They do not replace the built-in keyboard presets.</p><div class="set"><label for="customSoundMode">Typing sound mode</label><select id="customSoundMode"><option value="presets" ${audio.mode === "presets" ? "selected" : ""}>Existing keyboard presets</option><option value="library" ${audio.mode === "library" ? "selected" : ""}>Unverified bundled clip</option><option value="every" ${audio.mode === "every" ? "selected" : ""}>Every Keystroke</option><option value="random" ${audio.mode === "random" ? "selected" : ""}>Random Rotation</option><option value="alternate" ${audio.mode === "alternate" ? "selected" : ""}>Alternating Sounds</option><option value="special" ${audio.mode === "special" ? "selected" : ""}>Special Events</option><option value="cat" ${audio.mode === "cat" ? "selected" : ""}>Cat Mode — use your own meow</option></select></div><div class="set"><label for="soundCooldown">Sound cooldown</label><input id="soundCooldown" type="range" min="0" max="1000" step="25" value="${audio.cooldown ?? 80}" aria-label="Sound cooldown in milliseconds"><output id="soundCooldownValue">${audio.cooldown ?? 80} ms</output></div>${bundledSoundMarkup(audio)}<div id="customSoundAssignments" ${audio.mode === "special" ? "" : "hidden"}><h3>Assign sounds to events</h3><div class="sound-assignments">${events.map((event) => soundSelect(event, audio)).join("")}</div></div><div id="catSoundOptions" ${audio.mode === "cat" ? "" : "hidden"}><p class="hint">Select any uploaded sound as the meow. No sample is bundled.</p><label><input type="checkbox" id="catIncorrect" ${audio.catIncorrect ? "checked" : ""}> Use a different sound for incorrect keys</label><select id="catIncorrectSound" aria-label="Cat Mode incorrect sound"><option value="">Choose an incorrect sound</option>${state.sounds.map((sound) => `<option value="${esc(sound.id)}" ${audio.catIncorrectId === sound.id ? "selected" : ""}>${esc(sound.name)}</option>`).join("")}</select><label><input type="checkbox" id="catWord" ${audio.catWord ? "checked" : ""}> Play an optional word-complete sound</label><select id="catWordSound" aria-label="Cat Mode word-complete sound"><option value="">Choose a word sound</option>${state.sounds.map((sound) => `<option value="${esc(sound.id)}" ${audio.catWordId === sound.id ? "selected" : ""}>${esc(sound.name)}</option>`).join("")}</select></div><div class="sound-upload"><label>Sound name<input id="newSoundName" type="text" maxlength="48" placeholder="Name your sound"></label><label class="avatar-upload-label">Upload audio<input id="customSoundFile" type="file" accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/webm"></label><div class="row"><button type="button" id="previewNewSound" disabled>Preview upload</button><button type="button" id="saveNewSound" class="pri" disabled>Add to Sound Library</button></div><p class="hint" id="customSoundMessage" role="status" aria-live="polite">${hasSounds ? "" : "No custom sounds yet. Upload an audio file to get started."}</p></div><div id="customSoundList" class="sound-library">${state.sounds.map((sound) => soundCard(sound, audio)).join("")}</div></section>`;
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
      tx.onerror = () =>
        reject(tx.error || new Error("Could not delete sound"));
      tx.onabort = () =>
        reject(tx.error || new Error("Could not delete sound"));
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
    window.clearTimeout(playbackStopTimer);
    if (pendingPreview && id !== "pending-upload") {
      try {
        pendingPreview.pause();
        pendingPreview.currentTime = 0;
      } catch {}
    }
    for (const [otherId, other] of soundPlayers) {
      other.pause();
      try {
        other.currentTime = 0;
      } catch {}
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
      activeSoundId = id;
      const playback = player.play();
      playback?.catch(onError);
      playbackStopTimer = window.setTimeout(() => {
        if (activeSoundId !== id) return;
        try {
          player.pause();
          player.currentTime = 0;
        } catch {}
        activeSoundId = "";
        playbackStopTimer = 0;
      }, 2000);
    } catch {
      activeSoundId = "";
      onError();
    }
    player.onended = () => {
      if (activeSoundId !== id) return;
      activeSoundId = "";
      window.clearTimeout(playbackStopTimer);
      playbackStopTimer = 0;
    };
  }

  function bundledSoundMarkup(audio) {
    if (!bundledSounds.length)
      return bundledSoundsFailed
        ? `<p class="hint" role="status">The bundled audio catalog could not be loaded.</p>`
        : "";
    return `<section class="bundled-sounds" aria-label="Bundled audio clips"><h3>Unverified clips</h3><p class="hint">These local MP3 files have not been listened to or identified. Preview each clip before selecting it. A selected clip restarts from the beginning on every eligible keypress.</p><div class="bundled-sound-grid">${bundledSounds
      .map((sound) => {
        const active = audio.mode === "library" && audio.activeId === sound.id;
        return `<article class="sound-card ${active ? "sel" : ""}"><div class="sound-card-head"><div><strong>${esc(sound.displayName)}</strong><small>${esc(sound.category)} · ${Number(sound.durationSeconds).toFixed(1)} sec</small></div></div><div class="sound-card-controls"><button type="button" data-preview-bundled="${esc(sound.id)}">Play preview</button><button type="button" data-stop-bundled="${esc(sound.id)}">Stop preview</button><button type="button" class="${active ? "on" : ""}" aria-pressed="${active}" data-select-bundled="${esc(sound.id)}">${active ? "Deselect" : "Use for typing"}</button></div></article>`;
      })
      .join("")}</div></section>`;
  }

  function bindSoundStudio() {
    const mode = document.querySelector("#customSoundMode");
    if (!mode) return;
    const currentAudio = () => ({
      ...emptyAudio(),
      ...(state.profile.audio || {}),
    });
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
      document.querySelector("#soundCooldownValue").textContent =
        `${cooldown.value} ms`;
    };
    cooldown.onchange = () => persist({ cooldown: Number(cooldown.value) });
    document.querySelectorAll("[data-sound-event]").forEach((select) => {
      select.onchange = () =>
        persist({
          eventMap: {
            ...currentAudio().eventMap,
            [select.dataset.soundEvent]: select.value,
          },
        });
    });
    const catIncorrect = document.querySelector("#catIncorrect");
    if (catIncorrect)
      catIncorrect.onchange = () =>
        persist({ catIncorrect: catIncorrect.checked });
    const catWord = document.querySelector("#catWord");
    if (catWord) catWord.onchange = () => persist({ catWord: catWord.checked });
    const catErrorSound = document.querySelector("#catIncorrectSound");
    if (catErrorSound)
      catErrorSound.onchange = () =>
        persist({ catIncorrectId: catErrorSound.value });
    const catWordSound = document.querySelector("#catWordSound");
    if (catWordSound)
      catWordSound.onchange = () => persist({ catWordId: catWordSound.value });

    document.querySelectorAll("[data-play-custom]").forEach((button) => {
      button.onclick = () => {
        const sound = state.sounds.find(
          (item) => item.id === button.dataset.playCustom,
        );
        if (sound) previewBlob(sound.id, sound.blob, sound.volume ?? 0.7);
      };
    });
    document.querySelectorAll("[data-preview-bundled]").forEach((button) => {
      button.onclick = () => {
        const sound = bundledSounds.find(
          (item) => item.id === button.dataset.previewBundled,
        );
        if (sound)
          previewBlob(sound.id, sound.src, 0.7, () =>
            setSoundMessage("This MP3 could not be played by this browser."),
          );
      };
    });
    document.querySelectorAll("[data-stop-bundled]").forEach((button) => {
      button.onclick = () => {
        const player = soundPlayers.get(button.dataset.stopBundled);
        if (!player) return;
        if (activeSoundId === button.dataset.stopBundled) {
          window.clearTimeout(playbackStopTimer);
          activeSoundId = "";
        }
        try {
          player.pause();
          player.currentTime = 0;
        } catch {}
      };
    });
    document.querySelectorAll("[data-select-bundled]").forEach((button) => {
      button.onclick = async () => {
        const sound = bundledSounds.find(
          (item) => item.id === button.dataset.selectBundled,
        );
        if (!sound) return;
        const deselect =
          currentAudio().mode === "library" &&
          currentAudio().activeId === sound.id;
        if (
          !(await persist({
            mode: "library",
            activeId: deselect ? "" : sound.id,
          }))
        )
          return refreshSoundStudio();
        refreshSoundStudio();
      };
    });
    document.querySelectorAll("[data-active-custom]").forEach((button) => {
      button.onclick = async () => {
        const deselect =
          currentAudio().activeId === button.dataset.activeCustom;
        if (
          !(await persist({
            mode: deselect ? "presets" : "every",
            activeId: deselect ? "" : button.dataset.activeCustom,
          }))
        )
          return refreshSoundStudio();
        refreshSoundStudio();
      };
    });
    document
      .querySelectorAll("[data-custom-collection]")
      .forEach((checkbox) => {
        checkbox.onchange = () => {
          const collection = new Set(currentAudio().collection || []);
          if (checkbox.checked)
            collection.add(checkbox.dataset.customCollection);
          else collection.delete(checkbox.dataset.customCollection);
          persist({ collection: [...collection] });
        };
      });
    document.querySelectorAll("[data-custom-volume]").forEach((range) => {
      range.onchange = async () => {
        const sound = state.sounds.find(
          (item) => item.id === range.dataset.customVolume,
        );
        if (!sound) return;
        sound.volume = Number(range.value);
        try {
          await request("sounds", "readwrite", (store) => store.put(sound));
        } catch {
          setSoundMessage("Could not save the sound volume.");
        }
      };
    });
    document.querySelectorAll("[data-delete-custom]").forEach((button) => {
      button.onclick = async () => {
        const id = button.dataset.deleteCustom;
        if (!window.confirm("Delete this uploaded sound?")) return;
        try {
          const audio = currentAudio();
          audio.collection = audio.collection.filter(
            (soundId) => soundId !== id,
          );
          if (audio.activeId === id) audio.activeId = "";
          for (const event of Object.keys(audio.eventMap))
            if (audio.eventMap[event] === id) delete audio.eventMap[event];
          if (audio.catIncorrectId === id) audio.catIncorrectId = "";
          if (audio.catWordId === id) audio.catWordId = "";
          await deleteSoundAndSettings(id, audio);
          const player = soundPlayers.get(id);
          if (player) {
            player.pause();
            try {
              player.currentTime = 0;
            } catch {}
          }
          if (activeSoundId === id) {
            window.clearTimeout(playbackStopTimer);
            activeSoundId = "";
          }
          state.sounds = state.sounds.filter((sound) => sound.id !== id);
          if (soundUrls.has(id)) URL.revokeObjectURL(soundUrls.get(id));
          soundUrls.delete(id);
          soundPlayers.delete(id);
          refreshSoundStudio();
        } catch {
          setSoundMessage("Could not delete this sound.");
        }
      };
    });

    const fileInput = document.querySelector("#customSoundFile");
    const previewButton = document.querySelector("#previewNewSound");
    const saveButton = document.querySelector("#saveNewSound");
    fileInput.onchange = () => {
      if (pendingPreview) {
        pendingPreview.pause();
        try {
          pendingPreview.currentTime = 0;
        } catch {}
      }
      if (activeSoundId === "pending-upload") {
        window.clearTimeout(playbackStopTimer);
        activeSoundId = "";
      }
      pendingFile = fileInput.files?.[0] || null;
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
      pendingUrl = "";
      pendingPreview = null;
      pendingAudioType = "";
      pendingAudioDuration = null;
      previewButton.disabled = saveButton.disabled = true;
      if (!pendingFile) return;
      const audioExtension = pendingFile.name.split(".").pop()?.toLowerCase();
      const formats = {
        mp3: ["audio/mpeg", "audio/mp3"],
        wav: ["audio/wav", "audio/x-wav"],
        ogg: ["audio/ogg"],
        webm: ["audio/webm"],
      };
      pendingAudioType = formats[audioExtension]?.find((type) => {
        const probe = document.createElement("audio");
        return probe.canPlayType(type) !== "";
      });
      if (!pendingAudioType || pendingFile.size > MAX_AUDIO) {
        setSoundMessage(
          pendingFile.size > MAX_AUDIO
            ? "Choose an audio file smaller than 10 MB."
            : "Choose an MP3, WAV, OGG, or WebM audio file.",
        );
        pendingFile = null;
        fileInput.value = "";
        return;
      }
      if (!document.querySelector("#newSoundName").value)
        document.querySelector("#newSoundName").value = pendingFile.name
          .replace(/\.[^.]+$/, "")
          .slice(0, 48);
      pendingUrl = URL.createObjectURL(pendingFile);
      pendingPreview = new Audio(pendingUrl);
      pendingPreview.preload = "metadata";
      pendingPreview.onloadedmetadata = () => {
        if (Number.isFinite(pendingPreview.duration))
          pendingAudioDuration = pendingPreview.duration;
        setSoundMessage(
          `Audio ready · ${Number.isFinite(pendingPreview.duration) ? `${pendingPreview.duration.toFixed(1)} sec` : "duration unavailable"}. Preview it, then add it to your library.`,
        );
      };
      previewButton.disabled = saveButton.disabled = false;
      setSoundMessage(
        "Audio loaded. Preview it, name it, then add it to your library.",
      );
    };
    previewButton.onclick = () => {
      if (!pendingPreview) return;
      try {
        window.clearTimeout(playbackStopTimer);
        for (const player of soundPlayers.values()) {
          player.pause();
          try {
            player.currentTime = 0;
          } catch {}
        }
        pendingPreview.pause();
        pendingPreview.currentTime = 0;
        activeSoundId = "pending-upload";
        pendingPreview
          .play()
          ?.catch(() =>
            setSoundMessage(
              "This audio format could not be previewed by your browser.",
            ),
          );
        playbackStopTimer = window.setTimeout(() => {
          if (activeSoundId !== "pending-upload") return;
          try {
            pendingPreview?.pause();
            if (pendingPreview) pendingPreview.currentTime = 0;
          } catch {}
          activeSoundId = "";
          playbackStopTimer = 0;
        }, 2000);
        pendingPreview.onended = () => {
          if (activeSoundId === "pending-upload") activeSoundId = "";
          window.clearTimeout(playbackStopTimer);
          playbackStopTimer = 0;
        };
      } catch {
        setSoundMessage(
          "This audio format could not be previewed by your browser.",
        );
      }
    };
    saveButton.onclick = async () => {
      if (!pendingFile) return;
      const name = document
        .querySelector("#newSoundName")
        .value.trim()
        .slice(0, 48);
      if (!name) {
        setSoundMessage("Enter a name for this sound.");
        return;
      }
      saveButton.disabled = true;
      try {
        if (!Number.isFinite(pendingAudioDuration) && pendingPreview) {
          pendingAudioDuration = await new Promise((resolve, reject) => {
            const timer = window.setTimeout(
              () => reject(new Error("Audio metadata timed out")),
              5000,
            );
            pendingPreview.addEventListener(
              "loadedmetadata",
              () => {
                window.clearTimeout(timer);
                Number.isFinite(pendingPreview.duration)
                  ? resolve(pendingPreview.duration)
                  : reject(new Error("Audio duration unavailable"));
              },
              { once: true },
            );
            pendingPreview.addEventListener(
              "error",
              () => {
                window.clearTimeout(timer);
                reject(new Error("Audio could not be read"));
              },
              { once: true },
            );
            pendingPreview.load();
          });
        }
        if (!Number.isFinite(pendingAudioDuration))
          throw new Error("Audio duration unavailable");
        const id =
          crypto.randomUUID?.() ||
          `sound-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const sound = {
          id,
          owner: state.owner,
          name,
          fileName: pendingFile.name,
          type: pendingFile.type || pendingAudioType,
          duration: pendingAudioDuration,
          blob: pendingFile,
          volume: 0.7,
          createdAt: Date.now(),
        };
        const audio = currentAudio();
        await saveSoundAndSettings(sound, audio);
        if (state.owner === sound.owner) state.sounds.push(sound);
        if (pendingPreview) {
          pendingPreview.pause();
          try {
            pendingPreview.currentTime = 0;
          } catch {}
        }
        if (activeSoundId === "pending-upload") {
          window.clearTimeout(playbackStopTimer);
          activeSoundId = "";
        }
        if (pendingUrl) URL.revokeObjectURL(pendingUrl);
        pendingFile = pendingUrl = pendingPreview = null;
        pendingAudioType = "";
        pendingAudioDuration = null;
        refreshSoundStudio();
        setSoundMessage("Sound saved in this browser profile.");
      } catch (error) {
        saveButton.disabled = false;
        setSoundMessage(
          error?.message?.startsWith("Audio")
            ? "The browser could not read this audio file or its duration. Try another supported file."
            : "Sound could not be saved. Your existing sound library is unchanged.",
        );
      }
    };
  }

  function handlesTypingAudio(event = "correct") {
    const audio = { ...emptyAudio(), ...(state.profile.audio || {}) };
    if (audio.mode === "presets") return false;
    if (audio.mode === "library")
      return (
        ["correct", "incorrect", "backspace", "word"].includes(event) &&
        bundledSounds.some((sound) => sound.id === audio.activeId)
      );
    if (audio.mode === "every" || audio.mode === "cat")
      return state.sounds.some((sound) => sound.id === audio.activeId);
    if (audio.mode === "random" || audio.mode === "alternate")
      return (
        ["correct", "incorrect", "backspace", "word"].includes(event) &&
        (audio.collection || []).some((id) =>
          state.sounds.some((sound) => sound.id === id),
        )
      );
    if (audio.mode === "special")
      return state.sounds.some((sound) => sound.id === audio.eventMap?.[event]);
    return false;
  }

  function playTypingEvent(
    event,
    masterVolume = 1,
    muted = false,
    priority = false,
  ) {
    if (muted || !handlesTypingAudio(event)) return;
    const audio = { ...emptyAudio(), ...(state.profile.audio || {}) };
    let id = "";
    if (audio.mode === "every")
      id = ["correct", "incorrect", "backspace", "word"].includes(event)
        ? audio.activeId
        : "";
    else if (audio.mode === "library") id = audio.activeId;
    else if (audio.mode === "cat") {
      if (event === "incorrect" && audio.catIncorrect && audio.catIncorrectId)
        id = audio.catIncorrectId;
      else if (event === "word" && audio.catWord && audio.catWordId)
        id = audio.catWordId;
      else if (["correct", "incorrect", "backspace", "word"].includes(event))
        id = audio.activeId;
    } else if (audio.mode === "random" || audio.mode === "alternate") {
      const list = (audio.collection || []).filter((item) =>
        state.sounds.some((sound) => sound.id === item),
      );
      if (list.length) {
        if (audio.mode === "random")
          id = list[Math.floor(Math.random() * list.length)];
        else {
          id = list[rotation % list.length];
          rotation++;
        }
      }
    } else if (audio.mode === "special") id = audio.eventMap?.[event] || "";
    if (!id) return;
    const now = performance.now();
    const isKeypress = ["correct", "incorrect", "backspace", "word"].includes(
      event,
    );
    const wait = isKeypress
      ? 0
      : Math.max(0, (Number(audio.cooldown) || 0) - (now - lastSoundAt));
    if (wait > 0) {
      if (priority && !priorityTimer)
        priorityTimer = window.setTimeout(() => {
          priorityTimer = 0;
          playTypingEvent(event, masterVolume, muted, false);
        }, wait);
      return;
    }
    const sound =
      state.sounds.find((item) => item.id === id) ||
      bundledSounds.find((item) => item.id === id);
    if (!sound) return;
    lastSoundAt = now;
    previewBlob(
      sound.id,
      sound.blob || sound.src,
      (Number(masterVolume) || 0) * (sound.volume ?? 0.7),
    );
  }

  async function loadOwner() {
    const nextOwner = ownerKey();
    if (nextOwner === state.owner && state.loaded) return;
    const loadSeq = ++ownerLoadSeq;
    window.clearTimeout(priorityTimer);
    priorityTimer = 0;
    window.clearTimeout(playbackStopTimer);
    pendingPreview?.pause?.();
    for (const player of soundPlayers.values()) player.pause();
    activeSoundId = "";
    state.owner = nextOwner;
    state.loaded = false;
    state.profile = {
      owner: nextOwner,
      avatarKind: "builtin",
      avatarId: "cat",
      audio: emptyAudio(),
    };
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
      state.profile = {
        owner: nextOwner,
        avatarKind: "builtin",
        avatarId: "cat",
        audio: emptyAudio(),
        ...(profile || {}),
      };
      state.profile.audio = { ...emptyAudio(), ...(profile?.audio || {}) };
      state.sounds = sounds.filter((sound) => sound.owner === nextOwner);
      state.error = "";
    } catch {
      if (loadSeq !== ownerLoadSeq) return;
      state.profile = {
        owner: nextOwner,
        avatarKind: "builtin",
        avatarId: "cat",
        audio: emptyAudio(),
      };
      state.sounds = [];
      state.error = "Personalization storage is unavailable in this browser.";
    }
    state.loaded = true;
    window.dispatchEvent(new Event("keystroke-personalization-changed"));
  }

  window.KEYSTROKE_PERSONALIZATION = {
    profileMarkup,
    avatarMarkup: accountAvatarMarkup,
    profileReady: () => state.loaded && state.owner === ownerKey(),
    bindProfileEditor,
    soundStudioMarkup,
    bindSoundStudio,
    handlesTypingAudio,
    playTypingEvent,
  };
  window.addEventListener("keystroke-auth-state", loadOwner);
  loadOwner();
})();
