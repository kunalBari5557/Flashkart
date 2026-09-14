# FlashKart Backend - High-Concurrency Flash-Sale Platform

A production-quality Node.js backend for a flash-sale e-commerce platform, designed to handle thousands of concurrent users purchasing limited-stock products simultaneously.

## 📋 Overview

FlashKart is built with:
- **High Concurrency**: Redis Lua scripts ensure atomic stock reservation under extreme load
- **Zero Overselling**: Multiple layers of protection (Redis, PostgreSQL, transactions)
- **Idempotent Checkout**: Duplicate requests return same order without creating new ones
- **Reservation Expiry**: 5-minute TTL with automatic background cleanup
- **Horizontal Scalability**: Stateless API servers with shared Redis/PostgreSQL

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                             │
└──────┬──────────────────────────────────────────────┬────────┘
       │                                              │
   ┌───▼────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Node.js│  │ Node.js  │  │ Node.js  │  │ Node.js  │
   │  API 1 │  │  API 2   │  │  API 3   │  │  API N   │
   └───┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │            │             │             │
       └────────────┼─────────────┴─────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌───▼───┐  ┌───▼────┐  ┌──▼───────┐
    │ Redis │  │PostgreSQL│ │ Worker   │
    │ Cache │  │  (Durable)│ │ (Expiry) │
    └───────┘  └──────────┘ └──────────┘
```

**Redis Role:**
- High-concurrency stock control using Lua scripts
- Atomic reservation creation
- Temporary reservation storage with 5-minute TTL
- Idempotency cache (fast-path)
- Product cache (cache-aside pattern)

**PostgreSQL Role:**
- Durable source of truth for users, products, orders
- Business state persistence
- Atomic checkout transactions
- Final idempotency guarantee via unique constraint

**Worker:**
- Runs every 30 seconds
- Finds expired reservations from Redis sorted set
- Releases stock atomically using Lua script
- Updates database state

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### With Docker Compose (Recommended)

```bash
# Clone and setup
git clone <repository>
cd flashkart-backend

# Start all services
docker-compose up

# Wait for services to be healthy (check logs)
# Then in another terminal:

# Run migrations
npm run migration:run

# Seed test data
npm run seed

# API is now running at http://localhost:3000
```

### Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your PostgreSQL and Redis URLs

# Run migrations
npm run migration:run

# Seed test data
npm run seed

# Start development server
npm run dev
```

## 📋 Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/flashkart

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development

# Business Logic
RESERVATION_TTL_SECONDS=300              # 5 minutes
MAX_CONCURRENT_RESERVATIONS_PER_USER=5
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

## 🔌 API Endpoints

All endpoints return consistent JSON responses:

```json
{
  "success": true/false,
  "data": { /* response data */ },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Public Endpoints

#### GET /health
Health check endpoint

```bash
curl http://localhost:3000/health
```

#### GET /api/docs
API documentation

```bash
curl http://localhost:3000/api/docs
```

### Product Endpoints

#### GET /products
Get all active products

```bash
curl http://localhost:3000/products
```

#### GET /products/:productId
Get product by ID (uses cache)

```bash
curl http://localhost:3000/products/550e8400-e29b-41d4-a716-446655440000
```

### Protected Endpoints (Require Authorization)

All protected endpoints require: `Authorization: Bearer <userId>`

Replace `<userId>` with a UUID from the seeded users.

#### POST /cart/reserve
Reserve stock for a product

**Required Headers:**
- `Authorization: Bearer <userId>`
- `Idempotency-Key: unique-request-id`

**Request:**
```json
{
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 2
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "reservationId": "550e8400-e29b-41d4-a716-446655440001",
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 2,
    "expiresAt": "2026-08-31T12:05:00.000Z"
  }
}
```

#### GET /cart
Get user's active cart

```bash
curl -H "Authorization: Bearer <userId>" http://localhost:3000/cart
```

#### POST /order/checkout
Create an order from a reservation (idempotent)

**Required Headers:**
- `Authorization: Bearer <userId>`
- `Idempotency-Key: unique-checkout-id`

**Request:**
```json
{
  "reservationId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "orderNumber": "ORD-1693462800000-12345",
    "status": "CONFIRMED",
    "totalAmount": "1599.98",
    "idempotencyKey": "unique-checkout-id",
    "items": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "productName": "Flash Sale Laptop - Limited Stock",
        "quantity": 2,
        "unitPrice": "799.99",
        "totalPrice": "1599.98"
      }
    ],
    "createdAt": "2026-08-31T12:00:00.000Z",
    "updatedAt": "2026-08-31T12:00:00.000Z"
  }
}
```

#### GET /order
Get user's orders

```bash
curl -H "Authorization: Bearer <userId>" http://localhost:3000/order
```

#### GET /order/:orderId
Get order details

```bash
curl -H "Authorization: Bearer <userId>" http://localhost:3000/order/550e8400-e29b-41d4-a716-446655440002
```

## 🧪 Testing

### Concurrency Test
Tests that stock cannot be oversold under concurrent reservations:

```bash
npm run test:concurrency
```

This will:
- Create 200 concurrent reservation requests
- Each requests 1 unit of stock
- Stock limit: 100 units
- Expected result: 100 successful, 100 rejected
- Verifies: Stock = 0, Reservations = 100

### Checkout Test
Tests idempotency and transaction safety:

```bash
npm run test:checkout
```

This will:
- Create valid reservation
- Send checkout request twice with same Idempotency-Key
- Verify: Only 1 order created
- Verify: Second request returns existing order
- Verify: Stock properly decremented

### Manual Testing with cURL

```bash
# Get test user ID (from seed output)
USER_ID="550e8400-e29b-41d4-a716-446655440000"
PRODUCT_ID="550e8400-e29b-41d4-a716-446655440001"

