import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { validateRequest } from "../middleware/validation.middleware";
import { ReserveStockDto } from "../dto";

const router = Router();
const controller = new CartController();

/**
 * POST /cart/reserve
 * Reserve stock for a product
 * Requires: Idempotency-Key header
 */
router.post(
    "/reserve",
    validateRequest(ReserveStockDto),
    controller.reserve.bind(controller)
);

/**
 * GET /cart
 * Get user's active cart
 */
router.get("/", controller.getCart.bind(controller));

/**
 * DELETE /cart/items/:cartItemId
 * Remove item from cart
 */
router.delete("/items/:cartItemId", controller.removeItem.bind(controller));

/**
 * DELETE /cart/:cartId
 * Clear cart
 */
router.delete("/:cartId", controller.clearCart.bind(controller));

export default router;
