// ============================================
// Email Notification Service (EmailJS)
// Client-side email – free tier: 200 emails/month
// ============================================
//
// This service sends transactional notifications via EmailJS.
// It uses a SINGLE general-purpose template that accepts:
//   {{to_email}}    – recipient address
//   {{to_name}}     – recipient display name
//   {{from_name}}   – sender / system name
//   {{subject}}     – dynamic email subject
//   {{message}}     – main body (plain text or simple HTML)
//   {{action_url}}  – call-to-action link
//   {{action_text}} – CTA button text  (default: "Open Portal")
//
// See docs/EMAILJS_SETUP.md for dashboard setup instructions.
// ============================================

import emailjs from '@emailjs/browser';

/* ── Configuration ── */
const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || '';

let initialized = false;

function ensureInit() {
  if (initialized || !PUBLIC_KEY) return;
  emailjs.init(PUBLIC_KEY);
  initialized = true;
}

/** Returns true if all three env vars are present. */
export function isEmailConfigured() {
  return !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

/**
 * Core send function. Silently skips when not configured.
 * @returns {{ sent: boolean, status?: number, error?: string, reason?: string }}
 */
export async function sendEmail({ toEmail, toName, subject, message, actionUrl, actionText }) {
  if (!isEmailConfigured()) {
    console.log('[Email] Not configured – skipping:', subject, '→', toEmail);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    ensureInit();
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_email:    toEmail,
      to_name:     toName  || 'User',
      from_name:   'PostGrad Portal',
      subject:     subject || 'PostGrad Portal Notification',
      message:     message || '',
      action_url:  actionUrl  || window.location.origin,
      action_text: actionText || 'Open Portal',
    });
    console.log('[Email] Sent →', toEmail, '| Status:', result.status);
    return { sent: true, status: result.status };
  } catch (err) {
    console.error('[Email] Send failed →', toEmail, err);
    return { sent: false, error: err?.text || err?.message || String(err) };
  }
}

// ══════════════════════════════════════════════════
// Pre-built workflow notification helpers
// ══════════════════════════════════════════════════

/** Student submits request → notify supervisor */
export function sendRequestSubmittedEmail(supervisorEmail, supervisorName, requestTitle, studentName) {
  return sendEmail({
    toEmail: supervisorEmail,
    toName:  supervisorName,
    subject: `New HD Request for Review: ${requestTitle}`,
    message:
      `Dear ${supervisorName},\n\n` +
      `${studentName} has submitted "${requestTitle}" for your review.\n\n` +
      `Please log in to the PostGrad Portal to review this request within the allocated timeframe.\n\n` +
      `Regards,\nPostGrad Portal`,
    actionUrl:  `${window.location.origin}/requests`,
    actionText: 'Review Request',
  });
}

/** Supervisor / committee approves → notify student */
export function sendRequestApprovedEmail(recipientEmail, recipientName, requestTitle, stage, approverName) {
  return sendEmail({
    toEmail: recipientEmail,
    toName:  recipientName,
    subject: `Request Approved: ${requestTitle}`,
    message:
      `Dear ${recipientName},\n\n` +
      `Your request "${requestTitle}" has been approved at the ${stage} stage` +
      (approverName ? ` by ${approverName}` : '') + `.\n\n` +
      `Please log in to the PostGrad Portal for details.\n\n` +
      `Regards,\nPostGrad Portal`,
    actionUrl:  `${window.location.origin}/tracker`,
    actionText: 'View Progress',
  });
}

/** Reviewer refers request back → notify student */
export function sendReferredBackEmail(recipientEmail, recipientName, requestTitle, reason, reviewerName) {
  return sendEmail({
    toEmail: recipientEmail,
    toName:  recipientName,
    subject: `Request Referred Back: ${requestTitle}`,
    message:
      `Dear ${recipientName},\n\n` +
      `The request "${requestTitle}" has been referred back` +
      (reviewerName ? ` by ${reviewerName}` : '') + `.\n\n` +
      `Reason:\n${reason}\n\n` +
      `Please log in and address the feedback within 24 hours.\n\n` +
      `Regards,\nPostGrad Portal`,
    actionUrl:  `${window.location.origin}/requests`,
    actionText: 'View Request',
  });
}

/** Senate Board approves → notify student (final stage) */
export function sendFinalApprovalEmail(studentEmail, studentName, requestTitle, referenceNumber) {
  return sendEmail({
    toEmail: studentEmail,
    toName:  studentName,
    subject: `Congratulations – Request Fully Approved: ${requestTitle}`,
    message:
      `Dear ${studentName},\n\n` +
      `Your request "${requestTitle}" has been fully approved by both the Faculty and Senate Higher Degrees Committees.\n\n` +
      (referenceNumber ? `Reference Number: ${referenceNumber}\n\n` : '') +
      `The final PDF document is available for download in the PostGrad Portal.\n\n` +
      `Regards,\nPostGrad Portal`,
    actionUrl:  `${window.location.origin}/tracker`,
    actionText: 'Download PDF',
  });
}

/** Supervisor nudges a student */
export function sendNudgeEmail(studentEmail, studentName, supervisorName, nudgeMessage) {
  return sendEmail({
    toEmail: studentEmail,
    toName:  studentName,
    subject: `Reminder from ${supervisorName}`,
    message:
      `Dear ${studentName},\n\n` +
      `${supervisorName} has sent you a reminder:\n\n` +
      `"${nudgeMessage}"\n\n` +
      `Please log in to the PostGrad Portal to take action.\n\n` +
      `Regards,\nPostGrad Portal`,
    actionUrl:  `${window.location.origin}/requests`,
    actionText: 'Open Portal',
  });
}

/** Automated deadline reminder */
export function sendDeadlineReminderEmail(recipientEmail, recipientName, requestTitle, hoursLeft) {
  return sendEmail({
    toEmail: recipientEmail,
    toName:  recipientName,
    subject: `Deadline Approaching: ${requestTitle}`,
    message:
      `Dear ${recipientName},\n\n` +
      `The review deadline for "${requestTitle}" is approaching – approximately ${hoursLeft} hour(s) remaining.\n\n` +
      `Please log in to the PostGrad Portal to complete your action.\n\n` +
      `Regards,\nPostGrad Portal`,
    actionUrl:  `${window.location.origin}/requests`,
    actionText: 'Take Action',
  });
}
