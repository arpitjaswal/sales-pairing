import path from 'path';
import fs from 'fs';
import i18n from 'i18n';
import { config } from '../../config';
import { logger } from '../logger';

// Default language
const DEFAULT_LANGUAGE = 'en';

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de'];

// Directory where locale files are stored
const LOCALE_DIR = path.join(__dirname, '../../../locales');

// Ensure locales directory exists
if (!fs.existsSync(LOCALE_DIR)) {
  fs.mkdirSync(LOCALE_DIR, { recursive: true });
  logger.info(`Created locales directory at ${LOCALE_DIR}`);
}

// Default translations
const DEFAULT_TRANSLATIONS = {
  en: require('./locales/en.json'),
  es: require('./locales/es.json'),
  fr: require('./locales/fr.json'),
  de: require('./locales/de.json')
};

// Initialize i18n
i18n.configure({
  locales: SUPPORTED_LANGUAGES,
  defaultLocale: DEFAULT_LANGUAGE,
  directory: LOCALE_DIR,
  autoReload: process.env.NODE_ENV !== 'production',
  updateFiles: false, // Don't update files automatically
  syncFiles: false, // Don't sync files automatically
  objectNotation: true,
  api: {
    __: 't', // Use `req.t` or `res.t`
    __n: 'tn' // Use `req.tn` or `res.tn` for pluralization
  },
  register: global,
  // Use default translations
  ...DEFAULT_TRANSLATIONS
});

// Initialize locale files if they don't exist
const initializeLocaleFiles = () => {
  SUPPORTED_LANGUAGES.forEach(locale => {
    const filePath = path.join(LOCALE_DIR, `${locale}.json`);
    
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        JSON.stringify(DEFAULT_TRANSLATIONS[locale] || {}, null, 2),
        'utf8'
      );
      logger.info(`Created locale file: ${filePath}`);
    }
  });
};

// Initialize locale files on startup
initializeLocaleFiles();

// Helper function to get translation
const t = (key: string, replacements?: Record<string, any>, locale?: string): string => {
  return i18n.__({ phrase: key, locale: locale || i18n.getLocale() }, replacements);
};

// Helper function for pluralization
const tn = (key: string, count: number, replacements?: Record<string, any>, locale?: string): string => {
  return i18n.__n(
    { 
      singular: key,
      plural: key,
      count
    },
    count,
    replacements,
    locale || i18n.getLocale()
  );
};

// Middleware to set language from request
const i18nMiddleware = (req: any, res: any, next: () => void) => {
  // Get language from query param, header, or default
  const lang = req.query.lang || 
               req.acceptsLanguages(SUPPORTED_LANGUAGES) || 
               DEFAULT_LANGUAGE;
  
  // Set language for this request
  i18n.setLocale(lang);
  
  // Add translation methods to request and response objects
  req.t = (key: string, replacements?: Record<string, any>) => t(key, replacements, lang);
  req.tn = (key: string, count: number, replacements?: Record<string, any>) => 
    tn(key, count, replacements, lang);
  
  res.t = req.t;
  res.tn = req.tn;
  
  next();
};

export { i18n, t, tn, i18nMiddleware, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES };
