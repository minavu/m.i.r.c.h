const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 5001;
const { uniqueNamesGenerator, colors } = require("unique-names-generator");

app.use(express.static(path.join(__dirname, "../the_client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  socket.leave(socket.id);
  let sock_id = socket.id.substring(0, 4).toUpperCase();
  let curr_room = "";
  console.log(`client with socket id ${sock_id} connected`);

  // socket.join("lobby");

  socket.emit("welcome", {
    welcome: "Welcome to the chat",
    socket: sock_id,
    rooms: getAllRooms(),
  });

  socket.on("message", (data) => {
    // console.log("Client says: ", data);

    io.to(curr_room).emit("message", {
      socket: sock_id,
      message: data,
    });
  });

  socket.on("create_room", () => {
    let new_room = uniqueNamesGenerator({ dictionaries: [colors] });
    socket.leave(curr_room);
    socket.join(new_room);
    curr_room = new_room;

    socket.emit("joined_room", {
      socket: sock_id,
      status: "created and join new room",
      current: curr_room,
      rooms: getAllRooms(),
    });
  });

  socket.on("leave_room", () => {
    io.to(curr_room).emit("announcement", {
      socket: sock_id,
      announce: "has left room",
      room: curr_room,
    });

    socket.leave(curr_room);
    curr_room = "";

    socket.emit("left_room", {
      socket: sock_id,
      status: "left room",
      current: curr_room,
      rooms: getAllRooms(),
    });
  });

  function getAllRooms() {
    let all_rooms_list = [];
    io.of("/").adapter.rooms.forEach((value, key) => {
      all_rooms_list.push(key);
    });
    return all_rooms_list;
  }
});

server.listen(port, () => {
  console.log(`M.I.R.C.H Application running at "http://localhost:${port}/"`);
});
