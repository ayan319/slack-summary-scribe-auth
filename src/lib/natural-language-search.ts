/**
 * Natural Language Search System
 * "Ask My Summary" - Conversational search across all user summaries
 */

export interface SearchQuery {
  id: string;
  userId: string;
  query: string;
  intent: SearchIntent;
  entities: SearchEntity[];
  filters: SearchFilters;
  timestamp: string;
}

export interface SearchIntent {
  type: 'find_content' | 'find_decisions' | 'find_action_items' | 'find_participants' | 'find_timeframe' | 'summarize_topic';
  confidence: number;
  reasoning: string;
}

export interface SearchEntity {
  type: 'person' | 'date' | 'topic' | 'project' | 'decision' | 'action' | 'location';
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface SearchFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  participants?: string[];
  tags?: string[];
  priority?: string[];
  meetingTypes?: string[];
  projects?: string[];
}

export interface SearchResult {
  summaryId: string;
  title: string;
  content: string;
  relevanceScore: number;
  matchedSegments: SearchMatch[];
  metadata: {
    date: string;
    participants: string[];
    tags: string[];
    category: string;
    priority: string;
  };
  reasoning: string;
}

export interface SearchMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  matchType: 'exact' | 'semantic' | 'contextual';
  confidence: number;
}

export interface ConversationalResponse {
  answer: string;
  results: SearchResult[];
  suggestedQuestions: string[];
  clarificationNeeded?: string;
  confidence: number;
}

export class NaturalLanguageSearchEngine {
  private static readonly INTENT_PATTERNS = {
    find_decisions: [
      /what.*decided/i,
      /decisions.*made/i,
      /agreed.*on/i,
      /concluded.*that/i,
      /final.*decision/i
    ],
    find_action_items: [
      /action.*items/i,
      /tasks.*assigned/i,
      /who.*responsible/i,
      /next.*steps/i,
      /follow.*up/i
    ],
    find_participants: [
      /who.*attended/i,
      /participants/i,
      /people.*meeting/i,
      /attendees/i
    ],
    find_timeframe: [
      /when.*discuss/i,
      /last.*week/i,
      /yesterday/i,
      /monday/i,
      /recent.*meeting/i
    ],
    summarize_topic: [
      /summarize.*about/i,
      /tell.*me.*about/i,
      /overview.*of/i,
      /what.*happened.*with/i
    ]
  };

  private static readonly EXAMPLE_QUERIES = [
    "What did we decide about the product roadmap last Monday?",
    "Who was assigned to work on the API integration?",
    "Show me all decisions made in engineering meetings this week",
    "What action items came out of the client meeting?",
    "Summarize discussions about budget planning",
    "When did we last talk about hiring?",
    "What were the key takeaways from the retrospective?",
    "Find meetings where Sarah mentioned the deadline"
  ];

  /**
   * Process natural language search query
   */
  static async search(query: string, userId: string): Promise<ConversationalResponse> {
    try {
      // Parse and understand the query
      const searchQuery = await this.parseQuery(query, userId);
      
      // Get user's summaries
      const summaries = await this.getUserSummaries(userId);
      
      // Perform semantic search
      const results = await this.performSemanticSearch(searchQuery, summaries);
      
      // Generate conversational response
      const response = await this.generateConversationalResponse(searchQuery, results);
      
      // Track search analytics
      await this.trackSearch(searchQuery, results.length);
      
      return response;
    } catch (error) {
      console.error('Error in natural language search:', error);
      return {
        answer: "I'm sorry, I couldn't process your search. Please try rephrasing your question.",
        results: [],
        suggestedQuestions: this.getRandomSuggestions(),
        confidence: 0
      };
    }
  }

  /**
   * Get search suggestions based on user's content
   */
  static async getSearchSuggestions(userId: string): Promise<string[]> {
    try {
      // Analyze user's summaries to generate personalized suggestions
      const summaries = await this.getUserSummaries(userId);
      const suggestions = await this.generatePersonalizedSuggestions(summaries);
      
      return suggestions;
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return this.getRandomSuggestions();
    }
  }

