/**
 * PerformanceAnalyticsAI - AI-powered performance analysis and recommendations
 * Integrates with existing PerformanceOptimizer and PerformanceAnalyzer to provide
 * intelligent insights, weakness identification, and personalized recommendations
 */
class PerformanceAnalyticsAI {
    constructor(aiService, performanceOptimizer) {
        this.aiService = aiService || window.aiServiceManager;
        this.performanceOptimizer = performanceOptimizer || window.performanceOptimizer;
        this.performanceAnalyzer = window.performanceAnalyzer;
        
        // Configuration
        this.config = {
            analysisMode: 'performance_analytics',
            minDataPoints: 5, // Minimum data points needed for AI analysis
            analysisInterval: 24 * 60 * 60 * 1000, // 24 hours between analyses
            cacheTimeout: 60 * 60 * 1000, // 1 hour cache timeout
            maxRecommendations: 10
        };
        
        // Cache for AI analysis results
        this.analysisCache = new Map();
        this.lastAnalysisTime = null;
        
        // Pattern recognition data
        this.learningPatterns = {
            studyHabits: new Map(),
            performanceTrends: new Map(),
            weaknessPatterns: new Map(),
            strengthPatterns: new Map()
        };
        
        this.initialize();
    }

    /**
     * Initialize the AI analytics system
     */
    async initialize() {
        try {
            // Verify dependencies
            if (!this.aiService) {
                console.warn('AI Service not available - PerformanceAnalyticsAI will use fallback methods');
            }
            
            if (!this.performanceAnalyzer) {
                console.warn('PerformanceAnalyzer not available - limited functionality');
            }
            
            // Load existing patterns from storage
            this.loadLearningPatterns();
            
            // Set up periodic analysis
            this.setupPeriodicAnalysis();
            
            console.log('PerformanceAnalyticsAI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PerformanceAnalyticsAI:', error);
            throw error;
        }
    }

