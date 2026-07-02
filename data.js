/* ============================================================================
   data.js — Static config + default seed state for Summer Level-Up
   Edit the values in DEFAULT_STATE / CONFIG to customize goals, XP, quests.
   This file only defines data — no rendering logic lives here.
   ============================================================================ */

// ---- XP required per level (levels get progressively harder) ----
function xpForLevel(level) {
  return 100 + (level - 1) * 60; // level 1->2 needs 100xp, scales up
}

// ---- Level titles (unlocked at these levels) ----
const LEVEL_TITLES = [
  [1, "Summer Noob"], [3, "Early Riser"], [5, "Discipline Recruit"],
  [7, "Habit Hacker"], [10, "Routine Builder"], [13, "Momentum Keeper"],
  [15, "Focused Student"], [18, "Grinder"], [20, "Consistency Warrior"],
  [23, "Proof Collector"], [25, "Grade 11 Ready"], [28, "Elite Operator"],
  [30, "Summer Legend"]
];

function titleForLevel(level) {
  let t = LEVEL_TITLES[0][1];
  for (const [lvl, title] of LEVEL_TITLES) { if (level >= lvl) t = title; }
  return t;
}

// ---- XP values (editable in Settings) ----
const DEFAULT_XP_VALUES = {
  dailyQuest: 15,
  weeklyQuest: 60,
  milestone: 150,
  logEntry: 10,
  workoutFull: 40,
  workoutLazy: 15,
  cardio: 20,
  meal: 8,
  water: 5,
  salah: 8,
  quranSession: 25,
  studySession: 25,
  savingsLog: 15,
  contentPost: 25,
  outreachDM: 8,
  drivingLesson: 30,
  instructorFeedback: 10,
  shootPrepTask: 15,
  paidShootComplete: 100,
  paymentReceived: 75,
  testimonial: 50,
  followUpSent: 25,
  interview: 75,
  roleAccepted: 150,
  coursePrepSession: 25,
  courseMiniTest: 50,
  journalEntry: 10,
  bossBattleWin: 150,
  volunteerLog: 20,
  projectMilestone: 20
};

// ---- Accessories (unlocked by streaks/chains, equipped on character) ----
const ACCESSORIES = [
  { id: "shoes", name: "Running Shoes", emoji: "👟", desc: "7-day movement streak" },
  { id: "camera", name: "Camera Strap", emoji: "📷", desc: "Content creator streak" },
  { id: "quranstand", name: "Qur'an Stand", emoji: "📖", desc: "Juz 30 repaired" },
  { id: "backpack", name: "Backpack", emoji: "🎒", desc: "Academic study streak" },
  { id: "coinaura", name: "Gold Coin Aura", emoji: "🪙", desc: "Wealth savings progress" },
  { id: "wheel", name: "Steering Wheel Badge", emoji: "🛞", desc: "Driving practice" },
  { id: "volunteer", name: "Volunteer Badge", emoji: "🤝", desc: "Resume / volunteering" },
  { id: "trophy", name: "Trophy", emoji: "🏆", desc: "Achievement logged" },
  { id: "goggles", name: "Lab Goggles", emoji: "🥽", desc: "Side quest / project complete" },
  { id: "crown", name: "Crown", emoji: "👑", desc: "Boss battle streak" },
  { id: "cape", name: "Cape", emoji: "🦸", desc: "Summer legend status" },
  { id: "roadmap", name: "Road Map", emoji: "🗺️", desc: "G2 readiness progress" }
];

