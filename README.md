# Selvarani Readymades — Customer Reviews (Netlify Database Edition)

A full-stack, serverless customer review website for **Selvarani Readymades**, designed for seamless deployment on **Netlify** using static frontend assets, **Netlify Functions**, and **Netlify Database** (PostgreSQL).

---

## 🌟 Features & Architecture

- **Heritage Branding**: Preserves the awning header, Fraunces serif typography, Inter body font, IBM Plex Mono accents, and traditional shop colors.
- **Hero Statistics Stamp**: Displays real-time **Average Rating** (rounded to 1 decimal place or `–` if 0) and total **Reviews Written** calculated across **all reviews** in the database.
- **Interactive Review Flow**:
  - Live star-rating selector (1 to 5 stars).
  - Client-side validation (Name ≤ 60 chars, Review ≤ 2000 chars).
  - Modal preview before publishing.
  - "Confirm & Post" submission protection against duplicate clicks.
- **Instant Public Visibility**: No moderation queue or admin approvals required; newly posted reviews appear immediately on the board.
- **Zero Browser Storage**: Does not use `localStorage`, `sessionStorage`, or `window.storage`.
- **Official Netlify Database Integration**:
  - Uses `@netlify/database` (`getConnectionString()`) to obtain environment-aware PostgreSQL credentials automatically for production and deploy previews.
  - Serverless PostgreSQL connection pooling via `pg.Pool`.
  - Schema migrations defined in `netlify/database/migrations/`.

---

## 📁 Project Structure

```
shop-review-netlify/
├── index.html                  # Static frontend HTML5
├── assets/
│   ├── css/
│   │   └── style.css           # Preserved custom stylesheet
│   ├── js/
│   │   └── reviews.js          # Vanilla JS frontend controller (Fetch API to Netlify Functions)
│   └── images/
│       └── logo.jpg            # Shop logo
├── netlify/
│   ├── database/
│   │   └── migrations/
│   │       └── 0001_create_reviews_table.sql # Netlify Database SQL migration
│   └── functions/
│       ├── db.mjs              # Database helper using @netlify/database getConnectionString()
│       ├── get-reviews.mjs     # GET /api/get-reviews
│       └── submit-review.mjs   # POST /api/submit-review
├── database/
│   ├── migrations/
│   │   └── 0001_create_reviews_table.sql
│   └── schema.sql              # PostgreSQL DDL table & index definitions
├── netlify.toml                # Netlify build configuration & API route redirects
├── package.json                # Node.js dependencies (@netlify/database, pg)
├── package-lock.json           # Locked dependency tree
└── README.md                   # Full documentation
```

---

## 🗄️ Database Setup & Migrations (Netlify Database)

### 1. Migration File

The database schema is defined in [`netlify/database/migrations/0001_create_reviews_table.sql`](netlify/database/migrations/0001_create_reviews_table.sql):

```sql
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at_id ON reviews (created_at DESC, id DESC);
```

*Note: The database starts with 0 reviews.*

### 2. Applying Migrations via Netlify CLI

When developing locally or deploying:
- Netlify Database automatically applies migrations on production deploys and deploy previews.
- To apply migrations locally with the Netlify CLI:
  ```bash
  netlify database migrations apply
  ```

---

## 💻 Local Testing & Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Local Development Server

```bash
npx netlify dev
```

Netlify CLI starts the local dev server (default `http://localhost:8888`), provisions a local database branch or connects to Netlify Database, injects `NETLIFY_DB_URL`, and routes `/api/get-reviews` and `/api/submit-review` to the respective Netlify Functions.

---

## 🚀 Deployment Steps (When Ready to Deploy)

1. **Initialize Netlify Database on your site**:
   ```bash
   netlify database init
   ```
2. **Deploy to Netlify**:
   ```bash
   netlify deploy --prod
   ```
   Netlify Database will automatically run the migration from `netlify/database/migrations/` to initialize the `reviews` table.
