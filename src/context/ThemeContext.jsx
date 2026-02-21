import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const fallbackThemeContext = {
    theme: 'light',
    toggleTheme: () => { },
    language: 'en',
    changeLanguage: () => { },
    t: (key) => translations?.en?.[key] || key,
};

const ThemeContext = createContext(fallbackThemeContext);

export const useTheme = () => useContext(ThemeContext) || fallbackThemeContext;

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(sessionStorage.getItem('theme') || 'light');
    const [language, setLanguage] = useState(sessionStorage.getItem('language') || 'en');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        sessionStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', language);
        sessionStorage.setItem('language', language);
    }, [language]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const changeLanguage = (lang) => {
        setLanguage(lang);
    };

    const t = (key, replacements = {}) => {
        if (!translations[language]) {
            console.warn(`Translation language '${language}' not found.`);
            return key;
        }
        let text = translations[language][key] || key;

        if (replacements && typeof replacements === 'object') {
            Object.entries(replacements).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, v);
            });
        }

        return text;
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, language, changeLanguage, t }}>
            {children}
        </ThemeContext.Provider>
    );
};
