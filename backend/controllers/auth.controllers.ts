import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

interface AuthRequest extends Request {
  user?: Document & {
    _id: string;
    name: string;
    username: string;
    refreshToken?: string;
  };
}

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, username, password } = req.body;


    if (!name || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
      });
    }

 
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }

   
    const hashedPassword = await bcrypt.hash(password, 12);


    const newUser = new User({
      name,
      username: username.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

  
    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

 
    newUser.refreshToken = refreshToken;
    await newUser.save();

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, 
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
      },
    });
  }
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }


  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);


  user.refreshToken = refreshToken;
  await user.save();

  // Set cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, 
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
    },
  });
});

export const logoutUser = asyncHandler(async (req: AuthRequest, res: Response) => {
 
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }


  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(200).json({ message: "Logged out successfully" });
});

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
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


      const newAccessToken = generateAccessToken(user._id);

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, 
      });

      res.status(200).json({ message: "Access token refreshed" });
    } catch (error) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
  }
);

function generateAccessToken(userId: mongoose.Types.ObjectId | string) {
  return jwt.sign({ id: userId.toString() }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken(userId: mongoose.Types.ObjectId | string) {
  return jwt.sign({ id: userId.toString() }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}