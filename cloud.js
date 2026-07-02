/* ============================================================================
   cloud.js — Optional Firebase Auth + Firestore sync layer.
   ----------------------------------------------------------------------------
   Everything in this file degrades gracefully:
   - If firebase-config.js still has placeholder values, or the Firebase SDK
     failed to load (e.g. offline / GitHub Pages blocked), cloudAvailable()
     returns false and the app just runs on localStorage, same as before.
   - This file only ever reads/writes `S` and calls `save()`/`goTo()`/`toast()`
     etc. from app.js — those are global functions, safe to call here as long
     as this script runs (script tags execute in order) before they're needed,
     which they are, since nothing here fires until a user clicks something
     or app.js's init() calls initCloudSync().
   Firestore doc layout: users/{uid}/summerData/state -> { state, lastModified, updatedAt }
   ============================================================================ */

const CloudSync = {
  enabled: false,      // true once Firebase SDK initialized successfully
  user: null,           // Firebase auth user object, or null
  status: "local-only",// local-only | signed-out | syncing | synced | conflict | error
  lastSyncedAt: null,
  _pushTimer: null,
  _db: null,
  _auth: null
};

function cloudAvailable() {
  return typeof firebase !== "undefined" &&
    typeof FIREBASE_CONFIG !== "undefined" &&
    FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith("YOUR_");
}

function initCloudSync() {
  if (!cloudAvailable()) { CloudSync.status = "local-only"; renderSyncBadge(); return; }
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    CloudSync._auth = firebase.auth();
    CloudSync._db = firebase.firestore();
    CloudSync._db.enablePersistence({ synchronizeTabs: true }).catch(() => { /* multiple tabs open, fine */ });
    CloudSync.enabled = true;
    CloudSync._auth.onAuthStateChanged(onAuthChange);
    window.addEventListener("online", () => { if (CloudSync.user) checkAndSync(); });
    window.addEventListener("focus", () => { if (CloudSync.user && Date.now() - (CloudSync.lastSyncedAt || 0) > 15000) checkAndSync(); });
  } catch (e) {
    console.warn("Firebase init failed:", e);
    CloudSync.status = "error";
  }
  renderSyncBadge();
}

function onAuthChange(user) {
  CloudSync.user = user;
  if (user) { CloudSync.status = "syncing"; renderSyncBadge(); checkAndSync(); }
  else { CloudSync.status = "signed-out"; renderSyncBadge(); }
  if (typeof currentPage !== "undefined" && currentPage === "settings") goTo("settings");
}

function signInGoogle() {
  if (!CloudSync.enabled) { toast("Cloud sync isn't configured yet — see README.md.", "warn"); return; }
  const provider = new firebase.auth.GoogleAuthProvider();
  CloudSync._auth.signInWithPopup(provider).catch(err => toast("Sign-in failed: " + err.message, "warn"));
}
function signOutCloud() {
  if (CloudSync._auth) CloudSync._auth.signOut();
}

function userDocRef() {
  return CloudSync._db.collection("users").doc(CloudSync.user.uid).collection("summerData").doc("state");
}

async function pullCloudDoc() {
  const snap = await userDocRef().get();
  return snap.exists ? snap.data() : null;
}

