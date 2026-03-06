const requireModuleAdmin = (moduleKey) => {
  return (req, res, next) => {
    if (!moduleKey) {
      return res.status(500).json({ message: "Server misconfiguration" });
    }
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check for module claim from various possible locations
    const moduleVal =
      req.user?.mod || req.user?.module || req.auth?.module || "";
    if (moduleVal === moduleKey) {
      req.auth = { ...(req.auth || {}), module: moduleKey };
      return next();
    }

    // Fallback: allow users with role 'admin' (seeded admin accounts)
    if (req.user.role === "admin") {
      req.auth = { ...(req.auth || {}), module: moduleKey };
      return next();
    }

    return res
      .status(403)
      .json({ message: "Forbidden: module access required" });
  };
};

module.exports = { requireModuleAdmin };
