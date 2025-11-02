/**
 * Assistant Mode Manager
 * Handles different AI assistant modes and contexts for UPSC learning
 */

class AssistantModeManager {
    constructor() {
        this.currentMode = 'general';
        this.modeHistory = [];
        this.contextData = {};
        this.modeConfigs = this.initializeModeConfigs();
        this.responseFormatters = this.initializeResponseFormatters();
    }

    /**
     * Initialize mode configurations with prompt templates and settings
     */
    initializeModeConfigs() {
        return {
            general: {
                name: 'General Assistant',
                description: 'General UPSC preparation assistance',
                systemPrompt: `You are a helpful UPSC preparation assistant. Provide clear, accurate, and comprehensive answers to help students prepare for the UPSC Civil Services Examination. Focus on:
- Accurate factual information
- Clear explanations
- Exam-relevant insights
- Study tips and strategies
- Current affairs relevance where applicable

Keep responses concise but thorough, and always maintain an encouraging and supportive tone.`,
                temperature: 0.7,
                maxTokens: 1024,
                responseFormat: 'conversational',
                contextPreservation: true,
                allowedTransitions: ['mcq', 'essay', 'news']
            },
            mcq: {
                name: 'MCQ Analysis',
                description: 'Multiple Choice Question analysis and explanations',
                systemPrompt: `You are an expert at analyzing and explaining MCQ solutions for UPSC preparation. For each question:
1. Identify the correct answer with clear reasoning
2. Explain why other options are incorrect
3. Provide relevant background knowledge
4. Connect to broader UPSC syllabus topics
5. Suggest related study areas

Structure your response clearly with numbered points and maintain focus on exam strategy and knowledge building.`,
                temperature: 0.3,
                maxTokens: 512,
                responseFormat: 'structured_mcq',
                contextPreservation: true,
                allowedTransitions: ['general', 'essay', 'news']
            },
            essay: {
                name: 'Essay Feedback',
                description: 'Essay evaluation and improvement suggestions',
                systemPrompt: `You are an expert essay evaluator for UPSC Mains preparation. Provide comprehensive feedback on essays including:
1. Content quality and relevance
2. Structure and organization
3. Argument development and coherence
4. Use of examples and case studies
5. Language and expression
6. Specific improvement suggestions
7. Estimated score range (out of 250)

Be constructive, specific, and actionable in your feedback while maintaining an encouraging tone.`,
                temperature: 0.5,
                maxTokens: 2048,
                responseFormat: 'detailed_feedback',
                contextPreservation: true,
                allowedTransitions: ['general', 'mcq', 'news']
            },
            news: {
                name: 'News Analysis',
                description: 'Current affairs analysis for UPSC relevance',
                systemPrompt: `You analyze current affairs for UPSC Civil Services relevance. For each news item:
1. Assess UPSC exam relevance (High/Medium/Low)
2. Identify related syllabus topics
3. Categorize by subject (Polity, Economics, Geography, etc.)
4. Extract key points for exam preparation
5. Suggest potential question areas
6. Provide background context if needed

Focus on exam utility and knowledge building for aspirants.`,
                temperature: 0.4,
                maxTokens: 1024,
                responseFormat: 'news_analysis',
                contextPreservation: false,
                allowedTransitions: ['general', 'mcq', 'essay']
            }
        };
    }

    /**
     * Initialize response formatters for different modes
     */
    initializeResponseFormatters() {
        return {
            conversational: (response) => response,
            structured_mcq: (response) => this.formatMCQResponse(response),
            detailed_feedback: (response) => this.formatEssayFeedback(response),
            news_analysis: (response) => this.formatNewsAnalysis(response)
        };
    }

