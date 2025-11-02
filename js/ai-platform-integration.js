/**
 * AI Platform Integration Manager
 * Connects all AI components with existing platform architecture
 */
class AIPlatformIntegration {
    constructor() {
        this.profileManager = null;
        this.aiServiceManager = null;
        this.chatInterface = null;
        this.responseManager = null;
        this.newsIntegrationService = null;
        this.performanceAnalyticsAI = null;
        this.assistantModeManager = null;
        
        // Integration state
        this.isInitialized = false;
        this.integrationStatus = {
            profileManager: false,
            aiServices: false,
            chatInterface: false,
            responseManager: false,
            newsIntegration: false,
            performanceAnalytics: false,
            assistantModes: false
        };
        
        // Event listeners for cross-component communication
        this.eventListeners = new Map();
        
        this.initialize();
    }

    /**
     * Initialize platform integration
     */
    async initialize() {
        try {
            console.log('Initializing AI Platform Integration...');
            
            // Initialize core components
            await this.initializeProfileManager();
            await this.initializeAIServices();
            await this.initializeChatInterface();
            await this.initializeResponseManager();
            await this.initializeNewsIntegration();
            await this.initializePerformanceAnalytics();
            await this.initializeAssistantModes();
            
            // Set up cross-component communication
            this.setupEventListeners();
            
            // Connect components
            this.connectComponents();
            
            // Apply user preferences
            this.applyUserPreferences();
            
            // Set up navigation integration
            this.setupNavigationIntegration();
            
            this.isInitialized = true;
            console.log('AI Platform Integration initialized successfully');
            
            // Dispatch initialization complete event
            this.dispatchEvent('ai-platform-initialized', {
                status: this.integrationStatus,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Failed to initialize AI Platform Integration:', error);
            throw error;
        }
    }

    /**
     * Initialize Profile Manager integration
     */
    async initializeProfileManager() {
        try {
            if (window.profileManager) {
                this.profileManager = window.profileManager;
                this.integrationStatus.profileManager = true;
                console.log('Profile Manager integration: Connected');
            } else {
                console.warn('Profile Manager not available');
            }
        } catch (error) {
            console.error('Failed to initialize Profile Manager integration:', error);
        }
    }

    /**
     * Initialize AI Services integration
     */
    async initializeAIServices() {
        try {
            // Initialize AI Service Manager if available
            if (window.AIServiceManager) {
                // Get API key from user preferences or environment
                const apiKey = this.getAPIKey();
                
                this.aiServiceManager = new AIServiceManager(apiKey, {
                    maxContextWindow: 10,
                    defaultMode: 'general',
                    autoSaveResponses: true,
                    cacheEnabled: true,
                    backgroundProcessingEnabled: true
                });
                
                this.integrationStatus.aiServices = true;
                console.log('AI Services integration: Connected');
            } else {
                console.warn('AI Service Manager not available');
            }
        } catch (error) {
            console.error('Failed to initialize AI Services integration:', error);
        }
    }

    /**
     * Initialize Chat Interface integration
     */
    async initializeChatInterface() {
        try {
            if (window.chatInterface) {
                this.chatInterface = window.chatInterface;
                
                // Connect AI Service Manager to Chat Interface
                if (this.aiServiceManager) {
                    this.chatInterface.aiServiceManager = this.aiServiceManager;
                }
                
                this.integrationStatus.chatInterface = true;
                console.log('Chat Interface integration: Connected');
            } else {
                console.warn('Chat Interface not available');
            }
        } catch (error) {
            console.error('Failed to initialize Chat Interface integration:', error);
        }
    }

    /**
     * Initialize Response Manager integration
     */
    async initializeResponseManager() {
        try {
            if (window.ResponseManager) {
                this.responseManager = new ResponseManager();
                
                // Connect to existing learn page components
                this.connectResponseManagerToLearnPages();
                
                this.integrationStatus.responseManager = true;
                console.log('Response Manager integration: Connected');
            } else {
                console.warn('Response Manager not available');
            }
        } catch (error) {
            console.error('Failed to initialize Response Manager integration:', error);
        }
    }

    /**
     * Initialize News Integration
     */
    async initializeNewsIntegration() {
        try {
            if (window.NewsIntegrationService) {
                this.newsIntegrationService = new NewsIntegrationService();
                
                // Connect to existing news page
                this.connectNewsIntegrationToNewsPage();
                
                this.integrationStatus.newsIntegration = true;
                console.log('News Integration: Connected');
            } else {
                console.warn('News Integration Service not available');
            }
        } catch (error) {
            console.error('Failed to initialize News Integration:', error);
        }
    }

    /**
     * Initialize Performance Analytics integration
     */
    async initializePerformanceAnalytics() {
        try {
            if (window.PerformanceAnalyticsAI && window.performanceOptimizer) {
                this.performanceAnalyticsAI = new PerformanceAnalyticsAI(
                    this.aiServiceManager,
                    window.performanceOptimizer
                );
                
                // Connect to existing statistics page
                this.connectPerformanceAnalyticsToStatistics();
                
                this.integrationStatus.performanceAnalytics = true;
                console.log('Performance Analytics integration: Connected');
            } else {
                console.warn('Performance Analytics components not available');
            }
        } catch (error) {
            console.error('Failed to initialize Performance Analytics integration:', error);
        }
    }

    /**
     * Initialize Assistant Modes integration
     */
    async initializeAssistantModes() {
        try {
            if (window.AssistantModeManager) {
                this.assistantModeManager = new AssistantModeManager();
                
                // Connect to AI Service Manager
                if (this.aiServiceManager) {
                    this.aiServiceManager.assistantModeManager = this.assistantModeManager;
                }
                
                this.integrationStatus.assistantModes = true;
                console.log('Assistant Modes integration: Connected');
            } else {
                console.warn('Assistant Mode Manager not available');
            }
        } catch (error) {
            console.error('Failed to initialize Assistant Modes integration:', error);
        }
    }

    /**
     * Set up event listeners for cross-component communication
     */
    setupEventListeners() {
        // Profile preferences changes
        if (this.profileManager) {
            window.addEventListener('preferencesUpdated', (event) => {
                this.handlePreferencesUpdate(event.detail.preferences);
            });
        }

        // AI response events
        this.addEventListener('ai-response-received', (event) => {
            this.handleAIResponse(event.detail);
        });

        // Response save events
        this.addEventListener('response-saved', (event) => {
            this.handleResponseSaved(event.detail);
        });

        // News update events
        this.addEventListener('news-updated', (event) => {
            this.handleNewsUpdate(event.detail);
        });

        // Performance analytics events
        this.addEventListener('analytics-updated', (event) => {
            this.handleAnalyticsUpdate(event.detail);
        });

        // Mode change events
        this.addEventListener('mode-changed', (event) => {
            this.handleModeChange(event.detail);
        });
    }

    /**
     * Connect components for seamless integration
     */
    connectComponents() {
        // Connect Chat Interface to Response Manager
        if (this.chatInterface && this.responseManager) {
            this.chatInterface.responseManager = this.responseManager;
        }

        // Connect AI Service Manager to Performance Analytics
        if (this.aiServiceManager && this.performanceAnalyticsAI) {
            this.aiServiceManager.performanceAnalytics = this.performanceAnalyticsAI;
        }

        // Connect News Integration to AI Service Manager
        if (this.newsIntegrationService && this.aiServiceManager) {
            this.newsIntegrationService.aiServiceManager = this.aiServiceManager;
        }

        // Set up cross-component data sharing
        this.setupDataSharing();
    }

    /**
     * Apply user preferences across all AI components
     */
    applyUserPreferences() {
        if (!this.profileManager) return;

        const preferences = this.profileManager.getPreferences();
        
        // Apply theme preferences to AI components
        if (preferences.theme) {
            this.applyThemeToAIComponents(preferences.theme);
        }

        // Apply accessibility preferences
        if (preferences.accessibility) {
            this.applyAccessibilityToAIComponents(preferences.accessibility);
        }

        // Apply study preferences to AI behavior
        if (preferences.study) {
            this.applyStudyPreferencesToAI(preferences.study);
        }
    }

    /**
     * Set up navigation integration
     */
    setupNavigationIntegration() {
        // Add AI assistant to navigation if not already present
        this.ensureAINavigationItem();
        
        // Set up page-specific AI features
        this.setupPageSpecificFeatures();
        
        // Add AI quick access buttons to learn pages
        this.addAIQuickAccessButtons();
    }

    /**
     * Connect Response Manager to learn pages
     */
    connectResponseManagerToLearnPages() {
        // Connect to notes page
        if (window.enhancedNoteManager) {
            this.responseManager.noteManager = window.enhancedNoteManager;
        }

        // Connect to flashcards
        if (window.studyTools) {
            this.responseManager.studyTools = window.studyTools;
        }

        // Connect to MCQ system
        // This would connect to the MCQ management system when available
    }

    /**
     * Connect News Integration to news page
     */
    connectNewsIntegrationToNewsPage() {
        // This would integrate with the existing news page
        // Adding AI-powered summarization and analysis features
    }

    /**
     * Connect Performance Analytics to statistics page
     */
    connectPerformanceAnalyticsToStatistics() {
        // This would integrate with the existing statistics page
        // Adding AI-powered insights and recommendations
    }

    /**
     * Handle preferences update
     */
    handlePreferencesUpdate(preferences) {
        this.applyUserPreferences();
        
        // Notify all AI components of preference changes
        this.dispatchEvent('preferences-changed', { preferences });
    }

    /**
     * Handle AI response
     */
    handleAIResponse(responseData) {
        // Update performance analytics
        if (this.performanceAnalyticsAI) {
            this.performanceAnalyticsAI.recordAIInteraction(responseData);
        }

        // Auto-save if enabled
        if (this.responseManager && responseData.autoSave) {
            this.responseManager.saveResponse(responseData.response, responseData.saveOptions);
        }
    }

    /**
     * Handle response saved
     */
    handleResponseSaved(saveData) {
        // Update user statistics
        if (this.performanceAnalyticsAI) {
            this.performanceAnalyticsAI.recordContentSaved(saveData);
        }

        // Show success notification
        this.showNotification('Response saved successfully!', 'success');
    }

    /**
     * Handle news update
     */
    handleNewsUpdate(newsData) {
        // Trigger background analysis if enabled
        if (this.aiServiceManager) {
            this.aiServiceManager.triggerNewsAnalysis(newsData);
        }
    }

    /**
     * Handle analytics update
     */
    handleAnalyticsUpdate(analyticsData) {
        // Update dashboard if visible
        this.updateDashboardInsights(analyticsData);
    }

    /**
     * Handle mode change
     */
    handleModeChange(modeData) {
        // Update UI to reflect mode change
        this.updateModeUI(modeData.mode);
        
        // Notify other components
        this.dispatchEvent('ai-mode-changed', modeData);
    }

    /**
     * Apply theme to AI components
     */
    applyThemeToAIComponents(themePrefs) {
        // Apply theme to chat interface
        if (this.chatInterface) {
            // Theme application logic for chat interface
        }

        // Apply theme to other AI components
        // This would be implemented based on specific component needs
    }

    /**
     * Apply accessibility to AI components
     */
    applyAccessibilityToAIComponents(accessibilityPrefs) {
        // Apply accessibility settings to AI components
        if (accessibilityPrefs.screenReaderOptimized) {
            this.enableScreenReaderOptimizations();
        }

        if (accessibilityPrefs.keyboardNavigation) {
            this.enableKeyboardNavigationForAI();
        }
    }

    /**
     * Apply study preferences to AI behavior
     */
    applyStudyPreferencesToAI(studyPrefs) {
        if (this.aiServiceManager) {
            // Adjust AI behavior based on study preferences
            const aiConfig = {
                pomodoroIntegration: studyPrefs.pomodoroWorkTime,
                spacedRepetition: studyPrefs.spacedRepetition,
                dailyGoal: studyPrefs.dailyGoal
            };
            
            this.aiServiceManager.updateConfig(aiConfig);
        }
    }

    /**
     * Ensure AI navigation item exists
     */
    ensureAINavigationItem() {
        const sidebar = document.querySelector('nav');
        if (!sidebar) return;

        const aiNavItem = sidebar.querySelector('a[href="chatbot.html"]');
        if (aiNavItem) {
            // Update existing item to show it's active/integrated
            aiNavItem.classList.add('ai-integrated');
        }
    }

    /**
     * Set up page-specific AI features
     */
    setupPageSpecificFeatures() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'notes':
                this.setupNotesPageAI();
                break;
            case 'flashcards':
                this.setupFlashcardsPageAI();
                break;
            case 'mcq':
                this.setupMCQPageAI();
                break;
            case 'news':
                this.setupNewsPageAI();
                break;
            case 'statistics':
                this.setupStatisticsPageAI();
                break;
        }
    }

