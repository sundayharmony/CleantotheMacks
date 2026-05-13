/**
 * Email notification utility for Clean to the Macks.
 *
 * Uses the Resend API (https://resend.com) for transactional email.
 *
 * Required for real delivery:
 * - RESEND_API_KEY — API key from Resend.
 * - EMAIL_FROM — Must use an address on a domain you have verified in Resend
 *   (Dashboard → Domains). Sending from @cleantothemacks.com before DNS
 *   verification completes causes 550 / “domain is not verified” bounces.
 * - ADMIN_EMAIL — Inbox that receives new booking alerts and other admin mail.
 *
 * Optional:
 * - BOOKING_REPLY_TO — Reply-To on client-facing booking mail (defaults to ADMIN_EMAIL).
 *
 * If RESEND_API_KEY is not set, sends are skipped and logged so the app never crashes.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Clean to the Macks <noreply@cleantothemacks.com>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "sales@sundayharmony.com";
const BOOKING_REPLY_TO = process.env.BOOKING_REPLY_TO || ADMIN_EMAIL;

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  /** Resend `reply_to` — where “Reply” in the mail client should go */
  replyTo?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function logResendFailure(status: number, errBody: string) {
  let message = errBody;
  let hint = "";
  try {
    const parsed = JSON.parse(errBody) as { message?: string };
    if (parsed?.message) message = parsed.message;
    const lower = message.toLowerCase();
    if (lower.includes("domain") && lower.includes("verif")) {
      hint =
        " Verify cleantothemacks.com (or your chosen domain) in Resend: https://resend.com/domains — then set EMAIL_FROM to an address on that domain.";
    } else if (lower.includes("from") || lower.includes("sender")) {
      hint = " Check EMAIL_FROM matches a verified domain and allowed sender in Resend.";
    }
  } catch {
    /* errBody was not JSON */
  }
  console.error(`[EMAIL] Resend HTTP ${status}:`, message, hint || "");
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error(
      "[EMAIL] Skipped send (RESEND_API_KEY is not set). Subject:",
      payload.subject,
      "To:",
      payload.to,
      "— Set RESEND_API_KEY in the host environment (e.g. Vercel → Settings → Environment Variables).",
    );
    return false;
  }

  try {
    const body: Record<string, unknown> = {
      from: EMAIL_FROM,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
    };
    if (payload.replyTo) body.reply_to = payload.replyTo;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      logResendFailure(res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[EMAIL] Network or unexpected error:", err);
    return false;
  }
}

/* ─── Wrapper helper for branded HTML ─── */

const EMAIL_FONT_STACK =
  "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;background:#f9fafb;color:#111;font-family:${EMAIL_FONT_STACK};">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <strong style="font-size:20px;color:#111;">Clean to the Macks</strong>
    </div>
    ${body}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
      Clean to the Macks &mdash; Reliable residential cleaning
    </div>
  </div>
