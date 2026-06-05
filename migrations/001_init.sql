CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  email_address TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  referral_name TEXT,
  ghs_amount REAL NOT NULL,
  rmb_amount REAL NOT NULL,
  reference_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Pending',
  submitted_at TEXT NOT NULL,
  qr_url TEXT,
  qr_data_uri TEXT,
  qr_image BLOB,
  qr_mime TEXT,
  user_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_reference_code ON orders (reference_code);
CREATE INDEX IF NOT EXISTS idx_orders_submitted_at ON orders (submitted_at);

CREATE TABLE IF NOT EXISTS rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL UNIQUE CHECK(type IN ('standard', 'low_rmb')),
  value REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rates_type ON rates (type);
