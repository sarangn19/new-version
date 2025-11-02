// Study Tools - Advanced study features including Pomodoro timer, streak tracking, goals, and spaced repetition

// PomodoroTimer - Integrated study timer with work/break cycles
class PomodoroTimer {
  constructor(options = {}) {
    this.workTime = options.workTime || 25; // minutes
    this.breakTime = options.breakTime || 5; // minutes
    this.longBreakTime = options.longBreakTime || 15; // minutes
    this.sessionsUntilLongBreak = options.sessionsUntilLongBreak || 4;
    
    this.currentTime = 0; // seconds
    this.isRunning = false;
    this.isPaused = false;
    this.currentPhase = 'work'; // 'work', 'break', 'longBreak'
    this.completedSessions = 0;
    this.totalWorkTime = 0; // total work time in seconds
    
    this.timer = null;
    this.callbacks = {
      onTick: null,
      onPhaseComplete: null,
      onSessionComplete: null,
      onTimerStart: null,
      onTimerPause: null,
      onTimerStop: null
    };
    
    this.sessionData = {
      startTime: null,
      endTime: null,
      workSessions: 0,
      breaksTaken: 0,
      totalFocusTime: 0,
      interruptions: 0
    };
    
    this.loadSettings();
    this.initializeAudio();
  }

  // Load settings from profile manager
  loadSettings() {
    if (window.profileManager) {
      const studyPrefs = window.profileManager.getPreferences('study');
      if (studyPrefs) {
        this.workTime = studyPrefs.pomodoroWorkTime || 25;
        this.breakTime = studyPrefs.pomodoroBreakTime || 5;
      }
    }
    this.resetTimer();
  }

  // Initialize audio notifications
  initializeAudio() {
    this.sounds = {
      workComplete: this.createBeep(800, 200),
      breakComplete: this.createBeep(600, 200),
      tick: this.createBeep(400, 50)
    };
  }

