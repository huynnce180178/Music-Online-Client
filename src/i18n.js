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

// Đảm bảo ngôn ngữ hợp lệ
const validLanguages = ['en', 'vi', 'ko', 'ja'];
const currentLng = validLanguages.includes(savedLng) ? savedLng : 'en';

// Debug: Log the resources to see if they're loaded correctly
console.log('i18n resources:', Object.keys(resources));
console.log('Current language:', currentLng);
console.log('English resources keys:', Object.keys(resources.en.translation).slice(0, 10));

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: currentLng, 
    fallbackLng: ['en', 'vi'],
    interpolation: {
      escapeValue: false,
    },
    debug: false, // Tắt debug để giảm console log
    
    // Cấu hình xử lý missing keys
    saveMissing: false,
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,
    
    // Fallback behavior khi không tìm thấy key
    parseMissingKeyHandler: (key) => {
      // Trả về key gốc thay vì hiển thị warning
      return key;
    },
    
    // Ngăn chặn cảnh báo missing key
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      // Không log warning nữa, chỉ trả về fallback value
      return fallbackValue || key;
    },
    
    // Đảm bảo luôn có fallback
    appendNamespaceToMissingKey: false,
    
    // Cấu hình cho supported languages
    supportedLngs: ['en', 'vi', 'ko', 'ja'],
    load: 'languageOnly',
    cleanCode: true
  });

// Debug: Test translation after initialization
i18n.on('initialized', () => {
  console.log('i18n initialized');
  console.log('Current language:', i18n.language);
  console.log('Available languages:', i18n.languages);
  
  // Test một số key quan trọng
  console.log('Test translations:');
  console.log('- loading:', i18n.t('loading'));
  console.log('- processing:', i18n.t('processing'));
  console.log('- genres.Soundtrack (OST):', i18n.t('genres.Soundtrack (OST)'));
});

// Xử lý missing key event
i18n.on('missingKey', (lng, namespace, key, res) => {
  // Log để debug nhưng không show warning cho user
  console.debug(`Missing key [${lng}][${namespace}]: ${key}`);
  
  // Thử tìm trong fallback language
  if (lng !== 'en') {
    const fallback = i18n.getDataByLanguage('en');
    if (fallback && fallback.translation && fallback.translation[key]) {
      return fallback.translation[key];
    }
  }
  
  // Trả về key gốc nếu không tìm thấy
  return key;
});

// Xử lý language changed
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  localStorage.setItem('i18nextLng', lng);
});

// Helper function để kiểm tra và trả về translation an toàn
export const safeTranslate = (key, options = {}) => {
  try {
    const translation = i18n.t(key, options);
    // Nếu translation trả về chính key đó (nghĩa là không tìm thấy), thử fallback
    if (translation === key && i18n.language !== 'en') {
      const fallbackTranslation = i18n.t(key, { ...options, lng: 'en' });
      return fallbackTranslation !== key ? fallbackTranslation : key;
    }
    return translation;
  } catch (error) {
    console.warn('Translation error for key:', key, error);
    return key;
  }
};

export default i18n; 