import { getRedisClient } from "../config/redis";
import { dataSource } from "../config/database";
import { REDIS_KEYS, DEFAULTS } from "../constants";
import { RedisUnavailableError } from "../utils/errors";
import { Order } from "../entities/Order";

export class IdempotencyService {
    private get redisClient() {
        return getRedisClient();
    }

    /**
     * Gets cached idempotent response from Redis
     * Fast-path for duplicate requests
     */
    async getCachedResponse(userId: string, idempotencyKey: string): Promise<any | null> {
        try {
            const key = REDIS_KEYS.IDEMPOTENCY(userId, idempotencyKey);
            const cached = await this.redisClient.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error("Error getting cached response:", error);
            return null;
        }
    }

    /**
     * Caches idempotent response in Redis
     */
    async cacheResponse(
        userId: string,
        idempotencyKey: string,
        response: any,
        ttl: number = DEFAULTS.IDEMPOTENCY_TTL
    ): Promise<void> {
        try {
            const key = REDIS_KEYS.IDEMPOTENCY(userId, idempotencyKey);
            await this.redisClient.setEx(key, ttl, JSON.stringify(response));
        } catch (error) {
            console.error("Error caching response:", error);
            // Don't throw - it's okay if caching fails
        }
    }

    /**
     * Checks database for existing order with same idempotency key
     * Final consistency guarantee
     */
    async getExistingOrder(userId: string, idempotencyKey: string): Promise<Order | null> {
        try {
            const orderRepository = dataSource.getRepository(Order);
            const order = await orderRepository.findOne({
                where: { userId, idempotencyKey },
                relations: ["items", "items.product"],
            });
            return order || null;
        } catch (error) {
            console.error("Error getting existing order:", error);
            return null;
        }
    }

    /**
     * Validates idempotency key format
     */
    validateIdempotencyKey(key: string): boolean {
        if (!key || typeof key !== "string") {
            return false;
        }
        // UUID or alphanumeric format
        return /^[a-zA-Z0-9\-]{1,255}$/.test(key);
    }
}
