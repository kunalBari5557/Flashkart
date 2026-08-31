import express from "express";
import helmet from "helmet";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";

export const createApp = () => {
    const app = express();

    // Security middleware
    app.use(helmet());
    app.use(cors());

    // Request parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint (no auth required)
    app.get("/health", (req, res) => {
        res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // API documentation endpoint
    app.get("/api/docs", (req, res) => {
        res.status(200).json({
            name: "FlashKart API",
            version: "1.0.0",
            endpoints: {
                products: "GET /products, GET /products/:productId",
                cart: "POST /cart/reserve, GET /cart, DELETE /cart/items/:cartItemId",
                order: "POST /order/checkout, GET /order, GET /order/:orderId",
            },
        });
    });

    // Routes
    app.use("/products", productRoutes);

    // Protected routes (require authentication)
    app.use("/cart", authMiddleware, cartRoutes);
    app.use("/order", authMiddleware, orderRoutes);

    // 404 handler
    app.use(notFoundMiddleware);

    // Error handler (must be last)
    app.use(errorMiddleware);

    return app;
};
