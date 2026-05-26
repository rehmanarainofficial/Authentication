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

app.use(cors({ credentials: true }));

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