</body>
</html>`;
}

/* ─── Notification functions ─── */

/** Sent to client + admin when a new booking request is submitted (pre-approval) */
export async function notifyNewBooking(booking: {
  name: string;
  email: string;
  address: string;
  homeSize: string;
  date?: string | null;
  notes?: string | null;
}) {
  if (!RESEND_API_KEY) {
    console.error(
      "[EMAIL] notifyNewBooking: RESEND_API_KEY is not set — client and admin booking emails were not sent. Configure it on your host (e.g. Vercel).",
    );
    return;
  }

  const safeName = escapeHtml(booking.name);
  const safeEmail = escapeHtml(booking.email);
  const safeAddress = escapeHtml(booking.address);
  const safeHomeSize = escapeHtml(booking.homeSize);
  const safeDate = booking.date ? escapeHtml(booking.date) : null;
  const safeNotes = booking.notes ? escapeHtml(booking.notes) : null;

  const clientHtml = wrap(`
      <h2 style="color: #111; font-size: 18px;">Thanks, ${safeName} — we got your request!</h2>
      <p style="color: #374151; line-height: 1.6;">
        Your booking request has been received and is <strong>pending confirmation</strong>.
        We'll review it shortly and send a separate confirmation email once your appointment is approved.
      </p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Address:</strong> ${safeAddress}</p>
        <p style="margin: 4px 0;"><strong>Home size:</strong> ${safeHomeSize}</p>
        ${safeDate ? `<p style="margin: 4px 0;"><strong>Requested time:</strong> ${safeDate}</p>` : ""}
        ${safeNotes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${safeNotes}</p>` : ""}
      </div>
      <p style="color: #374151; line-height: 1.6;">If anything looks wrong or you have questions, just reply to this email.</p>
    `);

  const adminHtml = wrap(`
      <h2 style="color: #111; font-size: 18px;">New Booking Request</h2>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Client:</strong> ${safeName} (${safeEmail})</p>
        <p style="margin: 4px 0;"><strong>Address:</strong> ${safeAddress}</p>
        <p style="margin: 4px 0;"><strong>Home size:</strong> ${safeHomeSize}</p>
        ${safeDate ? `<p style="margin: 4px 0;"><strong>Requested time:</strong> ${safeDate}</p>` : ""}
        ${safeNotes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${safeNotes}</p>` : ""}
      </div>
      <p style="color: #374151;">Log in to the admin dashboard to approve, assign a cleaner, or cancel.</p>
    `);

  const [clientOk, adminOk] = await Promise.all([
    sendEmail({
      to: booking.email,
      subject: "Booking request received - Clean to the Macks",
      html: clientHtml,
      replyTo: BOOKING_REPLY_TO,
    }),
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `New Booking Request from ${booking.name}`,
      html: adminHtml,
      replyTo: booking.email,
    }),
  ]);

  if (!clientOk) {
    console.error("[EMAIL] Client booking receipt was not sent. Check Resend logs and EMAIL_FROM / domain verification.");
  }
  if (!adminOk) {
    console.error("[EMAIL] Admin booking alert was not sent. Check ADMIN_EMAIL and Resend configuration.");
  }
}

/** Sent to client when admin approves their request (status NEW -> CONFIRMED) */
export async function notifyBookingConfirmed(data: {
  clientName: string;
  clientEmail: string;
  scheduledDate?: string | null;
  address?: string | null;
  serviceType?: string | null;
}) {
  const safeName = escapeHtml(data.clientName);
  const safeDate = data.scheduledDate ? escapeHtml(data.scheduledDate) : null;
  const safeAddress = data.address ? escapeHtml(data.address) : null;
  const safeService = data.serviceType ? escapeHtml(data.serviceType) : null;

  await sendEmail({
    to: data.clientEmail,
    subject: "Your appointment is confirmed - Clean to the Macks",
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">You're all set, ${safeName}!</h2>
      <p style="color: #374151; line-height: 1.6;">
        Your appointment with Clean to the Macks has been <strong>confirmed</strong>.
        Here are the details:
      </p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        ${safeDate ? `<p style="margin: 4px 0;"><strong>When:</strong> ${safeDate}</p>` : ""}
        ${safeService ? `<p style="margin: 4px 0;"><strong>Service:</strong> ${safeService}</p>` : ""}
        ${safeAddress ? `<p style="margin: 4px 0;"><strong>Address:</strong> ${safeAddress}</p>` : ""}
      </div>
      <p style="color: #374151; line-height: 1.6;">
        <strong>What to expect:</strong> our crew will arrive within a 15-minute window of your start time.
        Please make sure we can access the property and let us know if anything has changed.
      </p>
      <p style="color: #374151; line-height: 1.6;">
        Need to make a change? Just reply to this email.
      </p>
    `),
  });
}

/** Sent to client when admin changes their appointment date/time */
export async function notifyBookingRescheduled(data: {
  clientName: string;
  clientEmail: string;
  oldScheduledDate?: string | null;
  newScheduledDate: string;
  address?: string | null;
}) {
  const safeName = escapeHtml(data.clientName);
  const safeOld = data.oldScheduledDate ? escapeHtml(data.oldScheduledDate) : null;
  const safeNew = escapeHtml(data.newScheduledDate);
  const safeAddress = data.address ? escapeHtml(data.address) : null;

  await sendEmail({
    to: data.clientEmail,
    subject: "Your appointment time has changed - Clean to the Macks",
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">Hi ${safeName},</h2>
      <p style="color: #374151; line-height: 1.6;">
        We've updated the time of your upcoming appointment.
      </p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        ${safeOld ? `<p style="margin: 4px 0;"><strong>Previous time:</strong> ${safeOld}</p>` : ""}
        <p style="margin: 4px 0;"><strong>New time:</strong> ${safeNew}</p>
        ${safeAddress ? `<p style="margin: 4px 0;"><strong>Address:</strong> ${safeAddress}</p>` : ""}
      </div>
      <p style="color: #374151; line-height: 1.6;">
        If this new time doesn't work for you, just reply to this email and we'll find another slot.
      </p>
    `),
  });
}

/** Sent to cleaner when a job is assigned to them */
export async function notifyJobAssigned(data: {
  cleanerName: string;
  cleanerEmail: string;
  clientName: string;
  address: string;
  homeSize: string;
  date?: string | null;
}) {
  await sendEmail({
    to: data.cleanerEmail,
    subject: "New Job Assigned - Clean to the Macks",
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">Hi ${data.cleanerName}, you have a new job!</h2>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Client:</strong> ${data.clientName}</p>
        <p style="margin: 4px 0;"><strong>Address:</strong> ${data.address}</p>
        <p style="margin: 4px 0;"><strong>Home size:</strong> ${data.homeSize}</p>
        ${data.date ? `<p style="margin: 4px 0;"><strong>Date:</strong> ${data.date}</p>` : ""}
      </div>
      <p style="color: #374151; line-height: 1.6;">Log in to your cleaner dashboard for full details.</p>
    `),
  });
}

