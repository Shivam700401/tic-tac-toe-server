const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

io.on("connection", (socket) => {
  socket.on("createRoom", () => {
    const code = Math.random().toString(36).substr(2, 5).toUpperCase();
    rooms[code] = [socket.id];
    socket.join(code);
    socket.emit("roomCreated", code);
  });

  socket.on("joinRoom", (code) => {
    if (rooms[code] && rooms[code].length === 1) {
      rooms[code].push(socket.id);
      socket.join(code);
      io.to(code).emit("startGame");
    } else {
      socket.emit("error", "Room not available");
    }
  });

  socket.on("play", ({ code, index, symbol }) => {
    socket.to(code).emit("play", { index, symbol });
  });

  socket.on("reset", (code) => {
    io.to(code).emit("reset");
  });
});

server.listen(3000);
