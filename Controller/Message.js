const User = require('../Model/UserSchema');
const Message = require('../Model/MessageSchema');
const mongoose = require('mongoose');
const IsMatched = require('../Model/IsMatchSchema');
const { SocketNotification } = require('../Utils/Notifications')

// Send Message from one user to another by senderId and receiverId
exports.Send = async (req, res) => {
    try {
        const { senderId, receiverId, message } = req.body;


        if (!senderId || !receiverId || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const receiverExists = await User.findById(receiverId);
        if (!receiverExists) {
            return res.status(404).json({ message: "Receiver not found" });
        }
        const messageSender = await User.findById(senderId);
        if (!receiverExists) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        const newMessage = await Message.create({ senderId, receiverId, message });

        // Emit to socket room 
        const room = [senderId, receiverId].sort().join("_");
        req.io.to(room).emit("receive_message", {
            senderId,
            receiverId,
            message,
            createdAt: newMessage.createdAt
        });

        SocketNotification(receiverId.toString(), `New Message from ${messageSender.Name}`)
        // req.io.to(receiverId.toString()).emit("New_Notif", {
        //     message: `New Message from ${receiverExists.Name}`,
        //     senderId,
        //     receiverId
        // });

        console.log(`New Message from ${receiverExists.Name}`);
        
        return res.status(200).json({
            message: "Message sent successfully",
            data: newMessage
        });
    } catch (error) {
        console.error(`Error sending message: ${error.message}`);
        return res.status(500).json({ message: error.message });
    }
};

// Get Conversation Messages between two users by senderId and receiverId
exports.GetConvoMessage = async (req, res) => {
    try {
        const { senderId, receiverId } = req.params;

        if (!senderId || !receiverId) {
            return res.status(400).json({ message: "senderId and receiverId are required" });
        }

        // Fetch messages where senderId and receiverId match 
        const messages = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('senderId', 'Email Name _id')
            .populate('receiverId', 'Email Name _id')
            .lean();

        if (!messages.length) {
            return res.status(204).json({ message: "No messages found" });
        }

        // Format messages with date and time fields 
        const formattedMessages = messages
            .filter(msg => msg.senderId && msg.receiverId)
            .map(msg => ({
                _id: msg._id,
                senderID: msg.senderId._id || "Unknown Sender",
                senderName: msg.senderId?.Name || "Unknown Sender",
                receiverName: msg.receiverId?.Name || "Unknown Receiver",
                receiverID: msg.receiverId?._id || "Unknown Receiver",
                message: msg.message,
                date: new Date(msg.createdAt).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                time: new Date(msg.createdAt).toLocaleTimeString('en-PH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            }));

        if (!formattedMessages.length) {
            return res.status(404).json({ message: "No valid messages found (missing user references)" });
        }

        return res.status(200).json({
            message: "Messages retrieved successfully",
            data: formattedMessages
        });

    } catch (error) {
        console.error(`Error retrieving messages: ${error.message}`);
        return res.status(500).json({ message: error.message });
    }
};
// Get Matched List with last message by Userid of the user
exports.MatchedListMsg = async (req, res) => {
    console.log("MatchedListMsg");

    const { Userid } = req.params;
    const userObjectId = new mongoose.Types.ObjectId(Userid);


    try {
        const matches = await IsMatched.find({
            userId: Userid.toString(),
            isMatch: true,
        }).populate("userSuggestion", "-Password");

        if (!matches || matches.length === 0) {
            return res.status(204).json({ message: "No matched users found" });
        }
        const matchedUsers = matches.map((m) => m.userSuggestion);

        const userIds = matchedUsers.map((u) => u._id);

        // Fetch last messages for each matched user
        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userObjectId, receiverId: { $in: userIds } },
                        { senderId: { $in: userIds }, receiverId: userObjectId },
                    ],
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$senderId", userObjectId] },
                            "$receiverId",
                            "$senderId",
                        ],
                    },
                    lastMessageAt: { $first: "$createdAt" },
                    lastMessage: { $first: "$message" },
                },
            },
        ]);

        // Merge matched users with their last message (if exists)
        const data = matchedUsers.map((user) => {
            const msg = messages.find((m) => m._id.toString() === user._id.toString());
            return {
                _id: user._id,
                name: user.Name,
                image: user.Image,
                lastMessage: msg?.lastMessage || null,
                lastMessageAt: msg?.lastMessageAt || null,
            };
        });

        // Sort by lastMessageAt descending (recent first), nulls last
        data.sort((a, b) => (b.lastMessageAt ? b.lastMessageAt.getTime() : 0) - (a.lastMessageAt ? a.lastMessageAt.getTime() : 0));

        return res.status(200).json({
            message: "Successfully retrieved matched users with messages",
            data,
        });
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({ message: "Server error" });
    }
};
