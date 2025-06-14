// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let scores = {};

io.on("connection", socket => {
  console.log("User connected");

  // Send initial scores
  socket.emit("scoreUpdate", scores);

  // Receive new score updates
  socket.on("updateScore", updatedScores => {
    scores = updatedScores;
    io.emit("scoreUpdate", scores); // broadcast to all
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3000, () => console.log("Listening on port 3000"));