  /**
   * Parse natural language query into structured search
   */
  private static async parseQuery(query: string, userId: string): Promise<SearchQuery> {
    // Detect intent
    const intent = this.detectIntent(query);
    
    // Extract entities
    const entities = await this.extractEntities(query);
    
    // Build filters from entities
    const filters = this.buildFilters(entities);
    
    return {
      id: `search_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      userId,
      query,
      intent,
      entities,
      filters,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detect search intent from query
   */
  private static detectIntent(query: string): SearchIntent {
    const queryLower = query.toLowerCase();
    
    for (const [intentType, patterns] of Object.entries(this.INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(queryLower)) {
          return {
            type: intentType as any,
            confidence: 0.8,
            reasoning: `Matched pattern: ${pattern.source}`
          };
        }
      }
    }
    
    // Default to content search
    return {
      type: 'find_content',
      confidence: 0.6,
      reasoning: 'Default content search'
    };
  }

  /**
   * Extract entities from query using NLP
   */
  private static async extractEntities(query: string): Promise<SearchEntity[]> {
    const entities: SearchEntity[] = [];
    
    // Extract dates
    const dateMatches = this.extractDates(query);
    entities.push(...dateMatches);
    
    // Extract people names
    const personMatches = this.extractPersons(query);
    entities.push(...personMatches);
    
    // Extract topics/keywords
    const topicMatches = this.extractTopics(query);
    entities.push(...topicMatches);
    
    return entities;
  }

  /**
   * Extract date entities from query
   */
  private static extractDates(query: string): SearchEntity[] {
    const entities: SearchEntity[] = [];
    const datePatterns = [
      { pattern: /last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, type: 'relative_day' },
      { pattern: /yesterday/gi, type: 'relative_day' },
      { pattern: /today/gi, type: 'relative_day' },
      { pattern: /this\s+week/gi, type: 'relative_week' },
      { pattern: /last\s+week/gi, type: 'relative_week' },
      { pattern: /\d{1,2}\/\d{1,2}\/\d{4}/g, type: 'absolute_date' }
    ];
    
    datePatterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        entities.push({
          type: 'date',
          value: match[0],
          confidence: 0.9,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });
    
    return entities;
  }

  /**
   * Extract person entities from query
   */
  private static extractPersons(query: string): SearchEntity[] {
    const entities: SearchEntity[] = [];
    
    // Simple name pattern matching
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    let match;
    
    while ((match = namePattern.exec(query)) !== null) {
      entities.push({
        type: 'person',
        value: match[0],
        confidence: 0.7,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    return entities;
  }

  /**
   * Extract topic entities from query
   */
  private static extractTopics(query: string): SearchEntity[] {
    const entities: SearchEntity[] = [];
    
    // Common business topics
    const topicKeywords = [
      'roadmap', 'budget', 'hiring', 'product', 'feature', 'api', 'integration',
      'deadline', 'milestone', 'retrospective', 'planning', 'review', 'standup'
    ];
    
    topicKeywords.forEach(topic => {
      const regex = new RegExp(`\\b${topic}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(query)) !== null) {
        entities.push({
          type: 'topic',
          value: match[0],
          confidence: 0.8,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });
    
    return entities;
  }

  /**
   * Build search filters from extracted entities
   */
  private static buildFilters(entities: SearchEntity[]): SearchFilters {
    const filters: SearchFilters = {};
    
    // Build date range from date entities
    const dateEntities = entities.filter(e => e.type === 'date');
    if (dateEntities.length > 0) {
      filters.dateRange = this.buildDateRange(dateEntities);
    }
    
    // Build participant filter from person entities
    const personEntities = entities.filter(e => e.type === 'person');
    if (personEntities.length > 0) {
      filters.participants = personEntities.map(e => e.value);
    }
    
    // Build topic filter
    const topicEntities = entities.filter(e => e.type === 'topic');
    if (topicEntities.length > 0) {
      filters.tags = topicEntities.map(e => e.value);
    }
    
    return filters;
  }

  /**
   * Build date range from date entities
   */
  private static buildDateRange(dateEntities: SearchEntity[]): { start: string; end: string } {
    const now = new Date();
    
    for (const entity of dateEntities) {
      const value = entity.value.toLowerCase();
      
      if (value.includes('yesterday')) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          start: yesterday.toISOString().split('T')[0],
          end: yesterday.toISOString().split('T')[0]
        };
      }
      
      if (value.includes('last monday')) {
        const lastMonday = new Date(now);
        const daysBack = (now.getDay() + 6) % 7 + 7; // Last Monday
        lastMonday.setDate(lastMonday.getDate() - daysBack);
        return {
          start: lastMonday.toISOString().split('T')[0],
          end: lastMonday.toISOString().split('T')[0]
        };
      }
      
