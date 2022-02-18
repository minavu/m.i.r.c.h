const socket = io("http://localhost:5001");

socket.on("welcome", (data) => {
  let { welcome, socket } = data;
  socket = socket.substr(0, 4).toUpperCase();
  console.log(
    `${welcome}, ${socket}! We'll use the shorthand ${socket} for you.`
  );
});

socket.on("message", (data) => {
  console.log("Server relayed: ", data);
});

document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  let message = document.querySelector("#chatbox");
  socket.emit("message", message.value);
  message.value = "";
});
