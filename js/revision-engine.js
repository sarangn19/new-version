// Smart Revision Engine - Performance-based recommendations
class RevisionEngine {
    constructor() {
        this.performanceData = this.loadPerformanceData();
        this.studyHistory = this.loadStudyHistory();
        this.lastUpdateDate = localStorage.getItem('lastRevisionUpdate');
        this.init();
    }

    init() {
        this.checkDailyUpdate();
        this.generateRecommendations();
        this.updateUI();
    }

    // Load performance data from localStorage or initialize
    loadPerformanceData() {
        const saved = localStorage.getItem('studentPerformance');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Default performance data structure
        return {
            subjects: {
                polity: { score: 65, lastStudied: Date.now() - 5 * 24 * 60 * 60 * 1000, attempts: 12 },
                geography: { score: 58, lastStudied: Date.now() - 3 * 24 * 60 * 60 * 1000, attempts: 8 },
                history: { score: 72, lastStudied: Date.now() - 2 * 24 * 60 * 60 * 1000, attempts: 15 },
                economics: { score: 81, lastStudied: Date.now() - 1 * 24 * 60 * 60 * 1000, attempts: 10 },
                science: { score: 69, lastStudied: Date.now() - 4 * 24 * 60 * 60 * 1000, attempts: 7 },
                environment: { score: 84, lastStudied: Date.now() - 1 * 24 * 60 * 60 * 1000, attempts: 6 },
                ethics: { score: 61, lastStudied: Date.now() - 6 * 24 * 60 * 60 * 1000, attempts: 5 },
                currentAffairs: { score: 0, lastStudied: 0, attempts: 0 } // New topics
            },
            overallStats: {
                totalQuestions: 500,
                correctAnswers: 365,
                studyStreak: 7,
                weeklyTarget: 6,
                completedToday: 4
            }
        };
    }

    // Load study history
    loadStudyHistory() {
        const saved = localStorage.getItem('studyHistory');
        return saved ? JSON.parse(saved) : [];
    }

    // Check if daily update is needed
    checkDailyUpdate() {
        const today = new Date().toDateString();
        if (this.lastUpdateDate !== today) {
            this.performDailyUpdate();
            localStorage.setItem('lastRevisionUpdate', today);
        }
    }

    // Perform daily update of recommendations
    performDailyUpdate() {
        console.log('Performing daily revision update...');
        
        // Update spaced repetition intervals
        this.updateSpacedRepetition();
        
        // Analyze recent performance trends
        this.analyzePerformanceTrends();
        
        // Generate new study plan
        this.generateWeeklyPlan();
        
        // Save updated data
        this.savePerformanceData();
        
        console.log('Daily update completed');
    }

    // Update spaced repetition intervals based on performance
    updateSpacedRepetition() {
        const subjects = this.performanceData.subjects;
        const now = Date.now();
        
        Object.keys(subjects).forEach(subject => {
            const data = subjects[subject];
            const daysSinceStudy = (now - data.lastStudied) / (24 * 60 * 60 * 1000);
            
            // Calculate optimal review interval based on performance
            let interval = this.calculateOptimalInterval(data.score, data.attempts);
            
            // Adjust based on forgetting curve
            if (daysSinceStudy > interval) {
                data.priority = 'high';
                data.urgency = Math.min(10, Math.floor(daysSinceStudy - interval));
            } else if (daysSinceStudy > interval * 0.7) {
                data.priority = 'medium';
                data.urgency = 3;
            } else {
                data.priority = 'low';
                data.urgency = 1;
            }
        });
    }

    // Calculate optimal review interval using spaced repetition algorithm
    calculateOptimalInterval(score, attempts) {
        const baseInterval = 1; // 1 day
        const easeFactor = Math.max(1.3, 2.5 - (100 - score) * 0.02);
        const interval = Math.max(1, Math.floor(baseInterval * Math.pow(easeFactor, attempts)));
        return Math.min(interval, 30); // Cap at 30 days
    }

    // Analyze performance trends
    analyzePerformanceTrends() {
        const subjects = this.performanceData.subjects;
        const trends = {};
        
        Object.keys(subjects).forEach(subject => {
            const data = subjects[subject];
            
            // Identify declining performance
            if (data.score < 60 && data.attempts > 3) {
                trends[subject] = 'declining';
            } else if (data.score > 80 && data.attempts > 5) {
                trends[subject] = 'mastered';
            } else if (data.attempts < 3) {
                trends[subject] = 'new';
            } else {
                trends[subject] = 'stable';
            }
        });
        
        this.performanceData.trends = trends;
    }

    // Generate personalized recommendations
    generateRecommendations() {
        const subjects = this.performanceData.subjects;
        const recommendations = {
            priority: [],
            recommended: [],
            review: []
        };

        // Sort subjects by priority score
        const sortedSubjects = Object.entries(subjects).sort((a, b) => {
            const scoreA = this.calculatePriorityScore(a[1]);
            const scoreB = this.calculatePriorityScore(b[1]);
            return scoreB - scoreA;
        });

        // Categorize recommendations
        sortedSubjects.forEach(([subject, data], index) => {
            const item = {
                subject,
                score: data.score,
                lastStudied: data.lastStudied,
                priority: data.priority || 'medium',
                urgency: data.urgency || 1
            };

            if (index < 4 && (data.score < 70 || data.urgency > 5)) {
                recommendations.priority.push(item);
            } else if (index < 8) {
                recommendations.recommended.push(item);
            } else {
                recommendations.review.push(item);
            }
        });

        this.recommendations = recommendations;
        return recommendations;
    }

