import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import errorHandler from "./middleware/errorHandler.js";
import bcrypt from "bcrypt";
import User from "./models/User.js";
import verifyToken from "./middleware/auth.js";
import jwt from "jsonwebtoken";
import typebotRoutes from "./routes/typebot.js";
import folderRoutes from "./routes/folder.js";

dotenv.config();

const app = express();

// Middleware
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
//   })
// );
app.use(cors());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("Cookies:", req.cookies);
  next();
});

app.use(express.json());
app.use(cookieParser());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", typebotRoutes);
app.use("/api", folderRoutes);

app.put("/api/users/profile", verifyToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Check if username is already taken
    if (username !== user.username) {
      const usernameExists = await User.findOne({
        username,
        _id: { $ne: user._id },
      });
      if (usernameExists) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    user.username = username || user.username;
    user.email = email || user.email;

    const updatedUser = await user.save();

    // Create new token with updated info
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        token: token,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/users/password", verifyToken, async (req, res) => {
  try {
    console.log("Password update request received:", {
      userId: req.user._id,
      hasOldPassword: !!req.body.oldPassword,
      hasNewPassword: !!req.body.newPassword,
    });
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      console.log("User not found for password update");
      return res.status(404).json({ message: "User not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    console.log("Password verification result:", isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    console.log("Password updated successfully for user:", user._id);

    // Create new token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      message: "Password updated successfully",
      token: token,
    });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Error handling middleware
app.use(errorHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  console.log("404 Not Found:", req.method, req.path);
  res.status(404).json({ message: "Route not found" });
});

app.get("/", (req, res) => {
  res.send("Hello world");
});
