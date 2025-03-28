import express from "express";
import dotenv from "dotenv";
import connectDb from "./database/db.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

dotenv.config();


connectDb();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());


app.get("/", (req, res) => {
  res.send("Authentication Server is running");
});

app.use("/api/auth", authRoutes);


app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      message: "Something went wrong",
      error: process.env.NODE_ENV === "production" ? {} : err.message,
    });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
