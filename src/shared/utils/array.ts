export const unique = <T>(array: T[]): T[] => {
    return [...new Set(array)];
}

export const groupBy = <
  T extends Record<string, unknown> | unknown,
  K extends keyof T,
  V extends T[K] extends string | number | symbol ? T[K] : string,
>(
  items: T[],
  key: K,
) => {
    const grouped = {} as Record<V, T[]>;

    items.forEach(item => {
        const keyValue = ['string', 'number', 'symbol'].includes(typeof item[key])
            ? (item[key] as V)
            : (String(item[key]) as V);

        if (!grouped[keyValue]) {
            grouped[keyValue] = [];
        }

        grouped[keyValue].push(item);
    });

    return grouped;
};