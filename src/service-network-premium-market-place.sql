/*
===============================================================================
SERVICE NETWORK - PREMIUM MARKETPLACE DATABASE MIGRATION
Version: 1.1 | PostgreSQL | Reviewed migration

Adds marketplace tables to the existing Service Network database.
Preserves existing users, roles, organization, service_project, category,
authentication/session tables, and activity_logs. The marketplace's
service_categories table is separate from the existing project categories.

IMPORTANT:
- Back up the database before running this migration.
- This is a one-time migration; preflight checks stop if target tables already exist.
- Back up the database and run the entire script in one Query Tool execution.
- This script assumes the previously inspected existing keys:
  users(user_id), organization(organization_id), service_project(project_id).
===============================================================================
*/

BEGIN;


/* 0. PREFLIGHT VALIDATION
   Stop before changing the database if the expected parent tables/keys are
   missing, or if any marketplace table already exists. This is a one-time
   migration; do not use it as a repair script or rerun after success. */

DO $preflight$
DECLARE
    v_table TEXT;
BEGIN
    IF to_regclass('public.users') IS NULL
       OR to_regclass('public.organization') IS NULL
       OR to_regclass('public.service_project') IS NULL THEN
        RAISE EXCEPTION
            'Migration stopped: expected parent table users, organization, or service_project is missing from schema public.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = rel.relnamespace
        JOIN pg_attribute att
          ON att.attrelid = rel.oid
         AND att.attnum = con.conkey[1]
        WHERE ns.nspname = 'public'
          AND rel.relname = 'users'
          AND con.contype = 'p'
          AND array_length(con.conkey, 1) = 1
          AND att.attname = 'user_id'
          AND format_type(att.atttypid, att.atttypmod) = 'integer'
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: public.users(user_id) is not an INTEGER primary key.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = rel.relnamespace
        JOIN pg_attribute att
          ON att.attrelid = rel.oid
         AND att.attnum = con.conkey[1]
        WHERE ns.nspname = 'public'
          AND rel.relname = 'organization'
          AND con.contype = 'p'
          AND array_length(con.conkey, 1) = 1
          AND att.attname = 'organization_id'
          AND format_type(att.atttypid, att.atttypmod) = 'integer'
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: public.organization(organization_id) is not an INTEGER primary key.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace ns ON ns.oid = rel.relnamespace
        JOIN pg_attribute att
          ON att.attrelid = rel.oid
         AND att.attnum = con.conkey[1]
        WHERE ns.nspname = 'public'
          AND rel.relname = 'service_project'
          AND con.contype = 'p'
          AND array_length(con.conkey, 1) = 1
          AND att.attname = 'project_id'
          AND format_type(att.atttypid, att.atttypmod) = 'integer'
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: public.service_project(project_id) is not an INTEGER primary key.';
    END IF;

    FOREACH v_table IN ARRAY ARRAY[
        'service_categories',
        'user_services',
        'user_contact_methods',
        'notification_preferences',
        'premium_plans',
        'premium_memberships',
        'advertisement_campaigns',
        'advertisements',
        'advertisement_analytics',
        'service_requests',
        'service_matches',
        'notification_logs'
    ]
    LOOP
        IF to_regclass(format('public.%I', v_table)) IS NOT NULL THEN
            RAISE EXCEPTION
                'Migration stopped: public.% already exists. Inspect its structure; CREATE TABLE IF NOT EXISTS will not repair it.',
                v_table;
        END IF;
    END LOOP;

    IF to_regprocedure('public.service_network_marketplace_validate_match()') IS NOT NULL
       OR to_regprocedure('public.service_network_marketplace_set_updated_at()') IS NOT NULL THEN
        RAISE EXCEPTION
            'Migration stopped: a marketplace migration helper function already exists. Inspect it before proceeding.';
    END IF;
END;
$preflight$;



/* 1. PROFESSIONAL SERVICE CATEGORIES */

CREATE TABLE IF NOT EXISTS service_categories (
    service_category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(120) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_service_categories_name UNIQUE (category_name),
    CONSTRAINT uq_service_categories_slug UNIQUE (slug),
    CONSTRAINT chk_service_categories_name
        CHECK (length(btrim(category_name)) > 0),
    CONSTRAINT chk_service_categories_slug
        CHECK (length(btrim(slug)) > 0)
);


/* 2. REGISTERED USER SERVICES */