  // Create beep sound using Web Audio API
  createBeep(frequency, duration) {
    return () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
      } catch (error) {
        console.warn('Audio not supported:', error);
      }
    };
  }

  // Set callback functions
  setCallback(event, callback) {
    if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase() + event.slice(1)}`)) {
      this.callbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = callback;
    }
  }

  // Start the timer
  start() {
    if (this.isRunning && !this.isPaused) return;
    
    this.isRunning = true;
    this.isPaused = false;
    
    if (!this.sessionData.startTime) {
      this.sessionData.startTime = new Date();
    }
    
    this.timer = setInterval(() => {
      this.tick();
    }, 1000);
    
    if (this.callbacks.onTimerStart) {
      this.callbacks.onTimerStart(this.getStatus());
    }
    
    this.saveSession();
  }

  // Pause the timer
  pause() {
    if (!this.isRunning || this.isPaused) return;
    
    this.isPaused = true;
    clearInterval(this.timer);
    
    if (this.callbacks.onTimerPause) {
      this.callbacks.onTimerPause(this.getStatus());
    }
    
    this.saveSession();
  }

  // Stop the timer
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    clearInterval(this.timer);
    
    if (this.sessionData.startTime) {
      this.sessionData.endTime = new Date();
      this.completeSession();
    }
    
    this.resetTimer();
    
    if (this.callbacks.onTimerStop) {
      this.callbacks.onTimerStop(this.getStatus());
    }
  }

  // Reset timer to current phase duration
  resetTimer() {
    this.currentTime = this.getCurrentPhaseDuration() * 60; // convert to seconds
    this.isRunning = false;
    this.isPaused = false;
    clearInterval(this.timer);
  }

  // Timer tick function
  tick() {
    if (this.currentTime > 0) {
      this.currentTime--;
      
      // Track work time
      if (this.currentPhase === 'work') {
        this.totalWorkTime++;
        this.sessionData.totalFocusTime++;
      }
      
      if (this.callbacks.onTick) {
        this.callbacks.onTick(this.getStatus());
      }
    } else {
      this.completePhase();
    }
  }

  // Complete current phase and switch to next
  completePhase() {
    const completedPhase = this.currentPhase;
    
    // Play completion sound
    if (completedPhase === 'work') {
      this.sounds.workComplete();
      this.completedSessions++;
      this.sessionData.workSessions++;
    } else {
      this.sounds.breakComplete();
      this.sessionData.breaksTaken++;
    }
    
    // Determine next phase
    if (completedPhase === 'work') {
      if (this.completedSessions % this.sessionsUntilLongBreak === 0) {
        this.currentPhase = 'longBreak';
      } else {
        this.currentPhase = 'break';
      }
    } else {
      this.currentPhase = 'work';
    }
    
    // Reset timer for new phase
    this.resetTimer();
    
    if (this.callbacks.onPhaseComplete) {
      this.callbacks.onPhaseComplete({
        completedPhase,
        nextPhase: this.currentPhase,
        completedSessions: this.completedSessions,
        status: this.getStatus()
      });
    }
    
    this.saveSession();
  }

  // Complete entire study session
  completeSession() {
    const sessionSummary = {
      ...this.sessionData,
      duration: this.sessionData.endTime - this.sessionData.startTime,
      completedSessions: this.completedSessions,
      totalWorkTime: this.totalWorkTime
    };
    
    // Save to profile manager if available
    if (window.profileManager) {
      this.saveSessionToProfile(sessionSummary);
    }
    
    if (this.callbacks.onSessionComplete) {
      this.callbacks.onSessionComplete(sessionSummary);
    }
    
    // Reset session data
    this.sessionData = {
      startTime: null,
      endTime: null,
      workSessions: 0,
      breaksTaken: 0,
      totalFocusTime: 0,
      interruptions: 0
    };
  }

  // Save session data to profile
  saveSessionToProfile(sessionSummary) {
    try {
      const profile = window.profileManager.profileData;
      
      // Update study stats
      profile.studyStats.totalHours += sessionSummary.totalFocusTime / 3600;
      
      // Save session history
      if (!profile.sessionHistory) {
        profile.sessionHistory = [];
      }
      
      profile.sessionHistory.unshift({
        date: sessionSummary.startTime,
        duration: sessionSummary.totalFocusTime,
        sessions: sessionSummary.workSessions,
        breaks: sessionSummary.breaksTaken,
        type: 'pomodoro'
      });
      
      // Keep only last 100 sessions
      if (profile.sessionHistory.length > 100) {
        profile.sessionHistory = profile.sessionHistory.slice(0, 100);
      }
      
      window.profileManager.saveProfile();
    } catch (error) {
      console.error('Error saving session to profile:', error);
    }
  }

  // Save current session state to localStorage
  saveSession() {
    try {
      const sessionState = {
        currentTime: this.currentTime,
        currentPhase: this.currentPhase,
        completedSessions: this.completedSessions,
        totalWorkTime: this.totalWorkTime,
        sessionData: this.sessionData,
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        timestamp: Date.now()
      };
      
      localStorage.setItem('pomodoroSession', JSON.stringify(sessionState));
    } catch (error) {
      console.error('Error saving session state:', error);
    }
  }

  // Load session state from localStorage
  loadSession() {
    try {
      const saved = localStorage.getItem('pomodoroSession');
      if (!saved) return false;
      
      const sessionState = JSON.parse(saved);
      
      // Check if session is recent (within 24 hours)
      const timeDiff = Date.now() - sessionState.timestamp;
      if (timeDiff > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('pomodoroSession');
        return false;
      }
      
      // Restore state
      this.currentTime = sessionState.currentTime;
      this.currentPhase = sessionState.currentPhase;
      this.completedSessions = sessionState.completedSessions;
      this.totalWorkTime = sessionState.totalWorkTime;
      this.sessionData = sessionState.sessionData;
      
      return true;
    } catch (error) {
      console.error('Error loading session state:', error);
      return false;
    }
  }

  // Get current phase duration in minutes
  getCurrentPhaseDuration() {
    switch (this.currentPhase) {
      case 'work':
        return this.workTime;
      case 'break':
        return this.breakTime;
      case 'longBreak':
        return this.longBreakTime;
      default:
        return this.workTime;
    }
  }

  // Get current timer status
  getStatus() {
    return {
      currentTime: this.currentTime,
      currentPhase: this.currentPhase,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      completedSessions: this.completedSessions,
      totalWorkTime: this.totalWorkTime,
      progress: 1 - (this.currentTime / (this.getCurrentPhaseDuration() * 60)),
      timeRemaining: this.formatTime(this.currentTime),
      phaseLabel: this.getPhaseLabel()
    };
  }

  // Get human-readable phase label
  getPhaseLabel() {
    switch (this.currentPhase) {
      case 'work':
        return 'Focus Time';
      case 'break':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Focus Time';
    }
  }

  // Format time in MM:SS format
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Update timer settings
  updateSettings(settings) {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.pause();
    }
    
    if (settings.workTime) this.workTime = settings.workTime;
    if (settings.breakTime) this.breakTime = settings.breakTime;
    if (settings.longBreakTime) this.longBreakTime = settings.longBreakTime;
    if (settings.sessionsUntilLongBreak) this.sessionsUntilLongBreak = settings.sessionsUntilLongBreak;
    
    // Save to profile manager
    if (window.profileManager && (settings.workTime || settings.breakTime)) {
      window.profileManager.updatePreferences('study', {
        pomodoroWorkTime: this.workTime,
        pomodoroBreakTime: this.breakTime
      });
    }
    
    // Reset current timer if not running
    if (!wasRunning) {
      this.resetTimer();
    }
  }

  // Skip current phase
  skipPhase() {
    if (this.isRunning) {
      this.completePhase();
    }
  }

  // Add interruption (for tracking focus quality)
  addInterruption() {
    this.sessionData.interruptions++;
    this.saveSession();
  }

  // Get session statistics
  getSessionStats() {
    return {
      ...this.sessionData,
      completedSessions: this.completedSessions,
      totalWorkTime: this.totalWorkTime,
      currentPhase: this.currentPhase,
      focusQuality: this.calculateFocusQuality()
    };
  }

  // Calculate focus quality based on interruptions
  calculateFocusQuality() {
    if (this.sessionData.workSessions === 0) return 100;
    
    const interruptionRate = this.sessionData.interruptions / this.sessionData.workSessions;
    return Math.max(0, Math.min(100, 100 - (interruptionRate * 20)));
  }

  // Cleanup timer
  destroy() {
    this.stop();
    this.callbacks = {};
  }
}

// StudyStreakTracker - Daily and weekly streak monitoring with motivational feedback
class StudyStreakTracker {
  constructor() {
    this.streakData = this.loadStreakData();
    this.milestones = [7, 14, 30, 60, 100, 365]; // Days for milestone celebrations
    this.motivationalMessages = {
      start: [
        "Great start! Every expert was once a beginner.",
        "Your learning journey begins now!",
        "First step taken - keep the momentum going!"
      ],
      maintain: [
        "Consistency is key - you're doing great!",
        "Keep up the excellent work!",
        "Your dedication is paying off!",
        "Steady progress leads to success!"
      ],
      milestone: [
        "Incredible milestone achieved! 🎉",
        "Your persistence is inspiring!",
        "What an amazing achievement!",
        "You're building an incredible habit!"
      ],
      recovery: [
        "Welcome back! Every comeback starts with a single step.",
        "Don't worry about the break - focus on today!",
        "Consistency matters more than perfection.",
        "Ready to rebuild that streak?"
      ],
      longStreak: [
        "You're on fire! This streak is amazing!",
        "Unstoppable dedication - keep it up!",
        "Your commitment is truly impressive!",
        "This is what success looks like!"
      ]
    };
  }

  // Load streak data from localStorage
  loadStreakData() {
    const defaultData = {
      currentStreak: 0,
      longestStreak: 0,
      totalStudyDays: 0,
      lastStudyDate: null,
      weeklyStreaks: [], // Array of weekly streak objects
      studyHistory: {}, // Date -> study minutes mapping
      milestoneAchievements: [],
      streakRecoveries: 0
    };

    try {
      // Try to get from profile manager first
      if (window.profileManager) {
        const profile = window.profileManager.profileData;
        if (profile.streakData) {
          return { ...defaultData, ...profile.streakData };
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('studyStreakData');
      if (saved) {
        return { ...defaultData, ...JSON.parse(saved) };
      }

      return defaultData;
    } catch (error) {
      console.error('Error loading streak data:', error);
      return defaultData;
    }
  }

  // Save streak data
  saveStreakData() {
    try {
      // Save to profile manager if available
      if (window.profileManager) {
        window.profileManager.profileData.streakData = this.streakData;
        window.profileManager.saveProfile();
      }

      // Also save to localStorage as backup
      localStorage.setItem('studyStreakData', JSON.stringify(this.streakData));
    } catch (error) {
      console.error('Error saving streak data:', error);
    }
  }

  // Record a study session
  recordStudySession(minutes = 0, date = null) {
    const studyDate = date ? new Date(date) : new Date();
    const dateKey = this.formatDateKey(studyDate);
    const today = this.formatDateKey(new Date());

    // Add to study history
    if (!this.streakData.studyHistory[dateKey]) {
      this.streakData.studyHistory[dateKey] = 0;
    }
    this.streakData.studyHistory[dateKey] += minutes;

    // Update streak only if studying today
    if (dateKey === today) {
      this.updateStreak(studyDate);
    }

    this.saveStreakData();
    return this.getStreakStatus();
  }

  // Update streak based on study date
  updateStreak(studyDate) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const studyDateKey = this.formatDateKey(studyDate);
    const todayKey = this.formatDateKey(today);
    const yesterdayKey = this.formatDateKey(yesterday);

    // If studying today
    if (studyDateKey === todayKey) {
      // Check if we already counted today
      if (this.streakData.lastStudyDate === todayKey) {
        return; // Already counted today
      }

      // Check if we studied yesterday or this is first day
      if (this.streakData.lastStudyDate === yesterdayKey || this.streakData.currentStreak === 0) {
        this.streakData.currentStreak++;
        this.streakData.totalStudyDays++;
      } else {
        // Streak broken, start new one
        this.streakData.streakRecoveries++;
        this.streakData.currentStreak = 1;
        this.streakData.totalStudyDays++;
      }

      this.streakData.lastStudyDate = todayKey;

      // Update longest streak
      if (this.streakData.currentStreak > this.streakData.longestStreak) {
        this.streakData.longestStreak = this.streakData.currentStreak;
      }

      // Check for milestones
      this.checkMilestones();
      
      // Update weekly streak
      this.updateWeeklyStreak();
    }
  }

  // Check and record milestone achievements
  checkMilestones() {
    const currentStreak = this.streakData.currentStreak;
    
    for (const milestone of this.milestones) {
      if (currentStreak === milestone) {
        const achievement = {
          milestone,
          date: new Date().toISOString(),
          type: 'streak'
        };
        
        if (!this.streakData.milestoneAchievements.find(a => a.milestone === milestone && a.type === 'streak')) {
          this.streakData.milestoneAchievements.push(achievement);
          this.celebrateMilestone(milestone);
        }
        break;
      }
    }
  }

  // Update weekly streak data
  updateWeeklyStreak() {
    const today = new Date();
    const weekStart = this.getWeekStart(today);
    const weekKey = this.formatDateKey(weekStart);

    // Find or create current week entry
    let currentWeek = this.streakData.weeklyStreaks.find(w => w.weekStart === weekKey);
    
    if (!currentWeek) {
      currentWeek = {
        weekStart: weekKey,
        daysStudied: 0,
        totalMinutes: 0,
        studyDays: []
      };
      this.streakData.weeklyStreaks.unshift(currentWeek);
    }

    // Update current week data
    const todayKey = this.formatDateKey(today);
    if (!currentWeek.studyDays.includes(todayKey)) {
      currentWeek.studyDays.push(todayKey);
      currentWeek.daysStudied = currentWeek.studyDays.length;
    }

    // Calculate total minutes for the week
    currentWeek.totalMinutes = currentWeek.studyDays.reduce((total, day) => {
      return total + (this.streakData.studyHistory[day] || 0);
    }, 0);

    // Keep only last 12 weeks
    if (this.streakData.weeklyStreaks.length > 12) {
      this.streakData.weeklyStreaks = this.streakData.weeklyStreaks.slice(0, 12);
    }
  }

  // Get start of week (Monday)
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Check if streak is at risk (no study yesterday or today)
  isStreakAtRisk() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayKey = this.formatDateKey(today);
    const yesterdayKey = this.formatDateKey(yesterday);

    // If we haven't studied today and last study was before yesterday
    return this.streakData.lastStudyDate !== todayKey && 
           this.streakData.lastStudyDate !== yesterdayKey &&
           this.streakData.currentStreak > 0;
  }

  // Get current streak status
  getStreakStatus() {
    const today = new Date();
    const todayKey = this.formatDateKey(today);
    const studiedToday = this.streakData.lastStudyDate === todayKey;
    const isAtRisk = this.isStreakAtRisk();

    return {
      currentStreak: this.streakData.currentStreak,
      longestStreak: this.streakData.longestStreak,
      totalStudyDays: this.streakData.totalStudyDays,
      studiedToday,
      isAtRisk,
      streakRecoveries: this.streakData.streakRecoveries,
      todayMinutes: this.streakData.studyHistory[todayKey] || 0,
      weeklyProgress: this.getWeeklyProgress(),
      motivationalMessage: this.getMotivationalMessage()
    };
  }

  // Get weekly progress
  getWeeklyProgress() {
    const currentWeek = this.streakData.weeklyStreaks[0];
    if (!currentWeek) {
      return { daysStudied: 0, totalMinutes: 0, weeklyGoal: 7 };
    }

    return {
      daysStudied: currentWeek.daysStudied,
      totalMinutes: currentWeek.totalMinutes,
      weeklyGoal: 7,
      progress: (currentWeek.daysStudied / 7) * 100
    };
  }

  // Get appropriate motivational message
  getMotivationalMessage() {
    const status = this.streakData.currentStreak;
    const studiedToday = this.streakData.lastStudyDate === this.formatDateKey(new Date());
    const isAtRisk = this.isStreakAtRisk();

    let messageType;
    
    if (isAtRisk) {
      messageType = 'recovery';
    } else if (status === 0 || status === 1) {
      messageType = 'start';
    } else if (this.milestones.includes(status)) {
      messageType = 'milestone';
    } else if (status >= 30) {
      messageType = 'longStreak';
    } else {
      messageType = 'maintain';
    }

    const messages = this.motivationalMessages[messageType];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Celebrate milestone achievement
  celebrateMilestone(milestone) {
    // Trigger celebration event
    window.dispatchEvent(new CustomEvent('streakMilestone', {
      detail: {
        milestone,
        currentStreak: this.streakData.currentStreak,
        message: this.getMotivationalMessage()
      }
    }));

    // Show notification if available
    if (window.profileManager && window.profileManager.announceToScreenReader) {
      window.profileManager.announceToScreenReader(
        `Congratulations! You've reached a ${milestone}-day study streak!`,
        'assertive'
      );
    }
  }

  // Get streak history for visualization
  getStreakHistory(days = 30) {
    const history = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = this.formatDateKey(date);
      
      history.push({
        date: dateKey,
        minutes: this.streakData.studyHistory[dateKey] || 0,
        hasStudy: (this.streakData.studyHistory[dateKey] || 0) > 0
      });
    }

    return history;
  }

  // Get weekly streak history
  getWeeklyStreakHistory() {
    return [...this.streakData.weeklyStreaks];
  }

  // Reset streak (for testing or user request)
  resetStreak() {
    this.streakData.currentStreak = 0;
    this.streakData.lastStudyDate = null;
    this.saveStreakData();
    return this.getStreakStatus();
  }

  // Manually set streak (for data migration or correction)
  setStreak(days, lastStudyDate = null) {
    this.streakData.currentStreak = Math.max(0, days);
    if (lastStudyDate) {
      this.streakData.lastStudyDate = this.formatDateKey(new Date(lastStudyDate));
    }
    
    if (this.streakData.currentStreak > this.streakData.longestStreak) {
      this.streakData.longestStreak = this.streakData.currentStreak;
    }
    
    this.saveStreakData();
    return this.getStreakStatus();
  }

  // Get streak recovery suggestions
  getRecoverySuggestions() {
    const isAtRisk = this.isStreakAtRisk();
    const currentStreak = this.streakData.currentStreak;

    if (!isAtRisk) {
      return null;
    }

    return {
      message: "Your streak is at risk! Here's how to get back on track:",
      suggestions: [
        "Start with just 15 minutes of study today",
        "Review your notes from yesterday",
        "Do a quick practice quiz",
        "Set a study reminder for tomorrow",
        "Remember: consistency beats perfection"
      ],
      urgency: currentStreak > 7 ? 'high' : 'medium'
    };
  }

  // Format date as YYYY-MM-DD
  formatDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  // Get statistics for analytics
  getAnalytics() {
    const history = this.getStreakHistory(90); // Last 90 days
    const totalMinutes = Object.values(this.streakData.studyHistory).reduce((sum, minutes) => sum + minutes, 0);
    const studyDays = Object.keys(this.streakData.studyHistory).length;
    const averageMinutesPerDay = studyDays > 0 ? totalMinutes / studyDays : 0;

    return {
      currentStreak: this.streakData.currentStreak,
      longestStreak: this.streakData.longestStreak,
      totalStudyDays: this.streakData.totalStudyDays,
      totalMinutes,
      averageMinutesPerDay: Math.round(averageMinutesPerDay),
      streakRecoveries: this.streakData.streakRecoveries,
      milestoneAchievements: this.streakData.milestoneAchievements.length,
      consistency: studyDays > 0 ? (this.streakData.totalStudyDays / studyDays) * 100 : 0,
      weeklyAverage: this.calculateWeeklyAverage()
    };
  }

  // Calculate weekly average study days
  calculateWeeklyAverage() {
    if (this.streakData.weeklyStreaks.length === 0) return 0;
    
    const totalDays = this.streakData.weeklyStreaks.reduce((sum, week) => sum + week.daysStudied, 0);
    return totalDays / this.streakData.weeklyStreaks.length;
  }
}

