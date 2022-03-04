const socket = io("http://localhost:5001");

socket.on("welcome", (data) => {
  let { welcome, socket, rooms } = data;
  console.log(`${welcome}, ${socket}! Check out all rooms: ${rooms}`);
  displayAllRooms(rooms, "");
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

socket.on("joined_room", (data) => {
  console.log("Server created room per request: ", data);
  let { current, rooms } = data;
  displayAllRooms(rooms, current);

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
  console.log("Server announced: ", data);
  let { current, rooms } = data;

  displayAllRooms(rooms, current);

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
  // console.log(event.target.value);
  // console.log(event.target.name);

  if (event.target.value === "Create") {
    socket.emit("create_room");
  }

  if (event.target.value === "Leave") {
    socket.emit("leave_room");
  }
};

const displayAllRooms = (rooms, current) => {
  document.querySelectorAll(".room-line").forEach((line) => line.remove());
  let display_rooms = document.getElementById("rooms");
  rooms.forEach((room) => {
    let buttonBootstrapColor = "btn-outline-primary";
    let buttonMessage = "Join";
    if (room === current) {
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
