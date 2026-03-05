let deck = [];
let pool = []; // weighted pool of IDs
let current = null;

const SESSION_GOAL = 15;

const state = {
  score: 0,
  streak: 0,
  done: 0,
  seen: {}, // id -> { weight, times }
};

function $(id) { return document.getElementById(id); }

function updateUI() {
  $("score").textContent = state.score;
  $("streak").textContent = state.streak;
  $("done").textContent = state.done;
  $("goal").textContent = SESSION_GOAL;

  const pct = Math.min(100, Math.round((state.done / SESSION_GOAL) * 100));
  $("fill").style.width = `${pct}%`;

  if (state.done >= SESSION_GOAL) {
    $("note").textContent = "Session complete. Reset or keep going.";
  } else {
    $("note").textContent = "";
  }
}

function hideAnswer() {
  $("meta").classList.add("hidden");
  $("grade").classList.add("hidden");
}

function showAnswer() {
  $("meta").classList.remove("hidden");
  $("grade").classList.remove("hidden");
}

function ensureSeen(id) {
  if (!state.seen[id]) state.seen[id] = { weight: 3, times: 0 };
}

function rebuildPool() {
  pool = [];
  for (const k of deck) {
    ensureSeen(k.id);
    const w = state.seen[k.id].weight;
    for (let i = 0; i < w; i++) pool.push(k.id);
  }
}

function pickNext() {
  if (pool.length === 0) rebuildPool();

  const id = pool[Math.floor(Math.random() * pool.length)];
  current = deck.find(k => k.id === id);

  $("kanji").textContent = current.kanji;
  $("reading").textContent = current.reading;
  $("meaning").textContent = current.meaning;

  hideAnswer();
}

function gradeCard(grade) {
  if (!current) return;

  ensureSeen(current.id);
  const s = state.seen[current.id];
  s.times += 1;

  // Simple spaced repetition weights:
  // Again -> show more often (weight increases)
  // Easy -> show less often (weight decreases)
  if (grade === "again") {
    s.weight = Math.min(8, s.weight + 3);
    state.score = Math.max(0, state.score - 1);
    state.streak = 0;
  }

  if (grade === "hard") {
    s.weight = Math.min(8, s.weight + 1);
    state.score += 1;
    state.streak += 1;
  }

  if (grade === "good") {
    s.weight = Math.max(1, s.weight - 1);
    state.score += 2;
    state.streak += 1;
  }

  if (grade === "easy") {
    s.weight = Math.max(1, s.weight - 2);
    state.score += 3;
    state.streak += 1;
  }

  state.done += 1;

  // Rebuild pool so weight changes take effect quickly
  rebuildPool();
  updateUI();
  pickNext();
}

function resetSession() {
  state.score = 0;
  state.streak = 0;
  state.done = 0;
  state.seen = {};
  rebuildPool();
  updateUI();
  pickNext();
}

async function init() {
  const res = await fetch("/api/kanji");
  deck = await res.json();

  // init seen map
  for (const k of deck) ensureSeen(k.id);

  rebuildPool();
  updateUI();
  pickNext();

  $("reveal").addEventListener("click", showAnswer);

  $("skip").addEventListener("click", () => {
    state.done += 1;
    state.streak = 0;
    updateUI();
    pickNext();
  });

  $("reset").addEventListener("click", resetSession);

  document.querySelectorAll(".pill").forEach(btn => {
    btn.addEventListener("click", () => gradeCard(btn.dataset.grade));
  });
}

init();