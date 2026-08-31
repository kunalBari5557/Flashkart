# FlashKart Backend - File Structure Reference

This document provides a quick reference for all files in the FlashKart backend project.

## Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Development environment variables |
| `.env.example` | Environment template for documentation |
| `.gitignore` | Git ignore patterns |
| `package.json` | NPM dependencies and scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `docker-compose.yml` | Docker Compose for local development (PostgreSQL, Redis, API) |
| `Dockerfile` | Production Docker image |

## Source Code - Configuration (`src/config/`)

| File | Purpose |
|------|---------|
| `database.ts` | TypeORM DataSource initialization and PostgreSQL setup |
| `redis.ts` | Redis client initialization and connection management |
| `env.ts` | Environment variable validation and configuration object |

## Source Code - Entities (`src/entities/`)

| File | Purpose | Key Constraints |
|------|---------|-----------------|
| `User.ts` | User entity with status enum | UNIQUE email, indexed |
| `Product.ts` | Product with stock and pricing | UNIQUE SKU, indexed status |
| `Cart.ts` | Shopping cart container | Foreign key to User |
| `CartItem.ts` | Items in cart with reservations | UNIQUE (cartId, productId), stores reservation ID |
| `Order.ts` | Order entity | UNIQUE (userId, idempotencyKey), indexed userId |
| `OrderItem.ts` | Order line items with snapshots | Stores product name/price at order time |

## Source Code - Services (`src/services/`)

| File | Purpose |
|------|---------|
| `stock.service.ts` | Redis stock management, reservation with Lua scripts |
| `reservation.service.ts` | Business logic for creating reservations |
| `order.service.ts` | Checkout logic with transactions and idempotency |
| `product.service.ts` | Product retrieval with Redis caching (cache-aside pattern) |
| `cart.service.ts` | Cart operations (retrieve, update, clear) |
| `idempotency.service.ts` | Dual-layer idempotency (Redis + PostgreSQL) |

## Source Code - Controllers (`src/controllers/`)

| File | Purpose | Endpoints |
|------|---------|-----------|
| `product.controller.ts` | Product HTTP handlers | GET /products, GET /products/:id |
| `cart.controller.ts` | Cart HTTP handlers | POST /cart/reserve, GET /cart, DELETE /cart/... |
| `order.controller.ts` | Order HTTP handlers | POST /order/checkout, GET /order, GET /order/:id |

## Source Code - Routes (`src/routes/`)

| File | Purpose |
|------|---------|
| `product.routes.ts` | Routes for product endpoints (public) |
| `cart.routes.ts` | Routes for cart endpoints (protected, requires auth) |
| `order.routes.ts` | Routes for order endpoints (protected, requires auth) |

## Source Code - Middleware (`src/middleware/`)

| File | Purpose |
|------|---------|
| `auth.middleware.ts` | Extracts userId from Authorization header |
| `error.middleware.ts` | Global error handling and 404 handling |
| `validation.middleware.ts` | Request body/header validation |

## Source Code - Utilities & Constants

| File | Purpose |
|------|---------|
| `utils/errors.ts` | Custom error classes (AppError, ValidationError, etc.) |
| `constants/index.ts` | Redis key patterns, error codes, HTTP status codes |
| `dto/index.ts` | Data transfer objects (ReserveStockDto, CheckoutDto) |

## Source Code - Redis & Lua Scripts

| File | Purpose |
|------|---------|
| `redis/scripts/reserve-stock.lua` | Atomic stock reservation: check + decrement + create reservation |
| `redis/scripts/release-stock.lua` | Atomic stock release: verify + increment + delete |

## Source Code - Workers

| File | Purpose |
|------|---------|
| `workers/reservation-expiry.worker.ts` | Background worker that processes expired reservations every 30s |

## Source Code - Seeds & Tests

| File | Purpose |
|------|---------|
| `seeds/seed.ts` | Populates database with test users and products |
| `tests/concurrency.test.ts` | Tests that stock doesn't oversell (200 req to stock of 100) |
| `tests/checkout.test.ts` | Tests idempotent checkout and transactional integrity |

## Source Code - Main Application

| File | Purpose |
|------|---------|
| `app.ts` | Express app factory with all middleware and routes |
| `server.ts` | Entry point: initializes DB, Redis, worker, starts HTTP server |

