import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

export enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
}

@Entity("users")
@Index("idx_users_email", { synchronize: false })
export class User {
    @PrimaryColumn("uuid")
    id: string = uuidv4();

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    email!: string;

    @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
    status!: UserStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
