/**
 * Netlify Function: Submit a New Customer Review
 * Endpoint: POST /api/submit-review
 */

import { getPool } from './db.mjs';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export const handler = async (event, context) => {
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: JSON_HEADERS,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Method Not Allowed. Use POST.',
      }),
    };
  }

  // Parse request body
  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Invalid JSON request payload.',
      }),
    };
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const ratingRaw = body.rating;
  const reviewText = typeof body.review_text === 'string' ? body.review_text.trim() : '';

  // 1. Validation: Name
  if (!name) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Please enter your name.',
      }),
    };
  }

  if (name.length > 60) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Name cannot exceed 60 characters.',
      }),
    };
  }

  // 2. Validation: Rating (1 to 5 integer)
  if (ratingRaw === null || ratingRaw === undefined || !Number.isInteger(Number(ratingRaw))) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Please select a star rating from 1 to 5.',
      }),
    };
  }

  const rating = Number(ratingRaw);
  if (rating < 1 || rating > 5) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      }),
    };
  }

  // 3. Validation: Review Text
  if (!reviewText) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Please enter your review text.',
      }),
    };
  }

  if (reviewText.length > 2000) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Review text cannot exceed 2000 characters.',
      }),
    };
  }

  // 4. Persistence into PostgreSQL using safe parameterized query
  try {
    const pool = getPool();

    const insertResult = await pool.query(
      `INSERT INTO reviews (name, rating, review_text, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING id`,
      [name, rating, reviewText]
    );

    const insertedId = insertResult.rows[0]?.id;

    return {
      statusCode: 201,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Review posted successfully',
        review_id: insertedId,
      }),
    };
  } catch (err) {
    // Log server-side only for diagnostics without exposing to client
    console.error('Error in submit-review function:', err.message || err);

    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Could not save your review to the database. Please try again.',
      }),
    };
  }
};
