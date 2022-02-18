const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 5001;

app.use(express.static(path.join(__dirname, "../the_client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../the_client/index.html"));
});

io.on("connection", (socket) => {
  console.log(`client with socket id ${socket.id} connected`);

  socket.emit("welcome", {
    welcome: "Welcome to the chat",
    socket: socket.id,
  });

  socket.on("message", (data) => {
    console.log("Client says: ", data);

    io.emit("message", {
      socket: socket.id,
      message: data,
    });
  });
});

server.listen(port, () => {
  console.log(`Application running at "http://localhost:${port}/"`);
});
