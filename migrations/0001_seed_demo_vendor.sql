-- Demo vendor for credit applications (frontend DEMO_VENDOR_ID); required for FK applications.vendor_id -> users.id
INSERT INTO users (id, unit_amount, role, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 10000, 'vendor', now(), now())
ON CONFLICT (id) DO NOTHING;
