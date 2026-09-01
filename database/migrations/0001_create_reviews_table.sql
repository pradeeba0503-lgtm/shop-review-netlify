-- Netlify Database Migration: 0001_create_reviews_table
-- Creates the reviews table and reverse-chronological index for Selvarani Readymades

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at_id ON reviews (created_at DESC, id DESC);
