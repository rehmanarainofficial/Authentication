import express from "express";
import {
  login,
  logout,
  logoutAll,
  refreshToken,
  register,
} from "../controller/auth.controller.js";
import authMiddleware from "../middleware/auth.js";
import validate from "../validations/validate.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";

let authRouter = express.Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.get("/refresh-token", refreshToken);
authRouter.post("/logout", authMiddleware, logout);
authRouter.post("/logout-all", authMiddleware, logoutAll);

export default authRouter;
