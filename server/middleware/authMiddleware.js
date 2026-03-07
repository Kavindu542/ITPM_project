const jwt = require("jsonwebtoken");

const getJwtSecret = () => String(process.env.JWT_SECRET || "dev-secret");

const getToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
};

const requireAuth = (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    if (decoded.sub && !decoded.id) req.user.id = decoded.sub;
    if (decoded.sub && !decoded._id) req.user._id = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

module.exports = { requireAuth, protect: requireAuth };
