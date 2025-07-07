/**
 * Multi-language Summarization + Translation
 * Enable summarization in multiple languages with tone and locale adjustments
 */

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isSupported: boolean;
  toneOptions: ToneOption[];
  formalityLevels: FormalityLevel[];
}

export interface ToneOption {
  id: string;
  name: string;
  description: string;
  example: string;
}

export interface FormalityLevel {
  id: string;
  name: string;
  description: string;
  example: string;
}

export interface TranslationRequest {
  id: string;
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  tone: string;
  formality: string;
  preserveFormatting: boolean;
  includeOriginal: boolean;
}

export interface TranslationResult {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  tone: string;
  formality: string;
  processingTime: number;
  wordCount: {
    original: number;
    translated: number;
  };
  detectedLanguage?: string;
}

export interface SummarizationRequest {
  id: string;
  content: string;
  language: string;
  tone: string;
  formality: string;
  length: 'brief' | 'medium' | 'detailed';
  includeTranslation?: boolean;
  translationTargets?: string[];
}

export interface MultilingualSummary {
  id: string;
  originalContent: string;
  detectedLanguage: string;
  summaries: {
    [languageCode: string]: {
      text: string;
      tone: string;
      formality: string;
      confidence: number;
      wordCount: number;
    };
  };
  translations?: {
    [languageCode: string]: TranslationResult;
  };
  metadata: {
    processingTime: number;
    originalWordCount: number;
    createdAt: string;
  };
}

