/**
 * AI Recommendation Engine
 * Generates personalized study recommendations, daily tasks, and adaptive learning paths
 * using AI insights and performance analytics
 */
class AIRecommendationEngine {
    constructor(aiService, performanceAnalyticsAI) {
        this.aiService = aiService || window.aiServiceManager;
        this.performanceAnalyticsAI = performanceAnalyticsAI || window.performanceAnalyticsAI;
        
        // Configuration
        this.config = {
            maxDailyTasks: 8,
            maxRecommendations: 15,
            taskDifficultyLevels: ['easy', 'medium', 'hard'],
            priorityLevels: ['low', 'medium', 'high', 'critical'],
            recommendationTypes: [
                'study_schedule',
                'topic_focus',
                'practice_strategy',
                'revision_plan',
                'time_management',
                'weakness_improvement',
                'strength_building'
            ],
            adaptiveLearningFactors: {
                accuracy: 0.3,
                consistency: 0.25,
                studyTime: 0.2,
                improvement: 0.15,
                engagement: 0.1
            },
            upscSubjects: [
                'History',
                'Geography', 
                'Polity',
                'Economics',
                'Environment',
                'Science & Technology',
                'Current Affairs',
                'Ethics',
                'Public Administration',
                'Optional Subject'
            ]
        };
        
        // Cache for recommendations and tasks
        this.recommendationCache = new Map();
        this.taskCache = new Map();
        this.lastGenerationTime = null;
        
        // Learning path templates
        this.learningPathTemplates = {
            beginner: {
                duration: '6 months',
                phases: ['foundation', 'practice', 'revision'],
                dailyHours: 4,
                focusAreas: ['basic_concepts', 'ncert_reading', 'current_affairs']
            },
            intermediate: {
                duration: '4 months',
                phases: ['strengthening', 'practice', 'mock_tests'],
                dailyHours: 6,
                focusAreas: ['advanced_concepts', 'answer_writing', 'test_series']
            },
            advanced: {
                duration: '2 months',
                phases: ['intensive_practice', 'revision', 'final_preparation'],
                dailyHours: 8,
                focusAreas: ['weak_areas', 'time_management', 'exam_strategy']
            }
        };
        
        this.initialize();
    }

    /**
     * Initialize the recommendation engine
     */
    async initialize() {
        try {
            // Verify dependencies
            if (!this.performanceAnalyticsAI) {
                console.warn('PerformanceAnalyticsAI not available - using fallback methods');
            }
            
            if (!this.aiService) {
                console.warn('AI Service not available - using rule-based recommendations only');
            }
            
            console.log('AI Recommendation Engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AI Recommendation Engine:', error);
            throw error;
        }
    }

