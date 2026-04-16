import { Result } from "../types";

export const as = <T, R>(value: T): Result<R> => {
  try {
    return [null, value as unknown as R];
  }
  catch (error) {
    return [error instanceof Error ? error : new Error('Unknown error'), null];
  }
};
