const socket = io("http://localhost:5001");
const C_LOG = console.log;

const MY_DATA = {
  my_username: "",
  my_rooms: [],
  my_current_room: "",
  my_color: "black",
};
let display_chat_title = document.getElementById("title");
let display_chat_screen = document.getElementById("chat-screen");

let joined_room = "";

socket.on("welcome", (data) => {
  let { welcome_message, socket_data, rooms, users } = data;

  updateMyData(socket_data);

  display_chat_title.textContent = `Hello ${MY_DATA.my_username}`;
  displayAllRooms(rooms, MY_DATA.my_rooms);
  displayAllUsers(joined_room, users);

  appendPtagWithScrollToView(
    display_chat_screen,
    `${welcome_message}, ${MY_DATA.my_username}. Select a room from the left screen to start.`
  );
});

socket.on("message", (data) => {
  let { user, message } = data;
  appendPtagWithScrollToView(display_chat_screen, `${user}: ${message}`);
});

socket.on("announcement", (data) => {
  let { announcement } = data;
  appendPtagWithScrollToView(display_chat_screen, announcement);
});

socket.on("update_rooms_list", (data) => {
  let { rooms } = data;
  displayAllRooms(rooms, MY_DATA.my_rooms);
});

// socket.on("update_users_list", (data) => {
//   let { room, users } = data;
//   let users_title = document.getElementById("users-title");
//   users_title.textContent = `${room || "All"} Users`;
//   displayAllUsers(room, users);
// });

socket.on("joined_room", (data) => {
  let { socket_data } = data;
  updateMyData(socket_data);

  display_chat_title.innerHTML = `Room ${MY_DATA.my_current_room}`;

  let btn = document.createElement("input");
  btn.setAttribute("type", "button");
  btn.setAttribute("onclick", "btnHandler(event)");
  btn.setAttribute("value", "Leave");
  btn.setAttribute("name", MY_DATA.my_current_room);
  btn.classList.add("me-2", "btn", "btn-outline-dark");
  btn.style.display = "inline-block";
  display_chat_title.insertBefore(btn, display_chat_title.firstChild);
});

socket.on("left_room", (data) => {
  let { socket_data } = data;
  updateMyData(socket_data);

  display_chat_title.removeChild(display_chat_title.firstChild);
  display_chat_title.innerHTML = `Room ${MY_DATA.my_current_room}`;
});

document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  let message = document.querySelector("#chatbox");
  C_LOG(MY_DATA);
  socket.emit("message", {
    socket_data: MY_DATA,
    message: message.value,
  });
  message.value = "";
});

const btnHandler = (event) => {
  if (event.target.value === "Create") {
    socket.emit("create_room");
  }

  if (event.target.value === "Join") {
    socket.emit("join_room", {
      room: event.target.name,
    });
  }

  if (event.target.value === "Leave") {
    socket.emit("leave_room", {
      room: event.target.name,
    });
  }
};

const displayAllUsers = (joined_room, users) => {
  let display_users = document.getElementById("users");
  display_users.querySelectorAll("p").forEach((p) => {
    p.remove();
  });
  users.forEach((user) => {
    let p = document.createElement("p");
    p.classList.add("text-end");
    p.textContent = user;

    display_users.append(p);
  });
};

const displayAllRooms = (all_rooms, my_rooms) => {
  document.querySelectorAll(".room-line").forEach((line) => line.remove());
  let display_rooms = document.getElementById("rooms");
  all_rooms.forEach((room) => {
    let buttonBootstrapColor = "btn-outline-primary";
    let buttonMessage = "Join";
    if (my_rooms.includes(room)) {
      buttonBootstrapColor = "btn-outline-success";
      buttonMessage = "In";
    }
    appendRoomDescription(
      display_rooms,
      buttonBootstrapColor,
      buttonMessage,
      room
    );
  });
  appendRoomDescription(display_rooms, "btn-danger", "Create", "New Room");
};

const appendRoomDescription = (
  parentElement,
  buttonBootstrapColor,
  buttonMessage,
  roomName
) => {
  let div = document.createElement("div");
  div.setAttribute("class", "room-line");

  let btn = document.createElement("input");
  btn.setAttribute("type", "button");
  btn.setAttribute("onclick", "btnHandler(event)");
  btn.setAttribute("value", buttonMessage);
  btn.setAttribute("name", roomName);
  btn.classList.add("me-2", "btn", buttonBootstrapColor);
  btn.style.display = "inline-block";
  div.append(btn);

  let p = document.createElement("p");
  p.style.display = "inline-block";
  p.textContent = roomName;
  div.append(p);

  parentElement.append(div);
};

const appendPtagWithScrollToView = (parentElement, message) => {
  let p = document.createElement("p");
  p.innerHTML = message;
  parentElement.append(p);
  p.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
};

const updateMyData = (new_socket_data) => {
  let { my_username, my_rooms, my_current_room, my_color } = new_socket_data;
  MY_DATA.my_username = my_username;
  MY_DATA.my_rooms = my_rooms;
  MY_DATA.my_current_room = my_current_room;
  MY_DATA.my_color = my_color;
};
