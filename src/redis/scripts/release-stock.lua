-- release-stock.lua
-- Atomically release stock for an expired reservation
-- Arguments:
-- KEYS[1]: stock key (e.g., flashkart:stock:product-id)
-- KEYS[2]: reservation key (e.g., flashkart:reservation:reservation-id)
-- ARGV[1]: quantity to release
--
-- Returns:
-- 1 on success
-- -1 if reservation doesn't exist (already released)
-- -2 if stock key doesn't exist

local stockKey = KEYS[1]
local reservationKey = KEYS[2]
local quantity = tonumber(ARGV[1])

-- Check if reservation exists
local reservation = redis.call('get', reservationKey)
if not reservation then
  return -1 -- Reservation doesn't exist (already released)
end

-- Get current stock
local currentStock = redis.call('get', stockKey)
if not currentStock then
  return -2 -- Stock key doesn't exist
end

-- Atomically increment stock and delete reservation
redis.call('incrby', stockKey, quantity)
redis.call('del', reservationKey)

-- Remove from expiry sorted set
redis.call('zrem', 'flashkart:reservations:expiry', reservationKey)

return 1
