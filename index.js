const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins (frontend)
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[code] = [socket.id];
    socket.join(code);
    socket.emit("roomCreated", code);
    console.log(`Room ${code} created`);
  });

  socket.on("joinRoom", (code) => {
    if (rooms[code] && rooms[code].length === 1) {
      rooms[code].push(socket.id);
      socket.join(code);
      io.to(code).emit("startGame");
      console.log(`User joined room ${code}`);
    }
  });

  socket.on("play", ({ code, index, symbol }) => {
    socket.to(code).emit("play", { index, symbol });
  });

  socket.on("reset", (code) => {
    io.to(code).emit("reset");
  });

  socket.on("disconnect", () => {
    for (const code in rooms) {
      rooms[code] = rooms[code].filter((id) => id !== socket.id);
      if (rooms[code].length === 0) delete rooms[code];
    }
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Tic Tac Toe Server is running...");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
