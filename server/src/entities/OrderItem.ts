import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    Index,
    ForeignKey,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity("order_items")
@Index("idx_order_items_orderId", { synchronize: false })
@Index("idx_order_items_productId", { synchronize: false })
export class OrderItem {
    @PrimaryColumn("uuid")
    id: string = uuidv4();

    @Column({ type: "uuid" })
    @ForeignKey(() => Order)
    orderId!: string;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
    order!: Order;

    @Column({ type: "uuid" })
    @ForeignKey(() => Product)
    productId!: string;

    @ManyToOne(() => Product, { onDelete: "CASCADE" })
    product!: Product;

    @Column({ type: "varchar", length: 255 })
    productName!: string;

    @Column({ type: "int" })
    quantity!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    unitPrice!: number;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    totalPrice!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
