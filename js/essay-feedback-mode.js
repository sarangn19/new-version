/**
 * Essay Feedback Mode
 * Specialized handler for essay evaluation and improvement suggestions
 */

class EssayFeedbackMode {
    constructor(assistantModeManager) {
        this.modeManager = assistantModeManager;
        this.essayTemplates = this.initializeEssayTemplates();
        this.evaluationCriteria = this.initializeEvaluationCriteria();
        this.scoringRubric = this.initializeScoringRubric();
    }

    /**
     * Initialize essay-specific prompt templates
     */
    initializeEssayTemplates() {
        return {
            essayEvaluation: `Evaluate this UPSC Mains essay comprehensively:

**Topic:** {topic}
**Word Count:** {wordCount}
**Time Taken:** {timeSpent}

**Essay Content:**
{essayContent}

Please provide detailed feedback with the following structure:

1. **📊 OVERALL ASSESSMENT**
   - Content quality and relevance
   - Structure and organization
   - Language and expression
   - Estimated score (out of 250)

2. **💪 STRENGTHS**
   - What the candidate did well
   - Strong arguments and examples
   - Good use of language/structure

3. **🎯 AREAS FOR IMPROVEMENT**
   - Content gaps and weaknesses
   - Structural issues
   - Language and expression improvements
   - Missing elements

4. **📚 CONTENT ANALYSIS**
   - Depth of understanding
   - Use of examples and case studies
   - Current affairs integration
   - Balanced perspective

5. **✍️ WRITING QUALITY**
   - Clarity and coherence
   - Grammar and vocabulary
   - Flow and transitions
   - Conclusion effectiveness

6. **🚀 SPECIFIC RECOMMENDATIONS**
   - Immediate improvements
   - Study areas to focus on
   - Practice suggestions
   - Resources for improvement

Format your response with clear headings and actionable suggestions.`,

            topicAnalysis: `Analyze this UPSC essay topic and provide guidance:

**Topic:** {topic}
**Paper:** {paper}
**Expected Approach:** {approach}

Please provide:

1. **🎯 TOPIC BREAKDOWN**
   - Key themes and dimensions
   - What the examiner expects
   - Scope and boundaries

2. **📋 SUGGESTED STRUCTURE**
   - Introduction approach
   - Main body organization
   - Conclusion strategy

3. **💡 KEY POINTS TO COVER**
   - Essential arguments
   - Examples and case studies
   - Current affairs connections

4. **⚠️ COMMON PITFALLS**
   - What to avoid
   - Typical mistakes
   - Time management tips

5. **📚 PREPARATION STRATEGY**
   - Reading materials
   - Practice approach
   - Related topics to study

Help the candidate understand how to approach this topic effectively.`,

            improvementPlan: `Create a personalized improvement plan based on essay performance:

**Current Performance Level:** {currentLevel}
**Target Score:** {targetScore}
**Weak Areas:** {weakAreas}
**Time Available:** {timeframe}

Please provide:

1. **📈 PERFORMANCE GAP ANALYSIS**
   - Current vs target analysis
   - Priority improvement areas
   - Realistic timeline

2. **📚 STUDY PLAN**
   - Daily/weekly schedule
   - Topic-wise preparation
   - Resource allocation

3. **✍️ PRACTICE STRATEGY**
   - Essay writing frequency
   - Topic selection approach
   - Self-evaluation methods

4. **📖 READING RECOMMENDATIONS**
   - Essential books and sources
   - Current affairs sources
   - Example essays to study

5. **🎯 MILESTONE TRACKING**
   - Weekly targets
   - Progress indicators
   - Adjustment strategies

Create a practical, achievable improvement roadmap.`
        };
    }