export class MultilingualSummarizationEngine {
  private static readonly SUPPORTED_LANGUAGES: LanguageConfig[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      isSupported: true,
      toneOptions: [
        { id: 'professional', name: 'Professional', description: 'Business-appropriate tone', example: 'We discussed the quarterly results and identified key improvement areas.' },
        { id: 'casual', name: 'Casual', description: 'Relaxed, friendly tone', example: 'We talked about Q4 numbers and figured out what needs work.' },
        { id: 'technical', name: 'Technical', description: 'Precise, technical language', example: 'Analysis of Q4 metrics revealed performance gaps requiring optimization.' }
      ],
      formalityLevels: [
        { id: 'formal', name: 'Formal', description: 'Traditional business language', example: 'The committee convened to deliberate on the proposed initiatives.' },
        { id: 'neutral', name: 'Neutral', description: 'Standard professional tone', example: 'The team met to discuss the new projects.' },
        { id: 'informal', name: 'Informal', description: 'Conversational style', example: 'The team got together to chat about new projects.' }
      ]
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
      isSupported: true,
      toneOptions: [
        { id: 'professional', name: 'Profesional', description: 'Tono apropiado para negocios', example: 'Discutimos los resultados trimestrales e identificamos áreas clave de mejora.' },
        { id: 'casual', name: 'Casual', description: 'Tono relajado y amigable', example: 'Hablamos sobre los números de Q4 y vimos qué necesita trabajo.' },
        { id: 'technical', name: 'Técnico', description: 'Lenguaje técnico y preciso', example: 'El análisis de métricas Q4 reveló brechas de rendimiento que requieren optimización.' }
      ],
      formalityLevels: [
        { id: 'formal', name: 'Formal', description: 'Lenguaje empresarial tradicional', example: 'El comité se reunió para deliberar sobre las iniciativas propuestas.' },
        { id: 'neutral', name: 'Neutral', description: 'Tono profesional estándar', example: 'El equipo se reunió para discutir los nuevos proyectos.' },
        { id: 'informal', name: 'Informal', description: 'Estilo conversacional', example: 'El equipo se juntó para charlar sobre nuevos proyectos.' }
      ]
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      isSupported: true,
      toneOptions: [
        { id: 'professional', name: 'Professionnel', description: 'Ton approprié pour les affaires', example: 'Nous avons discuté des résultats trimestriels et identifié les domaines d\'amélioration clés.' },
        { id: 'casual', name: 'Décontracté', description: 'Ton détendu et amical', example: 'On a parlé des chiffres Q4 et trouvé ce qui doit être amélioré.' },
        { id: 'technical', name: 'Technique', description: 'Langage technique et précis', example: 'L\'analyse des métriques Q4 a révélé des écarts de performance nécessitant une optimisation.' }
      ],
      formalityLevels: [
        { id: 'formal', name: 'Formel', description: 'Langage d\'entreprise traditionnel', example: 'Le comité s\'est réuni pour délibérer sur les initiatives proposées.' },
        { id: 'neutral', name: 'Neutre', description: 'Ton professionnel standard', example: 'L\'équipe s\'est réunie pour discuter des nouveaux projets.' },
        { id: 'informal', name: 'Informel', description: 'Style conversationnel', example: 'L\'équipe s\'est retrouvée pour parler des nouveaux projets.' }
      ]
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      isSupported: true,
      toneOptions: [
        { id: 'professional', name: 'Professionell', description: 'Geschäftsangemessener Ton', example: 'Wir besprachen die Quartalsergebnisse und identifizierten wichtige Verbesserungsbereiche.' },
        { id: 'casual', name: 'Locker', description: 'Entspannter, freundlicher Ton', example: 'Wir redeten über die Q4-Zahlen und fanden heraus, was verbessert werden muss.' },
        { id: 'technical', name: 'Technisch', description: 'Präzise, technische Sprache', example: 'Die Analyse der Q4-Metriken offenbarte Leistungslücken, die Optimierung erfordern.' }
      ],
      formalityLevels: [
        { id: 'formal', name: 'Förmlich', description: 'Traditionelle Geschäftssprache', example: 'Das Komitee versammelte sich, um über die vorgeschlagenen Initiativen zu beraten.' },
        { id: 'neutral', name: 'Neutral', description: 'Standard-Profi-Ton', example: 'Das Team traf sich, um die neuen Projekte zu besprechen.' },
        { id: 'informal', name: 'Informell', description: 'Gesprächsstil', example: 'Das Team kam zusammen, um über neue Projekte zu reden.' }
      ]
    }
  ];

  /**
   * Detect language of input text
   */
  static async detectLanguage(text: string): Promise<{
    language: string;
    confidence: number;
    alternatives: Array<{ language: string; confidence: number }>;
  }> {
    try {
      // Simple language detection based on common words and patterns
      const detectionResult = this.performLanguageDetection(text);
      
      return detectionResult;
    } catch (error) {
      console.error('Error detecting language:', error);
      return {
        language: 'en',
        confidence: 0.5,
        alternatives: []
      };
    }
  }

  /**
   * Translate text to target language
   */
  static async translateText(request: TranslationRequest): Promise<TranslationResult> {
    try {
      const startTime = Date.now();
      
      // Detect source language if not provided
      let sourceLanguage = request.sourceLanguage;
      if (sourceLanguage === 'auto') {
        const detection = await this.detectLanguage(request.sourceText);
        sourceLanguage = detection.language;
      }
      
      // Generate translation prompt
      const translationPrompt = this.generateTranslationPrompt(
        request.sourceText,
        sourceLanguage,
        request.targetLanguage,
        request.tone,
        request.formality
      );
      
      // Call AI service for translation
      const translatedText = await this.callTranslationAI(translationPrompt);
      
      const processingTime = Date.now() - startTime;
      
      return {
        id: request.id,
        originalText: request.sourceText,
        translatedText,
        sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: 0.95, // Mock confidence
        tone: request.tone,
        formality: request.formality,
        processingTime,
        wordCount: {
          original: request.sourceText.split(' ').length,
          translated: translatedText.split(' ').length
        },
        detectedLanguage: sourceLanguage !== request.sourceLanguage ? sourceLanguage : undefined
      };
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  }

  /**
   * Generate multilingual summary
   */
  static async generateMultilingualSummary(request: SummarizationRequest): Promise<MultilingualSummary> {
    try {
      const startTime = Date.now();
      
      // Detect content language
      const detection = await this.detectLanguage(request.content);
      const detectedLanguage = detection.language;
      
      // Generate summary in original language
      const originalSummary = await this.generateSummaryInLanguage(
        request.content,
        detectedLanguage,
        request.tone,
        request.formality,
        request.length
      );
      
      const summaries: { [key: string]: any } = {
        [detectedLanguage]: originalSummary
      };
      
      const translations: { [key: string]: TranslationResult } = {};
      
      // Generate translations if requested
      if (request.includeTranslation && request.translationTargets) {
        for (const targetLang of request.translationTargets) {
          if (targetLang !== detectedLanguage) {
            // Translate the summary
            const translationRequest: TranslationRequest = {
              id: `trans_${Date.now()}_${Math.random().toString(36).substring(2)}`,
              sourceText: originalSummary.text,
              sourceLanguage: detectedLanguage,
              targetLanguage: targetLang,
              tone: request.tone,
              formality: request.formality,
              preserveFormatting: true,
              includeOriginal: false
            };
            
            const translation = await this.translateText(translationRequest);
            translations[targetLang] = translation;
            
            // Also create summary entry for translated language
            summaries[targetLang] = {
              text: translation.translatedText,
              tone: request.tone,
              formality: request.formality,
              confidence: translation.confidence,
              wordCount: translation.wordCount.translated
            };
          }
        }
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        id: request.id,
        originalContent: request.content,
        detectedLanguage,
        summaries,
        translations: Object.keys(translations).length > 0 ? translations : undefined,
        metadata: {
          processingTime,
          originalWordCount: request.content.split(' ').length,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating multilingual summary:', error);
      throw error;
    }
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages(): LanguageConfig[] {
    return this.SUPPORTED_LANGUAGES.filter(lang => lang.isSupported);
  }

  /**
   * Get language configuration
   */
  static getLanguageConfig(languageCode: string): LanguageConfig | null {
    return this.SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || null;
  }

  /**
   * Get user's preferred language from browser
   */
  static detectUserLanguage(): string {
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = this.SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang);
      return supportedLang ? browserLang : 'en';
    }
    return 'en';
  }

  /**
   * Validate translation request
   */
  static validateTranslationRequest(request: TranslationRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!request.sourceText || request.sourceText.trim().length === 0) {
      errors.push('Source text is required');
    }
    
    if (!request.targetLanguage) {
      errors.push('Target language is required');
    }
    
    if (request.targetLanguage && !this.SUPPORTED_LANGUAGES.find(lang => lang.code === request.targetLanguage)) {
      errors.push('Target language is not supported');
    }
    
    if (request.sourceText && request.sourceText.length > 10000) {
      errors.push('Source text is too long (max 10,000 characters)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Private helper methods
  private static performLanguageDetection(text: string): any {
    // Simple language detection based on common words
    const textLower = text.toLowerCase();
    
    // English indicators
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'];
    const englishScore = englishWords.filter(word => textLower.includes(word)).length;
    
    // Spanish indicators
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'];
    const spanishScore = spanishWords.filter(word => textLower.includes(word)).length;
    
    // French indicators
    const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'];
    const frenchScore = frenchWords.filter(word => textLower.includes(word)).length;
    
    // German indicators
    const germanWords = ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'];
    const germanScore = germanWords.filter(word => textLower.includes(word)).length;
    
    const scores = [
      { language: 'en', score: englishScore },
      { language: 'es', score: spanishScore },
      { language: 'fr', score: frenchScore },
      { language: 'de', score: germanScore }
    ].sort((a, b) => b.score - a.score);
    
    const topScore = scores[0];
    const confidence = topScore.score > 0 ? Math.min(0.95, topScore.score / 10) : 0.5;
    
    return {
      language: topScore.language,
      confidence,
      alternatives: scores.slice(1, 3).map(s => ({
        language: s.language,
        confidence: s.score > 0 ? Math.min(0.8, s.score / 10) : 0.1
      }))
    };
  }

  private static generateTranslationPrompt(
    sourceText: string,
    sourceLanguage: string,
    targetLanguage: string,
    tone: string,
    formality: string
  ): string {
    const sourceLangConfig = this.getLanguageConfig(sourceLanguage);
    const targetLangConfig = this.getLanguageConfig(targetLanguage);
    
    return `Translate the following text from ${sourceLangConfig?.name || sourceLanguage} to ${targetLangConfig?.name || targetLanguage}.

Source text:
${sourceText}

Translation requirements:
- Tone: ${tone}
- Formality level: ${formality}
- Preserve the meaning and context
- Use natural, fluent language in the target language
- Maintain any technical terms appropriately

Provide only the translated text without explanations.`;
  }

  private static async generateSummaryInLanguage(
    content: string,
    language: string,
    tone: string,
    formality: string,
    length: string
  ): Promise<any> {
    const langConfig = this.getLanguageConfig(language);
    
    const prompt = `Summarize the following content in ${langConfig?.name || language}.

Content:
${content}

Requirements:
- Length: ${length}
- Tone: ${tone}
- Formality: ${formality}
- Language: ${langConfig?.name || language}
- Focus on key decisions, action items, and important discussions

Provide a clear, well-structured summary.`;

    const summaryText = await this.callSummarizationAI(prompt);
    
    return {
      text: summaryText,
      tone,
      formality,
      confidence: 0.9,
      wordCount: summaryText.split(' ').length
    };
  }

  private static async callTranslationAI(prompt: string): Promise<string> {
    // Mock AI call - in production, use OpenAI, DeepL, or similar
    console.log('Translation AI prompt:', prompt);
    
    // Mock translation response
    return 'Esta es una traducción de ejemplo del texto original.';
  }

  private static async callSummarizationAI(prompt: string): Promise<string> {
    // Mock AI call - in production, use OpenAI, DeepSeek, or similar
    console.log('Summarization AI prompt:', prompt);
    
    // Mock summary response
    return 'Este es un resumen de ejemplo del contenido original con los puntos clave y decisiones importantes.';
  }
}
