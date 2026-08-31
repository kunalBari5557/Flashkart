import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();
const controller = new ProductController();

/**
 * GET /products
 * Get all active products
 */
router.get("/", controller.getAll.bind(controller));

/**
 * GET /products/:productId
 * Get product by ID with caching
 */
router.get("/:productId", controller.getById.bind(controller));

export default router;
