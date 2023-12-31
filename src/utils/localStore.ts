const set = (key: string, value: any) => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
};

function get<T>(key: string): T | undefined {
    if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        try {
            if (item != null) {
                return JSON.parse(item);
            }
        } catch (e) {
            console.error(e);
        }
    }
    return undefined;
}

export default {
    set,
    get,
};
