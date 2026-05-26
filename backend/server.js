import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import router from "./routes/router.js";
import authRouter from "./routes/auth.router.js";
import { errorHandler } from "./middleware/error.middleware.js";
import rateLimit from "express-rate-limit";

const app = express();

app.set("trust proxy", 1);

connectDB();

app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

if (process.env.CLIENT_URL) {
  const url = process.env.CLIENT_URL.trim().replace(/\/$/, "");
  allowedOrigins.push(url);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.trim().replace(/\/$/, "");
      const isAllowed = allowedOrigins.some(
        (allowed) => allowed && allowed.trim().replace(/\/$/, "") === cleanOrigin
      );
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
});

app.use("/api", limiter);
app.use("/api/user", router);
app.use("/api/auth", authRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
