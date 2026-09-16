-- ============================================
-- GRIZON AGRI — PostgreSQL Database Schema
-- Farm Digital Twin + Agronomic Knowledge Base
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- 1. FARMERS — User profiles
-- ============================================
CREATE TABLE IF NOT EXISTS farmers (
    farmer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'pa-IN',  -- Punjabi default
    district VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Punjab',
    village VARCHAR(100),
    profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. FIELDS — Farm plots with GIS boundaries
-- ============================================
CREATE TABLE IF NOT EXISTS fields (
    field_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    field_name VARCHAR(100),
    area_acres NUMERIC(6, 2),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    soil_type VARCHAR(50),          -- e.g., 'Loamy', 'Clay', 'Sandy'
    irrigation_source VARCHAR(50),  -- e.g., 'Tubewell', 'Canal', 'Rain-fed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fields_farmer ON fields(farmer_id);

-- ============================================
-- 3. CROP CYCLES — Active crop tracking (Farm Digital Twin)
-- ============================================
CREATE TABLE IF NOT EXISTS crop_cycles (
    cycle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    crop_name VARCHAR(50) NOT NULL,       -- e.g., 'Wheat', 'Paddy', 'Maize'
    crop_variety VARCHAR(100),            -- e.g., 'PBW 826', 'PR 126', 'PMH 1'
    season VARCHAR(20) NOT NULL,          -- 'Kharif', 'Rabi', 'Zaid'
    sowing_date DATE NOT NULL,
    expected_harvest DATE,
    current_stage VARCHAR(50),            -- e.g., 'CRI', 'Tillering', 'Flowering'
    status VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE, HARVESTED, ABANDONED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crop_cycles_farmer ON crop_cycles(farmer_id);
CREATE INDEX idx_crop_cycles_active ON crop_cycles(status) WHERE status = 'ACTIVE';

-- ============================================
-- 4. AGRONOMIC KNOWLEDGE — PAU/HAU Package of Practices (Vector RAG)
-- ============================================
CREATE TABLE IF NOT EXISTS agronomic_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_document VARCHAR(200) NOT NULL,  -- 'PAU_Rabi_2025_26.pdf'
    source_university VARCHAR(100),         -- 'PAU', 'HAU', 'ICAR'
    crop VARCHAR(50),
    season VARCHAR(20),
    topic VARCHAR(100),                     -- 'Weed Management', 'Irrigation', 'Fertilizer'
    content TEXT NOT NULL,
    page_number INTEGER,
    embedding vector(1024),                 -- BGE-M3 multilingual embeddings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_knowledge_crop ON agronomic_knowledge(crop);
CREATE INDEX idx_knowledge_topic ON agronomic_knowledge(topic);
CREATE INDEX idx_knowledge_embedding ON agronomic_knowledge
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 5. CONVERSATIONS — Chat history & farm context
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    title VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,              -- 'farmer', 'assistant'
    content TEXT NOT NULL,
    audio_url VARCHAR(500),                 -- Sarvam TTS generated audio URL
    intent VARCHAR(50),                     -- Detected intent
    confidence_score NUMERIC(4, 2),         -- Verification confidence (0-100)
    evidence_sources JSONB,                 -- Array of source references
    metadata JSONB,                         -- Extra context (weather, satellite, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_role ON messages(role);

-- ============================================
-- 6. RECOMMENDATIONS — Tracked for outcome evaluation
-- ============================================
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(message_id),
    farmer_id UUID NOT NULL REFERENCES farmers(farmer_id),
    crop_cycle_id UUID REFERENCES crop_cycles(cycle_id),
    recommendation_type VARCHAR(50),        -- 'PESTICIDE', 'IRRIGATION', 'FERTILIZER', 'GENERAL'
    recommendation_text TEXT NOT NULL,
    confidence_score NUMERIC(4, 2),
    evidence_level VARCHAR(30),             -- 'MEASURED_FACT', 'AUTHORITATIVE', 'SATELLITE_SIGNAL', 'MODEL_INFERENCE', 'HYPOTHESIS'
    farmer_feedback VARCHAR(20),            -- 'HELPFUL', 'NOT_HELPFUL', 'WRONG', NULL
    outcome_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_farmer ON recommendations(farmer_id);
