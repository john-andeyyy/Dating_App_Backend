const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors");
const { Server } = require('socket.io');
const http = require('http');
require('./Configuration/Database');

app.use(cors());
app.use(express.json());

// Create HTTP server para makabit si socket.io
const server = http.createServer(app);

// Initialize Socket.io server 
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

module.exports.io = io;

app.use((req, res, next) => {
    req.io = io;
    next();
});
app.get('/', (req, res) => {
    res.send('Hello from Express backend!');
});

// Import and use routes 
const AuthRoutes = require('./Routes/UserRoutes');
app.use('/user', AuthRoutes);
const Message = require('./Routes/Message');
app.use('/Msg', Message);
const Matching = require('./Routes/Matching');
app.use('/Matching', Matching);

io.on("connection", (socket) => {
    // console.log(" User connected:", socket.id);

    socket.on("join", (userId) => {
        if (!userId) return;
        socket.join(userId.toString());
        // console.log(` User ${userId} joined personal notif room`);
    });

    socket.on("join_convo", ({ senderId, receiverId }) => {
        const room = [senderId, receiverId].sort().join("_");
        socket.join(room);
        // console.log(` ${senderId} joined convo room: ${room}`);
    });

    socket.on("send_message", ({ senderId, receiverId, message }) => {
        if (!senderId || !receiverId || !message) return;

        const room = [senderId, receiverId].sort().join("_");

        io.to(room).emit("receive_message", { senderId, receiverId, message });

        io.to(receiverId.toString()).emit("New_Notif", {
            message: " New Message",
            senderId,
            receiverId,
        });

        console.log(`📨 ${senderId} → ${receiverId}: ${message}`);
    });

    socket.on("disconnect", () => {
        console.log(" User disconnected:", socket.id);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; 
