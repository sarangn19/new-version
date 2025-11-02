/**
 * Real-Time Analytics Dashboard
 * Provides real-time performance metrics, AI insights, and recommendations
 * Integrates with existing statistics page and AI analytics components
 */
class RealTimeAnalyticsDashboard {
    constructor(performanceAnalyticsAI, aiRecommendationEngine) {
        this.performanceAnalyticsAI = performanceAnalyticsAI || window.performanceAnalyticsAI;
        this.aiRecommendationEngine = aiRecommendationEngine || window.aiRecommendationEngine;
        this.profileManager = window.profileManager;
        
        // Configuration
        this.config = {
            updateInterval: 30000, // 30 seconds
            maxInsights: 5,
            maxRecommendations: 3,
            cacheTimeout: 5 * 60 * 1000, // 5 minutes
            animationDuration: 300
        };
        
        // State management
        this.isInitialized = false;
        this.updateTimer = null;
        this.lastUpdateTime = null;
        this.cache = new Map();
        
        // DOM elements
        this.elements = {
            insightsContainer: null,
            recommendationsContainer: null,
            metricsContainer: null,
            lastUpdatedElement: null
        };
        
        this.initialize();
    }

    /**
     * Initialize the real-time analytics dashboard
     */
    async initialize() {
        try {
            // Find DOM elements
            this.findDOMElements();
            
            // Verify dependencies
            if (!this.performanceAnalyticsAI) {
                console.warn('PerformanceAnalyticsAI not available - using fallback data');
            }
            
            if (!this.aiRecommendationEngine) {
                console.warn('AIRecommendationEngine not available - using fallback recommendations');
            }
            
            // Initial data load
            await this.updateDashboard();
            
            // Start real-time updates
            this.startRealTimeUpdates();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('Real-Time Analytics Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Real-Time Analytics Dashboard:', error);
            this.showErrorState();
        }
    }

    /**
     * Find and cache DOM elements
     */
    findDOMElements() {
        // Look for AI insights container in the recommendations section
        this.elements.recommendationsContainer = document.querySelector('.stat-card:last-child .grid');
        
        // Create AI insights section if it doesn't exist
        if (!this.elements.recommendationsContainer) {
            this.createAIInsightsSection();
        }
        
        // Find metrics containers for real-time updates
        this.elements.metricsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
        
        // Create last updated indicator
        this.createLastUpdatedIndicator();
    }