    /**
     * Set the current assistant mode
     * @param {string} mode - The mode to switch to
     * @param {Object} context - Additional context for the mode
     * @returns {Object} Mode switch result
     */
    setMode(mode, context = {}) {
        try {
            // Validate mode exists
            if (!this.modeConfigs[mode]) {
                throw new Error(`Invalid mode: ${mode}`);
            }

            // Validate mode transition
            const currentConfig = this.modeConfigs[this.currentMode];
            if (currentConfig && !currentConfig.allowedTransitions.includes(mode)) {
                console.warn(`Direct transition from ${this.currentMode} to ${mode} not recommended`);
            }

            // Store previous mode in history
            if (this.currentMode !== mode) {
                this.modeHistory.push({
                    mode: this.currentMode,
                    context: { ...this.contextData },
                    timestamp: new Date().toISOString()
                });

                // Limit history size
                if (this.modeHistory.length > 10) {
                    this.modeHistory.shift();
                }
            }

            // Switch mode
            const previousMode = this.currentMode;
            this.currentMode = mode;

            // Update context
            this.contextData = {
                ...this.contextData,
                ...context,
                modeSetAt: new Date().toISOString(),
                previousMode: previousMode
            };

            return {
                success: true,
                previousMode: previousMode,
                currentMode: mode,
                config: this.modeConfigs[mode],
                context: this.contextData
            };

        } catch (error) {
            console.error('Mode switch failed:', error);
            return {
                success: false,
                error: error.message,
                currentMode: this.currentMode
            };
        }
    }

    /**
     * Get the current mode configuration
     * @returns {Object} Current mode configuration
     */
    getCurrentMode() {
        return {
            mode: this.currentMode,
            config: this.modeConfigs[this.currentMode],
            context: this.contextData
        };
    }

    /**
     * Get prompt template for current mode
     * @param {string} userMessage - User's message
     * @returns {string} Enhanced prompt with mode-specific template
     */
    getPromptTemplate(userMessage) {
        const config = this.modeConfigs[this.currentMode];
        let enhancedPrompt = config.systemPrompt + '\n\n';

        // Add context if available
        if (Object.keys(this.contextData).length > 0) {
            enhancedPrompt += 'Context: ' + JSON.stringify(this.contextData) + '\n\n';
        }

        // Add mode-specific formatting instructions
        switch (this.currentMode) {
            case 'mcq':
                enhancedPrompt += 'Please analyze the following MCQ and provide a structured response:\n\n';
                break;
            case 'essay':
                enhancedPrompt += 'Please evaluate the following essay and provide detailed feedback:\n\n';
                break;
            case 'news':
                enhancedPrompt += 'Please analyze the following news item for UPSC relevance:\n\n';
                break;
            default:
                enhancedPrompt += 'User Query: ';
        }

        enhancedPrompt += userMessage;

        return enhancedPrompt;
    }

    /**
     * Validate mode transition
     * @param {string} fromMode - Current mode
     * @param {string} toMode - Target mode
     * @returns {boolean} Whether transition is valid
     */
    validateModeTransition(fromMode, toMode) {
        if (!this.modeConfigs[fromMode] || !this.modeConfigs[toMode]) {
            return false;
        }

        const fromConfig = this.modeConfigs[fromMode];
        return fromConfig.allowedTransitions.includes(toMode);
    }

    /**
     * Add context data for current mode
     * @param {string} key - Context key
     * @param {any} value - Context value
     */
    addContext(key, value) {
        this.contextData[key] = value;
    }

    /**
     * Clear context data
     * @param {boolean} preserveMode - Whether to preserve mode-specific data
     */
    clearContext(preserveMode = false) {
        if (preserveMode) {
            const modeData = {
                modeSetAt: this.contextData.modeSetAt,
                previousMode: this.contextData.previousMode
            };
            this.contextData = modeData;
        } else {
            this.contextData = {};
        }
    }

    /**
     * Get mode history
     * @param {number} limit - Number of history entries to return
     * @returns {Array} Mode history
     */
    getModeHistory(limit = 5) {
        return this.modeHistory.slice(-limit);
    }

    /**
     * Process response based on current mode
     * @param {string} response - Raw AI response
     * @returns {Object} Formatted response
     */
    processResponse(response) {
        const config = this.modeConfigs[this.currentMode];
        const formatter = this.responseFormatters[config.responseFormat];

        return {
            content: formatter ? formatter(response) : response,
            mode: this.currentMode,
            format: config.responseFormat,
            timestamp: new Date().toISOString(),
            context: { ...this.contextData }
        };
    }

