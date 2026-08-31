import "reflect-metadata";
import { dataSource } from "../config/database";
import { initializeRedis, getRedisClient } from "../config/redis";
import { User, UserStatus } from "../entities/User";
import { Product, ProductStatus } from "../entities/Product";
import { StockService } from "../services/stock.service";
import { v4 as uuidv4 } from "uuid";

const seedDatabase = async () => {
    try {
        console.log("[Seed] Starting database seed...");

        // Initialize database
        await dataSource.initialize();
        console.log("[Seed] ✓ Database connection established");

        // Initialize Redis before creating the stock service
        await initializeRedis();
        console.log("[Seed] ✓ Redis connection established");

        const userRepository = dataSource.getRepository(User);
        const productRepository = dataSource.getRepository(Product);
        const stockService = new StockService();

        // Clear existing data in dependency-safe order
        console.log("[Seed] Clearing existing data...");
        await dataSource.query(`
            TRUNCATE TABLE
                "order_items",
                "orders",
                "cart_items",
                "carts",
                "products",
                "users"
            RESTART IDENTITY CASCADE;
        `);

        // Create users
        console.log("[Seed] Creating users...");
        const users = [
            {
                id: uuidv4(),
                name: "Alice Johnson",
                email: "alice@example.com",
                status: UserStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Bob Smith",
                email: "bob@example.com",
                status: UserStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Charlie Brown",
                email: "charlie@example.com",
                status: UserStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Diana Prince",
                email: "diana@example.com",
                status: UserStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Eve Wilson",
                email: "eve@example.com",
                status: UserStatus.ACTIVE,
            },
        ];

        const savedUsers = await userRepository.save(users);
        console.log(`[Seed] ✓ Created ${savedUsers.length} users`);

        // Create products
        console.log("[Seed] Creating products...");
        const products = [
            {
                id: uuidv4(),
                name: "Flash Sale Laptop - Limited Stock",
                sku: "FLASH-LAPTOP-001",
                description: "High-performance laptop with flash sale pricing",
                price: 799.99,
                stock: 100, // Limited stock for flash sale
                status: ProductStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Flash Sale Headphones",
                sku: "FLASH-HEADPHONES-001",
                description: "Premium wireless headphones",
                price: 199.99,
                stock: 50,
                status: ProductStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Flash Sale USB-C Cable",
                sku: "FLASH-CABLE-001",
                description: "Durable USB-C charging cable",
                price: 19.99,
                stock: 500,
                status: ProductStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Flash Sale Mouse",
                sku: "FLASH-MOUSE-001",
                description: "Ergonomic wireless mouse",
                price: 49.99,
                stock: 200,
                status: ProductStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Flash Sale Keyboard",
                sku: "FLASH-KEYBOARD-001",
                description: "Mechanical gaming keyboard",
                price: 129.99,
                stock: 75,
                status: ProductStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Flash Sale Monitor",
                sku: "FLASH-MONITOR-001",
                description: "4K gaming monitor with 144Hz refresh",
                price: 599.99,
                stock: 30,
                status: ProductStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Flash Sale Webcam",
                sku: "FLASH-WEBCAM-001",
                description: "4K ultra HD webcam",
                price: 89.99,
                stock: 100,
                status: ProductStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Flash Sale USB Hub",
                sku: "FLASH-HUB-001",
                description: "7-port USB 3.0 hub with charging",
                price: 39.99,
                stock: 150,
                status: ProductStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Flash Sale External SSD",
                sku: "FLASH-SSD-001",
                description: "1TB external SSD - ultra-fast speeds",
                price: 129.99,
                stock: 80,
                status: ProductStatus.ACTIVE,
            },
            {
                id: uuidv4(),
                name: "Flash Sale Phone Case",
                sku: "FLASH-CASE-001",
                description: "Protective phone case with drop protection",
                price: 24.99,
                stock: 300,
                status: ProductStatus.ACTIVE,
            },
        ];

        const savedProducts = await productRepository.save(products);
        console.log(`[Seed] ✓ Created ${savedProducts.length} products`);

        // Initialize Redis stock for each product
        console.log("[Seed] Initializing Redis stock...");
        for (const product of savedProducts) {
            if (!product.id) {
                throw new Error(`Product missing id during Redis stock initialization: ${JSON.stringify(product)}`);
            }
            await stockService.initializeStock(product.id, product.stock);
        }
        console.log("[Seed] ✓ Redis stock initialized");

        console.log("\n[Seed] ✓ Seed completed successfully!");
        console.log("\nTest Data:");
        console.log("Users:");
        savedUsers.forEach((user) => {
            console.log(`  - ${user.name} (${user.email})`);
        });
        console.log("\nProducts (with limited stock for flash sale):");
        savedProducts.slice(0, 3).forEach((product) => {
            console.log(`  - ${product.name} (${product.stock} units, $${product.price})`);
        });

        await dataSource.destroy();

        try {
            const redisClient = getRedisClient();
            await redisClient.quit();
            console.log("[Seed] ✓ Redis connection closed");
        } catch (error) {
            console.warn("[Seed] Redis was not initialized or already closed");
        }
    } catch (error) {
        console.error("[Seed] Error:", error);
        process.exit(1);
    }
};

seedDatabase();