// ---- Badges (all badges in the game, unlocked via logic in app.js) ----
const BADGES = [
  { id: "first25", name: "First $25 Saved", emoji: "💵", cat: "Wealth" },
  { id: "first100", name: "First $100 Saved", emoji: "💰", cat: "Wealth" },
  { id: "noimpulse7", name: "No Impulse Buy 7 Days", emoji: "🛡️", cat: "Wealth" },
  { id: "halfrule5", name: "Saved 50% x5", emoji: "📊", cat: "Wealth" },
  { id: "goal500", name: "$500 Goal Hit", emoji: "🎯", cat: "Wealth" },
  { id: "antiimpulse", name: "Anti-Impulse Shield", emoji: "🛡️", cat: "Wealth" },
  { id: "finance", name: "Financial Discipline", emoji: "🧠", cat: "Wealth" },
  { id: "camerastrap", name: "Camera Strap Unlocked", emoji: "📷", cat: "Social" },
  { id: "lens", name: "Lens Badge", emoji: "🔭", cat: "Social" },
  { id: "grind250", name: "250 Follower Grind", emoji: "📈", cat: "Social" },
  { id: "contentstreak", name: "Content Streak", emoji: "🔥", cat: "Social" },
  { id: "portfolio", name: "Portfolio Builder", emoji: "🗂️", cat: "Social" },
  { id: "paidshoot", name: "Paid Shoot Secured", emoji: "💳", cat: "Social" },
  { id: "amggtr", name: "AMG GT-R Quest", emoji: "🏎️", cat: "Social" },
  { id: "clientwork", name: "Client Work", emoji: "🤝", cat: "Social" },
  { id: "juz30", name: "Juz 30 Repaired", emoji: "📗", cat: "Spiritual" },
  { id: "quran7", name: "7-Day Qur'an Streak", emoji: "🕌", cat: "Spiritual" },
  { id: "salahstreak", name: "Salah Consistency", emoji: "🤲", cat: "Spiritual" },
  { id: "movement7", name: "7-Day Movement Streak", emoji: "🏃", cat: "Health" },
  { id: "workout3", name: "3 Workouts This Week", emoji: "🏋️", cat: "Health" },
  { id: "nosugarday", name: "No Sugary Drinks Day", emoji: "💧", cat: "Health" },
  { id: "proteinmeal", name: "Protein With Every Meal", emoji: "🍗", cat: "Health" },
  { id: "sleepreset", name: "Sleep Reset", emoji: "😴", cat: "Health" },
  { id: "mindset90", name: "90% Mindset", emoji: "🎓", cat: "Academics" },
  { id: "studystreak", name: "Study Streak", emoji: "📚", cat: "Academics" },
  { id: "mcr3u", name: "MCR3U Ready", emoji: "📐", cat: "Academics" },
  { id: "eng3u", name: "ENG3U Writer", emoji: "✍️", cat: "Academics" },
  { id: "stem", name: "STEM Loadout", emoji: "🧪", cat: "Academics" },
  { id: "business", name: "Business Student", emoji: "💼", cat: "Academics" },
  { id: "religions", name: "Thoughtful Scholar", emoji: "🕊️", cat: "Academics" },
  { id: "resumebuilder", name: "Resume Builder", emoji: "📄", cat: "Resume" },
  { id: "communitycontrib", name: "Community Contributor", emoji: "🌍", cat: "Resume" },
  { id: "campmedia", name: "Summer Camp Media Specialist", emoji: "🎥", cat: "Resume" },
  { id: "commmedia", name: "Community Media", emoji: "📢", cat: "Resume" },
  { id: "calmdriver", name: "Calm Driver", emoji: "🚗", cat: "Driving" },
  { id: "lesson10", name: "Lesson 10 Complete", emoji: "🔟", cat: "Driving" },
  { id: "instructorapproved", name: "Instructor Approved", emoji: "✅", cat: "Driving" },
  { id: "roadtestready", name: "Road Test Ready", emoji: "🛣️", cat: "Driving" },
  { id: "sidequest", name: "Side Quest Complete", emoji: "🧩", cat: "Projects" },
  { id: "builder", name: "Builder", emoji: "🔧", cat: "Projects" },
  { id: "bossweek", name: "Boss Battle Winner", emoji: "👑", cat: "General" },
  { id: "legend", name: "Summer Legend", emoji: "🦸", cat: "General" },
  { id: "moneystreak", name: "7-Day Money Tracking Streak", emoji: "📒", cat: "Wealth" },
  { id: "nozeroweek", name: "No Zero Week", emoji: "🌟", cat: "General" },
  { id: "bp25", name: "Battle Pass — Tier 25", emoji: "🎫", cat: "General" },
  { id: "bp50", name: "Battle Pass — Tier 50", emoji: "🎟️", cat: "General" },
  { id: "bp75", name: "Battle Pass — Tier 75", emoji: "🏵️", cat: "General" },
  { id: "bp100", name: "Battle Pass — Tier 100", emoji: "💯", cat: "General" }
];

