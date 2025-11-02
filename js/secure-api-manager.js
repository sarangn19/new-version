// Secure API Manager - Handles secure API key management and request validation
class SecureAPIManager {
  constructor() {
    this.apiKeys = new Map();
    this.requestSignatures = new Map();
    this.auditLogs = [];
    this.securityConfig = {
      enableRequestSigning: true,
      enableAuditLogging: true,
      keyRotationInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxAuditLogSize: 1000,
      requestTimeout: 30000, // 30 seconds
      maxRetries: 3,
      enableRateLimiting: true
    };
    
    this.initializeSecureStorage();
    this.setupKeyRotation();
    this.setupRequestInterceptors();
  }

  // Initialize secure storage for API keys
  initializeSecureStorage() {
    // In a real application, this would use more secure storage
    // For client-side demo, we'll use encrypted localStorage
    this.storageKey = 'secure_api_keys';
    this.encryptionKey = this.generateEncryptionKey();
  }

  // Generate encryption key for local storage
  generateEncryptionKey() {
    // Simple key derivation - in production, use proper key derivation
    const userAgent = navigator.userAgent;
    const timestamp = Date.now().toString();
    const combined = userAgent + timestamp;
    
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return hash.toString(16);
  }

  // Simple encryption for demo purposes
  encrypt(text) {
    // In production, use proper encryption like Web Crypto API
    const key = this.encryptionKey;
    let encrypted = '';
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode ^ keyChar);
    }
    
    return btoa(encrypted);
  }

  // Simple decryption for demo purposes
  decrypt(encryptedText) {
    try {
      const key = this.encryptionKey;
      const decoded = atob(encryptedText);
      let decrypted = '';
      
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode ^ keyChar);
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  // Store API key securely
  storeAPIKey(service, apiKey, metadata = {}) {
    try {
      const keyData = {
        key: apiKey,
        service: service,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        usageCount: 0,
        metadata: metadata,
        isActive: true
      };

      // Encrypt the API key
      const encryptedKey = this.encrypt(apiKey);
      const storageData = {
        ...keyData,
        key: encryptedKey
      };

      // Store in memory
      this.apiKeys.set(service, storageData);

      // Store in encrypted localStorage
      const allKeys = this.loadStoredKeys();
      allKeys[service] = storageData;
      localStorage.setItem(this.storageKey, this.encrypt(JSON.stringify(allKeys)));

      this.auditLog('API_KEY_STORED', { service, metadata });
      
      return true;
    } catch (error) {
      console.error('Failed to store API key:', error);
      this.auditLog('API_KEY_STORE_FAILED', { service, error: error.message });
      return false;
    }
  }

  // Retrieve API key securely
  getAPIKey(service) {
    try {
      let keyData = this.apiKeys.get(service);
      
      if (!keyData) {
        // Try to load from storage
        const storedKeys = this.loadStoredKeys();
        keyData = storedKeys[service];
        
        if (keyData) {
          this.apiKeys.set(service, keyData);
        }
      }

      if (!keyData || !keyData.isActive) {
        this.auditLog('API_KEY_NOT_FOUND', { service });
        return null;
      }

      // Decrypt the key
      const decryptedKey = this.decrypt(keyData.key);
      
      if (!decryptedKey) {
        this.auditLog('API_KEY_DECRYPT_FAILED', { service });
        return null;
      }

      // Update usage statistics
      keyData.lastUsed = new Date().toISOString();
      keyData.usageCount++;
      this.apiKeys.set(service, keyData);

      this.auditLog('API_KEY_ACCESSED', { service, usageCount: keyData.usageCount });
      
      return decryptedKey;
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      this.auditLog('API_KEY_RETRIEVAL_FAILED', { service, error: error.message });
      return null;
    }
  }

  // Load stored keys from localStorage
  loadStoredKeys() {
    try {
      const encryptedData = localStorage.getItem(this.storageKey);
      if (!encryptedData) return {};
      
      const decryptedData = this.decrypt(encryptedData);
      return decryptedData ? JSON.parse(decryptedData) : {};
    } catch (error) {
      console.error('Failed to load stored keys:', error);
      return {};
    }
  }

  // Rotate API key
  rotateAPIKey(service, newApiKey) {
    try {
      const oldKeyData = this.apiKeys.get(service);
      
      if (oldKeyData) {
        // Mark old key as inactive
        oldKeyData.isActive = false;
        oldKeyData.rotatedAt = new Date().toISOString();
      }

      // Store new key
      const success = this.storeAPIKey(service, newApiKey, {
        rotatedFrom: oldKeyData ? oldKeyData.createdAt : null,
        rotationReason: 'scheduled_rotation'
      });

      if (success) {
        this.auditLog('API_KEY_ROTATED', { service });
      }

      return success;
    } catch (error) {
      console.error('Failed to rotate API key:', error);
      this.auditLog('API_KEY_ROTATION_FAILED', { service, error: error.message });
      return false;
    }
  }

  // Setup automatic key rotation
  setupKeyRotation() {
    setInterval(() => {
      this.checkKeyRotation();
    }, 60 * 60 * 1000); // Check every hour
  }

  // Check if keys need rotation
  checkKeyRotation() {
    for (const [service, keyData] of this.apiKeys) {
      if (!keyData.isActive) continue;
      
      const createdAt = new Date(keyData.createdAt);
      const now = new Date();
      const age = now - createdAt;
      
      if (age > this.securityConfig.keyRotationInterval) {
        this.auditLog('API_KEY_ROTATION_NEEDED', { 
          service, 
          age: Math.floor(age / (60 * 60 * 1000)) + ' hours' 
        });
        
        // In production, this would trigger automatic key rotation
        // For demo, we just log the need for rotation
        console.warn(`API key for ${service} needs rotation`);
      }
    }
  }

  // Generate request signature
  generateRequestSignature(method, url, body, timestamp, apiKey) {
    try {
      const payload = `${method}|${url}|${body || ''}|${timestamp}`;
      
      // Simple HMAC-like signature for demo
      let signature = 0;
      const key = apiKey + this.encryptionKey;
      
      for (let i = 0; i < payload.length; i++) {
        const char = payload.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        signature = ((signature << 5) - signature) + (char ^ keyChar);
        signature = signature & signature;
      }
      
      return signature.toString(16);
    } catch (error) {
      console.error('Failed to generate request signature:', error);
      return null;
    }
  }

  // Validate request signature
  validateRequestSignature(method, url, body, timestamp, signature, apiKey) {
    const expectedSignature = this.generateRequestSignature(method, url, body, timestamp, apiKey);
    return expectedSignature === signature;
  }

  // Setup request interceptors for security
  setupRequestInterceptors() {
    // Override fetch for API requests
    const originalFetch = window.fetch;
    
    window.fetch = async (url, options = {}) => {
      // Only intercept API requests
      if (this.isAPIRequest(url)) {
        return this.secureAPIRequest(url, options, originalFetch);
      }
      
      return originalFetch(url, options);
    };
  }

  // Check if request is an API request
  isAPIRequest(url) {
    const apiDomains = [
      'generativelanguage.googleapis.com',
      'api.openai.com',
      'api.anthropic.com'
    ];
    
    return apiDomains.some(domain => url.includes(domain));
  }

  // Secure API request wrapper
  async secureAPIRequest(url, options, originalFetch) {
    try {
      const startTime = Date.now();
      
      // Add security headers and validation
      const secureOptions = await this.addSecurityHeaders(url, options);
      
      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.securityConfig.requestTimeout);
      
      secureOptions.signal = controller.signal;
      
      // Make request with retry logic
      let lastError;
      for (let attempt = 1; attempt <= this.securityConfig.maxRetries; attempt++) {
        try {
          const response = await originalFetch(url, secureOptions);
          clearTimeout(timeoutId);
          
          // Log successful request
          this.auditLog('API_REQUEST_SUCCESS', {
            url: this.sanitizeURL(url),
            method: options.method || 'GET',
            status: response.status,
            duration: Date.now() - startTime,
            attempt
          });
          
          return response;
        } catch (error) {
          lastError = error;
          
          if (attempt < this.securityConfig.maxRetries) {
            // Wait before retry (exponential backoff)
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
      }
      
      clearTimeout(timeoutId);
      
      // Log failed request
      this.auditLog('API_REQUEST_FAILED', {
        url: this.sanitizeURL(url),
        method: options.method || 'GET',
        error: lastError.message,
        duration: Date.now() - startTime,
        attempts: this.securityConfig.maxRetries
      });
      
      throw lastError;
      
    } catch (error) {
      console.error('Secure API request failed:', error);
      throw error;
    }
  }

  // Add security headers to request
  async addSecurityHeaders(url, options) {
    const secureOptions = { ...options };
    
    // Initialize headers
    secureOptions.headers = { ...options.headers };
    
    // Add timestamp
    const timestamp = Date.now().toString();
    secureOptions.headers['X-Timestamp'] = timestamp;
    
    // Add request ID for tracking
    const requestId = this.generateRequestId();
    secureOptions.headers['X-Request-ID'] = requestId;
    
    // Add signature if enabled
    if (this.securityConfig.enableRequestSigning) {
      const service = this.getServiceFromURL(url);
      const apiKey = this.getAPIKey(service);
      
      if (apiKey) {
        const signature = this.generateRequestSignature(
          options.method || 'GET',
          url,
          options.body,
          timestamp,
          apiKey
        );
        
        if (signature) {
          secureOptions.headers['X-Signature'] = signature;
        }
      }
    }
    
    // Add security headers
    secureOptions.headers['X-Content-Type-Options'] = 'nosniff';
    secureOptions.headers['X-Frame-Options'] = 'DENY';
    secureOptions.headers['X-XSS-Protection'] = '1; mode=block';
    
    return secureOptions;
  }

  // Generate unique request ID
  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get service name from URL
  getServiceFromURL(url) {
    if (url.includes('generativelanguage.googleapis.com')) return 'gemini';
    if (url.includes('api.openai.com')) return 'openai';
    if (url.includes('api.anthropic.com')) return 'anthropic';
    return 'unknown';
  }

  // Sanitize URL for logging (remove sensitive parameters)
  sanitizeURL(url) {
    try {
      const urlObj = new URL(url);
      
      // Remove API key from query parameters
      urlObj.searchParams.delete('key');
      urlObj.searchParams.delete('apikey');
      urlObj.searchParams.delete('api_key');
      urlObj.searchParams.delete('token');
      urlObj.searchParams.delete('access_token');
      
      return urlObj.toString();
    } catch (error) {
      return '[invalid-url]';
    }
  }

  // Audit logging
  auditLog(action, details = {}) {
    if (!this.securityConfig.enableAuditLogging) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };
    
    this.auditLogs.push(logEntry);
    
    // Limit log size
    if (this.auditLogs.length > this.securityConfig.maxAuditLogSize) {
      this.auditLogs.splice(0, this.auditLogs.length - this.securityConfig.maxAuditLogSize);
    }
    
    // Store in localStorage for persistence
    try {
      const encryptedLogs = this.encrypt(JSON.stringify(this.auditLogs));
      localStorage.setItem('security_audit_logs', encryptedLogs);
    } catch (error) {
      console.error('Failed to store audit logs:', error);
    }
  }

  // Get or create session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('security_session_id');
    
    if (!sessionId) {
      sessionId = this.generateRequestId();
      sessionStorage.setItem('security_session_id', sessionId);
    }
    
    return sessionId;
  }

  // Load audit logs from storage
  loadAuditLogs() {
    try {
      const encryptedLogs = localStorage.getItem('security_audit_logs');
      if (!encryptedLogs) return [];
      
      const decryptedLogs = this.decrypt(encryptedLogs);
      return decryptedLogs ? JSON.parse(decryptedLogs) : [];
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      return [];
    }
  }

  // Get security statistics
  getSecurityStats() {
    const logs = this.auditLogs.length > 0 ? this.auditLogs : this.loadAuditLogs();
    
    const stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      keyRotations: 0,
      securityEvents: 0,
      averageResponseTime: 0,
      actionCounts: {}
    };
    
    let totalDuration = 0;
    let requestCount = 0;
    
    logs.forEach(log => {
      const action = log.action;
      stats.actionCounts[action] = (stats.actionCounts[action] || 0) + 1;
      
      switch (action) {
        case 'API_REQUEST_SUCCESS':
          stats.successfulRequests++;
          stats.totalRequests++;
          if (log.details.duration) {
            totalDuration += log.details.duration;
            requestCount++;
          }
          break;
        case 'API_REQUEST_FAILED':
          stats.failedRequests++;
          stats.totalRequests++;
          break;
        case 'API_KEY_ROTATED':
          stats.keyRotations++;
          break;
        case 'API_KEY_DECRYPT_FAILED':
        case 'API_KEY_STORE_FAILED':
          stats.securityEvents++;
          break;
      }
    });
    
    if (requestCount > 0) {
      stats.averageResponseTime = Math.round(totalDuration / requestCount);
    }
    
    return stats;
  }

  // Export audit logs (for compliance/debugging)
  exportAuditLogs(format = 'json') {
    const logs = this.auditLogs.length > 0 ? this.auditLogs : this.loadAuditLogs();
    
    if (format === 'csv') {
      const headers = ['timestamp', 'action', 'details', 'userAgent', 'sessionId'];
      const csvContent = [
        headers.join(','),
        ...logs.map(log => [
          log.timestamp,
          log.action,
          JSON.stringify(log.details).replace(/"/g, '""'),
          log.userAgent.replace(/"/g, '""'),
          log.sessionId
        ].map(field => `"${field}"`).join(','))
      ].join('\n');
      
      return csvContent;
    }
    
    return JSON.stringify(logs, null, 2);
  }

  // Clear audit logs
  clearAuditLogs() {
    this.auditLogs = [];
    localStorage.removeItem('security_audit_logs');
    this.auditLog('AUDIT_LOGS_CLEARED');
  }

  // Remove API key
  removeAPIKey(service) {
    try {
      this.apiKeys.delete(service);
      
      const storedKeys = this.loadStoredKeys();
      delete storedKeys[service];
      localStorage.setItem(this.storageKey, this.encrypt(JSON.stringify(storedKeys)));
      
      this.auditLog('API_KEY_REMOVED', { service });
      return true;
    } catch (error) {
      console.error('Failed to remove API key:', error);
      this.auditLog('API_KEY_REMOVAL_FAILED', { service, error: error.message });
      return false;
    }
  }

  // Utility method for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Update security configuration
  updateSecurityConfig(newConfig) {
    this.securityConfig = { ...this.securityConfig, ...newConfig };
    this.auditLog('SECURITY_CONFIG_UPDATED', { config: Object.keys(newConfig) });
  }

  // Get current configuration
  getSecurityConfig() {
    return { ...this.securityConfig };
  }

  // Validate API key format
  validateAPIKeyFormat(service, apiKey) {
    const patterns = {
      gemini: /^[A-Za-z0-9_-]{39}$/, // Google API key format
      openai: /^sk-[A-Za-z0-9]{48}$/, // OpenAI API key format
      anthropic: /^sk-ant-[A-Za-z0-9_-]{95}$/ // Anthropic API key format
    };
    
    const pattern = patterns[service];
    if (!pattern) return true; // Unknown service, assume valid
    
    return pattern.test(apiKey);
  }
}

// Initialize global secure API manager
const secureAPIManager = new SecureAPIManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecureAPIManager;
}