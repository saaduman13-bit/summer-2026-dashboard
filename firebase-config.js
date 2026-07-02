/* ============================================================================
   firebase-config.js — YOUR Firebase project settings.
   ----------------------------------------------------------------------------
   Cloud sync (login across devices) is 100% OPTIONAL. If you leave the values
   below as placeholders, the app runs fine in local-only (localStorage) mode
   forever — nothing breaks.

   To enable cross-device sync:
     1. Follow "Firebase Setup" in README.md to create a free Firebase project.
     2. Copy your project's web config from the Firebase console into the
        object below (Project settings -> General -> Your apps -> SDK setup).
     3. Save this file and reload the app (or redeploy to GitHub Pages).

   NOTE: These values are safe to commit/publish. A Firebase web config is a
   public client identifier, not a secret — your data is actually protected by
   the Firestore security rules described in README.md, not by hiding this file.
   ============================================================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDpIXAsIpupE8hDP-y0H7zDOb_6h8n9uKo",
  authDomain: "summer-dashboard-c53b4.firebaseapp.com",
  projectId: "summer-dashboard-c53b4",
  storageBucket: "summer-dashboard-c53b4.firebasestorage.app",
  messagingSenderId: "554536456271",
  appId: "1:554536456271:web:521ac3e984465b6606da3a"
};
