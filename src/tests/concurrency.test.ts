import "reflect-metadata";
import { dataSource } from "../config/database";
import { initializeRedis, getRedisClient } from "../config/redis";
import { StockService } from "../services/stock.service";
import { Product, ProductStatus } from "../entities/Product";
import { v4 as uuidv4 } from "uuid";

/**
 * Concurrency Test: Verify no overselling under concurrent load
 * 
 * Test Scenario:
 * - Stock: 100 units
 * - Concurrent requests: 200 (each requests 1 unit)
 * - Expected: 100 successful, 100 failed
 * 
 * This verifies that the Redis Lua script prevents race conditions
 */

const runConcurrencyTest = async () => {
    try {
        console.log("[Concurrency Test] Starting...\n");

        // Initialize
        await dataSource.initialize();
        await initializeRedis();
        const redisClient = getRedisClient();
        const stockService = new StockService();

        // Create test product
        const productRepository = dataSource.getRepository(Product);
        const testProduct = productRepository.create({
            id: uuidv4(),
            name: "Test Flash Sale Product",
            sku: `TEST-SKU-${Date.now()}`,
            description: "For concurrency testing",
            price: 99.99,
            stock: 100,
            status: ProductStatus.ACTIVE,
        });
        await productRepository.save(testProduct);
        console.log(`[Test] Created product: ${testProduct.id}`);

        // Initialize Redis stock
        await stockService.initializeStock(testProduct.id, 100);
        const initialStock = await stockService.getStock(testProduct.id);
        console.log(`[Test] Initial stock in Redis: ${initialStock}\n`);

        // Concurrent reservation requests
        const numberOfRequests = 200;
        const quantityPerRequest = 1;
        const promises: Promise<any>[] = [];

        console.log(`[Test] Sending ${numberOfRequests} concurrent requests...\n`);

        const startTime = Date.now();

        for (let i = 0; i < numberOfRequests; i++) {
            const promise = (async () => {
                const reservationId = uuidv4();
                const result = await stockService.reserveStock(
                    testProduct.id,
                    reservationId,
                    quantityPerRequest,
                    300
                );

                return {
                    requestId: i,
                    reservationId,
                    success: result.success,
                    reason: result.reason || null,
                };
            })();

            promises.push(promise);
        }

        // Wait for all requests to complete
        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;

        // Analyze results
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("CONCURRENCY TEST RESULTS");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`Total Requests:    ${numberOfRequests}`);
        console.log(`Duration:          ${duration}ms`);
        console.log(`Throughput:        ${(numberOfRequests / (duration / 1000)).toFixed(2)} req/s`);
        console.log("");
        console.log(`Successful:        ${successful} ✓`);
        console.log(`Failed:            ${failed} ✗`);
        console.log("");

        // Get final stock
        const finalStock = await stockService.getStock(testProduct.id);
        console.log(`Stock Remaining:   ${finalStock} units`);
        console.log(`Stock Consumed:    ${100 - finalStock} units`);
        console.log("");

        // Verify results
        const expectedSuccessful = 100;
        const testPassed =
            successful === expectedSuccessful &&
            finalStock === 0 &&
            failed === numberOfRequests - expectedSuccessful;

        if (testPassed) {
            console.log("✓ TEST PASSED");
            console.log("  - Exactly 100 reservations succeeded");
            console.log("  - Exactly 100 reservations failed");
            console.log("  - No overselling occurred");
            console.log("  - Redis Lua script prevented race conditions");
        } else {
            console.log("✗ TEST FAILED");
            console.log(
                `  Expected ${expectedSuccessful} successful, got ${successful}`
            );
            console.log(`  Expected stock 0, got ${finalStock}`);
        }

        console.log("");
        console.log("Failure Breakdown:");
        const failureReasons = results
            .filter((r) => !r.success)
            .reduce((acc, r) => {
                acc[r.reason || "UNKNOWN"] = (acc[r.reason || "UNKNOWN"] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        Object.entries(failureReasons).forEach(([reason, count]) => {
            console.log(`  ${reason}: ${count}`);
        });

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // Cleanup
        await redisClient.flushDb();
        await productRepository.remove(testProduct);
        await dataSource.destroy();

        process.exit(testPassed ? 0 : 1);
    } catch (error) {
        console.error("[Test] Error:", error);
        process.exit(1);
    }
};

// Run test
runConcurrencyTest();
