import { createClient, RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export let redisClient: RedisClientType;

export const initializeRedis = async () => {
    try {
        redisClient = createClient({
            url: REDIS_URL,
        });

        redisClient.on("error", (err) => console.error("Redis Client Error", err));
        redisClient.on("connect", () => console.log("✓ Redis connection established"));

        await redisClient.connect();
    } catch (error) {
        console.error("✗ Redis connection failed:", error);
        throw error;
    }
};

export const getRedisClient = () => {
    if (!redisClient) {
        throw new Error("Redis client not initialized");
    }
    return redisClient;
};
