# EmailJS Setup Guide — PostGrad Portal

This guide walks you through connecting EmailJS so the Portal can send
email notifications (submission alerts, approval notices, deadline reminders, etc.).

**Free tier:** 200 emails / month, 2 templates. Enough for testing & small
departments.

---

## 1. Connect an Email Service

1. Open <https://dashboard.emailjs.com/admin>
2. Click **Email Services → Add New Service**.
3. Choose your provider:
   - **Gmail** (easiest for testing) – click *Connect Account*, sign in with a
     Google account, grant permission.
   - Or choose Outlook / SMTP / etc.
4. Name the service something like `postgrad_portal`.
5. Click **Create Service**.
6. Copy the **Service ID** shown (e.g. `service_abc1234`) → you'll need it in
   step 3 below.

---

## 2. Create a Notification Template

1. In the dashboard go to **Email Templates → Create New Template**.
2. Set **Template Name** to `portal_notification`.
3. Paste the following content into the template editor:

### Subject line

```
{{subject}}
```

### Body (HTML mode recommended)

```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <h2 style="color:#2563eb;">PostGrad Portal</h2>
  <p>Dear {{to_name}},</p>
  <div style="white-space:pre-line;">{{message}}</div>
  <br/>
  <a href="{{action_url}}"
     style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;
            text-decoration:none;border-radius:6px;">
    {{action_text}}
  </a>
  <hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb;"/>
  <p style="font-size:12px;color:#6b7280;">
    This email was sent by {{from_name}}. If you did not expect this message,
    please ignore it.
  </p>
</div>
```

4. In the **To Email** field, set it to `{{to_email}}`.
5. Set **From Name** to `{{from_name}}`.
6. Click **Save**.
7. Copy the **Template ID** (e.g. `template_xyz789`).

---

## 3. Update your `.env` file

Open `.env` in the project root and fill in the values:

```
VITE_EMAILJS_SERVICE_ID=service_abc1234      ← Step 1
VITE_EMAILJS_TEMPLATE_ID=template_xyz789     ← Step 2
VITE_EMAILJS_PUBLIC_KEY=0yphGpdy-Ur4p6xpl    ← Already set
```

> **Important:** Restart the Vite dev server (`Ctrl+C` then `npm run dev`) after
> changing `.env`.

---

## 4. Verify everything works

Run the included test script:

```bash
node scripts/test-emailjs.mjs
```

Or in the browser console while the app is running:

```js
import('/src/services/emailService.js').then(m =>
  m.sendEmail({
    toEmail: 'your-email@example.com',
    toName: 'Test User',
    subject: 'PostGrad Portal Test',
    message: 'If you see this, EmailJS is working!',
  })
).then(console.log);
```

---

## 5. Template variables reference

| Variable         | Description                        | Example                         |
|------------------|------------------------------------|---------------------------------|
| `{{to_email}}`   | Recipient email                    | student@uwc.ac.za              |
| `{{to_name}}`    | Recipient name                     | Jane Doe                        |
| `{{from_name}}`  | Sender / system name               | PostGrad Portal                 |
| `{{subject}}`    | Email subject line                 | Request Approved: MSc Proposal  |
| `{{message}}`    | Main body text (supports newlines) | Dear Jane, ...                  |
| `{{action_url}}` | Call-to-action link                | https://yoursite.com/requests   |
| `{{action_text}}`| Button text                        | View Request                    |

---

## Troubleshooting

| Symptom                        | Fix                                                                                  |
|--------------------------------|--------------------------------------------------------------------------------------|
| Console: `[Email] Not configured` | One or more env vars are empty. Check `.env` and restart Vite.                    |
| `The service ID not found`     | Service ID is wrong or the email service was deleted. Re-create in dashboard.        |
| `Recipients address is empty`  | The `to_email` variable is not set in the template **To Email** field.               |
| `Invalid template`             | Template ID is wrong. Check **Email Templates** in dashboard.                        |
| Emails going to spam           | With Gmail, go to dashboard → service settings → enable **"Send on behalf of me"**.  |

---

## Firebase Storage reminder

Firebase Storage is required for file/PDF uploads but hasn't been enabled yet.

1. Go to <https://console.firebase.google.com/project/pg-portal1/storage>
2. Click **Get Started** → accept defaults (production rules are already in `storage.rules`).
3. Deploy rules:
   ```bash
   firebase deploy --only storage --project pg-portal1
   ```