    /**
     * Add AI quick access buttons to learn pages
     */
    addAIQuickAccessButtons() {
        const learnPages = ['notes.html', 'flashcards.html', 'mcq.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (learnPages.includes(currentPage)) {
            this.addAIFloatingButton();
        }
    }

    /**
     * Add floating AI assistant button
     */
    addAIFloatingButton() {
        const existingButton = document.getElementById('ai-floating-button');
        if (existingButton) return;

        const floatingButton = document.createElement('button');
        floatingButton.id = 'ai-floating-button';
        floatingButton.className = 'fixed bottom-6 right-6 w-14 h-14 bg-[#84D0F7] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 z-50';
        floatingButton.innerHTML = `
            <div class="w-6 h-6 bg-black rounded-full flex items-center justify-center text-xs font-medium text-white">AI</div>
        `;
        floatingButton.title = 'Open AI Assistant';
        
        floatingButton.addEventListener('click', () => {
            this.openAIAssistant();
        });
        
        document.body.appendChild(floatingButton);
    }

    /**
     * Open AI assistant
     */
    openAIAssistant() {
        // Open AI assistant in a modal or navigate to chatbot page
        window.location.href = 'chatbot.html';
    }

    /**
     * Set up notes page AI features
     */
    setupNotesPageAI() {
        // Add AI-powered note enhancement features
        this.addAINoteEnhancement();
    }

