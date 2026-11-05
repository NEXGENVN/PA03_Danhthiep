-- INFERRED LOCAL-ANALYSIS SCHEMA. THIS IS NOT AN ORIGINAL DATABASE DUMP.
-- Apply AFTER analysis/main-schema-inferred.sql, only to the synthetic local DB.
-- Derived from statically decoded ZL_SERVER controllers and FILES_SERVER SQL.
-- Types, defaults, indexes, and relationships are guesses. Original DDL is absent.
-- No real accounts, Zalo session cookies, tokens, provider calls, or seed rows.
-- MariaDB 11.4 syntax; ADD COLUMN IF NOT EXISTS is not portable to all MySQL versions.

-- MAIN's minimal shared tables omit these columns read/written by the worker.
ALTER TABLE zalo_account
    ADD COLUMN IF NOT EXISTS IMEI VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS ENCRYPTION_KEY TEXT NULL,
    ADD COLUMN IF NOT EXISTS COOKIE_ZPW_SEK TEXT NULL;

ALTER TABLE auto_request
    ADD COLUMN IF NOT EXISTS Avatar TEXT NULL;

CREATE TABLE IF NOT EXISTS user_link_zalo_account (
    linkID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    userID INT UNSIGNED NOT NULL,
    UID VARCHAR(100) NOT NULL,
    PRIMARY KEY (userID, UID),
    KEY ix_ulza_uid (UID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- getZaloAccount explicitly selects linkID; permit rerunning this inferred file.
ALTER TABLE user_link_zalo_account
    ADD COLUMN IF NOT EXISTS linkID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE;

-- OA controller uses one global latest token record, without user ownership.
CREATE TABLE IF NOT EXISTS zalo_token (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    expires_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS zalo_template (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    template_id VARCHAR(100) NOT NULL,
    detail TEXT NULL,
    params TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY ix_template_provider_id (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS oa_result (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(100) NOT NULL,
    phone_number VARCHAR(100) NULL,
    template_id TEXT NULL,
    msg_id VARCHAR(255) NULL,
    result VARCHAR(100) NULL,
    detail LONGTEXT NULL,
    msg_status TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY ix_oa_order_code (order_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Link Tool schema is absent. Only these columns are evidenced by FILES_SERVER.
CREATE TABLE IF NOT EXISTS link_results_thumbnail (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    link_id VARCHAR(100) NOT NULL,
    results LONGTEXT NULL,
    KEY ix_link_thumbnail_link (link_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dormant ZL facebookToolsRoutes references these linking tables. FB_SERVER is
-- absent and that router is not mounted by zl_server.js; no provider data seeded.
CREATE TABLE IF NOT EXISTS user_link_fb_account (
    userID INT UNSIGNED NOT NULL,
    fb_userID VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userID, fb_userID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_link_fb_post_scraped (
    userID INT UNSIGNED NOT NULL,
    requestID VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userID, requestID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
