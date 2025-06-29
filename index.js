const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {}; // Room codes: [socket1, socket2]
const playerNames = {}; // Player names for each room

io.on("connection", (socket) => {
  socket.on("createRoom", (name) => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    rooms[code] = [socket.id];
    playerNames[code] = { X: name, O: "" };
    socket.join(code);
    socket.emit("roomCreated", { code });
  });

  socket.on("joinRoom", ({ code, playerName }) => {
    const room = rooms[code];
    if (room && room.length === 1) {
      room.push(socket.id);
      playerNames[code].O = playerName;
      socket.join(code);

      io.to(room[0]).emit("startGame", {
        symbol: "X",
        turn: true,
        players: playerNames[code],
      });

      io.to(room[1]).emit("startGame", {
        symbol: "O",
        turn: false,
        players: playerNames[code],
      });
    }
  });

  socket.on("play", ({ code, index, symbol }) => {
    socket.to(code).emit("play", { index, symbol });
  });

  socket.on("reset", (code) => {
    io.to(code).emit("reset");
  });

  socket.on("chat", ({ code, name, message }) => {
    io.to(code).emit("chat", { name, message });
  });
});

app.get("/", (req, res) => {
  res.send("Tic Tac Toe Server is Running");
});

server.listen(3000, () => {
  console.log("Server started on port 3000");
});
