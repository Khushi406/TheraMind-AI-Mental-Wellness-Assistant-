import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function handleRegister(req: Request, res: Response) {
  try {
    console.log('📝 Register request received:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user already exists
    console.log('🔍 Checking if user exists:', email);
    const existingUser = await storage.getUserByUsername(email);
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    console.log('💾 Creating user in database...');
    const newUser = await storage.createUser({
      email,
      password_hash: passwordHash,
    });
    console.log('✅ User created:', { id: newUser.id, email: newUser.email });

    // Generate JWT token
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log('✅ Registration successful, sending response');
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        avatar_url: newUser.avatar_url,
        bio: newUser.bio,
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await storage.getUserByUsername(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleLogout(req: Request, res: Response) {
  // For stateless JWT, logout is handled client-side by removing the token
  res.json({ message: "Logout successful" });
}