    /**
     * Create AI insights section in the statistics page
     */
    createAIInsightsSection() {
        const mainContent = document.querySelector('#main-content .max-w-7xl');
        if (!mainContent) return;

        // Create AI insights section
        const aiSection = document.createElement('div');
        aiSection.className = 'stat-card rounded-2xl p-6 mb-8';
        aiSection.innerHTML = `
            <div class="flex items-center mb-6">
                <div class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center mr-4">
                    <i data-lucide="brain" class="w-6 h-6 text-white"></i>
                </div>
                <div>
                    <h3 class="text-lg font-semibold">AI Performance Insights</h3>
                    <p class="text-sm text-white/70">Real-time analysis and personalized recommendations</p>
                </div>
                <div class="ml-auto">
                    <div id="ai-insights-status" class="flex items-center text-xs text-white/60">
                        <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        <span>Live</span>
                    </div>
                </div>
            </div>
            
            <!-- AI Insights Grid -->
            <div id="ai-insights-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <!-- Insights will be populated here -->
            </div>
            
            <!-- AI Recommendations -->
            <div class="border-t border-white/10 pt-6">
                <h4 class="text-md font-semibold mb-4 flex items-center">
                    <i data-lucide="lightbulb" class="w-4 h-4 mr-2 text-yellow-400"></i>
                    Personalized Recommendations
                </h4>
                <div id="ai-recommendations-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Recommendations will be populated here -->
                </div>
            </div>
        `;

        // Insert before the existing recommendations section or at the end
        const existingRecommendations = document.querySelector('.stat-card:last-child');
        if (existingRecommendations) {
            mainContent.insertBefore(aiSection, existingRecommendations);
        } else {
            mainContent.appendChild(aiSection);
        }

        // Update element references
        this.elements.insightsContainer = document.getElementById('ai-insights-grid');
        this.elements.recommendationsContainer = document.getElementById('ai-recommendations-grid');
        
        // Initialize Lucide icons for the new section
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Create last updated indicator
     */
    createLastUpdatedIndicator() {
        const header = document.querySelector('#main-content .flex.items-center.justify-between');
        if (!header) return;

        const indicator = document.createElement('div');
        indicator.id = 'last-updated-indicator';
        indicator.className = 'text-xs text-white/60 flex items-center';
        indicator.innerHTML = `
            <i data-lucide="refresh-cw" class="w-3 h-3 mr-1"></i>
            <span>Updated: <span id="last-updated-time">Never</span></span>
        `;

        const rightSection = header.querySelector('.flex.items-center.gap-4');
        if (rightSection) {
            rightSection.appendChild(indicator);
        }

        this.elements.lastUpdatedElement = document.getElementById('last-updated-time');
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Update the entire dashboard with fresh data
     */
    async updateDashboard() {
        try {
            // Get current user data
            const userData = this.getCurrentUserData();
            
            // Get AI analysis and recommendations
            const [analysis, recommendations] = await Promise.all([
                this.getPerformanceAnalysis(userData),
                this.getAIRecommendations(userData)
            ]);
            
            // Update UI components
            await Promise.all([
                this.updateAIInsights(analysis),
                this.updateAIRecommendations(recommendations),
                this.updateRealTimeMetrics(userData, analysis)
            ]);
            
            // Update last updated time
            this.updateLastUpdatedTime();
            
            console.log('Dashboard updated successfully');
            
        } catch (error) {
            console.error('Error updating dashboard:', error);
            this.showErrorState();
        }
    }

    /**
     * Get current user data for analysis
     */
    getCurrentUserData() {
        let userData = {
            timestamp: new Date().toISOString(),
            accuracy: 75.5,
            consistency: 68.2,
            studyTime: 5.2,
            sessionsCompleted: 12,
            totalQuestions: 450,
            correctAnswers: 340
        };

        // Get real data from profile manager if available
        if (this.profileManager) {
            const profile = this.profileManager.getProfile();
            if (profile && profile.sessionHistory) {
                const recentSessions = profile.sessionHistory.slice(-7); // Last 7 sessions
                
                if (recentSessions.length > 0) {
                    userData.accuracy = recentSessions.reduce((sum, s) => sum + (s.performance?.accuracy || 0), 0) / recentSessions.length;
                    userData.studyTime = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60; // Convert to hours
                    userData.sessionsCompleted = recentSessions.length;
                    userData.totalQuestions = recentSessions.reduce((sum, s) => sum + (s.questionsAttempted || 0), 0);
                    userData.correctAnswers = recentSessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
                }
            }
        }

        return userData;
    }

    /**
     * Get performance analysis from AI
     */
    async getPerformanceAnalysis(userData) {
        const cacheKey = `analysis_${JSON.stringify(userData)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.data;
            }
        }

        let analysis = null;
        
        try {
            if (this.performanceAnalyticsAI) {
                analysis = await this.performanceAnalyticsAI.analyzePerformance(userData);
            }
        } catch (error) {
            console.error('Error getting AI analysis:', error);
        }

        // Fallback analysis if AI is not available
        if (!analysis) {
            analysis = this.generateFallbackAnalysis(userData);
        }

        // Cache the result
        this.cache.set(cacheKey, {
            data: analysis,
            timestamp: Date.now()
        });

        return analysis;
    }

    /**
     * Get AI recommendations
     */
    async getAIRecommendations(userData) {
        const cacheKey = `recommendations_${JSON.stringify(userData)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.data;
            }
        }

        let recommendations = [];
        
        try {
            if (this.aiRecommendationEngine) {
                recommendations = await this.aiRecommendationEngine.generatePersonalizedRecommendations(userData, {
                    maxRecommendations: this.config.maxRecommendations
                });
            }
        } catch (error) {
            console.error('Error getting AI recommendations:', error);
        }

        // Fallback recommendations if AI is not available
        if (!recommendations || recommendations.length === 0) {
            recommendations = this.generateFallbackRecommendations(userData);
        }

        // Cache the result
        this.cache.set(cacheKey, {
            data: recommendations,
            timestamp: Date.now()
        });

        return recommendations;
    }

    /**
     * Update AI insights display
     */
    async updateAIInsights(analysis) {
        if (!this.elements.insightsContainer) return;

        const insights = this.extractInsights(analysis);
        
        // Clear existing insights
        this.elements.insightsContainer.innerHTML = '';

        // Add new insights with animation
        insights.forEach((insight, index) => {
            const insightElement = this.createInsightElement(insight, index);
            this.elements.insightsContainer.appendChild(insightElement);
            
            // Animate in
            setTimeout(() => {
                insightElement.style.opacity = '1';
                insightElement.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * Extract insights from analysis data
     */
    extractInsights(analysis) {
        const insights = [];

        if (analysis && analysis.overview) {
            // Performance level insight
            insights.push({
                type: 'performance',
                title: 'Performance Level',
                value: analysis.overview.level || 'Good',
                trend: analysis.overview.performanceScore > 70 ? 'up' : 'down',
                color: analysis.overview.performanceScore > 70 ? 'green' : 'orange',
                description: `Current performance score: ${analysis.overview.performanceScore || 'N/A'}`
            });

            // Study efficiency insight
            insights.push({
                type: 'efficiency',
                title: 'Study Efficiency',
                value: analysis.overview.efficiency || 'Good',
                trend: 'stable',
                color: 'blue',
                description: 'How effectively you\'re using study time'
            });
        }

        // AI-specific insights
        if (analysis && analysis.aiInsights) {
            insights.push({
                type: 'ai_insight',
                title: 'AI Analysis',
                value: 'Available',
                trend: 'up',
                color: 'purple',
                description: 'AI has analyzed your performance patterns'
            });
        }

        // Weakness insights
        if (analysis && analysis.combinedInsights && analysis.combinedInsights.weaknesses.length > 0) {
            const topWeakness = analysis.combinedInsights.weaknesses[0];
            insights.push({
                type: 'weakness',
                title: 'Focus Area',
                value: topWeakness.area || 'General',
                trend: 'attention',
                color: 'red',
                description: topWeakness.description || 'Needs improvement'
            });
        }

        // Strength insights
        if (analysis && analysis.combinedInsights && analysis.combinedInsights.strengths.length > 0) {
            const topStrength = analysis.combinedInsights.strengths[0];
            insights.push({
                type: 'strength',
                title: 'Strong Area',
                value: topStrength.area || 'General',
                trend: 'up',
                color: 'green',
                description: topStrength.description || 'Performing well'
            });
        }

        return insights.slice(0, this.config.maxInsights);
    }

    /**
     * Create insight element
     */
    createInsightElement(insight, index) {
        const element = document.createElement('div');
        element.className = 'bg-white/5 border border-white/10 rounded-lg p-4 transition-all duration-300';
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';

        const trendIcon = this.getTrendIcon(insight.trend);
        const colorClass = this.getColorClass(insight.color);

        element.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full ${colorClass} flex items-center justify-center mr-3">
                        ${trendIcon}
                    </div>
                    <div>
                        <div class="text-sm font-medium text-white">${insight.title}</div>
                        <div class="text-xs text-white/60">${insight.type.replace('_', ' ')}</div>
                    </div>
                </div>
            </div>
            <div class="text-lg font-semibold text-white mb-1">${insight.value}</div>
            <div class="text-xs text-white/70">${insight.description}</div>
        `;

        return element;
    }

    /**
     * Update AI recommendations display
     */
    async updateAIRecommendations(recommendations) {
        if (!this.elements.recommendationsContainer) return;

        // Clear existing recommendations
        this.elements.recommendationsContainer.innerHTML = '';

        // Add new recommendations
        recommendations.slice(0, this.config.maxRecommendations).forEach((rec, index) => {
            const recElement = this.createRecommendationElement(rec, index);
            this.elements.recommendationsContainer.appendChild(recElement);
            
            // Animate in
            setTimeout(() => {
                recElement.style.opacity = '1';
                recElement.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    /**
     * Create recommendation element
     */
    createRecommendationElement(recommendation, index) {
        const element = document.createElement('div');
        element.className = 'bg-white/5 border border-white/10 rounded-lg p-4 transition-all duration-300 hover:bg-white/10';
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';

        const priorityColor = this.getPriorityColor(recommendation.priority);
        const priorityIcon = this.getPriorityIcon(recommendation.priority);

        element.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center">
                    <div class="w-6 h-6 rounded-full ${priorityColor} flex items-center justify-center mr-2">
                        ${priorityIcon}
                    </div>
                    <div class="text-sm font-medium text-white">${recommendation.title}</div>
                </div>
                <span class="text-xs px-2 py-1 rounded-full ${priorityColor} text-white">${recommendation.priority}</span>
            </div>
            <p class="text-xs text-white/70 mb-3">${recommendation.description}</p>
            <div class="text-xs text-white/60">
                <div class="flex items-center mb-1">
                    <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                    <span>${recommendation.timeframe || '2-4 weeks'}</span>
                </div>
                <div class="flex items-center">
                    <i data-lucide="target" class="w-3 h-3 mr-1"></i>
                    <span>${recommendation.expectedImpact || 'Improved performance'}</span>
                </div>
            </div>
        `;

        return element;
    }

    /**
     * Update real-time metrics in existing stat cards
     */
    async updateRealTimeMetrics(userData, analysis) {
        if (!this.elements.metricsContainer) return;

        // Update accuracy rate
        const accuracyCard = this.elements.metricsContainer.querySelector('.stat-card:nth-child(3)');
        if (accuracyCard) {
            const counter = accuracyCard.querySelector('.counter');
            if (counter) {
                this.animateCounter(counter, userData.accuracy);
            }
        }

        // Update study time
        const studyTimeCard = this.elements.metricsContainer.querySelector('.stat-card:nth-child(1)');
        if (studyTimeCard) {
            const counter = studyTimeCard.querySelector('.counter');
            if (counter) {
                this.animateCounter(counter, Math.floor(userData.studyTime * 10) / 10);
            }
        }

        // Update questions attempted
        const questionsCard = this.elements.metricsContainer.querySelector('.stat-card:nth-child(2)');
        if (questionsCard) {
            const counter = questionsCard.querySelector('.counter');
            if (counter) {
                this.animateCounter(counter, userData.totalQuestions);
            }
        }
    }

    /**
     * Animate counter with smooth transition
     */
    animateCounter(element, targetValue) {
        const currentValue = parseFloat(element.textContent) || 0;
        const difference = targetValue - currentValue;
        const steps = 20;
        const stepValue = difference / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const newValue = currentValue + (stepValue * currentStep);
            
            if (currentStep >= steps) {
                element.textContent = targetValue % 1 === 0 ? Math.floor(targetValue) : targetValue.toFixed(1);
                clearInterval(timer);
            } else {
                element.textContent = newValue % 1 === 0 ? Math.floor(newValue) : newValue.toFixed(1);
            }
        }, this.config.animationDuration / steps);
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        this.updateTimer = setInterval(() => {
            this.updateDashboard();
        }, this.config.updateInterval);
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    /**
     * Update last updated time indicator
     */
    updateLastUpdatedTime() {
        if (this.elements.lastUpdatedElement) {
            const now = new Date();
            this.elements.lastUpdatedElement.textContent = now.toLocaleTimeString();
            this.lastUpdateTime = now;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for visibility changes to pause/resume updates
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopRealTimeUpdates();
            } else {
                this.startRealTimeUpdates();
            }
        });

        // Listen for profile updates
        if (this.profileManager) {
            // Assuming profile manager has event system
            document.addEventListener('profileUpdated', () => {
                this.updateDashboard();
            });
        }
    }

    /**
     * Generate fallback analysis when AI is not available
     */
    generateFallbackAnalysis(userData) {
        return {
            timestamp: new Date().toISOString(),
            overview: {
                performanceScore: Math.min(100, userData.accuracy + 10),
                level: userData.accuracy > 80 ? 'Excellent' : userData.accuracy > 60 ? 'Good' : 'Needs Improvement',
                efficiency: userData.studyTime > 4 ? 'High Efficiency' : 'Moderate Efficiency'
            },
            combinedInsights: {
                strengths: userData.accuracy > 70 ? [{ area: 'Answer Accuracy', description: 'Performing well in assessments' }] : [],
                weaknesses: userData.accuracy < 70 ? [{ area: 'Answer Accuracy', description: 'Needs improvement in accuracy' }] : [],
                priorityActions: ['Continue regular study sessions', 'Focus on weak areas'],
                nextSteps: ['Take more practice tests', 'Review incorrect answers']
            },
            analysisMethod: 'fallback',
            confidence: 0.6
        };
    }

    /**
     * Generate fallback recommendations
     */
    generateFallbackRecommendations(userData) {
        const recommendations = [];

        if (userData.accuracy < 70) {
            recommendations.push({
                id: 'improve_accuracy',
                title: 'Improve Answer Accuracy',
                description: 'Focus on understanding concepts before attempting questions',
                priority: 'high',
                timeframe: '2-3 weeks',
                expectedImpact: 'Increase accuracy by 10-15%'
            });
        }

        if (userData.studyTime < 4) {
            recommendations.push({
                id: 'increase_study_time',
                title: 'Increase Daily Study Time',
                description: 'Aim for at least 4-5 hours of focused study daily',
                priority: 'medium',
                timeframe: '1-2 weeks',
                expectedImpact: 'Better coverage of syllabus'
            });
        }

        recommendations.push({
            id: 'regular_practice',
            title: 'Regular Practice Tests',
            description: 'Take weekly mock tests to track progress',
            priority: 'medium',
            timeframe: 'Ongoing',
            expectedImpact: 'Better exam preparedness'
        });

        return recommendations;
    }

    /**
     * Show error state
     */
    showErrorState() {
        if (this.elements.insightsContainer) {
            this.elements.insightsContainer.innerHTML = `
                <div class="col-span-full bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                    <i data-lucide="alert-triangle" class="w-6 h-6 text-red-400 mx-auto mb-2"></i>
                    <div class="text-sm text-red-400">Unable to load AI insights</div>
                    <div class="text-xs text-white/60 mt-1">Please try refreshing the page</div>
                </div>
            `;
        }

        if (this.elements.recommendationsContainer) {
            this.elements.recommendationsContainer.innerHTML = `
                <div class="col-span-full bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                    <div class="text-sm text-red-400">Unable to load recommendations</div>
                </div>
            `;
        }
    }

    // Helper methods for UI styling
    getTrendIcon(trend) {
        const icons = {
            up: '<i data-lucide="trending-up" class="w-4 h-4 text-white"></i>',
            down: '<i data-lucide="trending-down" class="w-4 h-4 text-white"></i>',
            stable: '<i data-lucide="minus" class="w-4 h-4 text-white"></i>',
            attention: '<i data-lucide="alert-circle" class="w-4 h-4 text-white"></i>'
        };
        return icons[trend] || icons.stable;
    }

    getColorClass(color) {
        const classes = {
            green: 'bg-green-500/20 border-green-500/30',
            blue: 'bg-blue-500/20 border-blue-500/30',
            purple: 'bg-purple-500/20 border-purple-500/30',
            orange: 'bg-orange-500/20 border-orange-500/30',
            red: 'bg-red-500/20 border-red-500/30'
        };
        return classes[color] || classes.blue;
    }

    getPriorityColor(priority) {
        const colors = {
            critical: 'bg-red-500/20 border-red-500/30',
            high: 'bg-orange-500/20 border-orange-500/30',
            medium: 'bg-blue-500/20 border-blue-500/30',
            low: 'bg-gray-500/20 border-gray-500/30'
        };
        return colors[priority] || colors.medium;
    }

    getPriorityIcon(priority) {
        const icons = {
            critical: '<i data-lucide="alert-triangle" class="w-3 h-3 text-white"></i>',
            high: '<i data-lucide="arrow-up" class="w-3 h-3 text-white"></i>',
            medium: '<i data-lucide="minus" class="w-3 h-3 text-white"></i>',
            low: '<i data-lucide="arrow-down" class="w-3 h-3 text-white"></i>'
        };
        return icons[priority] || icons.medium;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopRealTimeUpdates();
        this.cache.clear();
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeAnalyticsDashboard;
}

// Make available globally
window.RealTimeAnalyticsDashboard = RealTimeAnalyticsDashboard;