    /**
     * Generate personalized study recommendations based on performance analysis
     * @param {Object} performanceData - User performance data
     * @param {Object} options - Generation options
     * @returns {Promise<Array>} Personalized recommendations
     */
    async generatePersonalizedRecommendations(performanceData, options = {}) {
        try {
            const cacheKey = `recommendations_${JSON.stringify(performanceData)}_${JSON.stringify(options)}`;
            
            // Check cache first
            if (this.recommendationCache.has(cacheKey)) {
                const cached = this.recommendationCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 minutes cache
                    return cached.data;
                }
            }
            
            const recommendations = [];
            
            // Get performance analysis if available
            let analysis = null;
            if (this.performanceAnalyticsAI) {
                analysis = await this.performanceAnalyticsAI.analyzePerformance(performanceData, options);
            }
            
            // Generate rule-based recommendations
            const ruleBasedRecs = this.generateRuleBasedRecommendations(performanceData, analysis);
            recommendations.push(...ruleBasedRecs);
            
            // Generate AI-powered recommendations if available
            if (this.aiService && this.aiService.isReady() && analysis) {
                const aiRecommendations = await this.generateAIRecommendations(analysis, options);
                recommendations.push(...aiRecommendations);
            }
            
            // Personalize based on user profile and learning patterns
            const personalizedRecs = this.personalizeRecommendations(recommendations, performanceData, analysis);
            
            // Prioritize and filter recommendations
            const finalRecommendations = this.prioritizeAndFilterRecommendations(
                personalizedRecs, 
                options.maxRecommendations || this.config.maxRecommendations
            );
            
            // Cache results
            this.recommendationCache.set(cacheKey, {
                data: finalRecommendations,
                timestamp: Date.now()
            });
            
            return finalRecommendations;
            
        } catch (error) {
            console.error('Error generating personalized recommendations:', error);
            return this.generateFallbackRecommendations(performanceData);
        }
    }

    /**
     * Generate daily tasks with priority and difficulty adjustment
     * @param {Object} userProfile - User profile data
     * @param {Object} goals - User goals and preferences
     * @param {Object} options - Task generation options
     * @returns {Promise<Array>} Daily task recommendations
     */
    async generateDailyTasks(userProfile, goals = {}, options = {}) {
        try {
            const cacheKey = `tasks_${JSON.stringify(userProfile)}_${JSON.stringify(goals)}`;
            
            // Check cache first
            if (this.taskCache.has(cacheKey)) {
                const cached = this.taskCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 60 * 60 * 1000) { // 1 hour cache
                    return cached.data;
                }
            }
            
            const tasks = [];
            
            // Get recent performance data
            const recentData = this.getRecentPerformanceData(userProfile, 7); // Last 7 days
            
            // Identify priority areas based on performance and goals
            const priorityAreas = await this.identifyPriorityAreas(recentData, goals);
            
            // Generate tasks for each priority area
            for (const area of priorityAreas) {
                const areaTasks = await this.generateTasksForArea(area, userProfile, goals);
                tasks.push(...areaTasks);
            }
            
            // Add routine maintenance tasks
            const maintenanceTasks = this.generateMaintenanceTasks(recentData, goals);
            tasks.push(...maintenanceTasks);
            
            // Adjust difficulty based on recent performance
            const adjustedTasks = this.adjustTaskDifficulty(tasks, recentData);
            
            // Optimize task schedule and order
            const optimizedTasks = this.optimizeTaskSchedule(adjustedTasks, userProfile, goals);
            
            // Limit to maximum daily tasks
            const finalTasks = optimizedTasks.slice(0, options.maxTasks || this.config.maxDailyTasks);
            
            // Cache results
            this.taskCache.set(cacheKey, {
                data: finalTasks,
                timestamp: Date.now()
            });
            
            return finalTasks;
            
        } catch (error) {
            console.error('Error generating daily tasks:', error);
            return this.generateFallbackTasks(userProfile, goals);
        }
    }

    /**
     * Generate adaptive learning path suggestions using AI insights
     * @param {Object} userProfile - User profile data
     * @param {Object} performanceData - Performance analysis data
     * @param {Object} options - Learning path options
     * @returns {Promise<Object>} Adaptive learning path
     */
    async generateAdaptiveLearningPath(userProfile, performanceData, options = {}) {
        try {
            // Determine user level based on performance
            const userLevel = this.determineUserLevel(performanceData);
            
            // Get base learning path template
            const baseTemplate = this.learningPathTemplates[userLevel] || this.learningPathTemplates.intermediate;
            
            // Customize based on performance analysis
            let customizedPath = this.customizeLearningPath(baseTemplate, performanceData, userProfile);
            
            // Use AI to enhance the learning path if available
            if (this.aiService && this.aiService.isReady()) {
                customizedPath = await this.enhanceLearningPathWithAI(customizedPath, performanceData, options);
            }
            
            // Add specific milestones and checkpoints
            customizedPath.milestones = this.generateLearningMilestones(customizedPath, performanceData);
            
            // Add adaptive adjustments
            customizedPath.adaptiveFeatures = this.generateAdaptiveFeatures(performanceData);
            
            return customizedPath;
            
        } catch (error) {
            console.error('Error generating adaptive learning path:', error);
            return this.generateFallbackLearningPath(userProfile);
        }
    }

    /**
     * Generate rule-based recommendations
     * @param {Object} performanceData - Performance data
     * @param {Object} analysis - Performance analysis
     * @returns {Array} Rule-based recommendations
     */
    generateRuleBasedRecommendations(performanceData, analysis) {
        const recommendations = [];
        
        // Accuracy-based recommendations
        if (performanceData.accuracy < 70) {
            recommendations.push({
                id: 'improve_accuracy',
                type: 'practice_strategy',
                priority: 'high',
                title: 'Improve Answer Accuracy',
                description: 'Focus on understanding concepts before attempting practice questions',
                actions: [
                    'Spend 30 minutes on theory before each practice session',
                    'Review incorrect answers immediately after practice',
                    'Create concept maps for difficult topics'
                ],
                expectedImpact: 'Increase accuracy by 10-15% in 2 weeks',
                timeframe: '2 weeks',
                difficulty: 'medium',
                subjects: this.identifyWeakSubjects(performanceData)
            });
        }
        
        // Consistency-based recommendations
        if (performanceData.consistency < 60) {
            recommendations.push({
                id: 'improve_consistency',
                type: 'study_schedule',
                priority: 'high',
                title: 'Establish Consistent Study Routine',
                description: 'Create and maintain a regular study schedule to improve performance consistency',
                actions: [
                    'Set fixed study times daily',
                    'Use study reminders and alarms',
                    'Track daily study completion',
                    'Maintain study environment consistency'
                ],
                expectedImpact: 'Improve consistency to 75%+ in 3 weeks',
                timeframe: '3 weeks',
                difficulty: 'easy',
                subjects: ['All subjects']
            });
        }
        
        // Time management recommendations
        if (performanceData.studyTime < 4) { // Less than 4 hours daily
            recommendations.push({
                id: 'increase_study_time',
                type: 'time_management',
                priority: 'medium',
                title: 'Optimize Study Time',
                description: 'Increase daily study hours to meet UPSC preparation requirements',
                actions: [
                    'Gradually increase study time by 30 minutes weekly',
                    'Use time-blocking technique for different subjects',
                    'Eliminate time-wasting activities',
                    'Use Pomodoro technique for focused sessions'
                ],
                expectedImpact: 'Reach 6+ hours of quality study time daily',
                timeframe: '4 weeks',
                difficulty: 'medium',
                subjects: ['Time Management']
            });
        }
        
        // Weakness-specific recommendations
        if (analysis && analysis.combinedInsights && analysis.combinedInsights.weaknesses) {
            analysis.combinedInsights.weaknesses.forEach(weakness => {
                recommendations.push({
                    id: `address_${weakness.area.toLowerCase().replace(/\s+/g, '_')}`,
                    type: 'weakness_improvement',
                    priority: weakness.severity === 'high' ? 'critical' : 'medium',
                    title: `Improve ${weakness.area}`,
                    description: weakness.description,
                    actions: [
                        `Dedicate 1 hour daily to ${weakness.area}`,
                        'Take targeted practice tests',
                        'Review fundamental concepts',
                        'Seek additional resources if needed'
                    ],
                    expectedImpact: weakness.suggestion || 'Significant improvement in weak area',
                    timeframe: '2-3 weeks',
                    difficulty: 'medium',
                    subjects: [weakness.area]
                });
            });
        }
        
        return recommendations;
    }

    /**
     * Generate AI-powered recommendations
     * @param {Object} analysis - Performance analysis data
     * @param {Object} options - Generation options
     * @returns {Promise<Array>} AI-generated recommendations
     */
    async generateAIRecommendations(analysis, options = {}) {
        try {
            // Set AI mode for recommendation generation
            this.aiService.setMode('general');
            
            // Build recommendation prompt
            const prompt = this.buildRecommendationPrompt(analysis, options);
            
            // Get AI response
            const response = await this.aiService.sendMessage(prompt, {
                context: {
                    type: 'recommendation_generation',
                    data: analysis
                },
                autoSave: false
            });
            
            // Parse AI recommendations
            return this.parseAIRecommendations(response.content);
            
        } catch (error) {
            console.error('Error generating AI recommendations:', error);
            return [];
        }
    }

    /**
     * Build recommendation prompt for AI
     * @param {Object} analysis - Performance analysis
     * @param {Object} options - Options
     * @returns {string} Recommendation prompt
     */
    buildRecommendationPrompt(analysis, options) {
        const { overview, combinedInsights } = analysis;
        
        return `Based on this UPSC student's performance analysis, generate specific, actionable study recommendations:

PERFORMANCE OVERVIEW:
- Performance Score: ${overview.performanceScore}/100
- Performance Level: ${overview.level}
- Study Efficiency: ${overview.efficiency}

IDENTIFIED STRENGTHS:
${combinedInsights.strengths.map(s => `- ${s.area}: ${s.description}`).join('\n') || 'None identified'}

IDENTIFIED WEAKNESSES:
${combinedInsights.weaknesses.map(w => `- ${w.area}: ${w.description} (Severity: ${w.severity})`).join('\n') || 'None identified'}

PRIORITY ACTIONS:
${combinedInsights.priorityActions.join('\n- ') || 'None specified'}

Please provide 3-5 specific, actionable recommendations that include:
1. Clear title and description
2. Specific action steps
3. Expected timeline and impact
4. Priority level (high/medium/low)
5. Relevant UPSC subjects

Focus on recommendations that will have the highest impact on UPSC exam performance.`;
    }

    /**
     * Parse AI recommendations response
     * @param {string} responseContent - AI response content
     * @returns {Array} Parsed recommendations
     */
    parseAIRecommendations(responseContent) {
        try {
            const recommendations = [];
            
            // Split response into recommendation blocks
            const blocks = responseContent.split(/\d+\./);
            
            blocks.forEach((block, index) => {
                if (index === 0 || !block.trim()) return;
                
                const lines = block.trim().split('\n');
                const title = lines[0]?.replace(/^\*\*|\*\*$/g, '').trim();
                
                if (title) {
                    recommendations.push({
                        id: `ai_rec_${Date.now()}_${index}`,
                        type: 'ai_generated',
                        priority: this.extractPriority(block) || 'medium',
                        title: title,
                        description: this.extractDescription(block),
                        actions: this.extractActions(block),
                        expectedImpact: this.extractImpact(block),
                        timeframe: this.extractTimeframe(block) || '2-4 weeks',
                        difficulty: 'medium',
                        subjects: this.extractSubjects(block),
                        source: 'ai'
                    });
                }
            });
            
            return recommendations;
            
        } catch (error) {
            console.error('Error parsing AI recommendations:', error);
            return [];
        }
    }

    /**
     * Personalize recommendations based on user profile and learning patterns
     * @param {Array} recommendations - Base recommendations
     * @param {Object} performanceData - Performance data
     * @param {Object} analysis - Performance analysis
     * @returns {Array} Personalized recommendations
     */
    personalizeRecommendations(recommendations, performanceData, analysis) {
        return recommendations.map(rec => {
            const personalized = { ...rec };
            
            // Adjust priority based on user's specific weaknesses
            if (analysis && analysis.combinedInsights && analysis.combinedInsights.weaknesses) {
                const relatedWeakness = analysis.combinedInsights.weaknesses.find(w => 
                    rec.subjects.some(subject => w.area.toLowerCase().includes(subject.toLowerCase()))
                );
                
                if (relatedWeakness && relatedWeakness.severity === 'high') {
                    personalized.priority = 'critical';
                }
            }
            
            // Adjust difficulty based on user's current performance level
            if (performanceData.accuracy > 80) {
                personalized.difficulty = 'hard';
            } else if (performanceData.accuracy < 50) {
                personalized.difficulty = 'easy';
            }
            
            // Add personalization metadata
            personalized.personalized = true;
            personalized.confidence = 0.85;
            personalized.adaptedFor = {
                accuracy: performanceData.accuracy,
                consistency: performanceData.consistency,
                studyTime: performanceData.studyTime
            };
            
            return personalized;
        });
    }

    /**
     * Prioritize and filter recommendations
     * @param {Array} recommendations - Recommendations to prioritize
     * @param {number} maxRecommendations - Maximum number to return
     * @returns {Array} Prioritized recommendations
     */
    prioritizeAndFilterRecommendations(recommendations, maxRecommendations) {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        
        return recommendations
            .sort((a, b) => {
                // Primary sort by priority
                const priorityDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
                if (priorityDiff !== 0) return priorityDiff;
                
                // Secondary sort by confidence (if available)
                const aConfidence = a.confidence || 0.5;
                const bConfidence = b.confidence || 0.5;
                return bConfidence - aConfidence;
            })
            .slice(0, maxRecommendations);
    }

    /**
     * Get recent performance data
     * @param {Object} userProfile - User profile
     * @param {number} days - Number of days to look back
     * @returns {Object} Recent performance data
     */
    getRecentPerformanceData(userProfile, days = 7) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Filter recent sessions
        const recentSessions = (userProfile.sessionHistory || []).filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= startDate && sessionDate <= endDate;
        });
        
        // Calculate recent metrics
        const totalSessions = recentSessions.length;
        const totalTime = recentSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const averageAccuracy = totalSessions > 0 ? 
            recentSessions.reduce((sum, session) => sum + (session.accuracy || 0), 0) / totalSessions : 0;
        
        return {
            sessions: recentSessions,
            totalSessions,
            totalTime,
            averageAccuracy,
            dailyAverage: totalTime / days,
            consistency: this.calculateConsistency(recentSessions, days)
        };
    }

    /**
     * Identify priority areas based on performance and goals
     * @param {Object} recentData - Recent performance data
     * @param {Object} goals - User goals
     * @returns {Promise<Array>} Priority areas
     */
    async identifyPriorityAreas(recentData, goals) {
        const priorityAreas = [];
        
        // Accuracy-based priorities
        if (recentData.averageAccuracy < 70) {
            priorityAreas.push({
                area: 'accuracy_improvement',
                priority: 'high',
                reason: 'Below target accuracy',
                subjects: this.identifyWeakSubjects(recentData)
            });
        }
        
        // Consistency-based priorities
        if (recentData.consistency < 60) {
            priorityAreas.push({
                area: 'consistency_building',
                priority: 'medium',
                reason: 'Irregular study pattern',
                subjects: ['Study Habits']
            });
        }
        
        // Time-based priorities
        if (recentData.dailyAverage < 4) {
            priorityAreas.push({
                area: 'time_optimization',
                priority: 'medium',
                reason: 'Insufficient daily study time',
                subjects: ['Time Management']
            });
        }
        
        // Goal-based priorities
        if (goals.targetSubjects && goals.targetSubjects.length > 0) {
            goals.targetSubjects.forEach(subject => {
                priorityAreas.push({
                    area: 'subject_focus',
                    priority: 'medium',
                    reason: 'User-specified target subject',
                    subjects: [subject]
                });
            });
        }
        
        return priorityAreas;
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
        
        switch (area.area) {
            case 'accuracy_improvement':
                tasks.push({
                    id: `accuracy_${Date.now()}`,
                    title: 'Concept Review Session',
                    description: 'Review fundamental concepts before practice',
                    type: 'study',
                    priority: area.priority,
                    difficulty: 'medium',
                    estimatedTime: 45,
                    subjects: area.subjects,
                    actions: [
                        'Read theory for 30 minutes',
                        'Solve 10 practice questions',
                        'Review incorrect answers'
                    ]
                });
                break;
                
            case 'consistency_building':
                tasks.push({
                    id: `consistency_${Date.now()}`,
                    title: 'Daily Study Routine',
                    description: 'Maintain consistent daily study schedule',
                    type: 'habit',
                    priority: area.priority,
                    difficulty: 'easy',
                    estimatedTime: 30,
                    subjects: area.subjects,
                    actions: [
                        'Set study alarm',
                        'Prepare study materials',
                        'Complete minimum 30-minute session'
                    ]
                });
                break;
                
            case 'time_optimization':
                tasks.push({
                    id: `time_${Date.now()}`,
                    title: 'Extended Study Session',
                    description: 'Increase daily study time gradually',
                    type: 'practice',
                    priority: area.priority,
                    difficulty: 'medium',
                    estimatedTime: 90,
                    subjects: area.subjects,
                    actions: [
                        'Plan 90-minute focused session',
                        'Use Pomodoro technique',
                        'Track time and productivity'
                    ]
                });
                break;
                
            case 'subject_focus':
                area.subjects.forEach(subject => {
                    tasks.push({
                        id: `subject_${subject}_${Date.now()}`,
                        title: `${subject} Focused Practice`,
                        description: `Dedicated practice session for ${subject}`,
                        type: 'practice',
                        priority: area.priority,
                        difficulty: 'medium',
                        estimatedTime: 60,
                        subjects: [subject],
                        actions: [
                            `Study ${subject} theory for 30 minutes`,
                            `Solve ${subject} practice questions`,
                            'Make notes of key points'
                        ]
                    });
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
        const tasks = [];
        
        // Daily current affairs
        tasks.push({
            id: `current_affairs_${Date.now()}`,
            title: 'Current Affairs Update',
            description: 'Stay updated with daily current affairs',
            type: 'maintenance',
            priority: 'medium',
            difficulty: 'easy',
            estimatedTime: 30,
            subjects: ['Current Affairs'],
            actions: [
                'Read newspaper headlines',
                'Review important news',
                'Make notes of UPSC-relevant events'
            ]
        });
        
        // Revision task
        if (recentData.totalSessions > 5) {
            tasks.push({
                id: `revision_${Date.now()}`,
                title: 'Quick Revision',
                description: 'Review previously studied topics',
                type: 'revision',
                priority: 'low',
                difficulty: 'easy',
                estimatedTime: 20,
                subjects: ['All subjects'],
                actions: [
                    'Review notes from last week',
                    'Test recall of key concepts',
                    'Identify topics needing more attention'
                ]
            });
        }
        
        return tasks;
    }

    /**
     * Adjust task difficulty based on recent performance
     * @param {Array} tasks - Tasks to adjust
     * @param {Object} recentData - Recent performance data
     * @returns {Array} Adjusted tasks
     */
    adjustTaskDifficulty(tasks, recentData) {
        return tasks.map(task => {
            const adjusted = { ...task };
            
            // Adjust based on recent accuracy
            if (recentData.averageAccuracy > 80) {
                adjusted.difficulty = 'hard';
                adjusted.estimatedTime = Math.floor(adjusted.estimatedTime * 1.2);
            } else if (recentData.averageAccuracy < 50) {
                adjusted.difficulty = 'easy';
                adjusted.estimatedTime = Math.floor(adjusted.estimatedTime * 0.8);
            }
            
            // Adjust based on consistency
            if (recentData.consistency < 50) {
                adjusted.priority = adjusted.priority === 'low' ? 'medium' : adjusted.priority;
            }
            
            return adjusted;
        });
    }

    /**
     * Optimize task schedule and order
     * @param {Array} tasks - Tasks to optimize
     * @param {Object} userProfile - User profile
     * @param {Object} goals - User goals
     * @returns {Array} Optimized tasks
     */
    optimizeTaskSchedule(tasks, userProfile, goals) {
        // Sort by priority first, then by estimated time
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        
        return tasks.sort((a, b) => {
            // Primary sort by priority
            const priorityDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
            if (priorityDiff !== 0) return priorityDiff;
            
            // Secondary sort by estimated time (shorter tasks first for quick wins)
            return a.estimatedTime - b.estimatedTime;
        });
    }

    /**
     * Generate fallback recommendations
     * @param {Object} performanceData - Performance data
     * @returns {Array} Fallback recommendations
     */
    generateFallbackRecommendations(performanceData) {
        return [
            {
                id: 'fallback_consistency',
                type: 'study_schedule',
                priority: 'high',
                title: 'Maintain Regular Study Schedule',
                description: 'Consistency is key to UPSC preparation success',
                actions: [
                    'Study for at least 4 hours daily',
                    'Maintain fixed study timings',
                    'Cover all subjects systematically'
                ],
                expectedImpact: 'Improved overall performance and retention',
                timeframe: 'Ongoing',
                difficulty: 'medium',
                subjects: ['All subjects']
            },
            {
                id: 'fallback_practice',
                type: 'practice_strategy',
                priority: 'medium',
                title: 'Regular Practice and Assessment',
                description: 'Regular practice tests help track progress and identify gaps',
                actions: [
                    'Take weekly mock tests',
                    'Solve daily practice questions',
                    'Analyze performance regularly'
                ],
                expectedImpact: 'Better exam preparedness and time management',
                timeframe: 'Weekly',
                difficulty: 'medium',
                subjects: ['All subjects']
            }
        ];
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
                id: `fallback_study_${Date.now()}`,
                title: 'General Study Session',
                description: 'Complete a focused study session',
                type: 'study',
                priority: 'medium',
                difficulty: 'medium',
                estimatedTime: 60,
                subjects: ['General Studies'],
                actions: [
                    'Choose a subject to study',
                    'Read theory for 40 minutes',
                    'Solve practice questions for 20 minutes'
                ]
            },
            {
                id: `fallback_current_affairs_${Date.now()}`,
                title: 'Current Affairs Review',
                description: 'Stay updated with current events',
                type: 'maintenance',
                priority: 'medium',
                difficulty: 'easy',
                estimatedTime: 30,
                subjects: ['Current Affairs'],
                actions: [
                    'Read daily newspaper',
                    'Note important events',
                    'Connect events to UPSC syllabus'
                ]
            }
        ];
    }

    // Helper methods for parsing AI responses and data processing
    
    extractPriority(text) {
        const priorityMatch = text.match(/priority[:\s]*(high|medium|low|critical)/i);
        return priorityMatch ? priorityMatch[1].toLowerCase() : null;
    }
    
    extractDescription(text) {
        const lines = text.split('\n');
        return lines.find(line => line.includes('Description:') || line.includes('description:'))?.split(':')[1]?.trim() || 
               lines[1]?.trim() || 'No description available';
    }
    
    extractActions(text) {
        const actionLines = text.split('\n').filter(line => 
            line.trim().startsWith('-') || line.trim().startsWith('•') || line.includes('Action:')
        );
        return actionLines.map(line => line.replace(/^[-•]\s*/, '').trim()).filter(action => action.length > 0);
    }
    
    extractImpact(text) {
        const impactMatch = text.match(/impact[:\s]*([^.\n]+)/i);
        return impactMatch ? impactMatch[1].trim() : 'Positive impact on performance';
    }
    
    extractTimeframe(text) {
        const timeMatch = text.match(/(\d+\s*(days?|weeks?|months?))/i);
        return timeMatch ? timeMatch[1] : null;
    }
    
    extractSubjects(text) {
        const subjects = [];
        this.config.upscSubjects.forEach(subject => {
            if (text.toLowerCase().includes(subject.toLowerCase())) {
                subjects.push(subject);
            }
        });
        return subjects.length > 0 ? subjects : ['General Studies'];
    }
    
    identifyWeakSubjects(performanceData) {
        // This would analyze subject-wise performance
        // For now, return general subjects
        return ['General Studies', 'Current Affairs'];
    }
    
    calculateConsistency(sessions, days) {
        if (sessions.length === 0) return 0;
        const studyDays = new Set(sessions.map(s => new Date(s.date).toDateString())).size;
        return (studyDays / days) * 100;
    }
    
    determineUserLevel(performanceData) {
        const score = performanceData.overview?.performanceScore || 0;
        if (score >= 80) return 'advanced';
        if (score >= 60) return 'intermediate';
        return 'beginner';
    }
    
    customizeLearningPath(template, performanceData, userProfile) {
        const customized = { ...template };
        
        // Adjust based on performance level
        const level = this.determineUserLevel(performanceData);
        if (level === 'beginner') {
            customized.dailyHours = Math.max(4, customized.dailyHours - 2);
        } else if (level === 'advanced') {
            customized.dailyHours = Math.min(10, customized.dailyHours + 2);
        }
        
        return customized;
    }
    
    async enhanceLearningPathWithAI(path, performanceData, options) {
        // This would use AI to enhance the learning path
        // For now, return the path as-is
        return path;
    }
    
    generateLearningMilestones(path, performanceData) {
        return [
            { week: 2, target: 'Complete foundation phase', metric: 'accuracy > 60%' },
            { week: 4, target: 'Improve consistency', metric: 'daily study > 80%' },
            { week: 8, target: 'Master weak areas', metric: 'overall score > 70%' }
        ];
    }
    
    generateAdaptiveFeatures(performanceData) {
        return {
            difficultyAdjustment: true,
            paceModification: true,
            focusAreaShifting: true,
            realTimeRecommendations: true
        };
    }
    
    generateFallbackLearningPath(userProfile) {
        return {
            duration: '6 months',
            phases: ['foundation', 'practice', 'revision'],
            dailyHours: 5,
            focusAreas: ['basic_concepts', 'practice_questions', 'current_affairs'],
            milestones: [
                { week: 4, target: 'Complete syllabus overview', metric: 'coverage > 50%' },
                { week: 8, target: 'Regular practice routine', metric: 'consistency > 70%' },
                { week: 12, target: 'Mock test performance', metric: 'score > 60%' }
            ],
            adaptiveFeatures: {
                difficultyAdjustment: false,
                paceModification: false,
                focusAreaShifting: false,
                realTimeRecommendations: false
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIRecommendationEngine;
}

// Make available globally
window.AIRecommendationEngine = AIRecommendationEngine;