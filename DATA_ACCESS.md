# Trade RMB — data access guide

This site uses a **split database**:

| Data | Storage |
|------|---------|
| **User accounts** (sign-up, sign-in, profile, passwords) | **Airtable** `USERS` table |
| **Orders + Alipay QR images** | **Turso** `orders` table |
| **Live exchange rate** | **Turso** `app_settings` |

## Quick reference

| What you need | Where it lives | How to access |
|---------------|----------------|---------------|
| Customer orders & QR | Turso `orders` | `/admin/orders` (ops) or user **Dashboard** when signed in |
| Live GHS→RMB rate | Turso `app_settings` | Triple-tap rate on home, or Turso SQL |
| User accounts | Airtable `USERS` | [airtable.com](https://airtable.com) → your base |
| Sign in / Dashboard | NextAuth + Airtable | `/auth/signin`, `/dashboard` |
| Fallback rate (dev) | `.env` `DEFAULT_EXCHANGE_RATE` | `.env.local` |

---

## 1. Turso database (orders + rate)

### Setup

1. Create a database at [https://turso.tech](https://turso.tech).
2. Copy **Database URL** and **Auth Token** into `.env.local`:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

3. Run the app once (`npm run dev`) — migrations create tables automatically.

### Tables

**`orders`** — every trade submitted on `/purchase`:

- `customer_name`, `email_address`, `mobile_number`, `referral_name`
- `ghs_amount`, `rmb_amount`, `reference_code`, `status`
- `submitted_at`, `qr_url` / `qr_data_uri` / `qr_image` (Alipay QR)
- `user_id` (if logged in)

**`app_settings`** — site configuration:

- Key `single_exchange_rate` → **RMB per 1 GHS** stored in DB. Set to **`0`** to show “Rate will be posted soon” and pause trades. Display on site: **1 RMB = X GHS** (where X = 1 ÷ stored value).

**`rates`** — legacy table (standard / low_rmb). The live site does **not** use this anymore; keep for old data only.

### Turso dashboard (SQL)

1. Open your database in the Turso console.
2. Run:

```sql
-- All orders, newest first
SELECT id, reference_code, customer_name, mobile_number,
       ghs_amount, rmb_amount, status, submitted_at
FROM orders
ORDER BY submitted_at DESC
LIMIT 50;

-- Current exchange rate
SELECT value, updated_at
FROM app_settings
WHERE key = 'single_exchange_rate';
```

### In-app order admin

1. Set a strong key in `.env.local`:

```env
ADMIN_ORDERS_KEY=your-long-secret-key
```

2. Visit **`/admin/orders`**.
3. Enter the same key when prompted (sent as `x-admin-key` to `/api/admin/orders`).
4. View orders, update status, export data.

---

## 2. Exchange rate (what visitors see)

**Priority:**

1. Turso `app_settings.single_exchange_rate` (set via rate portal)
2. `DEFAULT_EXCHANGE_RATE` in `.env` (useful for local dev)
3. Otherwise the site shows “rate unavailable”

### Rate portal (no Turso UI needed)

On the **home page**, tap the **live rate** card **5 times** quickly to open rate control (marked **Admins only** in the dialog).

Env (required for portal):

```env
RATE_PORTAL_USERNAME=admin
RATE_PORTAL_PASSWORD=your-secure-password
RATE_ADMIN_SESSION_SECRET=random-32-char-string
```

API used internally: `POST /api/rate-admin/login`, `GET|PUT /api/rate-admin/rate`, public `GET /api/fetch-rate`.

---

## 3. Airtable (users only — kept)

Sign-up, sign-in, forgot password, and profile edits use the **USERS** table.

```env
AIRTABLE_BASE_ID=appXXXXXXXX
AIRTABLE_PERSONAL_ACCESS_TOKEN=pat...
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=long-random-string
```

### User flows

- **Register:** `/auth/signup` → `POST /api/auth/register` → creates row in Airtable `USERS`
- **Sign in:** `/auth/signin` → NextAuth checks email/username + bcrypt password in Airtable
- **Dashboard:** `/dashboard` → orders loaded from **Turso** by email + `User_ID` (linked when logged in during purchase)
- **Profile / delete:** Dashboard → `POST /api/user/update-profile` or `POST /api/user/delete` (sets `Status: inactive` in Airtable)

Open the base in Airtable to view or edit users manually. Required fields: `Full_Name`, `Username`, `Email`, `Phone`, `Password` (bcrypt hash), `User_ID`, `Status`.

Orders are **not** stored in Airtable anymore (only Turso).

---

## 4. Order submission flow

1. User completes **`/purchase`** → `POST /api/submit-order` (or equivalent order API in your repo).
2. Row inserted into Turso `orders`.
3. User lands on **`/confirmation`** with `reference_code`.
4. You fulfill the trade and update `status` via `/admin/orders` or SQL.

---

## 5. Local development checklist

```bash
cp .env.example .env.local
# Fill TURSO_*, ADMIN_ORDERS_KEY, Airtable if using auth, rate portal vars
npm install
npm run dev
```

Optional dev rate without opening the portal:

```env
DEFAULT_EXCHANGE_RATE=0.85
```

---

## 6. Scripts (optional)

- `npm run seed:rates` — legacy `rates` table only; prefer the rate portal or SQL on `app_settings`.
- `scripts/migrate-airtable-to-sqlite.ts` — one-time migration from old Airtable orders/rates.

For questions about env vars, see `.env.example`.
