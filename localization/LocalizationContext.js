import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

// Import language files
import en from './en';
import vi from './vi';

// Create the context
const LocalizationContext = createContext();

// Available languages
const languages = {
  en,
  vi
};

// Provider component
export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState('vi'); // Default to Vietnamese
  const [translations, setTranslations] = useState(languages.vi);

  // Load saved language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const userSettings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
        if (userSettings) {
          const { language } = JSON.parse(userSettings);
          if (language && languages[language]) {
            setLocale(language);
            setTranslations(languages[language]);
          }
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguage();
  }, []);

  // Function to change language
  const changeLanguage = async (language) => {
    if (!language || !languages[language]) {
      console.warn('Invalid language code');
      return false;
    }

    try {
      setLocale(language);
      setTranslations(languages[language]);

      // Save language preference
      const userSettings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      if (userSettings) {
        const settings = JSON.parse(userSettings);
        settings.language = language;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
      }

      return true;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
    }
  };

  // Translation function
  const t = (key, params = {}) => {
    if (!key) {
      console.warn('Translation key is required');
      return '';
    }

    // Split the key by dots to access nested properties
    const keys = key.split('.');
    let value = translations;

    // Navigate through the nested properties
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // If the value is not a string, return it as is
    if (typeof value !== 'string') {
      return value;
    }

    // Replace parameters in the string
    let result = value;
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      result = result.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
    });

    return result;
  };

  // Get current language
  const getCurrentLanguage = () => locale;

  // Context value
  const contextValue = {
    t,
    changeLanguage,
    getCurrentLanguage,
    locale
  };

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
};

// Custom hook to use the localization context
export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