    /**
     * Initialize evaluation criteria for essays
     */
    initializeEvaluationCriteria() {
        return {
            content: {
                weight: 40,
                aspects: [
                    'relevance_to_topic',
                    'depth_of_understanding',
                    'use_of_examples',
                    'current_affairs_integration',
                    'balanced_perspective',
                    'originality_of_thought'
                ]
            },
            structure: {
                weight: 25,
                aspects: [
                    'introduction_quality',
                    'logical_flow',
                    'paragraph_organization',
                    'transitions',
                    'conclusion_effectiveness'
                ]
            },
            language: {
                weight: 20,
                aspects: [
                    'clarity_of_expression',
                    'grammar_accuracy',
                    'vocabulary_usage',
                    'sentence_structure',
                    'coherence'
                ]
            },
            presentation: {
                weight: 15,
                aspects: [
                    'word_count_adherence',
                    'time_management',
                    'handwriting_clarity',
                    'overall_presentation'
                ]
            }
        };
    }

    /**
     * Initialize scoring rubric
     */
    initializeScoringRubric() {
        return {
            excellent: { range: [200, 250], description: 'Outstanding essay with exceptional content and presentation' },
            good: { range: [150, 199], description: 'Well-written essay with good content and structure' },
            average: { range: [100, 149], description: 'Adequate essay meeting basic requirements' },
            belowAverage: { range: [50, 99], description: 'Essay with significant gaps and improvements needed' },
            poor: { range: [0, 49], description: 'Essay requiring major improvements across all areas' }
        };
    }

    /**
     * Evaluate essay with comprehensive feedback
     * @param {Object} essayData - Essay data including content and metadata
     * @returns {Object} Detailed evaluation and feedback
     */
    async evaluateEssay(essayData) {
        try {
            // Validate essay data
            const validation = this.validateEssayData(essayData);
            if (!validation.isValid) {
                throw new Error(`Invalid essay data: ${validation.errors.join(', ')}`);
            }

            // Switch to essay mode if not already
            if (this.modeManager.currentMode !== 'essay') {
                this.modeManager.setMode('essay', {
                    analysisType: 'essay_evaluation',
                    essayId: essayData.id || Date.now(),
                    topic: essayData.topic,
                    wordCount: essayData.wordCount
                });
            }

            // Generate evaluation prompt
            const prompt = this.generateEssayPrompt(essayData);
            
            // Get AI response through mode manager
            const aiResponse = await this.modeManager.getAIResponse(prompt);
            
            // Structure the response
            const structuredFeedback = this.structureEssayFeedback(aiResponse, essayData);
            
            return {
                success: true,
                feedback: structuredFeedback,
                metadata: {
                    essayId: essayData.id,
                    evaluatedAt: new Date().toISOString(),
                    mode: 'essay',
                    processingTime: Date.now() - (essayData.startTime || Date.now())
                }
            };

        } catch (error) {
            console.error('Essay evaluation failed:', error);
            return {
                success: false,
                error: error.message,
                fallbackFeedback: this.generateFallbackFeedback(essayData)
            };
        }
    }

    /**
     * Generate essay evaluation prompt
     * @param {Object} essayData - Essay data
     * @returns {string} Formatted prompt
     */
    generateEssayPrompt(essayData) {
        const template = this.essayTemplates.essayEvaluation;
        
        return template
            .replace('{topic}', essayData.topic)
            .replace('{wordCount}', essayData.wordCount || 'Not specified')
            .replace('{timeSpent}', essayData.timeSpent || 'Not specified')
            .replace('{essayContent}', essayData.content);
    }

