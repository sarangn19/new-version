/**
 * AI Daily Challenge Generator
 * Generates personalized daily challenges and rapid flashcards based on user performance
 */
class AIDailyChallengeGenerator {
    constructor() {
        this.aiServiceManager = window.aiServiceManager;
        this.performanceAnalyzer = window.performanceAnalyzer;
        this.folderStorage = window.folderStorage;
        this.lastGeneratedDate = localStorage.getItem('lastChallengeDate');
        this.userWeakAreas = this.loadWeakAreas();
        this.init();
    }

    init() {
        console.log('🎯 Initializing AI Daily Challenge Generator...');
        this.checkAndGenerateDailyContent();
    }

    /**
     * Check if daily content needs to be generated
     */
    async checkAndGenerateDailyContent() {
        const today = new Date().toDateString();
        
        if (this.lastGeneratedDate !== today) {
            console.log('📅 Generating new daily content for:', today);
            await this.generateDailyChallenge();
            await this.generateRapidFlashcards();
            localStorage.setItem('lastChallengeDate', today);
        } else {
            console.log('✅ Daily content already generated for today');
        }
    }

    /**
     * Load user's weak areas from performance data
     */
    loadWeakAreas() {
        try {
            // Get user performance data
            const mcqResults = JSON.parse(localStorage.getItem('mcqResults') || '[]');
            const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
            
            // Analyze weak areas
            const subjectPerformance = {};
            
            mcqResults.forEach(result => {
                const subject = result.subject || 'General';
                if (!subjectPerformance[subject]) {
                    subjectPerformance[subject] = { correct: 0, total: 0 };
                }
                subjectPerformance[subject].total++;
                if (result.correct) {
                    subjectPerformance[subject].correct++;
                }
            });

            // Find subjects with < 70% accuracy
            const weakAreas = [];
            Object.entries(subjectPerformance).forEach(([subject, perf]) => {
                const accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
                if (accuracy < 70 || perf.total < 5) {
                    weakAreas.push({
                        subject,
                        accuracy,
                        attempts: perf.total,
                        priority: perf.total < 5 ? 'high' : 'medium'
                    });
                }
            });

            return weakAreas.length > 0 ? weakAreas : [
                { subject: 'Constitutional Law', accuracy: 0, attempts: 0, priority: 'high' },
                { subject: 'Economics', accuracy: 0, attempts: 0, priority: 'high' },
                { subject: 'Current Affairs', accuracy: 0, attempts: 0, priority: 'high' }
            ];
        } catch (error) {
            console.error('Error loading weak areas:', error);
            return [
                { subject: 'Constitutional Law', accuracy: 0, attempts: 0, priority: 'high' },
                { subject: 'Economics', accuracy: 0, attempts: 0, priority: 'high' }
            ];
        }
    }

    /**
     * Generate AI-powered daily challenge
     */
    async generateDailyChallenge() {
        try {
            console.log('🎯 Generating AI daily challenge...');
            
            const weakestArea = this.userWeakAreas[0];
            const prompt = `Generate a UPSC daily challenge for ${weakestArea.subject}. 

User Performance Context:
- Subject: ${weakestArea.subject}
- Current Accuracy: ${weakestArea.accuracy}%
- Practice Attempts: ${weakestArea.attempts}
- Priority Level: ${weakestArea.priority}

Create a challenging but achievable daily task that includes:
1. A specific learning objective
2. 3-4 multiple choice questions with detailed explanations
3. Key concepts to review
4. Estimated completion time (15-20 minutes)
5. Success criteria

Format as JSON with this structure:
{
  "title": "Daily Challenge Title",
  "subject": "${weakestArea.subject}",
  "objective": "Learning objective",
  "estimatedTime": "15 minutes",
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct": 1,
      "explanation": "Detailed explanation"
    }
  ],
  "keyConcepts": ["concept1", "concept2"],
  "successCriteria": "What constitutes success"
}`;

            const response = await this.aiServiceManager.sendMessage(prompt, {
                context: { selectedMode: 'mcq_generator' }
            });

            const challengeData = this.parseAIResponse(response.content);
            challengeData.id = `challenge_${Date.now()}`;
            challengeData.date = new Date().toISOString();
            challengeData.completed = false;
            challengeData.score = 0;

            // Save to localStorage
            localStorage.setItem('dailyChallenge', JSON.stringify(challengeData));
            console.log('✅ Daily challenge generated:', challengeData.title);

            return challengeData;
        } catch (error) {
            console.error('❌ Error generating daily challenge:', error);
            return this.getFallbackChallenge();
        }
    }

