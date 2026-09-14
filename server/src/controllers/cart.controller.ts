import { Request, Response, NextFunction } from "express";
import { ReservationService } from "../services/reservation.service";
import { CartService } from "../services/cart.service";

export class CartController {
    private reservationService: ReservationService;
    private cartService: CartService;

    constructor() {
        this.reservationService = new ReservationService();
        this.cartService = new CartService();
    }

    /**
     * POST /cart/reserve
     * Reserve stock for a product
     */
    async reserve(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).userId;
            const { productId, quantity } = req.body;

            const result = await this.reservationService.reserveStock(
                userId,
                productId,
                quantity
            );

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /cart
     * Get user's active cart
     */
    async getCart(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).userId;
            const cart = await this.cartService.getActiveCart(userId);

            if (!cart) {
                return res.status(200).json({
                    success: true,
                    data: null,
                });
            }

            res.status(200).json({
                success: true,
                data: cart,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /cart/items/:cartItemId
     * Remove item from cart
     */
    async removeItem(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).userId;
            const { cartItemId } = req.params;

            await this.cartService.removeCartItem(cartItemId, userId);

            res.status(200).json({
                success: true,
                message: "Item removed from cart",
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /cart
     * Clear all items from cart
     */
    async clearCart(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).userId;
            const { cartId } = req.params;

            await this.cartService.clearCart(cartId, userId);

            res.status(200).json({
                success: true,
                message: "Cart cleared",
            });
        } catch (error) {
            next(error);
        }
    }
}
