/**
 * News Analysis Mode
 * Specialized handler for current affairs analysis and UPSC relevance assessment
 */

class NewsAnalysisMode {
    constructor(assistantModeManager) {
        this.modeManager = assistantModeManager;
        this.newsTemplates = this.initializeNewsTemplates();
        this.upscSubjects = this.initializeUPSCSubjects();
        this.relevanceScoring = this.initializeRelevanceScoring();
    }

    /**
     * Initialize news-specific prompt templates
     */
    initializeNewsTemplates() {
        return {
            newsAnalysis: `Analyze this current affairs news item for UPSC Civil Services relevance:

**Headline:** {headline}
**Source:** {source}
**Date:** {publishDate}
**Category:** {category}

**News Content:**
{newsContent}

Please provide comprehensive analysis with the following structure:

1. **🎯 UPSC RELEVANCE ASSESSMENT**
   - Relevance Level: High/Medium/Low
   - Exam Importance Score: (1-10)
   - Likely Paper: Prelims/Mains/Both
   - Question Probability: High/Medium/Low

2. **📚 SUBJECT CLASSIFICATION**
   - Primary Subject: (Polity, Economics, Geography, etc.)
   - Secondary Subjects: (if applicable)
   - Syllabus Topics Covered
   - Cross-cutting themes

3. **🔍 KEY POINTS EXTRACTION**
   - Essential facts for exam preparation
   - Important dates, numbers, and statistics
   - Key personalities and institutions involved
   - Policy implications and outcomes

4. **💡 EXAM PERSPECTIVE**
   - Potential question areas
   - Likely question formats (MCQ/Descriptive)
   - Connection to previous year questions
   - Related current affairs to study

5. **📖 BACKGROUND CONTEXT**
   - Historical background (if relevant)
   - Policy context and implications
   - International connections (if any)
   - Future implications and trends

6. **🎓 STUDY RECOMMENDATIONS**
   - Topics to study further
   - Related government schemes/policies
   - Additional reading materials
   - Practice question suggestions

Format your response with clear headings and bullet points for easy note-taking.`,

            newsComparison: `Compare and analyze these related news items for UPSC preparation:

**News Item 1:**
Headline: {headline1}
Content: {content1}

**News Item 2:**
Headline: {headline2}
Content: {content2}

Please provide:

1. **🔗 CONNECTIONS AND PATTERNS**
   - Common themes and issues
   - Policy connections
   - Cause-effect relationships
   - Trend analysis

2. **📊 COMPARATIVE ANALYSIS**
   - Similarities and differences
   - Regional/sectoral variations
   - Timeline and progression
   - Impact assessment

3. **🎯 COMBINED UPSC RELEVANCE**
   - Enhanced exam importance
   - Comprehensive question potential
   - Cross-subject connections
   - Holistic understanding benefits

4. **📚 INTEGRATED STUDY APPROACH**
   - Combined preparation strategy
   - Unified note-making approach
   - Practice question framework
   - Memory techniques

Help students understand the bigger picture and interconnections.`,

            weeklyNewsDigest: `Create a weekly current affairs digest for UPSC preparation:

**Week Period:** {weekStart} to {weekEnd}
**Major News Items:** {newsItems}

Please organize and analyze:

1. **📈 WEEK'S TOP STORIES**
   - Most important news for UPSC
   - High-impact developments
   - Policy announcements
   - International affairs highlights

2. **📚 SUBJECT-WISE BREAKDOWN**
   - Polity and Governance updates
   - Economic developments
   - Science and Technology news
   - Environment and Ecology updates
   - International Relations highlights

3. **🎯 EXAM-FOCUSED INSIGHTS**
   - Potential question areas
   - Important facts and figures
   - Key government initiatives
   - Significant appointments and awards

4. **🔄 CONNECTING THE DOTS**
   - Inter-related news items
   - Policy implications
   - Long-term trends
   - Recurring themes

5. **📝 REVISION CHECKLIST**
   - Must-remember points
   - Important dates and numbers
   - Key personalities
   - Significant locations

Create a comprehensive yet concise weekly summary for effective revision.`,

            newsToQuestions: `Convert this news analysis into potential UPSC questions:

**News Summary:** {newsSummary}
**Subject Areas:** {subjects}
**Key Points:** {keyPoints}

Please generate:

1. **📝 PRELIMS QUESTIONS (MCQs)**
   - 3-5 multiple choice questions
   - Factual and conceptual questions
   - Current affairs integration
   - Difficulty: Easy to Moderate

2. **✍️ MAINS QUESTIONS**
   - 2-3 descriptive questions
   - Analytical and evaluative questions
   - Policy and governance focus
   - Word limit: 150-250 words

3. **🎯 QUESTION ANALYSIS**
   - Learning objectives tested
   - Knowledge areas required
   - Difficulty level assessment
   - Expected answer approach

4. **📚 PREPARATION STRATEGY**
   - Study materials needed
   - Related topics to cover
   - Practice approach
   - Time management tips

Help students practice with realistic, exam-oriented questions.`
        };
    }

