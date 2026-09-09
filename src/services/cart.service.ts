import { dataSource } from "../config/database";
import { Cart, CartStatus } from "../entities/Cart";
import { CartItem } from "../entities/CartItem";
import { NotFoundError } from "../utils/errors";

export class CartService {
    /**
     * Gets user's active cart
     */
    async getActiveCart(userId: string): Promise<Cart | null> {
        const cartRepository = dataSource.getRepository(Cart);
        const cart = await cartRepository.findOne({
            where: { userId, status: CartStatus.ACTIVE },
            relations: ["items", "items.product"],
        });

        if (cart) {
            (cart as any).totalAmount = (cart.items || []).reduce((total, item) => {
                const price = parseFloat(item.product?.price?.toString() || "0");
                return total + price * item.quantity;
            }, 0);
        }

        return cart;
    }

    /**
     * Gets all carts for a user
     */
    async getUserCarts(userId: string): Promise<Cart[]> {
        const cartRepository = dataSource.getRepository(Cart);
        return cartRepository.find({
            where: { userId },
            relations: ["items", "items.product"],
            order: { createdAt: "DESC" },
        });
    }

    /**
     * Removes item from cart
     */
    async removeCartItem(cartItemId: string, userId: string): Promise<void> {
        const cartItemRepository = dataSource.getRepository(CartItem);
        const cartItem = await cartItemRepository.findOne({
            where: { id: cartItemId },
            relations: ["cart"],
        });

        if (!cartItem) {
            throw new NotFoundError("CART_ITEM_NOT_FOUND", "Cart item not found");
        }

        if (cartItem.cart.userId !== userId) {
            throw new NotFoundError("CART_ITEM_NOT_FOUND", "Cart item not found");
        }

        await cartItemRepository.remove(cartItem);
    }

    /**
     * Clears all items from cart
     */
    async clearCart(cartId: string, userId: string): Promise<void> {
        const cartRepository = dataSource.getRepository(Cart);
        const cart = await cartRepository.findOne({
            where: { id: cartId, userId },
            relations: ["items"],
        });

        if (!cart) {
            throw new NotFoundError("CART_NOT_FOUND", "Cart not found");
        }

        const cartItemRepository = dataSource.getRepository(CartItem);
        if (cart.items.length > 0) {
            await cartItemRepository.remove(cart.items);
        }
    }

    /**
     * Gets cart value
     */
    async getCartTotal(cartId: string, userId: string): Promise<number> {
        const cartRepository = dataSource.getRepository(Cart);
        const cart = await cartRepository.findOne({
            where: { id: cartId, userId },
            relations: ["items", "items.product"],
        });

        if (!cart) {
            throw new NotFoundError("CART_NOT_FOUND", "Cart not found");
        }

        return cart.items.reduce((total, item) => {
            const price = parseFloat(item.product.price.toString());
            return total + price * item.quantity;
        }, 0);
    }
}
