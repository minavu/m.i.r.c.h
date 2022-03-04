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
    users: getAllUsers(),
  });

  socket.on("message", (data) => {
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

    io.to(curr_room).emit("announcement", {
      socket: sock_id,
      announce: "has joined room",
      room: curr_room,
    });

    socket.emit("joined_room", {
      socket: sock_id,
      status: "created and join new room",
      current: curr_room,
      rooms: getAllRooms(),
    });

    io.emit("update_rooms_list", {
      rooms: getAllRooms(),
    });

    io.to(curr_room).emit("update_users_list", {
      room: curr_room,
      users: getRoomUsers(curr_room),
    });
  });

  socket.on("join_room", (data) => {
    let { room } = data;
    socket.leave(curr_room);
    socket.join(room);
    curr_room = room;

    io.to(curr_room).emit("announcement", {
      socket: sock_id,
      announce: "has joined room",
      room: curr_room,
    });

    socket.emit("joined_room", {
      socket: sock_id,
      status: "joined existing room",
      current: curr_room,
      rooms: getAllRooms(),
    });

    io.to(curr_room).emit("update_users_list", {
      room: curr_room,
      users: getRoomUsers(curr_room),
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

    io.emit("update_rooms_list", {
      rooms: getAllRooms(),
    });

    socket.emit("update_users_list", {
      room: curr_room,
      users: getAllUsers(),
    });
  });

  socket.on("disconnect", () => {
    if (curr_room === "") {
      io.emit("update_users_list", {
        room: curr_room,
        users: getAllUsers(),
      });
    } else {
      io.to(curr_room).emit("announcement", {
        socket: sock_id,
        announce: "has left room",
        room: curr_room,
      });

      io.to(curr_room).emit("udate_users_list", {
        room: curr_room,
        users: getRoomUsers(curr_room),
      });
    }
  });

  function getAllRooms() {
    let all_rooms_list = [];
    io.sockets.adapter.rooms.forEach((value, key) => {
      all_rooms_list.push(key);
    });
    return all_rooms_list;
  }

  function getAllUsers() {
    let all_user_ids = [];
    io.sockets.adapter.sids.forEach((value, key) => {
      all_user_ids.push(key.substring(0, 4).toUpperCase());
    });
    return all_user_ids;
  }

  function getRoomUsers(room) {
    let all_room_users = [];
    console.log("users in room ", room, io.sockets.adapter.rooms.get(room));
    io.sockets.adapter.rooms.get(room).forEach((value) => {
      all_room_users.push(value.substring(0, 4).toUpperCase());
    });
    return all_room_users;
  }
});

server.listen(port, () => {
  console.log(`M.I.R.C.H Application running at "http://localhost:${port}/"`);
});
