/* ============================================================================
   app.js — Summer Level-Up engine
   All state lives in `S` and is persisted to localStorage under STORAGE_KEY.
   Pages are rendered as HTML strings into #page-content, then `init*()` wires
   up events. Customize quests/XP/badges in data.js — logic lives here.
   ============================================================================ */

const STORAGE_KEY = "summer2026_state_v1";
let S = null; // active state

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);
const esc = (str) => String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function fmtDateNice(d) { if (!d) return "—"; const dt = new Date(d + "T00:00:00"); return isNaN(dt) ? d : dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function daysBetween(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000); }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function pct(n, d) { return d <= 0 ? 0 : clamp(Math.round((n / d) * 100), 0, 100); }
function weekStart(dateStr) { const d = new Date(dateStr + "T00:00:00"); const day = d.getDay(); const diff = (day === 0 ? -6 : 1) - day; d.setDate(d.getDate() + diff); return d.toISOString().slice(0, 10); }

function deepMerge(base, override) {
  if (Array.isArray(base)) return override !== undefined ? override : base;
  if (typeof base === "object" && base !== null) {
    const out = { ...base };
    for (const k in base) out[k] = deepMerge(base[k], override ? override[k] : undefined);
    if (override) for (const k in override) if (!(k in out)) out[k] = override[k];
    return out;
  }
  return override !== undefined ? override : base;
}

let _appReady = false; // true once initial load/merge is done — guards against bogus timestamps/pushes during bootstrap
// Pass isSyncWrite=true when writing data that just came FROM the cloud (applyCloudState) —
// that write shouldn't bump lastModified (it already has the cloud's timestamp) or re-trigger a push.
function save(isSyncWrite) {
  if (_appReady && !isSyncWrite) S.meta.lastModified = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  if (_appReady && !isSyncWrite && typeof scheduleCloudPush === "function") scheduleCloudPush();
}
function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const def = buildDefaultState();
  if (!raw) return def;
  try { return deepMerge(def, JSON.parse(raw)); } catch (e) { console.warn("Corrupt save, using defaults", e); return def; }
}

// ---------------------------------------------------------------------------
// Toasts & Modal
// ---------------------------------------------------------------------------
function toast(msg, kind = "info") {
  const box = $("#toast-box");
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.textContent = msg;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 3200);
}
function randomLine(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function openModal(title, bodyHtml, onMount) {
  const wrap = $("#modal-wrap");
  wrap.innerHTML = `<div class="modal-backdrop" id="modal-backdrop">
    <div class="modal-box">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="btn-icon" id="modal-close">✕</button></div>
      <div class="modal-body">${bodyHtml}</div>
    </div></div>`;
  wrap.classList.add("open");
  $("#modal-close").onclick = closeModal;
  $("#modal-backdrop").addEventListener("click", (e) => { if (e.target.id === "modal-backdrop") closeModal(); });
  if (onMount) onMount(wrap);
}
function closeModal() { $("#modal-wrap").classList.remove("open"); $("#modal-wrap").innerHTML = ""; }

// ---------------------------------------------------------------------------
// XP / Level / Stats / Badges / Accessories
// ---------------------------------------------------------------------------
function addXP(amount, reason) {
  S.meta.xp += amount;
  S.xpLog.push({ date: todayStr(), amount, reason });
  toast(`+${amount} XP — ${reason}`, "xp");
  checkLevelUp();
  save();
  refreshHeader();
}
function xpIntoLevel() {
  let remaining = S.meta.xp, lvl = 1;
  while (remaining >= xpForLevel(lvl)) { remaining -= xpForLevel(lvl); lvl++; }
  return { level: lvl, into: remaining, need: xpForLevel(lvl) };
}
function checkLevelUp() {
  const { level } = xpIntoLevel();
  if (level > S.meta.level) {
    S.meta.level = level;
    toast(`🎉 LEVEL UP! You are now Level ${level} — "${titleForLevel(level)}"`, "levelup");
  }
}
function bumpStat(stat, amount) {
  S.stats[stat] = clamp((S.stats[stat] || 0) + amount, 0, 999);
  save();
}
function unlockBadge(id) {
  if (S.badges.includes(id)) return;
  S.badges.push(id);
  const b = BADGES.find(x => x.id === id);
  toast(`🏅 Badge unlocked: ${b ? b.emoji + " " + b.name : id}`, "badge");
  save();
}
function unlockAccessory(id) {
  if (S.accessories.unlocked.includes(id)) return;
  S.accessories.unlocked.push(id);
  S.accessories.equipped.push(id);
  const a = ACCESSORIES.find(x => x.id === id);
  toast(`✨ Accessory unlocked: ${a ? a.emoji + " " + a.name : id}`, "badge");
  save();
}
function bumpStreak(key, dateStr) {
  const last = S.streaks["last" + key.charAt(0).toUpperCase() + key.slice(1)];
  if (last === dateStr) return; // already counted today
  if (last && daysBetween(last, dateStr) === 1) S.streaks[key] = (S.streaks[key] || 0) + 1;
  else S.streaks[key] = 1;
  S.streaks["last" + key.charAt(0).toUpperCase() + key.slice(1)] = dateStr;
  if (key === "movement" && S.streaks.movement >= 7) unlockBadge("movement7");
  if (key === "movement" && S.streaks.movement >= 7) unlockAccessory("shoes");
  if (key === "quran" && S.streaks.quran >= 7) { unlockBadge("quran7"); }
  if (key === "study" && S.streaks.study >= 5) unlockBadge("studystreak");
  if (key === "content" && S.streaks.content >= 3) unlockBadge("contentstreak");
  save();
}

// ---------------------------------------------------------------------------
// Generic UI builders
// ---------------------------------------------------------------------------
function progressBar(cur, max, label, colorClass = "") {
  const p = pct(cur, max);
  return `<div class="pbar-wrap">
    <div class="pbar-label"><span>${label}</span><span>${cur}/${max} (${p}%)</span></div>
    <div class="pbar ${colorClass}"><div class="pbar-fill" style="width:${p}%"></div></div>
  </div>`;
}
function card(title, inner, extraClass = "") {
  return `<div class="card ${extraClass}"><h3 class="card-title">${title}</h3>${inner}</div>`;
}
function emptyState(msg) { return `<p class="empty-state">${esc(msg)}</p>`; }

function renderFieldInput(f) {
  const val = f.default ?? (f.type === "date" ? todayStr() : "");
  if (f.type === "select") return `<label class="field">${f.label}<select name="${f.key}">${f.options.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join("")}</select></label>`;
  if (f.type === "textarea") return `<label class="field field-wide">${f.label}<textarea name="${f.key}" rows="2"></textarea></label>`;
  if (f.type === "checkbox") return `<label class="field field-check"><input type="checkbox" name="${f.key}"> ${f.label}</label>`;
  return `<label class="field">${f.label}<input type="${f.type || "text"}" name="${f.key}" value="${esc(val)}" ${f.step ? `step="${f.step}"` : ""}></label>`;
}

// Generic CRUD log list. arrGetter() returns the live array reference in S.
function crudLog(containerEl, arrGetter, fields, opts = {}) {
  const arr = arrGetter();
  const rowFn = opts.rowRenderer || ((row, i) => `<div class="crud-row">
      <div class="crud-row-fields">${fields.map(f => `<span><b>${f.label}:</b> ${formatCrudVal(row[f.key], f)}</span>`).join("")}</div>
      <button class="btn-icon del-btn" data-del="${i}">✕</button></div>`);
  containerEl.innerHTML = `
    <form class="crud-form">${fields.map(renderFieldInput).join("")}<button type="submit" class="btn btn-primary">${opts.addLabel || "Add entry"}</button></form>
    <div class="crud-list">${arr.length ? arr.slice().reverse().map((r, ri) => rowFn(r, arr.length - 1 - ri)).join("") : emptyState(opts.emptyMsg || "Nothing logged yet.")}</div>`;
  const form = $(".crud-form", containerEl);
  form.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(form);
    const row = {};
    fields.forEach(f => { row[f.key] = f.type === "checkbox" ? form[f.key].checked : (f.type === "number" ? Number(fd.get(f.key) || 0) : fd.get(f.key)); });
    arr.push(row);
    save();
    if (opts.onAdd) opts.onAdd(row);
    crudLog(containerEl, arrGetter, fields, opts);
  });
  $$(".del-btn", containerEl).forEach(btn => btn.onclick = () => { arr.splice(Number(btn.dataset.del), 1); save(); crudLog(containerEl, arrGetter, fields, opts); });
}
function formatCrudVal(v, f) {
  if (f.type === "checkbox") return v ? "Yes" : "No";
  if (f.type === "date") return fmtDateNice(v);
  return esc(v);
}

