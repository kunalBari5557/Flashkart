import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

export enum ProductStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    ARCHIVED = "ARCHIVED",
}

@Entity("products")
@Index("idx_products_sku", { synchronize: false })
@Index("idx_products_status", { synchronize: false })
export class Product {
    @PrimaryColumn("uuid")
    id: string = uuidv4();

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 100, unique: true })
    sku!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    price!: number;

    @Column({ type: "int" })
    stock!: number;

    @Column({ type: "enum", enum: ProductStatus, default: ProductStatus.ACTIVE })
    status!: ProductStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
