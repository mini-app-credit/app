export const PLATFORMS = {
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  YOUTUBE: 'youtube',
  LINKEDIN: 'linkedin',
} as const;

export type Platform = (typeof PLATFORMS)[keyof typeof PLATFORMS];
