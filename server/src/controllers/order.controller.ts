import { Request, Response, NextFunction } from "express";
import { OrderService } from "../services/order.service";

export class OrderController {
    private orderService: OrderService;

    constructor() {
        this.orderService = new OrderService();
    }

    /**
     * POST /order/checkout
     * Create an order from a reservation (with idempotency)
     */
    async checkout(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).userId;
            const idempotencyKey = (req as any).idempotencyKey;
            const { reservationId } = req.body;

            const order = await this.orderService.checkout(
                userId,
                reservationId,
                idempotencyKey
            );

            res.status(201).json({
                success: true,
                data: order,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /order/:orderId
     * Get order details
     */
    async getOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).userId;
            const { orderId } = req.params;

            const order = await this.orderService.getOrderById(orderId, userId);

            res.status(200).json({
                success: true,
                data: order,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /order
     * Get user's orders
     */
    async getUserOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).userId;
            const limit = parseInt(req.query.limit as string) || 20;

            const orders = await this.orderService.getUserOrders(userId, limit);

            res.status(200).json({
                success: true,
                data: orders,
            });
        } catch (error) {
            next(error);
        }
    }
}
