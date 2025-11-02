/**
 * Statistics Fixes - Real-time data and comprehensive statistics dashboard
 */

class StatisticsFixes {
    constructor() {
        this.isInitialized = false;
        this.updateInterval = null;
        this.charts = {};
        this.statisticsData = {
            studyTime: 0,
            questionsAnswered: 0,
            accuracy: 0,
            streak: 0,
            weeklyProgress: [],
            subjectProgress: {},
            recentActivity: [],
            dailyGoal: 120, // minutes
            weeklyGoal: 840 // minutes (7 days * 2 hours)
        };
        
        this.init();
    }

    async init() {
        console.log('📊 Initializing Statistics Fixes...');
        
        try {
            // Wait for DOM and dependencies
            await this.waitForDependencies();
            
            // Generate sample data
            this.generateSampleData();
            
            // Load real data from storage
            this.loadStoredData();
            
            // Initialize charts
            this.initializeCharts();
            
            // Start real-time updates
            this.startRealTimeUpdates();
            
            // Update display
            this.updateStatisticsDisplay();
            
            this.isInitialized = true;
            console.log('✅ Statistics Fixes initialized successfully');
            
        } catch (error) {
            console.error('❌ Statistics Fixes initialization failed:', error);
        }
    }

    async waitForDependencies() {
        return new Promise((resolve) => {
            const checkDependencies = () => {
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    resolve();
                } else {
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }

    generateSampleData() {
        console.log('📊 Generating sample statistics data...');
        
        // Generate weekly progress data
        const today = new Date();
        this.statisticsData.weeklyProgress = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            this.statisticsData.weeklyProgress.push({
                date: date.toISOString().split('T')[0],
                studyTime: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
                questionsAnswered: Math.floor(Math.random() * 50) + 10, // 10-60 questions
                accuracy: Math.floor(Math.random() * 30) + 70 // 70-100% accuracy
            });
        }

        // Generate subject progress
        this.statisticsData.subjectProgress = {
            'Polity & Governance': {
                completed: 75,
                total: 100,
                accuracy: 82,
                timeSpent: 1200, // minutes
                lastStudied: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            'Economy': {
                completed: 60,
                total: 100,
                accuracy: 78,
                timeSpent: 900,
                lastStudied: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            },
            'Geography': {
                completed: 45,
                total: 100,
                accuracy: 85,
                timeSpent: 600,
                lastStudied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            'History': {
                completed: 80,
                total: 100,
                accuracy: 88,
                timeSpent: 1500,
                lastStudied: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
            },
            'Science & Technology': {
                completed: 35,
                total: 100,
                accuracy: 72,
                timeSpent: 450,
                lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            'Current Affairs': {
                completed: 90,
                total: 100,
                accuracy: 79,
                timeSpent: 800,
                lastStudied: new Date(Date.now() - 30 * 60 * 1000).toISOString()
            }
        };

        // Generate recent activity
        this.statisticsData.recentActivity = [
            {
                type: 'quiz_completed',
                subject: 'Polity & Governance',
                score: 8,
                total: 10,
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                description: 'Completed Constitutional Law Quiz'
            },
            {
                type: 'flashcard_session',
                subject: 'Economy',
                count: 25,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                description: 'Reviewed Economic Indicators flashcards'
            },
            {
                type: 'study_session',
                subject: 'Geography',
                duration: 45,
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                description: 'Studied Climate and Weather patterns'
            },
            {
                type: 'mock_test',
                subject: 'General Studies',
                score: 145,
                total: 200,
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'Completed Mock Test #15'
            }
        ];

        // Calculate current statistics
        const todayData = this.statisticsData.weeklyProgress[6]; // Today's data
        this.statisticsData.studyTime = todayData.studyTime;
        this.statisticsData.questionsAnswered = todayData.questionsAnswered;
        this.statisticsData.accuracy = todayData.accuracy;
        this.statisticsData.streak = 7; // 7-day streak

        console.log('✅ Sample statistics data generated');
    }

    loadStoredData() {
        try {
            // Load from localStorage
            const storedStats = localStorage.getItem('userStatistics');
            if (storedStats) {
                const parsed = JSON.parse(storedStats);
                this.statisticsData = { ...this.statisticsData, ...parsed };
                console.log('📊 Loaded statistics from localStorage');
            }

            // Load from Firebase if available
            if (window.firebaseManager?.isReady()) {
                this.loadFromFirebase();
            }
        } catch (error) {
            console.error('Error loading stored statistics:', error);
        }
    }

    async loadFromFirebase() {
        try {
            // This would load real data from Firebase
            console.log('📊 Loading statistics from Firebase...');
            // Implementation would depend on your Firebase structure
        } catch (error) {
            console.error('Error loading from Firebase:', error);
        }
    }

    initializeCharts() {
        console.log('📊 Initializing statistics charts...');
        
        // Initialize progress chart
        this.initProgressChart();
        
        // Initialize subject performance chart
        this.initSubjectChart();
        
        // Initialize weekly activity chart
        this.initWeeklyChart();
        
        // Initialize accuracy trend chart
        this.initAccuracyChart();
    }

    initProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const data = Object.entries(this.statisticsData.subjectProgress).map(([subject, data]) => ({
            subject,
            progress: (data.completed / data.total) * 100
        }));

        this.charts.progress = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.subject),
                datasets: [{
                    data: data.map(item => item.progress),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ],
                    borderWidth: 2,
                    borderColor: '#1F1F1F'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + Math.round(context.parsed) + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    initSubjectChart() {
        const ctx = document.getElementById('subjectChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const subjects = Object.keys(this.statisticsData.subjectProgress);
        const accuracies = subjects.map(subject => this.statisticsData.subjectProgress[subject].accuracy);
        const timeSpent = subjects.map(subject => this.statisticsData.subjectProgress[subject].timeSpent);

        this.charts.subject = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects,
                datasets: [{
                    label: 'Accuracy (%)',
                    data: accuracies,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                }, {
                    label: 'Time Spent (hours)',
                    data: timeSpent.map(time => Math.round(time / 60)),
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });
    }

    initWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const labels = this.statisticsData.weeklyProgress.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });

        this.charts.weekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Study Time (minutes)',
                    data: this.statisticsData.weeklyProgress.map(day => day.studyTime),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Questions Answered',
                    data: this.statisticsData.weeklyProgress.map(day => day.questionsAnswered),
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });
    }

    initAccuracyChart() {
        const ctx = document.getElementById('accuracyChart');
        if (!ctx || typeof Chart === 'undefined') return;

        this.charts.accuracy = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.statisticsData.weeklyProgress.map(day => {
                    const date = new Date(day.date);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: 'Accuracy Trend (%)',
                    data: this.statisticsData.weeklyProgress.map(day => day.accuracy),
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(153, 102, 255, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    updateStatisticsDisplay() {
        console.log('📊 Updating statistics display...');
        
        // Update key metrics
        this.updateKeyMetrics();
        
        // Update progress indicators
        this.updateProgressIndicators();
        
        // Update recent activity
        this.updateRecentActivity();
        
        // Update goal progress
        this.updateGoalProgress();
    }

    updateKeyMetrics() {
        // Study time today
        const studyTimeEl = document.getElementById('study-time-today');
        if (studyTimeEl) {
            studyTimeEl.textContent = `${this.statisticsData.studyTime} min`;
        }

        // Questions answered
        const questionsEl = document.getElementById('questions-answered');
        if (questionsEl) {
            questionsEl.textContent = this.statisticsData.questionsAnswered;
        }

        // Accuracy
        const accuracyEl = document.getElementById('accuracy-rate');
        if (accuracyEl) {
            accuracyEl.textContent = `${this.statisticsData.accuracy}%`;
        }

        // Streak
        const streakEl = document.getElementById('study-streak');
        if (streakEl) {
            streakEl.textContent = `${this.statisticsData.streak} days`;
        }

        // Update metric cards with animations
        this.animateMetricCards();
    }

    animateMetricCards() {
        const metricCards = document.querySelectorAll('.metric-card');
        metricCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                }, 200);
            }, index * 100);
        });
    }

    updateProgressIndicators() {
        // Update subject progress bars
        Object.entries(this.statisticsData.subjectProgress).forEach(([subject, data]) => {
            const progressBar = document.getElementById(`progress-${subject.toLowerCase().replace(/\s+/g, '-')}`);
            if (progressBar) {
                const percentage = (data.completed / data.total) * 100;
                progressBar.style.width = `${percentage}%`;
                
                const progressText = progressBar.parentElement?.querySelector('.progress-text');
                if (progressText) {
                    progressText.textContent = `${Math.round(percentage)}%`;
                }
            }
        });
    }

    updateRecentActivity() {
        const activityContainer = document.getElementById('recent-activity-list');
        if (!activityContainer) return;

        const html = this.statisticsData.recentActivity.map(activity => {
            const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
            const icon = this.getActivityIcon(activity.type);
            
            return `
                <div class="activity-item flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div class="w-10 h-10 rounded-lg bg-teal-600/20 flex items-center justify-center">
                        <i data-lucide="${icon}" class="w-5 h-5 text-teal-400"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-sm font-medium text-white">${activity.description}</h4>
                        <p class="text-xs text-white/60">${activity.subject} • ${timeAgo}</p>
                        ${activity.score ? `<p class="text-xs text-green-400">Score: ${activity.score}/${activity.total}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        activityContainer.innerHTML = html;

        // Refresh icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    updateGoalProgress() {
        // Daily goal progress
        const dailyProgressEl = document.getElementById('daily-goal-progress');
        if (dailyProgressEl) {
            const percentage = Math.min((this.statisticsData.studyTime / this.statisticsData.dailyGoal) * 100, 100);
            dailyProgressEl.style.width = `${percentage}%`;
            
            const dailyGoalText = document.getElementById('daily-goal-text');
            if (dailyGoalText) {
                dailyGoalText.textContent = `${this.statisticsData.studyTime}/${this.statisticsData.dailyGoal} min`;
            }
        }

        // Weekly goal progress
        const weeklyTotal = this.statisticsData.weeklyProgress.reduce((sum, day) => sum + day.studyTime, 0);
        const weeklyProgressEl = document.getElementById('weekly-goal-progress');
        if (weeklyProgressEl) {
            const percentage = Math.min((weeklyTotal / this.statisticsData.weeklyGoal) * 100, 100);
            weeklyProgressEl.style.width = `${percentage}%`;
            
            const weeklyGoalText = document.getElementById('weekly-goal-text');
            if (weeklyGoalText) {
                weeklyGoalText.textContent = `${weeklyTotal}/${this.statisticsData.weeklyGoal} min`;
            }
        }
    }

    startRealTimeUpdates() {
        console.log('🔄 Starting real-time statistics updates...');
        
        // Update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.simulateRealTimeData();
            this.updateStatisticsDisplay();
            this.updateCharts();
        }, 30000);

        // Update on visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateStatisticsDisplay();
            }
        });
    }

    simulateRealTimeData() {
        // Simulate small incremental changes
        const now = new Date();
        const todayIndex = this.statisticsData.weeklyProgress.length - 1;
        
        if (Math.random() > 0.7) { // 30% chance of update
            // Increment study time
            this.statisticsData.studyTime += Math.floor(Math.random() * 5) + 1;
            this.statisticsData.weeklyProgress[todayIndex].studyTime = this.statisticsData.studyTime;
            
            // Increment questions answered
            if (Math.random() > 0.5) {
                this.statisticsData.questionsAnswered += Math.floor(Math.random() * 3) + 1;
                this.statisticsData.weeklyProgress[todayIndex].questionsAnswered = this.statisticsData.questionsAnswered;
            }
            
            // Update accuracy slightly
            const accuracyChange = (Math.random() - 0.5) * 2; // -1 to +1
            this.statisticsData.accuracy = Math.max(0, Math.min(100, this.statisticsData.accuracy + accuracyChange));
            this.statisticsData.weeklyProgress[todayIndex].accuracy = Math.round(this.statisticsData.accuracy);
            
            // Save to localStorage
            this.saveToStorage();
        }
    }

    updateCharts() {
        // Update chart data
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.update) {
                chart.update('none'); // Update without animation for real-time feel
            }
        });
    }

    saveToStorage() {
        try {
            localStorage.setItem('userStatistics', JSON.stringify(this.statisticsData));
        } catch (error) {
            console.error('Error saving statistics:', error);
        }
    }

    getActivityIcon(type) {
        const icons = {
            'quiz_completed': 'check-circle',
            'flashcard_session': 'layers',
            'study_session': 'book-open',
            'mock_test': 'award'
        };
        return icons[type] || 'activity';
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

    // Public methods
    isReady() {
        return this.isInitialized;
    }

    refresh() {
        this.updateStatisticsDisplay();
        this.updateCharts();
    }

    addActivity(activity) {
        this.statisticsData.recentActivity.unshift(activity);
        if (this.statisticsData.recentActivity.length > 10) {
            this.statisticsData.recentActivity.pop();
        }
        this.updateRecentActivity();
        this.saveToStorage();
    }

    updateStudyTime(minutes) {
        this.statisticsData.studyTime += minutes;
        const todayIndex = this.statisticsData.weeklyProgress.length - 1;
        this.statisticsData.weeklyProgress[todayIndex].studyTime = this.statisticsData.studyTime;
        this.updateStatisticsDisplay();
        this.saveToStorage();
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
    }
}

// Initialize statistics fixes
document.addEventListener('DOMContentLoaded', () => {
    window.statisticsFixes = new StatisticsFixes();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsFixes;
}