    /**
     * Format MCQ response with structured layout
     * @param {string} response - Raw response
     * @returns {string} Formatted MCQ response
     */
    formatMCQResponse(response) {
        // Add structured formatting for MCQ responses
        const sections = response.split('\n\n');
        let formatted = '<div class="mcq-analysis-response">';

        sections.forEach((section) => {
            if (section.trim()) {
                const lowerSection = section.toLowerCase();
                
                if (lowerSection.includes('correct answer') || lowerSection.includes('✅')) {
                    formatted += `<div class="mcq-correct-answer"><h4>✅ Correct Answer</h4>${section}</div>`;
                } else if (lowerSection.includes('incorrect options') || lowerSection.includes('❌')) {
                    formatted += `<div class="mcq-incorrect-options"><h4>❌ Incorrect Options</h4>${section}</div>`;
                } else if (lowerSection.includes('concept') || lowerSection.includes('📚')) {
                    formatted += `<div class="mcq-concepts"><h4>📚 Key Concepts</h4>${section}</div>`;
                } else if (lowerSection.includes('strategy') || lowerSection.includes('🎯')) {
                    formatted += `<div class="mcq-strategy"><h4>🎯 Exam Strategy</h4>${section}</div>`;
                } else if (lowerSection.includes('related') || lowerSection.includes('🔗')) {
                    formatted += `<div class="mcq-related"><h4>🔗 Related Topics</h4>${section}</div>`;
                } else {
                    formatted += `<div class="mcq-section">${section}</div>`;
                }
            }
        });

        formatted += '</div>';
        return formatted;
    }

    /**
     * Format essay feedback with structured sections
     * @param {string} response - Raw response
     * @returns {string} Formatted essay feedback
     */
    formatEssayFeedback(response) {
        // Add structured formatting for essay feedback
        const sections = response.split('\n\n');
        let formatted = '';

        sections.forEach((section, index) => {
            if (section.trim()) {
                if (section.toLowerCase().includes('score') || section.toLowerCase().includes('rating')) {
                    formatted += `<div class="essay-score">${section}</div>\n\n`;
                } else if (section.toLowerCase().includes('strength')) {
                    formatted += `<div class="essay-strengths">${section}</div>\n\n`;
                } else if (section.toLowerCase().includes('improvement') || section.toLowerCase().includes('suggestion')) {
                    formatted += `<div class="essay-improvements">${section}</div>\n\n`;
                } else {
                    formatted += `<div class="essay-feedback-section">${section}</div>\n\n`;
                }
            }
        });

        return formatted;
    }

    /**
     * Format news analysis with structured sections
     * @param {string} response - Raw response
     * @returns {string} Formatted news analysis
     */
    formatNewsAnalysis(response) {
        // Add structured formatting for news analysis
        const sections = response.split('\n\n');
        let formatted = '';

        sections.forEach((section, index) => {
            if (section.trim()) {
                if (section.toLowerCase().includes('relevance')) {
                    formatted += `<div class="news-relevance">${section}</div>\n\n`;
                } else if (section.toLowerCase().includes('subject') || section.toLowerCase().includes('category')) {
                    formatted += `<div class="news-category">${section}</div>\n\n`;
                } else if (section.toLowerCase().includes('key points')) {
                    formatted += `<div class="news-key-points">${section}</div>\n\n`;
                } else {
                    formatted += `<div class="news-analysis-section">${section}</div>\n\n`;
                }
            }
        });

        return formatted;
    }

    /**
     * Get available modes
     * @returns {Array} List of available modes with descriptions
     */
    getAvailableModes() {
        return Object.keys(this.modeConfigs).map(mode => ({
            id: mode,
            name: this.modeConfigs[mode].name,
            description: this.modeConfigs[mode].description,
            isCurrent: mode === this.currentMode
        }));
    }

