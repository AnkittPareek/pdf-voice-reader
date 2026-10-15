/**
 * PDF Voice Reader — Language Detector & Voice Filter Tests
 */

import {
  detectDocumentLanguage,
  getAvailableVoiceLanguages,
  filterVoicesByLanguage,
  getPreviewSampleText,
  getLanguageDisplayName,
  getLanguageShortLabel,
} from '../../src/utils/languageDetector';
import { SpeechVoice } from '../../src/domain/speech/types';

describe('Language Detector & Voice Utilities', () => {
  describe('detectDocumentLanguage', () => {
    it('defaults to English when empty or whitespace', () => {
      expect(detectDocumentLanguage('').code).toBe('en');
      expect(detectDocumentLanguage('    ').code).toBe('en');
    });

    it('detects Hindi (Devanagari script)', () => {
      const text = 'यह एक हिंदी पुस्तक का अंश है जिसमें कहानी का वर्णन किया गया है। भारत एक विशाल देश है।';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('hi');
      expect(result.name).toContain('Hindi');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('detects Marathi with specific Marathi words', () => {
      const text = 'हा एक मराठी मजकूर आहे आणि यामध्ये पुस्तकाचे वर्णन केले आहे. तो तिथे झाला.';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('mr');
      expect(result.name).toContain('Marathi');
    });

    it('detects Russian (Cyrillic script)', () => {
      const text = 'Это пример русского текста из книги для проверки распознавания языка в приложении.';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('ru');
      expect(result.name).toContain('Russian');
    });

    it('detects Japanese (Kana script)', () => {
      const text = 'これは日本語で書かれたドキュメントのサンプルテキストです。';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('ja');
      expect(result.name).toContain('Japanese');
    });

    it('detects Korean (Hangul script)', () => {
      const text = '이것은 한국어로 작성된 테스트 문서의 예시 텍스트입니다.';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('ko');
      expect(result.name).toContain('Korean');
    });

    it('detects Arabic script', () => {
      const text = 'هذا نص باللغة العربية لاختبار الكشف التلقائي عن اللغة في قارئ الكتب.';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('ar');
      expect(result.name).toContain('Arabic');
    });

    it('detects Urdu with specific Urdu words', () => {
      const text = 'یہ اردو زبان میں لکھی گئی کتاب ہے اور اس میں بہت سی کہانیاں ہیں جو بچوں کے لیے تھیں۔';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('ur');
      expect(result.name).toContain('Urdu');
    });

    it('detects Bengali script', () => {
      const text = 'এটি একটি বাংলা বইয়ের অংশ যা পরীক্ষার জন্য তৈরি করা হয়েছে।';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('bn');
      expect(result.name).toContain('Bengali');
    });

    it('detects Tamil script', () => {
      const text = 'இது ஒரு தமிழ் புத்தகத்தின் மாதிரி உரை ஆகும்.';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('ta');
      expect(result.name).toContain('Tamil');
    });

    it('detects Spanish via Latin stopwords', () => {
      const text =
        'Este es un documento en español con palabras de la lengua para leer libros y reportes del trabajo con una buena voz.';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('es');
      expect(result.name).toContain('Spanish');
    });

    it('detects French via Latin stopwords', () => {
      const text =
        'Ceci est un livre en français pour les étudiants de la langue avec des articles et du contenu pour tous.';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('fr');
      expect(result.name).toContain('French');
    });

    it('detects German via Latin stopwords', () => {
      const text =
        'Das ist ein Buch in deutscher Sprache mit vielen Wörtern für die Leser und den Autor in der Stadt.';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('de');
      expect(result.name).toContain('German');
    });

    it('detects English via Latin stopwords', () => {
      const text =
        'This is an English book about the history of science and technology with stories for readers around the world.';
      const result = detectDocumentLanguage(text);
      expect(result.code).toBe('en');
      expect(result.name).toContain('English');
    });
  });

  describe('getAvailableVoiceLanguages and filterVoicesByLanguage', () => {
    const mockVoices: SpeechVoice[] = [
      { id: 'en-us-1', name: 'English US Voice 1', locale: 'en-US' },
      { id: 'en-gb-1', name: 'English UK Voice 1', locale: 'en-GB' },
      { id: 'hi-in-1', name: 'Hindi Voice 1', locale: 'hi-IN' },
      { id: 'hi-in-2', name: 'Hindi Voice 2', locale: 'hi_IN' },
      { id: 'es-es-1', name: 'Spanish Voice 1', locale: 'es-ES' },
      { id: 'fr-fr-1', name: 'French Voice 1', locale: 'fr-FR' },
    ];

    it('groups voices by language code with correct counts', () => {
      const languages = getAvailableVoiceLanguages(mockVoices);
      const en = languages.find((l) => l.code === 'en');
      const hi = languages.find((l) => l.code === 'hi');
      const es = languages.find((l) => l.code === 'es');

      expect(en?.count).toBe(2);
      expect(hi?.count).toBe(2);
      expect(es?.count).toBe(1);

      // en and hi should be prioritized at top
      expect(languages[0].code).toBe('en');
      expect(languages[1].code).toBe('hi');
    });

    it('filters voices accurately by language code', () => {
      const hindiVoices = filterVoicesByLanguage(mockVoices, 'hi');
      expect(hindiVoices.length).toBe(2);
      expect(hindiVoices.every((v) => v.locale.toLowerCase().startsWith('hi'))).toBe(true);

      const englishVoices = filterVoicesByLanguage(mockVoices, 'en');
      expect(englishVoices.length).toBe(2);

      const allVoices = filterVoicesByLanguage(mockVoices, 'all');
      expect(allVoices.length).toBe(mockVoices.length);
    });
  });

  describe('getPreviewSampleText', () => {
    it('returns Hindi sample phrase for Hindi locale or code', () => {
      const phrase = getPreviewSampleText('hi-IN');
      expect(phrase).toContain('नमस्ते');
    });

    it('returns Spanish sample phrase for Spanish locale', () => {
      const phrase = getPreviewSampleText('es-ES');
      expect(phrase).toContain('¡Hola!');
    });

    it('returns French sample phrase for French locale', () => {
      const phrase = getPreviewSampleText('fr-FR');
      expect(phrase).toContain('Bonjour');
    });

    it('returns English sample phrase for English or unknown locale', () => {
      const phraseEn = getPreviewSampleText('en-US');
      expect(phraseEn).toContain('Hello!');

      const phraseUnknown = getPreviewSampleText('xyz');
      expect(phraseUnknown).toContain('Hello!');
    });
  });

  describe('display helpers', () => {
    it('returns formatted display name and flags', () => {
      expect(getLanguageDisplayName('hi')).toContain('Hindi (हिन्दी)');
      expect(getLanguageShortLabel('hi')).toContain('🇮🇳 Hindi');
      expect(getLanguageShortLabel('en')).toContain('🇬🇧 English');
    });
  });
});

