import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { HTTP_STATUS } from "../constants";

/**
 * Global error handling middleware
 * Catches all errors and returns consistent JSON response
 */
export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("[Error]", {
        name: err.name,
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        stack: err.stack,
    });

    // AppError subclasses
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(process.env.NODE_ENV === "development" && { details: err.details }),
            },
        });
    }

    // Validation errors
    if (err.name === "ValidationError" || err.isJoi) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Request validation failed",
                details: err.message,
            },
        });
    }

    // Database errors
    if (err.name === "QueryFailedError" || err.name === "EntityNotFound") {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: {
                code: "DATABASE_ERROR",
                message: "Database operation failed",
                ...(process.env.NODE_ENV === "development" && { details: err.message }),
            },
        });
    }

    // Default error
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
            ...(process.env.NODE_ENV === "development" && { details: err.message }),
        },
    });
};

/**
 * 404 Not Found middleware
 */
export const notFoundMiddleware = (req: Request, res: Response) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
};
