const IsMatched = require('../Model/IsMatchSchema');
const mongoose = require('mongoose');
const User = require('../Model/UserSchema')
const { SocketNotification } = require('../Utils/Notifications')
const { SOCKET_SendNewData_NewMatch } = require('../Utils/SocketNewData')

//? v1 Swipe Left or Right
exports.Swipe_Left_or_Right = async (req, res) => {
    // console.warn("Swipe_Left_or_Right");
    const { Userid, MatchingId, IsMatch } = req.body;
    try {
        const user = await User.findById(Userid)
        const userlike = await User.findById(MatchingId)

        if (!user || !userlike) {
            return res.status(404).json({ message: "User not found" });
        }
        const isokay = await IsMatched.create({
            userId: Userid,
            userSuggestion: MatchingId,
            isMatch: IsMatch
        });

        if (isokay)
            return res.status(200).json({ Message: "Successfull liked" })

        return res.status(400).json({ message: "There are an internal problem." })
    } catch (error) {
        res.status(400).json({ message: error.message });
        console.error(`Error: ${error.message}`);
    }

}

// Swipe Left or Right
// Like or Dislike
exports.Like_unlike = async (req, res) => {
    // console.warn("Like_unlike");
    const { Userid, MatchingId, isLike } = req.body;

    try {
        let record = await IsMatched.findOne({ userId: Userid, userSuggestion: MatchingId });

        if (!record) {
            record = new IsMatched({
                userId: Userid,
                userSuggestion: MatchingId,
                isLike,
                isMatch: false
            });
        } else {
            record.isLike = isLike;
        }

        await record.save();

        if (isLike) {
            const reverseRecord = await IsMatched.findOne({
                userId: MatchingId,
                userSuggestion: Userid,
                isLike: true
            });

            if (reverseRecord) {
                record.isMatch = true;
                reverseRecord.isMatch = true;
                await record.save();
                await reverseRecord.save();
                SocketNotification(MatchingId, `New Match`)
                SOCKET_SendNewData_NewMatch(Userid, MatchingId,)
                SOCKET_SendNewData_NewMatch(MatchingId, Userid);

            }
        }

        let action = isLike ? 'like' : 'skip';
        return res.status(200).json({
            message: `Successfully ${action}d`,
            match: record.isMatch || false
        });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        return res.status(400).json({ message: error.message });
    }
};
const { io } = require("../server");

// v1 Unmatch a user 
exports.unMatchv1 = async (req, res) => {
    // console.warn("unlike");
    const { Userid, MatchingId } = req.body;
    try {
        const unlike = IsMatched.find({ userId: Userid, userSuggestion: MatchingId })
        if (!unlike)
            return res.status(404).json({ message: "User not found" });


        const isokay = await IsMatched.deleteOne({
            userId: Userid,
            userSuggestion: MatchingId
        });
        await IsMatched.deleteOne({
            userId: MatchingId,
            userSuggestion: Userid
        });
        io.to(MatchingId).emit("userUnmatched", { userId: Userid });

        if (isokay)
            return res.status(200).json({ Message: "Successfull unlike" })

        return res.status(400).json({ message: "There are an internal problem." })
    } catch (error) {
        res.status(400).json({ message: error.message });
        console.error(`Error: ${error.message}`);
    }

}

// Unmatch a user (like setting isLike to false)
exports.unMatch = async (req, res) => {
    const { Userid, MatchingId } = req.body;

    try {
        // Find the existing match records
        const record = await IsMatched.findOne({ userId: Userid, userSuggestion: MatchingId });
        const reverseRecord = await IsMatched.findOne({ userId: MatchingId, userSuggestion: Userid });

        if (!record) return res.status(404).json({ message: "User not found" });

        // Set isLike and isMatch to false
        record.isLike = false;
        record.isMatch = false;
        await record.save();

        if (reverseRecord) {
            reverseRecord.isMatch = false; // reverse side should also unmatch
            await reverseRecord.save();
        }

        // Notify via socket
        io.to(MatchingId).emit("userUnmatched", { userId: Userid });

        return res.status(200).json({ message: "Successfully unmatched" });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        return res.status(400).json({ message: error.message });
    }
};


// Get Matched List by Userid of the user
exports.MatchedList = async (req, res) => {
    const { Userid } = req.params;

    try {
        const list = await IsMatched.find({
            userId: Userid,
            isMatch: true
        })
            .populate('userSuggestion', '-password');

        if (!list || list.length === 0) {
            return res.status(200).json({
                message: "No matches found",
                data: []
            });
        }

        return res.status(200).json({
            message: "Successful retrieve",
            data: list
        });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
};

// Helper function to calculate distance between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// get random list of users for matching
exports.Random = async (req, res) => {
    console.warn("list");

    const { userId } = req.params;
    const minAge = req.query.minAge ? parseInt(req.query.minAge) : null;
    const maxAge = req.query.maxAge ? parseInt(req.query.maxAge) : null;
    const { longitude, latitude, radius, interestedIn } = req.query;

    // console.log("Filters:", { minAge, maxAge, longitude, latitude, radius, interestedIn });

    try {
        // get users the current user already interacted with
        const interactedUsers = await IsMatched.find({ userId }).distinct("userSuggestion");
        const excludeIds = [userId, ...interactedUsers].map((id) => new mongoose.Types.ObjectId(id));

        // exclude current user and previously interacted users
        const usersFromDb = await User.find({ _id: { $nin: excludeIds } }).select("-Password");

        // convert and normalize user data
        let filteredUsers = usersFromDb.map((user) => ({
            ...user.toObject(),
            age: user.Age,
            Latitude: parseFloat(user.Latitude),
            Longitude: parseFloat(user.Longitude),
            gender: user.gender?.toLowerCase(),
        }));

        //  Filter by age range
        if (minAge !== null) filteredUsers = filteredUsers.filter((u) => u.age >= minAge);
        if (maxAge !== null) filteredUsers = filteredUsers.filter((u) => u.age <= maxAge);

        //  Filter by distance if coordinates provided
        if (latitude && longitude && radius) {
            const userLat = parseFloat(latitude);
            const userLng = parseFloat(longitude);
            const maxDistance = parseFloat(radius);

            filteredUsers = filteredUsers.filter((u) => {
                if (!u.Latitude || !u.Longitude) return false;
                const distance = getDistance(userLat, userLng, u.Latitude, u.Longitude);
                return distance <= maxDistance;
            });
        }

        // Filter by interestedIn (gender)
        if (interestedIn && interestedIn.toLowerCase() !== "all") {
            const genderFilter = interestedIn.toLowerCase();
            filteredUsers = filteredUsers.filter((u) => u.gender === genderFilter);
        }

        const sample = filteredUsers.sort(() => 0.5 - Math.random()).slice(0, 10);

        if (!sample.length) {
            console.log("No available matches");
            return res.status(204).json({ message: "No available matches" });
        }
        // console.log(sample);

        return res.status(200).json({
            message: "Successfully retrieved random matches",
            data: sample,
        });
    } catch (error) {
        console.error(`Error fetching matches: ${error.message}`);
        res.status(500).json({ message: "Server error" });
    }
};