    /**
     * Initialize UPSC subject categories
     */
    initializeUPSCSubjects() {
        return {
            polity: {
                name: 'Polity and Governance',
                keywords: ['government', 'policy', 'constitution', 'parliament', 'judiciary', 'election', 'governance', 'administration', 'rights', 'amendment'],
                weight: 0.25
            },
            economics: {
                name: 'Economics',
                keywords: ['economy', 'budget', 'gdp', 'inflation', 'monetary', 'fiscal', 'trade', 'investment', 'banking', 'finance'],
                weight: 0.20
            },
            geography: {
                name: 'Geography',
                keywords: ['climate', 'weather', 'river', 'mountain', 'ocean', 'agriculture', 'mining', 'natural resources', 'disaster', 'mapping'],
                weight: 0.15
            },
            history: {
                name: 'History and Culture',
                keywords: ['heritage', 'culture', 'tradition', 'historical', 'ancient', 'medieval', 'modern', 'freedom struggle', 'monument', 'archaeology'],
                weight: 0.10
            },
            science: {
                name: 'Science and Technology',
                keywords: ['technology', 'innovation', 'research', 'space', 'nuclear', 'biotechnology', 'artificial intelligence', 'digital', 'cyber', 'satellite'],
                weight: 0.15
            },
            environment: {
                name: 'Environment and Ecology',
                keywords: ['environment', 'ecology', 'biodiversity', 'conservation', 'pollution', 'climate change', 'renewable energy', 'wildlife', 'forest', 'sustainability'],
                weight: 0.15
            }
        };
    }

    /**
     * Initialize relevance scoring criteria
     */
    initializeRelevanceScoring() {
        return {
            high: {
                score: 8-10,
                criteria: ['Direct syllabus topic', 'Recent policy change', 'Constitutional significance', 'International importance'],
                description: 'Extremely likely to appear in exam'
            },
            medium: {
                score: 5-7,
                criteria: ['Indirect syllabus connection', 'Regional significance', 'Moderate policy impact', 'Educational value'],
                description: 'Moderately likely to appear in exam'
            },
            low: {
                score: 1-4,
                criteria: ['Minimal syllabus connection', 'Local significance only', 'Limited policy impact', 'General awareness'],
                description: 'Less likely to appear in exam'
            }
        };
    }

