/**
 * PDF Voice Reader — On-Device Language Detection & Voice Language Helpers
 *
 * Provides offline, zero-dependency language detection based on Unicode script analysis
 * and Latin stopword n-gram heuristics, plus helper functions to group and filter
 * TTS voices by language.
 */

import { SpeechVoice } from '../domain/speech/types';

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
  samplePhrase?: string;
}

export const KNOWN_LANGUAGES: Record<string, LanguageInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', samplePhrase: 'Hello! I am ready to read your documents clearly and naturally.' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', samplePhrase: 'नमस्ते! मैं आपके दस्तावेज़ स्पष्ट और स्वाभाविक आवाज़ में पढ़ने के लिए तैयार हूँ।' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', samplePhrase: '¡Hola! Estoy listo para leer tus documentos con una voz natural y fluida.' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', samplePhrase: 'Bonjour ! Je suis prêt à lire vos documents d’une voix fluide et naturelle.' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', samplePhrase: 'Hallo! Ich bin bereit, Ihre Dokumente mit natürlicher Aussprache vorzulesen.' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', samplePhrase: 'Ciao! Sono pronto a leggere i tuoi documenti con voce chiara e naturale.' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', samplePhrase: 'Olá! Estou pronto para ler seus documentos de maneira agradável e natural.' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', samplePhrase: 'Здравствуйте! Я готов читать ваши документы четким и естественным голосом.' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', samplePhrase: 'こんにちは！自然な音声でドキュメントを読み上げる準備ができました。' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', samplePhrase: '您好！我已经准备好用自然流畅的声音为您朗读文档。' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', samplePhrase: '안녕하세요! 자연스럽고 또렷한 음성으로 문서를 읽어드릴 준비가 되었습니다.' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', samplePhrase: 'مرحباً! أنا جاهز لقراءة مستنداتك بصوت واضح وطبيعي.' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', samplePhrase: 'سلام! میں آپ کی دستاویزات صاف اور قدرتی آواز میں پڑھنے کے لیے تیار ہوں۔' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', samplePhrase: 'নমস্কার! আমি আপনার নথি পরিষ্কার ও সুন্দর কণ্ঠে পড়তে প্রস্তুত।' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', samplePhrase: 'வணக்கம்! உங்கள் ஆவணங்களை இனிமையான குரலில் படிக்க நான் தயார்.' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', samplePhrase: 'నమస్కారం! మీ పత్రాలను స్పష్టమైన గళంతో చదవడానికి నేను సిద్ధంగా ఉన్నాను.' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', samplePhrase: 'नमस्कार! मी तुमचे दस्तऐवज स्पष्ट आणि सुंदर आवाजात वाचण्यासाठी तयार आहे.' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', samplePhrase: 'નમસ્તે! હું તમારા દસ્તાવેજો સ્પષ્ટ અને કુદરતી અવાજમાં વાંચવા માટે તૈયાર છું.' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', samplePhrase: 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಸ್ಪಷ್ಟ ಹಾಗೂ ನೈಸರ್ಗಿಕ ಧ್ವನಿಯಲ್ಲಿ ಓದಲು ನಾನು ಸಿದ್ಧ.' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', samplePhrase: 'നമസ്കാരം! നിങ്ങളുടെ രേഖകൾ മനോഹരമായ ശബ്ദത്തിൽ വായിക്കാൻ ഞാൻ തയ്യാറാണ്.' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', samplePhrase: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੇ ਦਸਤਾਵੇਜ਼ ਸਪਸ਼ਟ ਅਤੇ ਕੁਦਰਤੀ ਅਵਾਜ਼ ਵਿੱਚ ਪੜ੍ਹਨ ਲਈ ਤਿਆਰ ਹਾਂ।' },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', samplePhrase: 'Hallo! Ik ben klaar om uw documenten op een duidelijke manier voor te lezen.' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', samplePhrase: 'Dzień dobry! Jestem gotowy czytać Twoje dokumenty naturalnym głosem.' },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', samplePhrase: 'Merhaba! Belgelerinizi akıcı ve doğal bir sesle okumaya hazırım.' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', samplePhrase: 'Xin chào! Tôi đã sẵn sàng đọc tài liệu của bạn bằng giọng đọc tự nhiên.' },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', samplePhrase: 'สวัสดีครับ! ผมพร้อมอ่านเอกสารของคุณด้วยน้ำเสียงที่เป็นธรรมชาติแล้ว' },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', samplePhrase: 'Halo! Saya siap membacakan dokumen Anda dengan suara alami dan jernih.' },
};

