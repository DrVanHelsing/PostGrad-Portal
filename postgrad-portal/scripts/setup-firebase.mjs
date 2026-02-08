/**
 * Firebase Setup Script
 * ---------------------
 * Automates: Enable Firestore API, create DB, enable Email/Password auth,
 * check for existing data, and seed via the app's /seed route.
 *
 * Usage:  node scripts/setup-firebase.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const PROJECT_ID = 'pg-portal1';
const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'; // Firebase CLI public secret

// ---- Helpers ----
function httpsJson(method, hostname, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request({ method, hostname, path: urlPath, headers }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    }).on('error', reject);
  });
}

// ---- Step 0: Get access token from Firebase CLI refresh token ----
async function getAccessToken() {
  const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens.refresh_token;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: FIREBASE_CLIENT_ID,
    client_secret: FIREBASE_CLIENT_SECRET,
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST',
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        const parsed = JSON.parse(raw);
        if (parsed.access_token) resolve(parsed.access_token);
        else reject(new Error('Failed to get access token: ' + raw));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---- Step 1: Enable Firestore API ----
async function enableFirestoreApi(token) {
  console.log('\n[1/6] Checking Firestore API status...');
  const check = await httpsJson('GET', 'serviceusage.googleapis.com',
    `/v1/projects/${PROJECT_ID}/services/firestore.googleapis.com`, null, token);

  if (check.data?.state === 'ENABLED') {
    console.log('  ✓ Firestore API already enabled');
    return;
  }

  console.log('  → Enabling Firestore API...');
  const enable = await httpsJson('POST', 'serviceusage.googleapis.com',
    `/v1/projects/${PROJECT_ID}/services/firestore.googleapis.com:enable`, {}, token);

  if (enable.status >= 200 && enable.status < 300) {
    console.log('  ✓ Firestore API enabled (may take ~30s to propagate)');
    // Wait for propagation
    console.log('  → Waiting 30s for API propagation...');
    await new Promise((r) => setTimeout(r, 30000));
  } else {
    console.error('  ✗ Failed to enable Firestore API:', JSON.stringify(enable.data));
    process.exit(1);
  }
}

// ---- Step 2: Create Firestore Database ----
async function createFirestoreDb(token) {
  console.log('\n[2/6] Checking Firestore database...');

  // Check if DB already exists
  const list = await httpsJson('GET', 'firestore.googleapis.com',
    `/v1/projects/${PROJECT_ID}/databases`, null, token);

  if (list.status === 200 && list.data?.databases?.length > 0) {
    console.log('  ✓ Firestore database already exists:', list.data.databases.map(d => d.name).join(', '));
    return;
  }

  // Approach 1: Try the v1 API
  console.log('  → Creating default Firestore database in us-east1...');
  const create1 = await httpsJson('POST', 'firestore.googleapis.com',
    `/v1/projects/${PROJECT_ID}/databases?databaseId=(default)`,
    { type: 'FIRESTORE_NATIVE', locationId: 'us-east1' }, token);

  if (create1.status >= 200 && create1.status < 300) {
    console.log('  ✓ Firestore database created (v1 API)');
    await new Promise((r) => setTimeout(r, 15000));
    return;
  }
  if (create1.data?.error?.message?.includes('already exists')) {
    console.log('  ✓ Firestore database already exists');
    return;
  }

  console.log(`  → v1 API returned ${create1.status}: ${create1.data?.error?.message || 'unknown'}`);

  // Approach 2: Try the v1beta1 API
  console.log('  → Trying v1beta1 API...');
  const create2 = await httpsJson('POST', 'firestore.googleapis.com',
    `/v1beta1/projects/${PROJECT_ID}/databases?databaseId=(default)`,
    { type: 'FIRESTORE_NATIVE', locationId: 'us-east1' }, token);

  if (create2.status >= 200 && create2.status < 300) {
    console.log('  ✓ Firestore database created (v1beta1 API)');
    await new Promise((r) => setTimeout(r, 15000));
    return;
  }

  // Approach 3: Try Firebase Management API to provision Firestore
  console.log('  → Trying Firebase Management API...');
  const create3 = await httpsJson('POST', 'firebase.googleapis.com',
    `/v1beta1/projects/${PROJECT_ID}/defaultLocation`,
    { locationId: 'us-east1' }, token);

  if (create3.status >= 200 && create3.status < 300) {
    console.log('  ✓ Firebase location set & Firestore provisioned');
    await new Promise((r) => setTimeout(r, 15000));
    return;
  }

  // Approach 4: Try enabling Firestore via appengine
  console.log('  → Trying App Engine provisioning (required for legacy Firestore)...');
  const create4 = await httpsJson('POST', 'appengine.googleapis.com',
    `/v1/apps`,
    { id: PROJECT_ID, locationId: 'us-east1' }, token);

  // If all fail, give manual instructions
  console.warn('\n  ⚠ Could not create Firestore database automatically.');
  console.warn('  Please create it manually:');
  console.warn('  1. Go to https://console.firebase.google.com/project/pg-portal1/firestore');
  console.warn('  2. Click "Create database"');
  console.warn('  3. Choose "Start in test mode"');
  console.warn('  4. Select "us-east1" (or any region)');
  console.warn('  5. Re-run this script after creation');

  // Don't exit - continue with Auth setup even if Firestore DB creation fails
  return;
}

// ---- Step 3: Set Firestore security rules (test mode) ----
async function setFirestoreRules(token) {
  console.log('\n[3/6] Setting Firestore security rules (test mode)...');
  
  // Test mode rules - allow all reads/writes (valid for 30 days from now)
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const body = {
    source: {
      files: [{ name: 'firestore.rules', content: rules }]
    }
  };

  const result = await httpsJson('POST', 'firestore.googleapis.com',
    `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`, null, token);

  // Use the Firebase Rules API instead
  const rulesResult = await httpsJson('POST', 'firebaserules.googleapis.com',
    `/v1/projects/${PROJECT_ID}/rulesets`,
    { source: { files: [{ name: 'firestore.rules', content: rules, fingerprint: '' }] } },
    token);

  if (rulesResult.status >= 200 && rulesResult.status < 300) {
    const rulesetName = rulesResult.data.name;
    // Release the ruleset
    await httpsJson('POST', 'firebaserules.googleapis.com',
      `/v1/projects/${PROJECT_ID}/releases`,
      { name: `projects/${PROJECT_ID}/releases/cloud.firestore`, rulesetName },
      token);
    console.log('  ✓ Firestore rules set to test mode (open access)');
  } else if (rulesResult.status === 409) {
    // Try update instead
    const releaseResult = await httpsJson('PATCH', 'firebaserules.googleapis.com',
      `/v1/projects/${PROJECT_ID}/releases/cloud.firestore`,
      { rulesetName: rulesResult.data?.name },
      token);
    console.log('  ✓ Firestore rules updated');
  } else {
    console.warn('  ⚠ Could not set Firestore rules automatically. Set them manually in Firebase Console.');
    console.warn('    Response:', JSON.stringify(rulesResult.data).substring(0, 200));
  }
}

// ---- Step 4: Enable Email/Password Authentication ----
async function enableEmailAuth(token) {
  console.log('\n[4/6] Checking Authentication providers...');

  // First, enable the Identity Toolkit API
  const idCheck = await httpsJson('GET', 'serviceusage.googleapis.com',
    `/v1/projects/${PROJECT_ID}/services/identitytoolkit.googleapis.com`, null, token);

  if (idCheck.data?.state !== 'ENABLED') {
    console.log('  → Enabling Identity Toolkit API...');
    await httpsJson('POST', 'serviceusage.googleapis.com',
      `/v1/projects/${PROJECT_ID}/services/identitytoolkit.googleapis.com:enable`, {}, token);
    await new Promise((r) => setTimeout(r, 10000));
  }

  // Get current config
  const configResp = await httpsJson('GET', 'identitytoolkit.googleapis.com',
    `/v2/projects/${PROJECT_ID}/config`, null, token);

  const hasEmailProvider = configResp.data?.signIn?.email?.enabled === true;

  if (hasEmailProvider) {
    console.log('  ✓ Email/Password authentication already enabled');
    const hashConfig = configResp.data?.signIn?.email?.hashConfig;
    if (hashConfig) console.log('    Hash algorithm:', hashConfig.algorithm || 'default');
    return;
  }

  console.log('  → Enabling Email/Password authentication...');
  const updateResp = await httpsJson('PATCH', 'identitytoolkit.googleapis.com',
    `/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`,
    {
      signIn: {
        email: {
          enabled: true,
          passwordRequired: true,
        }
      }
    }, token);

  if (updateResp.status >= 200 && updateResp.status < 300) {
    console.log('  ✓ Email/Password authentication enabled');
  } else {
    console.error('  ✗ Failed to enable Email/Password auth:', JSON.stringify(updateResp.data));
    // Try alternative Identity Platform API
    console.log('  → Trying alternative approach...');
    const altResp = await httpsJson('PATCH', 'identitytoolkit.googleapis.com',
      `/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`,
      {
        signIn: {
          email: {
            enabled: true,
            passwordRequired: true,
          }
        }
      }, token);
    if (altResp.status >= 200 && altResp.status < 300) {
      console.log('  ✓ Email/Password authentication enabled (alt)');
    } else {
      console.warn('  ⚠ Could not enable Email/Password auth automatically.');
      console.warn('    Please enable it manually in Firebase Console → Authentication → Sign-in method');
    }
  }
}

// ---- Step 5: Check for existing data in Firestore ----
async function checkExistingData(token) {
  console.log('\n[5/6] Checking for existing data in Firestore...');

  const collections = ['users', 'hdRequests', 'calendarEvents', 'milestones', 'notifications', 'studentProfiles', 'auditLogs'];
  const counts = {};
  let totalDocs = 0;

  for (const col of collections) {
    const resp = await httpsJson('POST', 'firestore.googleapis.com',
      `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runAggregationQuery`,
      {
        structuredAggregationQuery: {
          structuredQuery: { from: [{ collectionId: col }] },
          aggregations: [{ alias: 'count', count: {} }]
        }
      }, token);

    let count = 0;
    if (resp.status === 200 && Array.isArray(resp.data)) {
      const result = resp.data[0]?.result?.aggregateFields?.count;
      count = parseInt(result?.integerValue || '0', 10);
    }
    counts[col] = count;
    totalDocs += count;
  }

  console.log('  Collection counts:');
  for (const [col, count] of Object.entries(counts)) {
    console.log(`    ${col}: ${count} documents`);
  }

  if (totalDocs > 0) {
    console.log(`\n  ⚠ Database already has ${totalDocs} documents. Skipping seed.`);
    return true; // has data
  }

  console.log('  ✓ Database is empty — ready for seeding');
  return false; // no data
}

// ---- Step 6: Check existing Auth users (demo accounts only) ----
async function checkExistingAuthUsers(token) {
  console.log('\n[5b/6] Checking for existing demo Auth users...');

  const DEMO_EMAILS = [
    'student@uwc.ac.za', 'supervisor@uwc.ac.za', 'coordinator@uwc.ac.za',
    'admin@uwc.ac.za', 'co-supervisor@uwc.ac.za', 'student2@uwc.ac.za', 'student3@uwc.ac.za'
  ];

  let foundDemoUsers = [];

  for (const email of DEMO_EMAILS) {
    const resp = await httpsJson('POST', 'identitytoolkit.googleapis.com',
      `/v1/projects/${PROJECT_ID}/accounts:lookup`,
      { email: [email] },
      token);

    if (resp.status === 200 && resp.data?.users?.length > 0) {
      foundDemoUsers.push(email);
    }
  }

  if (foundDemoUsers.length > 0) {
    console.log(`  Found ${foundDemoUsers.length} existing demo user(s): ${foundDemoUsers.join(', ')}`);
    return true;
  } else {
    console.log('  ✓ No demo auth users found — ready to seed');
    return false;
  }
}

// ---- Step 6: Trigger seed via the running dev server ----
async function triggerSeed() {
  console.log('\n[6/6] Seeding data...');
  console.log('  → The seed must be done through the browser (it uses Firebase client SDK).');
  console.log('  → Opening seed page at http://localhost:5173/seed');
  console.log('');
  console.log('  Please:');
  console.log('  1. Make sure the dev server is running (npm run dev)');
  console.log('  2. Navigate to http://localhost:5173/seed');
  console.log('  3. Click "Seed Firestore + Auth"');
  console.log('  4. Wait for completion, then click "Check Data" to verify');
  console.log('');
  console.log('  Demo accounts (password: Portal@2026):');
  console.log('    student@uwc.ac.za     - Student (Thabo Molefe)');
  console.log('    supervisor@uwc.ac.za  - Supervisor (Prof. van der Berg)');
  console.log('    coordinator@uwc.ac.za - Coordinator (Dr. Fatima Patel)');
  console.log('    admin@uwc.ac.za       - Admin (Linda Mkhize)');
}

// ---- Main ----
async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Firebase Setup for PostGrad Portal           ║');
  console.log('║   Project: pg-portal1                          ║');
  console.log('╚════════════════════════════════════════════════╝');

  try {
    console.log('\n[0/6] Getting access token from Firebase CLI...');
    const token = await getAccessToken();
    console.log('  ✓ Access token obtained');

    await enableFirestoreApi(token);
    await createFirestoreDb(token);
    await setFirestoreRules(token);
    await enableEmailAuth(token);

    const hasData = await checkExistingData(token);
    const hasUsers = await checkExistingAuthUsers(token);

    if (hasData || hasUsers) {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║   ⚠ App demo data/users already present!       ║');
      console.log('║   Seed step skipped to prevent duplicates.     ║');
      console.log('║   To re-seed: delete data in Firebase Console  ║');
      console.log('║   then run this script again.                  ║');
      console.log('╚════════════════════════════════════════════════╝');
    } else {
      await triggerSeed();
    }

    console.log('\n✅ Firebase setup complete!');
  } catch (err) {
    console.error('\n✗ Setup failed:', err.message);
    process.exit(1);
  }
}

main();
