const socket = io("http://localhost:5001");
const C_LOG = console.log;
const TEXT_COLORS = [
  "HoneyDew",
  "AntiqueWhite",
  "LemonChiffon",
  "GreenYellow",
  "LavenderBlush",
  "LightSalmon",
];

const MY_DATA = {
  my_username: "",
  my_rooms: [],
  my_current_room: "",
  my_color: "black",
};
let display_chat_title = document.getElementById("title");
let display_chat_screen = document.getElementById("Lobby-chat-screen");

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

socket.io.on("reconnect", () => {
  location.reload();
});

socket.on("disconnect", (reason) => {
  MY_DATA.my_rooms.forEach((room) => {
    let chat_screen = document.getElementById(`${room}-chat-screen`);
    appendPtagWithScrollToView(
      chat_screen,
      "The server has disconnected. Attempting reconnection now..."
    );
  });
});
socket.on("message", (data) => {
  let { user, room, message } = data;
  let chat_screen = document.getElementById(`${room}-chat-screen`);
  appendPtagWithScrollToView(chat_screen, `${user}: ${message}`);
});

socket.on("announcement", (data) => {
  let { room, announcement } = data;

  let chat_screen = document.getElementById(`${room}-chat-screen`);
  appendPtagWithScrollToView(chat_screen, announcement);
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

let display_chatbox_views_parent = document.getElementById(
  "chatbox-views-parent"
);
const createNewChatboxView = (room_name, z_index) => {
  let bgc = TEXT_COLORS.shift();

  let display_room_tabs = document.getElementById("room-tabs");
  let div_tab = document.createElement("div");
  div_tab.classList.add("pt-3", "pb-3", "border-end", "border-bottom");
  div_tab.setAttribute("id", `${room_name}-tab`);
  div_tab.setAttribute("onclick", "btnHandler(event)");
  div_tab.setAttribute("name", room_name);
  div_tab.style.writingMode = "vertical-lr";
  div_tab.style.textOrientation = "upright";
  div_tab.style.backgroundColor = bgc;
  div_tab.style.cursor = "pointer";
  div_tab.textContent = room_name;
  display_room_tabs.append(div_tab);

  let section = document.createElement("section");
  section.classList.add(
    "w-100",
    "h-100",
    "position-absolute",
    "d-flex",
    "flex-column",
    "room-view"
  );
  section.setAttribute("id", `${room_name}-view`);
  section.style.zIndex = z_index;

  let div_title = document.createElement("div");
  div_title.classList.add(
    "text-center",
    "pt-2",
    "d-flex",
    "justify-content-center",
    "align-items-center"
  );
  div_title.style.height = "55px";
  div_title.style.backgroundColor = bgc;
  let leave_btn = document.createElement("input");
  leave_btn.setAttribute("type", "button");
  leave_btn.setAttribute("onclick", "btnHandler(event)");
  leave_btn.setAttribute("value", "Leave");
  leave_btn.setAttribute("name", room_name);
  leave_btn.classList.add(
    "me-2",
    "btn",
    "btn-outline-dark",
    "align-self-start"
  );
  leave_btn.style.display = "inline-block";
  let h2 = document.createElement("h2");
  h2.style.display = "inline-block";
  h2.textContent = `Room ${room_name}`;
  div_title.append(leave_btn);
  div_title.append(h2);

  let div_screen = document.createElement("div");
  div_screen.classList.add("ms-1", "flex-grow-1", "bg-white");
  div_screen.setAttribute("id", `${room_name}-chat-screen`);
  div_screen.style.overflow = "auto";

  let div_form = document.createElement("div");
  let form = document.createElement("form");
  form.classList.add("d-flex");
  form.setAttribute("onsubmit", "submitHandler(event)");
  form.setAttribute("name", room_name);
  let input_text = document.createElement("input");
  input_text.setAttribute("type", "text");
  input_text.classList.add(
    "form-control",
    "border",
    "border-2",
    "border-success",
    "rounded-0"
  );
  input_text.setAttribute("id", `${room_name}-chatbox`);
  input_text.setAttribute("name", `${room_name}-chatbox`);
  input_text.setAttribute("placeholder", "Type something...");
  let input_submit = document.createElement("input");
  input_submit.setAttribute("type", "submit");
  input_submit.classList.add("btn", "btn-warning", "rounded-0");
  input_submit.setAttribute("id", `${room_name}-submit-btn`);
  input_submit.setAttribute("value", "Send");
  form.append(input_text);
  form.append(input_submit);
  div_form.append(form);

  section.append(div_title);
  section.append(div_screen);
  section.append(div_form);

  TEXT_COLORS.push(bgc);

  return section;
};

socket.on("joined_room", (data) => {
  let { socket_data } = data;
  updateMyData(socket_data);

  let new_room_view = createNewChatboxView(MY_DATA.my_current_room, 1);
  display_chatbox_views_parent.append(new_room_view);
});

socket.on("left_room", (data) => {
  let { socket_data, room_left } = data;
  updateMyData(socket_data);

  document.getElementById(`${room_left}-view`).remove();
  document.getElementById(`${room_left}-tab`).remove();
});

const submitHandler = (event) => {
  event.preventDefault();
  let room_name = event.target.name;
  let chatbox = document.querySelector(`#${room_name}-chatbox`);
  socket.emit("message", {
    socket_data: MY_DATA,
    message: chatbox.value,
  });
  C_LOG(MY_DATA, chatbox.value);
  chatbox.value = "";
};

const btnHandler = (event) => {
  if (event.target.value === "Create") {
    socket.emit("create_room");
  } else if (event.target.value === "Join") {
    socket.emit("join_room", {
      room: event.target.name,
    });
  } else if (event.target.value === "Leave") {
    socket.emit("leave_room", {
      room: event.target.name,
    });
  } else {
    let room_tab = event.target.outerText;
    document
      .querySelectorAll(".room-view")
      .forEach((view) => (view.style.zIndex = 0));
    document.getElementById(`${room_tab}-view`).style.zIndex = 1;

    MY_DATA.my_current_room = room_tab;
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
