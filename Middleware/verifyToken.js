const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_SECRET = JWT_SECRET;

exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token || token == null) {
            console.log("Access token required");

            return res.status(401).json({ error: "Access token required" });
        }

        // next();

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log("Invalid or expired access token");
                return res.status(403).json({ error: "Invalid or expired access token" });
            }

            req.user = decoded;
            next();
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
        console.error(`Error: ${error.message}`);
    }
};
