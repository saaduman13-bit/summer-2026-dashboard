/* ============================================================================
   gamefeel.js — "game feel" layer: sounds, XP floaters, level-up celebration,
   achievement popups, streak flames, Summer Battle Pass, Life Map, and the
   rule-based Sunday Coach Review.
   ----------------------------------------------------------------------------
   Everything here is additive: app.js's core functions (addXP, unlockBadge,
   unlockAccessory, checkLevelUp) call these via `typeof fn === "function"`
   guards, so the app still works fine even if this file were removed. This
   file in turn only touches app.js/data.js globals (S, $, card, save, goTo,
   etc.) inside function bodies, which are safe to reference regardless of
   script load order since nothing here executes until a user interacts or
   app.js's init() calls something.
   ============================================================================ */

// ---------------------------------------------------------------------------
// Sound effects — generated tones via Web Audio API, no external audio files.
// ---------------------------------------------------------------------------
let _actx = null;
function getAudioCtx() {
  if (!S || !S.meta.soundEnabled) return null;
  if (!_actx) { try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (_actx.state === "suspended") _actx.resume();
  return _actx;
}
function playTone(freq, duration, type, delay, gainPeak) {
  const ctx = getAudioCtx(); if (!ctx) return;
  const t0 = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = type || "sine"; osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak || 0.15, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + duration + 0.05);
}
function playSound(kind) {
  if (!S || !S.meta.soundEnabled) return;
  if (kind === "xp") playTone(880, 0.12, "triangle");
  else if (kind === "quest") { playTone(660, 0.1, "triangle"); playTone(880, 0.12, "triangle", 0.08); }
  else if (kind === "levelup") { playTone(523, 0.15, "square"); playTone(659, 0.15, "square", 0.12); playTone(784, 0.28, "square", 0.24); }
  else if (kind === "unlock") { playTone(784, 0.1, "sine"); playTone(988, 0.16, "sine", 0.1); }
}

// ---------------------------------------------------------------------------
// XP floaters — "+25 XP" pops near the header XP bar and fades upward.
// ---------------------------------------------------------------------------
function showXPFloat(amount) {
  const anchor = document.querySelector(".hdr-xp-wrap") || document.getElementById("hdr-xpbar");
  const el = document.createElement("div");
  el.className = "xp-float";
  el.textContent = `+${amount} XP`;
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    el.style.left = Math.round(rect.left + rect.width / 2) + "px";
    el.style.top = Math.round(rect.bottom) + "px";
  } else {
    el.style.left = "50%"; el.style.top = "70px";
  }
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("rise"));
  setTimeout(() => el.remove(), 1300);
}

// ---------------------------------------------------------------------------
// Level-up celebration overlay
// ---------------------------------------------------------------------------
function showLevelUpCelebration(level) {
  const el = document.createElement("div");
  el.className = "levelup-overlay";
  el.innerHTML = `<div class="levelup-card">
    <div class="levelup-big">LEVEL UP!</div>
    <div class="levelup-level">Level ${level}</div>
    <div class="levelup-title">"${esc(titleForLevel(level))}"</div>
    <button class="btn btn-primary" id="levelup-close">Let's go</button>
  </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  const close = () => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); };
  el.querySelector("#levelup-close").onclick = close;
  el.addEventListener("click", e => { if (e.target === el) close(); });
  setTimeout(close, 4500);
}

// ---------------------------------------------------------------------------
// Achievement pop-ups — queued so simultaneous unlocks (e.g. a chain granting
// both a badge and an accessory) don't stack/clobber each other.
// ---------------------------------------------------------------------------
const _achievementQueue = [];
let _achievementShowing = false;
function queueAchievementPopup(data) { _achievementQueue.push(data); processAchievementQueue(); }
function processAchievementQueue() {
  if (_achievementShowing || !_achievementQueue.length) return;
  _achievementShowing = true;
  showAchievementBanner(_achievementQueue.shift());
}
function showAchievementBanner(data) {
  playSound("unlock");
  const el = document.createElement("div");
  el.className = "achievement-banner";
  el.innerHTML = `<div class="ach-icon">${data.icon || "🏅"}</div>
    <div class="ach-body">
      <div class="ach-title">${esc(data.title || "Unlocked!")}</div>
      ${data.reason ? `<div class="ach-reason">${esc(data.reason)}</div>` : ""}
      ${data.xp ? `<div class="ach-xp">+${data.xp} XP</div>` : ""}
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => { el.remove(); _achievementShowing = false; processAchievementQueue(); }, 400);
  }, 3800);
}

// ---------------------------------------------------------------------------
// Streak flames — visual intensity tiers, used on the Home streak cards.
// ---------------------------------------------------------------------------
function flameFor(count) {
  if (!count || count <= 0) return `<span class="flame flame-off" title="No active streak">🔥</span>`;
  if (count < 3) return `<span class="flame flame-low" title="${count}-day streak">🔥</span>`;
  if (count < 7) return `<span class="flame flame-mid" title="${count}-day streak">🔥🔥</span>`;
  return `<span class="flame flame-hot" title="${count}-day streak">🔥🔥🔥</span>`;
}

