CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name varchar(255) NOT NULL,
  template_path varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_email_templates_event_name ON email_templates (event_name);

-- Sign-up does not get a separate welcome email: NatsAuth publishes
-- event.iam.email:invoke-email-verification which maps to auth/verify-email.
INSERT INTO email_templates (event_name, template_path)
VALUES
  ('event.iam.email:invoke-email-verification', 'auth/verify-email'),
  ('event.iam.email:verified', 'auth/welcome'),
  ('event.iam.password:reset-requested', 'auth/reset-password'),
  ('event.notifications.publication:published', 'publications/published'),
  ('event.notifications.publication:failed', 'publications/failed')
ON CONFLICT (event_name) DO UPDATE
SET
  template_path = EXCLUDED.template_path,
  updated_at = now();