// ---- Summer Battle Pass: 100 tiers, unlocked by cumulative XP ----
const BATTLE_PASS_XP_PER_LEVEL = 60;
const BATTLE_PASS_THEMES = ["Neon Nights", "Golden Hour", "Ocean Breeze", "Desert Heat", "Midnight Grind", "Sunrise Focus"];
const BATTLE_PASS_TITLES = [
  "Trailblazer", "Iron Will", "Momentum", "Relentless", "Sharp Shooter", "Night Owl", "Early Bird",
  "Closer", "Architect", "Unstoppable", "Focused Mind", "Grind Mode", "Clutch", "Consistent", "Locked In"
];
function buildBattlePassLevels() {
  const levels = [];
  let themeI = 0, titleI = 0, accI = 0;
  for (let lvl = 1; lvl <= 100; lvl++) {
    let reward;
    if (lvl % 25 === 0) {
      reward = { type: "badge", badgeId: "bp" + lvl, label: "Battle Pass Badge — Tier " + lvl };
    } else if (lvl % 10 === 0) {
      const acc = ACCESSORIES[accI % ACCESSORIES.length]; accI++;
      reward = { type: "accessory", accessoryId: acc.id, label: "Accessory: " + acc.name };
    } else {
      const t = ["xp", "title", "theme", "questpack"][lvl % 4];
      if (t === "xp") reward = { type: "xp", xp: 20 + (lvl % 3) * 10, label: "Bonus XP" };
      else if (t === "title") reward = { type: "title", label: BATTLE_PASS_TITLES[titleI++ % BATTLE_PASS_TITLES.length] };
      else if (t === "theme") reward = { type: "theme", label: BATTLE_PASS_THEMES[themeI++ % BATTLE_PASS_THEMES.length] };
      else reward = { type: "questpack", label: "Bonus Quest Pack" };
    }
    levels.push({ level: lvl, xpNeeded: lvl * BATTLE_PASS_XP_PER_LEVEL, reward });
  }
  return levels;
}
const BATTLE_PASS_LEVELS = buildBattlePassLevels();

// ---- Life Map regions: each maps to an existing page + a real completion % derived from live state ----
const REGION_CAT_MAP = {
  health: ["Health"], wealth: ["Wealth"], iman: ["Spiritual"], creator: ["Social"],
  academy: ["Academic", "Academics"], resume: ["Resume"], g2: ["Driving"], sidequest: ["Projects"]
};
const REGIONS = [
  { id: "health", name: "Health Kingdom", emoji: "💪", page: "health",
    pct: () => pct(BADGES.filter(b => b.cat === "Health" && S.badges.includes(b.id)).length, BADGES.filter(b => b.cat === "Health").length) },
  { id: "wealth", name: "Wealth Vault", emoji: "🪙", page: "wealth",
    pct: () => pct(S.wealth.savings, S.wealth.goal) },
  { id: "iman", name: "Iman Oasis", emoji: "🕌", page: "spiritual",
    pct: () => pct(Object.values(S.spiritual.juz30).filter(s => ["Good", "Strong", "Recited to someone"].includes(s.status)).length, JUZ30_SURAHS.length) },
  { id: "creator", name: "Creator Garage", emoji: "📷", page: "social",
    pct: () => Math.round((pct(S.social.followers, S.social.followerGoal) + pct(S.social.postsThisYear, S.social.postGoal)) / 2) },
  { id: "academy", name: "Grade 11 Academy", emoji: "🎓", page: "academics",
    pct: () => { const totals = COURSES.map(c => pct(Object.values(S.academics.courses[c.code].topicsDone).filter(Boolean).length, c.topics.length)); return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length); } },
  { id: "resume", name: "Resume Hall", emoji: "📄", page: "resume",
    pct: () => pct(Object.values(S.resume.resumeChecklist).filter(Boolean).length, Object.keys(S.resume.resumeChecklist).length) },
  { id: "g2", name: "Road to G2", emoji: "🚗", page: "driving",
    pct: () => pct(Object.values(S.driving.g2Checklist).filter(Boolean).length, G2_CHECKLIST.length) },
  { id: "sidequest", name: "Side Quest Lab", emoji: "🧪", page: "projects",
    pct: () => pct(S.projects.list.filter(p => p.status === "Completed").length, Math.max(1, S.projects.list.length)) }
];

// ---- Punishment pool (safe, annoying, never harmful) ----
const PUNISHMENTS = {
  general: [
    "Clean your desk for 10 minutes.",
    "Delete 20 useless screenshots.",
    "Write a 5-line reflection on what happened today.",
    "Walk for 10 minutes before touching entertainment.",
    "Do tomorrow's plan before using social media.",
    "Fill your water bottle and drink it.",
    "Put your phone away for 30 minutes.",
    "Make your bed immediately.",
    "Organize your school bag or a drawer.",
    "Message one person for a productive reason.",
    "Add one resume bullet to the app."
  ],
  wealth: [
    "Clean desk for 10 minutes.",
    "Delete 10 useless photos/screenshots.",
    "Write a 5-line reflection on why you bought it.",
    "Walk for 10 minutes before using social media.",
    "Organize your wallet or bank notes."
  ],
  social: [
    "Comment thoughtfully on 5 car photography posts.",
    "Organize 20 photos in your library.",
    "Write 3 new reel ideas.",
    "Spend 15 minutes studying another photographer's composition.",
    "Delete/clean duplicate files."
  ],
  spiritual: [
    "Take 5 minutes to reflect quietly.",
    "Read one page of translation.",
    "Clean your prayer area.",
    "Prepare your clothes/prayer space for the next salah.",
    "Write one du'a in the journal."
  ],
  health: [
    "10-minute cleanup of your room.",
    "5-minute walk before gaming or social media.",
    "Prepare tomorrow's workout clothes.",
    "Fill your water bottle and drink water.",
    "Write one sentence: what made me skip today?"
  ],
  academics: [
    "Organize your desk.",
    "Write tomorrow's exact study task.",
    "Do 5 easy review questions.",
    "Read 2 pages before entertainment."
  ]
};

