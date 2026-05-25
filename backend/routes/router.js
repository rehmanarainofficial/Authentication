import express from "express";
import {
  getActiveSessions,
  getMe,
  logoutSession,
  sessionEvents,
} from "../controller/auth.controller.js";
import authMiddleware from "../middleware/auth.js";
let router = express.Router();

router.get("/session-events", sessionEvents);
router.get("/get-me", authMiddleware, getMe);
router.get("/sessions", authMiddleware, getActiveSessions);
router.delete("/sessions/:sessionId", authMiddleware, logoutSession);

export default router;
