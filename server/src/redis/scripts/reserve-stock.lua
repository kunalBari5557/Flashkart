-- reserve-stock.lua
-- Atomically reserve stock for a product
-- Arguments:
-- KEYS[1]: stock key (e.g., flashkart:stock:product-id)
-- KEYS[2]: reservation key (e.g., flashkart:reservation:reservation-id)
-- ARGV[1]: quantity requested
-- ARGV[2]: TTL in seconds
-- ARGV[3]: reservation data (JSON)
--
-- Returns:
-- 1 on success
-- -1 if stock is insufficient
-- -2 if stock key doesn't exist

local stockKey = KEYS[1]
local reservationKey = KEYS[2]
local quantity = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local reservationData = ARGV[3]

-- Check if reservation already exists
local existingReservation = redis.call('get', reservationKey)
if existingReservation then
  return -3 -- Reservation already exists
end

-- Get current stock
local currentStock = redis.call('get', stockKey)
if not currentStock then
  return -2 -- Stock key doesn't exist
end

currentStock = tonumber(currentStock)

-- Validate sufficient stock
if currentStock < quantity then
  return -1 -- Insufficient stock
end

-- Atomically decrement stock and create reservation
redis.call('decrby', stockKey, quantity)
redis.call('setex', reservationKey, ttl, reservationData)

-- Add to expiry sorted set for cleanup
local expiryTime = redis.call('time')
local timestamp = tonumber(expiryTime[1]) + ttl
redis.call('zadd', 'flashkart:reservations:expiry', timestamp, reservationKey)

return 1
