const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const authHeader = req.header("Authorization");
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  return token || null;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select(
      "_id studentId name email avatarUrl",
    );
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    req.user = user;
    req.auth = { module: payload.mod || null };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authenticated" });
  }
};

module.exports = { requireAuth };
