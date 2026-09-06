import "dotenv/config";
import "reflect-metadata";
import { createApp } from "./app";
import { initializeDatabase } from "./config/database";
import { initializeRedis } from "./config/redis";
import { getReservationExpiryWorker } from "./workers/reservation-expiry.worker";
import { config, validateConfig } from "./config/env";

const startServer = async () => {
    try {
        console.log("[Server] Starting FlashKart Backend...");

        // Validate configuration
        validateConfig();

        // Initialize database
        console.log("[Server] Initializing database...");
        await initializeDatabase();

        // Initialize Redis
        console.log("[Server] Initializing Redis...");
        await initializeRedis();

        // Create Express app
        const app = createApp();

        // Start reservation expiry worker
        console.log("[Server] Starting reservation expiry worker...");
        const worker = getReservationExpiryWorker();
        worker.start(30000); // Check every 30 seconds

        // Start HTTP server
        const port = config.port;
        const server = app.listen(port, () => {
            console.log(`[Server] ✓ FlashKart Backend running on http://localhost:${port}`);
            console.log(`[Server] Environment: ${config.nodeEnv}`);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);

            // Stop worker
            worker.stop();

            // Close HTTP server
            server.close(async () => {
                console.log("[Server] HTTP server closed");

                // Close database connection
                try {
                    const { dataSource } = await import("./config/database");
                    if (dataSource.isInitialized) {
                        await dataSource.destroy();
                        console.log("[Server] Database connection closed");
                    }
                } catch (error) {
                    console.error("[Server] Error closing database:", error);
                }

                // Close Redis connection
                try {
                    const { getRedisClient } = await import("./config/redis");
                    const redisClient = getRedisClient();
                    await redisClient.quit();
                    console.log("[Server] Redis connection closed");
                } catch (error) {
                    console.error("[Server] Error closing Redis:", error);
                }

                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error("[Server] Forced shutdown");
                process.exit(1);
            }, 10000);
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    } catch (error) {
        console.error("[Server] Fatal error:", error);
        process.exit(1);
    }
};

// Start the server
startServer().catch((error) => {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
});