    /**
     * Generate AI-powered rapid flashcards
     */
    async generateRapidFlashcards() {
        try {
            console.log('⚡ Generating rapid flashcards...');
            
            const topWeakAreas = this.userWeakAreas.slice(0, 2);
            const subjects = topWeakAreas.map(area => area.subject).join(' and ');
            
            const prompt = `Generate 8 rapid flashcards for UPSC preparation focusing on ${subjects}.

User needs improvement in:
${topWeakAreas.map(area => `- ${area.subject} (${area.accuracy}% accuracy)`).join('\n')}

Create concise, high-impact flashcards that cover:
1. Key facts and definitions
2. Important dates and events
3. Constitutional articles/amendments
4. Economic concepts and policies
5. Current affairs connections

Format as JSON array:
[
  {
    "front": "Question or term",
    "back": "Answer or definition",
    "subject": "Subject name",
    "difficulty": "easy|medium|hard",
    "tags": ["tag1", "tag2"]
  }
]

Make them challenging but memorable, suitable for quick review.`;

            const response = await this.aiServiceManager.sendMessage(prompt, {
                context: { selectedMode: 'flashcard_generator' }
            });

            const flashcardsData = this.parseAIResponse(response.content);
            const processedFlashcards = flashcardsData.map((card, index) => ({
                ...card,
                id: `rapid_${Date.now()}_${index}`,
                date: new Date().toISOString(),
                type: 'rapid',
                reviewed: false,
                difficulty: card.difficulty || 'medium'
            }));

            // Save to folder storage
            if (this.folderStorage) {
                processedFlashcards.forEach(card => {
                    this.folderStorage.saveFlashcard(card);
                });
            }

            // Also save to rapid flashcards storage
            localStorage.setItem('rapidFlashcards', JSON.stringify(processedFlashcards));
            console.log('✅ Rapid flashcards generated:', processedFlashcards.length);

            return processedFlashcards;
        } catch (error) {
            console.error('❌ Error generating rapid flashcards:', error);
            return this.getFallbackFlashcards();
        }
    }