export function getPreviewSampleText(localeOrCode?: string): string {
  if (!localeOrCode) return KNOWN_LANGUAGES.en.samplePhrase!;
  const normalized = localeOrCode.toLowerCase().split(/[-_]/)[0];
  const lang = KNOWN_LANGUAGES[normalized];
  return lang?.samplePhrase || KNOWN_LANGUAGES.en.samplePhrase!;
}

export function getLanguageDisplayName(code: string): string {
  const normalized = (code || 'en').toLowerCase().split(/[-_]/)[0];
  const lang = KNOWN_LANGUAGES[normalized];
  if (lang) {
    return lang.nativeName && lang.nativeName !== lang.name
      ? `${lang.name} (${lang.nativeName})`
      : lang.name;
  }
  return code.toUpperCase();
}

export function getLanguageShortLabel(code: string): string {
  const normalized = (code || 'en').toLowerCase().split(/[-_]/)[0];
  const lang = KNOWN_LANGUAGES[normalized];
  if (lang) {
    return lang.flag ? `${lang.flag} ${lang.name}` : lang.name;
  }
  return code.toUpperCase();
}

/**
 * Extracts unique languages available from a list of TTS voices.
 */
export function getAvailableVoiceLanguages(
  voices: SpeechVoice[]
): { code: string; label: string; count: number }[] {
  const counts: Record<string, number> = {};

  for (const voice of voices) {
    if (!voice.locale) continue;
    const langCode = voice.locale.toLowerCase().split(/[-_]/)[0];
    counts[langCode] = (counts[langCode] || 0) + 1;
  }

  const result = Object.entries(counts).map(([code, count]) => ({
    code,
    label: getLanguageShortLabel(code),
    count,
  }));

  // Sort English and Hindi towards top if present, then alphabetical
  result.sort((a, b) => {
    if (a.code === 'en') return -1;
    if (b.code === 'en') return 1;
    if (a.code === 'hi') return -1;
    if (b.code === 'hi') return 1;
    return a.label.localeCompare(b.label);
  });

  return result;
}

/**
 * Filters a list of TTS voices by language code.
 * If code is 'all' or empty, returns all voices.
 */
export function filterVoicesByLanguage(
  voices: SpeechVoice[],
  languageCode: string
): SpeechVoice[] {
  if (!languageCode || languageCode === 'all') {
    return voices;
  }

  const targetLang = languageCode.toLowerCase().split(/[-_]/)[0];

  return voices.filter((v) => {
    if (!v.locale) return false;
    const voiceLang = v.locale.toLowerCase().split(/[-_]/)[0];
    return voiceLang === targetLang;
  });
}

/**
 * Detects the language of a document text snippet completely offline on-device.
 */
