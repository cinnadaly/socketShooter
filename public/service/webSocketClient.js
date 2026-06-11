//socket client
const socket = new WebSocket("ws://localhost:3000/ws");

//open socket
socket.onopen = () => {
    console.log("Connected client ");
}