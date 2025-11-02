// ErrorHandler - Comprehensive error handling and monitoring system
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.isOnline = navigator.onLine;
    
    this.initializeErrorHandling();
    this.initializeNetworkMonitoring();
    this.loadErrorLog();
  }

  // Initialize global error handling
  initializeErrorHandling() {
    // Global error handler for uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Global handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        error: event.reason,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError({
          type: 'resource',
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      }
    }, true);
  }

  // Initialize network monitoring
  initializeNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNotification('Connection restored', 'success');
      this.retryFailedOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNotification('Connection lost - some features may be limited', 'warning');
    });
  }

  // Main error handling method
  handleError(errorInfo, options = {}) {
    const {
      showToUser = true,
      logError = true,
      attemptRecovery = true,
      context = null
    } = options;

    // Enhance error info with context
    const enhancedError = {
      ...errorInfo,
      id: this.generateErrorId(),
      context: context,
      isOnline: this.isOnline,
      localStorage: this.checkLocalStorageHealth(),
      memoryUsage: this.getMemoryUsage()
    };

    // Log the error
    if (logError) {
      this.logError(enhancedError);
    }

    // Show user-friendly message
    if (showToUser) {
      this.showUserFriendlyError(enhancedError);
    }

    // Attempt automatic recovery
    if (attemptRecovery) {
      this.attemptRecovery(enhancedError);
    }

    return enhancedError.id;
  }

  // Generate unique error ID
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log error to internal storage
  logError(errorInfo) {
    this.errorLog.unshift(errorInfo);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Save to localStorage
    this.saveErrorLog();

    // Console log for development
    if (this.isDevelopment()) {
      console.group(`🚨 Error ${errorInfo.id}`);
      console.error('Message:', errorInfo.message);
      console.error('Type:', errorInfo.type);
      if (errorInfo.stack) console.error('Stack:', errorInfo.stack);
      if (errorInfo.context) console.error('Context:', errorInfo.context);
      console.groupEnd();
    }
  }

  // Show user-friendly error messages
  showUserFriendlyError(errorInfo) {
    const userMessage = this.getUserFriendlyMessage(errorInfo);
    const actions = this.getSuggestedActions(errorInfo);

    // Use existing toast system if available, otherwise create our own
    if (typeof showToast === 'function') {
      showToast(userMessage, 'error');
    } else {
      this.showErrorNotification(userMessage, actions, errorInfo.id);
    }
  }

  // Get user-friendly error message
  getUserFriendlyMessage(errorInfo) {
    const messageMap = {
      'network': 'Connection problem. Please check your internet connection.',
      'storage': 'Unable to save your data. Please try again.',
      'validation': 'Please check your input and try again.',
      'permission': 'Permission denied. Please check your browser settings.',
      'resource': 'Failed to load content. Please refresh the page.',
      'javascript': 'Something went wrong. Please refresh the page.',
      'promise': 'An operation failed. Please try again.',
      'timeout': 'The operation took too long. Please try again.',
      'quota': 'Storage is full. Please clear some data and try again.'
    };

    // Check for specific error patterns
    if (errorInfo.message?.includes('localStorage')) {
      return messageMap.storage;
    }
    if (errorInfo.message?.includes('fetch') || errorInfo.message?.includes('network')) {
      return messageMap.network;
    }
    if (errorInfo.message?.includes('quota') || errorInfo.message?.includes('storage')) {
      return messageMap.quota;
    }

    return messageMap[errorInfo.type] || 'An unexpected error occurred. Please try again.';
  }

  // Get suggested actions for error recovery
  getSuggestedActions(errorInfo) {
    const actions = [];

    if (errorInfo.type === 'network' || !this.isOnline) {
      actions.push({
        text: 'Retry',
        action: () => this.retryLastOperation(errorInfo.id)
      });
    }

    if (errorInfo.type === 'storage' || errorInfo.message?.includes('localStorage')) {
      actions.push({
        text: 'Clear Cache',
        action: () => this.clearCorruptedData()
      });
    }

    if (errorInfo.type === 'resource') {
      actions.push({
        text: 'Refresh Page',
        action: () => window.location.reload()
      });
    }

    // Always provide a general retry option
    actions.push({
      text: 'Try Again',
      action: () => this.retryLastOperation(errorInfo.id)
    });

    return actions;
  }

  // Show error notification with actions
  showErrorNotification(message, actions, errorId) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'error-notification fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">${message}</p>
          <div class="mt-2 flex gap-2">
            ${actions.map(action => `
              <button class="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors" 
                      onclick="errorHandler.executeAction('${errorId}', '${action.text}')">
                ${action.text}
              </button>
            `).join('')}
            <button class="text-xs text-white/70 hover:text-white ml-auto" 
                    onclick="this.parentElement.parentElement.parentElement.remove()">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    `;

    // Store actions for later execution
    this.errorActions = this.errorActions || new Map();
    this.errorActions.set(errorId, actions);

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  // Execute error action
  executeAction(errorId, actionText) {
    const actions = this.errorActions?.get(errorId);
    if (actions) {
      const action = actions.find(a => a.text === actionText);
      if (action && typeof action.action === 'function') {
        try {
          action.action();
        } catch (error) {
          this.handleError({
            type: 'javascript',
            message: `Error executing recovery action: ${error.message}`,
            error: error,
            context: { originalErrorId: errorId, actionText }
          });
        }
      }
    }
  }

  // Attempt automatic error recovery
  attemptRecovery(errorInfo) {
    switch (errorInfo.type) {
      case 'storage':
        this.recoverFromStorageError(errorInfo);
        break;
      case 'network':
        this.recoverFromNetworkError(errorInfo);
        break;
      case 'resource':
        this.recoverFromResourceError(errorInfo);
        break;
      case 'javascript':
        this.recoverFromJavaScriptError(errorInfo);
        break;
    }
  }

  // Storage error recovery
  recoverFromStorageError(errorInfo) {
    try {
      // Check if localStorage is available
      if (!this.checkLocalStorageHealth()) {
        // Try to clear corrupted data
        this.clearCorruptedData();
        this.showNotification('Storage cleared and reset', 'info');
      }
    } catch (error) {
      console.warn('Could not recover from storage error:', error);
    }
  }

  // Network error recovery
  recoverFromNetworkError(errorInfo) {
    if (!this.isOnline) {
      // Queue operation for retry when online
      this.queueForRetry(errorInfo);
    } else {
      // Retry immediately with exponential backoff
      this.scheduleRetry(errorInfo);
    }
  }

  // Resource error recovery
  recoverFromResourceError(errorInfo) {
    // Try to reload the resource with a cache-busting parameter
    if (errorInfo.source) {
      const element = document.querySelector(`[src="${errorInfo.source}"], [href="${errorInfo.source}"]`);
      if (element) {
        const newSrc = errorInfo.source + (errorInfo.source.includes('?') ? '&' : '?') + 'retry=' + Date.now();
        if (element.src) element.src = newSrc;
        if (element.href) element.href = newSrc;
      }
    }
  }

  // JavaScript error recovery
  recoverFromJavaScriptError(errorInfo) {
    // Try to reinitialize critical components
    if (errorInfo.message?.includes('profileManager')) {
      this.reinitializeProfileManager();
    }
    
    // Recreate Lucide icons if they failed
    if (errorInfo.message?.includes('lucide') && typeof lucide !== 'undefined') {
      try {
        lucide.createIcons();
      } catch (error) {
        console.warn('Could not recreate Lucide icons:', error);
      }
    }
  }

  // Reinitialize profile manager
  reinitializeProfileManager() {
    try {
      if (typeof ProfileManager !== 'undefined') {
        window.profileManager = new ProfileManager();
        this.showNotification('Profile system restored', 'success');
      }
    } catch (error) {
      console.warn('Could not reinitialize profile manager:', error);
    }
  }

  // Queue operation for retry when online
  queueForRetry(errorInfo) {
    const retryQueue = JSON.parse(localStorage.getItem('errorRetryQueue') || '[]');
    retryQueue.push({
      ...errorInfo,
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem('errorRetryQueue', JSON.stringify(retryQueue));
  }

  // Retry failed operations when back online
  retryFailedOperations() {
    try {
      const retryQueue = JSON.parse(localStorage.getItem('errorRetryQueue') || '[]');
      if (retryQueue.length > 0) {
        this.showNotification(`Retrying ${retryQueue.length} failed operations...`, 'info');
        
        retryQueue.forEach(errorInfo => {
          this.scheduleRetry(errorInfo, 1000); // Retry after 1 second
        });
        
        // Clear the queue
        localStorage.removeItem('errorRetryQueue');
      }
    } catch (error) {
      console.warn('Could not retry failed operations:', error);
    }
  }

  // Schedule retry with exponential backoff
  scheduleRetry(errorInfo, delay = null) {
    const retryKey = errorInfo.id || errorInfo.message;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;
    
    if (currentAttempts >= this.maxRetries) {
      this.showNotification('Maximum retry attempts reached', 'error');
      return;
    }

    const retryDelay = delay || Math.pow(2, currentAttempts) * 1000; // Exponential backoff
    
    setTimeout(() => {
      this.retryAttempts.set(retryKey, currentAttempts + 1);
      this.retryLastOperation(errorInfo.id);
    }, retryDelay);
  }

  // Retry last operation
  retryLastOperation(errorId) {
    // This would need to be implemented based on the specific operation
    // For now, we'll just show a message
    this.showNotification('Retrying operation...', 'info');
    
    // In a real implementation, you would store the operation context
    // and replay it here
  }

  // Clear corrupted data
  clearCorruptedData() {
    try {
      // List of keys that might be corrupted
      const keysToCheck = [
        'userProfile', 'bookmarks', 'studyStats', 'preferences',
        'notes', 'flashcards', 'mcqProgress', 'studySessions'
      ];
      
      keysToCheck.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            JSON.parse(data); // Test if it's valid JSON
          }
        } catch (error) {
          console.warn(`Removing corrupted data for key: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Reinitialize profile manager to restore defaults
      if (typeof ProfileManager !== 'undefined') {
        window.profileManager = new ProfileManager();
      }
      
    } catch (error) {
      console.error('Error clearing corrupted data:', error);
    }
  }

  // Check localStorage health
  checkLocalStorageHealth() {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get memory usage information
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Check if in development mode
  isDevelopment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
  }

  // Show notification (fallback if toast system not available)
  showNotification(message, type = 'info') {
    if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Save error log to localStorage
  saveErrorLog() {
    try {
      localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
    } catch (error) {
      console.warn('Could not save error log:', error);
    }
  }

  // Load error log from localStorage
  loadErrorLog() {
    try {
      const saved = localStorage.getItem('errorLog');
      if (saved) {
        this.errorLog = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Could not load error log:', error);
      this.errorLog = [];
    }
  }

  // Get error statistics
  getErrorStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recent24h = this.errorLog.filter(error => 
      new Date(error.timestamp) > last24Hours
    );
    const recentWeek = this.errorLog.filter(error => 
      new Date(error.timestamp) > lastWeek
    );

    const typeCount = {};
    this.errorLog.forEach(error => {
      typeCount[error.type] = (typeCount[error.type] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      last24Hours: recent24h.length,
      lastWeek: recentWeek.length,
      byType: typeCount,
      mostRecent: this.errorLog[0] || null
    };
  }

  // Clear error log
  clearErrorLog() {
    this.errorLog = [];
    localStorage.removeItem('errorLog');
  }

  // Export error log for debugging
  exportErrorLog() {
    const data = {
      errors: this.errorLog,
      stats: this.getErrorStats(),
      exportedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Wrap function with error handling
  wrapWithErrorHandling(fn, context = null) {
    return (...args) => {
      try {
        const result = fn.apply(this, args);
        
        // Handle promises
        if (result && typeof result.catch === 'function') {
          return result.catch(error => {
            this.handleError({
              type: 'promise',
              message: error.message || 'Promise rejection',
              error: error,
              context: context,
              functionName: fn.name
            });
            throw error; // Re-throw to maintain promise chain
          });
        }
        
        return result;
      } catch (error) {
        this.handleError({
          type: 'javascript',
          message: error.message || 'Function execution error',
          error: error,
          context: context,
          functionName: fn.name
        });
        throw error; // Re-throw to maintain normal error flow
      }
    };
  }

  // Safe execution wrapper
  safeExecute(fn, fallback = null, context = null) {
    try {
      return fn();
    } catch (error) {
      this.handleError({
        type: 'javascript',
        message: error.message || 'Safe execution failed',
        error: error,
        context: context
      }, { showToUser: false });
      
      return typeof fallback === 'function' ? fallback() : fallback;
    }
  }
}

// Initialize global error handler
window.errorHandler = new ErrorHandler();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
}