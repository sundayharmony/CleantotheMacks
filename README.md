This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment

Copy `.env.example` to `.env` and fill in values. At minimum for local development:

```
DATABASE_URL="file:./dev.db"
```

### Booking email (Resend)

New bookings trigger two messages: a receipt to the client and an alert to your team. Both go through [Resend](https://resend.com).

**Gmail “Send mail as,” ImprovMX forwarding, and DNS (e.g. Hostinger)** are documented in [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md) (Path A: DNS that supports Resend `send` records; Path B: Gmail send-through if DNS is limited).

1. Create a Resend account and an API key; set `RESEND_API_KEY` in `.env` (and in your host’s environment variables, e.g. Vercel).
2. **Verify your domain** in Resend: [Domains](https://resend.com/domains) → add `cleantothemacks.com` → add the DNS records they show (SPF/DKIM and the `send` MX/SPF for sending). Until this shows **Verified**, Resend will reject mail from `@cleantothemacks.com` with errors like *domain is not verified* (550). Add those records in **your DNS host** (e.g. Hostinger); see [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md).
3. Set `EMAIL_FROM` to a sender on that verified domain, for example: `Clean to the Macks <booking@cleantothemacks.com>`.
4. Set `ADMIN_EMAIL` to the inbox where you want **new booking request** notifications (this is separate from Gmail “Send mail as”; the app sends via Resend, not through your Gmail SMTP). If unset, the code falls back to a placeholder address — always set this on **Vercel** for production.
5. After changing env vars on Vercel, **redeploy** (or wait for the next deployment) so the server picks up `RESEND_API_KEY` and `ADMIN_EMAIL`. Without `RESEND_API_KEY`, booking requests still save but **no emails are sent** (check Vercel → Deployment → Logs for `[EMAIL]` lines).

Optional: `BOOKING_REPLY_TO` sets the **Reply-To** on the client receipt (defaults to `ADMIN_EMAIL`).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
