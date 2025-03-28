import express from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
} from "../controllers/auth.controllers.js";
import {
  authMiddleware,
  refreshTokenMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.post("/refresh-token", refreshTokenMiddleware, refreshAccessToken);

export default router;
