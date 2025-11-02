/**
 * AI Service Manager
 * Central orchestrator for all AI-related operations including conversation management,
 * mode switching, and integration with existing platform components
 */
class AIServiceManager {
    constructor(apiKey, config = {}) {
        this.apiClient = new GeminiAPIClient(apiKey, config.apiClient);
        this.conversationStorage = null; // Will be set when ConversationStorage is created
        this.validationSystem = window.ValidationSystem || null;
        this.responseCache = new AIResponseCache(config.cache);
        this.backgroundProcessor = new BackgroundProcessor(config.backgroundProcessor);
        
        // Configuration
        this.config = {
            maxContextWindow: config.maxContextWindow || 10,
            defaultMode: config.defaultMode || 'general',
            autoSaveResponses: config.autoSaveResponses !== false,
            cacheEnabled: config.cacheEnabled !== false,
            backgroundProcessingEnabled: config.backgroundProcessingEnabled !== false,
            ...config
        };
        
        // Current state
        this.currentMode = this.config.defaultMode;
        this.activeConversationId = null;
        this.conversationContext = new Map();
        
        // Mode configurations
        this.modeConfigs = {
            general: {
                systemPrompt: "You are a helpful UPSC preparation assistant. Provide clear, accurate, and exam-focused responses to help students prepare for the UPSC Civil Services Examination.",
                temperature: 0.7,
                maxOutputTokens: 4096
            },
            mcq: {
                systemPrompt: "You are an expert at explaining MCQ solutions for UPSC preparation. Provide detailed explanations for both correct and incorrect answers, focusing on concepts and reasoning.",
                temperature: 0.3,
                maxOutputTokens: 1024,
                responseFormat: "structured"
            },
            mcq_generator: {
                systemPrompt: "You are an expert MCQ generator for UPSC preparation. Create high-quality multiple choice questions with detailed explanations for the given topics.",
                temperature: 0.4,
                maxOutputTokens: 1500,
                responseFormat: "mcq_format"
            },
            flashcard_generator: {
                systemPrompt: "You are an expert flashcard creator for UPSC preparation. Create effective front/back flashcards that help with memorization and understanding.",
                temperature: 0.4,
                maxOutputTokens: 1000,
                responseFormat: "flashcard_format"
            },
            answer_evaluation: {
                systemPrompt: "You are an expert answer evaluator for UPSC Mains preparation. Provide detailed evaluation with scoring, feedback, and improvement suggestions.",
                temperature: 0.3,
                maxOutputTokens: 2000,
                responseFormat: "evaluation_format"
            },
            essay: {
                systemPrompt: "You are an essay evaluation expert for UPSC Mains preparation. Provide constructive feedback on essay structure, content, arguments, and suggest improvements.",
                temperature: 0.5,
                maxOutputTokens: 2048,
                responseFormat: "detailed_feedback"
            },
            news: {
                systemPrompt: "You analyze current affairs for UPSC relevance. Focus on exam importance, subject connections, and key points that candidates should remember.",
                temperature: 0.4,
                maxOutputTokens: 4096,
                responseFormat: "summary_analysis"
            }
        };
        
        this.initialize();
    }

    /**
     * Initialize the AI Service Manager
     */
    async initialize() {
        try {
            // Initialize conversation storage when available
            if (window.ConversationStorage) {
                this.conversationStorage = new ConversationStorage();
            }
            
            console.log('AI Service Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AI Service Manager:', error);
            throw error;
        }
    }

