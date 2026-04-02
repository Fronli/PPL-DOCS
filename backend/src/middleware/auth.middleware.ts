import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: "USER" | "EO" | "ADMIN";
  };
}

export const verifyToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer")) {
    return res.status(401).json({ message: "unauthorized" });
  }

  const token = authHeader.replace(/bearer/i, "").trim();

  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "server misconfiguration" });
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id: number;
      role: "USER" | "EO" | "ADMIN";
    };

    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "invalid token" });
  }
};