/** Sent to client when their job is completed */
export async function notifyJobCompleted(data: {
  clientName: string;
  clientEmail: string;
  address: string;
  completionNotes?: string | null;
}) {
  await sendEmail({
    to: data.clientEmail,
    subject: "Cleaning Complete! - Clean to the Macks",
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">Your home is sparkling, ${data.clientName}!</h2>
      <p style="color: #374151; line-height: 1.6;">We've finished cleaning at <strong>${data.address}</strong>.</p>
      ${data.completionNotes ? `<div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;"><p style="margin: 0;"><strong>Notes from your cleaner:</strong> ${data.completionNotes}</p></div>` : ""}
      <p style="color: #374151; line-height: 1.6;">We hope everything looks great! If you'd like to leave feedback or book your next cleaning, visit your client portal.</p>
    `),
  });
}

/** Sent to client when they register for the portal */
export async function notifyClientRegistered(data: {
  name: string;
  email: string;
}) {
  await sendEmail({
    to: data.email,
    subject: "Welcome to Clean to the Macks!",
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">Welcome, ${data.name}!</h2>
      <p style="color: #374151; line-height: 1.6;">Your client portal account has been created. You can now:</p>
      <ul style="color: #374151; line-height: 1.8;">
        <li>View upcoming and past bookings</li>
        <li>Rebook with one click</li>
        <li>Manage your profile</li>
      </ul>
      <p style="color: #374151;">Thanks for choosing Clean to the Macks!</p>
    `),
  });
}

/** Sent to cleaner when admin creates their account / sets password */
export async function notifyCleanerWelcome(data: {
  name: string;
  email: string;
}) {
  await sendEmail({
    to: data.email,
    subject: "Your Cleaner Account - Clean to the Macks",
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">Welcome to the team, ${data.name}!</h2>
      <p style="color: #374151; line-height: 1.6;">You now have access to the cleaner dashboard where you can view your assigned jobs, update job status, and add completion notes.</p>
      <p style="color: #374151; line-height: 1.6;">Visit the cleaner portal and set your password to get started.</p>
    `),
  });
}

/** Sent to admin when a job is marked completed */
export async function notifyAdminJobCompleted(data: {
  cleanerName: string;
  clientName: string;
  address: string;
  totalPay?: number | null;
}) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Job Completed - ${data.clientName} (${data.address})`,
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">Job Completed</h2>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Cleaner:</strong> ${data.cleanerName}</p>
        <p style="margin: 4px 0;"><strong>Client:</strong> ${data.clientName}</p>
        <p style="margin: 4px 0;"><strong>Address:</strong> ${data.address}</p>
        ${data.totalPay ? `<p style="margin: 4px 0;"><strong>Total pay:</strong> $${data.totalPay.toFixed(2)}</p>` : ""}
      </div>
    `),
  });
}

/** Sent to a client when their appointment is canceled */
export async function notifyBookingCanceled(data: {
  clientName: string;
  clientEmail: string;
  scheduledDate?: string | null;
  reason?: string | null;
}) {
  const safeName = escapeHtml(data.clientName);
  const safeDate = data.scheduledDate ? escapeHtml(data.scheduledDate) : null;
  const safeReason = data.reason ? escapeHtml(data.reason) : null;

  await sendEmail({
    to: data.clientEmail,
    subject: "Appointment Canceled - Clean to the Macks",
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">Hi ${safeName},</h2>
      <p style="color: #374151; line-height: 1.6;">
        Your appointment with Clean to the Macks has been canceled.
      </p>
      ${safeDate ? `<p style="color: #374151; line-height: 1.6;"><strong>Original time:</strong> ${safeDate}</p>` : ""}
      ${safeReason ? `<div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;"><p style="margin: 0;"><strong>Reason:</strong> ${safeReason}</p></div>` : ""}
      <p style="color: #374151; line-height: 1.6;">
        Need to rebook? Visit our booking page to choose a new time, or just reply to this email.
      </p>
    `),
  });
}

/** Sent to a client when a video release needs signature */
export async function notifyVideoReleaseRequest(data: {
  clientName: string;
  clientEmail: string;
  propertyAddress?: string | null;
  signingUrl: string;
  expiresAtText: string;
}) {
  const safeName = escapeHtml(data.clientName);
  const safeAddress = data.propertyAddress ? escapeHtml(data.propertyAddress) : null;
  const safeUrl = escapeHtml(data.signingUrl);

  await sendEmail({
    to: data.clientEmail,
    subject: "Video Release Form - Signature Requested",
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">Hi ${safeName},</h2>
      <p style="color: #374151; line-height: 1.6;">
        Please review and electronically sign the video release form so we can share media from your service.
      </p>
      ${safeAddress ? `<p style="color: #374151; line-height: 1.6;"><strong>Property:</strong> ${safeAddress}</p>` : ""}
      <p style="margin: 20px 0;">
        <a href="${safeUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 8px; background: #2563eb; color: #fff; text-decoration: none; font-weight: 600;">
          Review and Sign Form
        </a>
      </p>
      <p style="color: #6b7280; font-size: 13px;">
        This secure link expires on ${escapeHtml(data.expiresAtText)}.
      </p>
    `),
  });
}