// Simple checklist bound to an object of {label: bool}
function checklistGrid(obj, onToggle) {
  return `<div class="checklist">${Object.keys(obj).map(k => `
    <label class="check-item ${obj[k] ? "done" : ""}"><input type="checkbox" data-check="${esc(k)}" ${obj[k] ? "checked" : ""}> ${esc(k)}</label>`).join("")}</div>`;
}
function bindChecklist(containerEl, obj, cb) {
  $$("[data-check]", containerEl).forEach(inp => inp.onchange = () => { obj[inp.dataset.check] = inp.checked; save(); inp.closest(".check-item").classList.toggle("done", inp.checked); if (cb) cb(obj); refreshHeader(); });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const PAGES = [
  ["home", "🏠", "Home"], ["character", "🧙", "Character"], ["wealth", "🪙", "Wealth"],
  ["social", "📷", "Creator"], ["spiritual", "🕌", "Iman"], ["health", "💪", "Training"],
  ["academics", "🎓", "Grade 11"], ["resume", "📄", "Achievements"], ["driving", "🚗", "Road to G2"],
  ["projects", "🧪", "Side Quests"], ["planner", "🗓️", "Planner"], ["meals", "🍽️", "Meals"],
  ["journal", "📔", "Battle Log"], ["boss", "👑", "Boss Battle"], ["settings", "⚙️", "Settings"]
];
let currentPage = "home";
function goTo(page) {
  currentPage = page;
  $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  const renderer = { home: renderHome, character: renderCharacter, wealth: renderWealth, social: renderSocial,
    spiritual: renderSpiritual, health: renderHealth, academics: renderAcademics, resume: renderResume,
    driving: renderDriving, projects: renderProjects, planner: renderPlanner, meals: renderMeals,
    journal: renderJournal, boss: renderBoss, settings: renderSettings }[page];
  $("#page-content").innerHTML = `<div class="page fade-in">${renderer.html()}</div>`;
  if (renderer.init) renderer.init();
  window.scrollTo(0, 0);
}
function refreshHeader() {
  const { level, into, need } = xpIntoLevel();
  $("#hdr-level").textContent = `Lv.${level}`;
  $("#hdr-title").textContent = titleForLevel(level);
  $("#hdr-xpbar").style.width = pct(into, need) + "%";
  $("#hdr-xptext").textContent = `${into}/${need} XP`;
}

// ---------------------------------------------------------------------------
// Daily quests
// ---------------------------------------------------------------------------
function getDailyQuests(date) {
  if (!S.quests.daily[date]) {
    S.quests.daily[date] = DAILY_QUEST_BANK.map(q => ({ id: uid(), cat: q.cat, text: q.text, done: false }));
    save();
  }
  return S.quests.daily[date];
}
function toggleDailyQuest(date, qid) {
  const list = getDailyQuests(date);
  const q = list.find(x => x.id === qid);
  if (!q) return;
  q.done = !q.done;
  if (q.done) {
    addXP(S.meta.xpValues.dailyQuest, `Daily quest: ${q.text}`);
    if (q.cat === "Health") bumpStreak("movement", date);
    if (q.cat === "Spiritual") bumpStreak("quran", date);
    if (q.cat === "Academic") bumpStreak("study", date);
    if (q.cat === "Social") bumpStreak("content", date);
    const statMap = { Health: "health", Spiritual: "iman", Academic: "knowledge", Wealth: "wealth", Social: "creativity", Resume: "confidence", Project: "creativity", Discipline: "discipline" };
    if (statMap[q.cat]) bumpStat(statMap[q.cat], 1);
  }
  save();
}

// ---------------------------------------------------------------------------
// Weekly chain progress
// ---------------------------------------------------------------------------
function getChainProgress(chainId) {
  const chain = WEEKLY_CHAINS.find(c => c.id === chainId);
  if (!S.quests.weeklyChainProgress[chainId]) S.quests.weeklyChainProgress[chainId] = { steps: chain.steps.map(() => false), completed: false };
  return S.quests.weeklyChainProgress[chainId];
}
function toggleChainStep(chainId, idx) {
  const chain = WEEKLY_CHAINS.find(c => c.id === chainId);
  const prog = getChainProgress(chainId);
  prog.steps[idx] = !prog.steps[idx];
  if (prog.steps.every(Boolean) && !prog.completed) {
    prog.completed = true;
    addXP(S.meta.xpValues.weeklyQuest, `Chain complete: ${chain.name}`);
    unlockBadge(chain.reward);
    if (ACCESSORIES.find(a => a.id === chain.reward)) unlockAccessory(chain.reward);
  } else if (!prog.steps.every(Boolean)) prog.completed = false;
  save();
}

// ---------------------------------------------------------------------------
// "What should I do now?" suggestion engine
// ---------------------------------------------------------------------------
function suggestAction() {
  const today = todayStr();
  const shoot = S.social.paidShoots.find(s => s.id === "amggtr");
  if (shoot && shoot.status !== "Delivered" && daysBetween(today, shoot.date) <= 7 && daysBetween(today, shoot.date) >= -3) {
    const nextPrep = Object.entries(shoot.prep).find(([k, v]) => !v);
    if (nextPrep) return `📷 AMG GT-R shoot is coming up (${fmtDateNice(shoot.date)}). Next prep task: "${nextPrep[0]}". Go to Creator → Paid Shoots.`;
  }
  const waitingOpps = S.resume.opportunities.filter(o => o.status === "Waiting to hear back" && o.dateApplied && daysBetween(o.dateApplied, today) >= 5);
  if (waitingOpps.length) return `📄 It's been ${daysBetween(waitingOpps[0].dateApplied, today)} days since you contacted ${waitingOpps[0].org}. Send a polite follow-up. Go to Achievements → Opportunities.`;
  if (S.streaks.movement === 0 || S.streaks.lastMovement !== today) return `💪 No movement logged today. Go walk, bike, or hit a quick workout in Training.`;
  const juzDone = Object.values(S.spiritual.juz30).filter(s => ["Good", "Strong", "Recited to someone"].includes(s.status)).length;
  if (juzDone < JUZ30_SURAHS.length * 0.6) return `🕌 Juz 30 repair is behind. Review one surah in Iman for 15-20 minutes.`;
  if (S.wealth.savings < S.wealth.goal * 0.3) return `🪙 Savings progress is low. Log an expense/income or use the impulse checker before your next purchase.`;
  if (S.driving.lessonLog.length === 0) return `🚗 Log your most recent driving lesson (you're at lesson ${S.driving.lessonNumber}). Go to Road to G2.`;
  const weakCourse = Object.entries(S.academics.courses).sort((a, b) => a[1].confidence - b[1].confidence)[0];
  if (weakCourse) return `🎓 ${weakCourse[0]} has your lowest confidence (${weakCourse[1].confidence}/10). Do a 25-min prep session in Grade 11.`;
  return `✅ You're on track across the board. Bank a quick win — post content, save $10, or revise a surah.`;
}

// ---------------------------------------------------------------------------
// PAGE: HOME
// ---------------------------------------------------------------------------
const renderHome = {
  html() {
    const today = todayStr();
    const daysSinceSummer = daysBetween(S.meta.summerStart, today);
    const daysLeft = daysBetween(today, S.meta.schoolStart);
    const totalSummer = daysBetween(S.meta.summerStart, S.meta.schoolStart);
    const summerPct = pct(daysSinceSummer, totalSummer);
    const quests = getDailyQuests(today);
    const doneCount = quests.filter(q => q.done).length;
    const shoot = S.social.paidShoots.find(s => s.id === "amggtr");
    const g2Days = daysBetween(today, S.driving.g2EligibleDate);

    return `
    <div class="hero card">
      <h1>Welcome back, ${esc(S.meta.name)} 👋</h1>
      <p class="muted">${fmtDateNice(today)} • Day ${daysSinceSummer} of summer • ${daysLeft} days until Grade 11 starts</p>
      ${progressBar(daysSinceSummer, totalSummer, "Summer Progress", "pbar-summer")}
      <div class="hero-actions">
        <button class="btn btn-primary" id="btn-suggest">🎯 What should I do now?</button>
        <button class="btn" id="btn-quickwin">⚡ Log quick win</button>
      </div>
    </div>

    <div class="grid-2">
      ${card("📌 Important This Week", `
        <ul class="mini-list">
          <li>🏎️ AMG GT-R paid shoot — <b>${fmtDateNice(shoot.date)}</b> — $${shoot.price} (${esc(shoot.status)})</li>
          <li>📄 Waiting to hear back from <b>2 masjids</b> — Social Media Specialist roles</li>
          <li>🚗 Driving lesson <b>#${S.driving.lessonNumber}</b> logged • G2 eligible in <b>${g2Days}</b> days</li>
          <li>🎓 Grade 11 load: BAF3M, CIE3M, ENG3U, MCR3U, HRF3O, SCH3U, SPH3U, +1</li>
        </ul>`)}
      ${card("🔥 Streaks", `
        <div class="streak-row"><span>🏃 Movement</span><b>${S.streaks.movement || 0}d</b></div>
        <div class="streak-row"><span>🕌 Qur'an</span><b>${S.streaks.quran || 0}d</b></div>
        <div class="streak-row"><span>📚 Study</span><b>${S.streaks.study || 0}d</b></div>
        <div class="streak-row"><span>📷 Content</span><b>${S.streaks.content || 0}d</b></div>`)}
    </div>

    ${card("🗡️ Today's Quests (" + doneCount + "/" + quests.length + ")", `
      <div class="quest-list">${quests.map(q => `
        <label class="quest-item ${q.done ? "done" : ""}">
          <input type="checkbox" data-qid="${q.id}" ${q.done ? "checked" : ""}>
          <span class="quest-cat">${esc(q.cat)}</span><span class="quest-text">${esc(q.text)}</span>
          <span class="quest-xp">+${S.meta.xpValues.dailyQuest} XP</span>
        </label>`).join("")}</div>`)}

    ${card("🧭 Focus of the Week", `<p class="focus-text" id="focus-text">${esc(S.focusOfWeek)}</p>
      <button class="btn btn-small" id="edit-focus">Edit focus</button>`)}

    <h2 class="section-heading">Quick Access</h2>
    <div class="quickgrid">
      ${PAGES.filter(p => !["home", "settings"].includes(p[0])).map(([id, emoji, label]) => `
        <button class="quick-card" data-goto="${id}"><span class="quick-emoji">${emoji}</span>${label}</button>`).join("")}
    </div>`;
  },
  init() {
    $$("[data-qid]").forEach(cb => cb.onchange = () => { toggleDailyQuest(todayStr(), cb.dataset.qid); goTo("home"); });
    $$("[data-goto]").forEach(b => b.onclick = () => goTo(b.dataset.goto));
    $("#btn-suggest").onclick = () => openModal("What should I do now?", `<p>${esc(suggestAction())}</p>`);
    $("#btn-quickwin").onclick = () => openModal("Log a quick win", `
      <form id="qw-form"><label class="field field-wide">What did you do?<input type="text" name="text" required></label>
      <button class="btn btn-primary" type="submit">Log it (+${S.meta.xpValues.logEntry} XP)</button></form>`, () => {
      $("#qw-form").onsubmit = e => { e.preventDefault(); const t = e.target.text.value; addXP(S.meta.xpValues.logEntry, "Quick win: " + t); closeModal(); goTo("home"); };
    });
    $("#edit-focus").onclick = () => { const v = prompt("Set this week's focus:", S.focusOfWeek); if (v) { S.focusOfWeek = v; save(); goTo("home"); } };
  }
};

// ---------------------------------------------------------------------------
// PAGE: CHARACTER
// ---------------------------------------------------------------------------
const renderCharacter = {
  html() {
    const { level, into, need } = xpIntoLevel();
    const equippedEmojis = S.accessories.equipped.map(id => ACCESSORIES.find(a => a.id === id)?.emoji).filter(Boolean).join(" ");
    return `
    <div class="char-card card">
      <div class="char-avatar">🧑 ${equippedEmojis}</div>
      <h2>${esc(S.meta.name)}</h2>
      <p class="muted">Level ${level} — "${titleForLevel(level)}"</p>
      ${progressBar(into, need, "XP")}
      <div class="stat-grid">${Object.entries(S.stats).map(([k, v]) => `
        <div class="stat-chip"><span class="stat-name">${k}</span><span class="stat-val">${v}</span></div>`).join("")}</div>
    </div>
    ${card("🎒 Inventory — Unlocked Accessories", `
      <div class="acc-grid">${ACCESSORIES.map(a => {
        const unlocked = S.accessories.unlocked.includes(a.id);
        const equipped = S.accessories.equipped.includes(a.id);
        return `<div class="acc-item ${unlocked ? "unlocked" : "locked"}" data-acc="${a.id}">
          <span class="acc-emoji">${unlocked ? a.emoji : "🔒"}</span>
          <span class="acc-name">${a.name}</span>
          <span class="acc-desc">${a.desc}</span>
          ${unlocked ? `<button class="btn btn-small">${equipped ? "Unequip" : "Equip"}</button>` : ""}
        </div>`;
      }).join("")}</div>`)}
    ${card("🏅 Badge Case (" + S.badges.length + "/" + BADGES.length + ")", `
      <div class="badge-grid">${BADGES.map(b => `
        <div class="badge-item ${S.badges.includes(b.id) ? "unlocked" : "locked"}" title="${b.cat}">
          <span class="badge-emoji">${S.badges.includes(b.id) ? b.emoji : "❔"}</span>
          <span class="badge-name">${b.name}</span></div>`).join("")}</div>`)}`;
  },
  init() {
    $$("[data-acc]").forEach(el => { const btn = $("button", el); if (!btn) return;
      btn.onclick = () => { const id = el.dataset.acc; const i = S.accessories.equipped.indexOf(id);
        if (i >= 0) S.accessories.equipped.splice(i, 1); else S.accessories.equipped.push(id);
        save(); goTo("character"); }; });
  }
};

// ---------------------------------------------------------------------------
// PAGE: WEALTH ("Coin Quest")
// ---------------------------------------------------------------------------
const renderWealth = {
  html() {
    const w = S.wealth;
    return `
    ${card("🪙 Coin Quest — Save $" + w.goal, `${progressBar(w.savings, w.goal, "Savings", "pbar-gold")}
      <p class="muted">Weekly target to hit goal by Sept 1: <b>$${Math.max(0, ((w.goal - w.savings) / Math.max(1, Math.ceil(daysBetween(todayStr(), S.meta.schoolStart) / 7))).toFixed(2))}</b>/week</p>`)}

    <div class="grid-2">
      ${card("💵 Transactions", `<div id="wealth-crud"></div>`)}
      ${card("🧮 50% Rule Calculator", `
        <form id="rule-form"><label class="field">Money received<input type="number" name="amt" step="0.01" required></label>
        <button class="btn btn-primary" type="submit">Calculate</button></form>
        <div id="rule-result"></div>`)}
    </div>

    ${card("🚦 Impulse Purchase Checker", `<button class="btn btn-primary" id="open-checker">Check a purchase</button>`)}

    ${card("⏳ Purchase Cooldown List", `<div id="cooldown-area"></div>`)}

    ${card("🏆 Wealth Achievements", `<div class="badge-grid">${BADGES.filter(b => b.cat === "Wealth").map(b => `
      <div class="badge-item ${S.badges.includes(b.id) ? "unlocked" : "locked"}"><span class="badge-emoji">${S.badges.includes(b.id) ? b.emoji : "❔"}</span><span class="badge-name">${b.name}</span></div>`).join("")}</div>`)}`;
  },
  init() {
    const w = S.wealth;
    crudLog($("#wealth-crud"), () => w.transactions, [
      { key: "date", label: "Date", type: "date" },
      { key: "type", label: "Type", type: "select", options: ["income", "expense", "saved"] },
      { key: "category", label: "Category", type: "select", options: ["Food/snacks", "Tech", "Car stuff", "Clothes", "Subscriptions", "Photography gear", "Random impulse", "Other"] },
      { key: "amount", label: "Amount", type: "number", step: "0.01" },
      { key: "note", label: "Note", type: "text" }
    ], {
      addLabel: "Add transaction",
      onAdd: (row) => {
        if (row.type === "saved") { w.savings += row.amount; addXP(S.meta.xpValues.savingsLog, `Saved $${row.amount}`); bumpStat("wealth", 2); checkWealthAchievements(); }
        if (row.type === "expense" && row.category === "Random impulse") toast("Impulse detected. Wait 48 hours before pretending this is a need.", "warn");
        save(); goTo("wealth");
      }
    });

    $("#rule-form").onsubmit = e => {
      e.preventDefault();
      const amt = Number(e.target.amt.value);
      $("#rule-result").innerHTML = `<div class="rule-box">
        <p>💾 Save: <b>$${(amt * 0.5).toFixed(2)}</b></p>
        <p>🛍️ Spend: <b>$${(amt * 0.3).toFixed(2)}</b></p>
        <p>📈 Invest/Hold: <b>$${(amt * 0.2).toFixed(2)}</b></p></div>`;
    };

    $("#open-checker").onclick = () => openModal("Impulse Purchase Checker", `
      <form id="impulse-form">
        <label class="field field-wide">What do you want to buy?<input name="item" required></label>
        <label class="field">Price<input name="price" type="number" step="0.01" required></label>
        <label class="field">Need or want?<select name="need"><option>Want</option><option>Need</option></select></label>
        <label class="field">Wanted before seeing on social media?<select name="social"><option>No</option><option>Yes</option></select></label>
        <label class="field">Still want in 7 days?<select name="week"><option>Not sure</option><option>Yes</option><option>No</option></select></label>
        <label class="field">Delays $${S.wealth.goal} goal?<select name="delays"><option>No</option><option>Yes</option></select></label>
        <label class="field">Own something similar?<select name="own"><option>No</option><option>Yes</option></select></label>
        <label class="field">Hours of work this costs<input name="hours" type="number"></label>
        <label class="field">Cheaper/free alternative exists?<select name="alt"><option>No</option><option>Yes</option></select></label>
        <button class="btn btn-primary" type="submit">Get verdict</button>
      </form><div id="impulse-result"></div>`, () => {
      $("#impulse-form").onsubmit = e => {
        e.preventDefault();
        const f = e.target;
        let score = 0;
        if (f.need.value === "Want") score++;
        if (f.social.value === "Yes") score += 2;
        if (f.week.value !== "Yes") score++;
        if (f.delays.value === "Yes") score += 2;
        if (f.own.value === "Yes") score++;
        if (f.alt.value === "Yes") score++;
        let verdict;
        if (score >= 6) verdict = "❌ Do not buy.";
        else if (score >= 4) verdict = "⏳ Wait 7 days.";
        else if (score >= 2) verdict = "⏳ Wait 48 hours.";
        else verdict = "✅ Buy now (or save instead if goal matters more).";
        $("#impulse-result").innerHTML = `<div class="rule-box"><p><b>${verdict}</b></p><p class="muted">Impulse score: ${score}/8</p>
          <button class="btn btn-small" id="add-cooldown">Add to cooldown list instead</button></div>`;
        $("#add-cooldown").onclick = () => {
          const days = score >= 4 ? 7 : 2;
          S.wealth.cooldownItems.push({ id: uid(), item: f.item.value, price: Number(f.price.value), addedDate: todayStr(),
            unlockDate: new Date(Date.now() + days * 86400000).toISOString().slice(0, 10), bought: false });
          save(); closeModal(); goTo("wealth");
        };
      };
    });

    renderCooldown();
    function renderCooldown() {
      const el = $("#cooldown-area");
      const items = w.cooldownItems;
      el.innerHTML = items.length ? items.map(it => {
        const unlocked = todayStr() >= it.unlockDate;
        return `<div class="crud-row"><div class="crud-row-fields">
          <span><b>${esc(it.item)}</b> — $${it.price}</span>
          <span>Unlocks: ${fmtDateNice(it.unlockDate)} ${unlocked ? "✅" : "⏳"}</span></div>
          <button class="btn-icon del-btn" data-cd="${it.id}">✕</button></div>`;
      }).join("") : emptyState("No items in cooldown. Add one via the impulse checker.");
      $$("[data-cd]", el).forEach(b => b.onclick = () => { w.cooldownItems = w.cooldownItems.filter(x => x.id !== b.dataset.cd); save(); renderCooldown(); });
    }
  }
};
function checkWealthAchievements() {
  const w = S.wealth;
  if (w.savings >= 25) unlockBadge("first25");
  if (w.savings >= 100) unlockBadge("first100");
  if (w.savings >= w.goal) { unlockBadge("goal500"); unlockAccessory("coinaura"); }
}

// ---------------------------------------------------------------------------
// PAGE: SOCIAL / CREATOR
// ---------------------------------------------------------------------------
const renderSocial = {
  html() {
    const sc = S.social;
    return `
    ${card("📈 Follower Growth", `${progressBar(sc.followers, sc.followerGoal, "Followers", "pbar-blue")}
      <label class="field">Current follower count<input type="number" id="followers-input" value="${sc.followers}"></label>`)}
    ${card("📝 Content This Year", `${progressBar(sc.postsThisYear, sc.postGoal, "Posts toward 35")}
      <p class="muted">Reels created: <b>${sc.reelsThisYear}</b></p>`)}

    ${card("🏎️ Paid Shoots Pipeline", `<div id="shoots-area"></div>`)}

    ${card("📸 Content Log", `<div id="content-crud"></div>`)}
    ${card("📬 Outreach Tracker", `<div id="outreach-crud"></div>`)}
    ${card("🎨 Photo Style Challenge Bank", `<div class="chip-grid">${PHOTO_STYLES.map(s => `<span class="chip">${s}</span>`).join("")}</div>`)}
    ${card("🗂️ Portfolio Checklist", `<div id="portfolio-check"></div>`)}
    ${card("🏅 Social Badges", `<div class="badge-grid">${BADGES.filter(b => b.cat === "Social").map(b => `
      <div class="badge-item ${S.badges.includes(b.id) ? "unlocked" : "locked"}"><span class="badge-emoji">${S.badges.includes(b.id) ? b.emoji : "❔"}</span><span class="badge-name">${b.name}</span></div>`).join("")}</div>`)}`;
  },
  init() {
    const sc = S.social;
    $("#followers-input").onchange = e => { sc.followers = Number(e.target.value); if (sc.followers >= sc.followerGoal) unlockBadge("grind250"); save(); };

    renderShoots();
    function renderShoots() {
      $("#shoots-area").innerHTML = sc.paidShoots.map(s => `
        <div class="shoot-card">
          <div class="shoot-head"><b>${esc(s.vehicle)}</b> — ${fmtDateNice(s.date)} — $${s.price} <span class="status-pill">${esc(s.status)}</span></div>
          <div class="prep-grid">${Object.entries(s.prep).map(([k, v]) => `
            <label class="check-item ${v ? "done" : ""}"><input type="checkbox" data-shoot="${s.id}" data-prep="${esc(k)}" ${v ? "checked" : ""}> ${esc(k)}</label>`).join("")}</div>
          <div class="shoot-actions">
            <select data-status="${s.id}">
              ${["Planned", "Confirmed", "Shot", "Editing", "Delivered"].map(st => `<option ${s.status === st ? "selected" : ""}>${st}</option>`).join("")}
            </select>
            <label class="field-check"><input type="checkbox" data-deposit="${s.id}" ${s.deposit ? "checked" : ""}> Deposit paid</label>
            <label class="field-check"><input type="checkbox" data-final="${s.id}" ${s.finalPayment ? "checked" : ""}> Final payment received</label>
          </div>
        </div>`).join("");
      $$("[data-prep]").forEach(cb => cb.onchange = () => {
        const s = sc.paidShoots.find(x => x.id === cb.dataset.shoot);
        s.prep[cb.dataset.prep] = cb.checked;
        if (cb.checked) addXP(S.meta.xpValues.shootPrepTask, "Shoot prep: " + cb.dataset.prep);
        if (cb.dataset.prep === "Complete shoot" && cb.checked) { addXP(S.meta.xpValues.paidShootComplete, "Paid shoot completed"); unlockBadge("amggtr"); unlockBadge("paidshoot"); }
        if (cb.dataset.prep === "Ask for feedback/testimonial" && cb.checked) addXP(S.meta.xpValues.testimonial, "Client testimonial");
        save(); renderShoots();
      });
      $$("[data-status]").forEach(sel => sel.onchange = () => { sc.paidShoots.find(x => x.id === sel.dataset.status).status = sel.value; save(); renderShoots(); });
      $$("[data-deposit]").forEach(cb => cb.onchange = () => { sc.paidShoots.find(x => x.id === cb.dataset.deposit).deposit = cb.checked; save(); });
      $$("[data-final]").forEach(cb => cb.onchange = () => {
        const s = sc.paidShoots.find(x => x.id === cb.dataset.final); s.finalPayment = cb.checked;
        if (cb.checked) { S.wealth.savings += s.price; S.wealth.transactions.push({ date: todayStr(), type: "income", category: "Photography gear", amount: s.price, note: "Paid shoot: " + s.vehicle }); addXP(S.meta.xpValues.paymentReceived, "Payment received"); unlockBadge("clientwork"); }
        save(); renderShoots();
      });
    }

    crudLog($("#content-crud"), () => sc.contentLog, [
      { key: "date", label: "Date", type: "date" },
      { key: "title", label: "Title", type: "text" },
      { key: "type", label: "Type", type: "select", options: ["post", "reel", "story"] },
      { key: "views", label: "Views", type: "number" }, { key: "likes", label: "Likes", type: "number" },
      { key: "comments", label: "Comments", type: "number" }, { key: "saves", label: "Saves", type: "number" },
      { key: "followersGained", label: "Followers gained", type: "number" }, { key: "notes", label: "Notes (what worked)", type: "text" }
    ], { addLabel: "Log content", onAdd: (row) => { if (row.type === "post") sc.postsThisYear++; if (row.type === "reel") sc.reelsThisYear++;
      addXP(S.meta.xpValues.contentPost, "Posted: " + row.title); bumpStat("creativity", 2); bumpStreak("content", row.date || todayStr());
      unlockAccessory("camera"); if (sc.contentLog.length >= 5) unlockBadge("portfolio"); save(); goTo("social"); } });

    crudLog($("#outreach-crud"), () => sc.outreach, [
      { key: "date", label: "Date", type: "date" }, { key: "who", label: "Contacted", type: "text" },
      { key: "replied", label: "Replied", type: "checkbox" }
    ], { addLabel: "Log outreach DM", onAdd: () => addXP(S.meta.xpValues.outreachDM, "Outreach DM sent") });

    $("#portfolio-check").innerHTML = checklistGrid(sc.portfolioChecklist);
    bindChecklist($("#portfolio-check"), sc.portfolioChecklist);
  }
};

// ---------------------------------------------------------------------------
// PAGE: SPIRITUAL (calm tone — no gamified emojis overload)
// ---------------------------------------------------------------------------
const renderSpiritual = {
  html() {
    const sp = S.spiritual;
    const today = todayStr();
    if (!sp.salahLog[today]) sp.salahLog[today] = { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false };
    const juz30Good = Object.values(sp.juz30).filter(s => ["Good", "Strong", "Recited to someone"].includes(s.status)).length;
    if (!sp.juz29Unlocked && juz30Good >= JUZ30_SURAHS.length * 0.7) { sp.juz29Unlocked = true; unlockBadge("juz30"); unlockAccessory("quranstand"); toast("Juz 30 repaired. Juz 29 campaign unlocked.", "badge"); save(); }
    const dow = new Date(today + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });

    return `
    <div class="card calm-card">
      <h3 class="card-title">🕌 Today's Salah</h3>
      <div class="salah-row">${Object.keys(sp.salahLog[today]).map(p => `
        <label class="check-item ${sp.salahLog[today][p] ? "done" : ""}"><input type="checkbox" data-salah="${p}" ${sp.salahLog[today][p] ? "checked" : ""}> ${p}</label>`).join("")}</div>
    </div>

    <div class="card calm-card">
      <h3 class="card-title">📖 This Week's Structure</h3>
      <p class="muted">Today (${dow}): <b>${SPIRITUAL_WEEK_PLAN[dow] || "Revision"}</b></p>
      <ul class="mini-list">${Object.entries(SPIRITUAL_WEEK_PLAN).map(([d, t]) => `<li>${d}: ${t}</li>`).join("")}</ul>
    </div>

    <div class="card calm-card">
      <h3 class="card-title">⏱️ Revision Session</h3>
      <div id="revision-crud"></div>
    </div>

    <div class="card calm-card">
      <h3 class="card-title">📗 Juz 30 Repair Campaign (${juz30Good}/${JUZ30_SURAHS.length})</h3>
      ${progressBar(juz30Good, JUZ30_SURAHS.length, "Juz 30 stability")}
      <div class="surah-list" id="juz30-list"></div>
    </div>

    <div class="card calm-card">
      <h3 class="card-title">📘 Juz 29 ${sp.juz29Unlocked ? "" : "(Locked — reach 70% on Juz 30 first)"}</h3>
      ${sp.juz29Unlocked ? `<div class="surah-list" id="juz29-list"></div>` : emptyState("Keep repairing Juz 30 to unlock this campaign.")}
    </div>

    <div class="card calm-card">
      <h3 class="card-title">🤲 Du'a List</h3>
      <div id="dua-crud"></div>
    </div>`;
  },
  init() {
    const sp = S.spiritual, today = todayStr();
    $$("[data-salah]").forEach(cb => cb.onchange = () => {
      sp.salahLog[today][cb.dataset.salah] = cb.checked;
      if (cb.checked) { addXP(S.meta.xpValues.salah, cb.dataset.salah + " prayed"); bumpStat("iman", 1);
        if (Object.values(sp.salahLog[today]).every(Boolean)) { bumpStreak("salah", today); if (S.streaks.salah >= 5) unlockBadge("salahstreak"); } }
      save(); goTo("spiritual");
    });

    crudLog($("#revision-crud"), () => sp.revisionSessions, [
      { key: "date", label: "Date", type: "date" }, { key: "minutes", label: "Minutes", type: "number" },
      { key: "focus", label: "Focus (surah)", type: "text" }, { key: "notes", label: "Mistakes/notes", type: "text" }
    ], { addLabel: "Log revision session", onAdd: (row) => { addXP(S.meta.xpValues.quranSession, "Qur'an revision: " + row.focus); bumpStat("iman", 2); bumpStreak("quran", row.date || today); save(); goTo("spiritual"); } });

    function renderJuz(listId, data, surahs) {
      $("#" + listId).innerHTML = surahs.map(name => `
        <div class="surah-row">
          <span class="surah-name">${name}</span>
          <select data-juz="${listId}" data-surah="${name}">
            ${REVISION_STATUSES.map(st => `<option ${data[name].status === st ? "selected" : ""}>${st}</option>`).join("")}
          </select>
          <span class="muted">${fmtDateNice(data[name].date)}</span>
        </div>`).join("");
      $$(`[data-juz="${listId}"]`).forEach(sel => sel.onchange = () => {
        data[sel.dataset.surah].status = sel.value; data[sel.dataset.surah].date = today;
        addXP(4, "Updated " + sel.dataset.surah); save(); goTo("spiritual");
      });
    }
    renderJuz("juz30-list", sp.juz30, JUZ30_SURAHS);
    if (sp.juz29Unlocked) renderJuz("juz29-list", sp.juz29, JUZ29_SURAHS);

    crudLog($("#dua-crud"), () => sp.duaList, [{ key: "date", label: "Date", type: "date" }, { key: "text", label: "Du'a / reflection", type: "textarea" }], { addLabel: "Add du'a" });
  }
};