    /**
     * Set up flashcards page AI features
     */
    setupFlashcardsPageAI() {
        // Add AI-powered flashcard generation
        this.addAIFlashcardGeneration();
    }

    /**
     * Set up MCQ page AI features
     */
    setupMCQPageAI() {
        // Add AI-powered MCQ analysis
        this.addAIMCQAnalysis();
    }

    /**
     * Set up news page AI features
     */
    setupNewsPageAI() {
        // Add AI-powered news analysis
        this.addAINewsAnalysis();
    }

    /**
     * Set up statistics page AI features
     */
    setupStatisticsPageAI() {
        // Add AI-powered insights
        this.addAIInsights();
    }

    /**
     * Get current page
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        return page;
    }

    /**
     * Set up data sharing between components
     */
    setupDataSharing() {
        // Create shared data store for cross-component communication
        window.aiPlatformData = {
            userPreferences: this.profileManager?.getPreferences() || {},
            currentMode: 'general',
            activeConversation: null,
            recentResponses: [],
            performanceMetrics: {}
        };
    }

    /**
     * Get API key from user preferences or environment
     */
    getAPIKey() {
        // In a real implementation, this would get the API key from secure storage
        // For now, return empty string (will use simulated responses)
        return '';
    }

    /**
     * Add event listener
     */
    addEventListener(eventType, handler) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(handler);
        