    /**
     * Analyze user performance data using AI insights
     * @param {Object} userData - User performance data
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} AI-powered analysis results
     */
    async analyzePerformance(userData, options = {}) {
        try {
            const cacheKey = `analysis_${JSON.stringify(userData)}_${JSON.stringify(options)}`;
            
            // Check cache first
            if (this.analysisCache.has(cacheKey)) {
                const cached = this.analysisCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                    return cached.data;
                }
            }
            
            // Get comprehensive performance data
            const performanceData = await this.gatherPerformanceData(userData, options);
            
            // Validate data sufficiency
            if (!this.hassufficientData(performanceData)) {
                return this.generateFallbackAnalysis(performanceData);
            }
            
            // Perform AI-powered analysis
            const aiAnalysis = await this.performAIAnalysis(performanceData, options);
            
            // Combine with traditional analysis
            const traditionalAnalysis = this.performTraditionalAnalysis(performanceData);
            
            // Generate comprehensive insights
            const analysis = this.combineAnalyses(aiAnalysis, traditionalAnalysis, performanceData);
            
            // Update learning patterns
            this.updateLearningPatterns(performanceData, analysis);
            
            // Cache results
            this.analysisCache.set(cacheKey, {
                data: analysis,
                timestamp: Date.now()
            });
            
            return analysis;
            
        } catch (error) {
            console.error('Error in analyzePerformance:', error);
            return this.generateErrorFallback(error);
        }
    }

    /**
     * Identify weakness patterns using AI and historical data
     * @param {Object} performanceData - Performance data to analyze
     * @returns {Promise<Array>} Identified weakness patterns
     */
    async identifyWeaknessPatterns(performanceData) {
        try {
            const weaknesses = [];
            
            // Analyze accuracy patterns by subject/topic
            const accuracyPatterns = this.analyzeAccuracyPatterns(performanceData);
            weaknesses.push(...accuracyPatterns);
            
            // Analyze time-based performance patterns
            const timePatterns = this.analyzeTimeBasedPatterns(performanceData);
            weaknesses.push(...timePatterns);
            
            // Analyze consistency patterns
            const consistencyPatterns = this.analyzeConsistencyPatterns(performanceData);
            weaknesses.push(...consistencyPatterns);
            
            // Use AI to identify complex patterns if available
            if (this.aiService && this.aiService.isReady()) {
                const aiWeaknesses = await this.identifyAIWeaknesses(performanceData);
                weaknesses.push(...aiWeaknesses);
            }
            
            // Rank weaknesses by severity and impact
            return this.rankWeaknesses(weaknesses);
            
        } catch (error) {
            console.error('Error identifying weakness patterns:', error);
            return [];
        }
    }

    /**
     * Generate personalized study recommendations using AI
     * @param {Object} analyticsData - Performance analytics data
     * @param {Object} options - Recommendation options
     * @returns {Promise<Array>} Personalized recommendations
     */
    async generatePersonalizedRecommendations(analyticsData, options = {}) {
        try {
            const recommendations = [];
            
            // Generate rule-based recommendations
            const ruleBasedRecs = this.generateRuleBasedRecommendations(analyticsData);
            recommendations.push(...ruleBasedRecs);
            
            // Generate AI-powered recommendations if available
            if (this.aiService && this.aiService.isReady()) {
                const aiRecommendations = await this.generateAIRecommendations(analyticsData, options);
                recommendations.push(...aiRecommendations);
            }
            
            // Personalize based on learning patterns
            const personalizedRecs = this.personalizeRecommendations(recommendations, analyticsData);
            
            // Prioritize and limit recommendations
            return this.prioritizeRecommendations(personalizedRecs, options.maxRecommendations || this.config.maxRecommendations);
            
        } catch (error) {
            console.error('Error generating recommendations:', error);
            return this.generateFallbackRecommendations(analyticsData);
        }
    }

    /**
     * Generate daily tasks based on performance patterns
     * @param {Object} userProfile - User profile data
     * @param {Object} goals - User goals and preferences
     * @returns {Promise<Array>} Daily task recommendations
     */
    async generateDailyTasks(userProfile, goals = {}) {
        try {
            const tasks = [];
            
            // Get recent performance data
            const recentData = await this.getRecentPerformanceData(userProfile, 7); // Last 7 days
            
            // Identify priority areas
            const priorityAreas = await this.identifyPriorityAreas(recentData, goals);
            
            // Generate tasks for each priority area
            for (const area of priorityAreas) {
                const areaTasks = await this.generateTasksForArea(area, userProfile, goals);
                tasks.push(...areaTasks);
            }
            
            // Add routine maintenance tasks
            const maintenanceTasks = this.generateMaintenanceTasks(recentData, goals);
            tasks.push(...maintenanceTasks);
            
            // Optimize task order and timing
            return this.optimizeTaskSchedule(tasks, userProfile, goals);
            
        } catch (error) {
            console.error('Error generating daily tasks:', error);
            return this.generateFallbackTasks(userProfile, goals);
        }
    }

    /**
     * Gather comprehensive performance data from all sources
     * @param {Object} userData - Base user data
     * @param {Object} options - Gathering options
     * @returns {Promise<Object>} Comprehensive performance data
     */
    async gatherPerformanceData(userData, options = {}) {
        const data = {
            timestamp: new Date().toISOString(),
            timeframe: options.timeframe || 'monthly',
            subject: options.subject || null,
            ...userData
        };
        
        try {
            // Get data from PerformanceAnalyzer if available
            if (this.performanceAnalyzer) {
                const metrics = this.performanceAnalyzer.calculatePerformanceMetrics(data.timeframe, data.subject);
                const trends = this.performanceAnalyzer.performTrendAnalysis(data.timeframe, data.subject);
                const insights = this.performanceAnalyzer.getPerformanceInsights(data.timeframe, data.subject);
                
                data.metrics = metrics;
                data.trends = trends;
                data.insights = insights;
            }
            
            // Get data from PerformanceOptimizer if available
            if (this.performanceOptimizer) {
                const report = this.performanceOptimizer.getPerformanceReport();
                data.systemPerformance = report;
            }
            
            // Get profile data if available
            if (window.profileManager) {
                const profile = window.profileManager.getProfile();
                data.profile = profile;
                data.studyHistory = profile.sessionHistory || [];
                data.goals = profile.goals || [];
            }
            
            return data;
            
        } catch (error) {
            console.error('Error gathering performance data:', error);
            return data;
        }
    }

    /**
     * Check if we have sufficient data for AI analysis
     * @param {Object} performanceData - Performance data to check
     * @returns {boolean} Whether data is sufficient
     */
    hassufficientData(performanceData) {
        const minDataPoints = this.config.minDataPoints;
        
        // Check for minimum sessions
        const sessionCount = performanceData.studyHistory?.length || 0;
        if (sessionCount < minDataPoints) return false;
        
        // Check for assessment data
        const assessmentCount = performanceData.metrics?.dataPoints?.assessments || 0;
        if (assessmentCount < Math.floor(minDataPoints / 2)) return false;
        
        return true;
    }

    /**
     * Perform AI-powered analysis using the AI service
     * @param {Object} performanceData - Performance data
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} AI analysis results
     */
    async performAIAnalysis(performanceData, options = {}) {
        if (!this.aiService || !this.aiService.isReady()) {
            return null;
        }
        
        try {
            // Set AI mode to performance analytics
            this.aiService.setMode('general'); // Use general mode for now
            
            // Build analysis prompt
            const prompt = this.buildAnalysisPrompt(performanceData, options);
            
            // Get AI response
            const response = await this.aiService.sendMessage(prompt, {
                context: {
                    type: 'performance_analysis',
                    data: performanceData
                },
                autoSave: false
            });
            
            // Parse AI response
            return this.parseAIAnalysisResponse(response.content);
            
        } catch (error) {
            console.error('Error in AI analysis:', error);
            return null;
        }
    }

    /**
     * Build analysis prompt for AI
     * @param {Object} performanceData - Performance data
     * @param {Object} options - Analysis options
     * @returns {string} Analysis prompt
     */
    buildAnalysisPrompt(performanceData, options) {
        const { metrics, trends, insights } = performanceData;
        
        let prompt = `Analyze this UPSC student's performance data and provide insights:

PERFORMANCE METRICS:
- Overall Accuracy: ${metrics?.overallAccuracy?.toFixed(1) || 'N/A'}%
- Performance Score: ${metrics?.performanceScore || 'N/A'}/100
- Study Consistency: ${metrics?.studyConsistency?.toFixed(1) || 'N/A'}%
- Total Study Time: ${metrics?.totalStudyTime?.toFixed(1) || 'N/A'} hours
- Focus Quality: ${metrics?.focusQuality?.toFixed(1) || 'N/A'}%

TRENDS:
- Accuracy Trend: ${trends?.trends?.accuracy?.toFixed(2) || 'N/A'}
- Study Time Trend: ${trends?.trends?.studyTime?.toFixed(2) || 'N/A'}
- Focus Quality Trend: ${trends?.trends?.focusQuality?.toFixed(2) || 'N/A'}

CURRENT STRENGTHS:
${insights?.strengths?.map(s => `- ${s.area}: ${s.description}`).join('\n') || 'None identified'}

CURRENT WEAKNESSES:
${insights?.weaknesses?.map(w => `- ${w.area}: ${w.description}`).join('\n') || 'None identified'}

Please provide:
1. Key insights about learning patterns and performance trends
2. Specific weakness areas that need immediate attention
3. Personalized study recommendations based on the data
4. Daily task suggestions for the next week
5. Long-term strategy recommendations for UPSC preparation

Focus on actionable, specific advice that considers UPSC exam requirements.`;

        return prompt;
    }

    /**
     * Parse AI analysis response
     * @param {string} responseContent - AI response content
     * @returns {Object} Parsed analysis
     */
    parseAIAnalysisResponse(responseContent) {
        try {
            // Simple parsing - in production, this could be more sophisticated
            const sections = responseContent.split(/\d+\./);
            
            return {
                insights: this.extractSection(sections, 1) || 'No specific insights provided',
                weaknesses: this.extractSection(sections, 2) || 'No specific weaknesses identified',
                recommendations: this.extractSection(sections, 3) || 'No specific recommendations provided',
                dailyTasks: this.extractSection(sections, 4) || 'No daily tasks suggested',
                longTermStrategy: this.extractSection(sections, 5) || 'No long-term strategy provided',
                rawResponse: responseContent
            };
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return {
                insights: 'Analysis completed but parsing failed',
                weaknesses: 'Unable to parse weakness analysis',
                recommendations: 'Unable to parse recommendations',
                dailyTasks: 'Unable to parse daily tasks',
                longTermStrategy: 'Unable to parse long-term strategy',
                rawResponse: responseContent
            };
        }
    }

    /**
     * Extract section from parsed response
     * @param {Array} sections - Response sections
     * @param {number} index - Section index
     * @returns {string} Extracted section
     */
    extractSection(sections, index) {
        if (sections.length > index) {
            return sections[index].trim();
        }
        return null;
    }

    /**
     * Perform traditional rule-based analysis
     * @param {Object} performanceData - Performance data
     * @returns {Object} Traditional analysis results
     */
    performTraditionalAnalysis(performanceData) {
        const { metrics, trends } = performanceData;
        
        const analysis = {
            performanceLevel: this.categorizePerformanceLevel(metrics?.performanceScore || 0),
            criticalAreas: this.identifyCriticalAreas(metrics),
            trendAnalysis: this.analyzeTrends(trends),
            studyEfficiency: this.calculateStudyEfficiency(metrics),
            recommendations: this.generateBasicRecommendations(metrics, trends)
        };
        
        return analysis;
    }

    /**
     * Combine AI and traditional analyses
     * @param {Object} aiAnalysis - AI analysis results
     * @param {Object} traditionalAnalysis - Traditional analysis results
     * @param {Object} performanceData - Original performance data
     * @returns {Object} Combined analysis
     */
    combineAnalyses(aiAnalysis, traditionalAnalysis, performanceData) {
        return {
            timestamp: new Date().toISOString(),
            dataSource: performanceData,
            
            // Performance overview
            overview: {
                performanceScore: performanceData.metrics?.performanceScore || 0,
                performanceGrade: performanceData.metrics?.performanceGrade || 'N/A',
                level: traditionalAnalysis.performanceLevel,
                efficiency: traditionalAnalysis.studyEfficiency
            },
            
            // AI insights (if available)
            aiInsights: aiAnalysis ? {
                keyInsights: aiAnalysis.insights,
                aiRecommendations: aiAnalysis.recommendations,
                dailyTaskSuggestions: aiAnalysis.dailyTasks,
                longTermStrategy: aiAnalysis.longTermStrategy
            } : null,
            
            // Traditional analysis
            traditionalAnalysis: {
                criticalAreas: traditionalAnalysis.criticalAreas,
                trendAnalysis: traditionalAnalysis.trendAnalysis,
                basicRecommendations: traditionalAnalysis.recommendations
            },
            
            // Combined insights
            combinedInsights: {
                strengths: performanceData.insights?.strengths || [],
                weaknesses: performanceData.insights?.weaknesses || [],
                priorityActions: this.generatePriorityActions(aiAnalysis, traditionalAnalysis),
                nextSteps: this.generateNextSteps(aiAnalysis, traditionalAnalysis, performanceData)
            },
            
            // Metadata
            analysisMethod: aiAnalysis ? 'ai_enhanced' : 'traditional',
            confidence: aiAnalysis ? 0.85 : 0.70,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Generate fallback analysis when AI is not available
     * @param {Object} performanceData - Performance data
     * @returns {Object} Fallback analysis
     */
    generateFallbackAnalysis(performanceData) {
        return {
            timestamp: new Date().toISOString(),
            dataSource: performanceData,
            
            overview: {
                performanceScore: performanceData.metrics?.performanceScore || 0,
                performanceGrade: performanceData.metrics?.performanceGrade || 'N/A',
                level: 'Insufficient data for detailed analysis',
                efficiency: 'Cannot calculate with limited data'
            },
            
            aiInsights: null,
            
            traditionalAnalysis: {
                criticalAreas: ['Insufficient data for analysis'],
                trendAnalysis: 'Need more study sessions for trend analysis',
                basicRecommendations: [
                    'Continue regular study sessions to build performance history',
                    'Take practice tests to generate assessment data',
                    'Maintain consistent study schedule'
                ]
            },
            
            combinedInsights: {
                strengths: [],
                weaknesses: [],
                priorityActions: ['Build study history with regular sessions'],
                nextSteps: ['Complete at least 5 study sessions for detailed analysis']
            },
            
            analysisMethod: 'insufficient_data',
            confidence: 0.30,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Analyze accuracy patterns by subject/topic
     * @param {Object} performanceData - Performance data
     * @returns {Array} Accuracy pattern weaknesses
     */
    analyzeAccuracyPatterns(performanceData) {
        const weaknesses = [];
        const metrics = performanceData.metrics;
        
        if (metrics && metrics.overallAccuracy < 70) {
            weaknesses.push({
                type: 'accuracy',
                severity: 'high',
                area: 'Overall Accuracy',
                score: metrics.overallAccuracy,
                description: `Overall accuracy of ${metrics.overallAccuracy.toFixed(1)}% is below target`,
                suggestion: 'Focus on understanding concepts before attempting questions',
                impact: 'high'
            });
        }
        
        return weaknesses;
    }

    /**
     * Analyze time-based performance patterns
     * @param {Object} performanceData - Performance data
     * @returns {Array} Time-based pattern weaknesses
     */
    analyzeTimeBasedPatterns(performanceData) {
        const weaknesses = [];
        const metrics = performanceData.metrics;
        
        if (metrics && metrics.studyConsistency < 50) {
            weaknesses.push({
                type: 'consistency',
                severity: 'medium',
                area: 'Study Consistency',
                score: metrics.studyConsistency,
                description: `Study consistency of ${metrics.studyConsistency.toFixed(1)}% indicates irregular study pattern`,
                suggestion: 'Establish a regular daily study schedule',
                impact: 'medium'
            });
        }
        
        return weaknesses;
    }

    /**
     * Analyze consistency patterns
     * @param {Object} performanceData - Performance data
     * @returns {Array} Consistency pattern weaknesses
     */
    analyzeConsistencyPatterns(performanceData) {
        const weaknesses = [];
        const metrics = performanceData.metrics;
        
        if (metrics && metrics.consistencyScore < 60) {
            weaknesses.push({
                type: 'performance_consistency',
                severity: 'medium',
                area: 'Performance Consistency',
                score: metrics.consistencyScore,
                description: `Performance varies significantly between sessions (${metrics.consistencyScore.toFixed(1)}% consistency)`,
                suggestion: 'Review and standardize study methods across all sessions',
                impact: 'medium'
            });
        }
        
        return weaknesses;
    }

    /**
     * Identify AI-powered weaknesses
     * @param {Object} performanceData - Performance data
     * @returns {Promise<Array>} AI-identified weaknesses
     */
    async identifyAIWeaknesses(performanceData) {
        // This would use AI to identify complex patterns
        // For now, return empty array as placeholder
        return [];
    }

    /**
     * Rank weaknesses by severity and impact
     * @param {Array} weaknesses - Array of weakness objects
     * @returns {Array} Ranked weaknesses
     */
    rankWeaknesses(weaknesses) {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const impactOrder = { high: 3, medium: 2, low: 1 };
        
        return weaknesses.sort((a, b) => {
            const aScore = (severityOrder[a.severity] || 1) + (impactOrder[a.impact] || 1);
            const bScore = (severityOrder[b.severity] || 1) + (impactOrder[b.impact] || 1);
            return bScore - aScore;
        });
    }

    /**
     * Generate rule-based recommendations
     * @param {Object} analyticsData - Analytics data
     * @returns {Array} Rule-based recommendations
     */
    generateRuleBasedRecommendations(analyticsData) {
        const recommendations = [];
        const metrics = analyticsData.metrics;
        
        if (metrics) {
            if (metrics.overallAccuracy < 70) {
                recommendations.push({
                    type: 'accuracy_improvement',
                    priority: 'high',
                    title: 'Improve Answer Accuracy',
                    description: 'Focus on understanding concepts before attempting practice questions',
                    action: 'Spend 30 minutes on theory before each practice session',
                    expectedImpact: 'Increase accuracy by 10-15% in 2 weeks'
                });
            }
            
            if (metrics.studyConsistency < 50) {
                recommendations.push({
                    type: 'consistency_improvement',
                    priority: 'medium',
                    title: 'Establish Study Routine',
                    description: 'Create and maintain a regular study schedule',
                    action: 'Set fixed study times and use reminders',
                    expectedImpact: 'Improve consistency to 70%+ in 3 weeks'
                });
            }
            
            if (metrics.totalStudyTime < 20) {
                recommendations.push({
                    type: 'time_increase',
                    priority: 'high',
                    title: 'Increase Study Time',
                    description: 'Current study time is below recommended levels',
                    action: 'Aim for at least 1 hour of focused study daily',
                    expectedImpact: 'Better performance across all metrics'
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Generate AI-powered recommendations
     * @param {Object} analyticsData - Analytics data
     * @param {Object} options - Recommendation options
     * @returns {Promise<Array>} AI-generated recommendations
     */
    async generateAIRecommendations(analyticsData, options = {}) {
        // Placeholder for AI-generated recommendations
        // This would use the AI service to generate personalized recommendations
        return [];
    }

    /**
     * Personalize recommendations based on learning patterns
     * @param {Array} recommendations - Base recommendations
     * @param {Object} analyticsData - Analytics data
     * @returns {Array} Personalized recommendations
     */
    personalizeRecommendations(recommendations, analyticsData) {
        // Add personalization based on user patterns
        return recommendations.map(rec => ({
            ...rec,
            personalized: true,
            confidence: 0.8
        }));
    }

    /**
     * Prioritize recommendations
     * @param {Array} recommendations - Recommendations to prioritize
     * @param {number} maxRecommendations - Maximum number to return
     * @returns {Array} Prioritized recommendations
     */
    prioritizeRecommendations(recommendations, maxRecommendations) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        
        return recommendations
            .sort((a, b) => (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1))
            .slice(0, maxRecommendations);
    }

    /**
     * Generate fallback recommendations
     * @param {Object} analyticsData - Analytics data
     * @returns {Array} Fallback recommendations
     */
    generateFallbackRecommendations(analyticsData) {
        return [
            {
                type: 'general',
                priority: 'medium',
                title: 'Maintain Regular Study Schedule',
                description: 'Consistency is key to UPSC preparation success',
                action: 'Study for at least 1 hour daily at the same time',
                expectedImpact: 'Improved overall performance'
            },
            {
                type: 'general',
                priority: 'medium',
                title: 'Take Regular Practice Tests',
                description: 'Regular assessment helps track progress',
                action: 'Take at least 2 practice tests per week',
                expectedImpact: 'Better understanding of exam pattern'
            }
        ];
    }

    /**
     * Get recent performance data
     * @param {Object} userProfile - User profile
     * @param {number} days - Number of days to look back
     * @returns {Promise<Object>} Recent performance data
     */
    async getRecentPerformanceData(userProfile, days = 7) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Filter recent sessions and assessments
        const recentSessions = (userProfile.sessionHistory || []).filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= startDate && sessionDate <= endDate;
        });
        
        return {
            sessions: recentSessions,
            timeframe: `${days} days`,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
    }

    /**
     * Identify priority areas for daily tasks
     * @param {Object} recentData - Recent performance data
     * @param {Object} goals - User goals
     * @returns {Promise<Array>} Priority areas
     */
    async identifyPriorityAreas(recentData, goals) {
        const areas = [];
        
        // Analyze recent performance to identify weak areas
        if (recentData.sessions.length > 0) {
            const avgAccuracy = recentData.sessions.reduce((sum, s) => sum + (s.performance?.accuracy || 0), 0) / recentData.sessions.length;
            
            if (avgAccuracy < 70) {
                areas.push({
                    type: 'accuracy_improvement',
                    priority: 'high',
                    subject: 'general',
                    reason: 'Recent accuracy below target'
                });
            }
        }
        
        // Add goal-based priorities
        if (goals.targetSubjects) {
            goals.targetSubjects.forEach(subject => {
                areas.push({
                    type: 'subject_focus',
                    priority: 'medium',
                    subject: subject,
                    reason: 'User-defined target subject'
                });
            });
        }
        
        return areas;
    }

    /**
     * Generate tasks for a specific area
     * @param {Object} area - Priority area
     * @param {Object} userProfile - User profile
     * @param {Object} goals - User goals
     * @returns {Promise<Array>} Tasks for the area
     */
    async generateTasksForArea(area, userProfile, goals) {
        const tasks = [];
        
        switch (area.type) {
            case 'accuracy_improvement':
                tasks.push({
                    id: `task_${Date.now()}_1`,
                    type: 'study',
                    title: 'Concept Review Session',
                    description: 'Review fundamental concepts before practice',
                    subject: area.subject,
                    estimatedTime: 30,
                    priority: area.priority,
                    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                });
                break;
                
            case 'subject_focus':
                tasks.push({
                    id: `task_${Date.now()}_2`,
                    type: 'practice',
                    title: `${area.subject} Practice Session`,
                    description: `Focused practice on ${area.subject}`,
                    subject: area.subject,
                    estimatedTime: 45,
                    priority: area.priority,
                    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                });
                break;
        }
        
        return tasks;
    }

    /**
     * Generate maintenance tasks
     * @param {Object} recentData - Recent performance data
     * @param {Object} goals - User goals
     * @returns {Array} Maintenance tasks
     */
    generateMaintenanceTasks(recentData, goals) {
        return [
            {
                id: `maintenance_${Date.now()}_1`,
                type: 'review',
                title: 'Daily Current Affairs',
                description: 'Read and analyze current affairs for UPSC relevance',
                subject: 'current_affairs',
                estimatedTime: 20,
                priority: 'medium',
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    /**
     * Optimize task schedule
     * @param {Array} tasks - Tasks to schedule
     * @param {Object} userProfile - User profile
     * @param {Object} goals - User goals
     * @returns {Array} Optimized task schedule
     */
    optimizeTaskSchedule(tasks, userProfile, goals) {
        // Sort by priority and estimated time
        return tasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 1;
            const bPriority = priorityOrder[b.priority] || 1;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            
            return a.estimatedTime - b.estimatedTime;
        });
    }

    /**
     * Generate fallback tasks
     * @param {Object} userProfile - User profile
     * @param {Object} goals - User goals
     * @returns {Array} Fallback tasks
     */
    generateFallbackTasks(userProfile, goals) {
        return [
            {
                id: `fallback_${Date.now()}_1`,
                type: 'study',
                title: 'General Study Session',
                description: 'Continue with regular study routine',
                subject: 'general',
                estimatedTime: 60,
                priority: 'medium',
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    /**
     * Categorize performance level
     * @param {number} score - Performance score
     * @returns {string} Performance level
     */
    categorizePerformanceLevel(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Good';
        if (score >= 60) return 'Average';
        if (score >= 45) return 'Needs Improvement';
        return 'Poor';
    }

    /**
     * Identify critical areas
     * @param {Object} metrics - Performance metrics
     * @returns {Array} Critical areas
     */
    identifyCriticalAreas(metrics) {
        const critical = [];
        
        if (metrics) {
            if (metrics.overallAccuracy < 60) critical.push('Accuracy');
            if (metrics.studyConsistency < 40) critical.push('Study Consistency');
            if (metrics.focusQuality < 70) critical.push('Focus Quality');
            if (metrics.totalStudyTime < 15) critical.push('Study Time');
        }
        
        return critical;
    }

    /**
     * Analyze trends
     * @param {Object} trends - Trend data
     * @returns {Object} Trend analysis
     */
    analyzeTrends(trends) {
        if (!trends || !trends.trends) {
            return { summary: 'Insufficient data for trend analysis' };
        }
        
        const { accuracy, studyTime, focusQuality } = trends.trends;
        
        return {
            accuracy: accuracy > 1 ? 'Improving' : accuracy < -1 ? 'Declining' : 'Stable',
            studyTime: studyTime > 0.1 ? 'Increasing' : studyTime < -0.1 ? 'Decreasing' : 'Stable',
            focusQuality: focusQuality > 0.5 ? 'Improving' : focusQuality < -0.5 ? 'Declining' : 'Stable',
            summary: 'Trend analysis completed'
        };
    }

    /**
     * Calculate study efficiency
     * @param {Object} metrics - Performance metrics
     * @returns {string} Study efficiency assessment
     */
    calculateStudyEfficiency(metrics) {
        if (!metrics) return 'Cannot calculate efficiency';
        
        const efficiency = (metrics.overallAccuracy || 0) / Math.max(1, metrics.totalStudyTime || 1);
        
        if (efficiency > 4) return 'High Efficiency';
        if (efficiency > 2) return 'Good Efficiency';
        if (efficiency > 1) return 'Average Efficiency';
        return 'Low Efficiency';
    }

    /**
     * Generate basic recommendations
     * @param {Object} metrics - Performance metrics
     * @param {Object} trends - Trend data
     * @returns {Array} Basic recommendations
     */
    generateBasicRecommendations(metrics, trends) {
        const recommendations = [];
        
        if (metrics && metrics.overallAccuracy < 70) {
            recommendations.push('Focus on improving answer accuracy through concept review');
        }
        
        if (metrics && metrics.studyConsistency < 50) {
            recommendations.push('Establish a more consistent study routine');
        }
        
        if (trends && trends.trends && trends.trends.accuracy < -1) {
            recommendations.push('Address declining accuracy trend immediately');
        }
        
        return recommendations;
    }

    /**
     * Generate priority actions
     * @param {Object} aiAnalysis - AI analysis
     * @param {Object} traditionalAnalysis - Traditional analysis
     * @returns {Array} Priority actions
     */
    generatePriorityActions(aiAnalysis, traditionalAnalysis) {
        const actions = [];
        
        // Add critical areas as priority actions
        if (traditionalAnalysis.criticalAreas.length > 0) {
            actions.push(`Address critical areas: ${traditionalAnalysis.criticalAreas.join(', ')}`);
        }
        
        // Add AI recommendations if available
        if (aiAnalysis && aiAnalysis.recommendations) {
            actions.push('Follow AI-generated personalized recommendations');
        }
        
        return actions;
    }

    /**
     * Generate next steps
     * @param {Object} aiAnalysis - AI analysis
     * @param {Object} traditionalAnalysis - Traditional analysis
     * @param {Object} performanceData - Performance data
     * @returns {Array} Next steps
     */
    generateNextSteps(aiAnalysis, traditionalAnalysis, performanceData) {
        const steps = [];
        
        steps.push('Continue regular study sessions to build performance history');
        
        if (traditionalAnalysis.criticalAreas.length > 0) {
            steps.push(`Focus on improving: ${traditionalAnalysis.criticalAreas[0]}`);
        }
        
        if (aiAnalysis && aiAnalysis.dailyTasks) {
            steps.push('Follow AI-suggested daily tasks');
        }
        
        return steps;
    }

    /**
     * Update learning patterns based on analysis
     * @param {Object} performanceData - Performance data
     * @param {Object} analysis - Analysis results
     */
    updateLearningPatterns(performanceData, analysis) {
        try {
            // Update study habit patterns
            if (performanceData.metrics) {
                this.learningPatterns.studyHabits.set('consistency', performanceData.metrics.studyConsistency);
                this.learningPatterns.studyHabits.set('focusQuality', performanceData.metrics.focusQuality);
            }
            
            // Update performance trend patterns
            if (performanceData.trends) {
                this.learningPatterns.performanceTrends.set('accuracy', performanceData.trends.trends?.accuracy);
                this.learningPatterns.performanceTrends.set('studyTime', performanceData.trends.trends?.studyTime);
            }
            
            // Save patterns to storage
            this.saveLearningPatterns();
            
        } catch (error) {
            console.error('Error updating learning patterns:', error);
        }
    }

    /**
     * Load learning patterns from storage
     */
    loadLearningPatterns() {
        try {
            const stored = localStorage.getItem('ai_learning_patterns');
            if (stored) {
                const patterns = JSON.parse(stored);
                
                if (patterns.studyHabits) {
                    this.learningPatterns.studyHabits = new Map(Object.entries(patterns.studyHabits));
                }
                if (patterns.performanceTrends) {
                    this.learningPatterns.performanceTrends = new Map(Object.entries(patterns.performanceTrends));
                }
            }
        } catch (error) {
            console.error('Error loading learning patterns:', error);
        }
    }

    /**
     * Save learning patterns to storage
     */
    saveLearningPatterns() {
        try {
            const patterns = {
                studyHabits: Object.fromEntries(this.learningPatterns.studyHabits),
                performanceTrends: Object.fromEntries(this.learningPatterns.performanceTrends),
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('ai_learning_patterns', JSON.stringify(patterns));
        } catch (error) {
            console.error('Error saving learning patterns:', error);
        }
    }

    /**
     * Setup periodic analysis
     */
    setupPeriodicAnalysis() {
        // Run analysis every 24 hours
        setInterval(() => {
            this.runPeriodicAnalysis();
        }, this.config.analysisInterval);
    }

    /**
     * Run periodic analysis
     */
    async runPeriodicAnalysis() {
        try {
            if (window.profileManager) {
                const profile = window.profileManager.getProfile();
                await this.analyzePerformance(profile);
                console.log('Periodic performance analysis completed');
            }
        } catch (error) {
            console.error('Error in periodic analysis:', error);
        }
    }

    /**
     * Generate error fallback
     * @param {Error} error - Error that occurred
     * @returns {Object} Error fallback analysis
     */
    generateErrorFallback(error) {
        return {
            timestamp: new Date().toISOString(),
            error: true,
            message: 'Analysis failed due to technical error',
            
            overview: {
                performanceScore: 0,
                performanceGrade: 'N/A',
                level: 'Error in analysis',
                efficiency: 'Cannot calculate'
            },
            
            aiInsights: null,
            
            traditionalAnalysis: {
                criticalAreas: ['Technical error occurred'],
                trendAnalysis: 'Analysis failed',
                basicRecommendations: ['Please try again later']
            },
            
            combinedInsights: {
                strengths: [],
                weaknesses: [],
                priorityActions: ['Resolve technical issues'],
                nextSteps: ['Contact support if problem persists']
            },
            
            analysisMethod: 'error_fallback',
            confidence: 0.0,
            generatedAt: new Date().toISOString(),
            errorDetails: error.message
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceAnalyticsAI;
}