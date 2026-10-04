const state = {
  apiBase: localStorage.getItem("codingArenaApiBase") || "",
  userId: Number(localStorage.getItem("codingArenaUserId") || 2),
  admin: localStorage.getItem("codingArenaAdmin") === "true",
  route: "home",
  history: [],
  timerHandle: null,
  timerEnd: null,
  timerLabel: ""
};

const demo = {
  contests: [
    {id: 1, title: "Weekly Sprint", description: "Fast problems • Rating challenge", durationSeconds: 7200, startTime: new Date(Date.now()-1800000).toISOString()},
    {id: 2, title: "Code Masters", description: "Algorithms • Data structures", durationSeconds: 10800, startTime: new Date(Date.now()+3600000).toISOString()}
  ],
  problems: {
    1: [
      {id: 101, title: "Two Sum", statement: "Given an integer array and a target, find two different indices whose values add up to the target.", points: 100, difficulty: "Easy"},
      {id: 102, title: "Binary Search", statement: "Find the target in a sorted array.", points: 150, difficulty: "Medium"}
    ],
    2: [
      {id: 201, title: "Graph Paths", statement: "Find the shortest path in a graph.", points: 200, difficulty: "Hard"}
    ]
  },
  leaderboard: [
    {username:"CodeMaster", rating:1842, solved:146},
    {username:"AlgoNinja", rating:1765, solved:131},
    {username:"JavaPro", rating:1688, solved:119},
    {username:"You", rating:1500, solved:12}
  ],
  submissions: []
};

const $ = id => document.getElementById(id);

