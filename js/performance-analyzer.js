// PerformanceAnalyzer - Detailed performance metrics calculation and trend analysis

class PerformanceAnalyzer {
  constructor() {
    this.performanceData = this.loadPerformanceData();
    this.analysisCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout
    
    // Initialize data sources
    this.initializeDataSources();
    
    // Performance calculation settings
    this.settings = {
      trendAnalysisPeriod: 30, // days
      comparisonPeriods: {
        daily: 1,
        weekly: 7,
        monthly: 30,
        quarterly: 90
      },
      weightingFactors: {
        accuracy: 0.4,
        consistency: 0.3,
        speed: 0.2,
        retention: 0.1
      },
      benchmarks: {
        excellent: 90,
        good: 75,
        average: 60,
        needsImprovement: 45
      }
    };
  }

  // Load performance data from various sources
  loadPerformanceData() {
    const defaultData = {
      sessions: [], // Study session records
      assessments: [], // Test/quiz results
      streakData: null, // From StudyStreakTracker
      spacedRepetitionData: null, // From SpacedRepetitionEngine
      goalProgress: [], // From GoalManager
      lastAnalysisDate: null,
      performanceHistory: [] // Calculated performance snapshots
    };

    try {
      // Get data from profile manager
      if (window.profileManager) {
        const profile = window.profileManager.profileData;
        
        // Collect data from various sources
        const data = {
          ...defaultData,
          sessions: profile.sessionHistory || [],
          streakData: profile.streakData || null,
          spacedRepetitionData: profile.spacedRepetitionData || null,
          goalProgress: profile.goals || [],
          performanceHistory: profile.performanceHistory || []
        };

        return data;
      }

      return defaultData;
    } catch (error) {
      console.error('Error loading performance data:', error);
      return defaultData;
    }
  }

  // Initialize connections to data sources
  initializeDataSources() {
    // Listen for updates from other components
    window.addEventListener('sessionCompleted', (event) => {
      this.recordSession(event.detail);
    });

    window.addEventListener('assessmentCompleted', (event) => {
      this.recordAssessment(event.detail);
    });

    window.addEventListener('goalProgressUpdated', (event) => {
      this.invalidateCache();
    });

    window.addEventListener('spacedRepetitionReviewProcessed', (event) => {
      this.invalidateCache();
    });
  }

  // Record a study session
  recordSession(sessionData) {
    const session = {
      id: this.generateId(),
      date: new Date(sessionData.date || Date.now()),
      duration: sessionData.duration || 0,
      type: sessionData.type || 'study',
      subject: sessionData.subject || 'general',
      chapter: sessionData.chapter || '',
      performance: {
        questionsAttempted: sessionData.questionsAttempted || 0,
        correctAnswers: sessionData.correctAnswers || 0,
        accuracy: sessionData.accuracy || 0,
        averageResponseTime: sessionData.averageResponseTime || 0
      },
      focusQuality: sessionData.focusQuality || 100,
      completionRate: sessionData.completionRate || 100
    };

    this.performanceData.sessions.unshift(session);
    
    // Keep only last 500 sessions
    if (this.performanceData.sessions.length > 500) {
      this.performanceData.sessions = this.performanceData.sessions.slice(0, 500);
    }

    this.savePerformanceData();
    this.invalidateCache();
  }

  // Record an assessment/test result
  recordAssessment(assessmentData) {
    const assessment = {
      id: this.generateId(),
      date: new Date(assessmentData.date || Date.now()),
      type: assessmentData.type || 'practice',
      subject: assessmentData.subject || 'general',
      chapter: assessmentData.chapter || '',
      totalQuestions: assessmentData.totalQuestions || 0,
      correctAnswers: assessmentData.correctAnswers || 0,
      accuracy: assessmentData.accuracy || 0,
      timeSpent: assessmentData.timeSpent || 0,
      difficulty: assessmentData.difficulty || 'medium',
      score: assessmentData.score || 0,
      maxScore: assessmentData.maxScore || 100
    };

    this.performanceData.assessments.unshift(assessment);
    
    // Keep only last 200 assessments
    if (this.performanceData.assessments.length > 200) {
      this.performanceData.assessments = this.performanceData.assessments.slice(0, 200);
    }

    this.savePerformanceData();
    this.invalidateCache();
  }