// ---------------------------------------------------------------------------
// PAGE: HEALTH ("Training Camp")
// ---------------------------------------------------------------------------
const renderHealth = {
  html() {
    const h = S.health;
    const today = todayStr();
    return `
    <div class="card warn-card">
      ⚕️ This is a habit tracker, not medical advice. Involve a parent/guardian and doctor for decisions about diet, blood sugar, cholesterol, or skin (HS) concerns.
    </div>

    ${card("🎯 Daily Targets", `
      <label class="field">Calorie target<input type="number" id="cal-target" value="${h.calorieTarget}"></label>
      <label class="field">Protein target (g)<input type="number" id="protein-target" value="${h.proteinTarget}"></label>
      <label class="field">Water target (cups)<input type="number" id="water-target" value="${h.waterTarget}"></label>`)}

    ${card("🔥 Warm-Up Routine", `<div class="warmup-list">${WARMUP.map((w, i) => `
      <div class="warmup-row"><span>${w.name}</span><span class="muted">${w.time}s — ${w.target}</span>
      <button class="btn btn-small timer-btn" data-time="${w.time}">Start Timer</button></div>`).join("")}</div>
      <div id="timer-display"></div>`)}

    ${card("🏋️ Workout Trainer", `
      <select id="workout-day">${Object.entries(WORKOUTS).map(([k, w]) => `<option value="${k}">${w.label}</option>`).join("")}</select>
      <select id="workout-equip">${EQUIPMENT_OPTIONS.map(e => `<option>${e}</option>`).join("")}</select>
      <div id="workout-exercises"></div>
      <label class="field">Difficulty (1-10)<input type="number" id="workout-difficulty" min="1" max="10" value="5"></label>
      <label class="field field-wide">Notes<input type="text" id="workout-notes"></label>
      <button class="btn btn-primary" id="complete-workout">Mark Workout Complete</button>`)}

    ${card("🚴 Cardio Tracker", `<div id="cardio-crud"></div>`)}
    ${card("🍽️ Meal Log", `<div id="meal-crud"></div>`)}
    ${card("💧 Water & 🥤 Sugary Drinks Today", `
      <label class="field">Cups of water<input type="number" id="water-today" value="${h.waterLog[today] || 0}"></label>
      <label class="field">Sugary drinks<input type="number" id="sugar-today" value="${h.sugarDrinkLog[today] || 0}"></label>`)}
    ${card("😴 Sleep Log", `<div id="sleep-crud"></div>`)}
    ${card("⚖️ Weight Log (optional)", `<div id="weight-crud"></div>`)}
    ${card("🙂 Energy / Mood", `
      <label class="field">Mood (1-10)<input type="number" id="mood-today" min="1" max="10"></label>
      <label class="field">Energy (1-10)<input type="number" id="energy-today" min="1" max="10"></label>
      <button class="btn btn-small" id="save-mood">Save</button>`)}
    ${card("🩹 HS-Friendly Notes", `<ul class="mini-list">
      <li>Shower soon after sweating</li><li>Wear breathable clothes</li><li>Reduce friction/tight clothing under arms</li>
      <li>Avoid irritating underarms during a flare</li><li>Talk to a doctor if it worsens</li></ul>`)}
    ${card("🏅 Health Badges", `<div class="badge-grid">${BADGES.filter(b => b.cat === "Health").map(b => `
      <div class="badge-item ${S.badges.includes(b.id) ? "unlocked" : "locked"}"><span class="badge-emoji">${S.badges.includes(b.id) ? b.emoji : "❔"}</span><span class="badge-name">${b.name}</span></div>`).join("")}</div>`)}`;
  },
  init() {
    const h = S.health, today = todayStr();
    $("#cal-target").onchange = e => { h.calorieTarget = Number(e.target.value); save(); };
    $("#protein-target").onchange = e => { h.proteinTarget = Number(e.target.value); save(); };
    $("#water-target").onchange = e => { h.waterTarget = Number(e.target.value); save(); };

    $$(".timer-btn").forEach(btn => btn.onclick = () => runTimer(Number(btn.dataset.time)));
    function runTimer(seconds) {
      let remaining = seconds;
      const disp = $("#timer-display");
      clearInterval(window._timerInt);
      window._timerInt = setInterval(() => {
        disp.innerHTML = `<div class="timer-box">${remaining}s remaining</div>`;
        remaining--;
        if (remaining < 0) { clearInterval(window._timerInt); disp.innerHTML = `<div class="timer-box">Done! ✅</div>`; toast("Warm-up step complete", "info"); }
      }, 1000);
    }

    function renderExercises() {
      const key = $("#workout-day").value;
      $("#workout-exercises").innerHTML = `<ul class="mini-list">${WORKOUTS[key].exercises.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
    }
    $("#workout-day").onchange = renderExercises; renderExercises();

    $("#complete-workout").onclick = () => {
      const key = $("#workout-day").value;
      h.workoutLog.push({ date: today, day: WORKOUTS[key].label, equipment: $("#workout-equip").value,
        difficulty: Number($("#workout-difficulty").value), notes: $("#workout-notes").value, type: key === "lazy" ? "lazy" : "full" });
      const xp = key === "lazy" ? S.meta.xpValues.workoutLazy : S.meta.xpValues.workoutFull;
      addXP(xp, "Workout complete: " + WORKOUTS[key].label);
      bumpStat("health", key === "lazy" ? 1 : 3); bumpStreak("movement", today);
      const thisWeek = h.workoutLog.filter(w => weekStart(w.date) === weekStart(today));
      if (thisWeek.length >= 3) unlockBadge("workout3");
      save(); goTo("health");
    };

    crudLog($("#cardio-crud"), () => h.cardioLog, [
      { key: "date", label: "Date", type: "date" }, { key: "mode", label: "Mode", type: "select", options: ["treadmill", "bike", "walk"] },
      { key: "option", label: "Session type", type: "select", options: [...CARDIO_OPTIONS.treadmill, ...CARDIO_OPTIONS.bike, ...CARDIO_OPTIONS.walk] },
      { key: "duration", label: "Duration (min)", type: "number" },
      { key: "intensity", label: "Intensity", type: "select", options: ["Easy", "Moderate", "Hard"] },
      { key: "distance", label: "Distance (km, optional)", type: "number" }, { key: "notes", label: "Notes", type: "text" }
    ], { addLabel: "Log cardio session", onAdd: (row) => { addXP(S.meta.xpValues.cardio, "Cardio: " + row.mode); bumpStat("health", 1); bumpStreak("movement", row.date || today); save(); goTo("health"); } });

    crudLog($("#meal-crud"), () => h.mealLog, [
      { key: "date", label: "Date", type: "date" }, { key: "meal", label: "Meal", type: "text" },
      { key: "cal", label: "Calories", type: "number" }, { key: "protein", label: "Protein (g)", type: "number" },
      { key: "carbs", label: "Carbs (g)", type: "number" }, { key: "fiber", label: "Fiber (g)", type: "number" },
      { key: "homemade", label: "Homemade", type: "checkbox" }, { key: "hadProtein", label: "Had protein", type: "checkbox" },
      { key: "hadVeg", label: "Had veg/fruit", type: "checkbox" }, { key: "sugaryDrink", label: "Sugary drink", type: "checkbox" },
      { key: "notes", label: "Notes", type: "text" }
    ], { addLabel: "Log meal", onAdd: (row) => { addXP(S.meta.xpValues.meal, "Meal logged"); if (row.hadProtein) bumpStat("health", 1);
      const todaysMeals = h.mealLog.filter(m => m.date === today); if (todaysMeals.length >= 2 && todaysMeals.every(m => m.hadProtein)) unlockBadge("proteinmeal");
      save(); goTo("health"); } });

    $("#water-today").onchange = e => { h.waterLog[today] = Number(e.target.value); save(); addXP(S.meta.xpValues.water, "Water logged"); };
    $("#sugar-today").onchange = e => { h.sugarDrinkLog[today] = Number(e.target.value); save(); if (Number(e.target.value) === 0) unlockBadge("nosugarday"); };

    // Custom sleep form (object keyed by date, not array) — simple inline form
    $("#sleep-crud").innerHTML = `<form id="sleep-form"><label class="field">Date<input type="date" name="date" value="${today}"></label>
      <label class="field">Hours<input type="number" name="hours" step="0.5"></label>
      <label class="field">Quality (1-10)<input type="number" name="quality" min="1" max="10"></label>
      <button class="btn btn-primary" type="submit">Log sleep</button></form>
      <div class="crud-list">${Object.entries(h.sleepLog).slice(-7).reverse().map(([d, v]) => `<div class="crud-row"><div class="crud-row-fields"><span>${fmtDateNice(d)}</span><span>${v.hours}h</span><span>Quality ${v.quality}/10</span></div></div>`).join("") || emptyState("No sleep logged yet.")}</div>`;
    $("#sleep-form").onsubmit = e => { e.preventDefault(); const f = e.target; h.sleepLog[f.date.value] = { hours: Number(f.hours.value), quality: Number(f.quality.value) };
      const recent = Object.values(h.sleepLog).slice(-5); if (recent.length >= 5 && recent.every(s => s.hours >= 7)) unlockBadge("sleepreset");
      save(); goTo("health"); };

    crudLog($("#weight-crud"), () => h.weightLog, [{ key: "date", label: "Date", type: "date" }, { key: "weight", label: "Weight (lb)", type: "number" }], { addLabel: "Log weight" });

    $("#save-mood").onclick = () => { h.moodLog[today] = { mood: Number($("#mood-today").value), energy: Number($("#energy-today").value) }; save(); toast("Mood/energy saved"); };
  }
};

// ---------------------------------------------------------------------------
// PAGE: ACADEMICS ("Grade 11 Loadout")
// ---------------------------------------------------------------------------
const renderAcademics = {
  html() {
    const ac = S.academics;
    return `
    ${card("🎓 Grade 11 Loadout", `<p class="muted">Grade 10 average: ~87%. Target mindset: 90%+.</p>
      <div class="course-grid">${COURSES.map(c => {
        const cs = ac.courses[c.code];
        const done = Object.values(cs.topicsDone).filter(Boolean).length;
        return `<div class="course-card" data-course="${c.code}">
          <div class="course-head"><b>${c.code}</b><span class="muted">${c.name}</span></div>
          ${progressBar(done, c.topics.length, "Topics")}
          <div class="course-mini">Confidence: ${cs.confidence}/10 • Target: ${cs.targetGrade}% • Study: ${cs.studyHours}h</div>
          <button class="btn btn-small" data-open="${c.code}">Open</button>
        </div>`;
      }).join("")}</div>`)}

    ${card("⏱️ Study Session Log", `<div id="study-crud"></div>`)}

    ${card("🗡️ Academic Quest Chains", WEEKLY_CHAINS.filter(c => c.cat === "Academic").map(chain => renderChainCard(chain)).join(""))}

    ${card("🏅 Academic Badges", `<div class="badge-grid">${BADGES.filter(b => b.cat === "Academics").map(b => `
      <div class="badge-item ${S.badges.includes(b.id) ? "unlocked" : "locked"}"><span class="badge-emoji">${S.badges.includes(b.id) ? b.emoji : "❔"}</span><span class="badge-name">${b.name}</span></div>`).join("")}</div>`)}`;
  },
  init() {
    const ac = S.academics;
    $$("[data-open]").forEach(btn => btn.onclick = () => openCourseModal(btn.dataset.open));
    crudLog($("#study-crud"), () => ac.studyLog, [
      { key: "date", label: "Date", type: "date" }, { key: "course", label: "Course", type: "select", options: COURSES.map(c => c.code) },
      { key: "minutes", label: "Minutes", type: "number" }, { key: "topic", label: "Topic", type: "text" }, { key: "notes", label: "Notes", type: "text" }
    ], { addLabel: "Log study session", onAdd: (row) => {
      ac.courses[row.course].studyHours += row.minutes / 60;
      addXP(S.meta.xpValues.studySession, "Studied " + row.course); bumpStat("knowledge", 2); bumpStreak("study", row.date || todayStr());
      const totalHours = Object.values(ac.courses).reduce((s, c) => s + c.studyHours, 0);
      if (totalHours >= 10) unlockBadge("mindset90"); unlockAccessory("backpack");
      save(); goTo("academics");
    } });
    bindChains();
  }
};
function renderChainCard(chain) {
  const prog = getChainProgress(chain.id);
  return `<div class="chain-card ${prog.completed ? "chain-done" : ""}">
    <div class="chain-head"><b>${chain.name}</b>${prog.completed ? " ✅" : ""}</div>
    ${chain.steps.map((s, i) => `<label class="check-item ${prog.steps[i] ? "done" : ""}">
      <input type="checkbox" data-chain="${chain.id}" data-step="${i}" ${prog.steps[i] ? "checked" : ""}> ${s}</label>`).join("")}
    <p class="muted">Reward: ${BADGES.find(b => b.id === chain.reward)?.name || chain.reward}</p></div>`;
}
function bindChains() {
  $$("[data-chain]").forEach(cb => cb.onchange = () => { toggleChainStep(cb.dataset.chain, Number(cb.dataset.step)); goTo(currentPage); });
}
function openCourseModal(code) {
  const c = COURSES.find(x => x.code === code);
  const cs = S.academics.courses[code];
  openModal(`${c.code} — ${c.name}`, `
    <label class="field">Confidence (1-10)<input type="number" id="cm-conf" min="1" max="10" value="${cs.confidence}"></label>
    <label class="field">Target grade<input type="number" id="cm-target" value="${cs.targetGrade}"></label>
    <label class="field field-wide">Notes / weak topics<textarea id="cm-notes">${esc(cs.notes)}</textarea></label>
    <h4>Prep Checklist</h4>
    <div class="checklist">${c.topics.map(t => `<label class="check-item ${cs.topicsDone[t] ? "done" : ""}">
      <input type="checkbox" data-topic="${esc(t)}" ${cs.topicsDone[t] ? "checked" : ""}> ${esc(t)}</label>`).join("")}</div>
    <button class="btn btn-primary" id="cm-quiztest">Log mini-test / quiz complete (+${S.meta.xpValues.courseMiniTest} XP)</button>
  `, () => {
    $("#cm-conf").onchange = e => { cs.confidence = Number(e.target.value); save(); };
    $("#cm-target").onchange = e => { cs.targetGrade = Number(e.target.value); save(); };
    $("#cm-notes").onchange = e => { cs.notes = e.target.value; save(); };
    $$("[data-topic]").forEach(cb => cb.onchange = () => { cs.topicsDone[cb.dataset.topic] = cb.checked;
      if (cb.checked) addXP(S.meta.xpValues.coursePrepSession, code + ": " + cb.dataset.topic); save(); });
    $("#cm-quiztest").onclick = () => { addXP(S.meta.xpValues.courseMiniTest, code + " mini-test"); cs.quiz = true; save(); closeModal(); goTo("academics"); };
  });
}

// ---------------------------------------------------------------------------
// PAGE: RESUME / ACHIEVEMENTS
// ---------------------------------------------------------------------------
const renderResume = {
  html() {
    const r = S.resume;
    return `
    ${card("📋 Career Quest Board — Opportunities Pipeline", `<div id="opp-area"></div>`)}
    ${card("🏆 Achievement Log", `<div id="achieve-crud"></div>`)}
    ${card("🤝 Volunteer Tracker", `<div id="volunteer-crud"></div>`)}
    ${card("📄 Resume Checklist", `<div id="resume-check"></div>`)}
    ${card("💡 Resume Bullet Suggestions", `<div id="bullet-suggestions"></div>`)}
    ${card("🏅 Resume Badges", `<div class="badge-grid">${BADGES.filter(b => b.cat === "Resume").map(b => `
      <div class="badge-item ${S.badges.includes(b.id) ? "unlocked" : "locked"}"><span class="badge-emoji">${S.badges.includes(b.id) ? b.emoji : "❔"}</span><span class="badge-name">${b.name}</span></div>`).join("")}</div>`)}`;
  },
  init() {
    const r = S.resume;
    function renderOpps() {
      $("#opp-area").innerHTML = r.opportunities.map((o, i) => {
        const overdue = o.status === "Waiting to hear back" && o.dateApplied && daysBetween(o.dateApplied, todayStr()) >= 5;
        return `<div class="opp-card">
          <div class="opp-head"><b>${esc(o.org)}</b> — ${esc(o.role)} <span class="status-pill">${esc(o.status)}</span></div>
          <div class="opp-mini">Type: ${esc(o.type)} • Applied: ${fmtDateNice(o.dateApplied)}</div>
          <select data-opp="${i}">${["Interested", "Applied", "Waiting to hear back", "Interview scheduled", "Accepted", "Rejected", "Completed"].map(st => `<option ${o.status === st ? "selected" : ""}>${st}</option>`).join("")}</select>
          ${overdue ? `<button class="btn btn-small" data-followup="${i}">Generate follow-up message</button>` : ""}
        </div>`;
      }).join("");
      $$("[data-opp]").forEach(sel => sel.onchange = () => {
        const o = r.opportunities[Number(sel.dataset.opp)]; const prev = o.status; o.status = sel.value;
        if (sel.value === "Interview scheduled" && prev !== "Interview scheduled") addXP(S.meta.xpValues.interview, "Interview: " + o.org);
        if (sel.value === "Accepted" && prev !== "Accepted") { addXP(S.meta.xpValues.roleAccepted, "Role accepted: " + o.org); unlockBadge("campmedia"); unlockBadge("commmedia"); }
        save(); renderOpps();
      });
      $$("[data-followup]").forEach(btn => btn.onclick = () => {
        const o = r.opportunities[Number(btn.dataset.followup)];
        openModal("Follow-up message draft", `<textarea rows="8" style="width:100%" readonly>Assalamu Alaikum, I hope you're doing well. I just wanted to follow up regarding the Social Media Specialist opportunity for the summer camp. I'm still very interested and would be happy to help with photography, video, posts, reels, and general content support. Please let me know if there are any updates or anything else you need from me. JazakAllah khair.</textarea>
          <button class="btn btn-primary" id="mark-followup">Mark follow-up sent (+${S.meta.xpValues.followUpSent} XP)</button>`, () => {
          $("#mark-followup").onclick = () => { addXP(S.meta.xpValues.followUpSent, "Follow-up sent: " + o.org); closeModal(); };
        });
      });
    }
    renderOpps();

    crudLog($("#achieve-crud"), () => r.achievements, [
      { key: "date", label: "Date", type: "date" }, { key: "text", label: "Achievement", type: "text" },
      { key: "category", label: "Category", type: "select", options: ["Academics", "Social", "Driving", "Health", "Wealth", "Volunteering", "Other"] }
    ], { addLabel: "Log achievement", onAdd: () => { addXP(20, "Achievement logged"); unlockAccessory("trophy"); unlockBadge("resumebuilder"); save(); goTo("resume"); } });

    crudLog($("#volunteer-crud"), () => r.volunteerLog, [
      { key: "org", label: "Organization", type: "text" }, { key: "role", label: "Role", type: "text" },
      { key: "date", label: "Date", type: "date" }, { key: "hours", label: "Hours", type: "number" },
      { key: "contact", label: "Supervisor/contact", type: "text" }, { key: "desc", label: "What I did", type: "textarea" },
      { key: "skills", label: "Skills used", type: "text" }, { key: "resumeReady", label: "Resume-ready", type: "checkbox" }
    ], { addLabel: "Log volunteer entry", onAdd: (row) => {
      addXP(S.meta.xpValues.volunteerLog, "Volunteering: " + row.org); unlockBadge("communitycontrib"); unlockAccessory("volunteer");
      $("#bullet-suggestions").innerHTML = `<div class="rule-box">💡 "Captured and edited event photography/media for ${esc(row.org)}, supporting digital content and community engagement."</div>` + $("#bullet-suggestions").innerHTML;
      save(); goTo("resume");
    } });

    $("#resume-check").innerHTML = checklistGrid(r.resumeChecklist);
    bindChecklist($("#resume-check"), r.resumeChecklist);
  }
};

// ---------------------------------------------------------------------------
// PAGE: DRIVING ("Road to G2")
// ---------------------------------------------------------------------------
const renderDriving = {
  html() {
    const d = S.driving;
    const daysToG2 = daysBetween(todayStr(), d.g2EligibleDate);
    const readyCount = Object.values(d.g2Checklist).filter(Boolean).length;
    return `
    ${card("🚗 Road to G2", `
      <p class="muted">Current driving lesson: <b>#${d.lessonNumber}</b></p>
      <div class="g2-banner">🗓️ G2 road test eligible in <b>${daysToG2}</b> days (first week of January 2027)</div>
      ${progressBar(readyCount, G2_CHECKLIST.length, "G2 Readiness")}`)}

    ${card("📒 Driving Lesson Log", `<div id="lesson-crud"></div>`)}
    ${card("🅿️ Supervised Practice Log (with parent)", `<div id="practice-crud"></div>`)}
    ${card("✅ G2 Readiness Checklist", `<div id="g2-check"></div>`)}
    ${card("🏅 Driving Badges", `<div class="badge-grid">${BADGES.filter(b => b.cat === "Driving").map(b => `
      <div class="badge-item ${S.badges.includes(b.id) ? "unlocked" : "locked"}"><span class="badge-emoji">${S.badges.includes(b.id) ? b.emoji : "❔"}</span><span class="badge-name">${b.name}</span></div>`).join("")}</div>`)}`;
  },
  init() {
    const d = S.driving;
    crudLog($("#lesson-crud"), () => d.lessonLog, [
      { key: "lessonNumber", label: "Lesson #", type: "number", default: d.lessonNumber + 1 },
      { key: "date", label: "Date", type: "date" }, { key: "duration", label: "Duration (min)", type: "number" },
      { key: "skills", label: "Skills practised", type: "text" }, { key: "feedback", label: "Instructor feedback", type: "textarea" },
      { key: "improved", label: "What improved", type: "text" }, { key: "needsWork", label: "Needs work", type: "text" },
      { key: "confidence", label: "Confidence (1-10)", type: "number" }, { key: "nextFocus", label: "Next lesson focus", type: "text" }
    ], { addLabel: "Log lesson", onAdd: (row) => {
      d.lessonNumber = Math.max(d.lessonNumber, row.lessonNumber);
      addXP(S.meta.xpValues.drivingLesson, "Lesson #" + row.lessonNumber);
      if (row.feedback) addXP(S.meta.xpValues.instructorFeedback, "Instructor feedback recorded");
      bumpStat("discipline", 2); unlockAccessory("wheel");
      if (d.lessonNumber >= 10) { unlockBadge("lesson10"); unlockBadge("instructorapproved"); }
      save(); goTo("driving");
    } });

    crudLog($("#practice-crud"), () => d.practiceLog, [
      { key: "date", label: "Date", type: "date" }, { key: "duration", label: "Duration (min)", type: "number" },
      { key: "supervisor", label: "Supervised by", type: "text" }, { key: "notes", label: "Notes", type: "text" }
    ], { addLabel: "Log supervised practice", onAdd: () => { addXP(15, "Supervised practice logged"); unlockBadge("calmdriver"); save(); goTo("driving"); } });

    $("#g2-check").innerHTML = checklistGrid(d.g2Checklist);
    bindChecklist($("#g2-check"), d.g2Checklist, (obj) => {
      const doneCount = Object.values(obj).filter(Boolean).length;
      if (doneCount === G2_CHECKLIST.length) unlockBadge("roadtestready");
    });
  }
};

// ---------------------------------------------------------------------------
// PAGE: PROJECTS ("Side Quest Lab")
// ---------------------------------------------------------------------------
const renderProjects = {
  html() { return `${card("🧪 Side Quest Lab", `<div id="proj-crud"></div>`)}
    ${card("🏅 Project Badges", `<div class="badge-grid">${BADGES.filter(b => b.cat === "Projects").map(b => `
      <div class="badge-item ${S.badges.includes(b.id) ? "unlocked" : "locked"}"><span class="badge-emoji">${S.badges.includes(b.id) ? b.emoji : "❔"}</span><span class="badge-name">${b.name}</span></div>`).join("")}</div>`)}`; },
  init() {
    crudLog($("#proj-crud"), () => S.projects.list, [
      { key: "name", label: "Project name", type: "text" },
      { key: "category", label: "Category", type: "select", options: ["Photography", "3D printing", "Coding/web apps", "Video editing", "Fitness", "Islamic knowledge", "School prep", "Business/money", "Community service"] },
      { key: "status", label: "Status", type: "select", options: ["Idea", "Active", "Completed"] },
      { key: "difficulty", label: "Difficulty (1-5)", type: "number" }, { key: "notes", label: "Notes/milestones", type: "textarea" }
    ], { addLabel: "Add project", onAdd: (row) => {
      addXP(S.meta.xpValues.projectMilestone, "Project logged: " + row.name); bumpStat("creativity", 2); unlockAccessory("goggles");
      if (row.status === "Completed") unlockBadge("sidequest");
      unlockBadge("builder"); save(); goTo("projects");
    } });
  }
};

// ---------------------------------------------------------------------------
// PAGE: PLANNER ("Mission Control")
// ---------------------------------------------------------------------------
const renderPlanner = {
  html() {
    const today = todayStr();
    if (!S.planner.daily[today]) S.planner.daily[today] = { top3: "", minimum: "", avoid: "", mainQuest: "", sideQuest: "", recovery: "", review: { completed: "", avoided: "", wasted: "", proud: "", change: "", rating: 5 } };
    const p = S.planner.daily[today];
    return `${card("🗓️ Mission Control — " + fmtDateNice(today), `
      <form id="plan-form">
        <label class="field field-wide">Top 3 things for a successful day<textarea name="top3" rows="2">${esc(p.top3)}</textarea></label>
        <label class="field field-wide">Minimum version if lazy<input name="minimum" value="${esc(p.minimum)}"></label>
        <label class="field field-wide">One thing to avoid<input name="avoid" value="${esc(p.avoid)}"></label>
        <label class="field field-wide">Main quest today<input name="mainQuest" value="${esc(p.mainQuest)}"></label>
        <label class="field field-wide">Side quest today<input name="sideQuest" value="${esc(p.sideQuest)}"></label>
        <label class="field field-wide">Recovery task if I mess up<input name="recovery" value="${esc(p.recovery)}"></label>
        <button class="btn btn-primary" type="submit">Save plan</button>
      </form>`)}
      ${card("🌙 Daily Review", `
        <form id="review-form">
          <label class="field field-wide">What did I complete?<input name="completed" value="${esc(p.review.completed)}"></label>
          <label class="field field-wide">What did I avoid?<input name="avoided" value="${esc(p.review.avoided)}"></label>
          <label class="field field-wide">What wasted my time?<input name="wasted" value="${esc(p.review.wasted)}"></label>
          <label class="field field-wide">What am I proud of?<input name="proud" value="${esc(p.review.proud)}"></label>
          <label class="field field-wide">What changes tomorrow?<input name="change" value="${esc(p.review.change)}"></label>
          <label class="field">Rate the day (1-10)<input type="number" name="rating" min="1" max="10" value="${p.review.rating}"></label>
          <button class="btn btn-primary" type="submit">Save review (+${S.meta.xpValues.journalEntry} XP)</button>
        </form>`)}`;
  },
  init() {
    const p = S.planner.daily[todayStr()];
    $("#plan-form").onsubmit = e => { e.preventDefault(); const f = new FormData(e.target);
      ["top3", "minimum", "avoid", "mainQuest", "sideQuest", "recovery"].forEach(k => p[k] = f.get(k));
      save(); addXP(S.meta.xpValues.logEntry, "Daily plan set"); toast("No zero days. Log the tiny version.", "info"); goTo("planner"); };
    $("#review-form").onsubmit = e => { e.preventDefault(); const f = new FormData(e.target);
      ["completed", "avoided", "wasted", "proud", "change"].forEach(k => p.review[k] = f.get(k));
      p.review.rating = Number(f.get("rating"));
      save(); addXP(S.meta.xpValues.journalEntry, "Daily review complete"); goTo("planner"); };
  }
};

// ---------------------------------------------------------------------------
// PAGE: MEALS
// ---------------------------------------------------------------------------
const renderMeals = {
  html() {
    return `${card("🍽️ Quick-Add Common Meals", `<div class="chip-grid" id="common-meals">${S.meals.commonMeals.map((m, i) => `
      <button class="chip chip-btn" data-meal="${i}">${esc(m.name)} (${m.cal}cal / ${m.protein}g)</button>`).join("")}</div>`)}
      ${card("🛒 Grocery List", `<div id="grocery-crud"></div>`)}
      ${card("📅 Weekly Meal Plan Notes", `<textarea id="weekly-plan-notes" rows="4" style="width:100%">${esc(S.meals.weeklyPlan.notes || "")}</textarea>
      <button class="btn btn-small" id="save-weekly-plan">Save</button>`)}`;
  },
  init() {
    $$("[data-meal]").forEach(btn => btn.onclick = () => {
      const m = S.meals.commonMeals[Number(btn.dataset.meal)];
      S.health.mealLog.push({ date: todayStr(), meal: m.name, cal: m.cal, protein: m.protein, carbs: 0, fiber: 0, homemade: true, hadProtein: m.protein > 10, hadVeg: false, sugaryDrink: false, notes: "quick-add" });
      addXP(S.meta.xpValues.meal, "Quick-added meal: " + m.name); save(); toast(`Logged: ${m.name}`);
    });
    crudLog($("#grocery-crud"), () => S.meals.groceryList, [{ key: "item", label: "Item", type: "text" }, { key: "bought", label: "Bought", type: "checkbox" }], { addLabel: "Add grocery item" });
    $("#save-weekly-plan").onclick = () => { S.meals.weeklyPlan.notes = $("#weekly-plan-notes").value; save(); toast("Saved"); };
  }
};

// ---------------------------------------------------------------------------
// PAGE: JOURNAL ("Battle Log")
// ---------------------------------------------------------------------------
const renderJournal = {
  html() {
    const today = todayStr();
    if (!S.journal.daily[today]) S.journal.daily[today] = { mood: 5, energy: 5, gratitude: "", dua: "", lessons: "", wins: "", losses: "", fix: "" };
    const j = S.journal.daily[today];
    return `${card("📔 Battle Log — " + fmtDateNice(today), `
      <form id="journal-form">
        <label class="field">Mood (1-10)<input type="number" name="mood" min="1" max="10" value="${j.mood}"></label>
        <label class="field">Energy (1-10)<input type="number" name="energy" min="1" max="10" value="${j.energy}"></label>
        <label class="field field-wide">Gratitude<input name="gratitude" value="${esc(j.gratitude)}"></label>
        <label class="field field-wide">Du'a / reflection<input name="dua" value="${esc(j.dua)}"></label>
        <label class="field field-wide">Lessons learned<input name="lessons" value="${esc(j.lessons)}"></label>
        <label class="field field-wide">Wins<input name="wins" value="${esc(j.wins)}"></label>
        <label class="field field-wide">Losses<input name="losses" value="${esc(j.losses)}"></label>
        <label class="field field-wide">What to fix<input name="fix" value="${esc(j.fix)}"></label>
        <button class="btn btn-primary" type="submit">Save entry (+${S.meta.xpValues.journalEntry} XP)</button>
      </form>`)}
      ${card("📜 Recent Entries", `<div class="crud-list">${Object.entries(S.journal.daily).slice(-7).reverse().map(([d, e]) => `
        <div class="crud-row"><div class="crud-row-fields"><span><b>${fmtDateNice(d)}</b></span><span>Mood ${e.mood}/10</span><span>${esc(e.wins)}</span></div></div>`).join("") || emptyState("No entries yet.")}</div>`)}`;
  },
  init() {
    const j = S.journal.daily[todayStr()];
    $("#journal-form").onsubmit = e => { e.preventDefault(); const f = new FormData(e.target);
      ["mood", "energy"].forEach(k => j[k] = Number(f.get(k)));
      ["gratitude", "dua", "lessons", "wins", "losses", "fix"].forEach(k => j[k] = f.get(k));
      save(); addXP(S.meta.xpValues.journalEntry, "Journal entry saved"); goTo("journal");
    };
  }
};

// ---------------------------------------------------------------------------
// PAGE: BOSS BATTLE (weekly review)
// ---------------------------------------------------------------------------
const renderBoss = {
  html() {
    const wk = weekStart(todayStr());
    let battle = S.bossBattles.find(b => b.week === wk);
    if (!battle) { battle = { week: wk, results: {}, passed: false, resolved: false }; S.bossBattles.push(battle); save(); }
    const passedCount = Object.values(battle.results).filter(Boolean).length;
    return `${card("👑 Weekly Boss Battle — Week of " + fmtDateNice(wk), `
      <p class="muted">Check off what you accomplished this week. Beat 6+/9 to win.</p>
      <div class="checklist">${BOSS_BATTLE_CRITERIA.map(c => `<label class="check-item ${battle.results[c.key] ? "done" : ""}">
        <input type="checkbox" data-boss="${c.key}" ${battle.results[c.key] ? "checked" : ""}> ${c.text}</label>`).join("")}</div>
      ${progressBar(passedCount, BOSS_BATTLE_CRITERIA.length, "Boss damage dealt")}
      ${battle.resolved ? `<div class="rule-box">${battle.passed ? "🏆 Boss defeated! Reward claimed." : "💀 Boss battle failed, but the run is not over. Recovery plan unlocked."}</div>`
        : `<button class="btn btn-primary" id="resolve-boss">Resolve Boss Battle</button>`}`)}
      ${card("📜 Past Boss Battles", `<div class="crud-list">${S.bossBattles.slice().reverse().slice(0, 8).map(b => `
        <div class="crud-row"><div class="crud-row-fields"><span>Week of ${fmtDateNice(b.week)}</span><span>${b.resolved ? (b.passed ? "🏆 Won" : "💀 Lost") : "⏳ Open"}</span></div></div>`).join("")}</div>`)}`;
  },
  init() {
    const wk = weekStart(todayStr());
    const battle = S.bossBattles.find(b => b.week === wk);
    $$("[data-boss]").forEach(cb => cb.onchange = () => { battle.results[cb.dataset.boss] = cb.checked; save(); goTo("boss"); });
    const btn = $("#resolve-boss");
    if (btn) btn.onclick = () => {
      const passedCount = Object.values(battle.results).filter(Boolean).length;
      battle.resolved = true; battle.passed = passedCount >= 6;
      if (battle.passed) { addXP(S.meta.xpValues.bossBattleWin, "Boss battle won"); unlockBadge("bossweek"); unlockAccessory("crown");
        if (S.meta.level >= 25) unlockAccessory("cape"); }
      else { toast("Boss battle failed, but the run is not over. Recovery plan unlocked.", "warn");
        openModal("Recovery Plan", `<p>${randomLine(PUNISHMENTS.general)}</p><p>${randomLine(PUNISHMENTS.health)}</p><button class="btn btn-primary" id="ack-recovery">Got it</button>`, () => { $("#ack-recovery").onclick = closeModal; }); }
      save(); goTo("boss");
    };
  }
};

// ---------------------------------------------------------------------------
// Cloud Sync card (used on Settings page — logic lives in cloud.js)
// ---------------------------------------------------------------------------
function cloudSyncCardHtml() {
  if (typeof cloudAvailable !== "function" || !cloudAvailable()) {
    return `<p class="muted">Cloud sync isn't configured yet. Fill in <code>firebase-config.js</code> with your own Firebase project keys to sync progress across your laptop and phone. See README.md &rarr; "Firebase Setup". The app works fully without this — everything just stays on this device.</p>`;
  }
  if (!CloudSync.user) {
    return `<p class="muted">Sign in to back up your progress to the cloud and pull it up on another device.</p>
      <button class="btn btn-primary" id="cloud-signin">Sign in with Google</button>`;
  }
  return `
    <p><b>Signed in as:</b> ${esc(CloudSync.user.displayName || CloudSync.user.email)}</p>
    <p><span id="sync-badge-settings" class="sync-badge sync-${CloudSync.status}">${esc(syncStatusLabel())}</span></p>
    <div class="hero-actions">
      <button class="btn btn-primary" id="cloud-sync-now">🔄 Sync Now</button>
      <button class="btn" id="cloud-signout">Sign Out</button>
    </div>`;
}

// ---------------------------------------------------------------------------
// PAGE: SETTINGS
// ---------------------------------------------------------------------------
const renderSettings = {
  html() {
    return `${card("☁️ Cloud Sync", cloudSyncCardHtml())}
    ${card("⚙️ Profile & Goals", `
      <label class="field">Name<input id="set-name" value="${esc(S.meta.name)}"></label>
      <label class="field">Summer start date<input type="date" id="set-summer" value="${S.meta.summerStart}"></label>
      <label class="field">School start date<input type="date" id="set-school" value="${S.meta.schoolStart}"></label>
      <label class="field">Savings goal ($)<input type="number" id="set-savegoal" value="${S.wealth.goal}"></label>
      <label class="field">Follower goal<input type="number" id="set-followgoal" value="${S.social.followerGoal}"></label>
      <label class="field">Post goal<input type="number" id="set-postgoal" value="${S.social.postGoal}"></label>`)}

    ${card("🎚️ XP Values", `<div class="xp-grid">${Object.entries(S.meta.xpValues).map(([k, v]) => `
      <label class="field"><span class="xp-label">${k}</span><input type="number" data-xpkey="${k}" value="${v}"></label>`).join("")}</div>`)}

    ${card("🎨 Display", `
      <label class="field-check"><input type="checkbox" id="set-dark" ${S.meta.darkMode ? "checked" : ""}> Dark mode</label>
      <label class="field-check"><input type="checkbox" id="set-reduced" ${S.meta.reducedMotion ? "checked" : ""}> Reduced motion</label>`)}

    ${card("💾 Data Management", `
      <button class="btn" id="export-btn">Export backup (JSON)</button>
      <label class="btn" id="import-label">Import backup<input type="file" id="import-file" accept="application/json" style="display:none"></label>
      <button class="btn btn-danger" id="reset-btn">Reset all data</button>`)}`;
  },
  init() {
    if ($("#cloud-signin")) $("#cloud-signin").onclick = signInGoogle;
    if ($("#cloud-signout")) $("#cloud-signout").onclick = signOutCloud;
    if ($("#cloud-sync-now")) $("#cloud-sync-now").onclick = manualSync;
    $("#set-name").onchange = e => { S.meta.name = e.target.value; save(); };
    $("#set-summer").onchange = e => { S.meta.summerStart = e.target.value; save(); };
    $("#set-school").onchange = e => { S.meta.schoolStart = e.target.value; save(); };
    $("#set-savegoal").onchange = e => { S.wealth.goal = Number(e.target.value); save(); };
    $("#set-followgoal").onchange = e => { S.social.followerGoal = Number(e.target.value); save(); };
    $("#set-postgoal").onchange = e => { S.social.postGoal = Number(e.target.value); save(); };
    $$("[data-xpkey]").forEach(inp => inp.onchange = () => { S.meta.xpValues[inp.dataset.xpkey] = Number(inp.value); save(); });
    $("#set-dark").onchange = e => { S.meta.darkMode = e.target.checked; applyTheme(); save(); };
    $("#set-reduced").onchange = e => { S.meta.reducedMotion = e.target.checked; applyTheme(); save(); };
    $("#export-btn").onclick = () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `summer2026-backup-${todayStr()}.json`; a.click();
      toast("Backup exported");
    };
    $("#import-file").onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { try { S = deepMerge(buildDefaultState(), JSON.parse(reader.result)); save(); toast("Backup imported"); applyTheme(); refreshHeader(); goTo("settings"); } catch (err) { toast("Invalid backup file", "warn"); } };
      reader.readAsText(file);
    };
    $("#reset-btn").onclick = () => {
      if (confirm("This will permanently delete ALL your Summer Level-Up data. Are you sure?")) {
        if (confirm("Really sure? This cannot be undone.")) { localStorage.removeItem(STORAGE_KEY); S = buildDefaultState(); save(); applyTheme(); refreshHeader(); goTo("home"); toast("Data reset"); }
      }
    };
  }
};

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
function applyTheme() {
  document.body.classList.toggle("light", !S.meta.darkMode);
  document.body.classList.toggle("reduced-motion", S.meta.reducedMotion);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function buildNav() {
  const nav = $("#nav-list");
  nav.innerHTML = PAGES.map(([id, emoji, label]) => `<button class="nav-btn" data-page="${id}"><span class="nav-emoji">${emoji}</span><span class="nav-label">${label}</span></button>`).join("");
  $$(".nav-btn", nav).forEach(b => b.onclick = () => goTo(b.dataset.page));
}

function init() {
  S = load();
  save(); // bootstrap write — _appReady is still false here, so no timestamp bump / cloud push yet
  _appReady = true;
  applyTheme();
  buildNav();
  refreshHeader();
  goTo("home");
  if (typeof initCloudSync === "function") initCloudSync();
}
document.addEventListener("DOMContentLoaded", init);
