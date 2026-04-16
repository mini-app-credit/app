export const IAM_EVENT_NAMES = {
  USER_LOGGED_IN: 'event.iam.user:logged-in',
  USER_SIGN_UP: 'event.iam.user:sign-up',
  EMAIL_VERIFIED: 'event.iam.email:verified',
  INVOKE_EMAIL_VERIFICATION: 'event.iam.email:invoke-email-verification',
  USER_LOGGED_OUT: 'event.iam.user:logged-out',
  PASSWORD_RESET_REQUESTED: 'event.iam.password:reset-requested',
  PASSWORD_RESET_COMPLETED: 'event.iam.password:reset-completed',
} as const;