  // Calculate comprehensive performance metrics
  calculatePerformanceMetrics(timeframe = 'monthly', subject = null) {
    const cacheKey = `metrics_${timeframe}_${subject || 'all'}`;
    
    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      const cached = this.analysisCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const days = this.settings.comparisonPeriods[timeframe] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Filter data by timeframe and subject
    const filteredSessions = this.performanceData.sessions.filter(session => {
      const sessionDate = new Date(session.date);
      const matchesTimeframe = sessionDate >= startDate;
      const matchesSubject = !subject || session.subject === subject;
      return matchesTimeframe && matchesSubject;
    });

    const filteredAssessments = this.performanceData.assessments.filter(assessment => {
      const assessmentDate = new Date(assessment.date);
      const matchesTimeframe = assessmentDate >= startDate;
      const matchesSubject = !subject || assessment.subject === subject;
      return matchesTimeframe && matchesSubject;
    });

    // Calculate core metrics
    const metrics = {
      // Study metrics
      totalStudyTime: this.calculateTotalStudyTime(filteredSessions),
      averageSessionDuration: this.calculateAverageSessionDuration(filteredSessions),
      studyConsistency: this.calculateStudyConsistency(filteredSessions, days),
      focusQuality: this.calculateAverageFocusQuality(filteredSessions),
      
      // Performance metrics
      overallAccuracy: this.calculateOverallAccuracy(filteredAssessments),
      accuracyTrend: this.calculateAccuracyTrend(filteredAssessments),
      responseSpeed: this.calculateAverageResponseSpeed(filteredAssessments),
      speedTrend: this.calculateSpeedTrend(filteredAssessments),
      
      // Progress metrics
      improvementRate: this.calculateImprovementRate(filteredAssessments),
      consistencyScore: this.calculateConsistencyScore(filteredSessions, filteredAssessments),
      retentionRate: this.calculateRetentionRate(),
      
      // Comparative metrics
      performanceScore: 0, // Will be calculated below
      performanceGrade: 'C',
      strengthAreas: [],
      weaknessAreas: [],
      
      // Metadata
      timeframe,
      subject,
      dataPoints: {
        sessions: filteredSessions.length,
        assessments: filteredAssessments.length
      },
      calculatedAt: new Date()
    };

    // Calculate composite performance score
    metrics.performanceScore = this.calculateCompositeScore(metrics);
    metrics.performanceGrade = this.getPerformanceGrade(metrics.performanceScore);
    
    // Identify strengths and weaknesses
    const analysis = this.analyzeStrengthsAndWeaknesses(metrics, filteredSessions, filteredAssessments);
    metrics.strengthAreas = analysis.strengths;
    metrics.weaknessAreas = analysis.weaknesses;

    // Cache the result
    this.analysisCache.set(cacheKey, {
      data: metrics,
      timestamp: Date.now()
    });

    return metrics;
  }

  // Calculate total study time in hours
  calculateTotalStudyTime(sessions) {
    return sessions.reduce((total, session) => total + (session.duration || 0), 0) / 3600;
  }

  // Calculate average session duration in minutes
  calculateAverageSessionDuration(sessions) {
    if (sessions.length === 0) return 0;
    const totalDuration = sessions.reduce((total, session) => total + (session.duration || 0), 0);
    return (totalDuration / sessions.length) / 60;
  }

  // Calculate study consistency (percentage of days with study activity)
  calculateStudyConsistency(sessions, totalDays) {
    if (sessions.length === 0) return 0;
    
    const studyDates = new Set();
    sessions.forEach(session => {
      const dateKey = new Date(session.date).toDateString();
      studyDates.add(dateKey);
    });
    
    return (studyDates.size / totalDays) * 100;
  }

  // Calculate average focus quality
  calculateAverageFocusQuality(sessions) {
    if (sessions.length === 0) return 100;
    
    const totalFocus = sessions.reduce((total, session) => total + (session.focusQuality || 100), 0);
    return totalFocus / sessions.length;
  }

  // Calculate overall accuracy from assessments
  calculateOverallAccuracy(assessments) {
    if (assessments.length === 0) return 0;
    
    const totalQuestions = assessments.reduce((total, assessment) => total + (assessment.totalQuestions || 0), 0);
    const totalCorrect = assessments.reduce((total, assessment) => total + (assessment.correctAnswers || 0), 0);
    
    return totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  }

