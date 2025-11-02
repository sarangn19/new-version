/**
 * Real-time Statistics Manager
 * Handles live data updates for the statistics dashboard
 */
class RealTimeStatistics {
    constructor() {
        this.updateInterval = 5000; // Update every 5 seconds
        this.isActive = false;
        this.intervalId = null;
        this.lastUpdate = null;
        
        // Initialize data sources
        this.dataSources = {
            localStorage: true,
            firebase: false,
            api: false
        };
        
        this.init();
    }

    /**
     * Initialize the real-time statistics system
     */
    init() {
        console.log('🔄 Initializing Real-time Statistics...');
        
        // Check available data sources
        this.checkDataSources();
        
        // Start real-time updates
        this.startRealTimeUpdates();
        
        // Listen for data changes
        this.setupEventListeners();
    }

    /**
     * Check which data sources are available
     */
    checkDataSources() {
        // Check Firebase availability
        if (window.firebaseManager?.isReady()) {
            this.dataSources.firebase = true;
            console.log('✅ Firebase data source available');
        }
        
        // Check localStorage
        if (typeof Storage !== 'undefined') {
            this.dataSources.localStorage = true;
            console.log('✅ localStorage data source available');
        }
        
        console.log('📊 Data sources:', this.dataSources);
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('▶️ Starting real-time statistics updates');
        
        // Initial update
        this.updateStatistics();
        
        // Set up interval for continuous updates
        this.intervalId = setInterval(() => {
            this.updateStatistics();
        }, this.updateInterval);
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (!this.isActive) return;
        
        this.isActive = false;
        console.log('⏹️ Stopping real-time statistics updates');
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Update all statistics
     */
    async updateStatistics() {
        try {
            console.log('🔄 Updating statistics...');
            
            const stats = await this.gatherStatistics();
            this.displayStatistics(stats);
            
            this.lastUpdate = new Date();
            console.log('✅ Statistics updated successfully');
            
        } catch (error) {
            console.error('❌ Error updating statistics:', error);
        }
    }

    /**
     * Gather statistics from all available sources
     */
    async gatherStatistics() {
        const stats = {
            studyTime: { today: 0, week: 0, month: 0, total: 0 },
            performance: { accuracy: 0, improvement: 0, streak: 0 },
            content: { notes: 0, flashcards: 0, mcqs: 0, bookmarks: 0 },
            activity: { sessions: 0, questions: 0, reviews: 0 },
            goals: { daily: { completed: 0, total: 3 }, weekly: { completed: 0, total: 10 } },
            trends: { daily: [], weekly: [], monthly: [] },
            subjects: {},
            recentActivity: []
        };

        // Gather from localStorage
        if (this.dataSources.localStorage) {
            await this.gatherFromLocalStorage(stats);
        }

        // Gather from Firebase
        if (this.dataSources.firebase) {
            await this.gatherFromFirebase(stats);
        }

        // Calculate derived statistics
        this.calculateDerivedStats(stats);

        return stats;
    }

    /**
     * Gather statistics from localStorage
     */
    async gatherFromLocalStorage(stats) {
        try {
            // Content counts
            const notes = JSON.parse(localStorage.getItem('userNotes') || '[]');
            const flashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
            const mcqs = JSON.parse(localStorage.getItem('mcqs') || '[]');
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            
            stats.content.notes = notes.length;
            stats.content.flashcards = flashcards.length;
            stats.content.mcqs = mcqs.length;
            stats.content.bookmarks = bookmarks.length;

            // Study sessions
            const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
            const today = new Date().toDateString();
            const thisWeek = this.getWeekStart(new Date());
            const thisMonth = new Date().getMonth();

            // Calculate study time
            stats.studyTime.today = studySessions
                .filter(session => new Date(session.date).toDateString() === today)
                .reduce((total, session) => total + (session.duration || 0), 0);

            stats.studyTime.week = studySessions
                .filter(session => new Date(session.date) >= thisWeek)
                .reduce((total, session) => total + (session.duration || 0), 0);

            stats.studyTime.month = studySessions
                .filter(session => new Date(session.date).getMonth() === thisMonth)
                .reduce((total, session) => total + (session.duration || 0), 0);

            stats.studyTime.total = studySessions
                .reduce((total, session) => total + (session.duration || 0), 0);

            // Performance metrics
            const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
            if (quizResults.length > 0) {
                const correctAnswers = quizResults.filter(result => result.correct).length;
                stats.performance.accuracy = Math.round((correctAnswers / quizResults.length) * 100);
                
                // Calculate streak
                stats.performance.streak = this.calculateStreak(quizResults);
                
                // Calculate improvement (last 10 vs previous 10)
                if (quizResults.length >= 20) {
                    const recent = quizResults.slice(-10);
                    const previous = quizResults.slice(-20, -10);
                    const recentAccuracy = recent.filter(r => r.correct).length / recent.length;
                    const previousAccuracy = previous.filter(r => r.correct).length / previous.length;
                    stats.performance.improvement = Math.round((recentAccuracy - previousAccuracy) * 100);
                }
            }

            // Activity counts
            stats.activity.sessions = studySessions.length;
            stats.activity.questions = quizResults.length;
            stats.activity.reviews = flashcards.filter(f => f.lastReviewed).length;

            // Subject breakdown
            [...notes, ...flashcards, ...mcqs].forEach(item => {
                const subject = item.subject || item.category || 'General';
                stats.subjects[subject] = (stats.subjects[subject] || 0) + 1;
            });

            // Recent activity
            const allActivity = [
                ...notes.map(n => ({ type: 'note', title: n.title, date: n.createdAt })),
                ...flashcards.map(f => ({ type: 'flashcard', title: f.front, date: f.createdAt })),
                ...mcqs.map(m => ({ type: 'mcq', title: m.question, date: m.createdAt }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

            stats.recentActivity = allActivity;

            console.log('📊 Gathered statistics from localStorage');
        } catch (error) {
            console.error('Error gathering localStorage statistics:', error);
        }
    }

    /**
     * Gather statistics from Firebase
     */
    async gatherFromFirebase(stats) {
        try {
            if (!window.firebaseManager?.isReady()) return;

            // Get data from Firebase
            const [notes, conversations] = await Promise.all([
                window.firebaseManager.getNotes(100),
                window.firebaseManager.getConversations(50)
            ]);

            // Update content counts with Firebase data
            if (notes.length > stats.content.notes) {
                stats.content.notes = notes.length;
            }

            // Add conversation statistics
            stats.content.conversations = conversations.length;
            
            // Calculate AI usage statistics
            const aiInteractions = conversations.reduce((total, conv) => total + (conv.messageCount || 0), 0);
            stats.activity.aiInteractions = aiInteractions;

            console.log('📊 Gathered statistics from Firebase');
        } catch (error) {
            console.error('Error gathering Firebase statistics:', error);
        }
    }

    /**
     * Calculate derived statistics
     */
    calculateDerivedStats(stats) {
        // Daily goal progress
        const dailyGoal = 120; // 2 hours in minutes
        stats.goals.daily.completed = Math.min(stats.studyTime.today, dailyGoal);
        stats.goals.daily.total = dailyGoal;
        stats.goals.daily.percentage = Math.round((stats.goals.daily.completed / dailyGoal) * 100);

        // Weekly goal progress
        const weeklyGoal = 600; // 10 hours in minutes
        stats.goals.weekly.completed = Math.min(stats.studyTime.week, weeklyGoal);
        stats.goals.weekly.total = weeklyGoal;
        stats.goals.weekly.percentage = Math.round((stats.goals.weekly.completed / weeklyGoal) * 100);

        // Generate trend data
        stats.trends.daily = this.generateDailyTrend();
        stats.trends.weekly = this.generateWeeklyTrend();
    }

    /**
     * Display statistics on the dashboard
     */
    displayStatistics(stats) {
        // Update main stat cards
        this.updateStatCard('study-time-today', this.formatTime(stats.studyTime.today), 'minutes today');
        this.updateStatCard('study-time-week', this.formatTime(stats.studyTime.week), 'minutes this week');
        this.updateStatCard('performance-accuracy', `${stats.performance.accuracy}%`, 'accuracy rate');
        this.updateStatCard('content-total', stats.content.notes + stats.content.flashcards + stats.content.mcqs, 'total items');

        // Update performance indicators
        this.updatePerformanceIndicator('accuracy-indicator', stats.performance.accuracy);
        this.updatePerformanceIndicator('streak-indicator', stats.performance.streak);
        this.updatePerformanceIndicator('improvement-indicator', stats.performance.improvement);

        // Update progress bars
        this.updateProgressBar('daily-goal-progress', stats.goals.daily.percentage);
        this.updateProgressBar('weekly-goal-progress', stats.goals.weekly.percentage);

        // Update content breakdown
        this.updateContentBreakdown(stats.content);

        // Update subject distribution
        this.updateSubjectDistribution(stats.subjects);

        // Update recent activity
        this.updateRecentActivity(stats.recentActivity);

        // Update charts if they exist
        if (window.updateCharts) {
            window.updateCharts(stats);
        }

        // Update last update time
        this.updateLastUpdateTime();
    }

    /**
     * Update a stat card
     */
    updateStatCard(id, value, label) {
        const card = document.getElementById(id);
        if (card) {
            const valueEl = card.querySelector('.stat-value');
            const labelEl = card.querySelector('.stat-label');
            
            if (valueEl) {
                this.animateCounter(valueEl, value);
            }
            if (labelEl) {
                labelEl.textContent = label;
            }
        }
    }

    /**
     * Update performance indicator
     */
    updatePerformanceIndicator(id, value) {
        const indicator = document.getElementById(id);
        if (indicator) {
            const valueEl = indicator.querySelector('.indicator-value');
            const barEl = indicator.querySelector('.indicator-bar');
            
            if (valueEl) {
                this.animateCounter(valueEl, value);
            }
            if (barEl) {
                const percentage = Math.min(Math.max(value, 0), 100);
                barEl.style.width = `${percentage}%`;
            }
        }
    }

    /**
     * Update progress bar
     */
    updateProgressBar(id, percentage) {
        const progressBar = document.getElementById(id);
        if (progressBar) {
            const fillEl = progressBar.querySelector('.progress-fill');
            const textEl = progressBar.querySelector('.progress-text');
            
            if (fillEl) {
                fillEl.style.width = `${Math.min(Math.max(percentage, 0), 100)}%`;
            }
            if (textEl) {
                textEl.textContent = `${percentage}%`;
            }
        }
    }

    /**
     * Update content breakdown
     */
    updateContentBreakdown(content) {
        const breakdown = document.getElementById('content-breakdown');
        if (breakdown) {
            breakdown.innerHTML = `
                <div class="flex justify-between items-center py-2">
                    <span class="text-white/70">Notes</span>
                    <span class="font-medium">${content.notes}</span>
                </div>
                <div class="flex justify-between items-center py-2">
                    <span class="text-white/70">Flashcards</span>
                    <span class="font-medium">${content.flashcards}</span>
                </div>
                <div class="flex justify-between items-center py-2">
                    <span class="text-white/70">MCQs</span>
                    <span class="font-medium">${content.mcqs}</span>
                </div>
                <div class="flex justify-between items-center py-2">
                    <span class="text-white/70">Bookmarks</span>
                    <span class="font-medium">${content.bookmarks}</span>
                </div>
            `;
        }
    }

    /**
     * Update subject distribution
     */
    updateSubjectDistribution(subjects) {
        const distribution = document.getElementById('subject-distribution');
        if (distribution) {
            const total = Object.values(subjects).reduce((sum, count) => sum + count, 0);
            const html = Object.entries(subjects)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([subject, count]) => {
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    return `
                        <div class="flex justify-between items-center py-2">
                            <span class="text-white/70">${subject}</span>
                            <div class="flex items-center gap-2">
                                <div class="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-teal-500 rounded-full" style="width: ${percentage}%"></div>
                                </div>
                                <span class="text-sm font-medium w-8">${count}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            
            distribution.innerHTML = html || '<div class="text-white/50 text-center py-4">No data available</div>';
        }
    }

    /**
     * Update recent activity
     */
    updateRecentActivity(activities) {
        const activityList = document.getElementById('recent-activity-list');
        if (activityList) {
            const html = activities.slice(0, 5).map(activity => {
                const icon = activity.type === 'note' ? 'file-text' : 
                           activity.type === 'flashcard' ? 'layers' : 'help-circle';
                const timeAgo = this.getTimeAgo(new Date(activity.date));
                
                return `
                    <div class="flex items-center gap-3 py-2">
                        <div class="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                            <i data-lucide="${icon}" class="w-4 h-4 text-teal-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-white truncate">${activity.title}</p>
                            <p class="text-xs text-white/60">${timeAgo}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
            activityList.innerHTML = html || '<div class="text-white/50 text-center py-4">No recent activity</div>';
            
            // Refresh icons
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    /**
     * Update last update time
     */
    updateLastUpdateTime() {
        const lastUpdateEl = document.getElementById('last-update-time');
        if (lastUpdateEl && this.lastUpdate) {
            lastUpdateEl.textContent = `Last updated: ${this.lastUpdate.toLocaleTimeString()}`;
        }
    }

    /**
     * Animate counter
     */
    animateCounter(element, targetValue) {
        if (!element) return;
        
        const isNumeric = !isNaN(targetValue);
        if (!isNumeric) {
            element.textContent = targetValue;
            return;
        }

        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.round(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for storage changes
        window.addEventListener('storage', () => {
            console.log('📊 Storage changed, updating statistics...');
            this.updateStatistics();
        });

        // Listen for custom events
        window.addEventListener('contentSaved', () => {
            console.log('📊 Content saved, updating statistics...');
            setTimeout(() => this.updateStatistics(), 500);
        });

        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopRealTimeUpdates();
            } else {
                this.startRealTimeUpdates();
            }
        });
    }

    /**
     * Utility functions
     */
    formatTime(minutes) {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    calculateStreak(results) {
        let streak = 0;
        for (let i = results.length - 1; i >= 0; i--) {
            if (results[i].correct) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    generateDailyTrend() {
        // Generate sample daily trend data
        const days = 7;
        const trend = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            trend.push({
                date: date.toISOString().split('T')[0],
                value: Math.floor(Math.random() * 120) + 30 // 30-150 minutes
            });
        }
        return trend;
    }

    generateWeeklyTrend() {
        // Generate sample weekly trend data
        const weeks = 4;
        const trend = [];
        for (let i = weeks - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            trend.push({
                week: `Week ${weeks - i}`,
                value: Math.floor(Math.random() * 600) + 200 // 200-800 minutes
            });
        }
        return trend;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    /**
     * Public methods
     */
    refresh() {
        this.updateStatistics();
    }

    setUpdateInterval(interval) {
        this.updateInterval = interval;
        if (this.isActive) {
            this.stopRealTimeUpdates();
            this.startRealTimeUpdates();
        }
    }

    getStats() {
        return this.gatherStatistics();
    }
}

// Initialize real-time statistics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.realTimeStats = new RealTimeStatistics();
    console.log('✅ Real-time Statistics initialized');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeStatistics;
}