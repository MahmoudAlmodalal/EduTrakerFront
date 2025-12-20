import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', language);
        localStorage.setItem('language', language);
    }, [language]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const changeLanguage = (lang) => {
        setLanguage(lang);
    };

    const t = (key) => {
        if (!translations[language]) {
            console.warn(`Translation language '${language}' not found.`);
            return key;
        }
        return translations[language][key] || key;
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, language, changeLanguage, t }}>
            {children}
        </ThemeContext.Provider>
    );
};
