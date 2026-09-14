import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialSchema1693462800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(
      `CREATE TYPE "user_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');`
    );
    await queryRunner.query(
      `CREATE TYPE "product_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');`
    );
    await queryRunner.query(
      `CREATE TYPE "cart_status_enum" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED');`
    );
    await queryRunner.query(
      `CREATE TYPE "order_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED');`
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL UNIQUE,
        "status" "user_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_users_email" ON "users" ("email")`
    );

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "sku" character varying NOT NULL UNIQUE,
        "description" text NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "stock" integer NOT NULL,
        "status" "product_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_products_sku" ON "products" ("sku")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_status" ON "products" ("status")`
    );

    await queryRunner.query(`
      CREATE TABLE "carts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "status" "cart_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_carts_userId" ON "carts" ("userId")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_carts_status" ON "carts" ("status")`
    );

    await queryRunner.query(`
      CREATE TABLE "cart_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cartId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "reservationId" uuid,
        "reservationExpiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
        UNIQUE ("cartId", "productId")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_cart_items_cartId" ON "cart_items" ("cartId")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_cart_items_productId" ON "cart_items" ("productId")`
    );

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "orderNumber" character varying NOT NULL UNIQUE,
        "status" "order_status_enum" NOT NULL DEFAULT 'PENDING',
        "totalAmount" numeric(12,2) NOT NULL,
        "idempotencyKey" character varying NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        UNIQUE ("userId", "idempotencyKey")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_orders_userId" ON "orders" ("userId")`
    );

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "productName" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "totalPrice" numeric(12,2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_order_items_orderId" ON "order_items" ("orderId")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_productId" ON "order_items" ("productId")`
    );

    console.log("✓ Migration: CreateInitialSchema completed");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_order_items_productId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_order_items_orderId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_cart_items_productId"`
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_cart_items_cartId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_items"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_carts_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_carts_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_sku"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "order_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cart_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "product_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum";`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp";`);

    console.log("✓ Migration: CreateInitialSchema rolled back");
  }
}
