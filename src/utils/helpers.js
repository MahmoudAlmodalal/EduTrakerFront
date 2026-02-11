export const toList = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (Array.isArray(value?.results)) {
        return value.results;
    }

    return [];
};

export const uniqueById = (items) => {
    const seen = new Set();
    return toList(items).filter((item) => {
        const key = item?.id;
        if (key === undefined || key === null) {
            return false;
        }
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

export const todayIsoDate = () => new Date().toISOString().split('T')[0];