function escapeHtml(v="") {
  return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function toast(message) {
  $("toastBody").textContent = message;
  bootstrap.Toast.getOrCreateInstance($("toast"), {delay: 2600}).show();
}

function setTitle(title, subtitle="Practice • Compete • Climb") {
  $("pageTitle").textContent = title;
  $("pageSubtitle").textContent = subtitle;
}

function setTimer(endMs, label="") {
  clearInterval(state.timerHandle);
  state.timerEnd = endMs;
  state.timerLabel = label;
  const tick = () => {
    if (!state.timerEnd) return;
    const left = state.timerEnd - Date.now();
    if (left <= 0) {
      $("timer").textContent = "ENDED";
      clearInterval(state.timerHandle);
      return;
    }
    const s = Math.floor(left/1000);
    const h = String(Math.floor(s/3600)).padStart(2,"0");
    const m = String(Math.floor((s%3600)/60)).padStart(2,"0");
    const sec = String(s%60).padStart(2,"0");
    $("timer").textContent = state.timerLabel ? `${state.timerLabel} ${h}:${m}:${sec}` : `${h}:${m}:${sec}`;
  };
  $("timer").classList.remove("d-none");
  tick();
  state.timerHandle = setInterval(tick, 1000);
}

function clearTimer() {
  clearInterval(state.timerHandle);
  state.timerEnd = null;
  $("timer").textContent = "";
  $("timer").classList.add("d-none");
}

function navigate(route, opts={}) {
  if (state.route && state.route !== route && opts.push !== false) state.history.push(state.route);
  state.route = route;
  render();
}

function goBack() {
  if (state.history.length) {
    const previous = state.history.pop();
    state.route = previous;
    render({push:false});
  } else {
    navigate("home", {push:false});
  }
}

$("backBtn").addEventListener("click", goBack);

window.addEventListener("popstate", e => {
  if (e.state?.route) {
    state.route = e.state.route;
    render({push:false});
  } else {
    goBack();
  }
});

function render() {
  clearTimer();
  updateNav();
  const content = $("content");
  content.innerHTML = "";
  const pages = {
    home, contests, leaderboard, profile, submissions, challenges,
    community, discussions, announcements, notifications, helpFaq, achievements,
    createContest, createProblem
  };
  (pages[state.route] || home)();
}

function updateNav() {
  document.querySelectorAll(".nav-item").forEach(b => {
    b.classList.toggle("active", b.dataset.route === state.route);
  });
}

document.querySelectorAll(".nav-item").forEach(b => {
  b.addEventListener("click", () => navigate(b.dataset.route));
});

$("menuBtn").addEventListener("click", () => {
  const items = [
    ["Home","home","⌂"], ["Contests","contests","🏆"], ["Challenges","challenges","⚡"],
    ["Community","community","💬"], ["Leaderboard","leaderboard","🥇"], ["Profile","profile","👤"],
    ["Submissions","submissions","📋"]
  ];
  if (state.admin) {
    items.push(["Create Contest","createContest","➕"],["Create Problem","createProblem","📝"]);
  }
  items.push(["API Settings","apiSettings","⚙"],["Logout","logout","↪"]);
  const box = $("menuItems");
  box.innerHTML = items.map(([label,route,icon]) =>
    `<button class="list-group-item list-group-item-action" data-menu-route="${route}">${icon} &nbsp; ${label}</button>`
  ).join("");
  box.querySelectorAll("[data-menu-route]").forEach(b => b.addEventListener("click", () => {
    bootstrap.Modal.getOrCreateInstance($("menuModal")).hide();
    if (b.dataset.menuRoute === "apiSettings") return apiSettings();
    if (b.dataset.menuRoute === "logout") return login();
    navigate(b.dataset.menuRoute);
  }));
  bootstrap.Modal.getOrCreateInstance($("menuModal")).show();
});

function home() {
  setTitle("CodingArena");
  $("content").innerHTML = `
    <div class="hero">
      <h1>${state.admin ? "⚡ Admin Arena" : "⚡ Ready to code?"}</h1>
      <p>${state.admin ? "Manage contests and problems from one place." : "Compete in challenges and climb the rankings."}</p>
    </div>
    <div class="section-title">🏆 Quick actions</div>
    <div class="quick-grid">
      ${quickCard("🏆","Contests","contests")}
      ${quickCard("🥇","Leaderboard","leaderboard")}
      ${quickCard("👤","Profile","profile")}
      ${quickCard("📋","Submissions","submissions")}
    </div>
    <div class="section-title">⚡ Coding challenges</div>
    ${actionButton("🔥","Daily Coding Challenge","dailyChallenge")}
    ${actionButton("⚡","Speed Coding","speedCoding")}
    <div class="section-title">💬 Community</div>
    ${actionButton("💬","User Discussions","discussions")}
    ${actionButton("📢","Announcements","announcements")}
    <div class="section-title">🚀 Featured contests</div>
    ${demo.contests.map(c => contestCard(c)).join("")}
    ${state.admin ? `<div class="section-title">🛠 Admin tools</div>${actionButton("➕","Create Contest","createContest")}${actionButton("📝","Create Problem","createProblem")}` : ""}
  `;
  bindActions();
}

function quickCard(icon,label,route) {
  return `<button class="card-btn" data-route-action="${route}"><span class="emoji">${icon}</span><strong>${label}</strong></button>`;
}

function actionButton(icon,label,route) {
  return `<button class="action-card btn" data-route-action="${route}">${icon} &nbsp; ${label}</button>`;
}

function bindActions() {
  document.querySelectorAll("[data-route-action]").forEach(b => b.addEventListener("click", () => {
    const r = b.dataset.routeAction;
    if (r === "dailyChallenge") return dailyChallenge();
    if (r === "speedCoding") return speedCoding();
    navigate(r);
  }));
  document.querySelectorAll("[data-contest-id]").forEach(b => b.addEventListener("click", () => {
    const c = demo.contests.find(x => x.id == b.dataset.contestId);
    if (c) contest(c);
  }));
}

async function api(path, options={}) {
  const url = `${state.apiBase}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {"Content-Type":"application/json", ...(options.headers||{})}
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

function contestCard(c) {
  return `<div class="contest-card" data-contest-id="${c.id}">
    <div class="contest-title">${c.id % 2 ? "🔥" : "⚡"} ${escapeHtml(c.title)}</div>
    <div class="contest-desc">${escapeHtml(c.description || "Competitive programming contest")}</div>
    <div class="contest-time">⏱ ${contestRemaining(c.startTime,c.durationSeconds)}</div>
  </div>`;
}

function contestRemaining(start,duration) {
  const end = new Date(start).getTime() + duration*1000;
  const left = end - Date.now();
  if (left <= 0) return "ENDED";
  const s = Math.floor(left/1000);
  return `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor(s%3600/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

async function contests() {
  setTitle("Contests");
  $("content").innerHTML = `<div class="section-title">🏆 Live & upcoming</div><div id="contestList"><div class="text-muted p-3">Loading contests…</div></div>`;
  let data;
  try { data = await api("/api/contests"); }
  catch { data = demo.contests; toast("Backend unavailable — showing demo contests."); }
  $("contestList").innerHTML = data.map(contestCard).join("") || `<div class="panel p-4">No contests available.</div>`;
  document.querySelectorAll("[data-contest-id]").forEach(el => {
    el.addEventListener("click", () => {
      const c = data.find(x => x.id == el.dataset.contestId);
      contest(c);
    });
  });
  if (state.admin) $("contestList").insertAdjacentHTML("beforeend", actionButton("➕","Create Contest","createContest"));
  bindActions();
}

async function contest(c) {
  setTitle(c.title);
  const start = new Date(c.startTime).getTime();
  setTimer(start + Number(c.durationSeconds)*1000);
  $("content").innerHTML = `<div class="section-title">📝 Problems</div><div id="problemList"><div class="text-muted p-3">Loading problems…</div></div>`;
  let problems;
  try { problems = await api(`/api/contests/${c.id}/problems`); }
  catch { problems = demo.problems[c.id] || []; toast("Backend unavailable — showing demo problems."); }
  $("problemList").innerHTML = problems.map(p => `
    <div class="list-card">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <div class="contest-title">📝 ${escapeHtml(p.title)}</div>
          <div class="contest-desc">${escapeHtml(p.difficulty || "Problem")} • ${p.points} pts</div>
        </div>
        <button class="btn primary-gradient px-4" data-open-ide="${p.id}">💻 Open IDE</button>
      </div>
      <div class="mt-2 text-muted">${escapeHtml(p.statement || "")}</div>
    </div>`).join("") +
    `<button class="action-card btn" id="rankBtn">🏆 Live Contest Ranking</button>`;
  document.querySelectorAll("[data-open-ide]").forEach(b => b.addEventListener("click", () => {
    const p = problems.find(x => x.id == b.dataset.openIde);
    if (p) ide(c,p);
  }));
  $("rankBtn").addEventListener("click", () => rank(c.id));
}

function ide(c,p) {
  setTitle(`IDE · ${p.title}`, "Java • C++ • Python");
  $("content").innerHTML = `
    <div class="ide-panel">
      <div class="p-3 bg-white border-bottom">
        <div class="fw-bold">${escapeHtml(p.title)}</div>
        <div class="text-muted small">${escapeHtml(p.difficulty || "")} • ${p.points || 0} points</div>
      </div>
      <div class="p-3 bg-white border-bottom">
        <select id="language" class="form-select" style="max-width:220px">
          <option>Java</option><option>C++</option><option>Python</option>
        </select>
      </div>
      <textarea id="editor" class="editor"></textarea>
      <div class="p-3 bg-white d-flex gap-2 flex-wrap">
        <button id="submitCode" class="btn primary-gradient px-4">🚀 Submit Solution</button>
        <button id="resetCode" class="btn btn-outline-secondary">Reset</button>
      </div>
    </div>`;
  $("editor").value = defaultCode("Java");
  $("language").addEventListener("change", e => $("editor").value = defaultCode(e.target.value));
  $("resetCode").addEventListener("click", () => $("editor").value = defaultCode($("language").value));
  $("submitCode").addEventListener("click", () => submitSolution(c,p));
}

function defaultCode(lang) {
  if (lang === "Python") return `def solve():\n    # solution\n    pass\n\nif __name__ == "__main__":\n    solve()\n`;
  if (lang === "C++") return `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // solution\n    return 0;\n}\n`;
  return `import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        // solution\n    }\n}\n`;
}

async function submitSolution(c,p) {
  const language = $("language").value;
  const source = $("editor").value;
  const payload = {userId:state.userId, contestId:c.id, problemId:p.id, language, source};
  try {
    const result = await api("/api/submissions", {method:"POST", body:JSON.stringify(payload)});
    const id = result.submissionId || result.id;
    toast(`Submitted${id ? ` — submission #${id}` : ""}`);
    if (id) submissionStatus(id);
  } catch {
    demo.submissions.unshift({id:Date.now(), language, verdict:"OFFLINE", score:0, problem:p.title});
    toast("Backend unavailable — saved as local demo submission.");
    navigate("submissions");
  }
}

async function submissionStatus(id) {
  setTitle(`Submission #${id}`);
  $("content").innerHTML = `<div class="panel p-4">Waiting for judge…</div>`;
  try {
    const x = await api(`/api/submissions/${id}`);
    $("content").innerHTML = `<div class="panel p-4"><h5>Verdict: ${escapeHtml(x.verdict)}</h5><div>Score: ${x.score ?? 0}</div><div>Time: ${x.executionMs ?? 0} ms</div><div>Memory: ${x.memoryKb ?? 0} KB</div></div>`;
    if (["QUEUED","RUNNING"].includes(x.verdict)) setTimeout(() => submissionStatus(id),2000);
  } catch {
    $("content").innerHTML = `<div class="panel p-4">Judge status is unavailable.</div>`;
  }
}

async function leaderboard() {
  setTitle("Global Leaderboard");
  $("content").innerHTML = `<div class="section-title">🥇 Rankings</div><div id="rankList">Loading…</div>`;
  let data;
  try { data = await api("/api/leaderboard"); }
  catch { data = demo.leaderboard; toast("Backend unavailable — showing demo ranking."); }
  $("rankList").innerHTML = data.map((x,i) => `<div class="list-card"><strong>#${i+1} ${escapeHtml(x.username)}</strong><div class="text-muted">Rating ${x.rating} • Solved ${x.solved}</div></div>`).join("");
}

async function rank(cid) {
  setTitle("Live Ranking");
  $("content").innerHTML = `<div class="section-title">🏆 Contest Ranking</div><div id="rankList">Loading…</div>`;
  let data;
  try { data = await api(`/api/contests/${cid}/rankings`); }
  catch { data = demo.leaderboard; }
  $("rankList").innerHTML = data.map((x,i) => `<div class="list-card"><strong>#${i+1} ${escapeHtml(x.username)}</strong><div class="text-muted">Score ${x.score ?? 0} • Solved ${x.solved ?? 0}</div></div>`).join("");
}

async function profile() {
  setTitle("Profile");
  $("content").innerHTML = `<div class="panel p-4">Loading profile…</div>`;
  try {
    const x = await api(`/api/users/${state.userId}`);
    $("content").innerHTML = `<div class="hero"><h1>👤 @${escapeHtml(x.username)}</h1><p>${escapeHtml(x.displayName || "")}</p></div><div class="quick-grid"><div class="panel p-4"><strong>Rating</strong><div class="fs-4">${x.rating ?? 0}</div></div><div class="panel p-4"><strong>Solved</strong><div class="fs-4">${x.solved ?? 0}</div></div></div>`;
  } catch {
    $("content").innerHTML = `<div class="hero"><h1>👤 Demo User</h1><p>Competitive programmer</p></div><div class="quick-grid"><div class="panel p-4"><strong>Rating</strong><div class="fs-4">1500</div></div><div class="panel p-4"><strong>Solved</strong><div class="fs-4">12</div></div></div>`;
  }
}

async function submissions() {
  setTitle("Submissions");
  $("content").innerHTML = `<div id="submissionList">Loading…</div>`;
  let data;
  try { data = await api(`/api/users/${state.userId}/submissions`); }
  catch { data = demo.submissions; }
  $("submissionList").innerHTML = data.length ? data.map(x => `<div class="list-card"><strong>#${x.id} · ${escapeHtml(x.language)}</strong><div class="text-muted">${escapeHtml(x.verdict)} · ${x.score ?? 0} points${x.problem ? ` · ${escapeHtml(x.problem)}` : ""}</div></div>`).join("") : `<div class="panel p-4">No submissions.</div>`;
}

function challenges() {
  setTitle("Challenges");
  $("content").innerHTML = `<div class="section-title">⚡ Coding challenges</div>
    ${actionButton("🔥","Daily Coding Challenge","dailyChallenge")}
    ${actionButton("⚡","Speed Coding","speedCoding")}
    ${actionButton("🐞","Debugging Challenge","debuggingChallenge")}
    ${actionButton("🔎","Output Prediction","outputPrediction")}
    ${actionButton("🧠","Programming Quiz","programmingQuiz")}
    ${actionButton("📚","Practice Arena","practiceArena")}`;
  bindActions();
}

function dailyChallenge() {
  setTitle("Daily Challenge");
  $("content").innerHTML = `<div class="section-title">🔥 Daily Coding Challenge</div>
  <div class="panel p-4"><h5>Two Sum</h5><p>Given an integer array and a target, find two different indices whose values add up to the target.</p><p class="text-muted">Example: [2, 7, 11, 15], target = 9 → indices 0 and 1.</p></div>
  ${actionButton("💻","Open IDE","challenges")}
  ${actionButton("🏆","Submit Challenge","challenges")}`;
  bindActions();
}

function speedCoding() {
  setTitle("Speed Coding");
  $("content").innerHTML = `<div class="section-title">⚡ Speed Coding</div>
  <div class="panel p-4"><h5>Reverse a String</h5><p>Input: CodingArena</p><p>Expected output: anera gnidoC</p><p>Target time: 60 seconds</p></div>
  ${actionButton("▶","Start 60 Second Challenge","startSpeed")}
  ${actionButton("💻","Open IDE","challenges")}`;
  bindActions();
  document.querySelector("[data-route-action='startSpeed']").addEventListener("click", () => setTimer(Date.now()+60000,""));
}

function debuggingChallenge() {
  setTitle("Debugging Challenge");
  $("content").innerHTML = `<div class="panel p-4"><h5>🐞 Find the bug</h5><pre>int a = 10;\nint b = 0;\nSystem.out.println(a / b);</pre><p>Fix the program so it does not crash.</p><textarea id="debugAnswer" class="form-control" rows="9" placeholder="Write corrected code"></textarea></div>
  ${actionButton("🐞","Check Fix","debugCheck")}`;
  bindActions();
  document.querySelector("[data-route-action='debugCheck']").addEventListener("click", () => toast($("debugAnswer").value.trim() ? "Fix submitted for checking." : "Enter your corrected code first."));
}

function outputPrediction() {
  setTitle("Output Prediction");
  $("content").innerHTML = `<div class="panel p-4"><h5>🔎 What does this print?</h5><pre>int x = 5;\nint y = 2;\nSystem.out.println(x * y + 3);</pre><select id="answer" class="form-select"><option>8</option><option>10</option><option>13</option><option>15</option></select></div>${actionButton("✓","Check Answer","checkOutput")}`;
  bindActions();
  document.querySelector("[data-route-action='checkOutput']").addEventListener("click", () => toast($("answer").value === "13" ? "Correct! +50 points" : "Not correct. Try again."));
}

function programmingQuiz() {
  setTitle("Programming Quiz");
  $("content").innerHTML = `<div class="panel p-4"><h5>🧠 Question 1</h5><p>Which data structure follows LIFO order?</p><select id="quiz" class="form-select"><option>Queue</option><option>Stack</option><option>Array</option><option>Graph</option></select></div>${actionButton("✓","Submit Answer","checkQuiz")}`;
  bindActions();
  document.querySelector("[data-route-action='checkQuiz']").addEventListener("click", () => toast($("quiz").value === "Stack" ? "Correct! +50 points" : "Incorrect. Correct answer: Stack"));
}

function practiceArena() {
  setTitle("Practice Arena");
  $("content").innerHTML = `<div class="section-title">📚 Practice Arena</div>${actionButton("🟢","Easy Problems","contests")}${actionButton("🟡","Medium Problems","contests")}${actionButton("🔴","Hard Problems","contests")}`;
  bindActions();
}

function community() {
  setTitle("Community");
  $("content").innerHTML = `<div class="section-title">💬 Community</div>
  <p class="text-muted">Discuss problems, share solutions and stay updated with CodingArena.</p>
  ${actionButton("💬","User Discussions","discussions")}
  ${actionButton("📢","Announcements","announcements")}
  ${actionButton("🔔","Notifications","notifications")}
  ${actionButton("❓","Help & FAQ","helpFaq")}
  ${actionButton("🏅","Achievements","achievements")}`;
  bindActions();
}

function discussions() {
  setTitle("User Discussions");
  const topics = ["How to approach Two Sum efficiently?","Best way to learn Dynamic Programming?","Java vs C++ for competitive programming","Tips for improving contest speed"];
  $("content").innerHTML = `<div class="section-title">💬 User Discussions</div><p class="text-muted">Ask questions, share approaches and discuss coding problems.</p>
    ${topics.map(t => `<div class="list-card"><strong>💬 ${escapeHtml(t)}</strong><div class="text-muted small mt-1">Community discussion</div></div>`).join("")}
    ${actionButton("＋","Start New Discussion","startDiscussion")}`;
  bindActions();
}

function startDiscussion() {
  setTitle("New Discussion");
  $("content").innerHTML = `<div class="panel p-4"><div class="section-title mt-0">✏️ Start a Discussion</div>
    <input id="discussionTitle" class="form-control mb-3" placeholder="Discussion title">
    <textarea id="discussionBody" class="form-control" rows="8" placeholder="Write your question or discussion…"></textarea>
    </div>${actionButton("📤","Post Discussion","postDiscussion")}`;
  bindActions();
  document.querySelector("[data-route-action='postDiscussion']").addEventListener("click", () => {
    if (!$("discussionTitle").value.trim()) return toast("Enter a discussion title first.");
    toast("Discussion created locally. Connect your backend to make it public.");
  });
}

function announcements() {
  setTitle("Announcements");
  $("content").innerHTML = `<div class="section-title">📢 Announcements</div>
    ${actionButton("🏆","New Weekly Contest","contests")}
    ${actionButton("⚡","New Coding Challenges","challenges")}
    ${actionButton("🚀","CodingArena Updates","community")}`;
  bindActions();
}

function notifications() {
  setTitle("Notifications");
  const notes = ["Your Weekly Sprint result is available.","A new Daily Coding Challenge is available.","Your discussion received a reply.","A new contest is starting soon."];
  $("content").innerHTML = `<div class="section-title">🔔 Notifications</div>${notes.map(n => `<div class="list-card">🔔 ${escapeHtml(n)}</div>`).join("")}`;
}

function helpFaq() {
  setTitle("Help & FAQ");
  const faq = ["How do I join a contest?","How are submissions judged?","How does the leaderboard work?","How do I submit Java, C++ or Python code?","How do I report a problem?"];
  $("content").innerHTML = `<div class="section-title">❓ Help & FAQ</div>${faq.map(q => `<div class="list-card"><strong>❓ ${escapeHtml(q)}</strong><div class="text-muted small mt-1">Connect this item to your FAQ backend/content.</div></div>`).join("")}`;
}

function achievements() {
  setTitle("Achievements");
  const a = [["🥇","First Solve","Solve your first coding problem"],["🔥","Coding Streak","Complete challenges on consecutive days"],["💬","Community Helper","Help other users through discussions"],["🏆","Contest Champion","Finish at the top of a contest"]];
  $("content").innerHTML = `<div class="section-title">🏅 Achievements</div><p class="text-muted">Earn badges by competing, solving problems and helping the community.</p>${a.map(x => `<div class="list-card"><strong>${x[0]} ${x[1]}</strong><div class="text-muted">${x[2]}</div></div>`).join("")}`;
}

function createContest() {
  setTitle("Create Contest");
  $("content").innerHTML = `<div class="panel p-4">
    <input id="ctitle" class="form-control mb-3" placeholder="Title">
    <input id="cdesc" class="form-control mb-3" placeholder="Description">
    <input id="cdur" type="number" class="form-control mb-3" placeholder="Duration seconds" value="7200">
    <button id="createContestBtn" class="btn primary-gradient">Create Contest</button>
  </div>`;
  $("createContestBtn").addEventListener("click", async () => {
    try {
      await api("/api/contests",{method:"POST",body:JSON.stringify({title:$("ctitle").value,description:$("cdesc").value,durationSeconds:Number($("cdur").value),createdBy:state.userId})});
      toast("Contest created.");
      navigate("contests");
    } catch { toast("Create failed — check your API URL and backend."); }
  });
}

function createProblem() {
  setTitle("Create Problem");
  $("content").innerHTML = `<div class="panel p-4">
    <input id="pid" type="number" class="form-control mb-3" placeholder="Contest ID">
    <input id="ptitle" class="form-control mb-3" placeholder="Title">
    <textarea id="pstatement" class="form-control mb-3" rows="7" placeholder="Statement"></textarea>
    <input id="ppoints" type="number" class="form-control mb-3" placeholder="Points" value="100">
    <input id="pdifficulty" class="form-control mb-3" placeholder="Difficulty" value="Easy">
    <button id="createProblemBtn" class="btn primary-gradient">Create Problem</button>
  </div>`;
  $("createProblemBtn").addEventListener("click", async () => {
    try {
      await api("/api/problems",{method:"POST",body:JSON.stringify({contestId:Number($("pid").value),title:$("ptitle").value,statement:$("pstatement").value,points:Number($("ppoints").value),difficulty:$("pdifficulty").value})});
      toast("Problem created.");
      navigate("contests");
    } catch { toast("Create failed — check your API URL and backend."); }
  });
}

function apiSettings() {
  const current = state.apiBase || "(same origin)";
  const value = prompt("Spring Boot API base URL. Example: http://localhost:8080", current === "(same origin)" ? "" : current);
  if (value !== null) {
    state.apiBase = value.replace(/\/$/,"");
    localStorage.setItem("codingArenaApiBase", state.apiBase);
    toast("API URL saved.");
  }
}

function login() {
  setTitle("CodingArena");
  $("content").innerHTML = `<div class="hero"><h1>⌘ CodingArena</h1><p>Practice • Compete • Climb the leaderboard</p></div>
    <div class="section-title">🔥 Choose your arena</div>
    <p class="text-muted">Select a demo role or connect your existing backend.</p>
    <div class="quick-grid">
      <button id="userLogin" class="card-btn"><span class="emoji">👤</span><strong>Demo User</strong></button>
      <button id="adminLogin" class="card-btn"><span class="emoji">🛠</span><strong>Contest Admin</strong></button>
    </div>`;
  $("userLogin").onclick = () => { state.userId=2; state.admin=false; localStorage.setItem("codingArenaUserId",2); localStorage.setItem("codingArenaAdmin","false"); navigate("home",{push:false}); };
  $("adminLogin").onclick = () => { state.userId=1; state.admin=true; localStorage.setItem("codingArenaUserId",1); localStorage.setItem("codingArenaAdmin","true"); navigate("home",{push:false}); };
}

render();
