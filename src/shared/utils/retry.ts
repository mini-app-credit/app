export interface RetryOptions {
  attempts?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
}

const withRetry = async (
  fn: () => Promise<unknown>,
  options: Required<NonNullable<RetryOptions>> & { attempts: number },
): Promise<unknown> => {
  try {
    return await fn();
  } catch (error) {
    if (options.attempts <= 1) {
      throw error;
    }

    const delay = Math.min(
      options.maxTimeout,
      options.minTimeout * Math.pow(options.factor, options.attempts - 1),
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    return withRetry(fn, {
      ...options,
      attempts: options.attempts - 1,
    });
  }
};

export { withRetry };
