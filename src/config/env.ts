export const config = {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    database: {
        url: process.env.DATABASE_URL,
    },
    redis: {
        url: process.env.REDIS_URL || "redis://localhost:6379",
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET || "dev-secret-key",
    },
    business: {
        reservationTtl: parseInt(process.env.RESERVATION_TTL_SECONDS || "300", 10),
        maxConcurrentReservationsPerUser: parseInt(
            process.env.MAX_CONCURRENT_RESERVATIONS_PER_USER || "5",
            10
        ),
        rateLimitRequestsPerMinute: parseInt(
            process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || "100",
            10
        ),
    },
};

export const validateConfig = () => {
    if (!config.database.url) {
        throw new Error("DATABASE_URL environment variable is required");
    }
};
