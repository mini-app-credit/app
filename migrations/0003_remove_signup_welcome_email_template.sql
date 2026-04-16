-- event.iam.user:sign-up no longer has a template; verification is sent via
-- event.iam.email:invoke-email-verification only (see 0002 comment).
DELETE FROM email_templates
WHERE event_name = 'event.iam.user:sign-up';
