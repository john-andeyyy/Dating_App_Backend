const User = require("../Model/UserSchema");
const { io } = require("../server");

exports.SOCKET_SendNewData_NewMatch = async (senderId, receiverId) => {
    const sender = await User.findById(senderId);

    if (!io) return console.error("❌ Socket.io not initialized");
    console.log("SOCKET_SendNewData_NewMatch");

    io.to(receiverId.toString()).emit("Recive_NewMatch", {
        senderId,
        name: sender.Name,
        Age: sender.Age,
        bio: sender.bio,
        Image: sender.Image
    });
};