    /**
     * Structure essay feedback with proper formatting
     * @param {string} aiResponse - Raw AI response
     * @param {Object} essayData - Original essay data
     * @returns {Object} Structured feedback
     */
    structureEssayFeedback(aiResponse, essayData) {
        const sections = this.parseEssayResponseSections(aiResponse);
        
        return {
            essaySummary: {
                topic: essayData.topic,
                wordCount: essayData.wordCount || 0,
                timeSpent: essayData.timeSpent || 'Not specified',
                submittedAt: essayData.submittedAt || new Date().toISOString()
            },
            overallAssessment: {
                content: sections.assessment || '',
                estimatedScore: this.extractScore(sections.assessment),
                scoreCategory: this.categorizeScore(this.extractScore(sections.assessment)),
                confidence: this.assessFeedbackQuality(sections.assessment)
            },
            strengths: {
                content: sections.strengths || '',
                keyStrengths: this.extractKeyPoints(sections.strengths),
                reinforcementAreas: this.identifyReinforcementAreas(sections.strengths)
            },
            improvements: {
                content: sections.improvements || '',
                priorityAreas: this.extractImprovementPriorities(sections.improvements),
                actionableSteps: this.extractActionableSteps(sections.improvements)
            },
            contentAnalysis: {
                content: sections.contentAnalysis || '',
                depthAssessment: this.assessContentDepth(sections.contentAnalysis),
                exampleUsage: this.assessExampleUsage(sections.contentAnalysis),
                currentAffairsIntegration: this.assessCurrentAffairs(sections.contentAnalysis)
            },
            writingQuality: {
                content: sections.writingQuality || '',
                languageScore: this.assessLanguageQuality(sections.writingQuality),
                structureScore: this.assessStructureQuality(sections.writingQuality),
                clarityScore: this.assessClarityScore(sections.writingQuality)
            },
            recommendations: {
                immediate: this.generateImmediateRecommendations(essayData, sections),
                shortTerm: this.generateShortTermPlan(essayData, sections),
                longTerm: this.generateLongTermStrategy(essayData, sections),
                resources: this.recommendResources(essayData, sections)
            }
        };
    }