    /**
     * Analyze news article for UPSC relevance
     * @param {Object} newsData - News article data
     * @returns {Object} Comprehensive news analysis
     */
    async analyzeNews(newsData) {
        try {
            // Validate news data
            const validation = this.validateNewsData(newsData);
            if (!validation.isValid) {
                throw new Error(`Invalid news data: ${validation.errors.join(', ')}`);
            }

            // Switch to news mode if not already
            if (this.modeManager.currentMode !== 'news') {
                this.modeManager.setMode('news', {
                    analysisType: 'news_analysis',
                    newsId: newsData.id || Date.now(),
                    source: newsData.source,
                    category: newsData.category
                });
            }

            // Generate analysis prompt
            const prompt = this.generateNewsPrompt(newsData);
            
            // Get AI response through mode manager
            const aiResponse = await this.modeManager.getAIResponse(prompt);
            
            // Structure the response
            const structuredAnalysis = this.structureNewsAnalysis(aiResponse, newsData);
            
            return {
                success: true,
                analysis: structuredAnalysis,
                metadata: {
                    newsId: newsData.id,
                    analyzedAt: new Date().toISOString(),
                    mode: 'news',
                    processingTime: Date.now() - (newsData.startTime || Date.now())
                }
            };

        } catch (error) {
            console.error('News analysis failed:', error);
            return {
                success: false,
                error: error.message,
                fallbackAnalysis: this.generateFallbackAnalysis(newsData)
            };
        }
    }

    /**
     * Generate news analysis prompt
     * @param {Object} newsData - News data
     * @returns {string} Formatted prompt
     */
    generateNewsPrompt(newsData) {
        const template = this.newsTemplates.newsAnalysis;
        
        return template
            .replace('{headline}', newsData.headline || newsData.title)
            .replace('{source}', newsData.source || 'Unknown')
            .replace('{publishDate}', newsData.publishDate || newsData.date || 'Not specified')
            .replace('{category}', newsData.category || 'General')
            .replace('{newsContent}', newsData.content || newsData.summary);
    }

    /**
     * Structure news analysis with proper formatting
     * @param {string} aiResponse - Raw AI response
     * @param {Object} newsData - Original news data
     * @returns {Object} Structured analysis
     */
    structureNewsAnalysis(aiResponse, newsData) {
        const sections = this.parseNewsResponseSections(aiResponse);
        
        return {
            newsSummary: {
                headline: newsData.headline || newsData.title,
                source: newsData.source,
                publishDate: newsData.publishDate || newsData.date,
                category: newsData.category,
                url: newsData.url
            },
            relevanceAssessment: {
                content: sections.relevance || '',
                relevanceLevel: this.extractRelevanceLevel(sections.relevance),
                examImportance: this.extractExamImportance(sections.relevance),
                questionProbability: this.extractQuestionProbability(sections.relevance),
                paperType: this.extractPaperType(sections.relevance)
            },
            subjectClassification: {
                content: sections.subjects || '',
                primarySubject: this.identifyPrimarySubject(newsData.content, sections.subjects),
                secondarySubjects: this.identifySecondarySubjects(newsData.content, sections.subjects),
                syllabusTopics: this.extractSyllabusTopics(sections.subjects),
                crossCuttingThemes: this.identifyCrossCuttingThemes(sections.subjects)
            },
            keyPoints: {
                content: sections.keyPoints || '',
                essentialFacts: this.extractEssentialFacts(sections.keyPoints),
                importantDates: this.extractImportantDates(sections.keyPoints),
                keyPersonalities: this.extractKeyPersonalities(sections.keyPoints),
                institutions: this.extractInstitutions(sections.keyPoints)
            },
            examPerspective: {
                content: sections.examPerspective || '',
                potentialQuestions: this.extractPotentialQuestions(sections.examPerspective),
                questionFormats: this.identifyQuestionFormats(sections.examPerspective),
                previousYearConnections: this.findPreviousYearConnections(sections.examPerspective),
                relatedCurrentAffairs: this.identifyRelatedCurrentAffairs(sections.examPerspective)
            },
            backgroundContext: {
                content: sections.background || '',
                historicalContext: this.extractHistoricalContext(sections.background),
                policyContext: this.extractPolicyContext(sections.background),
                internationalConnections: this.extractInternationalConnections(sections.background),
                futureImplications: this.extractFutureImplications(sections.background)
            },
            studyRecommendations: {
                content: sections.recommendations || '',
                topicsToStudy: this.extractTopicsToStudy(sections.recommendations),
                relatedSchemes: this.extractRelatedSchemes(sections.recommendations),
                readingMaterials: this.extractReadingMaterials(sections.recommendations),
                practiceQuestions: this.generatePracticeQuestions(newsData, sections)
            }
        };
    }

