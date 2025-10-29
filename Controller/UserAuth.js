const User = require('../Model/UserSchema')
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_Refresh = process.env.JWT_Refresh;

// Signup a new user 
exports.Signup = async (req, res) => {
    console.warn("Signup");

    try {
        const { Email, Password, Age, bio, Name, Latitude, Longitude } = req.body;
        // console.log(req.body);
        const imgFile = req.file;

        let existingEmail = await User.findOne({ Email: Email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists!" });
        }
        const hashedPassword = await bcrypt.hash(Password, 12);

        let newUser = new User({
            Email: Email,
            Password: hashedPassword,
            Age: Age || 0,
            bio: bio || "",
            Name,
            Latitude,
            Longitude
        });

        if (imgFile) {
            newUser.Image = imgFile.buffer;
        }

        await newUser.save();
        res.status(200).json({ message: "Created Successfully." });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
};

// Login an existing user using Email and Password
exports.Login = async (req, res) => {
    console.log('Login');
    const { Email, Password } = req.body;
    try {
        let UserData = await User.findOne({
            $or: [
                { Email: Email },
            ]
        });

        if (!UserData)
            return res.status(400).json({ message: "User Not found!" });

        const Ismatched = await bcrypt.compare(Password, UserData.Password);
        if (!Ismatched) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT tokens 
        const AccessToken = jwt.sign({ id: UserData._id }, JWT_SECRET, { expiresIn: "1hr" });
        const Refresh_Token = jwt.sign({ id: UserData._id }, JWT_Refresh, { expiresIn: '1d' });

        res.status(200).json({
            message: "Login Successful",
            Data: {
                _id: UserData._id,
                Email: UserData.Email,
                AccessToken,
                Refresh_Token
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
        console.error(`Error: ${error.message}`);
    }
}

// Retrieve user profile by Userid
exports.RetrieveProfile = async (req, res) => {
    const { Userid } = req.params;

    try {
        let UserData = await User.findById(Userid)
        res.status(200).json({
            message: "retrive Successful",
            Data: UserData
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
        console.error(`Error: ${error.message}`);
    }
}
// Change Password for user by Id
exports.ChangePass = async (req, res) => {
    const { Id, NewPass, Password } = req.body;
    let UserData = await User.findById(Id);
    if (!UserData) return res.status(400).json({ message: "User not found" });

    try {
        const Ismatched = await bcrypt.compare(Password, UserData.Password);
        if (!Ismatched) {
            return res.status(400).json({ message: "New and old Password Not Match" });
        }
        Ismatched.Password = await bcrypt.hash(NewPass, 12);
        Ismatched.save;

        res.status(200).json({
            message: "Change Passoword Successful",
            // Data: UserData
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
        console.error(`Error: ${error.message}`);
    }
}
// Update user profile by Id 
exports.update = async (req, res) => {
    console.log('update');

    try {
        const { Id, Name, Email, Age, bio } = req.body;
        console.log(req.body);

        const imgFile = req.file;
        let UserData = await User.findById(Id);
        if (!UserData) return res.status(400).json({ message: "User not found" });

        UserData.Email = Email;
        UserData.Age = Age;
        UserData.bio = bio;
        UserData.Name = Name;
        if (imgFile) UserData.Image = imgFile.buffer;

        UserData.save();
        return res.status(200).json({ message: "Successfully updated" });


    } catch (error) {
        res.status(400).json({ message: error.message });
        console.error(`Error: ${error.message}`);
    }
}


//? ////////////////////////////////////////////////////////////////////////////////////////
//! JSON WEB TOKEN REFRESH LOGIC
//? ////////////////////////////////////////////////////////////////////////////////////////

// Verify JWT token validity
exports.CheckToken = async (req, res) => {
    console.warn("CheckToken");

    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "Access token required" });
        }

        jwt.verify(token, JWT_SECRET, (err) => {
            if (err) {
                return res.status(401).json({ error: "Invalid or expired access token" });
            }
            console.log("valid");

            return res.status(200).json({ message: "Valid token" });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Refresh JWT access token using refresh token
exports.RefreshToken = async (req, res) => {
    console.warn("RefreshToken");

    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(403).json({ error: "Refresh token required" });
    }

    jwt.verify(refreshToken, JWT_Refresh, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid refresh token" });

        const newAccessToken = jwt.sign(
            { Email: user.Email },
            JWT_SECRET,
            { expiresIn: "15m" }
        );

        return res.status(200).json({ accessToken: newAccessToken });
    });
};