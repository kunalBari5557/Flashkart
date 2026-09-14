import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors";

/**
 * Simplified authentication middleware
 * In production, this would validate JWT tokens
 * For this assessment, we extract userId from Authorization header
 * Format: Authorization: Bearer <userId>
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Missing or invalid authorization header",
            },
        });
    }

    const userId = authHeader.slice(7); // Remove "Bearer " prefix

    if (!userId || userId.trim().length === 0) {
        return res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Invalid user ID in authorization header",
            },
        });
    }

    // Attach user ID to request
    (req as any).userId = userId;
    next();
};
