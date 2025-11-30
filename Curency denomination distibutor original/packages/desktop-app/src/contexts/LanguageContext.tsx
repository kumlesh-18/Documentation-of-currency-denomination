import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

export interface Translations {
  [key: string]: any;
}

interface LanguageContextType {
  language: string;
  translations: Translations;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: string, params?: { [key: string]: string | number }) => string;
  isLoading: boolean;
  supportedLanguages: Array<{ code: string; name: string }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supportedLanguages, setSupportedLanguages] = useState<Array<{ code: string; name: string }>>([]);

  // Helper function to get nested translation by dot notation key
  const getNestedTranslation = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Translation function with parameter replacement
  const t = (key: string, params?: { [key: string]: string | number }): string => {
    let translation = getNestedTranslation(translations, key);
    
    // Fallback to key if translation not found
    if (translation === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    // Replace parameters in translation
    if (params && typeof translation === 'string') {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }

    return translation;
  };

  // Load translations for a specific language
  const loadTranslations = async (langCode: string) => {
    setIsLoading(true);
    try {
      const response = await api.getTranslations(langCode);
      setTranslations(response.translations);
      setLanguageState(langCode);
      
      // Save language preference to backend
      await api.updateSetting('language', langCode);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English
      if (langCode !== 'en') {
        await loadTranslations('en');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Set language and load translations
  const setLanguage = async (lang: string) => {
    await loadTranslations(lang);
  };

  // Load supported languages and initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load supported languages
        const langResponse = await api.getSupportedLanguages();
        setSupportedLanguages(langResponse.languages);

        // Load saved language preference from backend
        const savedLangResponse = await api.getSetting('language');
        const savedLang = savedLangResponse.value || 'en';
        
        await loadTranslations(savedLang);
      } catch (error) {
        console.error('Failed to initialize language:', error);
        // Fallback to English
        await loadTranslations('en');
      }
    };

    initialize();
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        translations,
        setLanguage,
        t,
        isLoading,
        supportedLanguages
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