# 1. View products
curl http://localhost:3000/products

# 2. Reserve stock
curl -X POST http://localhost:3000/cart/reserve \
  -H "Authorization: Bearer $USER_ID" \
  -H "Idempotency-Key: test-reserve-1" \
  -H "Content-Type: application/json" \
  -d "{\"productId\": \"$PRODUCT_ID\", \"quantity\": 2}"

# 3. Get cart
curl -H "Authorization: Bearer $USER_ID" http://localhost:3000/cart

# 4. Checkout (use reservationId from step 2)
RESERVATION_ID="<from-step-2>"
curl -X POST http://localhost:3000/order/checkout \
  -H "Authorization: Bearer $USER_ID" \
  -H "Idempotency-Key: test-checkout-1" \
  -H "Content-Type: application/json" \
  -d "{\"reservationId\": \"$RESERVATION_ID\"}"

# 5. Idempotent checkout (same Idempotency-Key should return same order)
curl -X POST http://localhost:3000/order/checkout \
  -H "Authorization: Bearer $USER_ID" \
  -H "Idempotency-Key: test-checkout-1" \
  -H "Content-Type: application/json" \
  -d "{\"reservationId\": \"$RESERVATION_ID\"}"
```

## 📚 Key Design Decisions

### 1. Redis Lua Scripts for Stock Reservation

**Why Lua?**
- Atomic operation: Check stock + Decrement + Create reservation in single Redis command
- Prevents race conditions under thousands of concurrent requests
- No network roundtrips for intermediate checks

**Scripts:**
- `reserve-stock.lua`: Atomically reserve stock
- `release-stock.lua`: Atomically release expired stock

### 2. Idempotency with Redis + PostgreSQL

**Why Both?**
- **Redis**: Fast duplicate detection for 99.9% of requests (within TTL)
- **PostgreSQL**: Final consistency guarantee via unique constraint

**Flow:**
1. Check Redis cache (nanoseconds)
2. If miss, create order in transaction
3. Database unique constraint prevents duplicates if Redis fails

### 3. Reservation Expiry with Sorted Set + Worker

**Why Sorted Set?**
- Efficient range queries by expiration time
- Worker finds and cleans up expired reservations
- Prevents stale data from accumulating

**Why Background Worker?**
- Doesn't block API requests
- Graceful degradation (if worker fails, reservations auto-expire via TTL)
- Scalable: can run on dedicated worker nodes

### 4. PostgreSQL Transaction for Checkout

**Atomicity Guarantee:**
```
BEGIN TRANSACTION
  - Create Order
  - Create OrderItem(s)
  - Update Cart status
  - Create Idempotency record
