const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. Token is missing.",
      });
    }

    const token = authHeader.split(" ")[1];
    const { JWT_SECRET } = process.env;

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in environment variables.");
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Not authorized. User not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Not authorized. Token is invalid or expired.",
      });
    }

    next(error);
  }
};

module.exports = {
  protect,
};

