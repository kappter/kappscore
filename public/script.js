const socket = io();
const playerCount = 8;
const scores = Array(playerCount).fill(0);
const active = Array(playerCount).fill(true);
let highScoreWins = true;

const center = 300;
const radius = 250;

function renderPlayers() {
  const container = document.getElementById("players-circle");
  container.innerHTML = "";

  for (let i = 0; i < playerCount; i++) {
    const angle = (i / playerCount) * 2 * Math.PI;
    const x = center + radius * Math.cos(angle) - 60;
    const y = center + radius * Math.sin(angle) - 60;

    const div = document.createElement("div");
    div.className = "player";
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    if (!active[i]) div.classList.add("inactive");

    div.innerHTML = `
      <button onclick="changeScore(${i}, -1)">−</button>
      <div class="score" id="score-${i}">${scores[i]}</div>
      <button onclick="changeScore(${i}, 1)">+</button>
      <button onclick="toggleActive(${i})">Active</button>
    `;
    container.appendChild(div);
  }
}

function changeScore(index, delta) {
  if (!active[index]) return;
  scores[index] += delta;
  socket.emit("updateScores", scores);
}

function toggleActive(index) {
  active[index] = !active[index];
  socket.emit("updateActive", active);
}

document.getElementById("score-mode-toggle").onchange = (e) => {
  highScoreWins = e.target.checked;
  socket.emit("updateGameMode", highScoreWins);
};

socket.on("init", (data) => {
  data.scores.forEach((s, i) => (scores[i] = s));
  data.active.forEach((a, i) => (active[i] = a));
  highScoreWins = data.highScoreWins;
  document.getElementById("score-mode-toggle").checked = highScoreWins;
  renderPlayers();
});

socket.on("scoreUpdate", (data) => {
  data.forEach((s, i) => {
    scores[i] = s;
    document.getElementById(`score-${i}`).textContent = s;
  });
});

socket.on("activeUpdate", (data) => {
  data.forEach((a, i) => (active[i] = a));
  renderPlayers();
});

socket.on("modeUpdate", (mode) => {
  highScoreWins = mode;
  document.getElementById("score-mode-toggle").checked = mode;
});
