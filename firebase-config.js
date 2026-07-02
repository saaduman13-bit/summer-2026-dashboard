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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
