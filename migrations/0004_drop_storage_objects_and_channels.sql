-- Drop legacy tables no longer used by the app schema (drizzle push removes them on fresh DBs; this cleans existing DBs).
DROP TABLE IF EXISTS storage_objects CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