  // Calculate accuracy trend (improvement/decline over time)
  calculateAccuracyTrend(assessments) {
    if (assessments.length < 2) return 0;
    
    // Sort by date (oldest first)
    const sortedAssessments = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Split into first and second half
    const midPoint = Math.floor(sortedAssessments.length / 2);
    const firstHalf = sortedAssessments.slice(0, midPoint);
    const secondHalf = sortedAssessments.slice(midPoint);
    
    const firstHalfAccuracy = this.calculateOverallAccuracy(firstHalf);
    const secondHalfAccuracy = this.calculateOverallAccuracy(secondHalf);
    
    return secondHalfAccuracy - firstHalfAccuracy;
  }

  // Calculate average response speed (questions per minute)
  calculateAverageResponseSpeed(assessments) {
    if (assessments.length === 0) return 0;
    
    const validAssessments = assessments.filter(a => a.timeSpent > 0 && a.totalQuestions > 0);
    if (validAssessments.length === 0) return 0;
    
    const totalSpeed = validAssessments.reduce((total, assessment) => {
      const questionsPerMinute = (assessment.totalQuestions / assessment.timeSpent) * 60;
      return total + questionsPerMinute;
    }, 0);
    
    return totalSpeed / validAssessments.length;
  }

  // Calculate speed trend (improvement in response time)
  calculateSpeedTrend(assessments) {
    if (assessments.length < 2) return 0;
    
    const validAssessments = assessments.filter(a => a.timeSpent > 0 && a.totalQuestions > 0);
    if (validAssessments.length < 2) return 0;
    
    // Sort by date (oldest first)
    const sortedAssessments = [...validAssessments].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Split into first and second half
    const midPoint = Math.floor(sortedAssessments.length / 2);
    const firstHalf = sortedAssessments.slice(0, midPoint);
    const secondHalf = sortedAssessments.slice(midPoint);
    
    const firstHalfSpeed = this.calculateAverageResponseSpeed(firstHalf);
    const secondHalfSpeed = this.calculateAverageResponseSpeed(secondHalf);
    
    return secondHalfSpeed - firstHalfSpeed;
  }

  // Calculate improvement rate (percentage improvement over time)
  calculateImprovementRate(assessments) {
    if (assessments.length < 2) return 0;
    
    // Sort by date (oldest first)
    const sortedAssessments = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const firstAssessment = sortedAssessments[0];
    const lastAssessment = sortedAssessments[sortedAssessments.length - 1];
    
    if (firstAssessment.accuracy === 0) return 0;
    
    return ((lastAssessment.accuracy - firstAssessment.accuracy) / firstAssessment.accuracy) * 100;
  }

  // Calculate consistency score (how consistent performance is)
  calculateConsistencyScore(sessions, assessments) {
    if (assessments.length < 3) return 100; // Not enough data to measure inconsistency
    
    // Calculate standard deviation of accuracy scores
    const accuracies = assessments.map(a => a.accuracy);
    const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency score (lower deviation = higher consistency)
    const maxDeviation = 50; // Assume max reasonable deviation is 50%
    const consistencyScore = Math.max(0, 100 - (standardDeviation / maxDeviation) * 100);
    
    return consistencyScore;
  }

  // Calculate retention rate from spaced repetition data
  calculateRetentionRate() {
    try {
      // Get data from spaced repetition engine if available
      if (window.spacedRepetitionEngine) {
        const stats = window.spacedRepetitionEngine.getStatistics();
        return stats.retentionRate || 0;
      }
      
      // Fallback calculation from profile data
      if (this.performanceData.spacedRepetitionData) {
        const sessions = this.performanceData.spacedRepetitionData.sessions || [];
        if (sessions.length === 0) return 0;
        
        const correctSessions = sessions.filter(s => s.quality >= 3).length;
        return (correctSessions / sessions.length) * 100;
      }
      
      return 0;
    } catch (error) {
      console.error('Error calculating retention rate:', error);
      return 0;
    }
  }

  // Calculate composite performance score
  calculateCompositeScore(metrics) {
    const weights = this.settings.weightingFactors;
    
    // Normalize metrics to 0-100 scale
    const normalizedAccuracy = Math.min(100, metrics.overallAccuracy);
    const normalizedConsistency = Math.min(100, metrics.consistencyScore);
    const normalizedSpeed = Math.min(100, (metrics.responseSpeed / 2) * 100); // Assume 2 questions/min is excellent
    const normalizedRetention = Math.min(100, metrics.retentionRate);
    
    const compositeScore = (
      normalizedAccuracy * weights.accuracy +
      normalizedConsistency * weights.consistency +
      normalizedSpeed * weights.speed +
      normalizedRetention * weights.retention
    );
    
    return Math.round(compositeScore);
  }

