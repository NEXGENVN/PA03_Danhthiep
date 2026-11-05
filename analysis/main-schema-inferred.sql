-- INFERRED LOCAL-ANALYSIS SCHEMA, NOT AN ORIGINAL DATABASE DUMP.
-- Reconstructed only from MAIN_SERVER SQL. Types, defaults, keys, indexes,
-- relationships and views are assumptions for synthetic local verification.
-- Do not import into a real application database as a migration.
-- ZL_SERVER may require more columns and different constraints.
-- No database creation, no real accounts, no provider credentials, no seed data.

CREATE TABLE IF NOT EXISTS `user` (
    userID INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userName VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    userRole TINYINT NOT NULL DEFAULT 2,
    totalMoney DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    lastLogin DATETIME NULL,
    lastIP VARCHAR(64) NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_name (userName),
    UNIQUE KEY uq_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS captcha_sessions (
    captchaID CHAR(36) NOT NULL PRIMARY KEY,
    captchaText CHAR(64) NOT NULL,
    ipAddress VARCHAR(64) NOT NULL,
    purpose VARCHAR(24) NOT NULL,
    isUsed TINYINT(1) NOT NULL DEFAULT 0,
    expiresAt DATETIME NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY ix_captcha_expiry (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
    attemptID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ipAddress VARCHAR(64) NOT NULL,
    userName VARCHAR(100) NULL,
    attemptType VARCHAR(24) NOT NULL,
    isSuccess TINYINT(1) NOT NULL DEFAULT 0,
    attemptTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY ix_attempt_ip_type_time (ipAddress, attemptType, attemptTime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ip_blocks (
    blockID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ipAddress VARCHAR(64) NOT NULL,
    blockType VARCHAR(24) NOT NULL DEFAULT 'both',
    reason TEXT NULL,
    failedAttempts INT NOT NULL DEFAULT 0,
    blockedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    KEY ix_ip_block_active (ipAddress, isActive, expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_logs (
    log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(64) NULL,
    user_agent TEXT NULL,
    request_method VARCHAR(12) NULL,
    request_path TEXT NULL,
    request_query LONGTEXT NULL,
    userID INT UNSIGNED NULL,
    userName VARCHAR(100) NULL,
    request_body LONGTEXT NULL,
    response_status SMALLINT NULL,
    response_time BIGINT NULL,
    event_type VARCHAR(100) NULL,
    event_category VARCHAR(50) NULL,
    event_description TEXT NULL,
    error_message TEXT NULL,
    session_id VARCHAR(255) NULL,
    csrf_token_valid TINYINT(1) NULL,
    rate_limit_hit TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY ix_log_user_date (userID, created_at),
    KEY ix_log_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exact original view definitions are absent; these are compatibility guesses.
CREATE OR REPLACE VIEW v_api_logs_with_user AS
SELECT al.*, u.email AS user_email, u.userRole AS user_role
FROM api_logs al LEFT JOIN `user` u ON al.userID = u.userID;

CREATE OR REPLACE VIEW v_security_alerts AS
SELECT al.*,
       CASE WHEN al.rate_limit_hit = 1 THEN 'RATE_LIMIT'
            WHEN al.response_status IN (401,403) THEN 'AUTH'
            WHEN al.response_status >= 500 THEN 'SERVER_ERROR'
            ELSE 'CLIENT_ERROR' END AS alert_type
FROM api_logs al
WHERE al.response_status >= 400 OR al.rate_limit_hit = 1;

CREATE TABLE IF NOT EXISTS tool_setup (
    STT INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uid_zalo_system VARCHAR(100) NULL,
    zalo_system_money DECIMAL(15,2) NOT NULL DEFAULT 30000.00,
    zalo_custom_money DECIMAL(15,2) NOT NULL DEFAULT 20000.00,
    check_phone_system_money DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
    check_phone_custom_money DECIMAL(15,2) NOT NULL DEFAULT 5000.00,
    check_card_money DECIMAL(15,2) NOT NULL DEFAULT 5000.00,
    check_data_leak_money DECIMAL(15,2) NOT NULL DEFAULT 5000.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product (
    productID INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    productName VARCHAR(255) NOT NULL,
    productDesc TEXT NOT NULL,
    productOnePrice DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    productFivePrice DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    productTenPrice DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    productImage TEXT NULL,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS license (
    licenseID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    licenseKey VARCHAR(255) NOT NULL PRIMARY KEY,
    productID INT UNSIGNED NOT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    countDown INT NOT NULL DEFAULT 0,
    activeTime DATETIME NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- These two columns occur only in inconsistent getProductStats SQL.
    -- They do not synchronize themselves with status or user_link_license.
    isActivated TINYINT(1) NOT NULL DEFAULT 0,
    pricePaid DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    UNIQUE KEY uq_license_id (licenseID),
    KEY ix_license_product (productID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_link_license (
    userID INT UNSIGNED NOT NULL,
    licenseKey VARCHAR(255) NOT NULL,
    pricePaid DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    purchaseTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userID, licenseKey),
    KEY ix_ull_license (licenseKey)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MAIN_SERVER only reads these shared domain tables.
CREATE TABLE IF NOT EXISTS zalo_account (
    UID VARCHAR(100) NOT NULL PRIMARY KEY,
    displayName VARCHAR(255) NULL,
    phoneNumber VARCHAR(64) NULL,
    Avatar TEXT NULL,
    accStatus VARCHAR(100) NULL,
    ImportTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auto_request (
    reqID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    phoneNumber VARCHAR(64) NULL,
    UID VARCHAR(100) NULL,
    displayName VARCHAR(255) NULL,
    imageUrl TEXT NULL,
    sendResult VARCHAR(100) NULL,
    Detail TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fee_charged DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    use_system_account TINYINT(1) NOT NULL DEFAULT 0,
    sender_zalo_uid VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_link_auto_request (
    userID INT UNSIGNED NOT NULL,
    reqID BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (userID, reqID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Unlike the preceding tables, this DDL is directly present in database.js.
CREATE TABLE IF NOT EXISTS fb_setup (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_scan_price DECIMAL(15,2) DEFAULT 0.00,
    member_scan_price DECIMAL(15,2) DEFAULT 0.00,
    post_scan_price DECIMAL(15,2) DEFAULT 0.00,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
