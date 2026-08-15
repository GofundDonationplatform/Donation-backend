// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export function protect(req, res, next) {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Token failed or expired",
    });
  }
}

export function adminOnly(req, res, next) {
  if (
    req.user &&
    (
      req.user.role === "admin" ||
      req.user.isAdmin === true
    )
  ) {
    return next();
  }

  return res.status(403).json({
    message: "Admin access denied",
  });
}
