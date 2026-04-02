import type { RequestHandler } from "express";
import type { AuthRequest } from "./auth.middleware.js";

export const requireAdmin: RequestHandler = (req, res, next) => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    return res.status(401).json({ message: "unauthorized" });
  }

  if (authReq.user.role !== "ADMIN") {
    return res.status(403).json({ message: "admin only" });
  }

  next();
};

export const requireEO: RequestHandler = (req, res, next) => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    return res.status(401).json({ message: "unauthorized" });
  }

  if (authReq.user.role !== "EO") {
    return res.status(403).json({ message: "eo only" });
  }

  next();
};