    /**
     * Parse AI response into structured sections
     * @param {string} response - AI response text
     * @returns {Object} Parsed sections
     */
    parseNewsResponseSections(response) {
        const sections = {};
        const lines = response.split('\n');
        let currentSection = null;
        let currentContent = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.includes('RELEVANCE ASSESSMENT') || trimmedLine.includes('🎯')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'relevance';
                currentContent = [];
            } else if (trimmedLine.includes('SUBJECT CLASSIFICATION') || trimmedLine.includes('📚')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'subjects';
                currentContent = [];
            } else if (trimmedLine.includes('KEY POINTS') || trimmedLine.includes('🔍')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'keyPoints';
                currentContent = [];
            } else if (trimmedLine.includes('EXAM PERSPECTIVE') || trimmedLine.includes('💡')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'examPerspective';
                currentContent = [];
            } else if (trimmedLine.includes('BACKGROUND CONTEXT') || trimmedLine.includes('📖')) {
                if (currentSection) sections[currentSection] = currentContent.join('\n');
                currentSection = 'background';
                currentContent = [];
            } else if (trimmedLine.includes('STUDY RECOMMENDATIONS') || trimmedLine.includes('🎓')) {
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
     * Validate news data structure
     * @param {Object} newsData - News data to validate
     * @returns {Object} Validation result
     */
    validateNewsData(newsData) {
        const errors = [];
        
        if (!newsData.headline && !newsData.title) {
            errors.push('News headline/title is required');
        }
        
        if (!newsData.content && !newsData.summary) {
            errors.push('News content or summary is required');
        }
        
        if (newsData.content && newsData.content.length < 20) {
            errors.push('News content too short for meaningful analysis');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Extract relevance level from analysis
     * @param {string} text - Relevance analysis text
     * @returns {string} Relevance level
     */
    extractRelevanceLevel(text) {
        if (!text) return 'medium';
        
        const lowerText = text.toLowerCase();
        if (lowerText.includes('high relevance') || lowerText.includes('extremely relevant')) {
            return 'high';
        } else if (lowerText.includes('low relevance') || lowerText.includes('minimal relevance')) {
            return 'low';
        }
        return 'medium';
    }

    /**
     * Extract exam importance score
     * @param {string} text - Relevance analysis text
     * @returns {number} Importance score (1-10)
     */
    extractExamImportance(text) {
        if (!text) return 5;
        
        const scoreMatch = text.match(/(\d+)\/10|score[:\s]*(\d+)|importance[:\s]*(\d+)/i);
        if (scoreMatch) {
            const score = parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
            if (score >= 1 && score <= 10) {
                return score;
            }
        }
        
        // Fallback based on relevance level
        const relevanceLevel = this.extractRelevanceLevel(text);
        return relevanceLevel === 'high' ? 8 : relevanceLevel === 'low' ? 3 : 5;
    }

    /**
     * Extract question probability
     * @param {string} text - Relevance analysis text
     * @returns {string} Question probability
     */
    extractQuestionProbability(text) {
        if (!text) return 'medium';
        
        const lowerText = text.toLowerCase();
        if (lowerText.includes('high probability') || lowerText.includes('likely to appear')) {
            return 'high';
        } else if (lowerText.includes('low probability') || lowerText.includes('unlikely')) {
            return 'low';
        }
        return 'medium';
    }

    /**
     * Extract paper type (Prelims/Mains/Both)
     * @param {string} text - Relevance analysis text
     * @returns {string} Paper type
     */
    extractPaperType(text) {
        if (!text) return 'both';
        
        const lowerText = text.toLowerCase();
        if (lowerText.includes('prelims only') || lowerText.includes('preliminary only')) {
            return 'prelims';
        } else if (lowerText.includes('mains only') || lowerText.includes('main examination only')) {
            return 'mains';
        }
        return 'both';
    }

    /**
     * Identify primary subject based on content analysis
     * @param {string} content - News content
     * @param {string} subjectAnalysis - Subject analysis from AI
     * @returns {string} Primary subject
     */
    identifyPrimarySubject(content, subjectAnalysis) {
        const scores = {};
        
        // Score based on keyword matching
        Object.entries(this.upscSubjects).forEach(([subject, config]) => {
            scores[subject] = 0;
            config.keywords.forEach(keyword => {
                const regex = new RegExp(keyword, 'gi');
                const matches = (content.match(regex) || []).length;
                scores[subject] += matches * config.weight;
            });
        });
        
        // Also check AI analysis
        if (subjectAnalysis) {
            Object.keys(this.upscSubjects).forEach(subject => {
                if (subjectAnalysis.toLowerCase().includes(subject)) {
                    scores[subject] += 2;
                }
            });
        }
        
        // Return subject with highest score
        const primarySubject = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        return this.upscSubjects[primarySubject].name;
    }

    /**
     * Identify secondary subjects
     * @param {string} content - News content
     * @param {string} subjectAnalysis - Subject analysis from AI
     * @returns {Array} Secondary subjects
     */
    identifySecondarySubjects(content, subjectAnalysis) {
        const scores = {};
        
        // Score based on keyword matching
        Object.entries(this.upscSubjects).forEach(([subject, config]) => {
            scores[subject] = 0;
            config.keywords.forEach(keyword => {
                const regex = new RegExp(keyword, 'gi');
                const matches = (content.match(regex) || []).length;
                scores[subject] += matches * config.weight;
            });
        });
        
        // Sort by score and return top 2-3 (excluding primary)
        const sortedSubjects = Object.entries(scores)
            .sort(([,a], [,b]) => b - a)
            .slice(1, 4) // Skip primary, take next 3
            .filter(([,score]) => score > 0)
            .map(([subject]) => this.upscSubjects[subject].name);
        
        return sortedSubjects;
    }

    /**
     * Extract syllabus topics from analysis
     * @param {string} text - Subject analysis text
     * @returns {Array} Syllabus topics
     */
    extractSyllabusTopics(text) {
        if (!text) return [];
        
        const topics = [];
        const topicPatterns = [
            /syllabus[:\s]*([^.]+)/i,
            /topics?[:\s]*([^.]+)/i,
            /covers?[:\s]*([^.]+)/i
        ];
        
        topicPatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                const topicList = match[1].split(/[,;]/).map(t => t.trim());
                topics.push(...topicList);
            }
        });
        
        return topics.filter(topic => topic.length > 3);
    }

