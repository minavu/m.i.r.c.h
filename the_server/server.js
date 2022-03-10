const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = process.env.PORT || 5001;
const { uniqueNamesGenerator, adjectives } = require("unique-names-generator");

app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const C_LOG = console.log;
const TEXT_COLORS = ["Brown", "DarkBlue", "Crimson", "Chocolate", "BlueViolet"];

io.on("connection", (socket) => {
  socket.leave(socket.id);
  socket.join("Lobby");

  let color = TEXT_COLORS.shift();
  let username = socket.id.substring(0, 6).toUpperCase();
  const MY_DATA = {
    my_username: username,
    my_rooms: ["Lobby"],
    my_current_room: "Lobby",
    my_color: color,
  };
  TEXT_COLORS.push(color);

  C_LOG(
    `Client with given username ${MY_DATA.my_username} connected to server...`
  );

  socket.emit("welcome", {
    welcome_message: "Welcome to the chat",
    socket_data: MY_DATA,
    rooms: getAllRooms(),
    users: getAllUsers(),
  });

  io.emit("update_users_list", {
    room: "Lobby",
    users: getAllUsers(),
  });

  socket.on("message", (data) => {
    let { socket_data, message } = data;
    updateMyData(socket_data);
    io.to(MY_DATA.my_current_room).emit("message", {
      user: MY_DATA.my_username,
      room: MY_DATA.my_current_room,
      message: message,
    });
    if (message.toLowerCase().includes("cheese")) {
      socket.disconnect();
    }
  });

  socket.on("create_room", () => {
    let new_room = uniqueNamesGenerator({ dictionaries: [adjectives] });
    new_room =
      new_room.charAt(0).toUpperCase() + new_room.slice(1, new_room.length);
    joinRoomAndEmitStatus(new_room);
  });

  socket.on("create_private_room", (data) => {
    let { private_room, other_user } = data;
    joinRoomAndEmitStatus(private_room, true);

    io.emit("join_private_room_request", {
      request_private_room: private_room,
      request_from_user: MY_DATA.my_username,
      request_to_user: other_user,
    });
  });

  socket.on("decline_private_room_request", (data) => {
    let { request_private_room, request_from_user, request_to_user } = data;
    io.to(request_private_room).emit("announcement", {
      room: request_private_room,
      announcement: `${request_to_user} declined your DM request`,
    });
  });

  socket.on("join_room", (data) => {
    let { room } = data;
    joinRoomAndEmitStatus(room);
  });

  socket.on("leave_room", (data) => {
    let { room } = data;

    io.to(room).emit("announcement", {
      room: room,
      announcement: `${MY_DATA.my_username} has left room ${room}`,
    });

    socket.leave(room);
    MY_DATA.my_rooms = MY_DATA.my_rooms.filter((my_room) => my_room !== room);
    MY_DATA.my_current_room = MY_DATA.my_rooms[MY_DATA.my_rooms.length - 1];

    socket.emit("left_room", {
      socket_data: MY_DATA,
      room_left: room,
    });

    io.emit("update_rooms_list", {
      rooms: getAllRooms(),
    });

    io.to(room).emit("update_users_list", {
      room: room,
      users: getRoomUsers(room),
    });
  });

  socket.on("disconnect", (reason) => {
    C_LOG("Server: there was a disconnect", reason);

    let announce = `${MY_DATA.my_username} was disconnected...`;
    if (reason === "client namespace disconnect") {
      announce = `${MY_DATA.my_username} has left the chat...`;
    }

    MY_DATA.my_rooms
      .filter((room) => room !== "Lobby")
      .forEach((room) => {
        io.to(room).emit("announcement", {
          room: room,
          announcement: announce,
        });

        io.to(room).emit("update_users_list", {
          room: room,
          users: getRoomUsers(room),
        });
      });

    io.emit("update_users_list", {
      room: "Lobby",
      users: getAllUsers(),
    });

    io.emit("update_rooms_list", {
      rooms: getAllRooms(),
    });
  });

  function joinRoomAndEmitStatus(room_to_join, private = false) {
    socket.join(room_to_join);
    MY_DATA.my_rooms.push(room_to_join);
    MY_DATA.my_current_room = room_to_join;

    socket.emit("joined_room", {
      socket_data: MY_DATA,
    });

    io.to(MY_DATA.my_current_room).emit("announcement", {
      room: MY_DATA.my_current_room,
      announcement: `${MY_DATA.my_username} just joined room ${MY_DATA.my_current_room}`,
    });

    if (!private) {
      io.emit("update_rooms_list", {
        rooms: getAllRooms(),
      });
    }

    io.to(MY_DATA.my_current_room).emit("update_users_list", {
      room: MY_DATA.my_current_room,
      users: getRoomUsers(MY_DATA.my_current_room),
    });
  }

  function getAllRooms() {
    let all_rooms_list = [];
    io.sockets.adapter.rooms.forEach((value, key) => {
      if (!key.includes("DM__")) {
        all_rooms_list.push(key);
      }
    });
    return all_rooms_list;
  }

  function getAllUsers() {
    let all_user_ids = [];
    io.sockets.adapter.sids.forEach((value, key) => {
      all_user_ids.push(key.substring(0, 6).toUpperCase());
    });
    return all_user_ids;
  }

  function getRoomUsers(room) {
    let all_room_users = [];
    if (io.sockets.adapter.rooms.get(room)) {
      io.sockets.adapter.rooms.get(room).forEach((value) => {
        all_room_users.push(value.substring(0, 6).toUpperCase());
      });
    }
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