    /**
     * Handle MCQ analysis mode specifically
     * @param {Object} mcqData - MCQ question data
     * @returns {Object} MCQ analysis result
     */
    async handleMCQAnalysis(mcqData) {
        try {
            // Switch to MCQ mode with context
            const modeResult = this.setMode('mcq', {
                analysisType: 'mcq_analysis',
                questionId: mcqData.id || Date.now(),
                subject: mcqData.subject,
                difficulty: mcqData.difficulty,
                startTime: Date.now()
            });

            if (!modeResult.success) {
                throw new Error('Failed to switch to MCQ mode');
            }

            // Generate MCQ-specific prompt
            const prompt = this.generateMCQAnalysisPrompt(mcqData);
            
            return {
                success: true,
                prompt: prompt,
                mode: 'mcq',
                context: this.contextData
            };

        } catch (error) {
            console.error('MCQ analysis setup failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate MCQ analysis prompt
     * @param {Object} mcqData - MCQ data
     * @returns {string} Formatted prompt
     */
    generateMCQAnalysisPrompt(mcqData) {
        const basePrompt = this.getPromptTemplate('');
        
        let mcqPrompt = `Analyze this UPSC MCQ question step by step:

**Question:** ${mcqData.question}

**Options:**
A) ${mcqData.options.A || mcqData.options[0] || 'Option A'}
B) ${mcqData.options.B || mcqData.options[1] || 'Option B'}
C) ${mcqData.options.C || mcqData.options[2] || 'Option C'}
D) ${mcqData.options.D || mcqData.options[3] || 'Option D'}

**User's Answer:** ${mcqData.userAnswer || 'Not answered'}
**Correct Answer:** ${mcqData.correctAnswer}
**Subject:** ${mcqData.subject || 'General Studies'}

Please provide a comprehensive analysis with the following sections:

1. **✅ CORRECT ANSWER EXPLANATION**
   - Why the correct answer is right
   - Key facts and reasoning
   - Exam context and relevance

2. **❌ INCORRECT OPTIONS ANALYSIS**
   - Why each wrong option is incorrect
   - Common misconceptions
   - How to eliminate wrong choices

3. **📚 CONCEPT CLARIFICATION**
   - Key concepts and definitions
   - Background knowledge needed
   - Important facts to remember

4. **🎯 EXAM STRATEGY**
   - Approach for similar questions
   - Time management tips
   - Common traps to avoid

5. **🔗 RELATED TOPICS**
   - Connected syllabus areas
   - Topics for further study
   - Practice recommendations

Format your response with clear headings and bullet points for easy understanding.`;

        return basePrompt + '\n\n' + mcqPrompt;
    }

    /**
     * Process MCQ analysis response
     * @param {string} response - AI response
     * @param {Object} mcqData - Original MCQ data
     * @returns {Object} Processed MCQ analysis
     */
    processMCQResponse(response, mcqData) {
        const processedResponse = this.processResponse(response);
        
        // Add MCQ-specific metadata
        processedResponse.mcqMetadata = {
            questionId: mcqData.id,
            isCorrect: mcqData.userAnswer === mcqData.correctAnswer,
            subject: mcqData.subject,
            difficulty: mcqData.difficulty,
            processingTime: Date.now() - (this.contextData.startTime || Date.now())
        };

        // Extract structured sections
        processedResponse.sections = this.extractMCQSections(response);
        
        return processedResponse;
    }

    /**
     * Extract structured sections from MCQ response
     * @param {string} response - AI response
     * @returns {Object} Extracted sections
     */
    extractMCQSections(response) {
        const sections = {};
        const lines = response.split('\n');
        let currentSection = null;
        let currentContent = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Detect section headers
            if (trimmedLine.includes('✅') || trimmedLine.toUpperCase().includes('CORRECT ANSWER')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
                currentSection = 'correctAnswer';
                currentContent = [];
            } else if (trimmedLine.includes('❌') || trimmedLine.toUpperCase().includes('INCORRECT OPTIONS')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
                currentSection = 'incorrectOptions';
                currentContent = [];
            } else if (trimmedLine.includes('📚') || trimmedLine.toUpperCase().includes('CONCEPT')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
                currentSection = 'concepts';
                currentContent = [];
            } else if (trimmedLine.includes('🎯') || trimmedLine.toUpperCase().includes('STRATEGY')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
                currentSection = 'strategy';
                currentContent = [];
            } else if (trimmedLine.includes('🔗') || trimmedLine.toUpperCase().includes('RELATED')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
                currentSection = 'related';
                currentContent = [];
            } else if (currentSection && trimmedLine) {
                currentContent.push(line);
            }
        });

        // Add the last section
        if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
        }

        return sections;
    }

    /**
     * Get AI response through integrated service
     * @param {string} prompt - Formatted prompt
     * @returns {Promise<string>} AI response
     */
    async getAIResponse(prompt) {
        // This method should be implemented to integrate with AIServiceManager
        // For now, return a placeholder that indicates integration needed
        throw new Error('AI service integration required - connect with AIServiceManager');
    }

    /**
     * Reset to default mode
     */
    resetToDefault() {
        this.setMode('general');
        this.clearContext();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssistantModeManager;
}