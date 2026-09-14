import { getRedisClient } from "../config/redis";
import { StockService } from "../services/stock.service";
import { dataSource } from "../config/database";
import { CartItem } from "../entities/CartItem";

/**
 * Reservation Expiry Worker
 * Runs periodically to clean up expired reservations
 * Uses Redis sorted set to track expiration times
 * Releases stock atomically using Lua script
 */
export class ReservationExpiryWorker {
    private get redisClient() {
        return getRedisClient();
    }
    private stockService: StockService;
    private isRunning: boolean = false;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.stockService = new StockService();
    }

    /**
     * Starts the worker with a check interval
     */
    start(intervalMs: number = 30000) {
        if (this.isRunning) {
            console.warn("Reservation expiry worker is already running");
            return;
        }

        this.isRunning = true;
        console.log(
            `[ReservationExpiryWorker] Started with ${intervalMs}ms interval`
        );

        this.checkInterval = setInterval(() => {
            this.processExpiredReservations().catch((error) => {
                console.error("[ReservationExpiryWorker] Error:", error);
            });
        }, intervalMs);
    }

    /**
     * Stops the worker
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        console.log("[ReservationExpiryWorker] Stopped");
    }

    /**
     * Processes expired reservations
     */
    private async processExpiredReservations(): Promise<void> {
        try {
            const currentTimestamp = Math.floor(Date.now() / 1000);

            // Get all expired reservation keys from sorted set
            const expiredReservationKeys = await this.stockService.getExpiredReservations(
                currentTimestamp
            );

            if (expiredReservationKeys.length === 0) {
                return; // No expired reservations
            }

            console.log(
                `[ReservationExpiryWorker] Processing ${expiredReservationKeys.length} expired reservations`
            );

            for (const reservationKey of expiredReservationKeys) {
                await this.processExpiredReservation(reservationKey);
            }
        } catch (error) {
            console.error("[ReservationExpiryWorker] Error processing expired reservations:", error);
        }
    }

    /**
     * Processes a single expired reservation
     */
    private async processExpiredReservation(reservationKey: string): Promise<void> {
        try {
            // Extract reservation ID from Redis key
            // Format: flashkart:reservation:{reservationId}
            const reservationId = reservationKey.split(":").pop();
            if (!reservationId) {
                console.warn(`[ReservationExpiryWorker] Invalid reservation key: ${reservationKey}`);
                return;
            }

            // Get reservation data from Redis
            const reservation = await this.stockService.getReservation(reservationId);
            if (!reservation) {
                // Reservation already deleted (double release protection)
                await this.removeFromExpirySet(reservationKey);
                return;
            }

            // Get cart item to update database
            const cartItemRepository = dataSource.getRepository(CartItem);
            const cartItem = await cartItemRepository.findOne({
                where: { reservationId },
            });

            if (!cartItem) {
                console.warn(
                    `[ReservationExpiryWorker] No cart item found for reservation ${reservationId}`
                );
                await this.stockService.deleteReservation(reservationId);
                await this.removeFromExpirySet(reservationKey);
                return;
            }

            // Release stock atomically
            const releaseResult = await this.stockService.releaseStock(
                reservation.productId,
                reservationId,
                reservation.quantity
            );

            if (releaseResult.success) {
                // Clear reservation from cart item
                cartItem.reservationId = null;
                cartItem.reservationExpiresAt = null;
                await cartItemRepository.save(cartItem);

                console.log(
                    `[ReservationExpiryWorker] Released ${reservation.quantity} stock for product ${reservation.productId}`
                );
            } else if (releaseResult.reason === "RESERVATION_ALREADY_RELEASED") {
                // Already released, just update database and remove from expiry set
                cartItem.reservationId = null;
                cartItem.reservationExpiresAt = null;
                await cartItemRepository.save(cartItem);
            } else {
                console.error(
                    `[ReservationExpiryWorker] Failed to release reservation ${reservationId}: ${releaseResult.reason}`
                );
                return; // Don't remove from expiry set on failure
            }

            // Remove from expiry sorted set
            await this.removeFromExpirySet(reservationKey);
        } catch (error) {
            console.error(`[ReservationExpiryWorker] Error processing reservation:`, error);
        }
    }

    /**
     * Removes reservation from expiry sorted set
     */
    private async removeFromExpirySet(reservationKey: string): Promise<void> {
        try {
            await this.redisClient.zRem("flashkart:reservations:expiry", reservationKey);
        } catch (error) {
            console.error(
                `[ReservationExpiryWorker] Error removing from expiry set:`,
                error
            );
        }
    }
}

/**
 * Singleton instance
 */
let workerInstance: ReservationExpiryWorker | null = null;

export const getReservationExpiryWorker = (): ReservationExpiryWorker => {
    if (!workerInstance) {
        workerInstance = new ReservationExpiryWorker();
    }
    return workerInstance;
};