export function detectDocumentLanguage(text: string): {
  code: string;
  name: string;
  confidence: number;
} {
  if (!text || text.trim().length === 0) {
    return { code: 'en', name: 'English', confidence: 0.5 };
  }

  const sample = text.slice(0, 4000);

  // 1. Script-based detection
  const totalChars = sample.length;

  const countDevanagari = (sample.match(/[\u0900-\u097F]/g) || []).length;
  if (countDevanagari > 15 && countDevanagari / totalChars > 0.15) {
    // Check Marathi specific character 'ळ' (\u0933) vs Hindi words
    if (sample.includes('आणि') || sample.includes('मध्ये') || sample.includes('झाला')) {
      return { code: 'mr', name: 'Marathi (मराठी)', confidence: 0.95 };
    }
    return { code: 'hi', name: 'Hindi (हिन्दी)', confidence: 0.95 };
  }

  const countArabicUrdu = (sample.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length;
  if (countArabicUrdu > 15 && countArabicUrdu / totalChars > 0.15) {
    if (sample.includes('کے') || sample.includes('ہیں') || sample.includes('اور') || sample.includes('تھا')) {
      return { code: 'ur', name: 'Urdu (اردو)', confidence: 0.95 };
    }
    return { code: 'ar', name: 'Arabic (العربية)', confidence: 0.95 };
  }

  const countCyrillic = (sample.match(/[\u0400-\u04FF]/g) || []).length;
  if (countCyrillic > 15 && countCyrillic / totalChars > 0.15) {
    return { code: 'ru', name: 'Russian (Русский)', confidence: 0.95 };
  }

  const countJapaneseKana = (sample.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
  if (countJapaneseKana > 10) {
    return { code: 'ja', name: 'Japanese (日本語)', confidence: 0.95 };
  }

  const countHangul = (sample.match(/[\uAC00-\uD7AF\u1100-\u11FF]/g) || []).length;
  if (countHangul > 10) {
    return { code: 'ko', name: 'Korean (한국어)', confidence: 0.95 };
  }

  const countChineseHanzi = (sample.match(/[\u4E00-\u9FFF]/g) || []).length;
  if (countChineseHanzi > 15 && countJapaneseKana === 0) {
    return { code: 'zh', name: 'Chinese (中文)', confidence: 0.95 };
  }

  const countBengali = (sample.match(/[\u0980-\u09FF]/g) || []).length;
  if (countBengali > 15) return { code: 'bn', name: 'Bengali (বাংলা)', confidence: 0.95 };

  const countTamil = (sample.match(/[\u0B80-\u0BFF]/g) || []).length;
  if (countTamil > 15) return { code: 'ta', name: 'Tamil (தமிழ்)', confidence: 0.95 };

  const countTelugu = (sample.match(/[\u0C00-\u0C7F]/g) || []).length;
  if (countTelugu > 15) return { code: 'te', name: 'Telugu (తెలుగు)', confidence: 0.95 };

  const countGujarati = (sample.match(/[\u0A80-\u0AFF]/g) || []).length;
  if (countGujarati > 15) return { code: 'gu', name: 'Gujarati (ગુજરાતી)', confidence: 0.95 };

  const countKannada = (sample.match(/[\u0C80-\u0CFF]/g) || []).length;
  if (countKannada > 15) return { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', confidence: 0.95 };

  const countMalayalam = (sample.match(/[\u0D00-\u0D7F]/g) || []).length;
  if (countMalayalam > 15) return { code: 'ml', name: 'Malayalam (മലയാളം)', confidence: 0.95 };

  const countPunjabi = (sample.match(/[\u0A00-\u0A7F]/g) || []).length;
  if (countPunjabi > 15) return { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', confidence: 0.95 };

  const countThai = (sample.match(/[\u0E00-\u0E7F]/g) || []).length;
  if (countThai > 15) return { code: 'th', name: 'Thai (ไทย)', confidence: 0.95 };

  // 2. Latin stopwords detection
  const lowerWords = sample
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (lowerWords.length === 0) {
    return { code: 'en', name: 'English', confidence: 0.5 };
  }

  const stopwordSets: Record<string, string[]> = {
    es: ['de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una'],
    fr: ['de', 'la', 'le', 'et', 'des', 'en', 'un', 'du', 'une', 'que', 'est', 'pour', 'qui', 'dans', 'les'],
    de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im'],
    it: ['di', 'e', 'il', 'la', 'che', 'in', 'a', 'per', 'un', 'del', 'da', 'con', 'non', 'una', 'le', 'si'],
    pt: ['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no'],
    en: ['the', 'and', 'of', 'to', 'in', 'is', 'that', 'for', 'it', 'as', 'with', 'was', 'be', 'by', 'on', 'at'],
  };

  const scores: Record<string, number> = { en: 0, es: 0, fr: 0, de: 0, it: 0, pt: 0 };

  for (const word of lowerWords) {
    for (const [lang, words] of Object.entries(stopwordSets)) {
      if (words.includes(word)) {
        scores[lang] = (scores[lang] || 0) + 1;
      }
    }
  }

  let bestLang = 'en';
  let maxScore = -1;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestLang = lang;
    }
  }

  const langInfo = KNOWN_LANGUAGES[bestLang] || KNOWN_LANGUAGES.en;
  return {
    code: bestLang,
    name: langInfo.nativeName ? `${langInfo.name} (${langInfo.nativeName})` : langInfo.name,
    confidence: maxScore > 3 ? 0.85 : 0.6,
  };
}
