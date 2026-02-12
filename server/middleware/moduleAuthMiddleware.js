const requireModuleAdmin = (moduleKey) => {
  return (req, res, next) => {
    if (!moduleKey) {
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.auth?.module !== moduleKey) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};

module.exports = { requireModuleAdmin };
