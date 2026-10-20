const state = {
  status: "loading",
  user: null,
  message: "Loading Firebase sign-in…",
  canSignIn: false,
};
let auth = null;
let unsubscribe = null;

function publish() {
  window.dispatchEvent(new Event("keystroke-auth-state"));
}

function authError(error) {
  const code = error?.code || "";
  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  ) {
    state.status = "signed-out";
    state.message = "Google sign-in was cancelled.";
  } else {
    state.status = "error";
    state.message =
      code === "auth/popup-blocked"
        ? "Your browser blocked the sign-in popup. Allow pop-ups for this site and try again."
        : code === "auth/unauthorized-domain"
          ? "This site is not authorized in Firebase Authentication. Add its domain in Firebase Console."
          : code === "auth/network-request-failed"
            ? "A network error interrupted sign-in. Check your connection and try again."
            : "Google sign-in failed. Please try again.";
  }
  publish();
}

const api = {
  getState: () => ({ ...state }),
  async signIn() {
    if (!auth || !api.provider || state.status === "signing-in") return;
    state.status = "signing-in";
    state.message = "Connecting to Google…";
    publish();
    try {
      await api.signInWithPopup(auth, api.provider);
    } catch (error) {
      authError(error);
    }
  },
  async signOut() {
    if (!auth) return;
    state.status = "signing-out";
    state.message = "Signing out…";
    publish();
    try {
      await api.firebaseSignOut(auth);
    } catch (error) {
      authError(error);
    }
  },
};
window.KEYSTROKE_AUTH = api;

async function initializeAuth() {
  let config;
  try {
    ({ default: config } = await import("./firebase-config.js"));
  } catch {
    state.status = "unavailable";
    state.message =
      "Firebase is not configured. Copy firebase-config.example.js to firebase-config.js and add your web app values.";
    publish();
    return;
  }
  if (
    !config?.apiKey ||
    !config?.authDomain ||
    !config?.projectId ||
    !config?.appId
  ) {
    state.status = "unavailable";
    state.message =
      "Firebase configuration is incomplete. Add apiKey, authDomain, projectId, and appId to firebase-config.js.";
    publish();
    return;
  }

  try {
    const [appSdk, authSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js"),
    ]);
    const app = appSdk.getApps().length
      ? appSdk.getApp()
      : appSdk.initializeApp(config);
    auth = authSdk.getAuth(app);
    api.provider = new authSdk.GoogleAuthProvider();
    api.signInWithPopup = authSdk.signInWithPopup;
    api.firebaseSignOut = authSdk.signOut;
    state.canSignIn = true;
    await authSdk.setPersistence(auth, authSdk.browserLocalPersistence);
    unsubscribe?.();
    unsubscribe = authSdk.onAuthStateChanged(
      auth,
      (user) => {
        state.user = user;
        state.status = user ? "signed-in" : "signed-out";
        state.message = user
          ? "Signed in with Google."
          : "Your local profile stays available as a guest.";
        publish();
      },
      authError,
    );
  } catch (error) {
    if (error?.code === "auth/unauthorized-domain") {
      authError(error);
      return;
    }
    state.status = "error";
    state.message =
      "Firebase could not start. Check your configuration and network connection.";
    publish();
  }
}

initializeAuth();