// ---------------------------------------------------------------------------
// PAGE: SUMMER BATTLE PASS
// ---------------------------------------------------------------------------
function bpCurrentLevel() { return clamp(Math.floor(S.meta.xp / BATTLE_PASS_XP_PER_LEVEL), 0, BATTLE_PASS_LEVELS.length); }
function claimBattlePassLevel(lvl) {
  const entry = BATTLE_PASS_LEVELS[lvl - 1];
  if (!entry || S.battlePass.claimedLevels.includes(lvl) || bpCurrentLevel() < lvl) return;
  S.battlePass.claimedLevels.push(lvl);
  const r = entry.reward;
  addXP(r.xp || 10, "Battle Pass Level " + lvl + " — " + r.label);
  if (r.type === "badge") unlockBadge(r.badgeId, "Battle Pass Level " + lvl + " milestone.");
  else if (r.type === "accessory") unlockAccessory(r.accessoryId, "Battle Pass Level " + lvl + " reward.");
  else if (r.type === "title") {
    if (!S.meta.unlockedTitles.includes(r.label)) { S.meta.unlockedTitles.push(r.label); queueAchievementPopup({ icon: "🏷️", title: "Title Unlocked: " + r.label, reason: "Battle Pass Level " + lvl }); }
  } else if (r.type === "theme") {
    if (!S.meta.unlockedThemes.includes(r.label)) { S.meta.unlockedThemes.push(r.label); queueAchievementPopup({ icon: "🎨", title: "Theme Unlocked: " + r.label, reason: "Battle Pass Level " + lvl + " — equip it in Settings." }); }
  } else if (r.type === "questpack") {
    queueAchievementPopup({ icon: "📦", title: "Bonus Quest Pack Unlocked", reason: "Battle Pass Level " + lvl });
  }
  save();
  goTo("battlepass");
}
const renderBattlePass = {
  html() {
    const bp = S.battlePass;
    const curLevel = bpCurrentLevel();
    const nextThreshold = Math.min(BATTLE_PASS_LEVELS.length, curLevel + 1) * BATTLE_PASS_XP_PER_LEVEL;
    const typeIcon = { xp: "⚡", badge: "🏅", accessory: "🎒", title: "🏷️", theme: "🎨", questpack: "📦" };
    return `${card("🎫 Summer Battle Pass", `
      <p class="muted">Earn XP from any quest, log, or chain to climb — 100 tiers between now and September 1.</p>
      ${progressBar(S.meta.xp, nextThreshold, "Battle Pass Tier " + curLevel + "/100")}
      <p class="muted">${bp.claimedLevels.length} of ${curLevel} unlocked tiers claimed.</p>`)}
    ${card("🎁 Reward Track", `<div class="bp-grid">${BATTLE_PASS_LEVELS.map(entry => {
      const claimed = bp.claimedLevels.includes(entry.level);
      const unlocked = curLevel >= entry.level;
      const icon = typeIcon[entry.reward.type] || "🎁";
      return `<div class="bp-cell ${claimed ? "bp-claimed" : unlocked ? "bp-unlocked" : "bp-locked"}" data-bp="${entry.level}" title="${esc(entry.reward.label)}">
        <div class="bp-lvl">${entry.level}</div><div class="bp-icon">${claimed ? "✅" : unlocked ? icon : "🔒"}</div>
      </div>`;
    }).join("")}</div>`)}`;
  },
  init() {
    $$("[data-bp]").forEach(cell => cell.onclick = () => {
      const lvl = Number(cell.dataset.bp);
      if (S.battlePass.claimedLevels.includes(lvl)) { toast("Already claimed."); return; }
      if (bpCurrentLevel() < lvl) { toast(`Reach ${lvl * BATTLE_PASS_XP_PER_LEVEL} total XP to unlock tier ${lvl}.`, "warn"); return; }
      claimBattlePassLevel(lvl);
    });
  }
};

// ---------------------------------------------------------------------------
// PAGE: LIFE MAP
// ---------------------------------------------------------------------------
function regionMatchesCat(regionId, cat) { return (REGION_CAT_MAP[regionId] || []).includes(cat); }
const renderLifeMap = {
  html() {
    return card("🗺️ Life Map", `<p class="muted">Each region tracks a different part of your summer. Tap a region to jump in.</p>
      <div class="map-grid">${REGIONS.map(r => {
        const p = clamp(r.pct() || 0, 0, 100);
        const chains = WEEKLY_CHAINS.filter(c => regionMatchesCat(r.id, c.cat));
        const badgesEarned = BADGES.filter(b => regionMatchesCat(r.id, b.cat) && S.badges.includes(b.id));
        return `<div class="map-region" data-region="${r.page}">
          <div class="map-emoji">${r.emoji}</div>
          <div class="map-name">${r.name}</div>
          ${progressBar(p, 100, "Completion")}
          <div class="map-mini muted">${chains.length} active quest chain${chains.length === 1 ? "" : "s"} • ${badgesEarned.length} reward${badgesEarned.length === 1 ? "" : "s"} earned</div>
        </div>`;
      }).join("")}</div>`);
  },
  init() { $$("[data-region]").forEach(el => el.onclick = () => goTo(el.dataset.region)); }
};

