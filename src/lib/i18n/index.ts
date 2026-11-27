import en from '../../i18n/messages/en.json';
import hi from '../../i18n/messages/hi.json';
import mr from '../../i18n/messages/mr.json';

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export const translations = {
  en,
  hi,
  mr,
} as const;

export const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; native: string }> = {
  en: { label: 'English', native: 'English' },
  hi: { label: 'Hindi', native: 'हिंदी' },
  mr: { label: 'Marathi', native: 'मराठी' },
};

/**
 * Retrieve translation by dotted path (e.g. 'common.dashboard')
 */
export function t(lang: SupportedLanguage = 'en', path: string, fallback?: string): string {
  const dict = translations[lang] || translations.en;
  const parts = path.split('.');
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English if missing in target lang
      let enCurrent: any = translations.en;
      for (const enPart of parts) {
        if (enCurrent && typeof enCurrent === 'object' && enPart in enCurrent) {
          enCurrent = enCurrent[enPart];
        } else {
          return fallback || path;
        }
      }
      return typeof enCurrent === 'string' ? enCurrent : fallback || path;
    }
  }

  return typeof current === 'string' ? current : fallback || path;
}
