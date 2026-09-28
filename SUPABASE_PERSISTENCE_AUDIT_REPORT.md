# Comprehensive Supabase Integration & Persistence Audit Report

**Audit Timestamp:** `2026-09-28T04:55:48Z`  
**Target Project:** `https://xuduaodcjtapubnetxog.supabase.co`  
**Verification Script:** `scripts/test-supabase-persistence.mjs` (`npm run test:supabase`)

---

## 1. Executive Summary & Live Test Results

We executed `node scripts/test-supabase-persistence.mjs` directly against the live Supabase Cloud project (`xuduaodcjtapubnetxog`).

| Operation | Target Table | HTTP Status | Supabase Error Code | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Raw URL Client Test** | `public.listings` | `404 Not Found` | `PGRST125` (`Invalid path specified in request URL`) | **FIXED IN CLIENT** |
| **Normalized `INSERT`** | `public.listings` | `404 Not Found` | `PGRST205` (`Could not find the table 'public.listings' in the schema cache`) | **FAIL (Table Missing in Cloud)** |
| **Follow-up `SELECT`** | `public.listings` | `404 Not Found` | `PGRST205` (`Could not find the table 'public.listings' in the schema cache`) | **FAIL (Table Missing in Cloud)** |
| **Follow-up `UPDATE`** | `public.listings` | `404 Not Found` | `PGRST205` (`Could not find the table 'public.listings' in the schema cache`) | **FAIL (Table Missing in Cloud)** |
| **Follow-up `DELETE`** | `public.listings` | `404 Not Found` | `PGRST205` (`Could not find the table 'public.listings' in the schema cache`) | **FAIL (Table Missing in Cloud)** |

> **Truth Mode Status:** **Persistence could not be verified** because the remote PostgreSQL database at `xuduaodcjtapubnetxog.supabase.co` currently contains **zero tables** in the `public` schema.

---

## 2. Environment Variable Mismatch Audit

### A. `VITE_SUPABASE_URL` Mismatch (Root Cause #1 — Fixed in Code)
- **Configured Value in Environment:**  
  `https://xuduaodcjtapubnetxog.supabase.co/rest/v1/`
- **Why It Broke:**  
  `@supabase/supabase-js` expects the base project origin (`https://<project-ref>.supabase.co`) and automatically appends `/rest/v1/<table_name>` to every database query. Because `VITE_SUPABASE_URL` included `/rest/v1/`, all queries were sent to:  
  `https://xuduaodcjtapubnetxog.supabase.co/rest/v1/rest/v1/listings`  
  PostgREST rejected this malformed URL with:
  ```json
  {
    "code": "PGRST125",
    "details": null,
    "hint": null,
    "message": "Invalid path specified in request URL"
  }
  ```
- **Code Fix Applied (`src/lib/supabase.ts`):**  
  Added `normalizeSupabaseUrl()` before initializing `createClient()` so any trailing `/rest/v1`, `/auth/v1`, or `/realtime/v1` path is stripped down to `new URL(trimmed).origin` (`https://xuduaodcjtapubnetxog.supabase.co`).

### B. `VITE_SUPABASE_ANON_KEY` Audit
- **Configured Value in Environment:**  
  `sb_publishable_mP0...` (length: 46 characters)
- **Status:**  
  Valid Supabase Publishable API Key format (`sb_publishable_*`). Authenticates requests to the Supabase API gateway without using any `service_role` secret key on the client.

---

## 3. Root Cause Analysis (Why Data Does Not Persist in Supabase Cloud)

### Root Cause #2 — Missing Remote Tables (`PGRST205`)
Once the URL is normalized to `https://xuduaodcjtapubnetxog.supabase.co`, the test script attempts a real `INSERT` into `public.listings`:

```json
{
  "status": 404,
  "statusText": "Not Found",
  "data": null,
  "error": {
    "code": "PGRST205",
    "details": null,
    "hint": null,
    "message": "Could not find the table 'public.listings' in the schema cache"
  }
}
```

