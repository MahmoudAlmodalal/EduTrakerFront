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

const pad2 = (value) => String(value).padStart(2, '0');

export const toLocalIsoDate = (input = new Date()) => {
    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

export const todayIsoDate = () => toLocalIsoDate(new Date());