// GoalManager - SMART goal setting with progress tracking and deadline reminders
class GoalManager {
  constructor() {
    this.goals = this.loadGoals();
    this.goalTypes = {
      study_time: 'Study Time',
      practice_sessions: 'Practice Sessions',
      streak_days: 'Study Streak',
      accuracy_rate: 'Accuracy Rate',
      topics_covered: 'Topics Covered',
      custom: 'Custom Goal'
    };
    
    this.timeframes = {
      daily: { label: 'Daily', days: 1 },
      weekly: { label: 'Weekly', days: 7 },
      monthly: { label: 'Monthly', days: 30 },
      quarterly: { label: 'Quarterly', days: 90 },
      yearly: { label: 'Yearly', days: 365 }
    };
    
    this.achievements = this.loadAchievements();
    this.notifications = [];
    
    // Initialize deadline checking
    this.initializeDeadlineChecking();
  }

  // Load goals from storage
  loadGoals() {
    const defaultGoals = [];
    
    try {
      // Try to get from profile manager first
      if (window.profileManager) {
        const profile = window.profileManager.profileData;
        if (profile.goals) {
          return profile.goals;
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('studyGoals');
      if (saved) {
        return JSON.parse(saved);
      }

      return defaultGoals;
    } catch (error) {
      console.error('Error loading goals:', error);
      return defaultGoals;
    }
  }

  // Load achievements from storage
  loadAchievements() {
    const defaultAchievements = [];
    
    try {
      // Try to get from profile manager first
      if (window.profileManager) {
        const profile = window.profileManager.profileData;
        if (profile.goalAchievements) {
          return profile.goalAchievements;
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('goalAchievements');
      if (saved) {
        return JSON.parse(saved);
      }

      return defaultAchievements;
    } catch (error) {
      console.error('Error loading achievements:', error);
      return defaultAchievements;
    }
  }

  // Save goals to storage
  saveGoals() {
    try {
      // Save to profile manager if available
      if (window.profileManager) {
        window.profileManager.profileData.goals = this.goals;
        window.profileManager.profileData.goalAchievements = this.achievements;
        window.profileManager.saveProfile();
      }

      // Also save to localStorage as backup
      localStorage.setItem('studyGoals', JSON.stringify(this.goals));
      localStorage.setItem('goalAchievements', JSON.stringify(this.achievements));
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  }

  // Create a new SMART goal
  createGoal(goalData) {
    // Validate SMART criteria
    const validation = this.validateSMARTGoal(goalData);
    if (!validation.isValid) {
      throw new Error(`Invalid goal: ${validation.errors.join(', ')}`);
    }

    const goal = {
      id: this.generateGoalId(),
      title: goalData.title,
      description: goalData.description || '',
      type: goalData.type,
      target: goalData.target,
      unit: goalData.unit || '',
      timeframe: goalData.timeframe,
      deadline: new Date(goalData.deadline),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active', // active, completed, paused, cancelled
      progress: 0,
      currentValue: 0,
      milestones: goalData.milestones || [],
      category: goalData.category || 'general',
      priority: goalData.priority || 'medium', // low, medium, high
      reminders: goalData.reminders || [],
      notes: [],
      tags: goalData.tags || []
    };

    this.goals.push(goal);
    this.saveGoals();
    
    // Set up reminders
    this.setupReminders(goal);
    
    // Trigger goal created event
    this.triggerEvent('goalCreated', goal);
    
    return goal;
  }

  // Validate SMART goal criteria
  validateSMARTGoal(goalData) {
    const errors = [];
    
    // Specific: Clear and well-defined
    if (!goalData.title || goalData.title.trim().length < 3) {
      errors.push('Goal title must be specific and at least 3 characters long');
    }
    
    // Measurable: Has quantifiable target
    if (!goalData.target || goalData.target <= 0) {
      errors.push('Goal must have a measurable target greater than 0');
    }
    
    if (!goalData.unit && goalData.type !== 'custom') {
      errors.push('Goal must specify a unit of measurement');
    }
    
    // Achievable: Realistic target
    if (goalData.target > this.getRealisticLimit(goalData.type, goalData.timeframe)) {
      errors.push('Goal target may be unrealistic for the given timeframe');
    }
    
    // Relevant: Has a valid type and category
    if (!this.goalTypes[goalData.type]) {
      errors.push('Goal must have a valid type');
    }
    
    // Time-bound: Has a deadline
    if (!goalData.deadline) {
      errors.push('Goal must have a deadline');
    } else {
      const deadline = new Date(goalData.deadline);
      const now = new Date();
      if (deadline <= now) {
        errors.push('Goal deadline must be in the future');
      }
      
      // Check if deadline is too far in the future (more than 2 years)
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      if (deadline > twoYearsFromNow) {
        errors.push('Goal deadline should not be more than 2 years in the future');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get realistic limits for different goal types
  getRealisticLimit(type, timeframe) {
    const limits = {
      study_time: {
        daily: 12, // hours
        weekly: 70,
        monthly: 300,
        quarterly: 900,
        yearly: 3650
      },
      practice_sessions: {
        daily: 10,
        weekly: 50,
        monthly: 200,
        quarterly: 600,
        yearly: 2400
      },
      streak_days: {
        daily: 1,
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        yearly: 365
      },
      accuracy_rate: {
        daily: 100,
        weekly: 100,
        monthly: 100,
        quarterly: 100,
        yearly: 100
      },
      topics_covered: {
        daily: 5,
        weekly: 25,
        monthly: 100,
        quarterly: 300,
        yearly: 1200
      }
    };
    
    return limits[type]?.[timeframe] || 1000000; // Default high limit for custom goals
  }

  // Update goal progress
  updateGoalProgress(goalId, newValue, notes = '') {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    if (goal.status !== 'active') {
      throw new Error('Cannot update progress for inactive goal');
    }

    const previousValue = goal.currentValue;
    goal.currentValue = Math.max(0, newValue);
    goal.progress = Math.min(100, (goal.currentValue / goal.target) * 100);
    goal.updatedAt = new Date();

    // Add progress note if provided
    if (notes) {
      goal.notes.push({
        date: new Date(),
        type: 'progress',
        content: notes,
        value: newValue,
        previousValue
      });
    }

    // Check for milestone achievements
    this.checkMilestones(goal);

    // Check if goal is completed
    if (goal.progress >= 100 && goal.status === 'active') {
      this.completeGoal(goalId);
    }

    this.saveGoals();
    this.triggerEvent('goalProgressUpdated', goal);
    
    return goal;
  }

  // Check and celebrate milestone achievements
  checkMilestones(goal) {
    if (!goal.milestones || goal.milestones.length === 0) return;

    for (const milestone of goal.milestones) {
      if (goal.currentValue >= milestone.value && !milestone.achieved) {
        milestone.achieved = true;
        milestone.achievedAt = new Date();
        
        // Record achievement
        this.achievements.push({
          id: this.generateAchievementId(),
          goalId: goal.id,
          goalTitle: goal.title,
          type: 'milestone',
          milestone: milestone.value,
          achievedAt: new Date(),
          description: `Reached ${milestone.value} ${goal.unit} milestone for "${goal.title}"`
        });

        // Trigger celebration
        this.celebrateMilestone(goal, milestone);
      }
    }
  }

  // Complete a goal
  completeGoal(goalId) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    goal.status = 'completed';
    goal.completedAt = new Date();
    goal.progress = 100;

    // Record achievement
    this.achievements.push({
      id: this.generateAchievementId(),
      goalId: goal.id,
      goalTitle: goal.title,
      type: 'completion',
      achievedAt: new Date(),
      description: `Completed goal: "${goal.title}"`,
      timeframe: goal.timeframe,
      target: goal.target,
      unit: goal.unit
    });

    // Celebrate completion
    this.celebrateGoalCompletion(goal);
    
    this.saveGoals();
    this.triggerEvent('goalCompleted', goal);
    
    return goal;
  }

  // Celebrate milestone achievement
  celebrateMilestone(goal, milestone) {
    const celebration = {
      type: 'milestone',
      goalTitle: goal.title,
      milestone: milestone.value,
      unit: goal.unit,
      message: `🎉 Milestone achieved! You've reached ${milestone.value} ${goal.unit} for "${goal.title}"!`
    };

    this.triggerEvent('milestoneAchieved', celebration);
    
    // Show notification
    this.showNotification(celebration.message, 'success');
    
    // Announce to screen reader
    if (window.profileManager && window.profileManager.announceToScreenReader) {
      window.profileManager.announceToScreenReader(celebration.message, 'assertive');
    }
  }

  // Celebrate goal completion
  celebrateGoalCompletion(goal) {
    const celebration = {
      type: 'completion',
      goalTitle: goal.title,
      target: goal.target,
      unit: goal.unit,
      timeframe: goal.timeframe,
      message: `🏆 Goal completed! You've achieved "${goal.title}" - ${goal.target} ${goal.unit}!`
    };

    this.triggerEvent('goalCompleted', celebration);
    
    // Show notification
    this.showNotification(celebration.message, 'success');
    
    // Announce to screen reader
    if (window.profileManager && window.profileManager.announceToScreenReader) {
      window.profileManager.announceToScreenReader(celebration.message, 'assertive');
    }
  }

  // Get all goals with optional filtering
  getGoals(filters = {}) {
    let filteredGoals = [...this.goals];

    // Filter by status
    if (filters.status) {
      filteredGoals = filteredGoals.filter(goal => goal.status === filters.status);
    }

    // Filter by type
    if (filters.type) {
      filteredGoals = filteredGoals.filter(goal => goal.type === filters.type);
    }

    // Filter by category
    if (filters.category) {
      filteredGoals = filteredGoals.filter(goal => goal.category === filters.category);
    }

    // Filter by priority
    if (filters.priority) {
      filteredGoals = filteredGoals.filter(goal => goal.priority === filters.priority);
    }

    // Filter by deadline proximity
    if (filters.deadlineDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + filters.deadlineDays);
      filteredGoals = filteredGoals.filter(goal => goal.deadline <= targetDate);
    }

    // Sort by priority and deadline
    filteredGoals.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.deadline) - new Date(b.deadline);
    });

    return filteredGoals;
  }

  // Get goal by ID
  getGoal(goalId) {
    return this.goals.find(g => g.id === goalId);
  }

  // Update goal details
  updateGoal(goalId, updates) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Validate updates if they affect SMART criteria
    if (updates.target || updates.deadline || updates.type) {
      const updatedGoal = { ...goal, ...updates };
      const validation = this.validateSMARTGoal(updatedGoal);
      if (!validation.isValid) {
        throw new Error(`Invalid updates: ${validation.errors.join(', ')}`);
      }
    }

    // Apply updates
    Object.assign(goal, updates);
    goal.updatedAt = new Date();

    // Recalculate progress if target changed
    if (updates.target) {
      goal.progress = Math.min(100, (goal.currentValue / goal.target) * 100);
    }

    this.saveGoals();
    this.triggerEvent('goalUpdated', goal);
    
    return goal;
  }

  // Delete a goal
  deleteGoal(goalId) {
    const goalIndex = this.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) {
      throw new Error('Goal not found');
    }

    const goal = this.goals[goalIndex];
    this.goals.splice(goalIndex, 1);
    
    // Remove related achievements
    this.achievements = this.achievements.filter(a => a.goalId !== goalId);
    
    this.saveGoals();
    this.triggerEvent('goalDeleted', goal);
    
    return goal;
  }

  // Pause/resume a goal
  toggleGoalStatus(goalId) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    if (goal.status === 'active') {
      goal.status = 'paused';
    } else if (goal.status === 'paused') {
      goal.status = 'active';
    }

    goal.updatedAt = new Date();
    this.saveGoals();
    this.triggerEvent('goalStatusChanged', goal);
    
    return goal;
  }

