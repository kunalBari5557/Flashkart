import { Request, Response, NextFunction } from "express";
import { validate, ValidationError as ClassValidationError } from "class-validator";
import { plainToClass } from "class-transformer";
import { HTTP_STATUS } from "../constants";

/**
 * Validates request body against a DTO class
 */
export const validateRequest = (dtoClass: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const dto = plainToClass(dtoClass, req.body);
        const errors = await validate(dto, {
            skipMissingProperties: false,
        });

        if (errors.length > 0) {
            const errorMessages = errors.map((error: ClassValidationError) => ({
                field: error.property,
                messages: Object.values(error.constraints || {}),
            }));

            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Request validation failed",
                    details: errorMessages,
                },
            });
        }

        next();
    };
};

/**
 * Validates idempotency key in request headers
 */
export const validateIdempotencyKey = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Idempotency-Key header is required",
            },
        });
    }

    if (typeof idempotencyKey !== "string" || idempotencyKey.length > 255) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid Idempotency-Key format",
            },
        });
    }

    (req as any).idempotencyKey = idempotencyKey;
    next();
};
