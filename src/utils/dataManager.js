/**
 * Data Manager Utility
 * Manages loading and clearing localStorage data from JSON file
 */

// Import initial data - Vite handles JSON imports automatically
import initialData from '../data/initialData.json';

/**
 * Clear all localStorage data
 */
export const clearAllLocalStorage = () => {
    localStorage.clear();
    console.log('✅ All localStorage data cleared');
};

/**
 * Load initial data from JSON file to localStorage
 */
export const loadInitialData = () => {
    try {
        // Clear existing data first
        clearAllLocalStorage();
        
        // Load data from JSON file
        Object.keys(initialData).forEach(key => {
            localStorage.setItem(key, JSON.stringify(initialData[key]));
        });
        
        console.log('✅ Initial data loaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Error loading initial data:', error);
        return false;
    }
};

/**
 * Reset specific localStorage key
 */
export const resetKey = (key) => {
    if (initialData[key]) {
        localStorage.setItem(key, JSON.stringify(initialData[key]));
        console.log(`✅ ${key} reset successfully`);
        return true;
    }
    console.warn(`⚠️ Key ${key} not found in initial data`);
    return false;
};

/**
 * Get all localStorage keys used in the app
 */
export const getAllStorageKeys = () => {
    return Object.keys(initialData);
};

/**
 * Export current localStorage data as JSON
 */
export const exportLocalStorageData = () => {
    const data = {};
    Object.keys(parsedInitialData).forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                data[key] = JSON.parse(value);
            } catch (e) {
                data[key] = value;
            }
        }
    });
    return data;
};

/**
 * Import data to localStorage
 */
export const importLocalStorageData = (data) => {
    try {
        Object.keys(data).forEach(key => {
            localStorage.setItem(key, JSON.stringify(data[key]));
        });
        console.log('✅ Data imported successfully');
        return true;
    } catch (error) {
        console.error('❌ Error importing data:', error);
        return false;
    }
};

