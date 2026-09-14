import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    Unique,
    Index,
    ForeignKey,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Cart } from "./Cart";
import { Product } from "./Product";

@Entity("cart_items")
@Unique("unique_cart_product", ["cartId", "productId"])
@Index("idx_cart_items_cartId", { synchronize: false })
@Index("idx_cart_items_productId", { synchronize: false })
export class CartItem {
    @PrimaryColumn("uuid")
    id: string = uuidv4();

    @Column({ type: "uuid" })
    @ForeignKey(() => Cart)
    cartId!: string;

    @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: "CASCADE" })
    cart!: Cart;

    @Column({ type: "uuid" })
    @ForeignKey(() => Product)
    productId!: string;

    @ManyToOne(() => Product, { onDelete: "CASCADE" })
    product!: Product;

    @Column({ type: "int" })
    quantity!: number;

    @Column({ type: "uuid", nullable: true })
    reservationId!: string | null;

    @Column({ type: "timestamp", nullable: true })
    reservationExpiresAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