## Migrations

| File | Purpose |
|------|---------|
| `migrations/1693462800000-CreateInitialSchema.ts` | Creates all database tables with indexes and constraints |

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | Comprehensive project documentation, quick start, API reference |
| `docs/architecture.md` | Detailed architecture, failure scenarios, scaling strategies |
| `IMPLEMENTATION_NOTES.md` | Implementation summary, file structure, quick reference |
| `.env.example` | Template for environment variables |

## File Usage Quick Reference

### To understand the flow:
1. Start with `src/server.ts` - entry point
2. Look at `src/app.ts` - Express setup
3. Check routes: `src/routes/*.ts`
4. Study controllers: `src/controllers/*.ts`
5. Review services: `src/services/*.ts`
6. Understand entities: `src/entities/*.ts`

### To understand concurrency:
1. Read `src/redis/scripts/reserve-stock.lua` - atomic reservation
2. Read `src/redis/scripts/release-stock.lua` - atomic release
3. Study `src/services/stock.service.ts` - Lua script execution
4. Check `src/services/order.service.ts` - transaction handling

### To understand idempotency:
1. Review `src/services/idempotency.service.ts` - dual-layer approach
2. Check `src/services/order.service.ts` - checkout implementation
3. Look at `src/entities/Order.ts` - unique constraint setup

### To understand deployment:
1. Check `docker-compose.yml` - full stack setup
2. Review `Dockerfile` - multi-stage production build
3. Read `README.md` - deployment instructions

### To run tests:
1. Concurrency: `npm run test:concurrency`
2. Checkout: `npm run test:checkout`

## Database Diagram

```
Users (1) ──────── (Many) Orders
  |                   |
  |                   └──── (Many) OrderItems
  |
  └──────── (1) Carts
               |
               └──── (Many) CartItems ──────── (Many) Products
```

## API Endpoint Structure

```
/health                    - Health check (no auth)
/api/docs                  - API documentation (no auth)

/products                  - Public product endpoints
  GET  /                   - List all products
  GET  /:productId         - Get product by ID

/cart                      - Protected cart endpoints
  POST /reserve            - Reserve stock (requires Idempotency-Key)
  GET  /                   - Get active cart
  DELETE /items/:id        - Remove item
  DELETE /:cartId          - Clear cart

/order                     - Protected order endpoints
  POST /checkout           - Create order (requires Idempotency-Key)
  GET  /                   - List user's orders
  GET  /:orderId           - Get order details
```

## Error Code Reference

| Code | HTTP Status | Meaning |
|------|------------|---------|
| INSUFFICIENT_STOCK | 409 | Not enough stock available |
| PRODUCT_NOT_FOUND | 404 | Product doesn't exist |
| RESERVATION_NOT_FOUND | 404 | Reservation doesn't exist |
| RESERVATION_EXPIRED | 410 | Reservation expired (5 min TTL) |
| UNAUTHORIZED | 401 | Missing/invalid Authorization header |
| VALIDATION_ERROR | 400 | Input validation failed |
| REDIS_UNAVAILABLE | 503 | Redis connection failed |
| DATABASE_ERROR | 500 | Database operation failed |
| INTERNAL_ERROR | 500 | Unexpected error |

## Key Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| RESERVATION_TTL | 300s | How long a reservation is valid |
| IDEMPOTENCY_TTL | 86400s | How long to cache checkout results |
| PRODUCT_CACHE_TTL | 600s | How long to cache product data |
| CHECK_INTERVAL | 30s | Reservation expiry worker frequency |
| CONNECTION_POOL_SIZE | 20 | PostgreSQL connection limit |

## Environment Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - Alternative format

### Redis
- `REDIS_URL` - Redis connection string

### Server
- `PORT` - HTTP port (default 3000)
- `NODE_ENV` - Environment (development/production)

### Business Logic
- `RESERVATION_TTL_SECONDS` - Reservation validity (default 300)
- `MAX_CONCURRENT_RESERVATIONS_PER_USER` - Per-user reservation limit (default 5)
- `RATE_LIMIT_REQUESTS_PER_MINUTE` - Rate limiting (default 100)

---

**Last Updated:** 2026-08-31  
**Total Files:** 30+ (source code, tests, migrations, docs, config)