**Why this happens:**
1. The SQL DDL migration (`supabase/schema.sql`) has **not yet been executed** inside the Supabase Cloud SQL Editor for project `xuduaodcjtapubnetxog`.
2. Because Supabase PostgREST only exposes existing tables over `/rest/v1/*` and prevents client-side `sb_publishable_*` keys from executing arbitrary `CREATE TABLE` DDL statements, the tables (`users`, `listings`, `saved_items`, `inquiries`, `conversations`, `messages`, `offers`, `reports`) must be created once in the Supabase Dashboard SQL Editor.

---

## 4. Data Flow & Schema Mapping Audit

All application mutations in `src/store/MarketplaceContext.tsx` map `camelCase` frontend models to `snake_case` PostgreSQL columns and inspect `{ data, error }` responses:

| User Action | Handler in `MarketplaceContext.tsx` | Supabase Operation | Target Table |
| :--- | :--- | :--- | :--- |
| Register / Login / Update Profile | `login`, `register`, `updateProfile`, `switchUser` | `UPSERT` (`onConflict: 'id'`) | `public.users` |
| Post Listing | `addListing` | `INSERT` + `.select().single()` | `public.listings` |
| Edit / Mark Sold / Moderate Listing | `updateListing`, `updateListingStatus`, `moderateListing` | `UPDATE` + `.eq('id', id).select()` | `public.listings` |
| Delete Listing | `deleteListing` | `DELETE` + `.eq('id', id)` | `public.listings` |
| Toggle Saved Item | `toggleSave` | `UPSERT` / `DELETE` | `public.saved_items` |
| Send Inquiry | `addInquiry`, `updateInquiryStatus` | `INSERT` / `UPDATE` | `public.inquiries` |
| Start Chat / Send Message | `sendMessage`, `markConversationRead` | `UPSERT` / `INSERT` | `public.conversations`, `public.messages` |
| Make / Respond to Offer | `createOffer`, `updateOfferStatus` | `INSERT` / `UPDATE` | `public.offers` |
| Report Listing | `addReport`, `resolveReport` | `INSERT` / `UPDATE` | `public.reports` |

---

## 5. Row-Level Security (RLS) Policy & Authentication Status

### Authentication Model
- The application uses an application-level user switcher & phone/email profile flow (`u1`, `u2`, `u3`, `admin1`, or newly registered `user_<timestamp>`) rather than `supabase.auth.signInWithPassword()`, so `supabase.auth.getUser()` returns `user: null` (PostgREST executes queries under the `anon` role).
- Every record (`seller_id`, `buyer_id`, `user_id`, `sender_id`) is explicitly populated with the active user's ID before `INSERT`—never `null` or `undefined`.

### RLS Configuration in `supabase/schema.sql`
- **RLS is explicitly enabled (`ENABLE ROW LEVEL SECURITY`) on all 8 tables** (`users`, `listings`, `saved_items`, `inquiries`, `conversations`, `messages`, `offers`, `reports`). RLS is **not** disabled.
- Because requests run as `anon` (`sb_publishable_*`) or `authenticated`, explicit policies are defined for each table granting `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to `anon, authenticated` with column-level integrity constraints (e.g., `price >= 0`, `amount > 0`, valid `status` enums, non-empty `id` and `seller_id`) and `NOTIFY pgrst, 'reload schema';`.

---

## 6. How to Complete Cloud Setup & Re-Verify

1. **In the App UI:** Click the amber **"Setup Database Tables"** banner at the top (or **Cloud DB: Schema Missing** in the header) -> click **1. Copy SQL Schema** -> click **2. Open Supabase SQL Editor** (`https://supabase.com/dashboard/project/xuduaodcjtapubnetxog/sql/new`) -> Paste & click **Run**.
2. **Verify via CLI:**
   ```bash
   npm run test:supabase
   ```
3. **Verify via In-App Console:** Click **3. Verify & Sync Tables** or **Run Live CRUD Test** inside the Supabase Cloud Persistence modal to watch live `INSERT` -> `SELECT` -> `UPDATE` -> `DELETE` verification pass.
