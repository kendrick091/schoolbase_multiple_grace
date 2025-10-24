const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

io.on("connection", socket => {
    console.log("New client:", socket.id);

    socket.on("offer", data => {
        socket.broadcast.emit("offer", data);
    });

    socket.on("answer", data => {
        socket.broadcast.emit("answer", data);
    });

    socket.on("ice-candidate", data => {
        socket.broadcast.emit("ice-candidate", data);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const port = 5100
server.listen(port, () => {
    console.log(`Signaling server running on http://localhost:${port}`);
});
