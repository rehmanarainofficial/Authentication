import jwt from "jsonwebtoken";
import { sendError } from "../utils/apiResponse.js";
import Session from "../model/session.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "No token provided or invalid format");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.sessionId) {
      const session = await Session.findById(decoded.sessionId);
      if (!session || session.revoked) {
        return sendError(res, 401, "Session expired or revoked. Please login again.");
      }
    }

    req.userId = decoded.id;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, "Token expired");
    } else if (error.name === 'JsonWebTokenError') {
      return sendError(res, 401, "Invalid token");
    } else {
      next(error);
    }
  }
};

export default authMiddleware;
