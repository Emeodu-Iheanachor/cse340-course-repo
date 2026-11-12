-- ============================================================
-- SERVICE NETWORK
-- ACTIVITY LOGGING SYSTEM
-- POSTGRESQL DATABASE SETUP
-- ============================================================


-- ============================================================
-- 1. CREATE ACTIVITY LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (

    activity_id BIGSERIAL PRIMARY KEY,

    user_id INTEGER,

    action VARCHAR(100) NOT NULL,

    description TEXT,

    ip_address VARCHAR(45),

    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_activity_logs_action
        CHECK (LENGTH(TRIM(action)) > 0)

);


-- ============================================================
-- 2. CREATE ACTIVITY LOGGING INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
    ON activity_logs (user_id);


CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
    ON activity_logs (created_at DESC);


CREATE INDEX IF NOT EXISTS idx_activity_logs_action
    ON activity_logs (action);


