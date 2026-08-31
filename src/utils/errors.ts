import { HTTP_STATUS } from "../constants";

export class AppError extends Error {
    constructor(
        public code: string,
        public message: string,
        public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        public details?: any
    ) {
        super(message);
        this.name = "AppError";
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super("VALIDATION_ERROR", message, HTTP_STATUS.BAD_REQUEST, details);
        this.name = "ValidationError";
    }
}

export class NotFoundError extends AppError {
    constructor(code: string, message: string) {
        super(code, message, HTTP_STATUS.NOT_FOUND);
        this.name = "NotFoundError";
    }
}

export class ConflictError extends AppError {
    constructor(code: string, message: string) {
        super(code, message, HTTP_STATUS.CONFLICT);
        this.name = "ConflictError";
    }
}

export class GoneError extends AppError {
    constructor(code: string, message: string) {
        super(code, message, HTTP_STATUS.GONE);
        this.name = "GoneError";
    }
}

export class InsufficientStockError extends AppError {
    constructor(message: string = "Requested quantity is not available") {
        super("INSUFFICIENT_STOCK", message, HTTP_STATUS.CONFLICT);
        this.name = "InsufficientStockError";
    }
}

export class ReservationExpiredError extends AppError {
    constructor(message: string = "Reservation has expired") {
        super("RESERVATION_EXPIRED", message, HTTP_STATUS.GONE);
        this.name = "ReservationExpiredError";
    }
}

export class RedisUnavailableError extends AppError {
    constructor(message: string = "Redis service is unavailable") {
        super("REDIS_UNAVAILABLE", message, HTTP_STATUS.SERVICE_UNAVAILABLE);
        this.name = "RedisUnavailableError";
    }
}

export class IdempotencyConflictError extends AppError {
    constructor(message: string = "Idempotency key conflict") {
        super("IDEMPOTENCY_CONFLICT", message, HTTP_STATUS.CONFLICT);
        this.name = "IdempotencyConflictError";
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized") {
        super("UNAUTHORIZED", message, HTTP_STATUS.UNAUTHORIZED);
        this.name = "UnauthorizedError";
    }
}
