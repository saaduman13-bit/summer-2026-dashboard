/* ============================================================================
   pwa.js — service worker registration, install prompt, and safe update flow.
   ----------------------------------------------------------------------------
   Self-initializing (registerServiceWorker() runs immediately at the bottom
   of this file) since none of this depends on app state — unlike cloud.js/
   gamefeel.js, which only define functions for app.js to call later. This
   file also exposes pwaInstallCardHtml()/bindPwaInstallCard(), which app.js's
   renderSettings hooks into the same way it already does for the Cloud Sync
   card, so "Install App" shows up as a normal Settings section.
   ============================================================================ */

let deferredInstallPrompt = null;
let swRegistration = null;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

// ---------------------------------------------------------------------------
// Service worker registration + update handling
// ---------------------------------------------------------------------------
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then(reg => {
      swRegistration = reg;
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner();
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) showUpdateBanner();
        });
      });
    }).catch(err => console.warn("Service worker registration failed:", err));

    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}

function showUpdateBanner() {
  if (document.getElementById("pwa-update-banner")) return;
  const el = document.createElement("div");
  el.id = "pwa-update-banner";
  el.className = "pwa-banner";
  el.innerHTML = `<span>🔄 A new version is ready.</span>
    <button class="btn btn-small btn-primary" id="pwa-update-btn">Update Now</button>
    <button class="btn-icon" id="pwa-update-dismiss">✕</button>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  document.getElementById("pwa-update-btn").onclick = () => {
    if (swRegistration && swRegistration.waiting) swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
  };
  document.getElementById("pwa-update-dismiss").onclick = () => {
    el.classList.remove("show"); setTimeout(() => el.remove(), 300);
  };
}

// ---------------------------------------------------------------------------
// Install prompt (Android/Desktop Chrome & Edge fire beforeinstallprompt;
// iOS Safari never does — those users only ever see the manual instructions).
// ---------------------------------------------------------------------------
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
  refreshInstallSection();
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  const banner = document.getElementById("pwa-install-banner");
  if (banner) banner.remove();
  refreshInstallSection();
});

function showInstallBanner() {
  if (isStandalone() || sessionStorage.getItem("pwaInstallDismissed") || document.getElementById("pwa-install-banner")) return;
  const el = document.createElement("div");
  el.id = "pwa-install-banner";
  el.className = "pwa-banner";
  el.innerHTML = `<span>📲 Install this app for quick access.</span>
    <button class="btn btn-small btn-primary" id="pwa-install-btn">Install</button>
    <button class="btn-icon" id="pwa-install-dismiss">✕</button>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  document.getElementById("pwa-install-btn").onclick = doInstallPrompt;
  document.getElementById("pwa-install-dismiss").onclick = () => {
    sessionStorage.setItem("pwaInstallDismissed", "1");
    el.classList.remove("show"); setTimeout(() => el.remove(), 300);
  };
}

async function doInstallPrompt() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  const banner = document.getElementById("pwa-install-banner");
  if (banner) banner.remove();
  refreshInstallSection();
}

// ---------------------------------------------------------------------------
// Settings page card — mirrors the Cloud Sync card pattern already used in app.js
// ---------------------------------------------------------------------------
function pwaInstallCardHtml() {
  if (isStandalone()) return `<p class="muted">✅ Already installed and running as an app.</p>`;
  const canPrompt = !!deferredInstallPrompt;
  return `
    ${canPrompt ? `<button class="btn btn-primary" id="pwa-install-btn-settings">📲 Install App</button>` : `<p class="muted">Your browser didn't offer an automatic install prompt (this is normal on iPhone/iPad, and on some browsers until you've used the site a bit) — use the manual steps below instead.</p>`}
    <details class="pwa-instructions" ${canPrompt ? "" : "open"}>
      <summary>How to install manually</summary>
      <p><b>📱 iPhone/iPad (Safari):</b> Tap the Share icon (square with an arrow pointing up) → scroll down and tap "Add to Home Screen" → tap Add.</p>
      <p><b>🤖 Android (Chrome):</b> Tap the ⋮ menu (top right) → tap "Install app" (or "Add to Home screen") → tap Install.</p>
      <p><b>🖥️ Windows (Chrome/Edge):</b> Click the install icon (⊕ or a small monitor) at the right end of the address bar → click Install. If you don't see it, open the ⋮ / ··· menu → "Install Summer Level-Up" (Chrome) or "Apps → Install this site as an app" (Edge).</p>
    </details>`;
}
function bindPwaInstallCard() {
  const btn = document.getElementById("pwa-install-btn-settings");
  if (btn) btn.onclick = doInstallPrompt;
}
function refreshInstallSection() {
  if (typeof currentPage !== "undefined" && currentPage === "settings" && typeof goTo === "function") goTo("settings");
}

registerServiceWorker();
