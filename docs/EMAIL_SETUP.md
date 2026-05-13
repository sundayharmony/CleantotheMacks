# Clean to the Macks — Email (Gmail alias, Resend, ImprovMX)

## Current stack (chosen)

- **Receiving:** [ImprovMX](https://improvmx.com) — MX on `@` → `mx1.improvmx.com` / `mx2.improvmx.com`; SPF includes `include:spf.improvmx.com`.
- **Sending:** [Resend](https://resend.com) — API + optional Gmail SMTP; DKIM + **`send`** subdomain MX/SPF from the Resend domain page.
- **DNS:** Hostinger hPanel (nameservers Hostinger). Site stays on **Vercel** (apex `A` / `www` CNAME).

## Decision (Path A vs Path B)

**Use Path A** if you need all of the following:

- Transactional email from the Next.js app via the Resend API ([`lib/email.ts`](../lib/email.ts)) using `@cleantothemacks.com`
- Gmail **Send mail as** `contact@cleantothemacks.com` through **smtp.resend.com**
- Resend’s domain dashboard to show **Enable Sending** as fully verified

Some DNS panels (e.g. **Wix** in the past) could not add the **subdomain MX** Resend needs for `send`. Path A requires **DNS at a host that supports those records** (e.g. **Hostinger** hPanel, **Cloudflare**, or many registrars).

**Use Path B** if you need the Gmail alias working **quickly** and can migrate DNS later. Path B uses **Gmail’s own send path** for the alias and does not depend on Resend SMTP in Gmail. The app may still be unable to send via Resend until you complete Path A or fix DNS elsewhere.

---

## Path A — Move DNS + Resend + ImprovMX (recommended)

### 1. Choose a DNS host

Use **Cloudflare**, **Hostinger DNS**, or any provider that allows **MX on a subdomain** like `send`. Point the domain’s **nameservers** at that DNS host (at your registrar). The **website stays on Vercel**; only **where DNS is edited** changes.

### 2. Copy existing records into the new zone

Recreate everything you rely on today, including:

| Purpose | Typical records |
|--------|------------------|
| Website | Apex **A** (e.g. Vercel), **CNAME** `www` → Vercel |
| Search | **TXT** `google-site-verification=...` |
| Resend DKIM | **TXT** at `resend._domainkey` (value from Resend) |
| Optional DMARC | **TXT** at `_dmarc` |

### 3. Receiving — ImprovMX (apex MX + SPF)

**MX** for the **root / apex** domain `cleantothemacks.com` (host often `@` or blank):

| Priority | Host |
|----------|------|
| 10 | `mx1.improvmx.com` |
| 20 | `mx2.improvmx.com` |

Without these, **no mail is received** at `@cleantothemacks.com`, so ImprovMX cannot forward to Gmail.

**SPF** — only **one** TXT SPF line for the apex. Include ImprovMX (see [Combining SPF](https://improvmx.com/guides/combining-spf-records)) and any other senders you use. Example shape (verify includes against current ImprovMX + Google + Resend docs):

```txt
v=spf1 include:spf.improvmx.com include:_spf.google.com ~all
```

Add Resend’s required **include** only if their docs say it is needed for mail sent **from the root domain**; Resend often uses the `send` subdomain for outbound alignment—follow the **exact** strings in [Resend → Domains](https://resend.com/domains).

### 4. Sending — Resend (`send` subdomain)

In **Resend → Domains → your domain**, turn on **Enable Sending** and add **exactly** what Resend shows:

- **MX** for host `send` → target like `feedback-smtp.*.amazonses.com`, priority as shown
- **TXT** SPF for host `send` → Resend’s **exact** `v=spf1 include:...` (do **not** use Google’s SPF here)

After DNS propagates, Resend should show sending verification as **passed**.

### 5. Gmail — Send mail as

Keep **SMTP**: `smtp.resend.com`, port **587**, **TLS**, username **resend**, password = your **Resend SMTP** password from the Resend dashboard.

### 6. App environment

Set on Vercel / `.env`:

- `RESEND_API_KEY`
- `EMAIL_FROM` = e.g. `Clean to the Macks <noreply@cleantothemacks.com>` (must be on the verified domain)
- `ADMIN_EMAIL` = inbox for booking alerts

---

## Path B — Gmail send-through (no Resend SMTP in Gmail)

Use when you are **not** ready to move DNS.

1. **Gmail** → Settings → **Accounts and Import** → **Send mail as** → edit `contact@cleantothemacks.com`.
2. Switch from **custom SMTP** to **send through Gmail** (if available for your account).
3. Complete Google’s **verification email** to `contact@` — ImprovMX should forward it to your Gmail inbox.
4. **SPF (apex)** — one TXT record including at least ImprovMX and Google, e.g.:

   ```txt
   v=spf1 include:spf.improvmx.com include:_spf.google.com ~all
   ```

5. Remove the incorrect **`send`** subdomain TXT if you added Google’s SPF there for a failed Resend attempt and you are not using Resend for Gmail.

**Limitation:** Resend **API** mail from the app may still fail with “domain not verified” until Path A DNS is in place.

---

## Verification checklist

**Receiving**

- [ ] Apex MX points to `mx1.improvmx.com` / `mx2.improvmx.com` (in **authoritative** DNS — check with [mxtoolbox.com](https://mxtoolbox.com/) or `nslookup -type=mx cleantothemacks.com`).
- [ ] ImprovMX dashboard shows the domain active; send a test to `contact@` and confirm it hits Gmail.

**Sending (Path A + Resend SMTP)**

- [ ] Resend domain: **Enable Sending** green; no SPF/MX errors on `send`.
- [ ] From Gmail, send a test as `contact@` and confirm no bounce.

**Sending (Path B)**

- [ ] Mail sent as `contact@` without 550 from Resend; check headers if needed.

**App**

- [ ] `RESEND_API_KEY` and `EMAIL_FROM` set; test a booking or use Resend’s test send.

---

## DNS host limitations

If your DNS provider cannot add **MX on** `send.*`, Resend **Enable Sending** will stay broken until you use a provider that can (Hostinger, Cloudflare, etc.) or use **Path B** for Gmail only.