// ---- Motivational lines shown in toasts / home page ----
const MOTIVATION = [
  "No zero days. Log the tiny version.",
  "You are not behind. You are building proof.",
  "Impulse detected. Wait 48 hours before pretending this is a need.",
  "Quest complete. XP gained.",
  "Grade 11 version of you is watching.",
  "Consistency beats intensity. Show up small, show up daily.",
  "Every log entry is evidence you're not wasting this summer.",
  "Discipline is choosing what you want most over what you want now."
];

// ---- Qur'an Juz 30 surah list ----
const JUZ30_SURAHS = [
  "An-Naba","An-Nazi'at","Abasa","At-Takwir","Al-Infitar","Al-Mutaffifin","Al-Inshiqaq",
  "Al-Buruj","At-Tariq","Al-A'la","Al-Ghashiyah","Al-Fajr","Al-Balad","Ash-Shams","Al-Layl",
  "Ad-Duha","Ash-Sharh","At-Tin","Al-Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-Adiyat",
  "Al-Qari'ah","At-Takathur","Al-Asr","Al-Humazah","Al-Fil","Quraysh","Al-Ma'un","Al-Kawthar",
  "Al-Kafirun","An-Nasr","Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas"
];

// ---- Juz 29 (unlocked after Juz30 threshold) — key surahs ----
const JUZ29_SURAHS = [
  "Al-Mulk","Al-Qalam","Al-Haqqah","Al-Ma'arij","Nuh","Al-Jinn","Al-Muzzammil",
  "Al-Muddaththir","Al-Qiyamah","Al-Insan","Al-Mursalat"
];

const REVISION_STATUSES = ["Not started","Needs repair","Some mistakes","Good","Strong","Recited to someone"];

// ---- Weekly spiritual structure ----
const SPIRITUAL_WEEK_PLAN = {
  Monday: "Revise older memorization",
  Tuesday: "Correct weak sections",
  Wednesday: "Recite to someone",
  Thursday: "New memorization or polishing",
  Friday: "Surah Al-Kahf + reflection",
  Saturday: "Longer revision session",
  Sunday: "Light revision"
};

// ---- Grade 11 courses ----
const COURSES = [
  { code: "BAF3M", name: "Financial Accounting Fundamentals", topics: [
    "Understand accounting equation","Assets, liabilities, owner's equity","Debits and credits",
    "Journal entries","Ledgers","Trial balance","Financial statements","Balance sheet",
    "Income statement","Adjusting entries","Basic business terminology","Personal finance connection"] },
  { code: "CIE3M", name: "Economics: The Individual and the Economy", topics: [
    "Supply and demand","Scarcity and opportunity cost","Needs vs wants","Markets","Inflation",
    "Interest rates","Government role in economy","Personal finance","Consumer decisions",
    "Labour markets","Basic economic graphs","Current events reflection"] },
  { code: "ENG3U", name: "English", topics: [
    "Thesis writing","Literary analysis","Quote integration","Essay structure","Paragraph structure",
    "Grammar","Reading comprehension","Media analysis","Vocabulary","Personal writing style",
    "Timed writing practice","Presentation/speaking skills"] },
  { code: "MCR3U", name: "Functions", topics: [
    "Algebra review","Factoring","Expanding/simplifying","Linear relations","Quadratics review",
    "Function notation","Transformations","Domain and range","Graphing","Rational expressions",
    "Trigonometry basics","Word problems","Test-taking strategy"] },
  { code: "HRF3O", name: "World Religions: Beliefs and Daily Life", topics: [
    "Major world religions overview","Beliefs and practices","Sacred texts","Rituals",
    "Ethics and daily life","Similarities and differences","Respectful comparison",
    "Reflection writing","Presentations/projects","Connection to Islamic knowledge"] },
  { code: "SCH3U", name: "Chemistry", topics: [
    "Safety and lab skills","Matter and chemical properties","Atomic structure","Periodic table",
    "Bonding","Chemical reactions","Nomenclature","Stoichiometry basics","Mole concept",
    "Solutions","Acids and bases","Lab reports"] },
  { code: "SPH3U", name: "Physics", topics: [
    "Motion","Kinematics","Forces","Newton's laws","Energy","Waves",
    "Electricity/magnetism basics","Graph interpretation","Units and conversions",
    "Problem-solving setup","Lab reports"] },
  { code: "CRS8", name: "Course 8 — Add Later", topics: [
    "Add topics once course is confirmed"] }
];

