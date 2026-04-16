export const deepReplace = (obj: object, withParams: Record<string, string | number | boolean | null>) => {
    return Object.keys(obj).reduce((acc, key) => {
        if(typeof obj[key] === 'object') {
            acc[key] = deepReplace(obj[key], withParams);
        } else {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
}

export const deepReplaceJSON = (obj: object, withParams: Record<string, string | number | boolean | null>) => {
    const stringified = JSON.stringify(obj);

    const replaced = stringified.replace(/{{(\w+)}}/g, (match, p1) => {
        const value = withParams[p1];
        if (value !== undefined) {
            return String(value);
        }
        return match;
    });

    return JSON.parse(replaced);
}

export const arrayToMap = <T>(array: T[], getId: (item: T) => string): Record<string, T> => {
    const map: Record<string, T> = {};

    array.forEach((item) => {
        const id = getId(item);

        if(id) {
            map[id] = item;
        }
    });

    return map;
}