// ---------------------------------------------------------------------------
// PAGE: SUNDAY COACH REVIEW — rule-based local analysis, no external API.
// ---------------------------------------------------------------------------
function computeWeeklyStats() {
  const today = todayStr();
  const wkStart = weekStart(today);
  const inWeek = d => d && d >= wkStart && d <= today;
  return {
    Health: S.health.movementLog.filter(l => inWeek(l.date)).length + S.health.workoutLog.filter(l => inWeek(l.date)).length + S.health.cardioLog.filter(l => inWeek(l.date)).length,
    Spiritual: S.spiritual.revisionSessions.filter(l => inWeek(l.date)).length,
    Academic: S.academics.studyLog.filter(l => inWeek(l.date)).length,
    Social: S.social.contentLog.filter(l => inWeek(l.date)).length,
    Wealth: S.wealth.transactions.filter(l => inWeek(l.date) && l.type === "saved").length,
    Resume: S.resume.volunteerLog.filter(l => inWeek(l.date)).length + S.resume.achievements.filter(l => inWeek(l.date)).length,
    Driving: S.driving.lessonLog.filter(l => inWeek(l.date)).length + S.driving.practiceLog.filter(l => inWeek(l.date)).length
  };
}
const CAT_TO_REGION_NAME = { Health: "Health Kingdom", Spiritual: "Iman Oasis", Academic: "Grade 11 Academy", Social: "Creator Garage", Wealth: "Wealth Vault", Resume: "Resume Hall", Driving: "Road to G2" };
function generateCoachReview() {
  const counts = computeWeeklyStats();
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const biggest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const recommended = DAILY_QUEST_BANK.filter(q => q.cat === weakest[0]).slice(0, 3).map(q => q.text);
  while (recommended.length < 3) { const pick = randomLine(DAILY_QUEST_BANK).text; if (!recommended.includes(pick)) recommended.push(pick); }
  const wk = weekStart(todayStr());
  const battle = S.bossBattles.find(b => b.week === wk) || S.bossBattles[S.bossBattles.length - 1];
  const punishmentKeyMap = { Health: "health", Spiritual: "spiritual", Academic: "academics", Social: "social", Wealth: "wealth" };
  const recovery = (battle && battle.resolved && !battle.passed)
    ? [randomLine(PUNISHMENTS.general), randomLine(PUNISHMENTS[punishmentKeyMap[weakest[0]]] || PUNISHMENTS.general)]
    : null;
  const review = {
    generatedAt: todayStr(),
    biggest: `${biggest[1]} logged action${biggest[1] === 1 ? "" : "s"} in ${CAT_TO_REGION_NAME[biggest[0]]} this week — your strongest area.`,
    weakest: `${CAT_TO_REGION_NAME[weakest[0]]} only saw ${weakest[1]} logged action${weakest[1] === 1 ? "" : "s"} this week — needs attention.`,
    focus: `Next week, prioritize ${CAT_TO_REGION_NAME[weakest[0]]}.`,
    quests: recommended,
    recovery
  };
  S.coachReviews[wk] = review;
  save();
  return review;
}
const renderCoach = {
  html() {
    const wk = weekStart(todayStr());
    const review = S.coachReviews[wk];
    return `${card("🧠 Sunday Coach Review", `
      <p class="muted">A rule-based weekly summary generated from your own logged progress — no external API, just your data.</p>
      <button class="btn btn-primary" id="btn-generate-review">${review ? "Regenerate This Week's Review" : "Generate This Week's Review"}</button>`)}
      ${review ? card("📋 This Week", `
        <p><b>🏆 Biggest win:</b> ${esc(review.biggest)}</p>
        <p><b>⚠️ Weakest area:</b> ${esc(review.weakest)}</p>
        <p><b>🎯 Next week's focus:</b> ${esc(review.focus)}</p>
        <p><b>🗡️ Recommended quests:</b></p>
        <ul class="mini-list">${review.quests.map(q => `<li>${esc(q)}</li>`).join("")}</ul>
        ${review.recovery ? `<p><b>🩹 Boss battle recovery plan:</b></p><ul class="mini-list">${review.recovery.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
      `) : emptyState("No review generated for this week yet.")}
      ${card("📜 Past Reviews", Object.keys(S.coachReviews).sort().reverse().slice(1, 6).map(w => `
        <div class="crud-row"><div class="crud-row-fields"><span><b>Week of ${fmtDateNice(w)}</b></span><span>${esc(S.coachReviews[w].focus)}</span></div></div>`).join("") || emptyState("No past reviews yet."))}`;
  },
  init() {
    $("#btn-generate-review").onclick = () => { generateCoachReview(); goTo("coach"); };
  }
};
