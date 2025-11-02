/**
 * News Integration Service
 * Handles fetching, caching, and processing of UPSC-relevant news from multiple sources
 * Integrates with AI Service Manager for summarization and categorization
 */
class NewsIntegrationService {
    constructor(config = {}) {
        this.config = {
            // News API configuration
            newsAPIKey: config.newsAPIKey || null,
            sources: config.sources || ['newsapi', 'rss'],
            updateInterval: config.updateInterval || 3600000, // 1 hour in milliseconds
            cacheTimeout: config.cacheTimeout || 7200000, // 2 hours in milliseconds
            maxArticlesPerFetch: config.maxArticlesPerFetch || 50,
            
            // UPSC-specific configuration
            upscKeywords: config.upscKeywords || [
                'government', 'policy', 'economy', 'politics', 'international relations',
                'environment', 'science', 'technology', 'current affairs', 'india',
                'parliament', 'supreme court', 'constitution', 'budget', 'gdp'
            ],
            upscSources: config.upscSources || [
                'the-hindu', 'indian-express', 'times-of-india', 'economic-times',
                'business-standard', 'livemint', 'firstpost', 'ndtv'
            ],
            
            // Credibility scoring
            sourceCredibility: config.sourceCredibility || {
                'the-hindu': 9,
                'indian-express': 9,
                'economic-times': 8,
                'business-standard': 8,
                'times-of-india': 7,
                'livemint': 8,
                'ndtv': 7,
                'firstpost': 6
            },
            
            ...config
        };
        
        // Internal state
        this.cache = new Map();
        this.updateTimer = null;
        this.isInitialized = false;
        this.aiService = null; // Will be set when AI service is available
        
        // News categories mapping to UPSC subjects
        this.upscCategories = {
            'polity': ['government', 'politics', 'parliament', 'constitution', 'judiciary', 'governance'],
            'economics': ['economy', 'budget', 'gdp', 'inflation', 'trade', 'finance', 'banking'],
            'geography': ['climate', 'environment', 'natural disasters', 'geography', 'mapping'],
            'history': ['heritage', 'culture', 'archaeology', 'historical'],
            'science': ['science', 'technology', 'research', 'innovation', 'space'],
            'environment': ['environment', 'pollution', 'climate change', 'conservation', 'ecology'],
            'international': ['international', 'foreign policy', 'diplomacy', 'global', 'world']
        };
        
        this.initialize();
    }

    /**
     * Initialize the News Integration Service
     */
    async initialize() {
        try {
            // Set up AI service integration if available
            if (window.AIServiceManager) {
                // AI service will be set when needed
                console.log('AI Service integration available for news processing');
            }
            
            // Load cached news data
            await this.loadCachedNews();
            
            // Start automatic updates
            this.startAutoUpdates();
            
            this.isInitialized = true;
            console.log('News Integration Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize News Integration Service:', error);
            throw error;
        }
    }

    /**
     * Set AI Service for summarization and analysis
     * @param {AIServiceManager} aiService - AI Service Manager instance
     */
    setAIService(aiService) {
        this.aiService = aiService;
        console.log('AI Service connected to News Integration Service');
    }

    /**
     * Fetch latest UPSC-relevant news from multiple sources
     * @param {Array} categories - News categories to fetch
     * @param {number} limit - Maximum number of articles
     * @returns {Promise<Array>} Array of news articles
     */
    async fetchLatestNews(categories = [], limit = null) {
        try {
            const maxArticles = limit || this.config.maxArticlesPerFetch;
            const allArticles = [];
            
            // Check cache first
            const cacheKey = this.generateCacheKey('latest', categories, maxArticles);
            const cachedNews = this.getCachedNews(cacheKey);
            
            if (cachedNews && this.isCacheValid(cachedNews.timestamp)) {
                console.log('Returning cached news articles');
                return cachedNews.articles.slice(0, maxArticles);
            }
            
            // Fetch from News API
            if (this.config.newsAPIKey && this.config.sources.includes('newsapi')) {
                const newsAPIArticles = await this.fetchFromNewsAPI(categories, maxArticles);
                allArticles.push(...newsAPIArticles);
            }
            
            // Fetch from RSS feeds
            if (this.config.sources.includes('rss')) {
                const rssArticles = await this.fetchFromRSS(categories, maxArticles);
                allArticles.push(...rssArticles);
            }
            
            // Process and filter articles
            const processedArticles = await this.processArticles(allArticles);
            const relevantArticles = this.filterUPSCRelevant(processedArticles);
            
            // Sort by relevance and credibility
            const sortedArticles = this.sortByRelevanceAndCredibility(relevantArticles);
            const finalArticles = sortedArticles.slice(0, maxArticles);
            
            // Cache the results
            this.cacheNews(cacheKey, finalArticles);
            
            console.log(`Fetched ${finalArticles.length} UPSC-relevant news articles`);
            return finalArticles;
            
        } catch (error) {
            console.error('Error fetching latest news:', error);
            throw this.handleNewsError(error);
        }
    }