    /**
     * Parse AI response and extract JSON
     */
    parseAIResponse(content) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // If no JSON found, try to parse the entire content
            return JSON.parse(content);
        } catch (error) {
            console.error('Error parsing AI response:', error);
            throw new Error('Failed to parse AI response as JSON');
        }
    }

    /**
     * Get fallback challenge if AI generation fails
     */
    getFallbackChallenge() {
        const weakestArea = this.userWeakAreas[0];
        return {
            id: `fallback_${Date.now()}`,
            title: `${weakestArea.subject} Practice Challenge`,
            subject: weakestArea.subject,
            objective: `Improve understanding of ${weakestArea.subject} concepts`,
            estimatedTime: '15 minutes',
            date: new Date().toISOString(),
            completed: false,
            score: 0,
            questions: [
                {
                    question: `Which aspect of ${weakestArea.subject} needs more focus based on your recent performance?`,
                    options: ['Theoretical concepts', 'Practical applications', 'Current developments', 'Historical context'],
                    correct: 0,
                    explanation: 'Focus on strengthening theoretical foundations first.'
                }
            ],
            keyConcepts: ['Basic principles', 'Key terminology', 'Important frameworks'],
            successCriteria: 'Complete all questions with 75% accuracy'
        };
    }

    /**
     * Get fallback flashcards if AI generation fails
     */
    getFallbackFlashcards() {
        const weakestArea = this.userWeakAreas[0];
        return [
            {
                id: `fallback_flash_${Date.now()}`,
                front: `What is the key challenge in ${weakestArea.subject}?`,
                back: 'Understanding core concepts and their practical applications',
                subject: weakestArea.subject,
                difficulty: 'medium',
                tags: ['review', 'basics'],
                date: new Date().toISOString(),
                type: 'rapid',
                reviewed: false
            }
        ];
    }

    /**
     * Get today's daily challenge
     */
    getTodaysChallenge() {
        try {
            const challenge = JSON.parse(localStorage.getItem('dailyChallenge') || 'null');
            const today = new Date().toDateString();
            const challengeDate = challenge ? new Date(challenge.date).toDateString() : null;
            
            return challengeDate === today ? challenge : null;
        } catch (error) {
            console.error('Error getting today\'s challenge:', error);
            return null;
        }
    }

    /**
     * Get today's rapid flashcards
     */
    getTodaysFlashcards() {
        try {
            const flashcards = JSON.parse(localStorage.getItem('rapidFlashcards') || '[]');
            const today = new Date().toDateString();
            
            return flashcards.filter(card => {
                const cardDate = new Date(card.date).toDateString();
                return cardDate === today;
            });
        } catch (error) {
            console.error('Error getting today\'s flashcards:', error);
            return [];
        }
    }

    /**
     * Mark challenge as completed
     */
    completeChallenge(challengeId, score) {
        try {
            const challenge = JSON.parse(localStorage.getItem('dailyChallenge'));
            if (challenge && challenge.id === challengeId) {
                challenge.completed = true;
                challenge.score = score;
                challenge.completedAt = new Date().toISOString();
                localStorage.setItem('dailyChallenge', JSON.stringify(challenge));
                
                // Update user performance data
                this.updatePerformanceData(challenge);
            }
        } catch (error) {
            console.error('Error completing challenge:', error);
        }
    }

    /**
     * Update user performance data
     */
    updatePerformanceData(challenge) {
        try {
            // Add to study sessions
            const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
            studySessions.unshift({
                id: `session_${Date.now()}`,
                type: 'daily_challenge',
                subject: challenge.subject,
                score: challenge.score,
                totalQuestions: challenge.questions.length,
                duration: 15, // Estimated
                date: new Date().toISOString(),
                completed: true
            });
            localStorage.setItem('studySessions', JSON.stringify(studySessions.slice(0, 100))); // Keep last 100

            // Add MCQ results
            const mcqResults = JSON.parse(localStorage.getItem('mcqResults') || '[]');
            challenge.questions.forEach((q, index) => {
                mcqResults.unshift({
                    id: `challenge_q_${Date.now()}_${index}`,
                    question: q.question,
                    subject: challenge.subject,
                    correct: challenge.userAnswers ? challenge.userAnswers[index] === q.correct : false,
                    date: new Date().toISOString(),
                    source: 'daily_challenge'
                });
            });
            localStorage.setItem('mcqResults', JSON.stringify(mcqResults.slice(0, 500))); // Keep last 500

            console.log('✅ Performance data updated');
        } catch (error) {
            console.error('Error updating performance data:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for dependencies with longer timeout and retry logic
    let retryCount = 0;
    const maxRetries = 5;
    
    function tryInitialize() {
        if (window.aiServiceManager) {
            window.aiDailyChallengeGenerator = new AIDailyChallengeGenerator();
            console.log('✅ AI Daily Challenge Generator initialized');
        } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(`⏳ Waiting for AI Service Manager... (${retryCount}/${maxRetries})`);
            setTimeout(tryInitialize, 2000);
        } else {
            console.warn('⚠️ AI Service Manager not available, using fallback mode');
            // Initialize with fallback mode
            window.aiDailyChallengeGenerator = new AIDailyChallengeGenerator();
        }
    }
    
    setTimeout(tryInitialize, 1000);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIDailyChallengeGenerator;
}