      if (value.includes('this week')) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        return {
          start: startOfWeek.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
      }
      
      if (value.includes('last week')) {
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        return {
          start: startOfLastWeek.toISOString().split('T')[0],
          end: endOfLastWeek.toISOString().split('T')[0]
        };
      }
    }
    
    // Default to last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  }

  /**
   * Perform semantic search across summaries
   */
  private static async performSemanticSearch(searchQuery: SearchQuery, summaries: any[]): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Filter summaries based on filters
    const filteredSummaries = this.applySummaryFilters(summaries, searchQuery.filters);
    
    // Score each summary for relevance
    for (const summary of filteredSummaries) {
      const relevanceScore = await this.calculateRelevanceScore(searchQuery, summary);
      
      if (relevanceScore > 0.3) { // Threshold for relevance
        const matches = this.findMatches(searchQuery.query, summary.content);
        
        results.push({
          summaryId: summary.id,
          title: summary.title || 'Untitled Summary',
          content: summary.content,
          relevanceScore,
          matchedSegments: matches,
          metadata: {
            date: summary.date,
            participants: summary.participants || [],
            tags: summary.tags || [],
            category: summary.category || 'meeting',
            priority: summary.priority || 'medium'
          },
          reasoning: `Matched ${matches.length} segments with ${Math.round(relevanceScore * 100)}% relevance`
        });
      }
    }
    
    // Sort by relevance score
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Generate conversational response
   */
  private static async generateConversationalResponse(searchQuery: SearchQuery, results: SearchResult[]): Promise<ConversationalResponse> {
    if (results.length === 0) {
      return {
        answer: "I couldn't find any summaries matching your query. Try asking about recent meetings or specific topics you've discussed.",
        results: [],
        suggestedQuestions: this.getRandomSuggestions(),
        confidence: 0
      };
    }
    
    // Generate contextual answer based on intent
    const answer = await this.generateContextualAnswer(searchQuery, results);
    
    // Generate follow-up suggestions
    const suggestedQuestions = this.generateFollowupQuestions(searchQuery, results);
    
    return {
      answer,
      results: results.slice(0, 5), // Return top 5 results
      suggestedQuestions,
      confidence: results[0]?.relevanceScore || 0
    };
  }

  /**
   * Generate contextual answer based on search intent
   */
  private static async generateContextualAnswer(searchQuery: SearchQuery, results: SearchResult[]): Promise<string> {
    const topResult = results[0];
    
    switch (searchQuery.intent.type) {
      case 'find_decisions':
        return `Based on your summaries, here are the key decisions I found: ${this.extractDecisions(results)}`;
        
      case 'find_action_items':
        return `I found these action items from your meetings: ${this.extractActionItems(results)}`;
        
      case 'find_participants':
        const participants = [...new Set(results.flatMap(r => r.metadata.participants))];
        return `The following people participated in relevant meetings: ${participants.join(', ')}`;
        
      case 'summarize_topic':
        return `Here's what I found about that topic: ${topResult.content.substring(0, 200)}...`;
        
      default:
        return `I found ${results.length} relevant summary${results.length > 1 ? 'ies' : ''} for your query. The most relevant one discusses: ${topResult.content.substring(0, 150)}...`;
    }
  }

  // Helper methods
  private static async getUserSummaries(userId: string): Promise<any[]> {
    // Mock data - in production, fetch from database
    return [
      {
        id: 'summary_1',
        title: 'Product Planning Meeting',
        content: 'We discussed the Q4 roadmap and decided to prioritize the API integration. Sarah will lead the technical specification work. The deadline is set for end of November.',
        date: '2024-06-24',
        participants: ['John Smith', 'Sarah Johnson', 'Mike Chen'],
        tags: ['planning', 'product', 'roadmap'],
        category: 'meeting',
        priority: 'high'
      },
      {
        id: 'summary_2',
        title: 'Engineering Standup',
        content: 'Daily standup covering sprint progress. API integration is 60% complete. Sarah reported some challenges with authentication. Next steps include code review and testing.',
        date: '2024-06-23',
        participants: ['Sarah Johnson', 'Mike Chen', 'Alex Wilson'],
        tags: ['standup', 'engineering', 'api'],
        category: 'meeting',
        priority: 'medium'
      }
    ];
  }

  private static applySummaryFilters(summaries: any[], filters: SearchFilters): any[] {
    return summaries.filter(summary => {
      // Date range filter
      if (filters.dateRange) {
        const summaryDate = new Date(summary.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (summaryDate < startDate || summaryDate > endDate) {
          return false;
        }
      }
      
      // Participants filter
      if (filters.participants && filters.participants.length > 0) {
        const hasParticipant = filters.participants.some(participant =>
          summary.participants?.some((p: string) => 
            p.toLowerCase().includes(participant.toLowerCase())
          )
        );
        if (!hasParticipant) return false;
      }
      
      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag =>
          summary.tags?.some((t: string) => 
            t.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasTag) return false;
      }
      
      return true;
    });
  }

  private static async calculateRelevanceScore(searchQuery: SearchQuery, summary: any): Promise<number> {
    let score = 0;
    
    // Keyword matching
    const queryWords = searchQuery.query.toLowerCase().split(' ');
    const contentWords = summary.content.toLowerCase().split(' ');
    
    const matchingWords = queryWords.filter((word: string) =>
      contentWords.some((contentWord: string) => contentWord.includes(word))
    );
    
    score += (matchingWords.length / queryWords.length) * 0.6;
    
    // Entity matching
    for (const entity of searchQuery.entities) {
      if (summary.content.toLowerCase().includes(entity.value.toLowerCase())) {
        score += entity.confidence * 0.4;
      }
    }
    
    return Math.min(score, 1);
  }

  private static findMatches(query: string, content: string): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const queryWords = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    
    queryWords.forEach(word => {
      const index = contentLower.indexOf(word);
      if (index !== -1) {
        matches.push({
          text: content.substring(index, index + word.length),
          startIndex: index,
          endIndex: index + word.length,
          matchType: 'exact',
          confidence: 1.0
        });
      }
    });
    
    return matches;
  }

  private static extractDecisions(results: SearchResult[]): string {
    // Extract decision-like content from results
    const decisions = results.flatMap(result => {
      const sentences = result.content.split('.');
      return sentences.filter(sentence => 
        sentence.toLowerCase().includes('decided') ||
        sentence.toLowerCase().includes('agreed') ||
        sentence.toLowerCase().includes('concluded')
      );
    });
    
    return decisions.slice(0, 3).join('. ') + '.';
  }

  private static extractActionItems(results: SearchResult[]): string {
    // Extract action item-like content from results
    const actionItems = results.flatMap(result => {
      const sentences = result.content.split('.');
      return sentences.filter(sentence => 
        sentence.toLowerCase().includes('will') ||
        sentence.toLowerCase().includes('should') ||
        sentence.toLowerCase().includes('next steps')
      );
    });
    
    return actionItems.slice(0, 3).join('. ') + '.';
  }

  private static generateFollowupQuestions(searchQuery: SearchQuery, results: SearchResult[]): string[] {
    const suggestions = [
      "What action items came from these meetings?",
      "Who else was involved in these discussions?",
      "When was this topic last discussed?",
      "What decisions were made about this?"
    ];
    
    return suggestions.slice(0, 3);
  }

  private static getRandomSuggestions(): string[] {
    return this.EXAMPLE_QUERIES.slice(0, 4);
  }

  private static async generatePersonalizedSuggestions(summaries: any[]): Promise<string[]> {
    // Generate suggestions based on user's actual content
    const commonTopics = this.extractCommonTopics(summaries);
    const recentParticipants = this.extractRecentParticipants(summaries);
    
    const suggestions = [
      `What did we decide about ${commonTopics[0]}?`,
      `Show me recent meetings with ${recentParticipants[0]}`,
      "What action items are still pending?",
      "Summarize this week's key decisions"
    ];
    
    return suggestions;
  }

  private static extractCommonTopics(summaries: any[]): string[] {
    const allTags = summaries.flatMap(s => s.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([tag]) => tag);
  }

  private static extractRecentParticipants(summaries: any[]): string[] {
    const recentSummaries = summaries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    
    const participants = [...new Set(recentSummaries.flatMap(s => s.participants || []))];
    return participants.slice(0, 3);
  }

  private static async trackSearch(searchQuery: SearchQuery, resultCount: number): Promise<void> {
    // Track search analytics
    console.log('Search tracked:', {
      query: searchQuery.query,
      intent: searchQuery.intent.type,
      resultCount,
      timestamp: searchQuery.timestamp
    });
  }
}