    /**
     * Fetch news from News API
     * @param {Array} categories - Categories to fetch
     * @param {number} limit - Maximum articles
     * @returns {Promise<Array>} News articles
     */
    async fetchFromNewsAPI(categories = [], limit = 20) {
        if (!this.config.newsAPIKey) {
            console.warn('News API key not configured');
            return [];
        }
        
        try {
            const query = this.buildNewsAPIQuery(categories);
            const sources = this.config.upscSources.join(',');
            
            const url = `https://newsapi.org/v2/everything?` +
                `q=${encodeURIComponent(query)}&` +
                `sources=${sources}&` +
                `language=en&` +
                `sortBy=publishedAt&` +
                `pageSize=${limit}&` +
                `apiKey=${this.config.newsAPIKey}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`News API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error(`News API error: ${data.message || 'Unknown error'}`);
            }
            
            return this.formatNewsAPIArticles(data.articles || []);
            
        } catch (error) {
            console.error('Error fetching from News API:', error);
            return [];
        }
    }

    /**
     * Fetch news from RSS feeds (placeholder for future implementation)
     * @param {Array} categories - Categories to fetch
     * @param {number} limit - Maximum articles
     * @returns {Promise<Array>} News articles
     */
    async fetchFromRSS(categories = [], limit = 20) {
        // Placeholder for RSS feed integration
        // This would require a CORS proxy or server-side implementation
        console.log('RSS feed integration placeholder - would fetch from RSS sources');
        return [];
    }

    /**
     * Process raw articles and add metadata
     * @param {Array} articles - Raw articles
     * @returns {Promise<Array>} Processed articles
     */
    async processArticles(articles) {
        const processedArticles = [];
        
        for (const article of articles) {
            try {
                const processed = {
                    ...article,
                    id: this.generateArticleId(article),
                    processedAt: new Date().toISOString(),
                    upscRelevance: this.calculateUPSCRelevance(article),
                    category: this.categorizeArticle(article),
                    credibilityScore: this.getSourceCredibility(article.source?.name),
                    keywords: this.extractKeywords(article),
                    readingTime: this.estimateReadingTime(article.content || article.description)
                };
                
                // Add AI summary if AI service is available
                if (this.aiService && processed.upscRelevance.score >= 5) {
                    try {
                        processed.aiSummary = await this.summarizeArticle(processed);
                        processed.keyPoints = await this.extractKeyPoints(processed);
                    } catch (error) {
                        console.warn('Failed to generate AI summary for article:', error);
                        // Continue without AI summary
                    }
                }
                
                processedArticles.push(processed);
            } catch (error) {
                console.error('Error processing article:', error);
                // Continue with other articles
            }
        }
        
        return processedArticles;
    }

    /**
     * Summarize a news article using AI
     * @param {Object} article - Article to summarize
     * @param {Object} options - Summarization options
     * @returns {Promise<Object>} Summary with metadata
     */
    async summarizeArticle(article, options = {}) {
        if (!this.aiService) {
            throw new Error('AI service not available for summarization');
        }
        
        try {
            // Configure summarization options
            const summaryConfig = {
                length: options.length || 'medium', // 'short', 'medium', 'long'
                focus: options.focus || 'upsc', // 'upsc', 'general', 'exam'
                includeAnalysis: options.includeAnalysis !== false,
                ...options
            };
            
            // Build summarization prompt
            const prompt = this.buildSummarizationPrompt(article, summaryConfig);
            
            // Set AI service to news mode for appropriate context
            const originalMode = this.aiService.currentMode;
            this.aiService.setMode('news');
            
            // Generate summary
            const response = await this.aiService.sendMessage(prompt, {
                autoSave: false, // Don't auto-save news summaries
                apiOptions: {
                    temperature: 0.3, // Lower temperature for more consistent summaries
                    maxOutputTokens: this.getSummaryTokenLimit(summaryConfig.length)
                }
            });
            
            // Restore original mode
            this.aiService.setMode(originalMode);
            
            // Parse and structure the summary
            const summary = this.parseSummaryResponse(response.content, summaryConfig);
            
            return {
                ...summary,
                generatedAt: new Date().toISOString(),
                config: summaryConfig,
                processingTime: response.processingTime,
                confidence: this.calculateSummaryConfidence(article, summary)
            };
            
        } catch (error) {
            console.error('Error summarizing article:', error);
            throw new Error(`Failed to summarize article: ${error.message}`);
        }
    }

    /**
     * Extract key points from article using AI
     * @param {Object} article - Article to analyze
     * @param {number} maxPoints - Maximum number of key points
     * @returns {Promise<Array>} Array of key points
     */
    async extractKeyPoints(article, maxPoints = 5) {
        if (!this.aiService) {
            return this.extractBasicKeyPoints(article, maxPoints);
        }
        
        try {
            const prompt = this.buildKeyPointsPrompt(article, maxPoints);
            
            // Set AI service to news mode
            const originalMode = this.aiService.currentMode;
            this.aiService.setMode('news');
            
            const response = await this.aiService.sendMessage(prompt, {
                autoSave: false,
                apiOptions: {
                    temperature: 0.2,
                    maxOutputTokens: 512
                }
            });
            
            // Restore original mode
            this.aiService.setMode(originalMode);
            
            // Parse key points from response
            const keyPoints = this.parseKeyPointsResponse(response.content);
            
            return keyPoints.slice(0, maxPoints);
            
        } catch (error) {
            console.warn('AI key points extraction failed, using basic extraction:', error);
            return this.extractBasicKeyPoints(article, maxPoints);
        }
    }

    /**
     * Analyze UPSC relevance of article using AI
     * @param {Object} article - Article to analyze
     * @param {string} examContext - Specific exam context (prelims, mains, interview)
     * @returns {Promise<Object>} Detailed relevance analysis
     */
    async analyzeUPSCRelevance(article, examContext = 'general') {
        if (!this.aiService) {
            return this.calculateUPSCRelevance(article);
        }
        
        try {
            const prompt = this.buildRelevanceAnalysisPrompt(article, examContext);
            
            // Set AI service to news mode
            const originalMode = this.aiService.currentMode;
            this.aiService.setMode('news');
            
            const response = await this.aiService.sendMessage(prompt, {
                autoSave: false,
                apiOptions: {
                    temperature: 0.3,
                    maxOutputTokens: 1024
                }
            });
            
            // Restore original mode
            this.aiService.setMode(originalMode);
            
            // Parse relevance analysis
            const analysis = this.parseRelevanceAnalysis(response.content);
            
            return {
                ...analysis,
                generatedAt: new Date().toISOString(),
                examContext: examContext,
                aiGenerated: true
            };
            
        } catch (error) {
            console.warn('AI relevance analysis failed, using basic analysis:', error);
            return this.calculateUPSCRelevance(article);
        }
    }

    /**
     * Build summarization prompt for AI
     * @param {Object} article - Article to summarize
     * @param {Object} config - Summarization configuration
     * @returns {string} Formatted prompt
     */
    buildSummarizationPrompt(article, config) {
        const lengthInstructions = {
            'short': 'in 2-3 sentences (50-75 words)',
            'medium': 'in 4-6 sentences (100-150 words)',
            'long': 'in 7-10 sentences (200-300 words)'
        };
        
        const focusInstructions = {
            'upsc': 'Focus on UPSC Civil Services exam relevance, including which subjects and topics this relates to.',
            'general': 'Provide a general summary suitable for current affairs preparation.',
            'exam': 'Emphasize facts, figures, and key information likely to appear in competitive exams.'
        };
        
        let prompt = `Please summarize the following news article ${lengthInstructions[config.length]}. `;
        prompt += `${focusInstructions[config.focus]} `;
        
        if (config.includeAnalysis) {
            prompt += `Also provide a brief analysis of why this is important for UPSC preparation. `;
        }
        
        prompt += `\n\nArticle Title: ${article.title}\n`;
        
        if (article.description) {
            prompt += `Description: ${article.description}\n`;
        }
        
        if (article.content && article.content !== article.description) {
            // Limit content length to avoid token limits
            const content = article.content.substring(0, 2000);
            prompt += `Content: ${content}\n`;
        }
        
        prompt += `\nPlease provide the summary in the following format:
SUMMARY: [Your summary here]
${config.includeAnalysis ? 'UPSC RELEVANCE: [Analysis of UPSC importance]' : ''}
SUBJECTS: [Relevant UPSC subjects, comma-separated]
KEY TERMS: [Important terms/concepts, comma-separated]`;
        
        return prompt;
    }

    /**
     * Build key points extraction prompt
     * @param {Object} article - Article to analyze
     * @param {number} maxPoints - Maximum points to extract
     * @returns {string} Formatted prompt
     */
    buildKeyPointsPrompt(article, maxPoints) {
        let prompt = `Extract the ${maxPoints} most important key points from this news article for UPSC preparation. `;
        prompt += `Focus on facts, figures, policy changes, and exam-relevant information.\n\n`;
        
        prompt += `Article Title: ${article.title}\n`;
        
        if (article.description) {
            prompt += `Description: ${article.description}\n`;
        }
        
        if (article.content) {
            const content = article.content.substring(0, 1500);
            prompt += `Content: ${content}\n`;
        }
        
        prompt += `\nPlease list the key points in this format:
1. [First key point]
2. [Second key point]
3. [Third key point]
...and so on.`;
        
        return prompt;
    }

    /**
     * Build UPSC relevance analysis prompt
     * @param {Object} article - Article to analyze
     * @param {string} examContext - Exam context
     * @returns {string} Formatted prompt
     */
    buildRelevanceAnalysisPrompt(article, examContext) {
        let prompt = `Analyze the UPSC Civil Services exam relevance of this news article. `;
        prompt += `Consider its importance for ${examContext === 'general' ? 'all stages' : examContext} of the exam.\n\n`;
        
        prompt += `Article Title: ${article.title}\n`;
        
        if (article.description) {
            prompt += `Description: ${article.description}\n`;
        }
        
        prompt += `\nPlease provide analysis in this format:
RELEVANCE SCORE: [Score from 1-10]
EXAM IMPORTANCE: [High/Medium/Low]
SUBJECTS: [Relevant UPSC subjects]
TOPICS: [Specific topics within subjects]
EXAM STAGES: [Prelims/Mains/Interview - which stages this is relevant for]
WHY IMPORTANT: [Brief explanation of why this matters for UPSC]
POTENTIAL QUESTIONS: [Types of questions that could be asked]`;
        
        return prompt;
    }

    /**
     * Parse AI summary response
     * @param {string} response - AI response text
     * @param {Object} config - Summary configuration
     * @returns {Object} Parsed summary
     */
    parseSummaryResponse(response, config) {
        const summary = {
            text: '',
            upscRelevance: '',
            subjects: [],
            keyTerms: [],
            length: config.length,
            focus: config.focus
        };
        
        try {
            const lines = response.split('\n').map(line => line.trim()).filter(line => line);
            
            for (const line of lines) {
                if (line.startsWith('SUMMARY:')) {
                    summary.text = line.replace('SUMMARY:', '').trim();
                } else if (line.startsWith('UPSC RELEVANCE:')) {
                    summary.upscRelevance = line.replace('UPSC RELEVANCE:', '').trim();
                } else if (line.startsWith('SUBJECTS:')) {
                    const subjectsText = line.replace('SUBJECTS:', '').trim();
                    summary.subjects = subjectsText.split(',').map(s => s.trim()).filter(s => s);
                } else if (line.startsWith('KEY TERMS:')) {
                    const termsText = line.replace('KEY TERMS:', '').trim();
                    summary.keyTerms = termsText.split(',').map(t => t.trim()).filter(t => t);
                }
            }
            
            // If no structured format found, use the entire response as summary
            if (!summary.text && response.trim()) {
                summary.text = response.trim();
            }
            
        } catch (error) {
            console.warn('Error parsing summary response:', error);
            summary.text = response.trim();
        }
        
        return summary;
    }

    /**
     * Parse key points from AI response
     * @param {string} response - AI response text
     * @returns {Array} Array of key points
     */
    parseKeyPointsResponse(response) {
        const keyPoints = [];
        
        try {
            const lines = response.split('\n').map(line => line.trim()).filter(line => line);
            
            for (const line of lines) {
                // Match numbered list items (1. 2. 3. etc.)
                const match = line.match(/^\d+\.\s*(.+)$/);
                if (match) {
                    keyPoints.push(match[1].trim());
                } else if (line.startsWith('•') || line.startsWith('-')) {
                    // Handle bullet points
                    keyPoints.push(line.substring(1).trim());
                }
            }
            
            // If no structured format found, split by sentences
            if (keyPoints.length === 0) {
                const sentences = response.split(/[.!?]+/).map(s => s.trim()).filter(s => s);
                keyPoints.push(...sentences.slice(0, 5));
            }
            
        } catch (error) {
            console.warn('Error parsing key points response:', error);
        }
        
        return keyPoints;
    }

    /**
     * Parse UPSC relevance analysis from AI response
     * @param {string} response - AI response text
     * @returns {Object} Parsed relevance analysis
     */
    parseRelevanceAnalysis(response) {
        const analysis = {
            score: 5,
            examImportance: 'medium',
            subjects: [],
            topics: [],
            examStages: [],
            explanation: '',
            potentialQuestions: []
        };
        
        try {
            const lines = response.split('\n').map(line => line.trim()).filter(line => line);
            
            for (const line of lines) {
                if (line.startsWith('RELEVANCE SCORE:')) {
                    const scoreText = line.replace('RELEVANCE SCORE:', '').trim();
                    const score = parseInt(scoreText);
                    if (!isNaN(score) && score >= 1 && score <= 10) {
                        analysis.score = score;
                    }
                } else if (line.startsWith('EXAM IMPORTANCE:')) {
                    const importance = line.replace('EXAM IMPORTANCE:', '').trim().toLowerCase();
                    if (['high', 'medium', 'low'].includes(importance)) {
                        analysis.examImportance = importance;
                    }
                } else if (line.startsWith('SUBJECTS:')) {
                    const subjectsText = line.replace('SUBJECTS:', '').trim();
                    analysis.subjects = subjectsText.split(',').map(s => s.trim()).filter(s => s);
                } else if (line.startsWith('TOPICS:')) {
                    const topicsText = line.replace('TOPICS:', '').trim();
                    analysis.topics = topicsText.split(',').map(t => t.trim()).filter(t => t);
                } else if (line.startsWith('EXAM STAGES:')) {
                    const stagesText = line.replace('EXAM STAGES:', '').trim();
                    analysis.examStages = stagesText.split(',').map(s => s.trim()).filter(s => s);
                } else if (line.startsWith('WHY IMPORTANT:')) {
                    analysis.explanation = line.replace('WHY IMPORTANT:', '').trim();
                } else if (line.startsWith('POTENTIAL QUESTIONS:')) {
                    const questionsText = line.replace('POTENTIAL QUESTIONS:', '').trim();
                    analysis.potentialQuestions = questionsText.split(',').map(q => q.trim()).filter(q => q);
                }
            }
            
        } catch (error) {
            console.warn('Error parsing relevance analysis:', error);
        }
        
        return analysis;
    }

    /**
     * Extract basic key points without AI (fallback method)
     * @param {Object} article - Article to analyze
     * @param {number} maxPoints - Maximum points to extract
     * @returns {Array} Basic key points
     */
    extractBasicKeyPoints(article, maxPoints = 5) {
        const keyPoints = [];
        
        try {
            const text = article.content || article.description || '';
            
            // Split into sentences and filter for important ones
            const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
            
            // Prioritize sentences with UPSC keywords
            const scoredSentences = sentences.map(sentence => {
                let score = 0;
                const lowerSentence = sentence.toLowerCase();
                
                // Score based on UPSC keywords
                for (const keyword of this.config.upscKeywords) {
                    if (lowerSentence.includes(keyword.toLowerCase())) {
                        score += 2;
                    }
                }
                
                // Score based on numbers/statistics
                if (/\d+/.test(sentence)) {
                    score += 1;
                }
                
                // Score based on policy/government terms
                if (lowerSentence.includes('government') || lowerSentence.includes('policy')) {
                    score += 1;
                }
                
                return { sentence, score };
            });
            
            // Sort by score and take top sentences
            const topSentences = scoredSentences
                .sort((a, b) => b.score - a.score)
                .slice(0, maxPoints)
                .map(item => item.sentence);
            
            keyPoints.push(...topSentences);
            
        } catch (error) {
            console.warn('Error extracting basic key points:', error);
        }
        
        return keyPoints;
    }

    /**
     * Get token limit for summary length
     * @param {string} length - Summary length (short, medium, long)
     * @returns {number} Token limit
     */
    getSummaryTokenLimit(length) {
        const limits = {
            'short': 128,
            'medium': 256,
            'long': 512
        };
        
        return limits[length] || limits.medium;
    }

    /**
     * Calculate confidence score for AI summary
     * @param {Object} article - Original article
     * @param {Object} summary - Generated summary
     * @returns {number} Confidence score (0-1)
     */
    calculateSummaryConfidence(article, summary) {
        let confidence = 0.5; // Base confidence
        
        // Increase confidence if summary has structured elements
        if (summary.subjects && summary.subjects.length > 0) {
            confidence += 0.2;
        }
        
        if (summary.keyTerms && summary.keyTerms.length > 0) {
            confidence += 0.1;
        }
        
        if (summary.upscRelevance && summary.upscRelevance.length > 0) {
            confidence += 0.1;
        }
        
        // Decrease confidence if summary is too short or too long
        const summaryLength = summary.text ? summary.text.length : 0;
        if (summaryLength < 50 || summaryLength > 500) {
            confidence -= 0.1;
        }
        
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Filter articles for UPSC relevance
     * @param {Array} articles - Articles to filter
     * @returns {Array} UPSC-relevant articles
     */
    filterUPSCRelevant(articles) {
        return articles.filter(article => {
            // Check relevance score threshold
            if (article.upscRelevance.score < 3) {
                return false;
            }
            
            // Check for UPSC keywords
            const hasUPSCKeywords = this.config.upscKeywords.some(keyword => 
                article.title?.toLowerCase().includes(keyword.toLowerCase()) ||
                article.description?.toLowerCase().includes(keyword.toLowerCase())
            );
            
            // Check source credibility
            const hasGoodCredibility = article.credibilityScore >= 6;
            
            return hasUPSCKeywords && hasGoodCredibility;
        });
    }

    /**
     * Sort articles by relevance and credibility
     * @param {Array} articles - Articles to sort
     * @returns {Array} Sorted articles
     */
    sortByRelevanceAndCredibility(articles) {
        return articles.sort((a, b) => {
            // Primary sort: UPSC relevance score
            const relevanceDiff = b.upscRelevance.score - a.upscRelevance.score;
            if (relevanceDiff !== 0) return relevanceDiff;
            
            // Secondary sort: Source credibility
            const credibilityDiff = b.credibilityScore - a.credibilityScore;
            if (credibilityDiff !== 0) return credibilityDiff;
            
            // Tertiary sort: Publication date (newer first)
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        });
    }

    /**
     * Calculate UPSC relevance score for an article
     * @param {Object} article - Article to analyze
     * @returns {Object} Relevance analysis
     */
    calculateUPSCRelevance(article) {
        let score = 0;
        const subjects = [];
        const topics = [];
        
        const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
        
        // Check each UPSC category
        for (const [subject, keywords] of Object.entries(this.upscCategories)) {
            let subjectScore = 0;
            const matchedKeywords = [];
            
            for (const keyword of keywords) {
                if (text.includes(keyword.toLowerCase())) {
                    subjectScore += 1;
                    matchedKeywords.push(keyword);
                }
            }
            
            if (subjectScore > 0) {
                subjects.push(subject);
                topics.push(...matchedKeywords);
                score += subjectScore;
            }
        }
        
        // Bonus for government/policy content
        if (text.includes('government') || text.includes('policy')) {
            score += 2;
        }
        
        // Bonus for Indian context
        if (text.includes('india') || text.includes('indian')) {
            score += 1;
        }
        
        return {
            score: Math.min(score, 10), // Cap at 10
            subjects: [...new Set(subjects)],
            topics: [...new Set(topics)],
            examImportance: score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low'
        };
    }

    /**
     * Categorize article by primary UPSC subject
     * @param {Object} article - Article to categorize
     * @returns {string} Primary category
     */
    categorizeArticle(article) {
        const relevance = article.upscRelevance || this.calculateUPSCRelevance(article);
        
        if (relevance.subjects.length === 0) {
            return 'general';
        }
        
        // Return the first (most relevant) subject
        return relevance.subjects[0];
    }

    /**
     * Get source credibility score
     * @param {string} sourceName - Name of the news source
     * @returns {number} Credibility score (1-10)
     */
    getSourceCredibility(sourceName) {
        if (!sourceName) return 5; // Default score
        
        const normalizedName = sourceName.toLowerCase().replace(/\s+/g, '-');
        return this.config.sourceCredibility[normalizedName] || 5;
    }

    /**
     * Extract keywords from article
     * @param {Object} article - Article to analyze
     * @returns {Array} Extracted keywords
     */
    extractKeywords(article) {
        const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
        const keywords = [];
        
        // Extract UPSC-relevant keywords
        for (const keyword of this.config.upscKeywords) {
            if (text.includes(keyword.toLowerCase())) {
                keywords.push(keyword);
            }
        }
        
        return [...new Set(keywords)];
    }

    /**
     * Estimate reading time for article
     * @param {string} content - Article content
     * @returns {number} Estimated reading time in minutes
     */
    estimateReadingTime(content) {
        if (!content) return 1;
        
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    /**
     * Build query string for News API
     * @param {Array} categories - Categories to include
     * @returns {string} Query string
     */
    buildNewsAPIQuery(categories = []) {
        let query = this.config.upscKeywords.slice(0, 5).join(' OR '); // Limit to avoid long URLs
        
        if (categories.length > 0) {
            const categoryKeywords = categories.flatMap(cat => 
                this.upscCategories[cat] || []
            ).slice(0, 3);
            
            if (categoryKeywords.length > 0) {
                query += ' AND (' + categoryKeywords.join(' OR ') + ')';
            }
        }
        
        return query;
    }

    /**
     * Format News API articles to standard format
     * @param {Array} articles - Raw News API articles
     * @returns {Array} Formatted articles
     */
    formatNewsAPIArticles(articles) {
        return articles.map(article => ({
            title: article.title,
            description: article.description,
            content: article.content,
            url: article.url,
            urlToImage: article.urlToImage,
            publishedAt: article.publishedAt,
            source: {
                name: article.source?.name,
                url: article.url
            },
            author: article.author
        }));
    }

    /**
     * Cache news articles
     * @param {string} key - Cache key
     * @param {Array} articles - Articles to cache
     */
    cacheNews(key, articles) {
        this.cache.set(key, {
            articles: articles,
            timestamp: Date.now()
        });
        
        // Persist to localStorage if available
        try {
            const cacheData = {
                articles: articles,
                timestamp: Date.now()
            };
            localStorage.setItem(`news_cache_${key}`, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to persist news cache:', error);
        }
    }

    /**
     * Get cached news articles
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null
     */
    getCachedNews(key) {
        // Check memory cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        // Check localStorage
        try {
            const cached = localStorage.getItem(`news_cache_${key}`);
            if (cached) {
                const data = JSON.parse(cached);
                this.cache.set(key, data); // Update memory cache
                return data;
            }
        } catch (error) {
            console.warn('Failed to load cached news:', error);
        }
        
        return null;
    }

    /**
     * Check if cached data is still valid
     * @param {number} timestamp - Cache timestamp
     * @returns {boolean} Whether cache is valid
     */
    isCacheValid(timestamp) {
        return (Date.now() - timestamp) < this.config.cacheTimeout;
    }

    /**
     * Load cached news data from localStorage
     */
    async loadCachedNews() {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('news_cache_'));
            
            for (const key of keys) {
                const cacheKey = key.replace('news_cache_', '');
                const data = JSON.parse(localStorage.getItem(key));
                
                if (this.isCacheValid(data.timestamp)) {
                    this.cache.set(cacheKey, data);
                } else {
                    // Remove expired cache
                    localStorage.removeItem(key);
                }
            }
            
            console.log(`Loaded ${this.cache.size} cached news entries`);
        } catch (error) {
            console.warn('Failed to load cached news:', error);
        }
    }

    /**
     * Start automatic news updates
     */
    startAutoUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(async () => {
            try {
                console.log('Running scheduled news update...');
                await this.fetchLatestNews();
            } catch (error) {
                console.error('Scheduled news update failed:', error);
            }
        }, this.config.updateInterval);
        
        console.log(`News auto-updates scheduled every ${this.config.updateInterval / 60000} minutes`);
    }

    /**
     * Stop automatic updates
     */
    stopAutoUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
            console.log('News auto-updates stopped');
        }
    }

    /**
     * Generate cache key
     * @param {string} type - Cache type
     * @param {Array} categories - Categories
     * @param {number} limit - Article limit
     * @returns {string} Cache key
     */
    generateCacheKey(type, categories = [], limit = 50) {
        const categoryStr = categories.sort().join(',');
        return `${type}_${categoryStr}_${limit}`;
    }

    /**
     * Generate unique article ID
     * @param {Object} article - Article object
     * @returns {string} Unique ID
     */
    generateArticleId(article) {
        const source = article.source?.name || 'unknown';
        const title = article.title || 'untitled';
        const date = article.publishedAt || new Date().toISOString();
        
        // Create hash-like ID from article properties
        const str = `${source}_${title}_${date}`;
        return 'article_' + btoa(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }

    /**
     * Handle news service errors
     * @param {Error} error - Original error
     * @returns {Error} Processed error
     */
    handleNewsError(error) {
        if (error.message.includes('API key')) {
            return new Error('News service authentication failed. Please check your API configuration.');
        }
        
        if (error.message.includes('Rate limit')) {
            return new Error('News service rate limit exceeded. Please try again later.');
        }
        
        if (error.message.includes('Network')) {
            return new Error('Unable to connect to news service. Please check your internet connection.');
        }
        
        return new Error(`News service error: ${error.message}`);
    }

    /**
     * Get service status and statistics
     * @returns {Object} Service status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            cacheSize: this.cache.size,
            autoUpdatesActive: !!this.updateTimer,
            lastUpdate: this.getLastUpdateTime(),
            configuredSources: this.config.sources,
            hasAPIKey: !!this.config.newsAPIKey
        };
    }

    /**
     * Get last update time from cache
     * @returns {string|null} Last update timestamp
     */
    getLastUpdateTime() {
        let latestTime = 0;
        
        for (const [key, data] of this.cache.entries()) {
            if (data.timestamp > latestTime) {
                latestTime = data.timestamp;
            }
        }
        
        return latestTime > 0 ? new Date(latestTime).toISOString() : null;
    }

    /**
     * Clear all cached news data
     */
    clearCache() {
        this.cache.clear();
        
        // Clear localStorage cache
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('news_cache_'));
            keys.forEach(key => localStorage.removeItem(key));
            console.log('News cache cleared');
        } catch (error) {
            console.warn('Failed to clear localStorage cache:', error);
        }
    }

    /**
     * Search and filter news articles
     * @param {Object} filters - Search and filter criteria
     * @returns {Promise<Array>} Filtered articles
     */
    async searchNews(filters = {}) {
        try {
            const {
                query = '',
                categories = [],
                subjects = [],
                dateRange = null,
                relevanceThreshold = 3,
                credibilityThreshold = 5,
                limit = 50,
                sortBy = 'relevance' // 'relevance', 'date', 'credibility'
            } = filters;
            
            // Get all cached articles first
            let articles = [];
            for (const [key, data] of this.cache.entries()) {
                if (this.isCacheValid(data.timestamp)) {
                    articles.push(...data.articles);
                }
            }
            
            // If no cached articles, fetch fresh ones
            if (articles.length === 0) {
                articles = await this.fetchLatestNews(categories, limit * 2);
            }
            
            // Apply filters
            let filteredArticles = articles;
            
            // Text search filter
            if (query.trim()) {
                filteredArticles = this.filterByQuery(filteredArticles, query);
            }
            
            // Category filter
            if (categories.length > 0) {
                filteredArticles = this.filterByCategories(filteredArticles, categories);
            }
            
            // Subject filter
            if (subjects.length > 0) {
                filteredArticles = this.filterBySubjects(filteredArticles, subjects);
            }
            
            // Date range filter
            if (dateRange) {
                filteredArticles = this.filterByDateRange(filteredArticles, dateRange);
            }
            
            // Relevance threshold filter
            filteredArticles = filteredArticles.filter(article => 
                (article.upscRelevance?.score || 0) >= relevanceThreshold
            );
            
            // Credibility threshold filter
            filteredArticles = filteredArticles.filter(article => 
                (article.credibilityScore || 0) >= credibilityThreshold
            );
            
            // Sort articles
            filteredArticles = this.sortArticles(filteredArticles, sortBy);
            
            // Remove duplicates
            filteredArticles = this.removeDuplicateArticles(filteredArticles);
            
            // Limit results
            return filteredArticles.slice(0, limit);
            
        } catch (error) {
            console.error('Error searching news:', error);
            throw this.handleNewsError(error);
        }
    }

    /**
     * Get articles by specific UPSC category
     * @param {string} category - UPSC category (polity, economics, etc.)
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Category-specific articles
     */
    async getArticlesByCategory(category, options = {}) {
        const {
            limit = 20,
            includeSubcategories = true,
            minRelevance = 4
        } = options;
        
        try {
            // Validate category
            if (!this.upscCategories[category]) {
                throw new Error(`Invalid UPSC category: ${category}`);
            }
            
            // Search for articles in this category
            const filters = {
                categories: [category],
                relevanceThreshold: minRelevance,
                limit: limit,
                sortBy: 'relevance'
            };
            
            const articles = await this.searchNews(filters);
            
            // Add category-specific analysis if AI service is available
            if (this.aiService && articles.length > 0) {
                for (const article of articles.slice(0, 5)) { // Limit AI processing
                    try {
                        if (!article.categoryAnalysis) {
                            article.categoryAnalysis = await this.analyzeCategoryRelevance(article, category);
                        }
                    } catch (error) {
                        console.warn('Failed to analyze category relevance:', error);
                    }
                }
            }
            
            return articles;
            
        } catch (error) {
            console.error(`Error getting articles for category ${category}:`, error);
            throw this.handleNewsError(error);
        }
    }

    /**
     * Get trending topics in UPSC news
     * @param {Object} options - Options for trend analysis
     * @returns {Promise<Array>} Trending topics with metadata
     */
    async getTrendingTopics(options = {}) {
        const {
            timeframe = 7, // days
            minArticles = 3,
            limit = 10
        } = options;
        
        try {
            // Get recent articles
            const dateRange = {
                from: new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000),
                to: new Date()
            };
            
            const articles = await this.searchNews({
                dateRange: dateRange,
                relevanceThreshold: 4,
                limit: 200
            });
            
            // Analyze topics and keywords
            const topicFrequency = new Map();
            const keywordFrequency = new Map();
            
            for (const article of articles) {
                // Count topics from UPSC relevance
                if (article.upscRelevance?.topics) {
                    for (const topic of article.upscRelevance.topics) {
                        const count = topicFrequency.get(topic) || 0;
                        topicFrequency.set(topic, count + 1);
                    }
                }
                
                // Count keywords
                if (article.keywords) {
                    for (const keyword of article.keywords) {
                        const count = keywordFrequency.get(keyword) || 0;
                        keywordFrequency.set(keyword, count + 1);
                    }
                }
            }
            
            // Build trending topics
            const trendingTopics = [];
            
            for (const [topic, count] of topicFrequency.entries()) {
                if (count >= minArticles) {
                    const relatedArticles = articles.filter(article => 
                        article.upscRelevance?.topics?.includes(topic)
                    );
                    
                    trendingTopics.push({
                        topic: topic,
                        articleCount: count,
                        trend: this.calculateTrendDirection(topic, articles, timeframe),
                        category: this.getTopicCategory(topic),
                        relevanceScore: this.calculateTopicRelevance(relatedArticles),
                        sampleArticles: relatedArticles.slice(0, 3),
                        keywords: this.getTopicKeywords(relatedArticles)
                    });
                }
            }
            
            // Sort by relevance and article count
            trendingTopics.sort((a, b) => {
                const scoreA = a.relevanceScore * a.articleCount;
                const scoreB = b.relevanceScore * b.articleCount;
                return scoreB - scoreA;
            });
            
            return trendingTopics.slice(0, limit);
            
        } catch (error) {
            console.error('Error getting trending topics:', error);
            throw this.handleNewsError(error);
        }
    }

    /**
     * Analyze category relevance for an article
     * @param {Object} article - Article to analyze
     * @param {string} category - UPSC category
     * @returns {Promise<Object>} Category analysis
     */
    async analyzeCategoryRelevance(article, category) {
        if (!this.aiService) {
            return this.getBasicCategoryAnalysis(article, category);
        }
        
        try {
            const prompt = this.buildCategoryAnalysisPrompt(article, category);
            
            const originalMode = this.aiService.currentMode;
            this.aiService.setMode('news');
            
            const response = await this.aiService.sendMessage(prompt, {
                autoSave: false,
                apiOptions: {
                    temperature: 0.3,
                    maxOutputTokens: 512
                }
            });
            
            this.aiService.setMode(originalMode);
            
            return this.parseCategoryAnalysis(response.content, category);
            
        } catch (error) {
            console.warn('AI category analysis failed, using basic analysis:', error);
            return this.getBasicCategoryAnalysis(article, category);
        }
    }

    /**
     * Filter articles by text query
     * @param {Array} articles - Articles to filter
     * @param {string} query - Search query
     * @returns {Array} Filtered articles
     */
    filterByQuery(articles, query) {
        const queryLower = query.toLowerCase();
        const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 2);
        
        return articles.filter(article => {
            const searchText = `${article.title || ''} ${article.description || ''}`.toLowerCase();
            
            // Check if all query terms are present
            return queryTerms.every(term => searchText.includes(term));
        });
    }

    /**
     * Filter articles by UPSC categories
     * @param {Array} articles - Articles to filter
     * @param {Array} categories - Categories to include
     * @returns {Array} Filtered articles
     */
    filterByCategories(articles, categories) {
        return articles.filter(article => {
            const articleCategory = article.category || this.categorizeArticle(article);
            return categories.includes(articleCategory);
        });
    }

    /**
     * Filter articles by UPSC subjects
     * @param {Array} articles - Articles to filter
     * @param {Array} subjects - Subjects to include
     * @returns {Array} Filtered articles
     */
    filterBySubjects(articles, subjects) {
        return articles.filter(article => {
            if (!article.upscRelevance?.subjects) {
                return false;
            }
            
            return subjects.some(subject => 
                article.upscRelevance.subjects.includes(subject)
            );
        });
    }

    /**
     * Filter articles by date range
     * @param {Array} articles - Articles to filter
     * @param {Object} dateRange - Date range with from and to dates
     * @returns {Array} Filtered articles
     */
    filterByDateRange(articles, dateRange) {
        const { from, to } = dateRange;
        
        return articles.filter(article => {
            if (!article.publishedAt) return false;
            
            const articleDate = new Date(article.publishedAt);
            
            if (from && articleDate < from) return false;
            if (to && articleDate > to) return false;
            
            return true;
        });
    }

    /**
     * Sort articles by specified criteria
     * @param {Array} articles - Articles to sort
     * @param {string} sortBy - Sort criteria
     * @returns {Array} Sorted articles
     */
    sortArticles(articles, sortBy) {
        switch (sortBy) {
            case 'relevance':
                return articles.sort((a, b) => {
                    const scoreA = (a.upscRelevance?.score || 0) * (a.credibilityScore || 5);
                    const scoreB = (b.upscRelevance?.score || 0) * (b.credibilityScore || 5);
                    return scoreB - scoreA;
                });
                
            case 'date':
                return articles.sort((a, b) => 
                    new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
                );
                
            case 'credibility':
                return articles.sort((a, b) => 
                    (b.credibilityScore || 0) - (a.credibilityScore || 0)
                );
                
            default:
                return articles;
        }
    }

    /**
     * Remove duplicate articles based on title similarity
     * @param {Array} articles - Articles to deduplicate
     * @returns {Array} Deduplicated articles
     */
    removeDuplicateArticles(articles) {
        const seen = new Set();
        const unique = [];
        
        for (const article of articles) {
            // Create a normalized title for comparison
            const normalizedTitle = (article.title || '')
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (!seen.has(normalizedTitle) && normalizedTitle.length > 10) {
                seen.add(normalizedTitle);
                unique.push(article);
            }
        }
        
        return unique;
    }

    /**
     * Build category analysis prompt
     * @param {Object} article - Article to analyze
     * @param {string} category - UPSC category
     * @returns {string} Analysis prompt
     */
    buildCategoryAnalysisPrompt(article, category) {
        const categoryKeywords = this.upscCategories[category] || [];
        
        let prompt = `Analyze how this news article relates to the UPSC ${category} subject. `;
        prompt += `Focus on specific topics, concepts, and exam relevance within this subject area.\n\n`;
        
        prompt += `Article Title: ${article.title}\n`;
        if (article.description) {
            prompt += `Description: ${article.description}\n`;
        }
        
        prompt += `\nPlease provide analysis in this format:
RELEVANCE: [How relevant is this to UPSC ${category} - High/Medium/Low]
SPECIFIC TOPICS: [Specific ${category} topics this covers]
KEY CONCEPTS: [Important concepts for exam preparation]
EXAM UTILITY: [How this can be used in prelims/mains/interview]
CONNECTIONS: [How this connects to other ${category} topics]`;
        
        return prompt;
    }

    /**
     * Parse category analysis response
     * @param {string} response - AI response
     * @param {string} category - Category being analyzed
     * @returns {Object} Parsed analysis
     */
    parseCategoryAnalysis(response, category) {
        const analysis = {
            category: category,
            relevance: 'medium',
            specificTopics: [],
            keyConcepts: [],
            examUtility: '',
            connections: [],
            generatedAt: new Date().toISOString()
        };
        
        try {
            const lines = response.split('\n').map(line => line.trim()).filter(line => line);
            
            for (const line of lines) {
                if (line.startsWith('RELEVANCE:')) {
                    const relevance = line.replace('RELEVANCE:', '').trim().toLowerCase();
                    if (['high', 'medium', 'low'].includes(relevance)) {
                        analysis.relevance = relevance;
                    }
                } else if (line.startsWith('SPECIFIC TOPICS:')) {
                    const topicsText = line.replace('SPECIFIC TOPICS:', '').trim();
                    analysis.specificTopics = topicsText.split(',').map(t => t.trim()).filter(t => t);
                } else if (line.startsWith('KEY CONCEPTS:')) {
                    const conceptsText = line.replace('KEY CONCEPTS:', '').trim();
                    analysis.keyConcepts = conceptsText.split(',').map(c => c.trim()).filter(c => c);
                } else if (line.startsWith('EXAM UTILITY:')) {
                    analysis.examUtility = line.replace('EXAM UTILITY:', '').trim();
                } else if (line.startsWith('CONNECTIONS:')) {
                    const connectionsText = line.replace('CONNECTIONS:', '').trim();
                    analysis.connections = connectionsText.split(',').map(c => c.trim()).filter(c => c);
                }
            }
            
        } catch (error) {
            console.warn('Error parsing category analysis:', error);
        }
        
        return analysis;
    }

    /**
     * Get basic category analysis without AI
     * @param {Object} article - Article to analyze
     * @param {string} category - UPSC category
     * @returns {Object} Basic analysis
     */
    getBasicCategoryAnalysis(article, category) {
        const categoryKeywords = this.upscCategories[category] || [];
        const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
        
        const matchedKeywords = categoryKeywords.filter(keyword => 
            text.includes(keyword.toLowerCase())
        );
        
        const relevanceScore = matchedKeywords.length;
        
        return {
            category: category,
            relevance: relevanceScore >= 3 ? 'high' : relevanceScore >= 1 ? 'medium' : 'low',
            specificTopics: matchedKeywords,
            keyConcepts: matchedKeywords,
            examUtility: 'General awareness and current affairs preparation',
            connections: [],
            generatedAt: new Date().toISOString(),
            aiGenerated: false
        };
    }

    /**
     * Calculate trend direction for a topic
     * @param {string} topic - Topic to analyze
     * @param {Array} articles - All articles
     * @param {number} timeframe - Timeframe in days
     * @returns {string} Trend direction (up, down, stable)
     */
    calculateTrendDirection(topic, articles, timeframe) {
        const midpoint = Date.now() - (timeframe * 24 * 60 * 60 * 1000) / 2;
        
        const recentCount = articles.filter(article => 
            new Date(article.publishedAt) > midpoint &&
            article.upscRelevance?.topics?.includes(topic)
        ).length;
        
        const olderCount = articles.filter(article => 
            new Date(article.publishedAt) <= midpoint &&
            article.upscRelevance?.topics?.includes(topic)
        ).length;
        
        if (recentCount > olderCount * 1.2) return 'up';
        if (recentCount < olderCount * 0.8) return 'down';
        return 'stable';
    }

    /**
     * Get category for a topic
     * @param {string} topic - Topic to categorize
     * @returns {string} UPSC category
     */
    getTopicCategory(topic) {
        const topicLower = topic.toLowerCase();
        
        for (const [category, keywords] of Object.entries(this.upscCategories)) {
            if (keywords.some(keyword => topicLower.includes(keyword.toLowerCase()))) {
                return category;
            }
        }
        
        return 'general';
    }

    /**
     * Calculate topic relevance from related articles
     * @param {Array} articles - Articles related to topic
     * @returns {number} Average relevance score
     */
    calculateTopicRelevance(articles) {
        if (articles.length === 0) return 0;
        
        const totalScore = articles.reduce((sum, article) => 
            sum + (article.upscRelevance?.score || 0), 0
        );
        
        return totalScore / articles.length;
    }

    /**
     * Get keywords associated with a topic from articles
     * @param {Array} articles - Articles to analyze
     * @returns {Array} Associated keywords
     */
    getTopicKeywords(articles) {
        const keywordFrequency = new Map();
        
        for (const article of articles) {
            if (article.keywords) {
                for (const keyword of article.keywords) {
                    const count = keywordFrequency.get(keyword) || 0;
                    keywordFrequency.set(keyword, count + 1);
                }
            }
        }
        
        // Return top keywords
        return Array.from(keywordFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);
    }

    /**
     * Get available UPSC categories
     * @returns {Array} Available categories with metadata
     */
    getAvailableCategories() {
        return Object.keys(this.upscCategories).map(category => ({
            id: category,
            name: category.charAt(0).toUpperCase() + category.slice(1),
            keywords: this.upscCategories[category],
            description: this.getCategoryDescription(category)
        }));
    }

    /**
     * Get description for UPSC category
     * @param {string} category - Category name
     * @returns {string} Category description
     */
    getCategoryDescription(category) {
        const descriptions = {
            'polity': 'Indian Constitution, Government, Governance, and Political System',
            'economics': 'Economic Development, Budget, Finance, and Economic Policies',
            'geography': 'Physical and Human Geography, Climate, and Natural Resources',
            'history': 'Indian History, Culture, Heritage, and Art',
            'science': 'Science and Technology, Research, and Innovation',
            'environment': 'Environmental Issues, Conservation, and Climate Change',
            'international': 'International Relations, Foreign Policy, and Global Affairs'
        };
        
        return descriptions[category] || 'General current affairs and news';
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopAutoUpdates();
        this.clearCache();
        this.aiService = null;
        this.isInitialized = false;
        console.log('News Integration Service destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsIntegrationService;
}