  // Get performance grade based on score
  getPerformanceGrade(score) {
    if (score >= this.settings.benchmarks.excellent) return 'A';
    if (score >= this.settings.benchmarks.good) return 'B';
    if (score >= this.settings.benchmarks.average) return 'C';
    if (score >= this.settings.benchmarks.needsImprovement) return 'D';
    return 'F';
  }

  // Analyze strengths and weaknesses
  analyzeStrengthsAndWeaknesses(metrics, sessions, assessments) {
    const strengths = [];
    const weaknesses = [];
    
    // Analyze accuracy
    if (metrics.overallAccuracy >= 80) {
      strengths.push({
        area: 'Accuracy',
        score: metrics.overallAccuracy,
        description: 'Excellent answer accuracy in practice sessions'
      });
    } else if (metrics.overallAccuracy < 60) {
      weaknesses.push({
        area: 'Accuracy',
        score: metrics.overallAccuracy,
        description: 'Answer accuracy needs improvement',
        suggestion: 'Focus on understanding concepts before attempting questions'
      });
    }
    
    // Analyze consistency
    if (metrics.consistencyScore >= 80) {
      strengths.push({
        area: 'Consistency',
        score: metrics.consistencyScore,
        description: 'Very consistent performance across sessions'
      });
    } else if (metrics.consistencyScore < 60) {
      weaknesses.push({
        area: 'Consistency',
        score: metrics.consistencyScore,
        description: 'Performance varies significantly between sessions',
        suggestion: 'Establish a regular study routine and review weak topics'
      });
    }
    
    // Analyze study habits
    if (metrics.studyConsistency >= 70) {
      strengths.push({
        area: 'Study Habits',
        score: metrics.studyConsistency,
        description: 'Excellent study consistency and routine'
      });
    } else if (metrics.studyConsistency < 40) {
      weaknesses.push({
        area: 'Study Habits',
        score: metrics.studyConsistency,
        description: 'Irregular study pattern',
        suggestion: 'Set daily study goals and use reminders to maintain consistency'
      });
    }
    
    // Analyze focus quality
    if (metrics.focusQuality >= 85) {
      strengths.push({
        area: 'Focus Quality',
        score: metrics.focusQuality,
        description: 'Excellent focus during study sessions'
      });
    } else if (metrics.focusQuality < 70) {
      weaknesses.push({
        area: 'Focus Quality',
        score: metrics.focusQuality,
        description: 'Difficulty maintaining focus during study',
        suggestion: 'Try the Pomodoro technique and eliminate distractions'
      });
    }
    
    // Analyze improvement trend
    if (metrics.accuracyTrend > 5) {
      strengths.push({
        area: 'Learning Progress',
        score: metrics.accuracyTrend,
        description: 'Strong improvement trend in accuracy'
      });
    } else if (metrics.accuracyTrend < -5) {
      weaknesses.push({
        area: 'Learning Progress',
        score: metrics.accuracyTrend,
        description: 'Declining accuracy trend',
        suggestion: 'Review fundamental concepts and adjust study strategy'
      });
    }
    
    return { strengths, weaknesses };
  }

