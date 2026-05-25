import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../model/user.model.js";
import Session from "../model/session.model.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import {
  COOKIE_OPTIONS,
  REFRESH_TOKEN_EXPIRY,
  ACCESS_TOKEN_EXPIRY,
} from "../constants/index.js";
import {
  addSessionClient,
  addUserClient,
  notifySessionRevoked,
  notifyUserSessionsChanged,
} from "../utils/sessionEvents.js";

const generateTokensAndSession = async (user, req) => {
  let refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  let session = await Session.create({
    userId: user._id,
    refreshToken: refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    revoked: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  let accessToken = jwt.sign(
    { id: user._id, sessionId: session._id },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  return { accessToken, refreshToken, session };
};

export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) {
    return sendError(res, 404, "User not found");
  }
  sendSuccess(res, 200, "User fetched successfully", { user });
});

export const getActiveSessions = catchAsync(async (req, res) => {
  const sessions = await Session.find({
    userId: req.userId,
    revoked: false,
    expiresAt: { $gt: new Date() },
  })
    .select("-refreshToken")
    .sort({ updatedAt: -1 });

  sendSuccess(res, 200, "Active sessions fetched successfully", {
    total: sessions.length,
    sessions: sessions.map((session) => ({
      id: session._id,
      ip: session.ip,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      isCurrent: session._id.toString() === req.sessionId,
    })),
  });
});

export const sessionEvents = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return sendError(res, 401, "No refresh token provided");
  }

  const session = await Session.findOne({
    refreshToken,
    revoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return sendError(res, 401, "Invalid refresh token");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const removeClient = addSessionClient(session._id, res);
  const removeUserClient = addUserClient(session.userId, res);
  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  const heartbeat = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient();
    removeUserClient();
  });
});

export const logoutSession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  const session = await Session.findOne({
    _id: sessionId,
    userId: req.userId,
    revoked: false,
  });

  if (!session) {
    return sendError(res, 404, "Session not found");
  }

  session.revoked = true;
  await session.save();
  notifySessionRevoked(session._id);
  notifyUserSessionsChanged(req.userId);

  if (session._id.toString() === req.sessionId) {
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
  }

  sendSuccess(res, 200, "Session logged out successfully");
});

export const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  
  let existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 400, "User already exists");
  }
  let hashedPassword = await bcrypt.hash(password, 10);

  const userCreated = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const { accessToken, refreshToken } = await generateTokensAndSession(
    userCreated,
    req,
  );
  notifyUserSessionsChanged(userCreated._id);
  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  sendSuccess(res, 201, "User registered successfully", {
    user: {
      _id: userCreated._id,
      id: userCreated._id,
      name: userCreated.name,
      email: userCreated.email,
      createdAt: userCreated.createdAt,
    },
    accessToken,
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return sendError(res, 400, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return sendError(res, 400, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateTokensAndSession(
    user,
    req,
  );
  notifyUserSessionsChanged(user._id);

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  sendSuccess(res, 200, "Logged in successfully", {
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    accessToken,
  });
});

export const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: oldRefreshToken } = req.cookies;
  if (!oldRefreshToken) {
    return sendError(res, 401, "No refresh token provided");
  }

  const session = await Session.findOne({
    refreshToken: oldRefreshToken,
    revoked: false,
  });
  if (!session) {
    return sendError(res, 401, "Invalid refresh token");
  }

  const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);
  const userId = decoded.id;

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  let newRefreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  session.refreshToken = newRefreshToken;
  await session.save();

  let accessToken = jwt.sign(
    { id: userId, sessionId: session._id },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

  sendSuccess(res, 200, "Token refreshed successfully", { accessToken });
});

export const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return sendError(res, 401, "No refresh token provided");
  }

  const session = await Session.findOne({ refreshToken, revoked: false });
  if (session) {
    session.revoked = true;
    await session.save();
    notifySessionRevoked(session._id);
    notifyUserSessionsChanged(session.userId);
  }

  res.clearCookie("refreshToken", COOKIE_OPTIONS);
  sendSuccess(res, 200, "Logged out successfully");
});

export const logoutAll = catchAsync(async (req, res) => {
  const sessions = await Session.find({
    userId: req.userId,
    revoked: false,
    expiresAt: { $gt: new Date() },
  }).select("_id");

  await Session.updateMany(
    {
      userId: req.userId,
      revoked: false,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: { revoked: true },
    },
  );

  sessions.forEach((session) => notifySessionRevoked(session._id));
  notifyUserSessionsChanged(req.userId);

  res.clearCookie("refreshToken", COOKIE_OPTIONS);

  sendSuccess(res, 200, "Logged out from all devices successfully");
});
