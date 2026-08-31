import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";

export class ProductController {
    private productService: ProductService;

    constructor() {
        this.productService = new ProductService();
    }

    /**
     * GET /products
     * Get all active products
     */
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const products = await this.productService.getAllProducts();

            res.status(200).json({
                success: true,
                data: products,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /products/:productId
     * Get product by ID
     */
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params;

            const product = await this.productService.getProductById(productId);

            res.status(200).json({
                success: true,
                data: product,
            });
        } catch (error) {
            next(error);
        }
    }
}
