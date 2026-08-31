import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { validateRequest, validateIdempotencyKey } from "../middleware/validation.middleware";
import { CheckoutDto } from "../dto";

const router = Router();
const controller = new OrderController();

/**
 * POST /order/checkout
 * Create an order from a reservation
 * Requires: Idempotency-Key header
 */
router.post(
    "/checkout",
    validateIdempotencyKey,
    validateRequest(CheckoutDto),
    controller.checkout.bind(controller)
);

/**
 * GET /order
 * Get user's orders
 */
router.get("/", controller.getUserOrders.bind(controller));

/**
 * GET /order/:orderId
 * Get order details
 */
router.get("/:orderId", controller.getOrder.bind(controller));

export default router;