    /**
     * Parse AI response into structured sections
     * @param {string} response - AI response text
     * @returns {Object} Parsed sections
     */
    parseEssayResponseSections(response) {
        const sections = {};
        const lines = response.split('\n');
        let currentSection = null;
        let currentContent = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.includes('OVERALL ASSESSMENT') || trimmedLine.includes('📊')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'assessment';
                currentContent = [];
            } else if (trimmedLine.includes('STRENGTHS') || trimmedLine.includes('💪')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'strengths';
                currentContent = [];
            } else if (trimmedLine.includes('IMPROVEMENT') || trimmedLine.includes('🎯')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'improvements';
                currentContent = [];
            } else if (trimmedLine.includes('CONTENT ANALYSIS') || trimmedLine.includes('📚')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'contentAnalysis';
                currentContent = [];
            } else if (trimmedLine.includes('WRITING QUALITY') || trimmedLine.includes('✍️')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'writingQuality';
                currentContent = [];
            } else if (trimmedLine.includes('RECOMMENDATIONS') || trimmedLine.includes('🚀')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'recommendations';
                currentContent = [];
            } else if (currentSection && trimmedLine) {
                currentContent.push(line);
            }
        });

        // Add the last section
        if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n');
        }

        return sections;
    }

    /**
     * Validate essay data structure
     * @param {Object} essayData - Essay data to validate
     * @returns {Object} Validation result
     */
    validateEssayData(essayData) {
        const errors = [];
        
        if (!essayData.topic || typeof essayData.topic !== 'string') {
            errors.push('Essay topic is required');
        }
        
        if (!essayData.content || typeof essayData.content !== 'string') {
            errors.push('Essay content is required');
        }
        
        if (essayData.content && essayData.content.length < 50) {
            errors.push('Essay content too short for meaningful evaluation');
        }
        
        if (essayData.wordCount && (essayData.wordCount < 10 || essayData.wordCount > 2000)) {
            errors.push('Word count should be between 10 and 2000 words');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Extract score from assessment text
     * @param {string} text - Assessment text
     * @returns {number} Extracted score or null
     */
    extractScore(text) {
        if (!text) return null;
        
        const scorePatterns = [
            /(\d+)\s*\/\s*250/,
            /(\d+)\s*out\s*of\s*250/i,
            /score[:\s]*(\d+)/i,
            /(\d+)\s*marks?/i
        ];
        
        for (const pattern of scorePatterns) {
            const match = text.match(pattern);
            if (match) {
                const score = parseInt(match[1]);
                if (score >= 0 && score <= 250) {
                    return score;
                }
            }
        }
        
        return null;
    }

    /**
     * Categorize score based on rubric
     * @param {number} score - Numeric score
     * @returns {string} Score category
     */
    categorizeScore(score) {
        if (score === null) return 'unscored';
        
        for (const [category, rubric] of Object.entries(this.scoringRubric)) {
            if (score >= rubric.range[0] && score <= rubric.range[1]) {
                return category;
            }
        }
        
        return 'unscored';
    }

    /**
     * Extract key points from text
     * @param {string} text - Text to analyze
     * @returns {Array} Key points
     */
    extractKeyPoints(text) {
        if (!text) return [];
        
        const keyPoints = [];
        const lines = text.split('\n');
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.match(/^[\d\-\*\•]/)) {
                keyPoints.push(trimmed.replace(/^[\d\-\*\•\.\)\s]+/, ''));
            }
        });
        
        return keyPoints.filter(point => point.length > 15);
    }

    /**
     * Extract improvement priorities
     * @param {string} text - Improvement text
     * @returns {Array} Priority areas
     */
    extractImprovementPriorities(text) {
        const priorities = [];
        const priorityPatterns = [
            /priority[:\s]*([^.]+)/i,
            /urgent[:\s]*([^.]+)/i,
            /immediate[:\s]*([^.]+)/i,
            /focus\s+on[:\s]*([^.]+)/i
        ];
        
        priorityPatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                priorities.push(match[1].trim());
            }
        });
        
        return priorities;
    }

    /**
     * Extract actionable steps
     * @param {string} text - Improvement text
     * @returns {Array} Actionable steps
     */
    extractActionableSteps(text) {
        const steps = [];
        const lines = text.split('\n');
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.match(/^[\d\-\*\•]/) && 
                (trimmed.includes('should') || trimmed.includes('need') || 
                 trimmed.includes('practice') || trimmed.includes('study'))) {
                steps.push(trimmed.replace(/^[\d\-\*\•\.\)\s]+/, ''));
            }
        });
        
        return steps;
    }

    /**
     * Assess content depth
     * @param {string} text - Content analysis text
     * @returns {Object} Depth assessment
     */
    assessContentDepth(text) {
        if (!text) return { score: 0, level: 'insufficient' };
        
        let score = 0;
        const indicators = {
            'deep understanding': 0.3,
            'comprehensive': 0.2,
            'detailed': 0.2,
            'thorough': 0.2,
            'superficial': -0.3,
            'shallow': -0.2,
            'basic': -0.1
        };
        
        Object.entries(indicators).forEach(([indicator, weight]) => {
            if (text.toLowerCase().includes(indicator)) {
                score += weight;
            }
        });
        
        const level = score > 0.3 ? 'excellent' : 
                     score > 0.1 ? 'good' : 
                     score > -0.1 ? 'average' : 'insufficient';
        
        return { score: Math.max(0, Math.min(1, score + 0.5)), level };
    }

    /**
     * Assess example usage
     * @param {string} text - Content analysis text
     * @returns {Object} Example usage assessment
     */
    assessExampleUsage(text) {
        if (!text) return { score: 0, quality: 'poor' };
        
        const exampleIndicators = [
            'examples',
            'case study',
            'illustration',
            'instance',
            'for example'
        ];
        
        let count = 0;
        exampleIndicators.forEach(indicator => {
            const matches = (text.toLowerCase().match(new RegExp(indicator, 'g')) || []).length;
            count += matches;
        });
        
        const quality = count >= 3 ? 'excellent' : 
                       count >= 2 ? 'good' : 
                       count >= 1 ? 'average' : 'poor';
        
        return { score: Math.min(1, count / 3), quality };
    }

    /**
     * Assess current affairs integration
     * @param {string} text - Content analysis text
     * @returns {Object} Current affairs assessment
     */
    assessCurrentAffairs(text) {
        if (!text) return { score: 0, integration: 'none' };
        
        const currentAffairsIndicators = [
            'current',
            'recent',
            'latest',
            'contemporary',
            '2024',
            '2023',
            'news'
        ];
        
        let count = 0;
        currentAffairsIndicators.forEach(indicator => {
            if (text.toLowerCase().includes(indicator)) {
                count++;
            }
        });
        
        const integration = count >= 3 ? 'excellent' : 
                           count >= 2 ? 'good' : 
                           count >= 1 ? 'basic' : 'none';
        
        return { score: Math.min(1, count / 3), integration };
    }

    /**
     * Assess language quality
     * @param {string} text - Writing quality text
     * @returns {number} Language quality score
     */
    assessLanguageQuality(text) {
        if (!text) return 0;
        
        let score = 0.5; // Base score
        
        const positiveIndicators = ['clear', 'articulate', 'fluent', 'precise'];
        const negativeIndicators = ['unclear', 'confusing', 'grammatical errors', 'poor'];
        
        positiveIndicators.forEach(indicator => {
            if (text.toLowerCase().includes(indicator)) score += 0.1;
        });
        
        negativeIndicators.forEach(indicator => {
            if (text.toLowerCase().includes(indicator)) score -= 0.1;
        });
        
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Assess structure quality
     * @param {string} text - Writing quality text
     * @returns {number} Structure quality score
     */
    assessStructureQuality(text) {
        if (!text) return 0;
        
        let score = 0.5; // Base score
        
        const structureIndicators = ['organized', 'logical', 'coherent', 'flow'];
        const structureProblems = ['disorganized', 'jumbled', 'incoherent', 'confusing'];
        
        structureIndicators.forEach(indicator => {
            if (text.toLowerCase().includes(indicator)) score += 0.1;
        });
        
        structureProblems.forEach(problem => {
            if (text.toLowerCase().includes(problem)) score -= 0.1;
        });
        
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Assess clarity score
     * @param {string} text - Writing quality text
     * @returns {number} Clarity score
     */
    assessClarityScore(text) {
        if (!text) return 0;
        
        let score = 0.5; // Base score
        
        if (text.toLowerCase().includes('clear')) score += 0.2;
        if (text.toLowerCase().includes('understandable')) score += 0.1;
        if (text.toLowerCase().includes('readable')) score += 0.1;
        if (text.toLowerCase().includes('unclear')) score -= 0.2;
        if (text.toLowerCase().includes('confusing')) score -= 0.1;
        
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Generate immediate recommendations
     * @param {Object} essayData - Essay data
     * @param {Object} sections - Parsed sections
     * @returns {Array} Immediate recommendations
     */
    generateImmediateRecommendations(essayData, sections) {
        const recommendations = [];
        
        recommendations.push('Review the detailed feedback carefully');
        recommendations.push('Identify the top 3 improvement areas');
        
        if (sections.improvements) {
            recommendations.push('Focus on the priority improvements mentioned');
        }
        
        recommendations.push('Practice writing on similar topics');
        
        return recommendations;
    }

    /**
     * Generate short-term plan
     * @param {Object} essayData - Essay data
     * @param {Object} sections - Parsed sections
     * @returns {Array} Short-term plan items
     */
    generateShortTermPlan(essayData, sections) {
        const plan = [];
        
        plan.push('Write 2-3 essays per week on similar topics');
        plan.push('Focus on improving structure and organization');
        plan.push('Build vocabulary and improve language skills');
        plan.push('Practice time management (45 minutes per essay)');
        
        return plan;
    }

    /**
     * Generate long-term strategy
     * @param {Object} essayData - Essay data
     * @param {Object} sections - Parsed sections
     * @returns {Array} Long-term strategy items
     */
    generateLongTermStrategy(essayData, sections) {
        const strategy = [];
        
        strategy.push('Develop comprehensive knowledge base');
        strategy.push('Regular reading of quality newspapers and magazines');
        strategy.push('Build repository of examples and case studies');
        strategy.push('Practice diverse essay topics regularly');
        
        return strategy;
    }

    /**
     * Recommend resources
     * @param {Object} essayData - Essay data
     * @param {Object} sections - Parsed sections
     * @returns {Array} Resource recommendations
     */
    recommendResources(essayData, sections) {
        const resources = [];
        
        resources.push('UPSC essay compilation books');
        resources.push('Quality newspapers (The Hindu, Indian Express)');
        resources.push('Monthly magazines (Yojana, Kurukshetra)');
        resources.push('Online essay writing courses');
        
        return resources;
    }

    /**
     * Generate fallback feedback for errors
     * @param {Object} essayData - Essay data
     * @returns {Object} Basic feedback
     */
    generateFallbackFeedback(essayData) {
        return {
            essaySummary: {
                topic: essayData.topic || 'Topic not available',
                wordCount: essayData.wordCount || 0
            },
            message: 'Detailed feedback temporarily unavailable. Please try again.',
            basicFeedback: 'Your essay has been received. Focus on clear structure, relevant examples, and coherent arguments.',
            generalTips: [
                'Ensure clear introduction, body, and conclusion',
                'Use relevant examples and case studies',
                'Maintain logical flow throughout',
                'Practice time management'
            ]
        };
    }

    /**
     * Assess feedback quality
     * @param {string} feedback - Feedback text
     * @returns {number} Quality score (0-1)
     */
    assessFeedbackQuality(feedback) {
        if (!feedback) return 0;
        
        let score = 0.5; // Base score
        
        // Check for comprehensive elements
        if (feedback.includes('score') || feedback.includes('marks')) score += 0.1;
        if (feedback.length > 200) score += 0.1;
        if (feedback.includes('strength')) score += 0.1;
        if (feedback.includes('improvement')) score += 0.1;
        if (feedback.includes('example')) score += 0.1;
        
        return Math.min(score, 1.0);
    }

    /**
     * Identify reinforcement areas from strengths
     * @param {string} text - Strengths text
     * @returns {Array} Areas to reinforce
     */
    identifyReinforcementAreas(text) {
        const areas = [];
        const strengthPatterns = [
            /good.*use.*of/i,
            /strong.*in/i,
            /excellent.*at/i,
            /well.*developed/i
        ];
        
        strengthPatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                areas.push(match[0]);
            }
        });
        
        return areas;
    }

    /**
     * Format feedback for display
     * @param {Object} feedback - Structured feedback
     * @returns {string} HTML formatted feedback
     */
    formatForDisplay(feedback) {
        let html = '<div class="essay-feedback-container">';
        
        // Essay Summary
        html += '<div class="essay-summary">';
        html += `<h3>Essay Evaluation</h3>`;
        html += `<p><strong>Topic:</strong> ${feedback.essaySummary.topic}</p>`;
        html += `<p><strong>Word Count:</strong> ${feedback.essaySummary.wordCount}</p>`;
        if (feedback.overallAssessment.estimatedScore) {
            html += `<p><strong>Estimated Score:</strong> ${feedback.overallAssessment.estimatedScore}/250</p>`;
        }
        html += '</div>';
        
        // Overall Assessment
        if (feedback.overallAssessment.content) {
            html += '<div class="essay-assessment">';
            html += '<h4>📊 Overall Assessment</h4>';
            html += `<p>${feedback.overallAssessment.content}</p>`;
            html += '</div>';
        }
        
        // Strengths
        if (feedback.strengths.content) {
            html += '<div class="essay-strengths">';
            html += '<h4>💪 Strengths</h4>';
            html += `<p>${feedback.strengths.content}</p>`;
            html += '</div>';
        }
        
        // Areas for Improvement
        if (feedback.improvements.content) {
            html += '<div class="essay-improvements">';
            html += '<h4>🎯 Areas for Improvement</h4>';
            html += `<p>${feedback.improvements.content}</p>`;
            html += '</div>';
        }
        
        // Recommendations
        if (feedback.recommendations.immediate.length > 0) {
            html += '<div class="essay-recommendations">';
            html += '<h4>🚀 Immediate Recommendations</h4>';
            html += '<ul>';
            feedback.recommendations.immediate.forEach(rec => {
                html += `<li>${rec}</li>`;
            });
            html += '</ul></div>';
        }
        
        html += '</div>';
        return html;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EssayFeedbackMode;
}