    /**
     * Identify cross-cutting themes
     * @param {string} text - Subject analysis text
     * @returns {Array} Cross-cutting themes
     */
    identifyCrossCuttingThemes(text) {
        const themes = [];
        const themePatterns = [
            'governance',
            'sustainable development',
            'technology integration',
            'international cooperation',
            'social justice',
            'economic development',
            'environmental protection'
        ];
        
        themePatterns.forEach(theme => {
            if (text.toLowerCase().includes(theme)) {
                themes.push(theme);
            }
        });
        
        return themes;
    }

    /**
     * Extract essential facts from key points
     * @param {string} text - Key points text
     * @returns {Array} Essential facts
     */
    extractEssentialFacts(text) {
        if (!text) return [];
        
        const facts = [];
        const lines = text.split('\n');
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.match(/^[\d\-\*\•]/) && trimmed.length > 20) {
                facts.push(trimmed.replace(/^[\d\-\*\•\.\)\s]+/, ''));
            }
        });
        
        return facts;
    }

    /**
     * Extract important dates from text
     * @param {string} text - Text to analyze
     * @returns {Array} Important dates
     */
    extractImportantDates(text) {
        if (!text) return [];
        
        const dates = [];
        const datePatterns = [
            /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/g,
            /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g,
            /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi
        ];
        
        datePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                dates.push(...matches);
            }
        });
        
        return [...new Set(dates)]; // Remove duplicates
    }

    /**
     * Extract key personalities from text
     * @param {string} text - Text to analyze
     * @returns {Array} Key personalities
     */
    extractKeyPersonalities(text) {
        if (!text) return [];
        
        const personalities = [];
        const personalityPatterns = [
            /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // Two-word proper names
            /\b(?:Mr|Ms|Dr|Prof|President|Prime Minister|Minister|Chief Minister|Governor)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g
        ];
        
        personalityPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                personalities.push(...matches);
            }
        });
        
        return [...new Set(personalities)].slice(0, 10); // Unique names, max 10
    }

    /**
     * Extract institutions from text
     * @param {string} text - Text to analyze
     * @returns {Array} Institutions
     */
    extractInstitutions(text) {
        if (!text) return [];
        
        const institutions = [];
        const institutionPatterns = [
            /\b(?:Ministry|Department|Commission|Authority|Board|Council|Committee|Institute|University|Organization)\s+of\s+[A-Z][^.]+/gi,
            /\b(?:RBI|SEBI|TRAI|CBI|ED|IT|GST|NITI|ISRO|DRDO|CSIR)\b/g,
            /\b[A-Z]{2,}\b/g // Acronyms
        ];
        
        institutionPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                institutions.push(...matches);
            }
        });
        
        return [...new Set(institutions)].slice(0, 15); // Unique institutions, max 15
    }

    /**
     * Extract potential questions from exam perspective
     * @param {string} text - Exam perspective text
     * @returns {Array} Potential questions
     */
    extractPotentialQuestions(text) {
        const questions = [];
        const lines = text.split('\n');
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.includes('?') || 
                trimmed.toLowerCase().includes('question') ||
                trimmed.toLowerCase().includes('ask about')) {
                questions.push(trimmed);
            }
        });
        
        return questions;
    }

    /**
     * Identify question formats
     * @param {string} text - Exam perspective text
     * @returns {Array} Question formats
     */
    identifyQuestionFormats(text) {
        const formats = [];
        
        if (text.toLowerCase().includes('mcq') || text.toLowerCase().includes('multiple choice')) {
            formats.push('Multiple Choice Questions');
        }
        if (text.toLowerCase().includes('descriptive') || text.toLowerCase().includes('essay')) {
            formats.push('Descriptive Questions');
        }
        if (text.toLowerCase().includes('short answer') || text.toLowerCase().includes('brief')) {
            formats.push('Short Answer Questions');
        }
        
        return formats;
    }

    /**
     * Find previous year connections
     * @param {string} text - Exam perspective text
     * @returns {Array} Previous year connections
     */
    findPreviousYearConnections(text) {
        const connections = [];
        const yearPattern = /20\d{2}/g;
        const years = text.match(yearPattern);
        
        if (years) {
            years.forEach(year => {
                if (text.includes(year)) {
                    const context = this.extractContextAroundYear(text, year);
                    if (context) {
                        connections.push(`${year}: ${context}`);
                    }
                }
            });
        }
        
        return connections;
    }

    /**
     * Extract context around a year mention
     * @param {string} text - Full text
     * @param {string} year - Year to find context for
     * @returns {string} Context around year
     */
    extractContextAroundYear(text, year) {
        const sentences = text.split(/[.!?]+/);
        
        for (const sentence of sentences) {
            if (sentence.includes(year)) {
                return sentence.trim();
            }
        }
        
        return null;
    }

    /**
     * Identify related current affairs
     * @param {string} text - Exam perspective text
     * @returns {Array} Related current affairs
     */
    identifyRelatedCurrentAffairs(text) {
        const relatedAffairs = [];
        const relationPatterns = [
            /related.*to\s+([^.]+)/i,
            /connected.*with\s+([^.]+)/i,
            /similar.*to\s+([^.]+)/i,
            /also.*study\s+([^.]+)/i
        ];
        
        relationPatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                relatedAffairs.push(match[1].trim());
            }
        });
        
        return relatedAffairs;
    }

    /**
     * Extract historical context
     * @param {string} text - Background context text
     * @returns {string} Historical context
     */
    extractHistoricalContext(text) {
        const historicalPatterns = [
            /historical.*background/i,
            /since\s+\d{4}/i,
            /established.*in\s+\d{4}/i,
            /history.*of/i
        ];
        
        for (const pattern of historicalPatterns) {
            const match = text.match(pattern);
            if (match) {
                return this.extractSentenceContaining(text, match[0]);
            }
        }
        
        return '';
    }

    /**
     * Extract policy context
     * @param {string} text - Background context text
     * @returns {string} Policy context
     */
    extractPolicyContext(text) {
        const policyPatterns = [
            /policy.*context/i,
            /government.*policy/i,
            /policy.*implication/i,
            /regulatory.*framework/i
        ];
        
        for (const pattern of policyPatterns) {
            const match = text.match(pattern);
            if (match) {
                return this.extractSentenceContaining(text, match[0]);
            }
        }
        
        return '';
    }

    /**
     * Extract international connections
     * @param {string} text - Background context text
     * @returns {Array} International connections
     */
    extractInternationalConnections(text) {
        const connections = [];
        const internationalPatterns = [
            /international.*agreement/i,
            /global.*initiative/i,
            /bilateral.*relation/i,
            /multilateral.*cooperation/i,
            /\b(?:UN|WHO|IMF|World Bank|WTO|G20|BRICS)\b/g
        ];
        
        internationalPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const sentence = this.extractSentenceContaining(text, match);
                    if (sentence) {
                        connections.push(sentence);
                    }
                });
            }
        });
        
        return [...new Set(connections)]; // Remove duplicates
    }

    /**
     * Extract future implications
     * @param {string} text - Background context text
     * @returns {Array} Future implications
     */
    extractFutureImplications(text) {
        const implications = [];
        const futurePatterns = [
            /future.*implication/i,
            /long.*term.*impact/i,
            /expected.*outcome/i,
            /will.*lead.*to/i,
            /anticipated.*result/i
        ];
        
        futurePatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                const sentence = this.extractSentenceContaining(text, match[0]);
                if (sentence) {
                    implications.push(sentence);
                }
            }
        });
        
        return implications;
    }

    /**
     * Extract sentence containing specific text
     * @param {string} fullText - Full text
     * @param {string} searchText - Text to search for
     * @returns {string} Sentence containing the text
     */
    extractSentenceContaining(fullText, searchText) {
        const sentences = fullText.split(/[.!?]+/);
        
        for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(searchText.toLowerCase())) {
                return sentence.trim();
            }
        }
        
        return '';
    }

    /**
     * Extract topics to study from recommendations
     * @param {string} text - Recommendations text
     * @returns {Array} Topics to study
     */
    extractTopicsToStudy(text) {
        const topics = [];
        const topicPatterns = [
            /study.*about\s+([^.]+)/i,
            /read.*about\s+([^.]+)/i,
            /focus.*on\s+([^.]+)/i,
            /understand\s+([^.]+)/i
        ];
        
        topicPatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                topics.push(match[1].trim());
            }
        });
        
        return topics;
    }

    /**
     * Extract related schemes from recommendations
     * @param {string} text - Recommendations text
     * @returns {Array} Related schemes
     */
    extractRelatedSchemes(text) {
        const schemes = [];
        const schemePatterns = [
            /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Scheme|Yojana|Mission|Programme|Project)\b/g,
            /\b(?:PM|Pradhan Mantri)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g
        ];
        
        schemePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                schemes.push(...matches);
            }
        });
        
        return [...new Set(schemes)]; // Remove duplicates
    }

    /**
     * Extract reading materials from recommendations
     * @param {string} text - Recommendations text
     * @returns {Array} Reading materials
     */
    extractReadingMaterials(text) {
        const materials = [];
        const materialPatterns = [
            /read\s+([^.]+)/i,
            /refer\s+to\s+([^.]+)/i,
            /consult\s+([^.]+)/i,
            /book.*on\s+([^.]+)/i
        ];
        
        materialPatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                materials.push(match[1].trim());
            }
        });
        
        return materials;
    }

    /**
     * Generate practice questions based on analysis
     * @param {Object} newsData - Original news data
     * @param {Object} sections - Parsed sections
     * @returns {Array} Practice questions
     */
    generatePracticeQuestions(newsData, sections) {
        const questions = [];
        
        // Generate based on key facts
        if (sections.keyPoints) {
            questions.push(`What are the key implications of ${newsData.headline}?`);
        }
        
        // Generate based on subject classification
        if (sections.subjects) {
            const primarySubject = this.identifyPrimarySubject(newsData.content, sections.subjects);
            questions.push(`How does this news relate to ${primarySubject} in UPSC syllabus?`);
        }
        
        // Generate based on policy context
        if (sections.background && sections.background.includes('policy')) {
            questions.push(`Analyze the policy implications of this development.`);
        }
        
        return questions.slice(0, 5); // Limit to 5 questions
    }

    /**
     * Generate fallback analysis for errors
     * @param {Object} newsData - News data
     * @returns {Object} Basic analysis
     */
    generateFallbackAnalysis(newsData) {
        return {
            newsSummary: {
                headline: newsData.headline || newsData.title || 'News item',
                source: newsData.source || 'Unknown',
                publishDate: newsData.publishDate || newsData.date || 'Not specified'
            },
            message: 'Detailed analysis temporarily unavailable. Please try again.',
            basicAssessment: {
                relevanceLevel: 'medium',
                examImportance: 5,
                primarySubject: 'General Studies'
            },
            generalTips: [
                'Read the news item carefully',
                'Identify key facts and figures',
                'Connect to UPSC syllabus topics',
                'Note down important dates and personalities'
            ]
        };
    }

    /**
     * Format analysis for display
     * @param {Object} analysis - Structured analysis
     * @returns {string} HTML formatted analysis
     */
    formatForDisplay(analysis) {
        let html = '<div class="news-analysis-container">';
        
        // News Summary
        html += '<div class="news-summary">';
        html += `<h3>News Analysis</h3>`;
        html += `<p><strong>Headline:</strong> ${analysis.newsSummary.headline}</p>`;
        html += `<p><strong>Source:</strong> ${analysis.newsSummary.source}</p>`;
        html += `<p><strong>Date:</strong> ${analysis.newsSummary.publishDate}</p>`;
        html += '</div>';
        
        // Relevance Assessment
        if (analysis.relevanceAssessment.content) {
            html += '<div class="news-relevance">';
            html += '<h4>🎯 UPSC Relevance Assessment</h4>';
            html += `<p><strong>Relevance Level:</strong> ${analysis.relevanceAssessment.relevanceLevel}</p>`;
            html += `<p><strong>Exam Importance:</strong> ${analysis.relevanceAssessment.examImportance}/10</p>`;
            html += `<p>${analysis.relevanceAssessment.content}</p>`;
            html += '</div>';
        }
        
        // Subject Classification
        if (analysis.subjectClassification.content) {
            html += '<div class="news-subjects">';
            html += '<h4>📚 Subject Classification</h4>';
            html += `<p><strong>Primary Subject:</strong> ${analysis.subjectClassification.primarySubject}</p>`;
            html += `<p>${analysis.subjectClassification.content}</p>`;
            html += '</div>';
        }
        
        // Key Points
        if (analysis.keyPoints.content) {
            html += '<div class="news-key-points">';
            html += '<h4>🔍 Key Points</h4>';
            html += `<p>${analysis.keyPoints.content}</p>`;
            html += '</div>';
        }
        
        // Study Recommendations
        if (analysis.studyRecommendations.content) {
            html += '<div class="news-recommendations">';
            html += '<h4>🎓 Study Recommendations</h4>';
            html += `<p>${analysis.studyRecommendations.content}</p>`;
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsAnalysisMode;
}