async function pushLocalToCloud() {
  if (!CloudSync.user) return;
  CloudSync.status = "syncing"; renderSyncBadge();
  try {
    await userDocRef().set({
      state: S,
      lastModified: S.meta.lastModified,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    CloudSync.status = "synced"; CloudSync.lastSyncedAt = Date.now();
  } catch (e) {
    CloudSync.status = "error"; toast("Cloud sync failed: " + e.message, "warn");
  }
  renderSyncBadge();
}

// Pulls the cloud doc and decides: adopt it, push local, or ask the user (conflict).
async function checkAndSync() {
  if (!CloudSync.user) return;
  CloudSync.status = "syncing"; renderSyncBadge();
  try {
    const cloud = await pullCloudDoc();
    if (!cloud) { await pushLocalToCloud(); toast("Cloud backup created for this account."); return; }
    const cloudTime = cloud.lastModified || 0;
    const localTime = S.meta.lastModified || 0;
    if (Math.abs(cloudTime - localTime) < 2000 || localTime === 0) {
      // Same edit, or this device has never been used yet (nothing local to lose) — adopt cloud silently.
      applyCloudState(cloud.state);
      CloudSync.status = "synced"; CloudSync.lastSyncedAt = Date.now(); renderSyncBadge();
      return;
    }
    showConflictModal(cloud, localTime, cloudTime);
  } catch (e) {
    CloudSync.status = "error"; renderSyncBadge();
    toast("Couldn't reach the cloud — staying on local data for now.", "warn");
  }
}

function showConflictModal(cloud, localTime, cloudTime) {
  CloudSync.status = "conflict"; renderSyncBadge();
  const localWhen = localTime ? new Date(localTime).toLocaleString() : "never saved on this device";
  const cloudWhen = cloudTime ? new Date(cloudTime).toLocaleString() : "unknown";
  openModal("Sync conflict — pick a version", `
    <p>This device's data and your cloud data don't match (probably because you made progress on two devices). Pick which one to keep — the other will be overwritten.</p>
    <div class="rule-box"><b>📱 This device:</b> Level ${S.meta.level}, ${S.meta.xp} XP<br><span class="muted">Last saved: ${esc(localWhen)}</span></div>
    <div class="rule-box"><b>☁️ Cloud:</b> Level ${cloud.state?.meta?.level ?? "?"}, ${cloud.state?.meta?.xp ?? "?"} XP<br><span class="muted">Last saved: ${esc(cloudWhen)}</span></div>
    <div class="hero-actions">
      <button class="btn btn-primary" id="conflict-cloud">Use Cloud</button>
      <button class="btn" id="conflict-local">Use This Device</button>
      <button class="btn" id="conflict-cancel">Decide Later</button>
    </div>`, () => {
    $("#conflict-cloud").onclick = () => {
      applyCloudState(cloud.state); CloudSync.status = "synced"; CloudSync.lastSyncedAt = Date.now();
      closeModal(); renderSyncBadge(); toast("Loaded cloud data onto this device.");
    };
    $("#conflict-local").onclick = () => {
      pushLocalToCloud().then(() => { closeModal(); toast("Uploaded this device's data to the cloud."); });
    };
    $("#conflict-cancel").onclick = () => { CloudSync.status = "conflict"; renderSyncBadge(); closeModal(); };
  });
}

function applyCloudState(cloudState) {
  if (!cloudState) return;
  S = deepMerge(buildDefaultState(), cloudState);
  save(true); // sync write: don't re-bump timestamp or re-push, we just received this from the cloud
  applyTheme(); refreshHeader();
  if (typeof currentPage !== "undefined") goTo(currentPage);
}

// Called from app.js's save() after every real local change. Debounced so rapid
// edits (typing, checkbox spam) don't hammer Firestore with writes.
function scheduleCloudPush() {
  if (!CloudSync.enabled || !CloudSync.user) return;
  clearTimeout(CloudSync._pushTimer);
  CloudSync.status = "syncing"; renderSyncBadge();
  CloudSync._pushTimer = setTimeout(() => pushLocalToCloud(), 2500);
}

function manualSync() {
  if (!CloudSync.enabled) { toast("Cloud sync isn't configured — see README.md.", "warn"); return; }
  if (!CloudSync.user) { toast("Sign in first to sync.", "warn"); return; }
  checkAndSync();
}

function syncStatusLabel() {
  const labels = {
    "local-only": "💾 Local only",
    "signed-out": "☁️ Signed out",
    "syncing": "🔄 Syncing…",
    "synced": "☁️ Synced" + (CloudSync.lastSyncedAt ? " · " + new Date(CloudSync.lastSyncedAt).toLocaleTimeString() : ""),
    "conflict": "⚠️ Conflict — resolve in Settings",
    "error": "⚠️ Sync error"
  };
  return labels[CloudSync.status] || "";
}
function renderSyncBadge() {
  const el = document.getElementById("sync-badge");
  if (!el) return;
  el.textContent = syncStatusLabel();
  el.className = "sync-badge sync-" + CloudSync.status;
  const settingsEl = document.getElementById("sync-badge-settings");
  if (settingsEl) { settingsEl.textContent = syncStatusLabel(); settingsEl.className = "sync-badge sync-" + CloudSync.status; }
}
