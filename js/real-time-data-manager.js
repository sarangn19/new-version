/**
 * Real-Time Data Manager
 * Manages real user data instead of dummy data for statistics, MCQs, flashcards
 */
class RealTimeDataManager {
    constructor() {
        this.folderStorage = window.folderStorage;
        this.init();
    }

    init() {
        console.log('📊 Initializing Real-Time Data Manager...');
        this.setupEventListeners();
        this.migrateToRealData();
    }

    /**
     * Setup event listeners for data updates
     */
    setupEventListeners() {
        // Listen for content saved events
        window.addEventListener('contentSaved', (event) => {
            this.updateRealTimeStats(event.detail);
        });

        // Listen for study session completion
        window.addEventListener('studySessionCompleted', (event) => {
            this.recordStudySession(event.detail);
        });

        // Listen for MCQ completion
        window.addEventListener('mcqCompleted', (event) => {
            this.recordMCQResult(event.detail);
        });
    }

    /**
     * Migrate from dummy data to real user data
     */
    migrateToRealData() {
        console.log('🔄 Migrating to real user data...');
        
        // Clear dummy data flags
        localStorage.removeItem('dummyDataLoaded');
        
        // Initialize real data structures if they don't exist
        this.initializeDataStructures();
        
        // Update all displays with real data
        this.updateAllDisplays();
    }

    /**
     * Initialize data structures with real user data
     */
    initializeDataStructures() {
        // Initialize study sessions if empty
        if (!localStorage.getItem('studySessions')) {
            localStorage.setItem('studySessions', JSON.stringify([]));
        }

        // Initialize MCQ results if empty
        if (!localStorage.getItem('mcqResults')) {
            localStorage.setItem('mcqResults', JSON.stringify([]));
        }

        // Initialize quiz results if empty
        if (!localStorage.getItem('quizResults')) {
            localStorage.setItem('quizResults', JSON.stringify([]));
        }

        // Initialize performance metrics
        if (!localStorage.getItem('performanceMetrics')) {
            localStorage.setItem('performanceMetrics', JSON.stringify({
                totalStudyTime: 0,
                questionsAnswered: 0,
                correctAnswers: 0,
                streakDays: 0,
                lastStudyDate: null,
                subjectProgress: {}
            }));
        }
    }

    /**
     * Get real-time statistics
     */
    getRealTimeStats() {
        try {
            const notes = this.folderStorage ? this.folderStorage.getFromFolder('notes') : 
                         JSON.parse(localStorage.getItem('userNotes') || '[]');
            
            const flashcards = this.folderStorage ? this.folderStorage.getFromFolder('flashcards') : 
                              JSON.parse(localStorage.getItem('flashcards') || '[]');
            
            const mcqs = this.folderStorage ? this.folderStorage.getFromFolder('mcqs') : 
                        JSON.parse(localStorage.getItem('mcqs') || '[]');
            
            const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
            const mcqResults = JSON.parse(localStorage.getItem('mcqResults') || '[]');
            const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');

            // Calculate real statistics
            const today = new Date().toDateString();
            const thisWeek = this.getWeekStart(new Date());
            
            const todaySessions = studySessions.filter(session => 
                new Date(session.date).toDateString() === today
            );
            
            const weekSessions = studySessions.filter(session => 
                new Date(session.date) >= thisWeek
            );

            const totalStudyTime = studySessions.reduce((total, session) => 
                total + (session.duration || 0), 0
            );

            const correctAnswers = mcqResults.filter(result => result.correct).length;
            const totalQuestions = mcqResults.length;
            const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

            return {
                content: {
                    notes: notes.length,
                    flashcards: flashcards.length,
                    mcqs: mcqs.length,
                    conversations: conversations.length
                },
                activity: {
                    todaySessions: todaySessions.length,
                    weekSessions: weekSessions.length,
                    totalStudyTime: Math.round(totalStudyTime),
                    streak: this.calculateStreak(studySessions)
                },
                performance: {
                    accuracy: Math.round(accuracy),
                    totalQuestions,
                    correctAnswers,
                    improvement: this.calculateImprovement(mcqResults)
                },
                subjects: this.getSubjectBreakdown(studySessions, mcqResults)
            };
        } catch (error) {
            console.error('Error getting real-time stats:', error);
            return this.getEmptyStats();
        }
    }

