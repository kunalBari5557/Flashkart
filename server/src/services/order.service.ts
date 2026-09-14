import { dataSource } from "../config/database";
import { Order, OrderStatus } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Cart, CartStatus } from "../entities/Cart";
import { CartItem } from "../entities/CartItem";
import { StockService } from "./stock.service";
import { ProductService } from "./product.service";
import { IdempotencyService } from "./idempotency.service";
import { ReservationService } from "./reservation.service";
import {
    NotFoundError,
    GoneError,
    ConflictError,
    ValidationError,
} from "../utils/errors";
import { v4 as uuidv4 } from "uuid";

export class OrderService {
    private stockService: StockService;
    private productService: ProductService;
    private idempotencyService: IdempotencyService;
    private reservationService: ReservationService;

    constructor() {
        this.stockService = new StockService();
        this.productService = new ProductService();
        this.idempotencyService = new IdempotencyService();
        this.reservationService = new ReservationService();
    }

    /**
     * Checkout with reservation
     * Implements idempotent, transactional checkout
     * POST /order/checkout
     */
    async checkout(
        userId: string,
        reservationId: string,
        idempotencyKey: string
    ): Promise<Order> {
        // Validate idempotency key
        if (!this.idempotencyService.validateIdempotencyKey(idempotencyKey)) {
            throw new ValidationError("Invalid idempotency key");
        }

        // Check Redis cache for fast duplicate detection
        const cachedOrder = await this.idempotencyService.getCachedResponse(
            userId,
            idempotencyKey
        );
        if (cachedOrder) {
            console.log(`[Idempotency Cache Hit] User: ${userId}, Key: ${idempotencyKey}`);
            return cachedOrder;
        }

        // Check database for existing order (final consistency guarantee)
        const existingOrder = await this.idempotencyService.getExistingOrder(
            userId,
            idempotencyKey
        );
        if (existingOrder) {
            console.log(`[Idempotency DB Hit] User: ${userId}, Key: ${idempotencyKey}`);
            await this.idempotencyService.cacheResponse(userId, idempotencyKey, existingOrder);
            return existingOrder;
        }

        // Validate reservation
        const { productId, quantity } = await this.reservationService.validateReservation(
            reservationId,
            userId
        );

        // Get product details
        const product = await this.productService.getProductById(productId);

        // Use transaction for atomic checkout
        const order = await dataSource.transaction(async (manager) => {
            // Create order
            const orderNumber = this.generateOrderNumber();
            const totalAmount = parseFloat(product.price.toString()) * quantity;

            const order = manager.create(Order, {
                userId,
                orderNumber,
                status: OrderStatus.CONFIRMED,
                totalAmount,
                idempotencyKey,
            });

            const savedOrder = await manager.save(order);

            // Create order items
            const orderItem = manager.create(OrderItem, {
                orderId: savedOrder.id,
                productId,
                productName: product.name,
                quantity,
                unitPrice: product.price,
                totalPrice: totalAmount,
            });

            await manager.save(orderItem);

            // Update cart to CHECKED_OUT
            const cart = await manager.findOne(Cart, {
                where: { userId, status: CartStatus.ACTIVE },
            });

            if (cart) {
                cart.status = CartStatus.CHECKED_OUT;
                await manager.save(cart);
            }

            return savedOrder;
        });

        // Clean up reservation from Redis after successful transaction
        // This is a best-effort operation - if it fails, the reservation will eventually expire
        try {
            await this.stockService.deleteReservation(reservationId);
        } catch (error) {
            console.warn(
                `Failed to delete reservation ${reservationId} after checkout. Will expire naturally.`,
                error
            );
        }

        // Cache the order for idempotency
        await this.idempotencyService.cacheResponse(userId, idempotencyKey, order);

        return order;
    }

    /**
     * Generates a unique order number
     */
    private generateOrderNumber(): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(5, "0");
        return `ORD-${timestamp}-${random}`;
    }

    /**
     * Gets order by ID
     */
    async getOrderById(orderId: string, userId: string): Promise<Order> {
        const orderRepository = dataSource.getRepository(Order);
        const order = await orderRepository.findOne({
            where: { id: orderId, userId },
            relations: ["items"],
        });

        if (!order) {
            throw new NotFoundError("ORDER_NOT_FOUND", "Order not found");
        }

        return order;
    }

    /**
     * Gets user's orders
     */
    async getUserOrders(userId: string, limit: number = 20): Promise<Order[]> {
        const orderRepository = dataSource.getRepository(Order);
        return orderRepository.find({
            where: { userId },
            relations: ["items"],
            order: { createdAt: "DESC" },
            take: limit,
        });
    }
}
