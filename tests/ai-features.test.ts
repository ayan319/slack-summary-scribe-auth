import { AICoachEngine } from '../src/lib/ai-coach'
import { WeeklyReportEngine } from '../src/lib/weekly-reports'
import { MultilingualSummarizationEngine } from '../src/lib/multilingual-summarization'

describe('AI Coach Engine', () => {
  describe('analyzeBehaviorPatterns', () => {
    it('should analyze user behavior patterns correctly', async () => {
      const userId = 'test-user-123'
      const timeframeDays = 14

      const analysis = await AICoachEngine.analyzeBehaviorPatterns(userId, timeframeDays)

      expect(analysis).toBeDefined()
      expect(analysis.userId).toBe(userId)
      expect(analysis.timeframe).toBe(timeframeDays)
      expect(analysis.metrics).toBeDefined()
      expect(analysis.detectedPatterns).toBeInstanceOf(Array)
      expect(analysis.recommendations).toBeInstanceOf(Array)
      expect(typeof analysis.overallScore).toBe('number')
      expect(analysis.overallScore).toBeGreaterThanOrEqual(0)
      expect(analysis.overallScore).toBeLessThanOrEqual(100)
    })

    it('should generate immediate suggestions', async () => {
      const userId = 'test-user-123'

      const suggestions = await AICoachEngine.getImmediateSuggestions(userId)

      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeLessThanOrEqual(3)
      
      if (suggestions.length > 0) {
        const suggestion = suggestions[0]
        expect(suggestion).toHaveProperty('id')
        expect(suggestion).toHaveProperty('title')
        expect(suggestion).toHaveProperty('description')
        expect(suggestion).toHaveProperty('priority')
        expect(['urgent', 'high', 'medium', 'low']).toContain(suggestion.priority)
      }
    })

    it('should generate weekly coaching digest', async () => {
      const userId = 'test-user-123'

      const digest = await AICoachEngine.generateWeeklyDigest(userId)

      expect(digest).toBeDefined()
      expect(digest.userId).toBe(userId)
      expect(digest.weekStart).toBeDefined()
      expect(digest.weekEnd).toBeDefined()
      expect(digest.summary).toBeDefined()
      expect(digest.recommendations).toBeInstanceOf(Array)
      expect(digest.nextWeekFocus).toBeInstanceOf(Array)
    })

    it('should track coaching interactions', async () => {
      const interactionData = {
        userId: 'test-user-123',
        recommendationId: 'rec-123',
        action: 'acted_on' as const,
        context: { source: 'dashboard' }
      }

      await expect(
        AICoachEngine.trackCoachingInteraction(interactionData)
      ).resolves.not.toThrow()
    })
  })
})

describe('Weekly Report Engine', () => {
  describe('generateWeeklyReport', () => {
    it('should generate comprehensive weekly report', async () => {
      const teamId = 'test-team-456'

      const report = await WeeklyReportEngine.generateWeeklyReport(teamId)

      expect(report).toBeDefined()
      expect(report.teamId).toBe(teamId)
      expect(report.weekStart).toBeDefined()
      expect(report.weekEnd).toBeDefined()
      expect(report.summary).toBeDefined()
      expect(report.sections).toBeDefined()
      expect(report.charts).toBeDefined()

      // Validate summary structure
      expect(report.summary).toHaveProperty('totalMeetings')
      expect(report.summary).toHaveProperty('totalDecisions')
      expect(report.summary).toHaveProperty('totalActionItems')
      expect(typeof report.summary.totalMeetings).toBe('number')

      // Validate sections
      expect(report.sections.decisions).toBeInstanceOf(Array)
      expect(report.sections.actionItems).toBeInstanceOf(Array)
      expect(report.sections.trends).toBeInstanceOf(Array)
      expect(report.sections.topContributors).toBeInstanceOf(Array)
      expect(report.sections.insights).toBeInstanceOf(Array)
    })

    it('should export report to PDF', async () => {
      const teamId = 'test-team-456'
      const report = await WeeklyReportEngine.generateWeeklyReport(teamId)

      const pdfUrl = await WeeklyReportEngine.exportToPDF(report)

      expect(typeof pdfUrl).toBe('string')
      expect(pdfUrl).toContain('reports/')
      expect(pdfUrl).toContain('.pdf')
    })

    it('should schedule weekly reports', async () => {
      const schedule = {
        id: 'schedule-test-123',
        teamId: 'test-team-456',
        templateId: 'detailed_team_report',
        frequency: 'weekly' as const,
        dayOfWeek: 5,
        timeOfDay: '16:00',
        recipients: ['test@example.com'],
        deliveryMethods: ['email' as const],
        isActive: true
      }

      await expect(
        WeeklyReportEngine.scheduleWeeklyReports(schedule)
      ).resolves.not.toThrow()
    })
  })
})