    /**
     * Calculate study streak
     */
    calculateStreak(studySessions) {
        if (studySessions.length === 0) return 0;

        const sortedSessions = studySessions
            .map(session => new Date(session.date).toDateString())
            .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
            .sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        const today = new Date().toDateString();
        let currentDate = new Date();

        for (let i = 0; i < sortedSessions.length; i++) {
            const sessionDate = currentDate.toDateString();
            
            if (sortedSessions.includes(sessionDate)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Calculate performance improvement
     */
    calculateImprovement(mcqResults) {
        if (mcqResults.length < 10) return 0;

        const recent = mcqResults.slice(0, 10);
        const older = mcqResults.slice(10, 20);

        const recentAccuracy = recent.filter(r => r.correct).length / recent.length;
        const olderAccuracy = older.length > 0 ? older.filter(r => r.correct).length / older.length : 0;

        return Math.round((recentAccuracy - olderAccuracy) * 100);
    }

    /**
     * Get subject breakdown
     */
    getSubjectBreakdown(studySessions, mcqResults) {
        const subjects = {};
        
        // From study sessions
        studySessions.forEach(session => {
            const subject = session.subject || 'General';
            if (!subjects[subject]) {
                subjects[subject] = { sessions: 0, questions: 0, correct: 0 };
            }
            subjects[subject].sessions++;
        });

        // From MCQ results
        mcqResults.forEach(result => {
            const subject = result.subject || 'General';
            if (!subjects[subject]) {
                subjects[subject] = { sessions: 0, questions: 0, correct: 0 };
            }
            subjects[subject].questions++;
            if (result.correct) {
                subjects[subject].correct++;
            }
        });

        // Calculate accuracy for each subject
        Object.keys(subjects).forEach(subject => {
            const data = subjects[subject];
            data.accuracy = data.questions > 0 ? Math.round((data.correct / data.questions) * 100) : 0;
        });

        return subjects;
    }

    /**
     * Get week start date
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    /**
     * Get empty stats structure
     */
    getEmptyStats() {
        return {
            content: { notes: 0, flashcards: 0, mcqs: 0, conversations: 0 },
            activity: { todaySessions: 0, weekSessions: 0, totalStudyTime: 0, streak: 0 },
            performance: { accuracy: 0, totalQuestions: 0, correctAnswers: 0, improvement: 0 },
            subjects: {}
        };
    }

    /**
     * Update real-time statistics
     */
    updateRealTimeStats(eventDetail) {
        const { type, data } = eventDetail;
        
        // Record the activity
        const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
        studySessions.unshift({
            id: `session_${Date.now()}`,
            type: type,
            subject: data.subject || data.category || 'General',
            date: new Date().toISOString(),
            duration: 5, // Estimated time for content creation
            activity: `Created ${type}`
        });
        
        localStorage.setItem('studySessions', JSON.stringify(studySessions.slice(0, 100)));
        
        // Trigger statistics update
        this.broadcastStatsUpdate();
    }

    /**
     * Record study session
     */
    recordStudySession(sessionData) {
        const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
        studySessions.unshift({
            id: sessionData.id || `session_${Date.now()}`,
            type: sessionData.type || 'study',
            subject: sessionData.subject || 'General',
            duration: sessionData.duration || 0,
            score: sessionData.score || 0,
            date: new Date().toISOString(),
            completed: true
        });
        
        localStorage.setItem('studySessions', JSON.stringify(studySessions.slice(0, 100)));
        this.broadcastStatsUpdate();
    }

    /**
     * Record MCQ result
     */
    recordMCQResult(resultData) {
        const mcqResults = JSON.parse(localStorage.getItem('mcqResults') || '[]');
        mcqResults.unshift({
            id: resultData.id || `mcq_${Date.now()}`,
            question: resultData.question || '',
            subject: resultData.subject || 'General',
            correct: resultData.correct || false,
            date: new Date().toISOString(),
            source: resultData.source || 'practice'
        });
        
        localStorage.setItem('mcqResults', JSON.stringify(mcqResults.slice(0, 500)));
        this.broadcastStatsUpdate();
    }

    /**
     * Broadcast statistics update to all listening components
     */
    broadcastStatsUpdate() {
        const stats = this.getRealTimeStats();
        window.dispatchEvent(new CustomEvent('statsUpdated', {
            detail: stats
        }));
    }

    /**
     * Update all displays with real data
     */
    updateAllDisplays() {
        // Update statistics displays
        this.updateStatisticsDisplay();
        
        // Update MCQ and flashcard displays
        this.updateContentDisplays();
        
        // Update dashboard
        this.updateDashboard();
    }

    /**
     * Update statistics display
     */
    updateStatisticsDisplay() {
        const stats = this.getRealTimeStats();
        
        // Update any statistics elements on the page
        const statsElements = document.querySelectorAll('[data-stat]');
        statsElements.forEach(element => {
            const statType = element.dataset.stat;
            const statPath = statType.split('.');
            let value = stats;
            
            for (const path of statPath) {
                value = value[path];
                if (value === undefined) break;
            }
            
            if (value !== undefined) {
                element.textContent = value;
            }
        });
    }

    /**
     * Update content displays (MCQ, flashcards)
     */
    updateContentDisplays() {
        // Update MCQ display
        if (this.folderStorage) {
            const mcqs = this.folderStorage.getFromFolder('mcqs');
            const flashcards = this.folderStorage.getFromFolder('flashcards');
            
            // Dispatch events to update displays
            window.dispatchEvent(new CustomEvent('realDataLoaded', {
                detail: { mcqs, flashcards }
            }));
        }
    }

    /**
     * Update dashboard with real data
     */
    updateDashboard() {
        const stats = this.getRealTimeStats();
        
        // Update dashboard elements if they exist
        const dashboardElements = {
            'total-notes': stats.content.notes,
            'total-flashcards': stats.content.flashcards,
            'total-mcqs': stats.content.mcqs,
            'study-streak': stats.activity.streak,
            'accuracy-rate': stats.performance.accuracy + '%',
            'total-study-time': stats.activity.totalStudyTime + ' min'
        };
        
        Object.entries(dashboardElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    /**
     * Get real MCQ data for MCQ page
     */
    getRealMCQData() {
        if (this.folderStorage) {
            return this.folderStorage.getFromFolder('mcqs');
        }
        return JSON.parse(localStorage.getItem('mcqs') || '[]');
    }

    /**
     * Get real flashcard data for flashcard page
     */
    getRealFlashcardData() {
        if (this.folderStorage) {
            return this.folderStorage.getFromFolder('flashcards');
        }
        return JSON.parse(localStorage.getItem('flashcards') || '[]');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.realTimeDataManager = new RealTimeDataManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeDataManager;
}