  // Perform trend analysis over specified period
  performTrendAnalysis(period = 'monthly', subject = null) {
    const days = this.settings.comparisonPeriods[period] || 30;
    const dataPoints = [];
    const intervalDays = Math.max(1, Math.floor(days / 10)); // Create ~10 data points
    
    for (let i = days; i >= 0; i -= intervalDays) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - i);
      
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - intervalDays);
      
      // Get data for this interval
      const intervalSessions = this.performanceData.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        const matchesTimeframe = sessionDate >= startDate && sessionDate <= endDate;
        const matchesSubject = !subject || session.subject === subject;
        return matchesTimeframe && matchesSubject;
      });
      
      const intervalAssessments = this.performanceData.assessments.filter(assessment => {
        const assessmentDate = new Date(assessment.date);
        const matchesTimeframe = assessmentDate >= startDate && assessmentDate <= endDate;
        const matchesSubject = !subject || assessment.subject === subject;
        return matchesTimeframe && matchesSubject;
      });
      
      if (intervalSessions.length > 0 || intervalAssessments.length > 0) {
        dataPoints.push({
          date: endDate,
          accuracy: this.calculateOverallAccuracy(intervalAssessments),
          studyTime: this.calculateTotalStudyTime(intervalSessions),
          sessionCount: intervalSessions.length,
          assessmentCount: intervalAssessments.length,
          focusQuality: this.calculateAverageFocusQuality(intervalSessions),
          responseSpeed: this.calculateAverageResponseSpeed(intervalAssessments)
        });
      }
    }
    
    // Calculate trends
    const trends = {
      accuracy: this.calculateLinearTrend(dataPoints.map(p => p.accuracy)),
      studyTime: this.calculateLinearTrend(dataPoints.map(p => p.studyTime)),
      focusQuality: this.calculateLinearTrend(dataPoints.map(p => p.focusQuality)),
      responseSpeed: this.calculateLinearTrend(dataPoints.map(p => p.responseSpeed))
    };
    
    return {
      period,
      subject,
      dataPoints,
      trends,
      analysis: this.interpretTrends(trends),
      generatedAt: new Date()
    };
  }

  // Calculate linear trend (slope) for a series of values
  calculateLinearTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ..., n-1
    const sumY = values.reduce((sum, val) => sum + (val || 0), 0);
    const sumXY = values.reduce((sum, val, index) => sum + index * (val || 0), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  // Interpret trend analysis results
  interpretTrends(trends) {
    const interpretations = [];
    
    // Accuracy trend
    if (trends.accuracy > 1) {
      interpretations.push({
        metric: 'Accuracy',
        trend: 'improving',
        strength: 'strong',
        message: 'Your accuracy is steadily improving over time'
      });
    } else if (trends.accuracy < -1) {
      interpretations.push({
        metric: 'Accuracy',
        trend: 'declining',
        strength: 'concerning',
        message: 'Your accuracy has been declining - consider reviewing study methods'
      });
    }
    
    // Study time trend
    if (trends.studyTime > 0.1) {
      interpretations.push({
        metric: 'Study Time',
        trend: 'increasing',
        strength: 'positive',
        message: 'You are consistently increasing your study time'
      });
    } else if (trends.studyTime < -0.1) {
      interpretations.push({
        metric: 'Study Time',
        trend: 'decreasing',
        strength: 'concerning',
        message: 'Your study time has been decreasing - try to maintain consistency'
      });
    }
    
    // Focus quality trend
    if (trends.focusQuality > 0.5) {
      interpretations.push({
        metric: 'Focus Quality',
        trend: 'improving',
        strength: 'positive',
        message: 'Your ability to maintain focus is improving'
      });
    } else if (trends.focusQuality < -0.5) {
      interpretations.push({
        metric: 'Focus Quality',
        trend: 'declining',
        strength: 'concerning',
        message: 'Focus quality is declining - consider using focus techniques'
      });
    }
    
    // Response speed trend
    if (trends.responseSpeed > 0.1) {
      interpretations.push({
        metric: 'Response Speed',
        trend: 'improving',
        strength: 'positive',
        message: 'You are getting faster at answering questions'
      });
    }
    
    return interpretations;
  }

  // Perform comparative analysis between different periods or subjects
  performComparativeAnalysis(comparison) {
    const { type, periods, subjects } = comparison;
    
    if (type === 'period') {
      return this.comparePeriods(periods);
    } else if (type === 'subject') {
      return this.compareSubjects(subjects);
    } else if (type === 'timeframe') {
      return this.compareTimeframes(comparison.timeframes);
    }
    
    throw new Error('Invalid comparison type');
  }

  // Compare performance between different time periods
  comparePeriods(periods) {
    const comparisons = periods.map(period => {
      const metrics = this.calculatePerformanceMetrics(period.timeframe, period.subject);
      return {
        period: period.label || period.timeframe,
        metrics,
        timeframe: period.timeframe,
        subject: period.subject
      };
    });
    
    // Calculate differences
    const analysis = {
      comparisons,
      insights: [],
      recommendations: []
    };
    
    if (comparisons.length >= 2) {
      const current = comparisons[0];
      const previous = comparisons[1];
      
      // Compare key metrics
      const accuracyDiff = current.metrics.overallAccuracy - previous.metrics.overallAccuracy;
      const consistencyDiff = current.metrics.consistencyScore - previous.metrics.consistencyScore;
      const studyTimeDiff = current.metrics.totalStudyTime - previous.metrics.totalStudyTime;
      
      if (accuracyDiff > 5) {
        analysis.insights.push(`Accuracy improved by ${accuracyDiff.toFixed(1)}% compared to previous period`);
      } else if (accuracyDiff < -5) {
        analysis.insights.push(`Accuracy declined by ${Math.abs(accuracyDiff).toFixed(1)}% compared to previous period`);
        analysis.recommendations.push('Focus on reviewing weak areas and understanding concepts better');
      }
      
      if (studyTimeDiff > 5) {
        analysis.insights.push(`Study time increased by ${studyTimeDiff.toFixed(1)} hours`);
      } else if (studyTimeDiff < -5) {
        analysis.insights.push(`Study time decreased by ${Math.abs(studyTimeDiff).toFixed(1)} hours`);
        analysis.recommendations.push('Try to maintain consistent study schedule');
      }
    }
    
    return analysis;
  }

  // Compare performance between different subjects
  compareSubjects(subjects) {
    const comparisons = subjects.map(subject => {
      const metrics = this.calculatePerformanceMetrics('monthly', subject);
      return {
        subject,
        metrics
      };
    });
    
    // Identify best and worst performing subjects
    const sortedByAccuracy = [...comparisons].sort((a, b) => b.metrics.overallAccuracy - a.metrics.overallAccuracy);
    const bestSubject = sortedByAccuracy[0];
    const worstSubject = sortedByAccuracy[sortedByAccuracy.length - 1];
    
    return {
      comparisons,
      bestPerforming: bestSubject,
      worstPerforming: worstSubject,
      insights: [
        `Strongest subject: ${bestSubject.subject} (${bestSubject.metrics.overallAccuracy.toFixed(1)}% accuracy)`,
        `Needs attention: ${worstSubject.subject} (${worstSubject.metrics.overallAccuracy.toFixed(1)}% accuracy)`
      ],
      recommendations: [
        `Allocate more study time to ${worstSubject.subject}`,
        `Use successful strategies from ${bestSubject.subject} for other subjects`
      ]
    };
  }

  // Get performance insights and recommendations
  getPerformanceInsights(timeframe = 'monthly', subject = null) {
    const metrics = this.calculatePerformanceMetrics(timeframe, subject);
    const trends = this.performTrendAnalysis(timeframe, subject);
    
    const insights = {
      summary: this.generatePerformanceSummary(metrics),
      keyMetrics: {
        performanceScore: metrics.performanceScore,
        grade: metrics.performanceGrade,
        accuracy: metrics.overallAccuracy,
        consistency: metrics.consistencyScore,
        studyTime: metrics.totalStudyTime
      },
      trends: trends.analysis,
      strengths: metrics.strengthAreas,
      weaknesses: metrics.weaknessAreas,
      recommendations: this.generateRecommendations(metrics, trends),
      nextSteps: this.generateNextSteps(metrics, trends),
      generatedAt: new Date()
    };
    
    return insights;
  }

  // Generate performance summary
  generatePerformanceSummary(metrics) {
    const grade = metrics.performanceGrade;
    const score = metrics.performanceScore;
    
    let summary = `Your current performance grade is ${grade} with a score of ${score}/100. `;
    
    if (score >= 90) {
      summary += "Excellent work! You're performing at a very high level.";
    } else if (score >= 75) {
      summary += "Good performance! You're on the right track with room for improvement.";
    } else if (score >= 60) {
      summary += "Average performance. Focus on consistency and accuracy to improve.";
    } else {
      summary += "There's significant room for improvement. Consider adjusting your study strategy.";
    }
    
    return summary;
  }

  // Generate personalized recommendations
  generateRecommendations(metrics, trends) {
    const recommendations = [];
    
    // Based on accuracy
    if (metrics.overallAccuracy < 70) {
      recommendations.push({
        category: 'Accuracy',
        priority: 'high',
        suggestion: 'Focus on understanding concepts before attempting practice questions',
        action: 'Spend more time on theory and explanations'
      });
    }
    
    // Based on consistency
    if (metrics.consistencyScore < 60) {
      recommendations.push({
        category: 'Consistency',
        priority: 'medium',
        suggestion: 'Establish a regular study routine to improve consistency',
        action: 'Set fixed study times and use reminders'
      });
    }
    
    // Based on study time
    if (metrics.totalStudyTime < 20) { // Less than 20 hours per month
      recommendations.push({
        category: 'Study Time',
        priority: 'high',
        suggestion: 'Increase your study time to see better results',
        action: 'Aim for at least 1 hour of study per day'
      });
    }
    
    // Based on trends
    trends.analysis.forEach(trend => {
      if (trend.trend === 'declining' && trend.strength === 'concerning') {
        recommendations.push({
          category: trend.metric,
          priority: 'high',
          suggestion: `Address the declining trend in ${trend.metric}`,
          action: trend.message
        });
      }
    });
    
    return recommendations;
  }

  // Generate next steps
  generateNextSteps(metrics, trends) {
    const steps = [];
    
    // Immediate actions (next 7 days)
    if (metrics.weaknessAreas.length > 0) {
      const primaryWeakness = metrics.weaknessAreas[0];
      steps.push({
        timeframe: 'immediate',
        action: `Address ${primaryWeakness.area}`,
        description: primaryWeakness.suggestion || `Focus on improving ${primaryWeakness.area}`,
        priority: 'high'
      });
    }
    
    // Short-term goals (next 30 days)
    if (metrics.performanceScore < 75) {
      steps.push({
        timeframe: 'short-term',
        action: 'Improve overall performance score',
        description: `Target: Increase performance score from ${metrics.performanceScore} to ${Math.min(100, metrics.performanceScore + 15)}`,
        priority: 'medium'
      });
    }
    
    // Long-term goals (next 90 days)
    steps.push({
      timeframe: 'long-term',
      action: 'Achieve consistent high performance',
      description: 'Maintain accuracy above 80% and consistency above 75%',
      priority: 'medium'
    });
    
    return steps;
  }

  // Save performance data
  savePerformanceData() {
    try {
      if (window.profileManager) {
        const profile = window.profileManager.profileData;
        profile.performanceHistory = this.performanceData.performanceHistory;
        profile.sessionHistory = this.performanceData.sessions;
        window.profileManager.saveProfile();
      }
    } catch (error) {
      console.error('Error saving performance data:', error);
    }
  }

  // Invalidate analysis cache
  invalidateCache() {
    this.analysisCache.clear();
  }

  // Generate unique ID
  generateId() {
    return 'perf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Export performance data
  exportPerformanceData() {
    return {
      ...this.performanceData,
      settings: this.settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import performance data
  importPerformanceData(data) {
    try {
      if (data.sessions && Array.isArray(data.sessions)) {
        this.performanceData.sessions = [...data.sessions, ...this.performanceData.sessions];
      }
      
      if (data.assessments && Array.isArray(data.assessments)) {
        this.performanceData.assessments = [...data.assessments, ...this.performanceData.assessments];
      }
      
      if (data.performanceHistory && Array.isArray(data.performanceHistory)) {
        this.performanceData.performanceHistory = [...data.performanceHistory, ...this.performanceData.performanceHistory];
      }
      
      this.savePerformanceData();
      this.invalidateCache();
      
      return { success: true, message: 'Performance data imported successfully' };
    } catch (error) {
      console.error('Error importing performance data:', error);
      return { success: false, message: 'Failed to import data: ' + error.message };
    }
  }

  // Get performance dashboard data
  getDashboardData(timeframe = 'monthly') {
    const metrics = this.calculatePerformanceMetrics(timeframe);
    const trends = this.performTrendAnalysis(timeframe);
    
    return {
      overview: {
        score: metrics.performanceScore,
        grade: metrics.performanceGrade,
        accuracy: metrics.overallAccuracy,
        studyTime: metrics.totalStudyTime,
        consistency: metrics.consistencyScore
      },
      charts: {
        accuracyTrend: trends.dataPoints.map(p => ({
          date: p.date,
          value: p.accuracy
        })),
        studyTimeTrend: trends.dataPoints.map(p => ({
          date: p.date,
          value: p.studyTime
        })),
        focusQualityTrend: trends.dataPoints.map(p => ({
          date: p.date,
          value: p.focusQuality
        }))
      },
      insights: {
        strengths: metrics.strengthAreas.slice(0, 3),
        weaknesses: metrics.weaknessAreas.slice(0, 3),
        trends: trends.analysis
      },
      recommendations: this.generateRecommendations(metrics, trends).slice(0, 5)
    };
  }
}

// Initialize global performance analyzer
window.performanceAnalyzer = new PerformanceAnalyzer();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceAnalyzer;
}