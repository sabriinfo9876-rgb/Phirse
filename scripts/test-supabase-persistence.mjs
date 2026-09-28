/**
 * SUPABASE CLOUD PERSISTENCE AUDIT & END-TO-END VERIFICATION SCRIPT
 *
 * Usage:
 *   node scripts/test-supabase-persistence.mjs
 *
 * What this script tests:
 *   1. Audits runtime environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 *      and detects URL path mismatches (e.g. trailing /rest/v1/).
 *   2. Queries the Supabase PostgREST OpenAPI root (/rest/v1/) to inspect exposed tables
 *      in the remote schema cache.
 *   3. Checks Supabase Auth session / getUser() state.
 *   4. Attempts a live INSERT into the 'listings' table using @supabase/supabase-js
 *      and logs the exact response (status, statusText, data, error).
 *   5. Executes a follow-up SELECT on 'listings' for the inserted record ID to verify
 *      whether data actually persisted in Supabase Cloud.
 *   6. If the record exists, tests UPDATE and DELETE cleanup to leave the database clean.
 */

import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(rawUrl) {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed
      .replace(/\/(rest|auth|storage|realtime)\/v1\/?.*$/i, '')
      .replace(/\/+$/, '');
  }
}

async function runAudit() {
  console.log('================================================================');
  console.log('PHIRSE — SUPABASE CLOUD PERSISTENCE AUDIT & LIVE CRUD TEST');
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // STEP 1: ENVIRONMENT VARIABLE AUDIT
  // -------------------------------------------------------------------------
  const rawEnvUrl = process.env.VITE_SUPABASE_URL || '';
  const rawEnvKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const normalizedUrl = normalizeSupabaseUrl(rawEnvUrl);

  console.log('--- [1] ENVIRONMENT VARIABLE AUDIT ---');
  console.log('Raw VITE_SUPABASE_URL       :', rawEnvUrl || '(MISSING)');
  console.log('Normalized Supabase Origin  :', normalizedUrl || '(MISSING)');
  console.log(
    'URL Mismatch Detected?      :',
    rawEnvUrl !== normalizedUrl
      ? `YES — Raw env var contains extra path/suffix ("${rawEnvUrl.replace(normalizedUrl, '')}"). @supabase/supabase-js appends "/rest/v1/<table>" automatically, so passing "/rest/v1/" in VITE_SUPABASE_URL causes PostgREST error PGRST125 ("Invalid path specified in request URL") unless normalized.`
      : 'NO — URL is a clean origin.'
  );
  console.log(
    'VITE_SUPABASE_ANON_KEY      :',
    rawEnvKey
      ? `${rawEnvKey.slice(0, 18)}... (length: ${rawEnvKey.length})`
      : '(MISSING)'
  );
  console.log(
    'Key Type                    :',
    rawEnvKey.startsWith('sb_publishable_')
      ? 'Supabase Publishable Key (sb_publishable_*)'
      : rawEnvKey.startsWith('eyJ')
      ? 'Supabase JWT Anon Key (eyJ*)'
      : rawEnvKey
      ? 'Custom / Unrecognized format'
      : 'Missing'
  );
  console.log('');

  if (!normalizedUrl || !rawEnvKey) {
    console.error(
      'FATAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from environment.'
    );
    process.exitCode = 1;
    return;
  }

  // -------------------------------------------------------------------------
  // STEP 2: DEMONSTRATE RAW URL vs NORMALIZED URL BEHAVIOR
  // -------------------------------------------------------------------------
  if (rawEnvUrl !== normalizedUrl) {
    console.log('--- [2A] TESTING RAW (UN-NORMALIZED) URL CLIENT ---');
    const unnormalizedClient = createClient(rawEnvUrl, rawEnvKey, {
      auth: { persistSession: false },
    });
    const rawCheck = await unnormalizedClient
      .from('listings')
      .select('id')
      .limit(1);
    console.log(
      'Result with Raw VITE_SUPABASE_URL:',
      JSON.stringify(
        {
          status: rawCheck.status,
          statusText: rawCheck.statusText,
          error: rawCheck.error,
        },
        null,
        2
      )
    );
    console.log('');
  }

  // -------------------------------------------------------------------------
  // STEP 2B: INSPECT REMOTE POSTGREST SCHEMA CACHE (/rest/v1/)
  // -------------------------------------------------------------------------
  console.log('--- [2B] REMOTE POSTGREST SCHEMA CACHE INSPECTION ---');
  try {
    const schemaRes = await fetch(`${normalizedUrl}/rest/v1/`, {
      headers: {
        apikey: rawEnvKey,
        Authorization: `Bearer ${rawEnvKey}`,
      },
    });
    console.log(
      'OpenAPI Endpoint Status     :',
      `${schemaRes.status} ${schemaRes.statusText}`
    );
    const openApiJson = await schemaRes.json();
    const exposedPaths = Object.keys(openApiJson.paths || {}).filter(
      (p) => p !== '/'
    );
    const exposedDefinitions = Object.keys(openApiJson.definitions || {});
    console.log(
      'Exposed Table Paths         :',
      exposedPaths.length > 0 ? exposedPaths.join(', ') : '(NONE — 0 tables in public schema)'
    );
    console.log(
      'Exposed Table Definitions   :',
      exposedDefinitions.length > 0
        ? exposedDefinitions.join(', ')
        : '(NONE — 0 tables in public schema)'
    );
  } catch (err) {
    console.error('Failed to query OpenAPI schema endpoint:', err);
  }
  console.log('');

  // -------------------------------------------------------------------------
  // STEP 3: INITIALIZE NORMALIZED SUPABASE CLIENT & CHECK AUTH
  // -------------------------------------------------------------------------
  console.log('--- [3] SUPABASE CLIENT & AUTH SESSION CHECK ---');
  const supabase = createClient(normalizedUrl, rawEnvKey, {
    auth: { persistSession: false },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  console.log(
    'supabase.auth.getUser()     :',
    JSON.stringify(
      {
        user: authData?.user ? { id: authData.user.id, email: authData.user.email } : null,
        error: authError
          ? { message: authError.message, status: authError.status }
          : null,
      },
      null,
      2
    )
  );
  console.log('');

  // -------------------------------------------------------------------------
  // STEP 4: ATTEMPT LIVE INSERT INTO 'listings' TABLE
  // -------------------------------------------------------------------------
  const testId = `SUPABASE_PERSISTENCE_TEST_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const insertPayload = {
    id: testId,
    seller_id: authData?.user?.id || 'u-current',
    title: 'SUPABASE_PERSISTENCE_TEST',
    description:
      'Automated diagnostic test record verifying end-to-end INSERT and SELECT persistence in Supabase Cloud.',
    category: 'electronics',
    subcategory: 'Audio & Headphones',
    brand: 'PHIRSE',
    model: 'AUDIT-PRO-1',
    condition: 'Like New',
    price: 15000,
    city: 'Karachi',
    area: 'Clifton',
    location: 'Clifton, Karachi',
    images: ['https://example.com/test-image.jpg'],
    specs: [{ label: 'Audit Test', value: 'True' }],
    status: 'active',
    created_at: nowIso,
    updated_at: nowIso,
    views: 0,
    saves: 0,
    inquiry_count: 0,
    contact_preference: 'Messages & Offers',
  };

  console.log('--- [4] ATTEMPTING LIVE INSERT INTO public.listings ---');
  console.log('Test Record ID              :', testId);
  console.log('Payload Columns             :', Object.keys(insertPayload).join(', '));

  const insertResponse = await supabase
    .from('listings')
    .insert(insertPayload)
    .select()
    .single();

  console.log(
    'Exact INSERT Response       :',
    JSON.stringify(
      {
        status: insertResponse.status,
        statusText: insertResponse.statusText,
        data: insertResponse.data,
        error: insertResponse.error,
      },
      null,
      2
    )
  );
  console.log('');

  // -------------------------------------------------------------------------
  // STEP 5: FOLLOW-UP SELECT TO VERIFY PERSISTENCE IN SUPABASE CLOUD
  // -------------------------------------------------------------------------
  console.log('--- [5] FOLLOW-UP SELECT FROM public.listings ---');
  const selectResponse = await supabase
    .from('listings')
    .select('*')
    .eq('id', testId)
    .maybeSingle();

  console.log(
    'Exact SELECT Response       :',
    JSON.stringify(
      {
        status: selectResponse.status,
        statusText: selectResponse.statusText,
        data: selectResponse.data,
        error: selectResponse.error,
      },
      null,
      2
    )
  );
  console.log('');

  // -------------------------------------------------------------------------
  // STEP 6: IF RECORD EXISTS, VERIFY UPDATE & DELETE
  // -------------------------------------------------------------------------
  let updatePassed = false;
  let deletePassed = false;

  if (selectResponse.data && !selectResponse.error) {
    console.log('--- [6] FOLLOW-UP UPDATE & DELETE VERIFICATION ---');
    const updateRes = await supabase
      .from('listings')
      .update({ title: 'SUPABASE_PERSISTENCE_TEST_UPDATED', price: 17500 })
      .eq('id', testId)
      .select()
      .single();

    console.log(
      'Exact UPDATE Response       :',
      JSON.stringify(
        {
          status: updateRes.status,
          statusText: updateRes.statusText,
          data: updateRes.data,
          error: updateRes.error,
        },
        null,
        2
      )
    );
    updatePassed = Boolean(updateRes.data && !updateRes.error);

    const deleteRes = await supabase.from('listings').delete().eq('id', testId);
    console.log(
      'Exact DELETE Response       :',
      JSON.stringify(
        {
          status: deleteRes.status,
          statusText: deleteRes.statusText,
          error: deleteRes.error,
        },
        null,
        2
      )
    );
    deletePassed = !deleteRes.error;
    console.log('');
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  const insertPassed = Boolean(insertResponse.data && !insertResponse.error);
  const selectPassed = Boolean(selectResponse.data && !selectResponse.error);

  console.log('================================================================');
  console.log('FINAL AUDIT VERDICT');
  console.log('================================================================');
  console.log(`INSERT TEST : ${insertPassed ? 'PASS' : 'FAIL'}`);
  console.log(`SELECT TEST : ${selectPassed ? 'PASS' : 'FAIL'}`);
  console.log(`UPDATE TEST : ${updatePassed ? 'PASS' : 'FAIL'}`);
  console.log(`DELETE TEST : ${deletePassed ? 'PASS' : 'FAIL'}`);
  if (insertResponse.error) {
    console.log(`ERROR CODE  : ${insertResponse.error.code}`);
    console.log(`ERROR MSG   : ${insertResponse.error.message}`);
  }
  console.log('================================================================');
}

runAudit().catch((err) => {
  console.error('Unhandled script error:', err);
  process.exitCode = 1;
});
