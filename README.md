# Summer Level-Up 2026

A  local-first "level up my life" dashboard: quests, XP, streaks, badges, and trackers for wealth, photography/content, Qur'an revision, health, Grade 11 prep, resume/achievements, driving, projects, planning, meals, and journaling.

- **Works fully offline** on localStorage — no account needed.
- **Optional cloud sync** (Firebase Auth + Firestore) to keep the same progress on your laptop and phone.
- **No backend, no paid APIs, no build step.** Plain HTML/CSS/JS.

---

## 1. Run it locally (no setup required)

Double-click `index.html`. That's it — it opens in your browser and works completely offline, saving to localStorage. Cloud sync stays off until you configure it (Section 3).

---

## 2. Deploy to GitHub Pages (so you can open it from any device's browser)

1. Create a new **public** GitHub repo (e.g. `summer2026`).
2. Push this whole folder to it:
   ```
   git init
   git add .
   git commit -m "Summer Level-Up app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/summer2026.git
   git push -u origin main
   ```
3. On GitHub: go to your repo → **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)** → **Save**.
5. Wait ~1 minute, then your app is live at:
   `https://YOUR_USERNAME.github.io/summer2026/`
6. Every time you `git push` changes, the site redeploys automatically (usually within a minute).

All the file references in this project (`styles.css`, `app.js`, etc.) are relative paths, so it works whether it's hosted at the domain root or under a `/repo-name/` subpath — no config changes needed.

> Without Firebase configured (Section 3), the GitHub Pages version still works great — it just won't sync between devices; each device/browser keeps its own local save.

---

## 3. Firebase Setup (optional — enables syncing across devices)

This lets you sign in with Google on your laptop and your phone and see the same XP, quests, and logs on both. Takes about 10 minutes, free tier is more than enough for personal use.

### Step 1 — Create a Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with Google.
2. Click **Add project**, name it (e.g. `summer2026`), and finish the wizard (Google Analytics is optional — you can skip it).

### Step 2 — Register a Web App
1. In your new project, click the **`</>`** (web) icon to add a web app.
2. Give it a nickname (e.g. "Summer Level-Up"). You don't need Firebase Hosting.
3. Firebase shows you a `firebaseConfig` object. Copy it.
4. Open `firebase-config.js` in this project and paste your values into the `FIREBASE_CONFIG` object, replacing the placeholders:
   ```js
   const FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "summer2026-xxxxx.firebaseapp.com",
     projectId: "summer2026-xxxxx",
     storageBucket: "summer2026-xxxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
5. Save the file (and commit/push it if you're using GitHub Pages — see the note on secrets below).

### Step 3 — Enable Google Sign-In
1. In the Firebase console, go to **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Google**, pick a support email, and save.

### Step 4 — Create the Firestore database
1. Go to **Build → Firestore Database → Create database**.
2. Choose **Production mode** (not test mode) and pick a region close to you.
3. Go to the **Rules** tab and replace the default rules with this (locks each user's data to only that user):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/summerData/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
4. Click **Publish**.

### Step 5 — Authorize your domain (required for Google sign-in popups)
1. Go to **Authentication → Settings → Authorized domains**.
2. `localhost` is already there (for local testing). Add your GitHub Pages domain too, e.g. `YOUR_USERNAME.github.io`.

### Step 6 — Reload and sign in
1. Open the app (locally or on GitHub Pages) and go to **Settings → Cloud Sync → Sign in with Google**.
2. Do the same on your other device, signed into the same Google account. It'll sync automatically.

**Is it safe to publish `firebase-config.js` publicly on GitHub Pages?** Yes — a Firebase web config is a public client identifier, not a secret (Google's own docs confirm this). The actual protection is the Firestore security rule from Step 4, which only lets a signed-in user read/write their *own* `users/{their-uid}/...` documents. Nobody else can read your data even though the config values are visible in your page source.

---

## 4. How syncing works

- Every change saves to **localStorage immediately** — that's always the source of truth for what you see.
- If you're signed in, changes also get pushed to Firestore a couple seconds after you stop editing (debounced, so it's not spamming writes).
- **Sync status badge** (top-right of the header, and in Settings): `💾 Local only` (not configured) → `☁️ Signed out` → `🔄 Syncing…` → `☁️ Synced` → `⚠️ Conflict` / `⚠️ Sync error`.
- **On sign-in**, and whenever you tap **🔄 Sync Now** in Settings, the app compares this device's last-saved time against the cloud's last-saved time:
  - If they're basically the same → just adopts the cloud copy silently, marked Synced.
  - If there's no cloud data yet → uploads this device's data as the first backup.
  - If they genuinely differ (you made progress on two devices without syncing in between) → a **Sync Conflict** modal appears showing both versions' level/XP and last-saved time, and you choose **Use Cloud**, **Use This Device**, or **Decide Later**. Nothing is overwritten until you choose.
- Sync also re-checks automatically when you come back online or refocus the tab (if it's been >15s since the last check).

---

## 5. Backups (JSON export/import)

Independent of cloud sync — always available in **Settings → Data Management**:
- **Export backup (JSON)** downloads a full snapshot of your progress.
- **Import backup** restores from a previously exported file (works whether or not cloud sync is set up).

Do this occasionally regardless of cloud sync, as a personal safety net.

---

## 6. Where to customize

- `data.js` — default goals, XP values, quests, badges, courses, punishments, seed data.
- `app.js` — page logic and rendering (search for `PAGE:` comments).
- `cloud.js` — sync/auth logic (only runs if `firebase-config.js` is filled in).
- `firebase-config.js` — your Firebase project keys.
- `styles.css` — theme colors (edit the `:root` variables at the top).

## 7. Limitations

- Firestore's free tier and the 1MB-per-document limit are both far beyond what a summer's worth of logging needs, but if you log extremely heavily for months on end, keep it in mind.
- Conflict resolution is manual (you pick a side) — there's no automatic field-by-field merge, to avoid silently mixing up two different days' data.
- Google Sign-In is the only auth method (kept simple on purpose — no password reset flows to worry about).
- No push notifications/reminders — it's a tool you open and use.
