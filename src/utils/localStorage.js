export const saveToLocalStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Erreur localStorage (save):', error);
    }
};

export const loadFromLocalStorage = (key, defaultValue) => {
    try {
        const data = localStorage.getItem(key);
        if (data === null || data === '') {
            return defaultValue;
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur localStorage (load):', error);
        return defaultValue;
    }
};