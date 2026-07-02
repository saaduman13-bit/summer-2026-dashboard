/* ============================================================================
   service-worker.js — offline caching + safe update flow for Summer Level-Up.
   ----------------------------------------------------------------------------
   Bump CACHE_VERSION any time you change the content of a core file (app.js,
   styles.css, etc.) and redeploy. That gives the new install() a new cache
   name, so activate() cleans up the old one and clients get fresh files
   instead of being stuck on a stale cache forever.
   ----------------------------------------------------------------------------
   Update flow: this worker deliberately does NOT call self.skipWaiting() on
   install. That means when a new version is deployed, it installs in the
   background but waits — the page (see pwa.js) detects the waiting worker and
   shows an "Update Now" banner. Only when the user clicks it does the page
   postMessage a SKIP_WAITING command, the new worker activates, and the page
   reloads itself. Nothing swaps out from under the user mid-edit.
   ============================================================================ */

const CACHE_VERSION = "v1";
const CACHE_NAME = "summer2026-cache-" + CACHE_VERSION;

// Core app shell — everything needed to run fully offline once cached.
const CORE_ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "data.js",
  "cloud.js",
  "gamefeel.js",
  "firebase-config.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .catch(err => console.warn("Service worker precache failed:", err))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Lets the page trigger activation of a waiting worker only after the user
// explicitly agrees via the update banner (see pwa.js).
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return; // don't touch POSTs etc (e.g. Firestore/Auth network calls)

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (Firebase CDN, Auth, Firestore) pass through untouched

  if (req.mode === "navigate") {
    // Network-first for the page itself: fresh HTML when online, cached shell when offline.
    event.respondWith(
      fetch(req)
        .then(res => { caches.open(CACHE_NAME).then(cache => cache.put(req, res.clone())); return res; })
        .catch(() => caches.match(req).then(cached => cached || caches.match("index.html")))
    );
    return;
  }

  // Cache-first (with background refresh) for core static assets — fast and offline-capable.
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(res => { if (res && res.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, res.clone())); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
