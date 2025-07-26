import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import vi from './locales/vi';

const resources = {
  en: { translation: en },
  vi: { translation: vi },
};

const savedLng = localStorage.getItem('i18nextLng') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLng, 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 