    /**
     * Send a message and get AI response
     * @param {string} message - User message
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} AI response with metadata
     */
    async sendMessage(message, options = {}) {
        try {
            // Validate input
            const sanitizedMessage = this.validateAndSanitizeInput(message);
            
            // Store user message for conversation titles
            this.lastUserMessage = sanitizedMessage;
            
            // Get or create conversation
            let conversationId = options.conversationId || this.activeConversationId;
            if (!conversationId) {
                conversationId = this.generateConversationId();
                this.activeConversationId = conversationId;
            }
            
            // Build context and prompt
            const context = await this.buildContext(conversationId, options.context);
            const enhancedPrompt = this.buildPrompt(sanitizedMessage, context);
            
            // Get mode configuration
            const modeConfig = this.modeConfigs[this.currentMode] || this.modeConfigs.general;
            
            // Prepare API options
            const apiOptions = {
                temperature: modeConfig.temperature,
                maxOutputTokens: modeConfig.maxOutputTokens,
                ...options.apiOptions
            };
            
            // Check cache first if enabled
            let apiResponse, processingTime, fromCache = false;
            if (this.config.cacheEnabled && !options.skipCache) {
                const cachedResponse = this.responseCache.getCachedResponse(enhancedPrompt, apiOptions, this.currentMode);
                if (cachedResponse) {
                    apiResponse = cachedResponse;
                    processingTime = 0; // Cached response is instant
                    fromCache = true;
                }
            }
            
            // Make API request if not cached
            if (!fromCache) {
                const startTime = Date.now();
                apiResponse = await this.apiClient.generateContent(enhancedPrompt, apiOptions);
                processingTime = Date.now() - startTime;
                
                // Cache the response if caching is enabled
                if (this.config.cacheEnabled) {
                    const cacheCategory = this.determineCacheCategory(this.currentMode, sanitizedMessage);
                    this.responseCache.cacheResponse(enhancedPrompt, apiOptions, this.currentMode, apiResponse, cacheCategory);
                }
            }
            
            // Extract and process response
            const responseText = fromCache ? apiResponse.content : this.apiClient.extractTextContent(apiResponse);
            const usageMetadata = fromCache ? (apiResponse.usage || {}) : this.apiClient.getUsageMetadata(apiResponse);
            
            // Create response object
            const response = {
                id: this.generateResponseId(),
                conversationId: conversationId,
                content: responseText,
                mode: this.currentMode,
                timestamp: new Date().toISOString(),
                processingTime: processingTime,
                usage: usageMetadata,
                context: context,
                fromCache: fromCache
            };
            
            // Store conversation if storage is available
            if (this.conversationStorage) {
                try {
                    // Check if conversation exists, create if not
                    let conversation = await this.conversationStorage.loadConversation(conversationId);
                    if (!conversation) {
                        conversation = await this.conversationStorage.createConversation({
                            mode: this.currentMode,
                            userId: 'default',
                            title: sanitizedMessage.substring(0, 50) + '...'
                        });
                        conversationId = conversation.id;
                        this.activeConversationId = conversationId;
                        response.conversationId = conversationId;
                    }
                    
                    await this.conversationStorage.addMessage(conversationId, {
                        role: 'user',
                        content: sanitizedMessage,
                        timestamp: new Date().toISOString()
                    });
                    
                    await this.conversationStorage.addMessage(conversationId, {
                        role: 'assistant',
                        content: responseText,
                        timestamp: response.timestamp,
                        metadata: {
                            processingTime: processingTime,
                            usage: usageMetadata,
                            mode: this.currentMode
                        }
                    });
                } catch (storageError) {
                    console.warn('Conversation storage error (non-critical):', storageError.message);
                    // Continue without storage - this is not critical for functionality
                }
            }
            
            // Update active conversation
            this.activeConversationId = conversationId;
            
            // Save to recent conversations for persistence
            this.saveToRecentConversations(response);
            
            // Auto-save response if enabled
            if (this.config.autoSaveResponses && options.autoSave !== false) {
                this.autoSaveResponse(response, options.saveOptions);
            }
            
            return response;
            
        } catch (error) {
            console.error('Error in sendMessage:', error);
            
            // Fallback to mock responses if API fails
            if (window.MockAIResponses && (error.message.includes('404') || error.message.includes('Invalid API response format'))) {
                console.warn('API failed, using mock response as fallback:', error.message);
                const mockAI = new MockAIResponses();
                const mockResponse = mockAI.generateResponse(message, this.currentMode);
                
                // Add fallback indicator
                mockResponse.content = `🤖 **Demo Mode**: ${mockResponse.content}\n\n*Note: This is a demo response while we resolve API issues. Check the console for details.*`;
                mockResponse.conversationId = conversationId;
                
                return mockResponse;
            }
            
            throw this.handleServiceError(error);
        }
    }

    /**
     * Get response by ID (for retrieving cached responses)
     * @param {string} responseId - Response ID
     * @returns {Promise<Object|null>} Response object or null
     */
    async getResponse(responseId) {
        // This would typically retrieve from cache or storage
        // For now, return null as responses are handled in real-time
        return null;
    }

