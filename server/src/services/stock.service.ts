import { getRedisClient } from "../config/redis";
import { REDIS_KEYS, DEFAULTS } from "../constants";
import { RedisUnavailableError } from "../utils/errors";
import fs from "fs";
import path from "path";

export class StockService {
    private get redisClient() {
        return getRedisClient();
    }

    /**
     * Initializes stock for a product in Redis
     * Used during seeding/setup
     */
    async initializeStock(productId: string, quantity: number): Promise<void> {
        try {
            const key = REDIS_KEYS.STOCK(productId);
            await this.redisClient.set(key, quantity.toString());
        } catch (error) {
            throw new RedisUnavailableError();
        }
    }

    /**
     * Gets current stock for a product from Redis
     */
    async getStock(productId: string): Promise<number> {
        try {
            const key = REDIS_KEYS.STOCK(productId);
            const stock = await this.redisClient.get(key);
            return stock ? parseInt(stock, 10) : 0;
        } catch (error) {
            throw new RedisUnavailableError();
        }
    }

    /**
     * Atomically reserves stock using Lua script
     * Prevents race conditions and ensures no overselling
     */
    async reserveStock(
        productId: string,
        reservationId: string,
        quantity: number,
        ttl: number = DEFAULTS.RESERVATION_TTL
    ): Promise<{
        success: boolean;
        reason?: string;
    }> {
        try {
            const stockKey = REDIS_KEYS.STOCK(productId);
            const reservationKey = REDIS_KEYS.RESERVATION(reservationId);

            const reservationData = JSON.stringify({
                productId,
                reservationId,
                quantity,
                createdAt: new Date().toISOString(),
            });

            // Load and execute Lua script
            const scriptPath = path.join(__dirname, "../redis/scripts/reserve-stock.lua");
            const script = fs.readFileSync(scriptPath, "utf-8");

            const result = await this.redisClient.eval(script, {
                keys: [stockKey, reservationKey],
                arguments: [quantity.toString(), ttl.toString(), reservationData],
            });

            if (result === 1) {
                return { success: true };
            } else if (result === -1) {
                return { success: false, reason: "INSUFFICIENT_STOCK" };
            } else if (result === -2) {
                return { success: false, reason: "STOCK_KEY_NOT_FOUND" };
            } else if (result === -3) {
                return { success: false, reason: "RESERVATION_ALREADY_EXISTS" };
            }

            return { success: false, reason: "UNKNOWN" };
        } catch (error) {
            console.error("Stock reservation error:", error);
            throw new RedisUnavailableError();
        }
    }

    /**
     * Releases stock when a reservation expires
     * Atomically increments stock and removes reservation
     */
    async releaseStock(
        productId: string,
        reservationId: string,
        quantity: number
    ): Promise<{ success: boolean; reason?: string }> {
        try {
            const stockKey = REDIS_KEYS.STOCK(productId);
            const reservationKey = REDIS_KEYS.RESERVATION(reservationId);

            const scriptPath = path.join(__dirname, "../redis/scripts/release-stock.lua");
            const script = fs.readFileSync(scriptPath, "utf-8");

            const result = await this.redisClient.eval(script, {
                keys: [stockKey, reservationKey],
                arguments: [quantity.toString()],
            });

            if (result === 1) {
                return { success: true };
            } else if (result === -1) {
                return { success: false, reason: "RESERVATION_ALREADY_RELEASED" };
            } else if (result === -2) {
                return { success: false, reason: "STOCK_KEY_NOT_FOUND" };
            }

            return { success: false, reason: "UNKNOWN" };
        } catch (error) {
            console.error("Stock release error:", error);
            throw new RedisUnavailableError();
        }
    }

    /**
     * Gets reservation data
     */
    async getReservation(reservationId: string): Promise<any | null> {
        try {
            const key = REDIS_KEYS.RESERVATION(reservationId);
            const data = await this.redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            throw new RedisUnavailableError();
        }
    }

    /**
     * Deletes a reservation (used after checkout)
     */
    async deleteReservation(reservationId: string): Promise<void> {
        try {
            const key = REDIS_KEYS.RESERVATION(reservationId);
            await this.redisClient.del(key);
        } catch (error) {
            throw new RedisUnavailableError();
        }
    }

    /**
     * Gets TTL of a reservation in seconds
     */
    async getReservationTTL(reservationId: string): Promise<number> {
        try {
            const key = REDIS_KEYS.RESERVATION(reservationId);
            const ttl = await this.redisClient.ttl(key);
            return ttl;
        } catch (error) {
            throw new RedisUnavailableError();
        }
    }

    /**
     * Gets all expired reservations from sorted set
     */
    async getExpiredReservations(currentTimestamp: number): Promise<string[]> {
        try {
            const key = "flashkart:reservations:expiry";
            const expired = await this.redisClient.zRangeByScore(key, "-inf", currentTimestamp);
            return expired;
        } catch (error) {
            throw new RedisUnavailableError();
        }
    }
}
