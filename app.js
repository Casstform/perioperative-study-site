const $ = (selector) => document.querySelector(selector);
const STORAGE_KEY = "perioperative-ornac17-v1";
const THEME_KEY = "perioperative-study-lab-theme";
const TEXT_SIZE_KEY = "perioperative-study-text-size";
const icons = ["✧", "⊕", "✳", "◌", "⌁", "◈"];
const state = {
  bank: null, pool: "all", collection: "all", length: 20, categories: new Set(), navFilter: "all",
  progress: loadProgress(), session: null
};

function loadProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value && typeof value === "object" ? value : {};
  } catch { return {}; }
}
function saveProgress() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress)); } catch {}
}
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function entry(id) {
  if (!state.progress[id]) state.progress[id] = { attempts: 0, correct: 0, saved: false, missed: false };
  return state.progress[id];
}
function categorySelection() {
  return state.categories.size ? state.categories : new Set(state.bank.categories);
}
function poolQuestions() {
  return state.bank.questions.filter(q => {
    if (state.collection === "recording" && q.collection !== "recording") return false;
    if (state.collection === "ornac" && q.collection === "recording") return false;
    if (!categorySelection().has(q.category)) return false;
    const p = state.progress[q.id];
    if (state.pool === "missed") return Boolean(p?.missed);
    if (state.pool === "bookmarked") return Boolean(p?.saved);
    return true;
  });
}
function sampleWeighted(pool, count) {
  if (state.collection === "recording" && count >= pool.length) {
    return [...pool].sort((a, b) => a.origin.questionNumber - b.origin.questionNumber);
  }
  if (count >= pool.length) {
    const grouped = new Map();
    const blocks = [];
    for (const q of pool) {
      if (!q.case) blocks.push([q]);
      else if (grouped.has(q.case)) grouped.get(q.case).push(q);
      else { const block = [q]; grouped.set(q.case, block); blocks.push(block); }
    }
    return shuffle(blocks).flat();
  }
  if (state.pool !== "all" || state.categories.size) return shuffle(pool).slice(0, count);
  const selected = [];
  const available = [...pool];
  // Full-bank sessions include complete clinical cases when they fit the target.
  const caseMap = new Map();
  for (const q of available.filter(q => q.case)) {
    if (!caseMap.has(q.case)) caseMap.set(q.case, []);
    caseMap.get(q.case).push(q);
  }
  const caseGroups = [...caseMap.values()];
  const caseTarget = Math.round(count * 0.2);
  for (const group of shuffle(caseGroups)) {
    if (selected.length + group.length > caseTarget) continue;
    selected.push(...group);
    for (const q of group) available.splice(available.indexOf(q), 1);
  }
  const remaining = count - selected.length;
  const weights = state.bank.blueprintWeights;
  const counts = Object.fromEntries(state.bank.categories.map(c => [c, 0]));
  for (const q of selected) counts[q.category]++;
  for (let n = 0; n < remaining; n++) {
    const choices = state.bank.categories.filter(c => available.some(q => q.category === c));
    if (!choices.length) break;
    choices.sort((a, b) => (counts[a] / weights[a]) - (counts[b] / weights[b]));
    const category = choices[0];
    const candidates = available.filter(q => q.category === category && !q.case);
    const choicePool = candidates.length ? candidates : available.filter(q => q.category === category);
    const q = choicePool[Math.floor(Math.random() * choicePool.length)];
    selected.push(q); counts[category]++;
    available.splice(available.indexOf(q), 1);
  }
  // Preserve case blocks while allowing other questions to move around them.
  const blocks = [];
  const used = new Set();
  for (const q of selected) {
    if (q.case) {
      if (used.has(q.case)) continue;
      blocks.push(selected.filter(item => item.case === q.case));
      used.add(q.case);
    } else blocks.push([q]);
  }
  return shuffle(blocks).flat();
}
function updateDashboard() {
  if (!state.bank) return;
  const records = Object.values(state.progress);
  $("#bank-size").textContent = state.bank.questions.filter(q => state.collection === "all" || (state.collection === "recording" ? q.collection === "recording" : q.collection !== "recording")).length;
  $("#missed-count").textContent = records.filter(p => p.missed).length;
  $("#saved-count").textContent = records.filter(p => p.saved).length;
  const pool = poolQuestions();
  $("#recording-note").classList.toggle("hidden", state.collection !== "recording");
  const count = state.length === "all" ? pool.length : Math.min(Number(state.length), pool.length);
  $("#session-description").textContent = `${count} ${state.collection === "recording" ? "recorded practice" : state.pool === "all" ? "mixed" : state.pool} question${count === 1 ? "" : "s"}`;
  $("#session-detail").textContent = state.collection === "recording" && state.length === "all"
    ? "Recorded question order, shared cases, and linked explanations."
    : state.pool === "all" && !state.categories.size
    ? "Blueprint-aware mix with linked explanations."
    : `${pool.length} available in your selected pool and domains.`;
}
function renderHome() {
  const holder = $("#category-list");
  holder.replaceChildren();
  state.bank.categories.forEach((category, i) => {
    const button = document.createElement("button");
    button.className = "category-pill";
    button.type = "button";
    button.setAttribute("aria-pressed", state.categories.has(category));
    button.innerHTML = `<span class="pill-icon">${icons[i]}</span><span></span><span class="pill-count"></span>`;
    button.children[1].textContent = category;
    button.children[2].textContent = state.bank.questions.filter(q => q.category === category && (state.collection === "all" || (state.collection === "recording" ? q.collection === "recording" : q.collection !== "recording"))).length;
    button.addEventListener("click", () => {
      state.categories.has(category) ? state.categories.delete(category) : state.categories.add(category);
      button.setAttribute("aria-pressed", state.categories.has(category));
      updateDashboard();
    });
    holder.append(button);
  });
  syncControls();
  updateDashboard();
}
function syncControls() {
  $("#question-set").value = state.collection;
  document.querySelectorAll("[data-pool]").forEach(button => {
    const yes = button.dataset.pool === state.pool;
    button.classList.toggle("selected", yes);
    button.setAttribute("aria-pressed", String(yes));
  });
  document.querySelectorAll("[data-length]").forEach(button => button.classList.toggle("selected", String(state.length) === button.dataset.length));
  document.querySelectorAll(".category-pill").forEach((button, i) => button.setAttribute("aria-pressed", state.categories.has(state.bank.categories[i])));
}
function show(screen) {
  for (const id of ["home", "quiz", "results"]) $("#" + id).classList.toggle("hidden", id !== screen);
  window.scrollTo({top: 0, behavior: "instant"});
}
function startSession() {
  const pool = poolQuestions();
  if (!pool.length) {
    $("#setup-message").textContent = "No questions in that selection yet. Try another pool or domain.";
    $("#setup").scrollIntoView({behavior: "smooth"});
    return;
  }
  $("#setup-message").textContent = "";
  const count = state.length === "all" ? pool.length : Math.min(Number(state.length), pool.length);
  state.navFilter = "all";
  state.session = {
    questions: sampleWeighted(pool, count).map(q => {
      const order = shuffle([0, 1, 2, 3]);
      return {...q, displayed: order.map(i => q.options[i]), displayOrder: order, correctIndex: q.reviewOnly ? null : order.indexOf(q.answer)};
    }),
    index: 0, answers: [], revealed: false
  };
  show("quiz"); renderQuestion();
}
function renderQuestion() {
  const s = state.session, q = s.questions[s.index];
  s.revealed = false;
  $("#navigation-message").textContent = "";
  $("#previous-question").disabled = s.index === 0;
  $("#quiz-progress-label").textContent = `QUESTION ${String(s.index + 1).padStart(2, "0")} / ${s.questions.length}`;
  $("#progress-fill").style.width = `${s.index / s.questions.length * 100}%`;
  $("#aside-number").innerHTML = `${String(s.index + 1).padStart(2, "0")}<span> / ${s.questions.length}</span>`;
  $("#session-correct").textContent = s.answers.filter(a => a.correct).length;
  $("#session-answered").textContent = s.answers.length;
  $("#question-meta").textContent = q.category.toUpperCase() + (q.origin ? ` · RECORDED PRACTICE #${q.origin.questionNumber}` : "");
  $("#review-only-notice").classList.toggle("hidden", !q.reviewOnly);
  $("#question-note").value = state.progress[q.id]?.note || "";
  $("#question-text").textContent = q.prompt;
  $("#case-box").classList.toggle("hidden", !q.case);
  if (q.case) $("#case-box").textContent = `CLINICAL CASE · ${state.bank.cases[q.case]}`;
  const options = $("#answer-options"); options.replaceChildren();
  q.displayed.forEach((option, i) => {
    const button = document.createElement("button");
    button.className = "answer-option";
    button.type = "button";
    button.innerHTML = `<span class="option-key">${i + 1}</span><span class="option-text"></span><span class="option-check"></span>`;
    button.querySelector(".option-text").textContent = option;
    button.addEventListener("click", () => answer(i));
    options.append(button);
  });
  $("#feedback").classList.add("hidden");
  $("#next-question").classList.add("hidden");
  $("#next-question").innerHTML = s.index === s.questions.length - 1 ? "See results <span>→</span>" : "Next question <span>→</span>";
  $("#keyboard-hint").textContent = "Press 1–4 to answer";
  const saved = Boolean(state.progress[q.id]?.saved);
  $("#bookmark").textContent = saved ? "★ Saved" : "☆ Save";
  $("#bookmark").setAttribute("aria-pressed", String(saved));
  const previous = s.answers.find(record => record.id === q.id);
  if (previous) renderAnswer(previous);
  renderNavigator();
}
function answer(index) {
  const s = state.session;
  if (!s || s.revealed || !Number.isInteger(index) || index < 0 || index > 3) return;
  const q = s.questions[s.index], correct = q.reviewOnly ? null : index === q.correctIndex;
  const record = {id: q.id, category: q.category, correct, choice: index};
  s.answers.push(record);
  const p = entry(q.id);
  if (!q.reviewOnly) {
    p.attempts++; if (correct) p.correct++;
    p.missed = !correct;
  }
  saveProgress();
  renderAnswer(record);
  renderNavigator();
}
function renderAnswer(record) {
  const s = state.session, q = s.questions[s.index];
  const index = record.choice, correct = record.correct;
  s.revealed = true;
  [...$("#answer-options").children].forEach((button, i) => {
    button.disabled = true;
    if (q.reviewOnly && i === index) { button.classList.add("review-choice"); button.querySelector(".option-check").textContent = "•"; }
    else if (i === q.correctIndex) {button.classList.add("correct"); button.querySelector(".option-check").textContent = "✓";}
    else if (i === index) {button.classList.add("incorrect"); button.querySelector(".option-check").textContent = "×";}
    else button.classList.add("dimmed");
  });
  const feedback = $("#feedback");
  feedback.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = q.reviewOnly ? "Review the reasoning · not scored." : correct ? "That's right." : "A point to revisit.";
  const explanation = document.createElement("p");
  explanation.textContent = q.explanation;
  const source = document.createElement("a");
  const reference = q.reference;
  const sections = reference.sections.map(section => section === "F" ? "Foreword" : `§${section}`).join(", ");
  const pdfPages = reference.pages.map(page => page.pdfPage).join(", ");
  const printedPages = reference.pages.map(page => page.printedPage).join(", ");
  source.href = state.bank.document.url;
  source.target = "_blank"; source.rel = "noopener";
  source.textContent = `Guideline reference: ORNAC Guidelines, 17th ed. (2025), ${sections} · PDF ${reference.pages.length === 1 ? "p." : "pp."} ${pdfPages} (printed ${printedPages}) ↗`;
  source.title = `Open your Drive copy, then enter PDF page ${reference.pages[0].pdfPage} in the viewer’s page box.`;
  feedback.append(title, explanation, source);
  if (q.origin) {
    const origin = document.createElement("p"); origin.className = "answer-provenance";
    origin.textContent = `Recorded practice #${q.origin.questionNumber} · ${q.origin.answerStatus}.`;
    feedback.append(origin);
  }
  for (const reference of q.additionalReferences || []) {
    const link = document.createElement("a");
    link.href = reference.url; link.target = "_blank"; link.rel = "noopener";
    link.textContent = `Clinical reference: ${reference.name} ↗`;
    feedback.append(link);
  }

  const why = document.createElement("details");
  why.className = "learning-detail";
  const whySummary = document.createElement("summary");
  whySummary.textContent = q.reviewOnly ? "How to evaluate each answer" : "Why the other answers are incorrect";
  const wrongList = document.createElement("ul");
  wrongList.className = "wrong-list";
  q.displayed.forEach((option, displayedIndex) => {
    const originalIndex = q.displayOrder[displayedIndex];
    if (originalIndex === q.answer) return;
    const item = document.createElement("li");
    const optionLabel = document.createElement("strong");
    optionLabel.textContent = option;
    const reason = document.createElement("span");
    reason.textContent = q.optionExplanations ? q.optionExplanations[originalIndex] : q.whyOthers[originalIndex - 1];
    item.append(optionLabel, reason);
    wrongList.append(item);
  });
  why.append(whySummary, wrongList);

  const concept = state.bank.concepts[q.concept];
  const basics = document.createElement("details");
  basics.className = "learning-detail";
  const basicsSummary = document.createElement("summary");
  basicsSummary.textContent = `Concept basics: ${concept.title}`;
  const basicsBody = document.createElement("p");
  basicsBody.textContent = concept.text;
  basics.append(basicsSummary, basicsBody);
  if (concept.source && concept.source !== q.source) {
    const basicsSource = document.createElement("a");
    basicsSource.href = state.bank.sources[concept.source].url;
    basicsSource.target = "_blank"; basicsSource.rel = "noopener";
    basicsSource.textContent = `Reference: ${state.bank.sources[concept.source].name} ↗`;
    basics.append(basicsSource);
  }

  feedback.append(why, basics);
  feedback.className = `feedback ${q.reviewOnly ? "review-only" : correct ? "good" : "needs-review"}`;
  $("#session-correct").textContent = s.answers.filter(a => a.correct).length;
  $("#session-answered").textContent = s.answers.length;
  $("#keyboard-hint").textContent = "Press Enter for next";
  $("#next-question").classList.remove("hidden");
}
function nextQuestion() {
  const s = state.session;
  if (!s?.revealed) return;
  if (s.index === s.questions.length - 1) {
    const unanswered = s.questions.findIndex(q => !s.answers.some(a => a.id === q.id));
    if (unanswered !== -1) {
      s.index = unanswered; renderQuestion();
      $("#navigation-message").textContent = "Answer the remaining questions before viewing your results.";
      return;
    }
    showResults(); return;
  }
  s.index++;
  renderQuestion();
}
function renderNavigator() {
  const s = state.session;
  const holder = $("#question-navigator"); holder.replaceChildren();
  $("#navigator-status").textContent = `· ${s.answers.length} / ${s.questions.length} answered`;
  document.querySelectorAll("[data-nav-filter]").forEach(button => button.setAttribute("aria-pressed", String(state.navFilter === button.dataset.navFilter)));
  s.questions.forEach((q, index) => {
    const answered = s.answers.some(a => a.id === q.id), saved = Boolean(state.progress[q.id]?.saved);
    if (state.navFilter === "unanswered" && answered || state.navFilter === "saved" && !saved) return;
    const button = document.createElement("button"); button.type = "button";
    button.textContent = `${index + 1}${saved ? " ★" : ""}${q.reviewOnly ? " R" : ""}`;
    button.className = `navigator-question${answered ? " answered" : ""}${index === s.index ? " current" : ""}`;
    button.setAttribute("aria-label", `Question ${index + 1}${answered ? ", answered" : ", unanswered"}${saved ? ", saved" : ""}${q.reviewOnly ? ", review only" : ""}`);
    if (index === s.index) button.setAttribute("aria-current", "step");
    button.addEventListener("click", () => { s.index = index; renderQuestion(); });
    holder.append(button);
  });
  if (!holder.children.length) { const p = document.createElement("p"); p.textContent = "No questions match this filter."; holder.append(p); }
}
function showResults() {
  const s = state.session;
  const correct = s.answers.filter(a => a.correct).length;
  const scored = s.answers.filter(a => a.correct !== null);
  const reviewCount = s.answers.length - scored.length;
  const percent = scored.length ? Math.round(correct / scored.length * 100) : null;
  $("#result-headline").textContent = percent >= 80 ? "Strong work." : percent >= 60 ? "Keep building." : "Keep practicing.";
  $("#result-summary").textContent = `You answered ${correct} of ${scored.length} scored questions correctly.${reviewCount ? ` ${reviewCount} review-only item${reviewCount === 1 ? " was" : "s were"} excluded from scoring.` : ""} Every missed question is ready for another pass.`;
  $("#result-percent").textContent = percent === null ? "—" : `${percent}%`;
  const list = $("#result-domains"); list.replaceChildren();
  state.bank.categories.forEach(category => {
    const items = scored.filter(a => a.category === category);
    if (!items.length) return;
    const row = document.createElement("div");
    const label = document.createElement("span"); label.textContent = category;
    const value = document.createElement("strong"); value.textContent = `${items.filter(a => a.correct).length} / ${items.length}`;
    row.append(label, value); list.append(row);
  });
  $("#retry-missed").disabled = !s.answers.some(a => a.correct === false);
  updateDashboard(); show("results");
}
function bind() {
  $("#start-custom").addEventListener("click", () => startSession());
  $("#next-question").addEventListener("click", nextQuestion);
  $("#previous-question").addEventListener("click", () => { if (state.session.index > 0) { state.session.index--; renderQuestion(); } });
  $("#question-set").addEventListener("change", event => { state.collection = event.target.value; renderHome(); });
  $("#question-note").addEventListener("input", event => { const q = state.session.questions[state.session.index]; entry(q.id).note = event.target.value; saveProgress(); });
  document.querySelectorAll("[data-nav-filter]").forEach(button => button.addEventListener("click", () => { state.navFilter = button.dataset.navFilter; renderNavigator(); }));
  $("#exit-quiz").addEventListener("click", () => {state.session = null; updateDashboard(); show("home");});
  $("#bookmark").addEventListener("click", () => {
    const id = state.session.questions[state.session.index].id;
    entry(id).saved = !entry(id).saved; saveProgress();
    const saved = entry(id).saved;
    $("#bookmark").textContent = saved ? "★ Saved" : "☆ Save";
    $("#bookmark").setAttribute("aria-pressed", String(saved));
    renderNavigator();
  });
  $("#home-button").addEventListener("click", () => show("home"));
  $("#review-answers").addEventListener("click", () => { state.session.index = 0; show("quiz"); renderQuestion(); });
  $("#retry-missed").addEventListener("click", () => {
    state.pool = "missed"; state.categories.clear(); state.length = 20;
    syncControls(); startSession();
  });
  document.querySelectorAll("[data-pool]").forEach(button => button.addEventListener("click", () => {
    state.pool = button.dataset.pool; syncControls(); updateDashboard();
  }));
  document.querySelectorAll("[data-length]").forEach(button => button.addEventListener("click", () => {
    state.length = button.dataset.length === "all" ? "all" : Number(button.dataset.length);
    syncControls(); updateDashboard();
  }));
  document.addEventListener("keydown", event => {
    if (event.target?.closest("input, textarea, select, [contenteditable='true']")) return;
    if ($("#quiz").classList.contains("hidden") || event.altKey || event.ctrlKey || event.metaKey) return;
    if (/^[1-4]$/.test(event.key)) answer(Number(event.key) - 1);
    if (event.key === "Enter" && state.session?.revealed) nextQuestion();
  });
  let textSize = "1";
  try { textSize = localStorage.getItem(TEXT_SIZE_KEY) || "1"; } catch {}
  if (!["1", "1.15", "1.3"].includes(textSize)) textSize = "1";
  $("#text-size").value = textSize;
  document.documentElement.style.setProperty("--study-text-scale", textSize);
  $("#text-size").addEventListener("change", event => {
    const value = event.target.value;
    document.documentElement.style.setProperty("--study-text-scale", value);
    try { localStorage.setItem(TEXT_SIZE_KEY, value); } catch {}
  });
  const initialTheme = localStorage.getItem(THEME_KEY);
  if (initialTheme === "light") document.documentElement.classList.add("light");
  $("#theme-toggle").addEventListener("click", () => {
    const light = document.documentElement.classList.toggle("light");
    try { localStorage.setItem(THEME_KEY, light ? "light" : "dark"); } catch {}
  });
}
async function init() {
  bind();
  try {
    const response = await fetch("./bank.json?v=ORNAC-17-2025-r4-recording");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.bank = await response.json();
    if (!Array.isArray(state.bank.questions) || !state.bank.questions.length) throw new Error("Question bank is empty");
    renderHome();
  } catch (error) {
    $("#bank-size").textContent = "—";
    $("#setup-message").textContent = "The question bank could not load. Refresh this page or try again later.";
    $("#start-custom").disabled = true;
    console.error("Question bank error:", error);
  }
}
init();