describe('Multilingual Summarization Engine', () => {
  describe('detectLanguage', () => {
    it('should detect English text correctly', async () => {
      const englishText = 'This is a meeting summary about our product roadmap and quarterly goals.'

      const detection = await MultilingualSummarizationEngine.detectLanguage(englishText)

      expect(detection).toBeDefined()
      expect(detection.language).toBe('en')
      expect(detection.confidence).toBeGreaterThan(0)
      expect(detection.confidence).toBeLessThanOrEqual(1)
      expect(detection.alternatives).toBeInstanceOf(Array)
    })

    it('should detect Spanish text correctly', async () => {
      const spanishText = 'Esta es una reunión sobre nuestros objetivos trimestrales y la hoja de ruta del producto.'

      const detection = await MultilingualSummarizationEngine.detectLanguage(spanishText)

      expect(detection).toBeDefined()
      expect(detection.language).toBe('es')
      expect(detection.confidence).toBeGreaterThan(0)
    })
  })

  describe('translateText', () => {
    it('should translate text between languages', async () => {
      const request = {
        id: 'trans-test-123',
        sourceText: 'Hello, this is a test message.',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        tone: 'professional',
        formality: 'neutral',
        preserveFormatting: true,
        includeOriginal: false
      }

      const result = await MultilingualSummarizationEngine.translateText(request)

      expect(result).toBeDefined()
      expect(result.id).toBe(request.id)
      expect(result.originalText).toBe(request.sourceText)
      expect(result.translatedText).toBeDefined()
      expect(result.sourceLanguage).toBe(request.sourceLanguage)
      expect(result.targetLanguage).toBe(request.targetLanguage)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.wordCount.original).toBeGreaterThan(0)
      expect(result.wordCount.translated).toBeGreaterThan(0)
    })

    it('should validate translation requests', () => {
      const invalidRequest = {
        id: 'trans-test-invalid',
        sourceText: '',
        sourceLanguage: 'en',
        targetLanguage: 'invalid-lang',
        tone: 'professional',
        formality: 'neutral',
        preserveFormatting: true,
        includeOriginal: false
      }

      const validation = MultilingualSummarizationEngine.validateTranslationRequest(invalidRequest)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toBeInstanceOf(Array)
      expect(validation.errors.length).toBeGreaterThan(0)
    })
  })

  describe('generateMultilingualSummary', () => {
    it('should generate summary in multiple languages', async () => {
      const request = {
        id: 'summary-test-123',
        content: 'We discussed the Q4 product roadmap and decided to prioritize the API integration project. Sarah will lead the technical specification work.',
        language: 'en',
        tone: 'professional',
        formality: 'neutral',
        length: 'medium' as const,
        includeTranslation: true,
        translationTargets: ['es', 'fr']
      }

      const result = await MultilingualSummarizationEngine.generateMultilingualSummary(request)

      expect(result).toBeDefined()
      expect(result.id).toBe(request.id)
      expect(result.originalContent).toBe(request.content)
      expect(result.detectedLanguage).toBeDefined()
      expect(result.summaries).toBeDefined()
      expect(result.metadata).toBeDefined()

      // Should have summaries for original language and translations
      expect(Object.keys(result.summaries).length).toBeGreaterThanOrEqual(1)
      
      if (request.includeTranslation && request.translationTargets) {
        expect(result.translations).toBeDefined()
        expect(Object.keys(result.translations || {}).length).toBeGreaterThan(0)
      }
    })
  })

  describe('getSupportedLanguages', () => {
    it('should return list of supported languages', () => {
      const languages = MultilingualSummarizationEngine.getSupportedLanguages()

      expect(languages).toBeInstanceOf(Array)
      expect(languages.length).toBeGreaterThan(0)
      
      const englishLang = languages.find(lang => lang.code === 'en')
      expect(englishLang).toBeDefined()
      expect(englishLang?.isSupported).toBe(true)
      expect(englishLang?.toneOptions).toBeInstanceOf(Array)
      expect(englishLang?.formalityLevels).toBeInstanceOf(Array)
    })
  })

  describe('detectUserLanguage', () => {
    it('should return default language when no browser available', () => {
      const userLang = MultilingualSummarizationEngine.detectUserLanguage()
      expect(userLang).toBe('en')
    })
  })
})
