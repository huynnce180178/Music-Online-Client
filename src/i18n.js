import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import vi from './locales/vi';
import ko from './locales/ko';
import ja from './locales/ja';

const resources = {
  en: { translation: en },
  vi: { translation: vi },
  ko: { translation: ko },
  ja: { translation: ja },
};

const savedLng = localStorage.getItem('i18nextLng') || 'en';

// Debug: Log the resources to see if they're loaded correctly
console.log('i18n resources:', resources);
console.log('Current language:', savedLng);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLng, 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    debug: true, // Enable debug mode to see what's happening
  });

// Debug: Test translation after initialization
i18n.on('initialized', () => {
  console.log('i18n initialized');
  console.log('Test translation:', i18n.t('common.loading'));
  console.log('Available languages:', i18n.languages);
});

export default i18n; 