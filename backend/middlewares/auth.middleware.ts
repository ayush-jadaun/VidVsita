import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized, no access token" });
    }

    try {
      const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as {
        id: string;
      };
      const user = await User.findById(decoded.id).select(
        "-password -refreshToken"
      );

      if (!user || !user.isActive) {
        return res
          .status(401)
          .json({ message: "User not found or account deactivated" });
      }

      req.user = user;
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Access token expired" });
      }
      return res.status(401).json({ message: "Unauthorized, invalid token" });
    }
  }
);

export const refreshTokenMiddleware = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as {
        id: string;
      };
      const user = await User.findById(decoded.id);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }


      const newAccessToken = jwt.sign({ id: user._id }, ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
  }
);