    // Calculate priority score for ranking
    calculatePriorityScore(subjectData) {
        const scoreWeight = (100 - subjectData.score) * 0.4;
        const timeWeight = subjectData.urgency * 0.3;
        const attemptWeight = Math.max(0, 10 - subjectData.attempts) * 0.3;
        
        return scoreWeight + timeWeight + attemptWeight;
    }

    // Generate 7-day study plan
    generateWeeklyPlan() {
        const plan = [];
        const subjects = Object.keys(this.performanceData.subjects);
        const prioritySubjects = this.recommendations.priority.map(r => r.subject);
        
        for (let day = 0; day < 7; day++) {
            const dayPlan = {
                day: day,
                topics: [],
                type: this.getDayType(day)
            };

            if (day === 6) { // Rest day
                dayPlan.topics = ['Light Review', 'Planning', 'Rest'];
            } else if (day % 3 === 0) { // Test days
                dayPlan.topics = ['Mock Test', 'Analysis', 'Weak Areas'];
            } else {
                // Regular study days - focus on priority subjects
                const todaySubjects = this.selectSubjectsForDay(day, prioritySubjects);
                dayPlan.topics = todaySubjects;
            }

            plan.push(dayPlan);
        }

        this.weeklyPlan = plan;
        return plan;
    }

    // Determine day type
    getDayType(day) {
        if (day === 6) return 'rest';
        if (day % 3 === 0) return 'test';
        return 'study';
    }

    // Select subjects for specific day
    selectSubjectsForDay(day, prioritySubjects) {
        const topics = [];
        const subjectsPerDay = 3;
        
        // Rotate through priority subjects
        for (let i = 0; i < subjectsPerDay; i++) {
            const subjectIndex = (day * subjectsPerDay + i) % prioritySubjects.length;
            topics.push(this.formatSubjectName(prioritySubjects[subjectIndex]));
        }
        
        return topics;
    }

    // Format subject names for display
    formatSubjectName(subject) {
        const names = {
            polity: 'Polity & Constitution',
            geography: 'Geography',
            history: 'History',
            economics: 'Economics',
            science: 'Science & Technology',
            environment: 'Environment',
            ethics: 'Ethics & Integrity',
            currentAffairs: 'Current Affairs'
        };
        return names[subject] || subject;
    }

    // Update performance after study session
    updatePerformance(subject, score, timeSpent) {
        const subjectData = this.performanceData.subjects[subject];
        if (subjectData) {
            // Update running average
            const totalScore = subjectData.score * subjectData.attempts + score;
            subjectData.attempts += 1;
            subjectData.score = Math.round(totalScore / subjectData.attempts);
            subjectData.lastStudied = Date.now();
            
            // Update overall stats
            this.performanceData.overallStats.totalQuestions += 1;
            if (score >= 60) {
                this.performanceData.overallStats.correctAnswers += 1;
            }
            
            // Record in study history
            this.studyHistory.push({
                subject,
                score,
                timeSpent,
                date: Date.now()
            });
            
            // Save data
            this.savePerformanceData();
            this.saveStudyHistory();
            
            // Regenerate recommendations
            this.generateRecommendations();
        }
    }

    // Save performance data
    savePerformanceData() {
        localStorage.setItem('studentPerformance', JSON.stringify(this.performanceData));
    }

    // Save study history
    saveStudyHistory() {
        // Keep only last 100 entries
        if (this.studyHistory.length > 100) {
            this.studyHistory = this.studyHistory.slice(-100);
        }
        localStorage.setItem('studyHistory', JSON.stringify(this.studyHistory));
    }

    // Update UI with current data
    updateUI() {
        // Update performance stats
        const overallScore = Math.round(
            (this.performanceData.overallStats.correctAnswers / 
             this.performanceData.overallStats.totalQuestions) * 100
        );
        
        const weakTopics = Object.values(this.performanceData.subjects)
            .filter(s => s.score < 70).length;

        // Update DOM elements if they exist
        const elements = {
            overallScore: document.getElementById('overallScore'),
            weakTopics: document.getElementById('weakTopics'),
            studyStreak: document.getElementById('studyStreak'),
            todayTarget: document.getElementById('todayTarget')
        };

        if (elements.overallScore) {
            elements.overallScore.textContent = overallScore + '%';
        }
        if (elements.weakTopics) {
            elements.weakTopics.textContent = weakTopics;
        }
        if (elements.studyStreak) {
            elements.studyStreak.textContent = this.performanceData.overallStats.studyStreak;
        }
        if (elements.todayTarget) {
            elements.todayTarget.textContent = 
                `${this.performanceData.overallStats.completedToday}/${this.performanceData.overallStats.weeklyTarget}`;
        }

        // Update progress ring
        this.updateProgressRing(overallScore);
    }

    // Update circular progress indicator
    updateProgressRing(percentage) {
        const progressRing = document.getElementById('overallProgress');
        if (progressRing) {
            const circumference = 2 * Math.PI * 25;
            const offset = circumference - (percentage / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
        }
    }

    // Get recommendations for external use
    getRecommendations() {
        return this.recommendations;
    }

    // Get weekly plan for external use
    getWeeklyPlan() {
        return this.weeklyPlan;
    }
}

// Initialize revision engine when DOM is loaded
let revisionEngine;
document.addEventListener('DOMContentLoaded', function() {
    revisionEngine = new RevisionEngine();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RevisionEngine;
}