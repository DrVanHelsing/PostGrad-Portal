import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'postgrad-portal';
const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

function getRefreshToken() {
  const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config?.tokens?.refresh_token;
}

async function getAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: FIREBASE_CLIENT_ID,
    client_secret: FIREBASE_CLIENT_SECRET,
  }).toString();

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function callApi(url, accessToken, method = 'POST', body = null) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, data: json };
}

async function enableService(accessToken, serviceName) {
  const url = `https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services/${serviceName}:enable`;
  const result = await callApi(url, accessToken, 'POST');
  if (!result.ok && result.status !== 409) {
    console.warn(`- ${serviceName} enable returned ${result.status}:`, result.data);
  } else {
    console.log(`✓ Requested enable for ${serviceName}`);
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureProjectConfig(accessToken) {
  const getUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`;
  const getRes = await callApi(getUrl, accessToken, 'GET');
  if (getRes.ok) {
    console.log('✓ Auth project config exists');
    return true;
  }
  console.warn('- Auth project config GET failed:', getRes.status, getRes.data);
  return false;
}

async function enableEmailPassword(accessToken) {
  const patchUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`;
  const body = {
    signIn: {
      email: {
        enabled: true,
        passwordRequired: true,
      },
    },
  };

  const patchRes = await callApi(patchUrl, accessToken, 'PATCH', body);
  if (!patchRes.ok) {
    throw new Error(`Failed to enable Email/Password (${patchRes.status}): ${JSON.stringify(patchRes.data)}`);
  }
  console.log('✓ Email/Password provider enabled');
}

async function main() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No Firebase CLI refresh token found. Run `firebase login` first.');

  const accessToken = await getAccessToken(refreshToken);
  console.log('✓ Access token acquired');

  await enableService(accessToken, 'identitytoolkit.googleapis.com');
  await enableService(accessToken, 'securetoken.googleapis.com');
  await enableService(accessToken, 'firebaseauth.googleapis.com');

  console.log('…waiting for API enablement propagation');
  await wait(8000);

  const configExists = await ensureProjectConfig(accessToken);
  if (!configExists) {
    console.log('…retrying config check after propagation delay');
    await wait(10000);
    await ensureProjectConfig(accessToken);
  }

  await enableEmailPassword(accessToken);
  console.log('✅ Firebase Auth Email/Password setup complete');
}

main().catch((err) => {
  console.error('❌ Auth setup failed:', err.message);
  process.exit(1);
});