  // Get goal statistics and analytics
  getGoalAnalytics() {
    const totalGoals = this.goals.length;
    const activeGoals = this.goals.filter(g => g.status === 'active').length;
    const completedGoals = this.goals.filter(g => g.status === 'completed').length;
    const pausedGoals = this.goals.filter(g => g.status === 'paused').length;
    
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    const averageProgress = this.goals.length > 0 
      ? this.goals.reduce((sum, goal) => sum + goal.progress, 0) / this.goals.length 
      : 0;

    // Goals by type
    const goalsByType = {};
    this.goals.forEach(goal => {
      goalsByType[goal.type] = (goalsByType[goal.type] || 0) + 1;
    });

    // Upcoming deadlines (next 7 days)
    const upcomingDeadlines = this.getUpcomingDeadlines(7);
    
    // Recent achievements
    const recentAchievements = this.achievements
      .filter(a => {
        const daysSince = (new Date() - new Date(a.achievedAt)) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      })
      .length;

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      pausedGoals,
      completionRate: Math.round(completionRate),
      averageProgress: Math.round(averageProgress),
      goalsByType,
      upcomingDeadlines: upcomingDeadlines.length,
      recentAchievements,
      totalAchievements: this.achievements.length
    };
  }

  // Get upcoming deadlines
  getUpcomingDeadlines(days = 7) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    return this.goals
      .filter(goal => 
        goal.status === 'active' && 
        goal.deadline <= targetDate &&
        goal.deadline >= new Date()
      )
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  // Get overdue goals
  getOverdueGoals() {
    const now = new Date();
    return this.goals
      .filter(goal => 
        goal.status === 'active' && 
        goal.deadline < now
      )
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  // Initialize deadline checking and reminders
  initializeDeadlineChecking() {
    // Check deadlines every hour
    setInterval(() => {
      this.checkDeadlines();
    }, 60 * 60 * 1000);

    // Initial check
    this.checkDeadlines();
  }

  // Check for deadline reminders and overdue goals
  checkDeadlines() {
    const now = new Date();
    
    this.goals.forEach(goal => {
      if (goal.status !== 'active') return;

      // Check for overdue goals
      if (goal.deadline < now && !goal.overdueNotified) {
        this.showNotification(
          `⚠️ Goal "${goal.title}" is overdue! Deadline was ${this.formatDate(goal.deadline)}`,
          'warning'
        );
        goal.overdueNotified = true;
      }

      // Check for upcoming deadline reminders
      goal.reminders.forEach(reminder => {
        if (reminder.sent) return;

        const reminderDate = new Date(goal.deadline);
        reminderDate.setDate(reminderDate.getDate() - reminder.daysBefore);

        if (now >= reminderDate) {
          this.showNotification(
            `📅 Reminder: Goal "${goal.title}" deadline is in ${reminder.daysBefore} day(s)`,
            'info'
          );
          reminder.sent = true;
        }
      });
    });

    this.saveGoals();
  }

  // Setup reminders for a goal
  setupReminders(goal) {
    // Default reminders: 7 days, 3 days, 1 day before deadline
    const defaultReminders = [
      { daysBefore: 7, sent: false },
      { daysBefore: 3, sent: false },
      { daysBefore: 1, sent: false }
    ];

    if (!goal.reminders || goal.reminders.length === 0) {
      goal.reminders = defaultReminders;
    }
  }

  // Show notification
  showNotification(message, type = 'info') {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Trigger notification event
    this.triggerEvent('notification', notification);

    // Try to show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('Study Goal Update', {
        body: message,
        icon: '/image/logo.png'
      });
    }
  }

  // Get notifications
  getNotifications(unreadOnly = false) {
    if (unreadOnly) {
      return this.notifications.filter(n => !n.read);
    }
    return [...this.notifications];
  }

  // Mark notification as read
  markNotificationRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Generate unique goal ID
  generateGoalId() {
    return 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate unique achievement ID
  generateAchievementId() {
    return 'achievement_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Format date for display
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Trigger custom events
  triggerEvent(eventName, data) {
    window.dispatchEvent(new CustomEvent(`goal${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`, {
      detail: data
    }));
  }

  // Get goal suggestions based on user activity
  getGoalSuggestions() {
    const suggestions = [];
    
    // Analyze user's study patterns
    if (window.profileManager) {
      const profile = window.profileManager.profileData;
      
      // Suggest study time goals based on current average
      if (profile.studyStats && profile.studyStats.totalHours > 0) {
        const avgHoursPerWeek = profile.studyStats.totalHours / 4; // Rough estimate
        suggestions.push({
          type: 'study_time',
          title: `Study ${Math.ceil(avgHoursPerWeek * 1.2)} hours per week`,
          description: 'Increase your weekly study time by 20%',
          target: Math.ceil(avgHoursPerWeek * 1.2),
          unit: 'hours',
          timeframe: 'weekly'
        });
      }

      // Suggest streak goals
      if (profile.streakData && profile.streakData.longestStreak > 0) {
        const targetStreak = Math.max(profile.streakData.longestStreak + 7, 30);
        suggestions.push({
          type: 'streak_days',
          title: `Maintain a ${targetStreak}-day study streak`,
          description: 'Build consistency in your study habits',
          target: targetStreak,
          unit: 'days',
          timeframe: 'monthly'
        });
      }

      // Suggest accuracy goals based on recent performance
      suggestions.push({
        type: 'accuracy_rate',
        title: 'Achieve 85% accuracy in practice tests',
        description: 'Improve your understanding and test performance',
        target: 85,
        unit: '%',
        timeframe: 'monthly'
      });
    }

    return suggestions;
  }

  // Export goals data
  exportGoals() {
    return {
      goals: this.goals,
      achievements: this.achievements,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import goals data
  importGoals(data) {
    try {
      if (data.goals && Array.isArray(data.goals)) {
        // Validate each goal
        const validGoals = data.goals.filter(goal => {
          return goal.id && goal.title && goal.target && goal.deadline;
        });

        // Merge with existing goals (avoid duplicates)
        validGoals.forEach(importedGoal => {
          const existingGoal = this.goals.find(g => g.id === importedGoal.id);
          if (!existingGoal) {
            this.goals.push(importedGoal);
          }
        });
      }

      if (data.achievements && Array.isArray(data.achievements)) {
        // Merge achievements
        data.achievements.forEach(importedAchievement => {
          const existingAchievement = this.achievements.find(a => a.id === importedAchievement.id);
          if (!existingAchievement) {
            this.achievements.push(importedAchievement);
          }
        });
      }

      this.saveGoals();
      return { success: true, message: 'Goals imported successfully' };
    } catch (error) {
      console.error('Error importing goals:', error);
      return { success: false, message: 'Failed to import goals: ' + error.message };
    }
  }

  // Clear all goals (with confirmation)
  clearAllGoals() {
    this.goals = [];
    this.achievements = [];
    this.notifications = [];
    this.saveGoals();
    this.triggerEvent('goalsCleared', {});
  }

  // Get goal progress visualization data
  getProgressVisualization(goalId) {
    const goal = this.getGoal(goalId);
    if (!goal) return null;

    // Generate progress history from notes
    const progressHistory = goal.notes
      .filter(note => note.type === 'progress')
      .map(note => ({
        date: note.date,
        value: note.value,
        progress: (note.value / goal.target) * 100
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Add current progress point
    progressHistory.push({
      date: goal.updatedAt,
      value: goal.currentValue,
      progress: goal.progress
    });

    return {
      goal,
      progressHistory,
      milestones: goal.milestones || [],
      daysRemaining: Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
      isOnTrack: this.isGoalOnTrack(goal)
    };
  }

  // Check if goal is on track to meet deadline
  isGoalOnTrack(goal) {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const totalDays = Math.ceil((deadline - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24));
    const expectedProgress = (daysPassed / totalDays) * 100;
    
    return goal.progress >= expectedProgress * 0.8; // Allow 20% buffer
  }
}

// SpacedRepetitionEngine - Algorithm for optimal review scheduling with performance-based difficulty adjustment
class SpacedRepetitionEngine {
  constructor() {
    this.reviewData = this.loadReviewData();
    this.algorithm = 'sm2'; // SuperMemo 2 algorithm
    this.defaultEaseFactor = 2.5;
    this.minEaseFactor = 1.3;
    this.maxEaseFactor = 3.0;
    this.intervalModifier = 1.0;
    this.reviewQueue = [];
    this.performanceHistory = [];
    
    this.initializeEngine();
  }

  // Load review data from storage
  loadReviewData() {
    const defaultData = {
      items: {}, // itemId -> review data mapping
      sessions: [], // review session history
      statistics: {
        totalReviews: 0,
        correctReviews: 0,
        averageEaseFactor: 2.5,
        retentionRate: 0,
        lastReviewDate: null
      },
      settings: {
        algorithm: 'sm2',
        intervalModifier: 1.0,
        maxInterval: 365, // days
        minInterval: 1, // days
        graduatingInterval: 1, // days for new items
        easyInterval: 4, // days for easy items
        hardInterval: 0.5, // multiplier for hard items
        againInterval: 0.2 // multiplier for failed items
      }
    };

    try {
      // Try to get from profile manager first
      if (window.profileManager) {
        const profile = window.profileManager.profileData;
        if (profile.spacedRepetitionData) {
          return { ...defaultData, ...profile.spacedRepetitionData };
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('spacedRepetitionData');
      if (saved) {
        return { ...defaultData, ...JSON.parse(saved) };
      }

      return defaultData;
    } catch (error) {
      console.error('Error loading spaced repetition data:', error);
      return defaultData;
    }
  }

  // Save review data to storage
  saveReviewData() {
    try {
      // Save to profile manager if available
      if (window.profileManager) {
        window.profileManager.profileData.spacedRepetitionData = this.reviewData;
        window.profileManager.saveProfile();
      }

      // Also save to localStorage as backup
      localStorage.setItem('spacedRepetitionData', JSON.stringify(this.reviewData));
    } catch (error) {
      console.error('Error saving spaced repetition data:', error);
    }
  }

  // Initialize the engine
  initializeEngine() {
    this.updateReviewQueue();
    this.calculateStatistics();
  }

  // Add a new item to the spaced repetition system
  addItem(itemData) {
    const itemId = itemData.id || this.generateItemId();
    
    const item = {
      id: itemId,
      content: itemData.content || '',
      subject: itemData.subject || 'general',
      chapter: itemData.chapter || '',
      difficulty: itemData.difficulty || 'medium', // easy, medium, hard
      type: itemData.type || 'mcq', // mcq, flashcard, concept
      tags: itemData.tags || [],
      
      // Spaced repetition data
      easeFactor: this.defaultEaseFactor,
      interval: 0, // days until next review
      repetitions: 0,
      nextReviewDate: new Date(),
      lastReviewDate: null,
      
      // Performance tracking
      totalReviews: 0,
      correctReviews: 0,
      accuracy: 0,
      averageResponseTime: 0,
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'new' // new, learning, review, graduated, suspended
    };

    this.reviewData.items[itemId] = item;
    this.saveReviewData();
    this.updateReviewQueue();
    
    return item;
  }

  // Process review result and update item scheduling
  processReview(itemId, quality, responseTime = 0) {
    const item = this.reviewData.items[itemId];
    if (!item) {
      throw new Error('Item not found');
    }

    // Validate quality (0-5 scale: 0=complete blackout, 5=perfect response)
    quality = Math.max(0, Math.min(5, Math.round(quality)));
    
    const previousInterval = item.interval;
    const previousEaseFactor = item.easeFactor;
    
    // Update performance tracking
    item.totalReviews++;
    if (quality >= 3) {
      item.correctReviews++;
    }
    item.accuracy = (item.correctReviews / item.totalReviews) * 100;
    
    // Update average response time
    if (responseTime > 0) {
      const totalTime = item.averageResponseTime * (item.totalReviews - 1) + responseTime;
      item.averageResponseTime = totalTime / item.totalReviews;
    }

    // Apply spaced repetition algorithm
    const scheduleResult = this.calculateNextReview(item, quality);
    
    // Update item with new scheduling
    item.easeFactor = scheduleResult.easeFactor;
    item.interval = scheduleResult.interval;
    item.repetitions = scheduleResult.repetitions;
    item.nextReviewDate = scheduleResult.nextReviewDate;
    item.lastReviewDate = new Date();
    item.status = scheduleResult.status;
    item.updatedAt = new Date();

    // Record review session
    const session = {
      itemId,
      quality,
      responseTime,
      previousInterval,
      newInterval: item.interval,
      previousEaseFactor,
      newEaseFactor: item.easeFactor,
      date: new Date(),
      subject: item.subject,
      chapter: item.chapter
    };
    
    this.reviewData.sessions.unshift(session);
    
    // Keep only last 1000 sessions
    if (this.reviewData.sessions.length > 1000) {
      this.reviewData.sessions = this.reviewData.sessions.slice(0, 1000);
    }

    // Update statistics
    this.updateStatistics();
    
    this.saveReviewData();
    this.updateReviewQueue();
    
    // Trigger review processed event
    this.triggerEvent('reviewProcessed', { item, session, scheduleResult });
    
    return {
      item,
      session,
      nextReviewDate: item.nextReviewDate,
      interval: item.interval,
      status: item.status
    };
  }

  // Calculate next review using SuperMemo 2 algorithm
  calculateNextReview(item, quality) {
    let easeFactor = item.easeFactor;
    let interval = item.interval;
    let repetitions = item.repetitions;
    let status = item.status;

    // SuperMemo 2 algorithm implementation
    if (quality >= 3) {
      // Correct response
      if (repetitions === 0) {
        interval = this.reviewData.settings.graduatingInterval;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions++;
      
      // Update status based on repetitions
      if (repetitions >= 2 && interval >= 21) {
        status = 'graduated';
      } else if (repetitions >= 1) {
        status = 'review';
      } else {
        status = 'learning';
      }
    } else {
      // Incorrect response - reset repetitions
      repetitions = 0;
      interval = this.reviewData.settings.againInterval * interval;
      status = 'learning';
    }

    // Update ease factor based on quality
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(this.minEaseFactor, Math.min(this.maxEaseFactor, easeFactor));

    // Apply interval modifier
    interval = Math.round(interval * this.reviewData.settings.intervalModifier);
    
    // Apply min/max interval limits
    interval = Math.max(this.reviewData.settings.minInterval, interval);
    interval = Math.min(this.reviewData.settings.maxInterval, interval);

    // Handle special quality responses
    if (quality === 5) {
      // Easy - increase interval
      interval = Math.round(interval * this.reviewData.settings.easyInterval);
    } else if (quality === 2) {
      // Hard - decrease interval
      interval = Math.round(interval * this.reviewData.settings.hardInterval);
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      easeFactor,
      interval,
      repetitions,
      nextReviewDate,
      status
    };
  }

  // Update the review queue with items due for review
  updateReviewQueue() {
    const now = new Date();
    const items = Object.values(this.reviewData.items);
    
    // Get items due for review
    const dueItems = items.filter(item => {
      return item.status !== 'suspended' && 
             new Date(item.nextReviewDate) <= now;
    });

    // Sort by priority (overdue items first, then by ease factor)
    dueItems.sort((a, b) => {
      const aOverdue = (now - new Date(a.nextReviewDate)) / (1000 * 60 * 60 * 24);
      const bOverdue = (now - new Date(b.nextReviewDate)) / (1000 * 60 * 60 * 24);
      
      // Prioritize overdue items
      if (aOverdue > 0 && bOverdue <= 0) return -1;
      if (bOverdue > 0 && aOverdue <= 0) return 1;
      
      // Then by ease factor (harder items first)
      return a.easeFactor - b.easeFactor;
    });

    this.reviewQueue = dueItems;
    
    // Trigger queue updated event
    this.triggerEvent('queueUpdated', { 
      queueLength: this.reviewQueue.length,
      overdueCount: dueItems.filter(item => new Date(item.nextReviewDate) < now).length
    });
    
    return this.reviewQueue;
  }

  // Get review queue with optional filtering
  getReviewQueue(filters = {}) {
    let queue = [...this.reviewQueue];

    // Filter by subject
    if (filters.subject) {
      queue = queue.filter(item => item.subject === filters.subject);
    }

    // Filter by chapter
    if (filters.chapter) {
      queue = queue.filter(item => item.chapter === filters.chapter);
    }

    // Filter by difficulty
    if (filters.difficulty) {
      queue = queue.filter(item => item.difficulty === filters.difficulty);
    }

    // Filter by type
    if (filters.type) {
      queue = queue.filter(item => item.type === filters.type);
    }

    // Filter by status
    if (filters.status) {
      queue = queue.filter(item => item.status === filters.status);
    }

    // Limit results
    if (filters.limit && filters.limit > 0) {
      queue = queue.slice(0, filters.limit);
    }

    return queue;
  }

  // Get next item for review
  getNextReviewItem(filters = {}) {
    const queue = this.getReviewQueue(filters);
    return queue.length > 0 ? queue[0] : null;
  }

  // Get item by ID
  getItem(itemId) {
    return this.reviewData.items[itemId] || null;
  }

  // Update item content or metadata
  updateItem(itemId, updates) {
    const item = this.reviewData.items[itemId];
    if (!item) {
      throw new Error('Item not found');
    }

    // Prevent updating spaced repetition data directly
    const allowedUpdates = {
      content: updates.content,
      subject: updates.subject,
      chapter: updates.chapter,
      difficulty: updates.difficulty,
      type: updates.type,
      tags: updates.tags
    };

    Object.assign(item, allowedUpdates);
    item.updatedAt = new Date();

    this.saveReviewData();
    return item;
  }

  // Suspend an item (remove from review queue)
  suspendItem(itemId) {
    const item = this.reviewData.items[itemId];
    if (!item) {
      throw new Error('Item not found');
    }

    item.status = 'suspended';
    item.updatedAt = new Date();
    
    this.saveReviewData();
    this.updateReviewQueue();
    
    return item;
  }

  // Unsuspend an item (add back to review queue)
  unsuspendItem(itemId) {
    const item = this.reviewData.items[itemId];
    if (!item) {
      throw new Error('Item not found');
    }

    // Reset to appropriate status based on repetitions
    if (item.repetitions === 0) {
      item.status = 'new';
      item.nextReviewDate = new Date();
    } else if (item.repetitions < 2) {
      item.status = 'learning';
    } else {
      item.status = 'review';
    }
    
    item.updatedAt = new Date();
    
    this.saveReviewData();
    this.updateReviewQueue();
    
    return item;
  }

  // Delete an item
  deleteItem(itemId) {
    if (!this.reviewData.items[itemId]) {
      throw new Error('Item not found');
    }

    delete this.reviewData.items[itemId];
    
    // Remove from sessions history
    this.reviewData.sessions = this.reviewData.sessions.filter(
      session => session.itemId !== itemId
    );
    
    this.saveReviewData();
    this.updateReviewQueue();
    
    return true;
  }

  // Get statistics and analytics
  getStatistics() {
    return {
      ...this.reviewData.statistics,
      queueStats: this.getQueueStatistics(),
      performanceStats: this.getPerformanceStatistics(),
      subjectStats: this.getSubjectStatistics()
    };
  }

  // Get queue statistics
  getQueueStatistics() {
    const now = new Date();
    const items = Object.values(this.reviewData.items);
    
    const stats = {
      total: items.length,
      new: items.filter(item => item.status === 'new').length,
      learning: items.filter(item => item.status === 'learning').length,
      review: items.filter(item => item.status === 'review').length,
      graduated: items.filter(item => item.status === 'graduated').length,
      suspended: items.filter(item => item.status === 'suspended').length,
      due: this.reviewQueue.length,
      overdue: items.filter(item => 
        item.status !== 'suspended' && 
        new Date(item.nextReviewDate) < now
      ).length
    };

    return stats;
  }

  // Get performance statistics
  getPerformanceStatistics() {
    const sessions = this.reviewData.sessions;
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageQuality: 0,
        retentionRate: 0,
        averageResponseTime: 0,
        sessionsToday: 0,
        sessionsThisWeek: 0
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sessionsToday = sessions.filter(s => new Date(s.date) >= today).length;
    const sessionsThisWeek = sessions.filter(s => new Date(s.date) >= weekAgo).length;
    
    const totalQuality = sessions.reduce((sum, s) => sum + s.quality, 0);
    const averageQuality = totalQuality / sessions.length;
    
    const correctSessions = sessions.filter(s => s.quality >= 3).length;
    const retentionRate = (correctSessions / sessions.length) * 100;
    
    const responseTimes = sessions.filter(s => s.responseTime > 0);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, s) => sum + s.responseTime, 0) / responseTimes.length 
      : 0;

    return {
      totalSessions: sessions.length,
      averageQuality: Math.round(averageQuality * 100) / 100,
      retentionRate: Math.round(retentionRate),
      averageResponseTime: Math.round(averageResponseTime),
      sessionsToday,
      sessionsThisWeek
    };
  }

  // Get subject-wise statistics
  getSubjectStatistics() {
    const items = Object.values(this.reviewData.items);
    const subjects = {};

    items.forEach(item => {
      if (!subjects[item.subject]) {
        subjects[item.subject] = {
          total: 0,
          new: 0,
          learning: 0,
          review: 0,
          graduated: 0,
          suspended: 0,
          averageAccuracy: 0,
          averageEaseFactor: 0
        };
      }

      const subjectStats = subjects[item.subject];
      subjectStats.total++;
      subjectStats[item.status]++;
      subjectStats.averageAccuracy += item.accuracy;
      subjectStats.averageEaseFactor += item.easeFactor;
    });

    // Calculate averages
    Object.keys(subjects).forEach(subject => {
      const stats = subjects[subject];
      if (stats.total > 0) {
        stats.averageAccuracy = Math.round(stats.averageAccuracy / stats.total);
        stats.averageEaseFactor = Math.round((stats.averageEaseFactor / stats.total) * 100) / 100;
      }
    });

    return subjects;
  }

  // Update overall statistics
  updateStatistics() {
    const sessions = this.reviewData.sessions;
    const items = Object.values(this.reviewData.items);
    
    this.reviewData.statistics.totalReviews = sessions.length;
    this.reviewData.statistics.correctReviews = sessions.filter(s => s.quality >= 3).length;
    
    if (sessions.length > 0) {
      this.reviewData.statistics.retentionRate = 
        (this.reviewData.statistics.correctReviews / this.reviewData.statistics.totalReviews) * 100;
      this.reviewData.statistics.lastReviewDate = sessions[0].date;
    }

    if (items.length > 0) {
      const totalEaseFactor = items.reduce((sum, item) => sum + item.easeFactor, 0);
      this.reviewData.statistics.averageEaseFactor = totalEaseFactor / items.length;
    }
  }

  // Calculate statistics
  calculateStatistics() {
    this.updateStatistics();
  }

  // Get upcoming reviews for planning
  getUpcomingReviews(days = 7) {
    const items = Object.values(this.reviewData.items);
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const upcoming = items.filter(item => {
      const reviewDate = new Date(item.nextReviewDate);
      return item.status !== 'suspended' && 
             reviewDate > now && 
             reviewDate <= futureDate;
    });

    // Group by date
    const byDate = {};
    upcoming.forEach(item => {
      const dateKey = new Date(item.nextReviewDate).toDateString();
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(item);
    });

    return byDate;
  }

  // Bulk import items
  importItems(items) {
    let imported = 0;
    let errors = [];

    items.forEach((itemData, index) => {
      try {
        this.addItem(itemData);
        imported++;
      } catch (error) {
        errors.push({ index, error: error.message });
      }
    });

    return { imported, errors };
  }

  // Export all data
  exportData() {
    return {
      ...this.reviewData,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import data (merge with existing)
  importData(data) {
    try {
      if (data.items) {
        Object.assign(this.reviewData.items, data.items);
      }
      
      if (data.sessions && Array.isArray(data.sessions)) {
        this.reviewData.sessions = [...data.sessions, ...this.reviewData.sessions];
        // Keep only last 1000 sessions
        if (this.reviewData.sessions.length > 1000) {
          this.reviewData.sessions = this.reviewData.sessions.slice(0, 1000);
        }
      }

      if (data.settings) {
        Object.assign(this.reviewData.settings, data.settings);
      }

      this.saveReviewData();
      this.updateReviewQueue();
      this.calculateStatistics();

      return { success: true, message: 'Data imported successfully' };
    } catch (error) {
      console.error('Error importing spaced repetition data:', error);
      return { success: false, message: 'Failed to import data: ' + error.message };
    }
  }

  // Update algorithm settings
  updateSettings(newSettings) {
    Object.assign(this.reviewData.settings, newSettings);
    
    // Update instance properties
    this.intervalModifier = this.reviewData.settings.intervalModifier;
    
    this.saveReviewData();
    
    // Trigger settings updated event
    this.triggerEvent('settingsUpdated', this.reviewData.settings);
    
    return this.reviewData.settings;
  }

  // Reset all data (with confirmation)
  resetAllData() {
    this.reviewData = this.loadReviewData();
    this.reviewQueue = [];
    this.performanceHistory = [];
    
    // Clear storage
    localStorage.removeItem('spacedRepetitionData');
    if (window.profileManager) {
      delete window.profileManager.profileData.spacedRepetitionData;
      window.profileManager.saveProfile();
    }
    
    this.triggerEvent('dataReset', {});
    
    return true;
  }

  // Generate unique item ID
  generateItemId() {
    return 'sr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Trigger custom events
  triggerEvent(eventName, data) {
    window.dispatchEvent(new CustomEvent(`spacedRepetition${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`, {
      detail: data
    }));
  }

  // Get difficulty adjustment recommendations
  getDifficultyAdjustments() {
    const items = Object.values(this.reviewData.items);
    const recommendations = [];

    items.forEach(item => {
      if (item.totalReviews >= 3) {
        let newDifficulty = item.difficulty;
        
        // Suggest difficulty adjustments based on performance
        if (item.accuracy >= 90 && item.easeFactor > 2.8) {
          if (item.difficulty === 'hard') newDifficulty = 'medium';
          else if (item.difficulty === 'medium') newDifficulty = 'easy';
        } else if (item.accuracy <= 50 && item.easeFactor < 2.0) {
          if (item.difficulty === 'easy') newDifficulty = 'medium';
          else if (item.difficulty === 'medium') newDifficulty = 'hard';
        }

        if (newDifficulty !== item.difficulty) {
          recommendations.push({
            itemId: item.id,
            currentDifficulty: item.difficulty,
            suggestedDifficulty: newDifficulty,
            reason: item.accuracy >= 90 ? 'High accuracy - consider easier' : 'Low accuracy - consider harder',
            accuracy: item.accuracy,
            easeFactor: item.easeFactor
          });
        }
      }
    });

    return recommendations;
  }

  // Apply difficulty adjustment
  adjustItemDifficulty(itemId, newDifficulty) {
    const item = this.reviewData.items[itemId];
    if (!item) {
      throw new Error('Item not found');
    }

    const oldDifficulty = item.difficulty;
    item.difficulty = newDifficulty;
    item.updatedAt = new Date();

    // Adjust ease factor based on difficulty change
    if (newDifficulty === 'easy' && oldDifficulty !== 'easy') {
      item.easeFactor = Math.min(this.maxEaseFactor, item.easeFactor + 0.2);
    } else if (newDifficulty === 'hard' && oldDifficulty !== 'hard') {
      item.easeFactor = Math.max(this.minEaseFactor, item.easeFactor - 0.2);
    }

    this.saveReviewData();
    
    this.triggerEvent('difficultyAdjusted', {
      itemId,
      oldDifficulty,
      newDifficulty,
      newEaseFactor: item.easeFactor
    });

    return item;
  }

  // Get learning analytics for insights
  getLearningAnalytics() {
    const items = Object.values(this.reviewData.items);
    const sessions = this.reviewData.sessions;
    
    // Calculate learning velocity (items graduated per week)
    const graduatedItems = items.filter(item => item.status === 'graduated');
    const learningVelocity = graduatedItems.length; // Simplified calculation

    // Calculate retention curve data
    const retentionData = this.calculateRetentionCurve();
    
    // Identify problem areas
    const problemAreas = this.identifyProblemAreas();
    
    // Calculate study efficiency
    const efficiency = this.calculateStudyEfficiency();

    return {
      learningVelocity,
      retentionData,
      problemAreas,
      efficiency,
      totalItems: items.length,
      graduatedItems: graduatedItems.length,
      graduationRate: items.length > 0 ? (graduatedItems.length / items.length) * 100 : 0
    };
  }

  // Calculate retention curve for analysis
  calculateRetentionCurve() {
    const sessions = this.reviewData.sessions;
    const intervals = [1, 3, 7, 14, 30, 60, 90]; // Days
    const retentionRates = [];

    intervals.forEach(interval => {
      const relevantSessions = sessions.filter(session => {
        const daysSinceReview = (Date.now() - new Date(session.date)) / (1000 * 60 * 60 * 24);
        return Math.abs(daysSinceReview - interval) <= 2; // ±2 days tolerance
      });

      if (relevantSessions.length > 0) {
        const correctSessions = relevantSessions.filter(s => s.quality >= 3).length;
        const retentionRate = (correctSessions / relevantSessions.length) * 100;
        retentionRates.push({ interval, retentionRate, sampleSize: relevantSessions.length });
      }
    });

    return retentionRates;
  }

  // Identify problem areas that need attention
  identifyProblemAreas() {
    const items = Object.values(this.reviewData.items);
    const problems = [];

    // Group by subject and chapter
    const groups = {};
    items.forEach(item => {
      const key = `${item.subject}:${item.chapter}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    // Analyze each group
    Object.keys(groups).forEach(key => {
      const groupItems = groups[key];
      const [subject, chapter] = key.split(':');
      
      if (groupItems.length >= 3) { // Only analyze groups with sufficient data
        const avgAccuracy = groupItems.reduce((sum, item) => sum + item.accuracy, 0) / groupItems.length;
        const avgEaseFactor = groupItems.reduce((sum, item) => sum + item.easeFactor, 0) / groupItems.length;
        const lowPerformers = groupItems.filter(item => item.accuracy < 60).length;

        if (avgAccuracy < 70 || avgEaseFactor < 2.0 || lowPerformers > groupItems.length * 0.5) {
          problems.push({
            subject,
            chapter,
            itemCount: groupItems.length,
            averageAccuracy: Math.round(avgAccuracy),
            averageEaseFactor: Math.round(avgEaseFactor * 100) / 100,
            lowPerformers,
            severity: avgAccuracy < 50 ? 'high' : avgAccuracy < 70 ? 'medium' : 'low'
          });
        }
      }
    });

    return problems.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // Calculate study efficiency metrics
  calculateStudyEfficiency() {
    const sessions = this.reviewData.sessions;
    if (sessions.length === 0) return { efficiency: 0, trend: 'stable' };

    // Calculate efficiency as correct reviews per minute
    const recentSessions = sessions.slice(0, 50); // Last 50 sessions
    const olderSessions = sessions.slice(50, 100); // Previous 50 sessions

    const calculateEfficiency = (sessionGroup) => {
      if (sessionGroup.length === 0) return 0;
      
      const correctSessions = sessionGroup.filter(s => s.quality >= 3).length;
      const totalTime = sessionGroup.reduce((sum, s) => sum + (s.responseTime || 60), 0); // Default 60s if no time
      
      return totalTime > 0 ? (correctSessions / (totalTime / 60)) : 0; // Correct per minute
    };

    const recentEfficiency = calculateEfficiency(recentSessions);
    const olderEfficiency = calculateEfficiency(olderSessions);
    
    let trend = 'stable';
    if (recentEfficiency > olderEfficiency * 1.1) {
      trend = 'improving';
    } else if (recentEfficiency < olderEfficiency * 0.9) {
      trend = 'declining';
    }

    return {
      efficiency: Math.round(recentEfficiency * 100) / 100,
      trend,
      recentSessions: recentSessions.length,
      comparisonSessions: olderSessions.length
    };
  }
}