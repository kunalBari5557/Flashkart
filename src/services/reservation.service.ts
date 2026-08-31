import { v4 as uuidv4 } from "uuid";
import { dataSource } from "../config/database";
import { StockService } from "./stock.service";
import { ProductService } from "./product.service";
import { Cart, CartStatus } from "../entities/Cart";
import { CartItem } from "../entities/CartItem";
import { Product } from "../entities/Product";
import {
    ValidationError,
    InsufficientStockError,
    NotFoundError,
    ConflictError,
} from "../utils/errors";
import { config } from "../config/env";

export class ReservationService {
    private stockService: StockService;
    private productService: ProductService;

    constructor() {
        this.stockService = new StockService();
        this.productService = new ProductService();
    }

    /**
     * Creates a reservation for a product
     * Business logic for POST /cart/reserve
     */
    async reserveStock(userId: string, productId: string, quantity: number) {
        // Validate inputs
        if (!productId || !quantity || quantity < 1) {
            throw new ValidationError("Invalid product ID or quantity");
        }

        // Get product and validate
        const product = await this.productService.getProductById(productId);
        await this.productService.validateProduct(product, quantity);

        // Check user's concurrent reservations
        const userReservationCount = await this.getUserReservationCount(userId);
        if (
            userReservationCount >=
            config.business.maxConcurrentReservationsPerUser
        ) {
            throw new ConflictError(
                "MAX_RESERVATIONS_EXCEEDED",
                "Maximum concurrent reservations reached"
            );
        }

        // Create reservation ID
        const reservationId = uuidv4();

        // Atomically reserve stock in Redis
        const reserveResult = await this.stockService.reserveStock(
            productId,
            reservationId,
            quantity,
            config.business.reservationTtl
        );

        if (!reserveResult.success) {
            if (reserveResult.reason === "INSUFFICIENT_STOCK") {
                throw new InsufficientStockError();
            } else if (reserveResult.reason === "STOCK_KEY_NOT_FOUND") {
                throw new NotFoundError("PRODUCT_NOT_FOUND", "Product stock not initialized");
            }
            throw new Error("Failed to reserve stock");
        }

        // Get or create cart for user
        const cart = await this.getOrCreateCart(userId);

        // Add/update cart item with reservation
        const expiresAt = new Date(Date.now() + config.business.reservationTtl * 1000);
        await this.addOrUpdateCartItem(
            cart.id,
            productId,
            quantity,
            reservationId,
            expiresAt
        );

        return {
            success: true,
            reservationId,
            productId,
            quantity,
            expiresAt,
        };
    }

    /**
     * Gets user's active cart or creates one
     */
    private async getOrCreateCart(userId: string): Promise<Cart> {
        const cartRepository = dataSource.getRepository(Cart);

        let cart = await cartRepository.findOne({
            where: { userId, status: CartStatus.ACTIVE },
            relations: ["items"],
        });

        if (!cart) {
            cart = cartRepository.create({ userId });
            cart = await cartRepository.save(cart);
        }

        return cart;
    }

    /**
     * Adds or updates cart item with reservation
     */
    private async addOrUpdateCartItem(
        cartId: string,
        productId: string,
        quantity: number,
        reservationId: string,
        expiresAt: Date
    ): Promise<CartItem> {
        const cartItemRepository = dataSource.getRepository(CartItem);

        let cartItem = await cartItemRepository.findOne({
            where: { cartId, productId },
        });

        if (cartItem) {
            // Update existing item
            cartItem.quantity = quantity;
            cartItem.reservationId = reservationId;
            cartItem.reservationExpiresAt = expiresAt;
        } else {
            // Create new item
            cartItem = cartItemRepository.create({
                cartId,
                productId,
                quantity,
                reservationId,
                reservationExpiresAt: expiresAt,
            });
        }

        return cartItemRepository.save(cartItem);
    }

    /**
     * Gets count of user's active reservations
     */
    private async getUserReservationCount(userId: string): Promise<number> {
        const cartRepository = dataSource.getRepository(Cart);
        const cart = await cartRepository.findOne({
            where: { userId, status: CartStatus.ACTIVE },
            relations: ["items"],
        });

        if (!cart) {
            return 0;
        }

        return cart.items.filter((item) => item.reservationId && item.reservationExpiresAt).length;
    }

    /**
     * Validates a reservation exists and is not expired
     */
    async validateReservation(
        reservationId: string,
        userId: string
    ): Promise<{ productId: string; quantity: number; cartItemId: string }> {
        // Get reservation from Redis
        const reservation = await this.stockService.getReservation(reservationId);
        if (!reservation) {
            throw new NotFoundError("RESERVATION_NOT_FOUND", "Reservation not found or expired");
        }

        // Verify ownership - find cart item with this reservation
        const cartItemRepository = dataSource.getRepository(CartItem);
        const cartItem = await cartItemRepository.findOne({
            where: { reservationId },
            relations: ["cart"],
        });

        if (!cartItem) {
            throw new NotFoundError("RESERVATION_NOT_FOUND", "Reservation not found");
        }

        if (cartItem.cart.userId !== userId) {
            throw new ConflictError(
                "RESERVATION_OWNERSHIP_MISMATCH",
                "You do not own this reservation"
            );
        }

        // Check if reservation is expired
        const expiresAt = cartItem.reservationExpiresAt;
        if (expiresAt && new Date() > expiresAt) {
            throw new NotFoundError("RESERVATION_EXPIRED", "Reservation has expired");
        }

        return {
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            cartItemId: cartItem.id,
        };
    }
}
