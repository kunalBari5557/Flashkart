import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    Index,
    ForeignKey,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { User } from "./User";
import { CartItem } from "./CartItem";

export enum CartStatus {
    ACTIVE = "ACTIVE",
    CHECKED_OUT = "CHECKED_OUT",
    ABANDONED = "ABANDONED",
}

@Entity("carts")
@Index("idx_carts_userId", { synchronize: false })
@Index("idx_carts_status", { synchronize: false })
export class Cart {
    @PrimaryColumn("uuid")
    id: string = uuidv4();

    @Column({ type: "uuid" })
    @ForeignKey(() => User)
    userId!: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    user!: User;

    @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
    items!: CartItem[];

    @Column({ type: "enum", enum: CartStatus, default: CartStatus.ACTIVE })
    status!: CartStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
