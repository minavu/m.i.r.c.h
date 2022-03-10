const socket = io();

const BG_COLORS = [
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
let display_chatbox_views_parent = document.getElementById(
  "chatbox-views-parent"
);

socket.on("welcome", (data) => {
  let { welcome_message, socket_data, rooms } = data;

  updateMyData(socket_data);
  displayAllRooms(rooms, MY_DATA.my_rooms);

  display_chat_title.textContent = `Hello ${MY_DATA.my_username}`;

  appendPtagWithScrollToView(
    display_chat_screen,
    `${welcome_message}, ${MY_DATA.my_username}. Select a room from the left screen to start.`
  );
});

socket.on("disconnect", (reason) => {
  MY_DATA.my_rooms.forEach((room) => {
    let chat_screen = document.getElementById(`${room}-chat-screen`);
    if (
      reason === "io client disconnect" ||
      reason === "io server disconnect"
    ) {
      removeAllRooms(reason);
    } else {
      appendPtagWithScrollToView(
        chat_screen,
        "The server has disconnected. Attempting reconnection now..."
      );
    }
  });
});

socket.io.on("reconnect", () => {
  location.reload();
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

socket.on("update_users_list", (data) => {
  let { room, users } = data;
  displayAllUsers(room, users);
});

socket.on("joined_room", (data) => {
  let { socket_data } = data;
  updateMyData(socket_data);

  createNewChatboxView(
    display_chatbox_views_parent,
    MY_DATA.my_current_room,
    1
  );

  document.querySelectorAll("div[id$='-tab']").forEach((tab) => {
    tab.classList.add("bg-secondary");
  });
  document
    .getElementById(`${MY_DATA.my_current_room}-tab`)
    .classList.remove("bg-secondary");
});

socket.on("left_room", (data) => {
  let { socket_data, room_left } = data;
  updateMyData(socket_data);

  document.getElementById(`${room_left}-view`).remove();
  document.getElementById(`${room_left}-tab`).remove();

  document
    .getElementById(`${MY_DATA.my_current_room}-tab`)
    .classList.remove("bg-secondary");
});

socket.on("join_private_room_request", (data) => {
  let { request_private_room, request_from_user, request_to_user } = data;
  if (request_to_user === MY_DATA.my_username) {
    if (MY_DATA.my_rooms.includes(request_private_room)) {
      return;
    }

    let modal_body = document.querySelector("div[class='modal-body']");
    modal_body.textContent = `${request_from_user} is requesting to DM you`;
    let myModal = new bootstrap.Modal(
      document.getElementById("staticBackdrop"),
      {}
    );
    myModal.show();

    document
      .getElementById("Accept-btn")
      .addEventListener("click", handleDmRequest);

    document
      .getElementById("Decline-btn")
      .addEventListener("click", handleDmRequest);

    function handleDmRequest(event) {
      let clicked = event.target.textContent;
      if (clicked === "Accept") {
        socket.emit("join_room", {
          room: request_private_room,
        });
      }
      if (clicked === "Decline") {
        socket.emit("decline_private_room_request", {
          request_private_room: request_private_room,
          request_from_user: request_from_user,
          request_to_user: request_to_user,
        });
      }

      document
        .getElementById("Accept-btn")
        .removeEventListener("click", handleDmRequest);
      document
        .getElementById("Decline-btn")
        .removeEventListener("click", handleDmRequest);
    }
  }
});

const submitHandler = (event) => {
  event.preventDefault();
  let room_name = event.target.name;
  let chatbox = document.querySelector(`#${room_name}-chatbox`);
  socket.emit("message", {
    socket_data: MY_DATA,
    message: chatbox.value,
  });
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
  } else if (event.target.value === "Exit") {
    socket.disconnect();
  } else if (event.target.value === "DM") {
    if (MY_DATA.my_username === event.target.name) {
      return;
    }
    let room_name = `DM__${event.target.name}__${MY_DATA.my_username}`;
    if (MY_DATA.my_username < event.target.name) {
      room_name = `DM__${MY_DATA.my_username}__${event.target.name}`;
    }
    if (MY_DATA.my_rooms.includes(room_name)) {
      changeViews(room_name);
    } else {
      socket.emit("create_private_room", {
        private_room: room_name,
        other_user: event.target.name,
      });
    }
  } else if (event.target.value === "In") {
    changeViews(event.target.name);
  } else {
    changeViews(event.target.outerText);
  }
};

const changeViews = (room_tab) => {
  document.querySelectorAll("div[id$='-tab']").forEach((tab) => {
    tab.classList.add("bg-secondary");
  });
  document.getElementById(`${room_tab}-tab`).classList.remove("bg-secondary");
  document.querySelectorAll(".room-view").forEach((view) => {
    view.style.zIndex = 0;
  });
  document.getElementById(`${room_tab}-view`).style.zIndex = 1;

  MY_DATA.my_current_room = room_tab;
};

const displayAllUsers = (room, users) => {
  let display_users_list = document.getElementById(`${room}-users-list`);
  display_users_list.querySelectorAll(".user-line").forEach((user) => {
    user.remove();
  });

  appendUserDescription(
    display_users_list,
    "btn-outline-dark",
    "SELF",
    MY_DATA.my_username
  );

  users
    .filter((user) => user !== MY_DATA.my_username)
    .forEach((user) => {
      appendUserDescription(
        display_users_list,
        "btn-outline-primary",
        "DM",
        user
      );
    });
};

const appendUserDescription = (
  parentElement,
  buttonBootstrapColor,
  buttonMessage,
  userName
) => {
  let div = document.createElement("div");
  div.classList.add("user-line", "text-end");

  let p = document.createElement("p");
  p.style.display = "inline-block";
  p.textContent = userName;
  div.append(p);

  let btn = document.createElement("input");
  btn.setAttribute("type", "button");
  btn.setAttribute("onclick", "btnHandler(event)");
  btn.setAttribute("value", buttonMessage);
  btn.setAttribute("name", userName);
  btn.classList.add("ms-2", "btn", buttonBootstrapColor);
  btn.style.display = "inline-block";
  if (MY_DATA.my_username === userName) {
    btn.disabled = true;
  }
  div.append(btn);

  parentElement.append(div);
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
  appendRoomDescription(display_rooms, "btn-dark", "Exit", "M.I.R.C.H");

  let div = document.createElement("div");
  div.setAttribute("class", "room-line");
  let span = document.createElement("span");
  span.classList.add("bg-warning");
  span.textContent = "WARNING:";
  div.append(span);
  let span2 = document.createElement("span");
  span2.textContent =
    " If you talk about 'cheese', the server will disconnect you!";
  div.append(span2);
  display_rooms.append(div);
};

const removeAllRooms = (reason) => {
  let header = document.querySelector("header");
  header.style.height = "100vh";
  header.style.zIndex = 2;

  let h1 = document.querySelector("h1");
  if (reason === "io client disconnect") {
    h1.textContent = "Come back soon...";
  }
  if (reason === "io server disconnect") {
    h1.textContent = "Goodbye...";
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

const createNewChatboxView = (parent_element, room_name, z_index) => {
  let bgc = BG_COLORS.shift();

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
  let span = document.createElement("span");
  span.textContent = room_name;
  div_tab.append(span);
  display_room_tabs.append(div_tab);

  let section = document.createElement("section");
  section.classList.add(
    "w-100",
    "h-100",
    "position-absolute",
    "d-flex",
    "room-view"
  );
  section.setAttribute("id", `${room_name}-view`);
  section.style.zIndex = z_index;

  let inner_section_1 = document.createElement("section");
  inner_section_1.classList.add("flex-grow-1", "d-flex", "flex-column");

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
  div_title.style.paddingRight = "13px";
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
  div_screen.classList.add("ps-1", "pe-1", "flex-grow-1", "bg-white");
  div_screen.setAttribute("id", `${room_name}-chat-screen`);
  div_screen.style.overflow = "auto";

  let div_form = document.createElement("div");
  div_form.classList.add("bg-white");
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
  input_submit.classList.add("btn", "btn-success", "rounded-0");
  input_submit.setAttribute("id", `${room_name}-submit-btn`);
  input_submit.setAttribute("value", "Send");
  form.append(input_text);
  form.append(input_submit);
  div_form.append(form);

  inner_section_1.append(div_title);
  inner_section_1.append(div_screen);
  inner_section_1.append(div_form);

  let inner_section_2 = document.createElement("section");
  inner_section_2.classList.add(
    "bg-white",
    "border-start",
    "border-end",
    "border-5",
    "pe-2"
  );
  inner_section_2.setAttribute("id", `${room_name}-users-list`);
  inner_section_2.style.overflow = "auto";
  inner_section_2.style.width = "calc(100vw / 4)";
  let h4 = document.createElement("h4");
  h4.classList.add("pt-3", "text-decoration-underline", "text-end");
  h4.setAttribute("id", `${room_name}-users-title`);
  h4.textContent = `${room_name} Users`;
  inner_section_2.append(h4);

  section.append(inner_section_1);
  section.append(inner_section_2);

  BG_COLORS.push(bgc);

  parent_element.append(section);
};
