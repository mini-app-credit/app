export const ENTITY_STATES = {
  ACTIVE: 'active',
  DELETED: 'deleted',
} as const;

export type EntityState = (typeof ENTITY_STATES)[keyof typeof ENTITY_STATES];
