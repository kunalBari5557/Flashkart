import { getRedisClient } from "../config/redis";
import { dataSource } from "../config/database";
import { REDIS_KEYS, DEFAULTS } from "../constants";
import { Product, ProductStatus } from "../entities/Product";
import { NotFoundError } from "../utils/errors";

export class ProductService {
    private get redisClient() {
        return getRedisClient();
    }

    /**
     * Gets product by ID with caching
     * Uses cache-aside pattern
     */
    async getProductById(productId: string): Promise<Product> {
        // Try Redis first
        const cached = await this.getProductFromCache(productId);
        if (cached) {
            return cached;
        }

        // Query database
        const productRepository = dataSource.getRepository(Product);
        const product = await productRepository.findOne({ where: { id: productId } });

        if (!product) {
            throw new NotFoundError("PRODUCT_NOT_FOUND", `Product ${productId} not found`);
        }

        // Cache for TTL
        await this.cacheProduct(product);

        return product;
    }

    /**
     * Gets all active products
     */
    async getAllProducts(): Promise<Product[]> {
        const productRepository = dataSource.getRepository(Product);
        return productRepository.find({
            where: { status: ProductStatus.ACTIVE },
            order: { createdAt: "DESC" },
        });
    }

    /**
     * Validates product is active and has requested stock
     */
    async validateProduct(product: Product, requestedQuantity: number): Promise<void> {
        if (product.status !== ProductStatus.ACTIVE) {
            throw new NotFoundError("PRODUCT_INACTIVE", "Product is not available");
        }

        // Note: Stock in PostgreSQL is the source of truth
        // Redis stock is used for concurrency control during reservations
        if (product.stock < requestedQuantity) {
            throw new NotFoundError("INSUFFICIENT_STOCK", "Insufficient stock in system");
        }
    }

    /**
     * Gets product from cache
     */
    private async getProductFromCache(productId: string): Promise<Product | null> {
        try {
            const key = REDIS_KEYS.PRODUCT(productId);
            const cached = await this.redisClient.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error("Error getting product from cache:", error);
            return null;
        }
    }

    /**
     * Caches product in Redis
     */
    private async cacheProduct(
        product: Product,
        ttl: number = DEFAULTS.PRODUCT_CACHE_TTL
    ): Promise<void> {
        try {
            const key = REDIS_KEYS.PRODUCT(product.id);
            await this.redisClient.setEx(key, ttl, JSON.stringify(product));
        } catch (error) {
            console.error("Error caching product:", error);
            // Don't throw - it's okay if caching fails
        }
    }

    /**
     * Invalidates product cache
     */
    async invalidateProductCache(productId: string): Promise<void> {
        try {
            const key = REDIS_KEYS.PRODUCT(productId);
            await this.redisClient.del(key);
        } catch (error) {
            console.error("Error invalidating product cache:", error);
            // Don't throw
        }
    }

    /**
     * Updates product stock in PostgreSQL
     */
    async updateProductStock(productId: string, quantity: number): Promise<void> {
        const productRepository = dataSource.getRepository(Product);
        await productRepository.update(
            { id: productId },
            { stock: () => `stock - ${quantity}` }
        );
        await this.invalidateProductCache(productId);
    }
}
