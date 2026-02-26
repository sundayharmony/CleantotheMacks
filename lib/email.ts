/**
 * Email notification utility for Clean to the Macks.
 *
 * Uses the Resend API (https://resend.com) for transactional email.
 * Set RESEND_API_KEY and EMAIL_FROM in your environment variables.
 *
 * If RESEND_API_KEY is not set, emails are logged to the console instead
 * of being sent, so the app never crashes due to missing email config.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Clean to the Macks <noreply@cleantothemacks.com>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "sales@sundayharmony.com";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("[EMAIL STUB]", payload.subject, "->", payload.to);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[EMAIL ERROR]", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[EMAIL ERROR]", err);
    return false;
  }
}

/* ─── Wrapper helper for branded HTML ─── */

function wrap(body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <strong style="font-size: 20px; color: #111;">Clean to the Macks</strong>
      </div>
      ${body}
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
        Clean to the Macks &mdash; Reliable residential cleaning
      </div>
    </div>
  `;
}

/* ─── Notification functions ─── */

/** Sent to client + admin when a new booking is created */
export async function notifyNewBooking(booking: {
  name: string;
  email: string;
  address: string;
  homeSize: string;
  date?: string | null;
  notes?: string | null;
}) {
  // Email to client
  await sendEmail({
    to: booking.email,
    subject: "Booking Confirmed - Clean to the Macks",
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">Thank you, ${booking.name}!</h2>
      <p style="color: #374151; line-height: 1.6;">Your cleaning booking has been received. Here are the details:</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Address:</strong> ${booking.address}</p>
        <p style="margin: 4px 0;"><strong>Home size:</strong> ${booking.homeSize}</p>
        ${booking.date ? `<p style="margin: 4px 0;"><strong>Preferred date:</strong> ${booking.date}</p>` : ""}
        ${booking.notes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${booking.notes}</p>` : ""}
      </div>
      <p style="color: #374151; line-height: 1.6;">We'll confirm your appointment shortly. If you have questions, just reply to this email.</p>
    `),
  });

  // Email to admin
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Booking from ${booking.name}`,
    html: wrap(`
      <h2 style="color: #111; font-size: 18px;">New Booking Received</h2>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Client:</strong> ${booking.name} (${booking.email})</p>
        <p style="margin: 4px 0;"><strong>Address:</strong> ${booking.address}</p>
        <p style="margin: 4px 0;"><strong>Home size:</strong> ${booking.homeSize}</p>
        ${booking.date ? `<p style="margin: 4px 0;"><strong>Preferred date:</strong> ${booking.date}</p>` : ""}
        ${booking.notes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${booking.notes}</p>` : ""}
      </div>
      <p style="color: #374151;">Log in to the admin dashboard to review and assign a cleaner.</p>
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
