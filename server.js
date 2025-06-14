const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let scores = [];
let active = [];
let highScoreWins = true;

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.emit("init", { scores, active, highScoreWins });

  socket.on("updateScores", (newScores) => {
    scores = newScores;
    io.emit("scoreUpdate", scores);
  });

  socket.on("updateActive", (newActive) => {
    active = newActive;
    io.emit("activeUpdate", active);
  });

  socket.on("updateGameMode", (mode) => {
    highScoreWins = mode;
    io.emit("modeUpdate", highScoreWins);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
