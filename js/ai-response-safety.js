// AI Response Safety System - Content filtering and validation for AI responses
class AIResponseSafety {
  constructor(validationSystem) {
    this.validationSystem = validationSystem;
    this.contentFilters = new Map();
    this.qualityScorers = new Map();
    this.fallbackResponses = new Map();
    this.safetyConfig = {
      minQualityScore: 0.6,
      maxResponseLength: 10000,
      enableContentFiltering: true,
      enableQualityScoring: true,
      logFilteredContent: true
    };
    
    this.initializeContentFilters();
    this.initializeQualityScorers();
    this.initializeFallbackResponses();
  }

  // Initialize content filtering rules
  initializeContentFilters() {
    // Harmful content filter
    this.contentFilters.set('harmful', (response) => {
      const harmfulPatterns = [
        // Violence and harm
        /how\s+to\s+(kill|murder|harm|hurt|attack)/gi,
        /instructions?\s+(for|to)\s+(making|creating|building)\s+(bomb|explosive|weapon)/gi,
        /suicide\s+(methods?|instructions?|how\s+to)/gi,
        /self\s+harm\s+(methods?|instructions?)/gi,
        
        // Illegal activities
        /how\s+to\s+(steal|rob|break\s+into|hack\s+into)/gi,
        /illegal\s+(drugs|substances)\s+(manufacturing|creation|synthesis)/gi,
        /money\s+laundering\s+(methods?|techniques?)/gi,
        /tax\s+evasion\s+(strategies?|methods?)/gi,
        
        // Hate speech and discrimination
        /racial\s+(slurs?|epithets?)/gi,
        /hate\s+speech\s+against/gi,
        /discriminatory\s+(language|content)/gi,
        
        // Privacy violations
        /personal\s+(information|data|details)\s+of\s+[a-zA-Z\s]+/gi,
        /private\s+(address|phone|email)\s+of/gi,
        /doxxing\s+(information|details)/gi,
        
        // Misinformation
        /false\s+(medical|health)\s+(advice|information)/gi,
        /conspiracy\s+(theories?|claims?)\s+(about|regarding)/gi,
        /fake\s+(news|information)\s+(about|regarding)/gi
      ];
      
      const isHarmful = harmfulPatterns.some(pattern => pattern.test(response));
      
      return {
        passed: !isHarmful,
        reason: isHarmful ? 'Contains potentially harmful content' : null,
        severity: isHarmful ? 'high' : 'none'
      };
    });

    // Inappropriate content filter
    this.contentFilters.set('inappropriate', (response) => {
      const inappropriatePatterns = [
        // Adult content
        /explicit\s+(sexual|adult)\s+content/gi,
        /pornographic\s+(material|content)/gi,
        /sexual\s+(acts|activities)\s+involving/gi,
        
        // Profanity (basic check)
        /\b(fuck|shit|damn|hell|bitch|asshole|bastard)\b/gi,
        
        // Inappropriate requests
        /romantic\s+(relationship|involvement)\s+with/gi,
        /sexual\s+(relationship|encounter)\s+with/gi,
        /inappropriate\s+(behavior|conduct)\s+with/gi
      ];
      
      const isInappropriate = inappropriatePatterns.some(pattern => pattern.test(response));
      
      return {
        passed: !isInappropriate,
        reason: isInappropriate ? 'Contains inappropriate content' : null,
        severity: isInappropriate ? 'medium' : 'none'
      };
    });

    // Misinformation filter
    this.contentFilters.set('misinformation', (response) => {
      const misinformationPatterns = [
        // Medical misinformation
        /vaccines?\s+(cause|lead\s+to)\s+(autism|cancer|death)/gi,
        /covid\s+is\s+(fake|hoax|conspiracy)/gi,
        /drinking\s+(bleach|disinfectant)\s+(cures?|treats?)/gi,
        
        // Scientific misinformation
        /earth\s+is\s+flat/gi,
        /climate\s+change\s+is\s+(fake|hoax)/gi,
        /evolution\s+is\s+(false|fake|theory\s+only)/gi,
        
        // Historical misinformation
        /holocaust\s+(never\s+happened|is\s+fake)/gi,
        /moon\s+landing\s+(was\s+)?fake/gi,
        
        // Financial misinformation
        /guaranteed\s+(profit|returns?)\s+of\s+\d+%/gi,
        /risk\s+free\s+(investment|trading)/gi,
        /get\s+rich\s+quick\s+scheme/gi
      ];
      
      const isMisinformation = misinformationPatterns.some(pattern => pattern.test(response));
      
      return {
        passed: !isMisinformation,
        reason: isMisinformation ? 'Contains potential misinformation' : null,
        severity: isMisinformation ? 'high' : 'none'
      };
    });

    // Technical security filter
    this.contentFilters.set('security', (response) => {
      const securityPatterns = [
        // Code injection
        /<script[^>]*>.*?<\/script>/gis,
        /javascript\s*:/gi,
        /eval\s*\(/gi,
        /setTimeout\s*\(/gi,
        /Function\s*\(/gi,
        
        // System commands
        /rm\s+-rf\s+\//gi,
        /format\s+c\s*:/gi,
        /del\s+\/[sf]\s+\*/gi,
        
        // Network attacks
        /ddos\s+(attack|script)/gi,
        /port\s+scanning\s+(script|tool)/gi,
        /sql\s+injection\s+(payload|attack)/gi,
        
        // Credential harvesting
        /password\s+(harvesting|stealing)/gi,
        /keylogger\s+(installation|script)/gi,
        /credential\s+(dumping|extraction)/gi
      ];
      
      const isSecurityThreat = securityPatterns.some(pattern => pattern.test(response));
      
      return {
        passed: !isSecurityThreat,
        reason: isSecurityThreat ? 'Contains potential security threats' : null,
        severity: isSecurityThreat ? 'high' : 'none'
      };
    });

    // Privacy filter
    this.contentFilters.set('privacy', (response) => {
      const privacyPatterns = [
        // Personal information patterns
        /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
        /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card pattern
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email pattern
        /\b\d{3}-\d{3}-\d{4}\b/g, // Phone number pattern
        
        // API keys and tokens
        /api[_-]?key\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}["\']?/gi,
        /access[_-]?token\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}["\']?/gi,
        /secret[_-]?key\s*[:=]\s*["\']?[a-zA-Z0-9]{20,}["\']?/gi,
        
        // Database credentials
        /password\s*[:=]\s*["\']?[^\s"']+["\']?/gi,
        /username\s*[:=]\s*["\']?[^\s"']+["\']?/gi
      ];
      
      const containsPrivateInfo = privacyPatterns.some(pattern => pattern.test(response));
      
      return {
        passed: !containsPrivateInfo,
        reason: containsPrivateInfo ? 'Contains potential private information' : null,
        severity: containsPrivateInfo ? 'high' : 'none'
      };
    });
  }

  // Initialize quality scoring algorithms
  initializeQualityScorers() {
    // Relevance scorer
    this.qualityScorers.set('relevance', (response, context) => {
      if (!context || !context.query) return 0.5;
      
      const query = context.query.toLowerCase();
      const responseText = response.toLowerCase();
      
      // Simple keyword matching
      const queryWords = query.split(/\s+/).filter(word => word.length > 2);
      const matchedWords = queryWords.filter(word => responseText.includes(word));
      
      const relevanceScore = queryWords.length > 0 ? matchedWords.length / queryWords.length : 0.5;
      
      return Math.min(relevanceScore * 1.2, 1.0); // Boost slightly but cap at 1.0
    });

    // Coherence scorer
    this.qualityScorers.set('coherence', (response) => {
      // Basic coherence checks
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      if (sentences.length === 0) return 0;
      if (sentences.length === 1) return 0.8;
      
      // Check for repeated phrases (indicates poor coherence)
      const phrases = sentences.map(s => s.trim().toLowerCase());
      const uniquePhrases = new Set(phrases);
      const repetitionRatio = uniquePhrases.size / phrases.length;
      
      // Check average sentence length (too short or too long indicates issues)
      const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
      const lengthScore = avgSentenceLength > 10 && avgSentenceLength < 200 ? 1.0 : 0.6;
      
      return (repetitionRatio + lengthScore) / 2;
    });

    // Completeness scorer
    this.qualityScorers.set('completeness', (response, context) => {
      // Check if response seems complete
      const endsWithPunctuation = /[.!?]$/.test(response.trim());
      const hasMinimumLength = response.length >= 20;
      const notTruncated = !response.includes('...') && !response.includes('[truncated]');
      
      let score = 0;
      if (endsWithPunctuation) score += 0.4;
      if (hasMinimumLength) score += 0.3;
      if (notTruncated) score += 0.3;
      
      return score;
    });

    // Educational value scorer (for UPSC context)
    this.qualityScorers.set('educational', (response, context) => {
      const educationalIndicators = [
        /explanation/gi,
        /because/gi,
        /therefore/gi,
        /however/gi,
        /furthermore/gi,
        /in\s+conclusion/gi,
        /for\s+example/gi,
        /such\s+as/gi,
        /according\s+to/gi,
        /research\s+shows/gi,
        /studies\s+indicate/gi
      ];
      
      const indicatorCount = educationalIndicators.reduce((count, pattern) => {
        return count + (response.match(pattern) || []).length;
      }, 0);
      
      // Normalize based on response length
      const density = indicatorCount / (response.length / 100);
      return Math.min(density * 0.2, 1.0);
    });
  }

  // Initialize fallback responses
  initializeFallbackResponses() {
    this.fallbackResponses.set('harmful', 
      "I can't provide information that could be harmful. Let me help you with something else related to your UPSC preparation."
    );
    
    this.fallbackResponses.set('inappropriate', 
      "I'm designed to help with educational content. Let's focus on your UPSC studies instead."
    );
    
    this.fallbackResponses.set('misinformation', 
      "I want to make sure I provide accurate information. Let me give you a reliable response based on verified sources."
    );
    
    this.fallbackResponses.set('security', 
      "I can't provide information about security vulnerabilities. How can I help with your exam preparation instead?"
    );
    
    this.fallbackResponses.set('privacy', 
      "I notice the response might contain sensitive information. Let me provide a safer alternative."
    );
    
    this.fallbackResponses.set('low_quality', 
      "Let me provide a more comprehensive response to better help with your question."
    );
    
    this.fallbackResponses.set('generic_error', 
      "I encountered an issue generating a response. Could you please rephrase your question?"
    );
  }

  // Main safety validation method
  async validateResponse(response, context = {}) {
    const validationResult = {
      isValid: true,
      filteredResponse: response,
      qualityScore: 0,
      issues: [],
      appliedFilters: [],
      fallbackUsed: false,
      originalResponse: response
    };

    try {
      // Step 1: Content filtering
      if (this.safetyConfig.enableContentFiltering) {
        const filterResults = await this.runContentFilters(response);
        
        for (const [filterName, result] of filterResults) {
          if (!result.passed) {
            validationResult.isValid = false;
            validationResult.issues.push({
              type: 'content_filter',
              filter: filterName,
              reason: result.reason,
              severity: result.severity
            });
            validationResult.appliedFilters.push(filterName);
          }
        }
      }

      // Step 2: Quality scoring
      if (this.safetyConfig.enableQualityScoring) {
        const qualityScore = await this.calculateQualityScore(response, context);
        validationResult.qualityScore = qualityScore;
        
        if (qualityScore < this.safetyConfig.minQualityScore) {
          validationResult.isValid = false;
          validationResult.issues.push({
            type: 'quality',
            reason: `Quality score ${qualityScore.toFixed(2)} below minimum ${this.safetyConfig.minQualityScore}`,
            severity: 'medium'
          });
        }
      }

      // Step 3: Technical validation
      const technicalValidation = this.validationSystem.validateAIResponse(response);
      if (!technicalValidation.isValid) {
        validationResult.isValid = false;
        validationResult.issues.push({
          type: 'technical',
          reason: 'Failed technical validation',
          details: technicalValidation.errors,
          severity: 'medium'
        });
        
        // Use sanitized version if available
        if (technicalValidation.sanitized && technicalValidation.sanitized.response) {
          validationResult.filteredResponse = technicalValidation.sanitized.response;
        }
      }

      // Step 4: Apply fallback if needed
      if (!validationResult.isValid) {
        const fallbackResponse = this.getFallbackResponse(validationResult.issues);
        if (fallbackResponse) {
          validationResult.filteredResponse = fallbackResponse;
          validationResult.fallbackUsed = true;
          validationResult.isValid = true; // Fallback makes it valid
        }
      }

      // Step 5: Log filtered content if enabled
      if (this.safetyConfig.logFilteredContent && validationResult.issues.length > 0) {
        this.logFilteredContent(response, validationResult);
      }

    } catch (error) {
      console.error('Error in response validation:', error);
      validationResult.isValid = false;
      validationResult.issues.push({
        type: 'system_error',
        reason: 'Validation system error',
        severity: 'high'
      });
      validationResult.filteredResponse = this.fallbackResponses.get('generic_error');
      validationResult.fallbackUsed = true;
    }

    return validationResult;
  }

  // Run all content filters
  async runContentFilters(response) {
    const results = new Map();
    
    for (const [filterName, filterFn] of this.contentFilters) {
      try {
        const result = await filterFn(response);
        results.set(filterName, result);
      } catch (error) {
        console.error(`Error in content filter ${filterName}:`, error);
        results.set(filterName, {
          passed: false,
          reason: 'Filter execution error',
          severity: 'high'
        });
      }
    }
    
    return results;
  }

  // Calculate overall quality score
  async calculateQualityScore(response, context) {
    let totalScore = 0;
    let scorerCount = 0;
    
    for (const [scorerName, scorerFn] of this.qualityScorers) {
      try {
        const score = await scorerFn(response, context);
        totalScore += score;
        scorerCount++;
      } catch (error) {
        console.error(`Error in quality scorer ${scorerName}:`, error);
      }
    }
    
    return scorerCount > 0 ? totalScore / scorerCount : 0;
  }

  // Get appropriate fallback response
  getFallbackResponse(issues) {
    // Prioritize by severity
    const highSeverityIssue = issues.find(issue => issue.severity === 'high');
    if (highSeverityIssue) {
      if (highSeverityIssue.filter) {
        return this.fallbackResponses.get(highSeverityIssue.filter);
      }
      return this.fallbackResponses.get('generic_error');
    }
    
    // Check for specific filter types
    const contentIssue = issues.find(issue => issue.type === 'content_filter');
    if (contentIssue && contentIssue.filter) {
      return this.fallbackResponses.get(contentIssue.filter);
    }
    
    // Quality issues
    const qualityIssue = issues.find(issue => issue.type === 'quality');
    if (qualityIssue) {
      return this.fallbackResponses.get('low_quality');
    }
    
    // Default fallback
    return this.fallbackResponses.get('generic_error');
  }

  // Log filtered content for monitoring
  logFilteredContent(originalResponse, validationResult) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      originalLength: originalResponse.length,
      issues: validationResult.issues,
      qualityScore: validationResult.qualityScore,
      fallbackUsed: validationResult.fallbackUsed,
      // Don't log the actual content for privacy
      contentHash: this.hashContent(originalResponse)
    };
    
    // Store in local storage for monitoring (in production, send to logging service)
    const logs = JSON.parse(localStorage.getItem('ai_safety_logs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 100 entries
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('ai_safety_logs', JSON.stringify(logs));
  }

  // Simple content hashing for logging
  hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Configuration methods
  updateConfig(newConfig) {
    this.safetyConfig = { ...this.safetyConfig, ...newConfig };
  }

  addContentFilter(name, filterFn) {
    this.contentFilters.set(name, filterFn);
  }

  addQualityScorer(name, scorerFn) {
    this.qualityScorers.set(name, scorerFn);
  }

  addFallbackResponse(type, response) {
    this.fallbackResponses.set(type, response);
  }

  // Get safety statistics
  getSafetyStats() {
    const logs = JSON.parse(localStorage.getItem('ai_safety_logs') || '[]');
    
    const stats = {
      totalResponses: logs.length,
      filteredResponses: logs.filter(log => log.issues.length > 0).length,
      fallbacksUsed: logs.filter(log => log.fallbackUsed).length,
      averageQualityScore: 0,
      issuesByType: {},
      issuesBySeverity: {}
    };
    
    if (logs.length > 0) {
      stats.averageQualityScore = logs.reduce((sum, log) => sum + log.qualityScore, 0) / logs.length;
      
      logs.forEach(log => {
        log.issues.forEach(issue => {
          stats.issuesByType[issue.type] = (stats.issuesByType[issue.type] || 0) + 1;
          stats.issuesBySeverity[issue.severity] = (stats.issuesBySeverity[issue.severity] || 0) + 1;
        });
      });
    }
    
    return stats;
  }

  // Clear safety logs
  clearSafetyLogs() {
    localStorage.removeItem('ai_safety_logs');
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIResponseSafety;
}