CREATE TABLE IF NOT EXISTS user_services (
    user_service_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    service_category_id INTEGER NOT NULL,
    organization_id INTEGER,
    service_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(200),
    service_area VARCHAR(250),
    availability_status VARCHAR(30) NOT NULL DEFAULT 'available',
    approval_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_services_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_services_category
        FOREIGN KEY (service_category_id)
        REFERENCES service_categories(service_category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_services_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization(organization_id) ON DELETE SET NULL,
    CONSTRAINT chk_user_service_name
        CHECK (length(btrim(service_name)) > 0),
    CONSTRAINT chk_user_service_description
        CHECK (length(btrim(description)) > 0),
    CONSTRAINT chk_user_service_availability
        CHECK (availability_status IN ('available', 'unavailable', 'busy')),
    CONSTRAINT chk_user_service_approval
        CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended'))
);


/* 3. VERIFIED CONTACT METHODS */

CREATE TABLE IF NOT EXISTS user_contact_methods (
    contact_method_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    contact_type VARCHAR(20) NOT NULL,
    contact_value VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contact_methods_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_contact_type
        CHECK (contact_type IN ('email', 'mobile')),
    CONSTRAINT chk_contact_value
        CHECK (length(btrim(contact_value)) > 0),
    CONSTRAINT chk_verified_contact_timestamp
        CHECK (
            (is_verified = FALSE AND verified_at IS NULL)
            OR
            (is_verified = TRUE AND verified_at IS NOT NULL)
        )
);

/*
A normalized contact value must be unique per user and contact type.
This permits a shared family mobile number to be associated with different
users, while preventing duplicate entries for one user.
*/
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_contact_value_per_user
ON user_contact_methods (user_id, contact_type, lower(btrim(contact_value)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_contact_per_type
ON user_contact_methods (user_id, contact_type)
WHERE is_primary = TRUE;


/* 4. NOTIFICATION PREFERENCES */

CREATE TABLE IF NOT EXISTS notification_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    notification_type VARCHAR(40) NOT NULL DEFAULT 'service_alerts',
    channel VARCHAR(20) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_preferences_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_notification_preference_type
        CHECK (length(btrim(notification_type)) > 0),
    CONSTRAINT chk_notification_channel
        CHECK (channel IN ('email', 'sms')),
    CONSTRAINT uq_user_notification_preference
        UNIQUE (user_id, notification_type, channel)
);


/* 5. PREMIUM PLANS
   Monetary amounts use minor currency units: NGN 5,000.00 = 500000 kobo. */

CREATE TABLE IF NOT EXISTS premium_plans (
    premium_plan_id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    billing_interval VARCHAR(20) NOT NULL,
    amount_minor BIGINT NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'NGN',
    duration_days INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_premium_plans_name UNIQUE (plan_name),
    CONSTRAINT chk_premium_plan_name
        CHECK (length(btrim(plan_name)) > 0),
    CONSTRAINT chk_plan_billing_interval
        CHECK (billing_interval IN ('monthly', 'annual', 'custom')),
    CONSTRAINT chk_plan_amount CHECK (amount_minor >= 0),
    CONSTRAINT chk_plan_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_plan_duration CHECK (duration_days > 0)
);


/* 6. PREMIUM MEMBERSHIPS */

CREATE TABLE IF NOT EXISTS premium_memberships (
    membership_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    premium_plan_id INTEGER NOT NULL,
    membership_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_membership_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_membership_plan
        FOREIGN KEY (premium_plan_id)
        REFERENCES premium_plans(premium_plan_id) ON DELETE RESTRICT,
    CONSTRAINT chk_membership_status
        CHECK (
            membership_status IN
            ('pending', 'active', 'expired', 'cancelled', 'suspended')
        ),
    CONSTRAINT chk_membership_dates
        CHECK (
            expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at
        ),
    CONSTRAINT chk_active_membership_dates
        CHECK (
            membership_status <> 'active'
            OR (starts_at IS NOT NULL AND expires_at IS NOT NULL)
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_membership_per_user
ON premium_memberships(user_id)
WHERE membership_status = 'active';

CREATE INDEX IF NOT EXISTS idx_memberships_plan
    ON premium_memberships(premium_plan_id);


/* 7. ADVERTISEMENT CAMPAIGNS
   Admin/authorized-user permissions must be enforced by application routes. */

CREATE TABLE IF NOT EXISTS advertisement_campaigns (
    campaign_id SERIAL PRIMARY KEY,
    created_by INTEGER NOT NULL,
    campaign_name VARCHAR(150) NOT NULL,
    description TEXT,
    campaign_status VARCHAR(30) NOT NULL DEFAULT 'draft',
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_campaign_creator
        FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_campaign_name
        CHECK (length(btrim(campaign_name)) > 0),
    CONSTRAINT chk_campaign_status
        CHECK (
            campaign_status IN
            ('draft', 'pending', 'approved', 'active', 'paused', 'completed', 'rejected')
        ),
    CONSTRAINT chk_campaign_dates
        CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);


/* 8. ADVERTISEMENTS
   Exactly one source is required. RESTRICT preserves source/ad history. */

CREATE TABLE IF NOT EXISTS advertisements (
    advertisement_id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    created_by INTEGER NOT NULL,
    user_service_id INTEGER,
    project_id INTEGER,
    advertisement_title VARCHAR(180) NOT NULL,
    advertisement_description TEXT NOT NULL,
    advertisement_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
    display_priority INTEGER NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_advertisement_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES advertisement_campaigns(campaign_id) ON DELETE SET NULL,
    CONSTRAINT fk_advertisement_creator
        FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_advertisement_service
        FOREIGN KEY (user_service_id)
        REFERENCES user_services(user_service_id) ON DELETE RESTRICT,
    CONSTRAINT fk_advertisement_project
        FOREIGN KEY (project_id)
        REFERENCES service_project(project_id) ON DELETE RESTRICT,
    CONSTRAINT chk_advertisement_source
        CHECK (
            (user_service_id IS NOT NULL AND project_id IS NULL)
            OR
            (user_service_id IS NULL AND project_id IS NOT NULL)
        ),
    CONSTRAINT chk_advertisement_title
        CHECK (length(btrim(advertisement_title)) > 0),
    CONSTRAINT chk_advertisement_description
        CHECK (length(btrim(advertisement_description)) > 0),
    CONSTRAINT chk_advertisement_status
        CHECK (
            advertisement_status IN
            ('pending', 'approved', 'rejected', 'active', 'paused', 'expired')
        ),
    CONSTRAINT chk_advertisement_priority CHECK (display_priority >= 0),
    CONSTRAINT chk_advertisement_dates
        CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at)
);


/* 9. ADVERTISEMENT ANALYTICS */

CREATE TABLE IF NOT EXISTS advertisement_analytics (
    analytics_id BIGSERIAL PRIMARY KEY,
    advertisement_id INTEGER NOT NULL,
    user_id INTEGER,
    event_type VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_analytics_advertisement
        FOREIGN KEY (advertisement_id)
        REFERENCES advertisements(advertisement_id) ON DELETE RESTRICT,
    CONSTRAINT fk_analytics_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_advertisement_event
        CHECK (event_type IN ('impression', 'click', 'enquiry'))
);


/* 10. CUSTOMER SERVICE REQUESTS */

CREATE TABLE IF NOT EXISTS service_requests (
    request_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    service_category_id INTEGER NOT NULL,
    request_title VARCHAR(180) NOT NULL,
    request_description TEXT NOT NULL,
    location VARCHAR(200),
    request_status VARCHAR(30) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_service_request_customer
        FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_service_request_category
        FOREIGN KEY (service_category_id)
        REFERENCES service_categories(service_category_id) ON DELETE RESTRICT,
    CONSTRAINT chk_service_request_title
        CHECK (length(btrim(request_title)) > 0),
    CONSTRAINT chk_service_request_description
        CHECK (length(btrim(request_description)) > 0),
    CONSTRAINT chk_service_request_status
        CHECK (
            request_status IN
            ('open', 'matched', 'in_progress', 'completed', 'cancelled', 'closed')
        )
);


/* 11. SERVICE PROVIDER MATCHES
   Trigger enforces same category, no self-match, and provider eligibility. */

CREATE TABLE IF NOT EXISTS service_matches (
    match_id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL,
    user_service_id INTEGER NOT NULL,
    match_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    matched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMPTZ,

    CONSTRAINT fk_match_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(request_id) ON DELETE RESTRICT,
    CONSTRAINT fk_match_service
        FOREIGN KEY (user_service_id)
        REFERENCES user_services(user_service_id) ON DELETE RESTRICT,
    CONSTRAINT uq_request_service_match UNIQUE (request_id, user_service_id),
    CONSTRAINT chk_service_match_status
        CHECK (
            match_status IN
            ('pending', 'notified', 'accepted', 'declined', 'completed', 'cancelled')
        ),
    CONSTRAINT chk_match_response_timestamp
        CHECK (responded_at IS NULL OR responded_at >= matched_at)
);


/* =========================================================
   SERVICE NETWORK
   MARKETPLACE SERVICE MATCH VALIDATION

   Purpose:
   1. Confirm that the service request exists.
   2. Confirm that the provider service exists.
   3. Prevent customers from matching their own services.
   4. Ensure request and provider categories match.
   5. Allow only approved, available, active services.
   6. Reject NULL approval and availability statuses.

   Trigger:
   BEFORE INSERT OR UPDATE OF request_id, user_service_id
   ON service_matches
========================================================= */


/* =========================================================
   1. CREATE OR REPLACE MATCH VALIDATION FUNCTION
========================================================= */

CREATE OR REPLACE FUNCTION public.service_network_marketplace_validate_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_id INTEGER;
    v_request_category_id INTEGER;
    v_provider_id INTEGER;
    v_service_category_id INTEGER;
    v_approval_status VARCHAR(30);
    v_availability_status VARCHAR(30);
    v_is_active BOOLEAN;
BEGIN

    /* Retrieve request and provider service details. */
    SELECT
        sr.customer_id,
        sr.service_category_id,
        us.user_id,
        us.service_category_id,
        us.approval_status,
        us.availability_status,
        us.is_active
    INTO
        v_customer_id,
        v_request_category_id,
        v_provider_id,
        v_service_category_id,
        v_approval_status,
        v_availability_status,
        v_is_active
    FROM public.service_requests AS sr
    CROSS JOIN public.user_services AS us
    WHERE sr.request_id = NEW.request_id
      AND us.user_service_id = NEW.user_service_id;


    /* Ensure both records exist. */
    IF NOT FOUND THEN
        RAISE EXCEPTION
            'The service request or registered service does not exist.';
    END IF;


    /* Prevent customers from matching their own services. */
    IF v_customer_id = v_provider_id THEN
        RAISE EXCEPTION
            'A customer cannot be matched to their own service.';
    END IF;


    /* Ensure the requested and offered service categories match. */
    IF v_request_category_id <> v_service_category_id THEN
        RAISE EXCEPTION
            'The request and provider service categories must match.';
    END IF;


    /* Validate provider service eligibility. */
    IF v_approval_status IS DISTINCT FROM 'approved'
       OR v_availability_status IS DISTINCT FROM 'available'
       OR v_is_active IS NOT TRUE THEN

        RAISE EXCEPTION
            'Only approved, active, available services can be matched.';

    END IF;


    RETURN NEW;

END;
$$;


/* =========================================================
   2. CREATE OR REPLACE MATCH VALIDATION TRIGGER
========================================================= */

DROP TRIGGER IF EXISTS trg_marketplace_validate_service_match
ON public.service_matches;

CREATE TRIGGER trg_marketplace_validate_service_match
BEFORE INSERT OR UPDATE OF request_id, user_service_id
ON public.service_matches
FOR EACH ROW
EXECUTE FUNCTION public.service_network_marketplace_validate_match();


/* =========================================================
   END OF MARKETPLACE MATCH VALIDATION
========================================================= */



/* 12. NOTIFICATION DELIVERY HISTORY */

CREATE TABLE IF NOT EXISTS notification_logs (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER,
    request_id INTEGER,
    match_id INTEGER,
    contact_method_id INTEGER,
    notification_channel VARCHAR(20) NOT NULL,
    notification_type VARCHAR(40) NOT NULL,
    message TEXT NOT NULL,
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    provider_reference VARCHAR(255),
    error_message TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_notification_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(request_id) ON DELETE SET NULL,
    CONSTRAINT fk_notification_match
        FOREIGN KEY (match_id)
        REFERENCES service_matches(match_id) ON DELETE SET NULL,
    CONSTRAINT fk_notification_contact
        FOREIGN KEY (contact_method_id)
        REFERENCES user_contact_methods(contact_method_id) ON DELETE SET NULL,
    CONSTRAINT chk_notification_log_channel
        CHECK (notification_channel IN ('email', 'sms')),
    CONSTRAINT chk_notification_log_type
        CHECK (length(btrim(notification_type)) > 0),
    CONSTRAINT chk_notification_message
        CHECK (length(btrim(message)) > 0),
    CONSTRAINT chk_notification_delivery_status
        CHECK (
            delivery_status IN ('pending', 'processing', 'sent', 'delivered', 'failed')
        ),
    CONSTRAINT chk_notification_attempts CHECK (attempt_count >= 0),
    CONSTRAINT chk_notification_sent_timestamp
        CHECK (
            delivery_status NOT IN ('sent', 'delivered')
            OR sent_at IS NOT NULL
        )
);



/* 12A. AUTOMATIC UPDATED_AT MAINTENANCE */

CREATE FUNCTION public.service_network_marketplace_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $updated_at$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$updated_at$;

CREATE TRIGGER trg_marketplace_user_services_updated_at
BEFORE UPDATE ON user_services
FOR EACH ROW
EXECUTE FUNCTION public.service_network_marketplace_set_updated_at();

CREATE TRIGGER trg_marketplace_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.service_network_marketplace_set_updated_at();

CREATE TRIGGER trg_marketplace_premium_memberships_updated_at
BEFORE UPDATE ON premium_memberships
FOR EACH ROW
EXECUTE FUNCTION public.service_network_marketplace_set_updated_at();

CREATE TRIGGER trg_marketplace_advertisement_campaigns_updated_at
BEFORE UPDATE ON advertisement_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.service_network_marketplace_set_updated_at();

CREATE TRIGGER trg_marketplace_advertisements_updated_at
BEFORE UPDATE ON advertisements
FOR EACH ROW
EXECUTE FUNCTION public.service_network_marketplace_set_updated_at();

CREATE TRIGGER trg_marketplace_service_requests_updated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION public.service_network_marketplace_set_updated_at();


/* 13. PERFORMANCE INDEXES
   PostgreSQL does not automatically index foreign-key referencing columns. */

/* User services */
CREATE INDEX IF NOT EXISTS idx_user_services_user
    ON user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_services_category
    ON user_services(service_category_id);
CREATE INDEX IF NOT EXISTS idx_user_services_organization
    ON user_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_services_approval
    ON user_services(approval_status, is_active, availability_status);

/* Contacts and preferences */
CREATE INDEX IF NOT EXISTS idx_contact_methods_user
    ON user_contact_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
    ON notification_preferences(user_id);

/* Memberships */
CREATE INDEX IF NOT EXISTS idx_memberships_user_status
    ON premium_memberships(user_id, membership_status);

/* Campaigns and advertisements */
CREATE INDEX IF NOT EXISTS idx_campaigns_creator
    ON advertisement_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_advertisements_campaign
    ON advertisements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_creator
    ON advertisements(created_by);
CREATE INDEX IF NOT EXISTS idx_advertisements_service
    ON advertisements(user_service_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_project
    ON advertisements(project_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_status_dates
    ON advertisements(advertisement_status, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_advertisements_sponsored
    ON advertisements(is_sponsored, display_priority);

/* Analytics */
CREATE INDEX IF NOT EXISTS idx_advertisement_analytics_ad
    ON advertisement_analytics(advertisement_id);
CREATE INDEX IF NOT EXISTS idx_advertisement_analytics_user
    ON advertisement_analytics(user_id);

/* Requests and matches */
CREATE INDEX IF NOT EXISTS idx_service_requests_customer
    ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_category_status
    ON service_requests(service_category_id, request_status);
CREATE INDEX IF NOT EXISTS idx_service_requests_status
    ON service_requests(request_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_matches_request
    ON service_matches(request_id, match_status);
CREATE INDEX IF NOT EXISTS idx_service_matches_service
    ON service_matches(user_service_id);

/* Notification history */
CREATE INDEX IF NOT EXISTS idx_notification_logs_user
    ON notification_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status
    ON notification_logs(delivery_status, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_request
    ON notification_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_match
    ON notification_logs(match_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_contact
    ON notification_logs(contact_method_id);




/* MIGRATION COMPLETE
   Schema only: no service categories, premium plans, or other business data
   are inserted by this migration. Seed/catalog data should be added separately
   after the application requirements and initial catalog are approved.
*/

COMMIT;



BEGIN;

ALTER TABLE user_services
DROP CONSTRAINT IF EXISTS chk_user_service_approval;

ALTER TABLE user_services
ADD CONSTRAINT chk_user_service_approval
CHECK (
    approval_status IN (
        'pending',
        'approved',
        'rejected',
        'suspended',
        'cancelled'
    )
);

COMMIT;