// ---- Warm-up routine ----
const WARMUP = [
  { name: "Easy Bike Spin or in-place march", time: 60, target: "Total body, raise heart rate" },
  { name: "World's Greatest Stretch", time: 45, target: "Hips, thoracic spine, lats" },
  { name: "Arm Swings horizontal to vertical", time: 45, target: "Chest, shoulders" },
  { name: "Bodyweight Squat to Calf Raise Combo", time: 45, target: "Quads, glutes, calves" },
  { name: "Dead-Bug to Hip-Hinge Flow", time: 45, target: "Core, posterior chain" },
  { name: "Band/DB External Rotations + Wall Slides", time: 45, target: "Rotator cuff, upper back" },
  { name: "Air Hip-Hinge Tap", time: 45, target: "Hamstrings, glutes" }
];

// ---- Strength workout days (equipment-aware) ----
const WORKOUTS = {
  full: { label: "Day 1 — Full Body", exercises: [
    "Single-Arm Floor Press 20lb + Single-Arm Floor Fly 5lb: 2x6-8 heavy + 1x10-12 back-off each",
    "Goblet Squat 20lb + Single-Leg RDL 20lb: 1x4-6 heavy + 1x8-10 back-off each",
    "Reverse Lunge 20lb: 2x8-10 per leg, 3 sec eccentric",
    "Overhead Triceps Extension 20->5lb drop-set: 1x12-15 + drop to failure",
    "DB Lateral Raise 5lb: 1x15-20 + drop to failure",
    "Calf Raise hold 20lb or bodyweight: 1x15-20 + bodyweight drop-set",
    "Weighted Pullover lying 20lb: 2x10-12, slow tempo",
    "Bike HIIT: 10x30 sec hard / 30 sec easy"
  ]},
  upper: { label: "Day 2 — Upper Body", exercises: [
    "Bottom-Up Single-Arm Press 20lb (upside-down): 2x6-8 slow eccentric",
    "Single-Arm Floor Press 20lb + Floor Fly 5lb each hand: 2x6-8 heavy + 1x10-12 back-off each",
    "Single-Arm Bent-Over Row 20lb: 2x4-6 heavy + 1x8-10 back-off each",
    "Arnold Press 20lb: 2x8-10",
    "Single-Arm DB Curl 20->5lb Myo-Reps: 1x10-12 + cluster finish",
    "Overhead Triceps Extension 20->5lb drop-set: 1x12-15 + drop to failure",
    "Core Circuit: Plank 1x60 sec -> Bicycle Crunch 2x20",
    "Bike Steady-State: 15 min moderate"
  ]},
  lower: { label: "Day 3 — Lower Body", exercises: [
    "Goblet Squat 20lb + Single-Leg RDL 20lb: 1x4-6 heavy + 1x8-10 back-off each",
    "Cossack Squat bodyweight or hold 20lb: 2x8 each side",
    "Glute Bridge 20lb on hips: 3x12-15, 2 sec squeeze",
    "Reverse Lunge Pulses 20lb: 2x8 pulses per leg, 3 sec hold bottom",
    "Calf Raise hold 20lb or bodyweight: 2x15-20 + bodyweight drop",
    "Dead-Bug no weight: 2x12 each side",
    "Bike Recovery: 5-10 min easy spin"
  ]},
  lazy: { label: "No-Zero-Day Fallback (Lazy Day)", exercises: [
    "10-minute walk or bike",
    "2 sets bodyweight squats",
    "2 sets incline pushups",
    "2 sets dumbbell rows",
    "1 plank hold"
  ]}
};

const CARDIO_OPTIONS = {
  treadmill: ["Easy walk 20-45 min","Incline walk 15-30 min","Intervals: 1 min faster / 2 min easy x6-10","Recovery walk 10-20 min"],
  bike: ["Easy spin 10-30 min","Steady-state 15-30 min","HIIT 10x30sec hard/30sec easy","Recovery spin 5-15 min"],
  walk: ["Outdoor walk — any duration"]
};