        // Also add to window for global event handling
        window.addEventListener(eventType, handler);
    }

    /**
     * Dispatch event
     */
    dispatchEvent(eventType, data) {
        const event = new CustomEvent(eventType, { detail: data });
        window.dispatchEvent(event);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Use existing error handler or create simple notification
        if (window.errorHandler) {
            window.errorHandler.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Update dashboard insights
     */
    updateDashboardInsights(analyticsData) {
        // Update dashboard with AI insights
        // This would be implemented based on dashboard structure
    }

    /**
     * Update mode UI
     */
    updateModeUI(mode) {
        // Update UI elements to reflect current AI mode
        const modeIndicators = document.querySelectorAll('.ai-mode-indicator');
        modeIndicators.forEach(indicator => {
            indicator.textContent = mode;
        });
    }

    /**
     * Enable screen reader optimizations
     */
    enableScreenReaderOptimizations() {
        // Add ARIA labels and descriptions to AI components
        const aiElements = document.querySelectorAll('[data-ai-component]');
        aiElements.forEach(element => {
            if (!element.getAttribute('aria-label')) {
                element.setAttribute('aria-label', 'AI Assistant Component');
            }
        });
    }

    /**
     * Enable keyboard navigation for AI
     */
    enableKeyboardNavigationForAI() {
        // Add keyboard shortcuts for AI features
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+A to open AI assistant
            if (event.ctrlKey && event.shiftKey && event.key === 'A') {
                event.preventDefault();
                this.openAIAssistant();
            }
        });
    }

    /**
     * Add AI note enhancement
     */
    addAINoteEnhancement() {
        // Add AI enhancement button to note creation
        const noteCreationArea = document.querySelector('#new-note-btn');
        if (noteCreationArea) {
            const enhanceButton = document.createElement('button');
            enhanceButton.className = 'ml-2 px-3 py-2 bg-[#84D0F7]/20 text-[#84D0F7] rounded-lg text-sm hover:bg-[#84D0F7]/30 transition-colors';
            enhanceButton.innerHTML = '<i data-lucide="sparkles" class="w-4 h-4 mr-1"></i>AI Enhance';
            enhanceButton.title = 'Enhance notes with AI';
            
            enhanceButton.addEventListener('click', () => {
                this.enhanceNotesWithAI();
            });
            
            noteCreationArea.parentNode.appendChild(enhanceButton);
            
            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons(enhanceButton);
            }
        }
    }

    /**
     * Add AI flashcard generation
     */
    addAIFlashcardGeneration() {
        // Add AI generation button to flashcard page
        const flashcardHeader = document.querySelector('h1');
        if (flashcardHeader && flashcardHeader.textContent.includes('Flashcards')) {
            const generateButton = document.createElement('button');
            generateButton.className = 'ml-4 px-3 py-2 bg-[#84D0F7]/20 text-[#84D0F7] rounded-lg text-sm hover:bg-[#84D0F7]/30 transition-colors';
            generateButton.innerHTML = '<i data-lucide="sparkles" class="w-4 h-4 mr-1"></i>AI Generate';
            generateButton.title = 'Generate flashcards with AI';
            
            generateButton.addEventListener('click', () => {
                this.generateFlashcardsWithAI();
            });
            
            flashcardHeader.parentNode.appendChild(generateButton);
            
            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons(generateButton);
            }
        }
    }

    /**
     * Add AI MCQ analysis
     */
    addAIMCQAnalysis() {
        // Add AI analysis features to MCQ page
        const mcqHeader = document.querySelector('h1');
        if (mcqHeader && mcqHeader.textContent.includes('MCQ')) {
            const analysisButton = document.createElement('button');
            analysisButton.className = 'ml-4 px-3 py-2 bg-[#84D0F7]/20 text-[#84D0F7] rounded-lg text-sm hover:bg-[#84D0F7]/30 transition-colors';
            analysisButton.innerHTML = '<i data-lucide="brain" class="w-4 h-4 mr-1"></i>AI Analysis';
            analysisButton.title = 'Get AI analysis of MCQs';
            
            analysisButton.addEventListener('click', () => {
                this.analyzeMCQsWithAI();
            });
            
            mcqHeader.parentNode.appendChild(analysisButton);
            
            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons(analysisButton);
            }
        }
    }

    /**
     * Add AI news analysis
     */
    addAINewsAnalysis() {
        // This would be implemented when news page integration is added
    }

    /**
     * Add AI insights
     */
    addAIInsights() {
        // This would be implemented when statistics page integration is added
    }

    /**
     * Enhance notes with AI
     */
    enhanceNotesWithAI() {
        // Open AI assistant in note enhancement mode
        if (this.aiServiceManager) {
            this.aiServiceManager.setMode('note_enhancement');
        }
        this.openAIAssistant();
    }

    /**
     * Generate flashcards with AI
     */
    generateFlashcardsWithAI() {
        // Open AI assistant in flashcard generation mode
        if (this.aiServiceManager) {
            this.aiServiceManager.setMode('flashcard_generation');
        }
        this.openAIAssistant();
    }

    /**
     * Analyze MCQs with AI
     */
    analyzeMCQsWithAI() {
        // Open AI assistant in MCQ analysis mode
        if (this.aiServiceManager) {
            this.aiServiceManager.setMode('mcq');
        }
        this.openAIAssistant();
    }

    /**
     * Get integration status
     */
    getIntegrationStatus() {
        return {
            isInitialized: this.isInitialized,
            status: { ...this.integrationStatus },
            components: {
                profileManager: !!this.profileManager,
                aiServiceManager: !!this.aiServiceManager,
                chatInterface: !!this.chatInterface,
                responseManager: !!this.responseManager,
                newsIntegrationService: !!this.newsIntegrationService,
                performanceAnalyticsAI: !!this.performanceAnalyticsAI,
                assistantModeManager: !!this.assistantModeManager
            }
        };
    }

    /**
     * Cleanup and destroy integration
     */
    destroy() {
        // Remove event listeners
        this.eventListeners.forEach((handlers, eventType) => {
            handlers.forEach(handler => {
                window.removeEventListener(eventType, handler);
            });
        });
        
        // Clean up components
        this.eventListeners.clear();
        
        // Remove floating button
        const floatingButton = document.getElementById('ai-floating-button');
        if (floatingButton) {
            floatingButton.remove();
        }
        
        this.isInitialized = false;
        console.log('AI Platform Integration destroyed');
    }
}

// Initialize AI Platform Integration when DOM is loaded
let aiPlatformIntegration;

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Wait a bit for other components to initialize
        setTimeout(() => {
            aiPlatformIntegration = new AIPlatformIntegration();
            window.aiPlatformIntegration = aiPlatformIntegration;
        }, 1000);
    } catch (error) {
        console.error('Failed to initialize AI Platform Integration:', error);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIPlatformIntegration;
}