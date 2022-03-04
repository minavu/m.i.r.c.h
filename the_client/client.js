const socket = io("http://localhost:5001");
let joined_room = "";

socket.on("welcome", (data) => {
  let { welcome, socket, rooms, users } = data;
  document.getElementById("title").textContent = `Hello ${socket}`;
  displayAllRooms(rooms, joined_room);
  displayAllUsers(joined_room, users);

  let chat_screen = document.getElementById("chat-screen");

  let p = document.createElement("p");
  p.innerHTML = `${welcome}, ${socket}. Select a room from the left screen to start.`;

  chat_screen.append(p);
  p.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
});

socket.on("message", (data) => {
  let { socket, message } = data;
  console.log("Server relayed: ", data);
  let chat_screen = document.getElementById("chat-screen");

  let p = document.createElement("p");
  p.innerHTML = socket + ":  " + message;

  chat_screen.append(p);
  p.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
});

socket.on("announcement", (data) => {
  let { socket, announce, room } = data;
  let chat_screen = document.getElementById("chat-screen");

  let p = document.createElement("p");
  p.innerHTML = `${socket} ${announce} ${room}`;

  chat_screen.append(p);
  p.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
});

socket.on("update_rooms_list", (data) => {
  let { rooms } = data;
  displayAllRooms(rooms, joined_room);
});

socket.on("update_users_list", (data) => {
  let { room, users } = data;
  let users_title = document.getElementById("users-title");
  users_title.textContent = `${room || "All"} Users`;
  displayAllUsers(room, users);
});

socket.on("joined_room", (data) => {
  let { current, rooms } = data;
  joined_room = current;
  displayAllRooms(rooms, joined_room);

  let title = document.getElementById("title");
  title.innerHTML = `Room ${current}`;

  let btn = document.createElement("input");
  btn.setAttribute("type", "button");
  btn.setAttribute("onclick", "btnHandler(event)");
  btn.setAttribute("value", "Leave");
  btn.setAttribute("name", current);
  btn.classList.add("me-2", "btn", "btn-outline-dark");
  btn.style.display = "inline-block";
  title.insertBefore(btn, title.firstChild);

  document.getElementById("chatbox").disabled = false;
  document.getElementById("submit-btn").disabled = false;
});

socket.on("left_room", (data) => {
  let { current, rooms } = data;

  joined_room = "";
  displayAllRooms(rooms, joined_room);

  let title = document.getElementById("title");
  title.removeChild(title.firstChild);
  title.innerHTML = "Select a room...";

  document.getElementById("chatbox").disabled = true;
  document.getElementById("submit-btn").disabled = true;
});

document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  let message = document.querySelector("#chatbox");
  socket.emit("message", message.value);
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
    socket.emit("leave_room");
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

const displayAllRooms = (rooms, current) => {
  document.querySelectorAll(".room-line").forEach((line) => line.remove());
  let display_rooms = document.getElementById("rooms");
  let found_joined_room = false;
  rooms.forEach((room) => {
    let buttonBootstrapColor = "btn-outline-primary";
    let buttonMessage = "Join";
    if (room === current) {
      found_joined_room = true;
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
  if (found_joined_room) {
    document
      .getElementById("rooms")
      .querySelectorAll("input[type='button']")
      .forEach((button) => {
        button.disabled = true;
      });
  }
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