const EQUIPMENT_OPTIONS = ["Bodyweight","Bike","Treadmill","5 lb dumbbells","10 lb dumbbells","Single 20 lb dumbbell"];

// ---- Photo style challenge bank ----
const PHOTO_STYLES = [
  "Harsh light subject pop","Moody edit","Golden hour glow","Night gas station look","Reflections",
  "Interior details","Wheel/detail shots","Low-angle aggressive shot","Rolling-style static composition",
  "Clean dealership-style edit","Cinematic crop","Black-and-white edit"
];

// ---- Common meals (editable/quick-add) ----
const COMMON_MEALS = [
  { name: "Eggs + toast", cal: 350, protein: 20 },
  { name: "Greek yogurt + fruit", cal: 220, protein: 18 },
  { name: "Chicken wrap", cal: 480, protein: 32 },
  { name: "Rice + chicken", cal: 550, protein: 40 },
  { name: "Tuna sandwich", cal: 400, protein: 28 },
  { name: "Lentils/beans", cal: 300, protein: 18 },
  { name: "Protein smoothie", cal: 280, protein: 30 },
  { name: "Fruit", cal: 90, protein: 1 },
  { name: "Nuts (handful)", cal: 180, protein: 6 },
  { name: "Salad", cal: 200, protein: 8 },
  { name: "Homemade burger/wrap", cal: 500, protein: 30 },
  { name: "Water", cal: 0, protein: 0 }
];

// ---- G2 readiness checklist ----
const G2_CHECKLIST = [
  "Smooth starts/stops","Right turns","Left turns","Lane changes","Parking","Reverse parking",
  "Three-point turn","Parallel parking","Residential driving","Main road driving","Speed control",
  "Mirror checks","Blind spot checks","Observation","Following distance","Defensive driving",
  "Calmness under pressure","Road signs","Test route practice","Mock road test"
];

// ---- Resume checklist ----
const RESUME_CHECKLIST = [
  "Experience section drafted","Volunteer experience section drafted","Projects section drafted",
  "Skills section drafted","Awards/achievements section drafted","Certifications listed",
  "Portfolio links added","Resume reviewed by someone else","Formatted cleanly / 1 page"
];

// ---- Daily quest bank (rotate/select from these) ----
const DAILY_QUEST_BANK = [
  { cat: "Health", text: "Walk or move for 25+ minutes" },
  { cat: "Health", text: "Drink enough water today" },
  { cat: "Health", text: "No sugary drinks today" },
  { cat: "Health", text: "Track your meals" },
  { cat: "Spiritual", text: "Pray all 5 salah" },
  { cat: "Spiritual", text: "Revise Qur'an for 20 minutes" },
  { cat: "Academic", text: "Study for 30 minutes" },
  { cat: "Wealth", text: "Save or log your money" },
  { cat: "Social", text: "Create or post/edit content" },
  { cat: "Resume", text: "Contact or apply to one opportunity" },
  { cat: "Project", text: "Work on a project for 30 minutes" },
  { cat: "Discipline", text: "Sleep before your target time" }
];

// ---- Weekly quest chains (id must be stable) ----
const WEEKLY_CHAINS = [
  { id: "wealthChain", name: "Wealth Chain", cat: "Wealth", reward: "antiimpulse",
    steps: ["Track all spending for 7 days","Save at least $25","Avoid an impulse buy","Use the purchase checker twice"] },
  { id: "creatorChain", name: "Creator Chain", cat: "Social", reward: "camerastrap",
    steps: ["Complete one shoot","Edit 10 photos","Post one carousel","Post two reels","Send 5 outreach DMs"] },
  { id: "juz30Chain", name: "Juz 30 Repair Chain", cat: "Spiritual", reward: "quranstand",
    steps: ["Review 5 surahs","Mark weak spots","Recite to someone","Fix mistakes"] },
  { id: "trainingChain", name: "Training Camp Chain", cat: "Health", reward: "shoes",
    steps: ["Move 5 days","Strength train 3 days","Track meals 5 days","No sugary drinks 3 days"] },
  { id: "prepChain", name: "Grade 11 Prep Chain", cat: "Academic", reward: "backpack",
    steps: ["Study 4 days","Complete 1 math topic","Write 1 English paragraph","Read 20 pages"] },
  { id: "resumeChain", name: "Resume Chain", cat: "Resume", reward: "volunteer",
    steps: ["Log one achievement","Apply/contact one volunteer place","Add one resume bullet","Work on portfolio"] },
  { id: "functionsChain", name: "Functions Survival Chain", cat: "Academic", reward: "mcr3u",
    steps: ["Complete algebra review","Complete factoring review","Do 20 function notation questions","Graph 10 functions","Complete one mini-test"] },
  { id: "englishChain", name: "English Upgrade Chain", cat: "Academic", reward: "eng3u",
    steps: ["Write one thesis","Write one PREA/body paragraph","Analyze 3 quotes","Read for 30 minutes","Complete one timed paragraph"] },
  { id: "stemChain", name: "STEM Prep Chain", cat: "Academic", reward: "stem",
    steps: ["Review periodic table basics","Review physics units/conversions","Complete 10 chemistry practice questions","Complete 10 physics practice questions"] },
  { id: "businessChain", name: "Business Brain Chain", cat: "Academic", reward: "business",
    steps: ["Learn the accounting equation","Make 10 journal entry examples","Explain supply and demand","Track one real spending decision using economics"] },
  { id: "religionsChain", name: "World Religions Reflection Chain", cat: "Academic", reward: "religions",
    steps: ["Review world religions overview","Write one respectful comparison paragraph","Connect one lesson to Islamic knowledge"] }
];

