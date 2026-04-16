export interface PromiseBatchResult<T> {
  value: T | null;
  error: Error | null;
}

export const promiseBatch = async <T>(
  tasks: (() => Promise<T>)[],
  concurrency = 5,
): Promise<PromiseBatchResult<T>[]> => {
  const results: PromiseBatchResult<T>[] = [];
  let index = 0;

  const run = async (): Promise<void> => {
    while (index < tasks.length) {
      const currentIndex = index++;
      try {
        const value = await tasks[currentIndex]();
        results[currentIndex] = { value, error: null };
      } catch (error) {
        results[currentIndex] = { value: null, error: error instanceof Error ? error : new Error(String(error)) };
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => run());
  await Promise.all(workers);

  return results;
};
