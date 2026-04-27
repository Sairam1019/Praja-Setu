import jwt from "jsonwebtoken";

/* =========================================================
   🔐 AUTHENTICATE USER
========================================================= */
export const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};


/* =========================================================
   🛡️ ADMIN ONLY
========================================================= */
export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin only."
    });
  }

  next();
};


/* =========================================================
   🏢 DEPARTMENT ONLY (🔥 ADD THIS)
========================================================= */
export const authorizeDepartment = (req, res, next) => {
  if (req.user.role !== "department") {
    return res.status(403).json({
      message: "Access denied. Department only."
    });
  }

  next();
};