package com.novacart.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Running database migration checks for NovaCart production tables...");

        // 1. Ensure 'return_requests' table exists
        executeSafe("""
            CREATE TABLE IF NOT EXISTS return_requests (
                id BIGSERIAL PRIMARY KEY,
                order_id BIGINT NOT NULL,
                order_item_id BIGINT,
                type VARCHAR(50) DEFAULT 'RETURN',
                reason VARCHAR(1000),
                note VARCHAR(2000),
                admin_comment VARCHAR(1000),
                status VARCHAR(50) DEFAULT 'RETURN_REQUESTED',
                refund_status VARCHAR(50) DEFAULT 'PENDING',
                refund_amount NUMERIC(12, 2),
                refund_transaction_id VARCHAR(255),
                refund_payment_method VARCHAR(50),
                refunded_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP
            );
        """, "Create return_requests table");

        // Ensure all columns exist in return_requests
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS order_id BIGINT;", "return_requests.order_id");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS order_item_id BIGINT;", "return_requests.order_item_id");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'RETURN';", "return_requests.type");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS reason VARCHAR(1000);", "return_requests.reason");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS note VARCHAR(2000);", "return_requests.note");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS admin_comment VARCHAR(1000);", "return_requests.admin_comment");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'RETURN_REQUESTED';", "return_requests.status");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) DEFAULT 'PENDING';", "return_requests.refund_status");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12, 2);", "return_requests.refund_amount");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS refund_transaction_id VARCHAR(255);", "return_requests.refund_transaction_id");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS refund_payment_method VARCHAR(50);", "return_requests.refund_payment_method");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;", "return_requests.refunded_at");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();", "return_requests.created_at");
        executeSafe("ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;", "return_requests.updated_at");

        // 2. Ensure 'notifications' table exists
        executeSafe("""
            CREATE TABLE IF NOT EXISTS notifications (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message VARCHAR(1000),
                type VARCHAR(50) DEFAULT 'SYSTEM',
                link VARCHAR(255),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        """, "Create notifications table");

        executeSafe("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id BIGINT;", "notifications.user_id");
        executeSafe("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);", "notifications.title");
        executeSafe("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message VARCHAR(1000);", "notifications.message");
        executeSafe("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'SYSTEM';", "notifications.type");
        executeSafe("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(255);", "notifications.link");
        executeSafe("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;", "notifications.is_read");
        executeSafe("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();", "notifications.created_at");

        // 3. Ensure 'coupons' table exists
        executeSafe("""
            CREATE TABLE IF NOT EXISTS coupons (
                id BIGSERIAL PRIMARY KEY,
                code VARCHAR(100) NOT NULL UNIQUE,
                discount_type VARCHAR(50) DEFAULT 'PERCENTAGE',
                discount_value NUMERIC(12, 2),
                discount_percent NUMERIC(5, 2),
                min_order_value NUMERIC(12, 2),
                max_discount_amount NUMERIC(12, 2),
                expiry_date TIMESTAMP,
                usage_limit INT,
                used_count INT DEFAULT 0,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP
            );
        """, "Create coupons table");

        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS code VARCHAR(100);", "coupons.code");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) DEFAULT 'PERCENTAGE';", "coupons.discount_type");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12, 2);", "coupons.discount_value");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2);", "coupons.discount_percent");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order_value NUMERIC(12, 2);", "coupons.min_order_value");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC(12, 2);", "coupons.max_discount_amount");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP;", "coupons.expiry_date");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_limit INT;", "coupons.usage_limit");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_count INT DEFAULT 0;", "coupons.used_count");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;", "coupons.active");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();", "coupons.created_at");
        executeSafe("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;", "coupons.updated_at");

        // 4. Safe nullable adjustments if old tables had strict NOT NULL
        executeSafe("ALTER TABLE coupons ALTER COLUMN expiry_date DROP NOT NULL;", "coupons.expiry_date DROP NOT NULL");
        executeSafe("ALTER TABLE coupons ALTER COLUMN discount_type DROP NOT NULL;", "coupons.discount_type DROP NOT NULL");
        executeSafe("ALTER TABLE coupons ALTER COLUMN used_count DROP NOT NULL;", "coupons.used_count DROP NOT NULL");

        log.info("Database migration checks completed successfully.");
    }

    private void executeSafe(String sql, String description) {
        try {
            jdbcTemplate.execute(sql);
            log.debug("Executed DB check: {}", description);
        } catch (Exception e) {
            log.warn("Notice for DB check '{}': {}", description, e.getMessage());
        }
    }
}