// ---- Boss battle weekly criteria ----
const BOSS_BATTLE_CRITERIA = [
  { key: "workouts5", text: "Completed 5+ workouts/movement days" },
  { key: "quran5", text: "Revised Qur'an 5+ days" },
  { key: "study4", text: "Studied 4+ days" },
  { key: "content1", text: "Posted or created content" },
  { key: "saved", text: "Saved money this week" },
  { key: "noimpulse", text: "Avoided a major impulse buy" },
  { key: "planned", text: "Planned the week" },
  { key: "slept", text: "Slept decently" },
  { key: "resume", text: "Did one thing for the resume" }
];

// ---- Default full state (seeded with your real numbers) ----
function buildDefaultState() {
  const courseState = {};
  COURSES.forEach(c => {
    courseState[c.code] = {
      confidence: 5, targetGrade: 90, studyHours: 0, weakTopics: [],
      notes: "", topicsDone: {}, quiz: false
    };
  });
  const juz30 = {}; JUZ30_SURAHS.forEach(s => juz30[s] = { status: "Needs repair", date: "", notes: "" });
  const juz29 = {}; JUZ29_SURAHS.forEach(s => juz29[s] = { status: "Not started", date: "", notes: "" });

  return {
    meta: {
      name: "Summer Me",
      summerStart: "2026-06-22",
      schoolStart: "2026-09-01",
      xp: 0, level: 1,
      xpValues: { ...DEFAULT_XP_VALUES },
      darkMode: true, reducedMotion: false,
      lastBossBattleWeek: null,
      lastModified: 0, // ms timestamp, set on every real save — used to resolve cloud sync conflicts
      soundEnabled: true,
      unlockedTitles: [], unlockedThemes: [], activeTheme: null, equippedTitle: null
    },
    stats: { discipline: 10, health: 10, wealth: 10, iman: 10, creativity: 10, knowledge: 10, confidence: 10 },
    accessories: { unlocked: [], equipped: [] },
    badges: [],
    xpLog: [], // {date, amount, reason}
    quests: {
      daily: {}, // date -> [{id,cat,text,done}]
      weeklyChainProgress: {} // chainId -> {stepIndex: bool}
    },
    checkin: { lastClaim: null, streak: 0 }, // daily login reward — independent of quest/habit streaks
    battlePass: { claimedLevels: [] },
    coachReviews: {}, // weekStart date -> generated weekly review object
    streaks: { movement: 0, quran: 0, salah: 0, content: 0, study: 0, money: 0, dailyQuests: 0,
      lastMovement: null, lastQuran: null, lastStudy: null, lastContent: null, lastSalah: null, lastMoney: null, lastDailyQuests: null },
    focusOfWeek: "Repair Juz 30 + build daily movement habit",
    wealth: {
      savings: 0, goal: 500,
      transactions: [], // {date, type: income/expense/saved, category, amount, note}
      cooldownItems: [], // {id, item, price, addedDate, unlockDate, bought}
      noSpendStreakStart: null,
      achievementsUnlocked: []
    },
    social: {
      startFollowers: 80, followers: 143, followerGoal: 250,
      postsThisYear: 5, reelsThisYear: 15, postGoal: 35,
      contentLog: [], // {date,title,type,views,likes,comments,saves,shares,followersGained,notes}
      outreach: [], // {date, who, replied}
      shoots: [], // planning shoots
      paidShoots: [
        { id: "amggtr", client: "AMG GT-R client", vehicle: "AMG GT-R", date: "2026-07-21",
          location: "", price: 150, deposit: false, finalPayment: false,
          shotList: "", style: "", deliverables: "", editingStatus: "Not started",
          deliveryDeadline: "", feedback: "", canPost: false, portfolioWorthy: false,
          status: "Planned", notes: "Default seeded paid shoot — 3rd week of July 2026.",
          prep: {
            "Confirm date/time": false, "Confirm location": false, "Confirm price/payment method": false,
            "Ask about preferred style": false, "Prepare shot list": false, "Charge camera batteries": false,
            "Clear SD card/storage": false, "Clean lens": false, "Check weather": false,
            "Scout location": false, "Plan golden hour/night/urban shots": false, "Bring water": false,
            "Send reminder message to client": false, "Complete shoot": false, "Backup photos": false,
            "Cull photos": false, "Edit final set": false, "Deliver photos": false,
            "Ask for feedback/testimonial": false, "Ask permission to post": false,
            "Create Instagram reel/carousel from shoot": false
          } }
      ],
      portfolioChecklist: { "Best 10 shots selected": false, "Consistent editing style": false, "Bio updated": false, "Highlight reels organized": false, "Website/linktree ready": false }
    },
    spiritual: {
      salahLog: {}, // date -> {Fajr,Dhuhr,Asr,Maghrib,Isha}
      juz30, juz29, juz29Unlocked: false,
      revisionSessions: [], // {date, minutes, focus, notes}
      duaList: [],
      reflections: []
    },
    health: {
      movementLog: [], // {date, minutes, type, notes}
      workoutLog: [], // {date, day, equipment, sets:[{exercise,reps,difficulty}], notes, type: full/lazy}
      cardioLog: [], // {date, mode, option, duration, intensity, distance, notes}
      mealLog: [], // {date, meal, cal, protein, carbs, fiber, notes, homemade, hadProtein, hadVeg, sugaryDrink, hungerBefore, hungerAfter}
      waterLog: {}, // date -> cups
      sleepLog: {}, // date -> {hours, quality}
      sugarDrinkLog: {}, // date -> count
      weightLog: [], // {date, weight}
      moodLog: {}, // date -> {mood, energy}
      calorieTarget: 2200, proteinTarget: 120, waterTarget: 8
    },
    academics: { courses: courseState, studyLog: [] }, // studyLog: {date, course, minutes, topic, notes}
    resume: {
      volunteerLog: [
        { org: "MIST Toronto", role: "Video/Photographer Volunteer", date: "2026-02-01", hours: 11,
          contact: "", desc: "Captured event photo/video coverage for MIST Toronto 2026.",
          skills: "Photography, videography, event coverage", resumeReady: true, proof: "" }
      ],
      achievements: [
        { date: "2026-03-01", text: "Completed G1 licence", category: "Driving" },
        { date: "2026-06-01", text: "Grade 10 average ~87%", category: "Academics" },
        { date: "2026-06-01", text: "Automotive photography IG grown 80 -> 143 followers", category: "Social" }
      ],
      opportunities: [
        { org: "Masjid 1", role: "Social Media Specialist — Summer Camp", type: "Full-time summer role",
          status: "Waiting to hear back", dateApplied: "2026-06-25", followUpDate: "", contact: "",
          notes: "", resumeVersion: "", skills: "Photography, video, content, reels", outcome: "" },
        { org: "Masjid 2", role: "Social Media Specialist — Summer Camp", type: "Full-time summer role",
          status: "Waiting to hear back", dateApplied: "2026-06-25", followUpDate: "", contact: "",
          notes: "", resumeVersion: "", skills: "Photography, video, content, reels", outcome: "" }
      ],
      resumeChecklist: Object.fromEntries(RESUME_CHECKLIST.map(t => [t, false]))
    },
    driving: {
      lessonNumber: 8, lessonLog: [], practiceLog: [], // supervised practice with parent
      g2Checklist: Object.fromEntries(G2_CHECKLIST.map(t => [t, false])),
      g2EligibleDate: "2027-01-05"
    },
    projects: { list: [] }, // {id,name,category,status,difficulty,milestones:[],notes,xp}
    planner: { daily: {} }, // date -> {top3, minimum, avoid, mainQuest, sideQuest, recovery, review:{...}}
    meals: { commonMeals: [...COMMON_MEALS], weeklyPlan: {}, groceryList: [] },
    journal: { daily: {}, weekly: {} }, // date -> {mood,energy,gratitude,dua,lessons,wins,losses,fix}
    bossBattles: [] // {week, results:{}, passed, xpAwarded}
  };
}