    /**
     * Set assistant mode
     * @param {string} mode - Mode to set ('general', 'mcq', 'essay', 'news')
     * @param {Object} options - Mode-specific options
     */
    setMode(mode, options = {}) {
        if (!this.modeConfigs[mode]) {
            throw new Error(`Invalid mode: ${mode}`);
        }
        
        const previousMode = this.currentMode;
        this.currentMode = mode;
        
        // Preserve context if requested
        if (options.preserveContext && this.activeConversationId) {
            this.addContext('mode_switch', {
                from: previousMode,
                to: mode,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`AI mode switched from ${previousMode} to ${mode}`);
    }

    /**
     * Add context to current conversation
     * @param {string} type - Context type
     * @param {Object} data - Context data
     */
    addContext(type, data) {
        if (!this.activeConversationId) {
            this.activeConversationId = this.generateConversationId();
        }
        
        if (!this.conversationContext.has(this.activeConversationId)) {
            this.conversationContext.set(this.activeConversationId, []);
        }
        
        const context = this.conversationContext.get(this.activeConversationId);
        context.push({
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        // Limit context window size
        if (context.length > this.config.maxContextWindow) {
            context.splice(0, context.length - this.config.maxContextWindow);
        }
    }

    /**
     * Clear conversation context
     * @param {string} conversationId - Optional conversation ID, clears current if not provided
     */
    clearContext(conversationId = null) {
        const targetId = conversationId || this.activeConversationId;
        if (targetId) {
            this.conversationContext.delete(targetId);
        }
        
        if (!conversationId) {
            this.activeConversationId = null;
        }
    }

    /**
     * Get conversation history
     * @param {number} limit - Maximum number of messages to retrieve
     * @param {string} conversationId - Optional conversation ID
     * @returns {Promise<Array>} Conversation history
     */
    async getConversationHistory(limit = 10, conversationId = null) {
        const targetId = conversationId || this.activeConversationId;
        
        if (!targetId || !this.conversationStorage) {
            return [];
        }
        
        try {
            return await this.conversationStorage.getConversationHistory(targetId, { limit });
        } catch (error) {
            console.error('Error retrieving conversation history:', error);
            return [];
        }
    }

    /**
     * Analyze performance data (integration point for future analytics)
     * @param {Object} userData - User performance data
     * @returns {Promise<Object>} Analysis results
     */
    async analyzePerformance(userData) {
        // Placeholder for future performance analytics integration
        console.log('Performance analysis requested:', userData);
        return {
            analysis: 'Performance analysis feature will be implemented in future tasks',
            recommendations: []
        };
    }

    /**
     * Generate study recommendations (integration point for future analytics)
     * @param {Object} analyticsData - Analytics data
     * @returns {Promise<Array>} Recommendations
     */
    async generateRecommendations(analyticsData) {
        // Placeholder for future recommendation engine
        console.log('Recommendations requested:', analyticsData);
        return [];
    }

    /**
     * Summarize news articles (integration point for future news module)
     * @param {Array} articles - News articles to summarize
     * @returns {Promise<Array>} Summarized articles
     */
    async summarizeNews(articles) {
        // Placeholder for future news integration
        console.log('News summarization requested:', articles);
        return [];
    }

    /**
     * Validate and sanitize user input
     * @param {string} input - User input
     * @returns {string} Sanitized input
     */
    validateAndSanitizeInput(input) {
        if (!input || typeof input !== 'string') {
            throw new Error('Invalid input: message must be a non-empty string');
        }
        
        // Use existing ValidationSystem if available
        if (this.validationSystem && this.validationSystem.sanitizeInput) {
            return this.validationSystem.sanitizeInput(input);
        }
        
        // Basic sanitization
        return input.trim().substring(0, 4000); // Limit length
    }

    /**
     * Build context for AI prompt
     * @param {string} conversationId - Conversation ID
     * @param {Object} additionalContext - Additional context
     * @returns {Promise<Object>} Built context
     */
    async buildContext(conversationId, additionalContext = {}) {
        // Try to get cached context first
        let cachedContext = null;
        if (this.config.cacheEnabled) {
            cachedContext = this.responseCache.getCachedContext(conversationId);
        }
        
        const context = {
            mode: this.currentMode,
            timestamp: new Date().toISOString(),
            ...additionalContext
        };
        
        // Add conversation context if available
        if (this.conversationContext.has(conversationId)) {
            context.conversationContext = this.conversationContext.get(conversationId);
        }
        
        // Add recent conversation history (use cached if available and recent)
        if (cachedContext && cachedContext.recentHistory) {
            context.recentHistory = cachedContext.recentHistory;
        } else {
            const history = await this.getConversationHistory(5, conversationId);
            if (history.length > 0) {
                context.recentHistory = history;
                
                // Cache the context for future use
                if (this.config.cacheEnabled) {
                    this.responseCache.cacheConversationContext(conversationId, { recentHistory: history });
                }
            }
        }
        
        return context;
    }

    /**
     * Build enhanced prompt with system prompt and context
     * @param {string} userMessage - User message
     * @param {Object} context - Context object
     * @returns {string} Enhanced prompt
     */
    buildPrompt(userMessage, context) {
        const modeConfig = this.modeConfigs[this.currentMode];
        let prompt = modeConfig.systemPrompt + '\n\n';
        
        // Add context if available
        if (context.recentHistory && context.recentHistory.length > 0) {
            prompt += 'Recent conversation:\n';
            context.recentHistory.forEach(msg => {
                prompt += `${msg.role}: ${msg.content}\n`;
            });
            prompt += '\n';
        }
        
        // Add current user message
        prompt += `User: ${userMessage}\n\nAssistant:`;
        
        return prompt;
    }

    /**
     * Auto-save response to appropriate section
     * @param {Object} response - Response object
     * @param {Object} saveOptions - Save options
     */
    autoSaveResponse(response, saveOptions = {}) {
        // This will be implemented when ResponseManager is available
        console.log('Auto-save response:', response.id, saveOptions);
    }

    /**
     * Handle service-level errors
     * @param {Error} error - Original error
     * @returns {Error} Processed error
     */
    handleServiceError(error) {
        if (error.message.includes('Invalid API key')) {
            return new Error('AI service authentication failed. Please check your API configuration.');
        }
        
        if (error.message.includes('Rate limit exceeded')) {
            return new Error('AI service is temporarily busy. Please try again in a moment.');
        }
        
        if (error.message.includes('Network error')) {
            return new Error('Unable to connect to AI service. Please check your internet connection.');
        }
        
        return new Error(`AI service error: ${error.message}`);
    }

    /**
     * Generate unique conversation ID
     * @returns {string} Conversation ID
     */
    generateConversationId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate unique response ID
     * @returns {string} Response ID
     */
    generateResponseId() {
        return 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Save conversation to recent chats
     * @param {Object} response - AI response object
     */
    saveToRecentConversations(response) {
        try {
            let recentChats = JSON.parse(localStorage.getItem('recentChats') || '[]');
            
            // Get the original user message from context
            const userMessage = this.lastUserMessage || 'New Conversation';
            
            const chatEntry = {
                id: response.conversationId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage,
                preview: response.content.substring(0, 100) + '...',
                mode: response.mode,
                timestamp: response.timestamp,
                lastMessage: response.content
            };
            
            // Remove existing entry if present (to update it with latest message)
            recentChats = recentChats.filter(chat => chat.id !== chatEntry.id);
            
            // Add to beginning
            recentChats.unshift(chatEntry);
            
            // Keep only last 20 conversations
            if (recentChats.length > 20) {
                recentChats = recentChats.slice(0, 20);
            }
            
            localStorage.setItem('recentChats', JSON.stringify(recentChats));
        } catch (error) {
            console.error('Error saving to recent conversations:', error);
        }
    }

    /**
     * Get recent conversations
     * @param {number} limit - Number of conversations to retrieve
     * @returns {Array} Recent conversations
     */
    getRecentConversations(limit = 10) {
        try {
            const recentChats = JSON.parse(localStorage.getItem('recentChats') || '[]');
            return recentChats.slice(0, limit);
        } catch (error) {
            console.error('Error getting recent conversations:', error);
            return [];
        }
    }

    /**
     * Get current mode configuration
     * @returns {Object} Current mode configuration
     */
    getCurrentModeConfig() {
        return { ...this.modeConfigs[this.currentMode] };
    }

    /**
     * Get available modes
     * @returns {Array} Available mode names
     */
    getAvailableModes() {
        return Object.keys(this.modeConfigs);
    }

    /**
     * Check if service is ready
     * @returns {boolean} Whether service is ready
     */
    isReady() {
        return this.apiClient && this.apiClient.apiKey;
    }

    /**
     * Determine cache category based on mode and message content
     * @param {string} mode - AI assistant mode
     * @param {string} message - User message
     * @returns {string} Cache category
     */
    determineCacheCategory(mode, message) {
        const lowerMessage = message.toLowerCase();
        
        switch (mode) {
            case 'mcq':
                return 'mcq_explanations';
            case 'essay':
                return 'essay_feedback';
            case 'news':
                return 'news_summaries';
            default:
                // Determine based on content patterns
                if (lowerMessage.includes('news') || lowerMessage.includes('current affairs')) {
                    return 'news_summaries';
                } else if (lowerMessage.includes('mcq') || lowerMessage.includes('multiple choice')) {
                    return 'mcq_explanations';
                } else if (lowerMessage.includes('essay') || lowerMessage.includes('write about')) {
                    return 'essay_feedback';
                } else {
                    return 'common_queries';
                }
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        if (!this.responseCache) {
            return { error: 'Cache not initialized' };
        }
        return this.responseCache.getCacheStats();
    }

    /**
     * Clear response cache
     */
    clearCache() {
        if (this.responseCache) {
            this.responseCache.clearCache();
        }
    }

    /**
     * Invalidate cache entries by criteria
     * @param {Object} criteria - Invalidation criteria
     * @returns {number} Number of invalidated entries
     */
    invalidateCache(criteria) {
        if (!this.responseCache) {
            return 0;
        }
        return this.responseCache.invalidateCache(criteria);
    }

    /**
     * Enable or disable caching
     * @param {boolean} enabled - Whether to enable caching
     */
    setCacheEnabled(enabled) {
        this.config.cacheEnabled = enabled;
    }

    /**
     * Queue background task for processing
     * @param {Object} task - Task configuration
     * @param {string} priority - Task priority
     * @returns {string} Task ID
     */
    queueBackgroundTask(task, priority = 'medium') {
        if (!this.config.backgroundProcessingEnabled || !this.backgroundProcessor) {
            console.warn('Background processing is disabled');
            return null;
        }
        
        return this.backgroundProcessor.addTask(task, priority);
    }

    /**
     * Schedule recurring background task
     * @param {Object} task - Task configuration
     * @param {number} interval - Interval in milliseconds
     * @param {string} priority - Task priority
     * @returns {string} Scheduled task ID
     */
    scheduleBackgroundTask(task, interval, priority = 'medium') {
        if (!this.config.backgroundProcessingEnabled || !this.backgroundProcessor) {
            console.warn('Background processing is disabled');
            return null;
        }
        
        return this.backgroundProcessor.scheduleTask(task, interval, priority);
    }

    /**
     * Get background processor statistics
     * @returns {Object} Processor statistics
     */
    getBackgroundProcessorStats() {
        if (!this.backgroundProcessor) {
            return { error: 'Background processor not available' };
        }
        
        return this.backgroundProcessor.getProcessorStats();
    }

    /**
     * Process large AI request in background
     * @param {string} message - User message
     * @param {Object} options - Processing options
     * @returns {Promise<string>} Task ID
     */
    async processLargeRequestInBackground(message, options = {}) {
        if (!this.config.backgroundProcessingEnabled) {
            // Process normally if background processing is disabled
            return await this.sendMessage(message, options);
        }
        
        const task = {
            type: 'ai_processing',
            handler: async (data) => {
                return await this.sendMessage(data.message, data.options);
            },
            data: { message, options },
            onSuccess: options.onSuccess,
            onError: options.onError,
            onProgress: options.onProgress
        };
        
        return this.queueBackgroundTask(task, 'high');
    }

    /**
     * Trigger analytics update in background
     */
    triggerAnalyticsUpdate() {
        if (this.config.backgroundProcessingEnabled) {
            this.queueBackgroundTask({
                type: 'analytics_update',
                data: {}
            }, 'medium');
        }
    }

    /**
     * Trigger news fetch in background
     * @param {Array} categories - News categories to fetch
     * @param {number} limit - Number of articles to fetch
     */
    triggerNewsFetch(categories = ['all'], limit = 20) {
        if (this.config.backgroundProcessingEnabled) {
            this.queueBackgroundTask({
                type: 'news_fetch',
                data: { categories, limit }
            }, 'medium');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIServiceManager;
}