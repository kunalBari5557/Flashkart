export const REDIS_KEYS = {
    STOCK: (productId: string) => `flashkart:stock:${productId}`,
    RESERVATION: (reservationId: string) => `flashkart:reservation:${reservationId}`,
    USER_RESERVATION: (userId: string, productId: string) =>
        `flashkart:user:${userId}:reservation:${productId}`,
    IDEMPOTENCY: (userId: string, idempotencyKey: string) =>
        `flashkart:idempotency:${userId}:${idempotencyKey}`,
    PRODUCT: (productId: string) => `flashkart:product:${productId}`,
    RESERVATIONS_EXPIRY: "flashkart:reservations:expiry",
};

export const DEFAULTS = {
    RESERVATION_TTL: 300, // 5 minutes
    PRODUCT_CACHE_TTL: 600, // 10 minutes
    IDEMPOTENCY_TTL: 86400, // 24 hours
};

export const ERROR_CODES = {
    // Validation
    INVALID_PRODUCT_ID: "INVALID_PRODUCT_ID",
    INVALID_QUANTITY: "INVALID_QUANTITY",
    INVALID_RESERVATION_ID: "INVALID_RESERVATION_ID",
    INVALID_IDEMPOTENCY_KEY: "INVALID_IDEMPOTENCY_KEY",

    // Not Found
    PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
    RESERVATION_NOT_FOUND: "RESERVATION_NOT_FOUND",
    ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
    CART_NOT_FOUND: "CART_NOT_FOUND",

    // Status/State
    PRODUCT_INACTIVE: "PRODUCT_INACTIVE",
    RESERVATION_EXPIRED: "RESERVATION_EXPIRED",
    RESERVATION_ALREADY_EXISTS: "RESERVATION_ALREADY_EXISTS",
    INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
    RESERVATION_OWNERSHIP_MISMATCH: "RESERVATION_OWNERSHIP_MISMATCH",

    // System
    REDIS_UNAVAILABLE: "REDIS_UNAVAILABLE",
    DATABASE_ERROR: "DATABASE_ERROR",
    INTERNAL_ERROR: "INTERNAL_ERROR",
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    GONE: 410,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
