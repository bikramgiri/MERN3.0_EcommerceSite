import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../database/models/userModel";
import { envConfig } from "../config/config";

export interface AuthRequest extends Request {
  user?: {
    username: string;
    email: string;
    emails?: { value: string }[]; // For Google profile emails
    role: string;
    id: string;
  };
}

export enum Role {
  Admin = "admin",
  Customer = "customer",
}

class authMiddleware {
  // *Authentication Middleware
  async isAuthenticated(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      let token: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader) {
        token = authHeader.startsWith("Bearer ")  
          ? authHeader.substring(7) 
          : authHeader; 
      }

      if (!token) {
        res.status(401).json({
          message: "No token provided",
        });
        return;
      }

      const secret = envConfig.jwtSecretKey;
      if (!secret) {
        res.status(500).json({
          message: "Internal server error",
        });
        return;
      }

      // *verify token
      let decoded: any
      try {
        decoded = jwt.verify(token, secret)
      } catch (err: any) {
        console.error("JWT verification failed:", { name: err.name, message: err.message })
        res.status(401).json({ message: "Unauthorized! Invalid token" })
        return
      }

        const userId = decoded?.id
      if (!userId) {
        res.status(401).json({ message: "Unauthorized! Invalid token payload" })
        return
      }

            const useData = await User.findByPk(userId);
            if (!useData) {
              res.status(404).json({
                message: "User not found",
              });
              return;
            }

            req.user = useData;
            next();
          
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong",
      });

    }
  }

   // *Authorization Middleware
  authorizeRole(...roles: Role[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      let userRole = req.user?.role as Role;
      if (!roles.includes(userRole)) {
        res.status(403).json({
          message: `Role (${userRole}) don't have permission to do this action.`,
        });
        return;
      }
      next();
    };
  }
}

export default new authMiddleware();
