-- =============================================================
-- NovaCart Demo Data Reset Script
-- Safe reset: clears orders/customers/activity only.
-- Keeps: Admin, Sellers, Products, Categories, Inventory.
-- =============================================================

BEGIN;

-- -----------------------------------------------------------
-- 1. Clear transactional / activity tables (FK order matters)
-- -----------------------------------------------------------

-- Return requests (depend on orders)
DELETE FROM return_requests;

-- Deliveries (depend on orders)
DELETE FROM deliveries;

-- Payments (depend on orders)
DELETE FROM payments;

-- Order items (depend on orders + products)
DELETE FROM order_items;

-- Orders (depend on users + addresses)
DELETE FROM orders;

-- Notifications
DELETE FROM notifications;

-- Wishlist items (depend on wishlists)
DELETE FROM wishlist_items;

-- Wishlists (depend on users)
DELETE FROM wishlists;

-- Cart items (depend on carts)
DELETE FROM cart_items;

-- Carts (depend on users)
DELETE FROM carts;

-- Addresses (depend on users)
DELETE FROM addresses;

-- -----------------------------------------------------------
-- 2. Delete test/demo customer users (IDs 6 and above)
--    Keep: ID 1 = Admin, IDs 2-5 = Sellers
-- -----------------------------------------------------------
DELETE FROM user_roles WHERE user_id >= 6;
DELETE FROM users WHERE id >= 6;

-- -----------------------------------------------------------
-- 3. Reset identity sequences for transactional tables
--    so IDs restart from 1 for a clean-looking slate
-- -----------------------------------------------------------
ALTER TABLE orders ALTER COLUMN id RESTART WITH 1;
ALTER TABLE order_items ALTER COLUMN id RESTART WITH 1;
ALTER TABLE payments ALTER COLUMN id RESTART WITH 1;
ALTER TABLE deliveries ALTER COLUMN id RESTART WITH 1;
ALTER TABLE return_requests ALTER COLUMN id RESTART WITH 1;
ALTER TABLE notifications ALTER COLUMN id RESTART WITH 1;
ALTER TABLE wishlists ALTER COLUMN id RESTART WITH 1;
ALTER TABLE wishlist_items ALTER COLUMN id RESTART WITH 1;
ALTER TABLE carts ALTER COLUMN id RESTART WITH 1;
ALTER TABLE cart_items ALTER COLUMN id RESTART WITH 1;
ALTER TABLE addresses ALTER COLUMN id RESTART WITH 1;

-- Reset users sequence so new customers get clean IDs (after 5)
ALTER TABLE users ALTER COLUMN id RESTART WITH 6;

-- -----------------------------------------------------------
-- 4. Verification counts after reset
-- -----------------------------------------------------------
SELECT 'users'           AS table_name, COUNT(*) AS remaining FROM users
UNION ALL SELECT 'user_roles',   COUNT(*) FROM user_roles
UNION ALL SELECT 'sellers',      COUNT(*) FROM sellers
UNION ALL SELECT 'products',     COUNT(*) FROM products
UNION ALL SELECT 'categories',   COUNT(*) FROM categories
UNION ALL SELECT 'inventory',    COUNT(*) FROM inventory
UNION ALL SELECT 'orders',       COUNT(*) FROM orders
UNION ALL SELECT 'order_items',  COUNT(*) FROM order_items
UNION ALL SELECT 'payments',     COUNT(*) FROM payments
UNION ALL SELECT 'addresses',    COUNT(*) FROM addresses
UNION ALL SELECT 'carts',        COUNT(*) FROM carts
UNION ALL SELECT 'notifications',COUNT(*) FROM notifications
ORDER BY table_name;

COMMIT;
