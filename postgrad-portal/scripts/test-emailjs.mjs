// ============================================
// EmailJS Test Script
// Usage: node scripts/test-emailjs.mjs
// ============================================
// Sends a single test email to verify your EmailJS
// service, template, and public key are working.
//
// Before running, either:
//   (a) set environment variables, or
//   (b) edit the constants below directly.
// ============================================

const SERVICE_ID  = process.env.VITE_EMAILJS_SERVICE_ID  || '';   // e.g. service_abc1234
const TEMPLATE_ID = process.env.VITE_EMAILJS_TEMPLATE_ID || '';   // e.g. template_xyz789
const PUBLIC_KEY  = process.env.VITE_EMAILJS_PUBLIC_KEY  || '0yphGpdy-Ur4p6xpl';

// ── Whom to send the test to ──
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@uwc.ac.za';

// ────────────────────────────────────────────

if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
  console.error(
    '\n❌  Missing credentials.\n' +
    '   Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY\n' +
    '   as environment variables, or edit them at the top of this file.\n\n' +
    '   See docs/EMAILJS_SETUP.md for instructions.\n'
  );
  process.exit(1);
}

const payload = {
  service_id:  SERVICE_ID,
  template_id: TEMPLATE_ID,
  user_id:     PUBLIC_KEY,
  template_params: {
    to_email:    TEST_EMAIL,
    to_name:     'Portal Admin',
    from_name:   'PostGrad Portal (Test)',
    subject:     'EmailJS Integration Test',
    message:     'If you can read this, EmailJS is configured correctly for the PostGrad Portal. 🎉',
    action_url:  'https://postgrad-portal.web.app',
    action_text: 'Open Portal',
  },
};

console.log(`\n📧  Sending test email to ${TEST_EMAIL} …\n`);

try {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  const text = await res.text();

  if (res.ok && text === 'OK') {
    console.log('✅  Email sent successfully!  Check the inbox of', TEST_EMAIL);
  } else {
    console.error(`❌  EmailJS returned ${res.status}: ${text}`);
    if (text.includes('service ID not found')) {
      console.error('   → Make sure you created an Email Service in the EmailJS dashboard.');
    }
    if (text.includes('Invalid template')) {
      console.error('   → The template ID is wrong. Check Email Templates in the dashboard.');
    }
  }
} catch (err) {
  console.error('❌  Network error:', err.message);
}
