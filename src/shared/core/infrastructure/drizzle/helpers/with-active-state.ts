import { eq } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { ENTITY_STATES } from 'src/shared/core/domain/constants/entity-state';

export const withActiveState = (stateColumn: PgColumn) =>
  eq(stateColumn, ENTITY_STATES.ACTIVE);
