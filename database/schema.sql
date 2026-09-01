-- =======================================================
-- Netlify Database Schema for Selvarani Readymades Review System
-- Native PostgreSQL schema managed via Netlify Database migrations
-- Migration location: netlify/database/migrations/0001_create_reviews_table.sql
-- =======================================================

-- Create Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for optimizing reverse-chronological review retrieval and statistics
CREATE INDEX IF NOT EXISTS idx_reviews_created_at_id ON reviews (created_at DESC, id DESC);

-- Note: The database starts with 0 reviews as required.
-- Real customer reviews submitted through the website will be inserted here.