COMMIT or ROLLBACK
```

If any step fails, entire transaction rolls back. No partial orders.

### 5. Cache-Aside Pattern for Products

**Flow:**
1. Request arrives
2. Check Redis cache
3. If hit: return cached product
4. If miss: query PostgreSQL, cache result, return
5. On product update: invalidate cache

**Benefit:** Dramatically reduces database load for popular products

## 🔒 Security Considerations

### Implemented
- ✅ Helmet for HTTP headers
- ✅ CORS for cross-origin requests
- ✅ Input validation on all endpoints
- ✅ Parameterized queries (TypeORM prevents SQL injection)
- ✅ UUID validation
- ✅ Ownership verification (user can only access their own orders)
- ✅ No sensitive data in logs

### Simplified for Assessment
⚠️ **Authentication**: Bearer token with userId (not JWT)
- In production: Implement full JWT with secret signing
- In production: Add password hashing, refresh tokens, session management
- In production: Implement API key management for third parties

## 📊 Scalability to 10,000 RPS

### Horizontal Scaling
```
N Instances
  ├─ Load Balancer
  ├─ Node.js API (stateless)
  ├─ Connection Pool to PostgreSQL
  └─ Redis Cluster
```

### Performance Optimizations
1. **Connection Pooling**: 20 connections per API instance
2. **Redis Pipelining**: Batch operations where possible
3. **Database Indexes**: On userId, productId, SKU, status
4. **Read Replicas**: PostgreSQL can route reads to replicas
5. **Redis Cluster**: Horizontal sharding of stock counters
6. **API Gateway**: Rate limiting, request batching
7. **Caching**: Redis for products, reservations, idempotency

### Metrics to Monitor
- API response times
- Redis command latency
- Database connection pool utilization
- Reservation expiry success rate
- Order success rate
- Stock accuracy (database vs Redis)

## 🐛 Troubleshooting

### Stock appears to be oversold

**Symptoms:** Database shows more orders than stock

**Causes:**
1. ✅ Redis stock not initialized - Fixed by running seed
2. ✅ Stale Redis keys - Fixed by expiry worker
3. ✅ Application bug - Check logs for errors during reservation

**Debug Steps:**
```bash
# Check Redis stock for a product
redis-cli GET flashkart:stock:{productId}

# Check PostgreSQL stock
psql -d flashkart -c "SELECT id, stock FROM products WHERE id='...';"

# Check active orders
psql -d flashkart -c "SELECT COUNT(*) FROM order_items;"
```

### Reservations not expiring

**Symptoms:** Cart items remain reserved after 5 minutes

**Causes:**
1. Worker not running - Check logs for `[ReservationExpiryWorker]`
2. Redis connection failed - Check Redis logs
3. Database connection failed - Check PostgreSQL logs

**Solution:**
```bash
# Check worker status in logs
docker logs flashkart-api | grep ReservationExpiryWorker

# Manually trigger cleanup
npm run test:expiry  # (not yet implemented)
```

### Duplicate orders being created

**Symptoms:** Same Idempotency-Key creates multiple orders

**Causes:**
1. ✅ Idempotency-Key header missing - Required for checkout
2. ✅ Redis cache down - PostgreSQL constraint should protect
3. ✅ App bug - Check transaction logic

**Solution:**
- Always include `Idempotency-Key` header
- Check database unique constraint exists
- Review transaction logs

## 📚 Further Reading

See [docs/architecture.md](docs/architecture.md) for:
- Detailed architecture diagram
- Failure scenarios and recovery
- Database schema design
- API response codes
- Overselling prevention strategies
- Distributed system trade-offs

## 📦 Project Structure

```
flashkart-backend/
├── src/
│   ├── config/          # Database, Redis, Environment
│   ├── entities/        # TypeORM entities
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic
│   ├── repositories/    # Database queries (via TypeORM)
│   ├── routes/          # Express routes
│   ├── middleware/      # Auth, validation, error handling
│   ├── dto/             # Data transfer objects
│   ├── utils/           # Error classes, helpers
│   ├── constants/       # Redis keys, error codes, HTTP status
│   ├── redis/scripts/   # Lua scripts
│   ├── workers/         # Background workers
│   ├── seeds/           # Database seeding
│   ├── tests/           # Integration tests
│   ├── app.ts           # Express app factory
│   └── server.ts        # Server entry point
│
├── migrations/          # TypeORM database migrations
├── docs/                # Architecture documentation
├── docker-compose.yml   # Local development stack
├── Dockerfile           # Production image
├── package.json
├── tsconfig.json
├── .env.example
└── README.md (this file)
```

## 🔧 Development Scripts

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run development server with auto-reload
npm run dev

# Start production server
npm start

# Database migrations
npm run migration:generate  # Generate migration from entity changes
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration

# Seed test data
npm run seed

# Run tests
npm run test:concurrency   # Test concurrent reservations
npm run test:checkout      # Test idempotent checkout
```


