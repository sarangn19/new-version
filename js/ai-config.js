/**
 * AI Configuration
 * Central configuration for AI services including API keys and settings
 */
const AI_CONFIG = {
    // Gemini API Configuration
    gemini: {
        apiKey: 'AIzaSyA4BG79A4QsdyA20NFVF9YVVvgt4wTJh8A',
        model: 'gemini-2.5-flash-preview-05-20',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000,
        rateLimiting: {
            requestsPerMinute: 60,
            requestsPerHour: 1000
        }
    },
    
    // AI Service Manager Configuration
    serviceManager: {
        maxContextWindow: 10,
        defaultMode: 'general',
        autoSaveResponses: true,
        cacheEnabled: true,
        backgroundProcessingEnabled: true
    },
    
    // Cache Configuration
    cache: {
        maxSize: 1000,
        ttl: 3600000, // 1 hour
        categories: {
            common_queries: { ttl: 7200000, maxSize: 200 },
            mcq_explanations: { ttl: 86400000, maxSize: 300 },
            essay_feedback: { ttl: 3600000, maxSize: 100 },
            news_summaries: { ttl: 1800000, maxSize: 150 }
        }
    },
    
    // Background Processing Configuration
    backgroundProcessor: {
        maxConcurrentTasks: 3,
        taskTimeout: 60000,
        retryAttempts: 2
    }
};

// Initialize AI services when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AI Service Manager
    if (typeof AIServiceManager !== 'undefined') {
        window.aiServiceManager = new AIServiceManager(AI_CONFIG.gemini.apiKey, {
            apiClient: AI_CONFIG.gemini,
            ...AI_CONFIG.serviceManager,
            cache: AI_CONFIG.cache,
            backgroundProcessor: AI_CONFIG.backgroundProcessor
        });
        
        console.log('AI Service Manager initialized with Gemini API');
    }
    
    // Initialize other AI components if they exist
    if (typeof AssistantModeManager !== 'undefined') {
        window.assistantModeManager = new AssistantModeManager(window.aiServiceManager);
    }
    
    if (typeof ChatInterface !== 'undefined') {
        window.chatInterface = new ChatInterface(window.aiServiceManager);
    }
});

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AI_CONFIG;
}