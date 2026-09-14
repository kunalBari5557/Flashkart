import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    Unique,
    Index,
    ForeignKey,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { User } from "./User";
import { OrderItem } from "./OrderItem";

export enum OrderStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED",
}

@Entity("orders")
@Unique("unique_userId_idempotencyKey", ["userId", "idempotencyKey"])
@Unique("unique_orderNumber", ["orderNumber"])
@Index("idx_orders_userId", { synchronize: false })
export class Order {
    @PrimaryColumn("uuid")
    id: string = uuidv4();

    @Column({ type: "uuid" })
    @ForeignKey(() => User)
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    user!: User;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items!: OrderItem[];

    @Column({ type: "varchar", length: 50, unique: true })
    orderNumber!: string;

    @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
    status!: OrderStatus;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    totalAmount!: number;

    @Column({ type: "varchar", length: 255, unique: true })
    idempotencyKey!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
