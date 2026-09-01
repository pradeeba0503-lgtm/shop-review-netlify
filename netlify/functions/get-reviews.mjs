/**
 * Netlify Function: Get All Reviews and Aggregated Statistics
 * Endpoint: GET /api/get-reviews
 */

import { getPool } from './db.mjs';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Method Not Allowed. Use GET.',
      }),
    };
  }

  try {
    const pool = getPool();

    // 1. Fetch aggregate statistics (from all reviews in database)
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_reviews, 
        COALESCE(AVG(rating), 0)::float AS average_rating 
      FROM reviews
    `);

    const stats = statsResult.rows[0] || { total_reviews: 0, average_rating: 0 };
    const totalReviews = Number(stats.total_reviews) || 0;
    const averageRating = totalReviews > 0 ? Math.round(Number(stats.average_rating) * 10) / 10 : 0;

    // 2. Fetch all reviews sorted newest first (created_at DESC, id DESC)
    const reviewsResult = await pool.query(`
      SELECT 
        id, 
        name, 
        rating, 
        review_text, 
        created_at 
      FROM reviews 
      ORDER BY created_at DESC, id DESC
    `);

    // 3. Format review objects cleanly
    const formattedReviews = reviewsResult.rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      rating: Number(row.rating),
      review_text: String(row.review_text),
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    }));

    // 4. Return successful JSON response
    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: true,
        total_reviews: totalReviews,
        average_rating: averageRating,
        reviews: formattedReviews,
      }),
    };
  } catch (err) {
    // Log server-side only for diagnostics without exposing to client
    console.error('Error in get-reviews function:', err.message || err);

    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Unable to load reviews from the database at this time.',
        total_reviews: 0,
        average_rating: 0,
        reviews: [],
      }),
    };
  }
};
