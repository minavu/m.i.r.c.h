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

const C_LOG = console.log;
const TEXT_COLORS = ["Brown", "DarkBlue", "Crimson", "Chocolate", "BlueViolet"];

io.on("connection", (socket) => {
  socket.leave(socket.id);
  socket.join("Lobby");

  let color = TEXT_COLORS[Math.floor(Math.random() + 5)];
  let username = socket.id.substring(0, 6).toUpperCase();
  const MY_DATA = {
    my_username: username,
    my_rooms: ["Lobby"],
    my_current_room: "Lobby",
    my_color: color,
  };

  C_LOG(
    `Client with given username ${MY_DATA.my_username} connected to server...`
  );

  socket.emit("welcome", {
    welcome_message: "Welcome to the chat",
    socket_data: MY_DATA,
    rooms: getAllRooms(),
    users: getAllUsers(),
  });

  socket.on("message", (data) => {
    let { socket_data, message } = data;
    C_LOG(socket_data);
    updateMyData(socket_data);
    io.to(MY_DATA.my_current_room).emit("message", {
      user: MY_DATA.my_username,
      message: message,
    });
  });

  socket.on("create_room", () => {
    let new_room = uniqueNamesGenerator({ dictionaries: [colors] });
    new_room =
      new_room.charAt(0).toUpperCase() + new_room.slice(1, new_room.length - 1);
    joinRoomAndEmitStatus(new_room);
  });

  socket.on("join_room", (data) => {
    let { room } = data;
    joinRoomAndEmitStatus(room);
  });

  socket.on("leave_room", (data) => {
    let { room } = data;

    io.to(room).emit("announcement", {
      announcement: `${MY_DATA.my_username} has left room ${room}`,
    });

    socket.leave(room);
    MY_DATA.my_rooms = MY_DATA.my_rooms.filter((my_room) => my_room !== room);
    MY_DATA.my_current_room = MY_DATA.my_rooms[MY_DATA.my_rooms.length - 1];

    socket.emit("left_room", {
      socket_data: MY_DATA,
    });

    io.emit("update_rooms_list", {
      rooms: getAllRooms(),
    });
  });

  // socket.on("disconnect", () => {
  //   if (curr_room === "") {
  //     io.emit("update_users_list", {
  //       room: curr_room,
  //       users: getAllUsers(),
  //     });
  //   } else {
  //     io.to(curr_room).emit("announcement", {
  //       socket: sock_id,
  //       announce: "has left room",
  //       room: curr_room,
  //     });

  //     io.to(curr_room).emit("udate_users_list", {
  //       room: curr_room,
  //       users: getRoomUsers(curr_room),
  //     });
  //   }
  // });

  function joinRoomAndEmitStatus(room_to_join) {
    socket.join(room_to_join);
    MY_DATA.my_rooms.push(room_to_join);
    MY_DATA.my_current_room = room_to_join;

    socket.emit("joined_room", {
      socket_data: MY_DATA,
    });

    io.to(MY_DATA.my_current_room).emit("announcement", {
      announcement: `${MY_DATA.my_username} just joined room ${MY_DATA.my_current_room}`,
    });

    io.emit("update_rooms_list", {
      rooms: getAllRooms(),
    });
  }

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

  function updateMyData(new_socket_data) {
    let { my_username, my_rooms, my_current_room, my_color } = new_socket_data;
    MY_DATA.my_username = my_username;
    MY_DATA.my_rooms = my_rooms;
    MY_DATA.my_current_room = my_current_room;
    MY_DATA.my_color = my_color;
  }
});

server.listen(port, () => {
  console.log(`M.I.R.C.H Application running at "http://localhost:${port}/"`);
});
