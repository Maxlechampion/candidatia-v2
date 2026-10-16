-- ============================================================
-- CandidatIA - Schema de base de donnees
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE : profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT,
    preferred_locale TEXT DEFAULT 'fr',
    country_code TEXT,
    credits INT DEFAULT 1,
    plan TEXT DEFAULT 'free',
    is_free_tier BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    fedapay_customer_id TEXT,
    flutterwave_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- ============================================================
-- TABLE : generations
-- ============================================================
CREATE TABLE IF NOT EXISTS generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    input_profile_hash TEXT NOT NULL,
    input_offer_hash TEXT NOT NULL,
    output_language TEXT NOT NULL DEFAULT 'fr',
    score_matching INT,
    cv_path TEXT,
    lettre_path TEXT,
    guide_path TEXT,
    zip_path TEXT,
    credits_consumed INT DEFAULT 1,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(created_at DESC);

-- ============================================================
-- TABLE : relances
-- ============================================================
CREATE TABLE IF NOT EXISTS relances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
    company_name TEXT,
    job_title TEXT,
    wait_days INT NOT NULL DEFAULT 7,
    scheduled_date DATE NOT NULL,
    email_draft TEXT,
    language TEXT NOT NULL DEFAULT 'fr',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reminded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_relances_user ON relances(user_id);
CREATE INDEX IF NOT EXISTS idx_relances_scheduled ON relances(scheduled_date, status);

-- ============================================================
-- TABLE : payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_transaction_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    credits_added INT DEFAULT 0,
    plan_purchased TEXT,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider, provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================================
-- TABLE : ai_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_hash TEXT NOT NULL,
    tokens_input INT,
    tokens_output INT,
    latency_ms INT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_provider ON ai_logs(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_prompt ON ai_logs(prompt_hash);

-- ============================================================
-- FIN DU SCHEMA
-- ============================================================
-- ============================================================
-- MIGRATION PRICING-v2 (idempotent)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_free_tier BOOLEAN DEFAULT TRUE;
UPDATE profiles SET is_free_tier = FALSE WHERE plan IN ('express', 'active', 'intensive', 'pro_unlimited');
UPDATE profiles SET is_free_tier = TRUE WHERE plan = 'free' AND is_free_tier IS NULL;
