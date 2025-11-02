// ValidationSystem - Comprehensive input validation and security
class ValidationSystem {
  constructor() {
    this.validators = new Map();
    this.sanitizers = new Map();
    this.validationRules = new Map();
    this.errorMessages = new Map();
    this.validationCache = new Map();
    
    this.initializeDefaultValidators();
    this.initializeDefaultSanitizers();
    this.initializeDefaultMessages();
    this.setupFormValidation();
    this.setupRealTimeValidation();
  }

  // Initialize default validators
  initializeDefaultValidators() {
    // Basic validators
    this.validators.set('required', (value) => {
      return value !== null && value !== undefined && String(value).trim() !== '';
    });

    this.validators.set('email', (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !value || emailRegex.test(value);
    });

    this.validators.set('url', (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return !value || false;
      }
    });

    this.validators.set('minLength', (value, min) => {
      return !value || String(value).length >= min;
    });

    this.validators.set('maxLength', (value, max) => {
      return !value || String(value).length <= max;
    });

    this.validators.set('numeric', (value) => {
      return !value || !isNaN(Number(value));
    });

    this.validators.set('integer', (value) => {
      return !value || (Number.isInteger(Number(value)) && Number(value) >= 0);
    });

    this.validators.set('range', (value, min, max) => {
      const num = Number(value);
      return !value || (!isNaN(num) && num >= min && num <= max);
    });

    this.validators.set('pattern', (value, regex) => {
      const regexObj = typeof regex === 'string' ? new RegExp(regex) : regex;
      return !value || regexObj.test(value);
    });

    this.validators.set('alphanumeric', (value) => {
      const alphanumericRegex = /^[a-zA-Z0-9\s]*$/;
      return !value || alphanumericRegex.test(value);
    });

    this.validators.set('noScript', (value) => {
      const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
      return !value || !scriptRegex.test(value);
    });

    this.validators.set('safeHtml', (value) => {
      const dangerousRegex = /<(script|iframe|object|embed|form|input|meta|link)[^>]*>/gi;
      return !value || !dangerousRegex.test(value);
    });

    this.validators.set('filename', (value) => {
      const filenameRegex = /^[a-zA-Z0-9._-]+$/;
      return !value || filenameRegex.test(value);
    });

    this.validators.set('json', (value) => {
      if (!value) return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    });

    // AI-specific validators
    this.validators.set('aiPrompt', (value) => {
      if (!value) return true;
      
      // Check for prompt injection patterns
      const injectionPatterns = [
        /ignore\s+(previous|all)\s+(instructions?|prompts?)/gi,
        /forget\s+(everything|all|previous)/gi,
        /system\s*:\s*you\s+are\s+now/gi,
        /\[system\]/gi,
        /\<\|system\|\>/gi,
        /act\s+as\s+(if\s+you\s+are\s+)?a\s+different/gi,
        /pretend\s+(to\s+be|you\s+are)/gi,
        /roleplay\s+as/gi,
        /simulate\s+(being|a)/gi,
        /override\s+(your\s+)?(instructions?|guidelines?|rules?)/gi,
        /jailbreak/gi,
        /\bDAN\b/gi, // "Do Anything Now" jailbreak
        /developer\s+mode/gi,
        /unrestricted\s+mode/gi
      ];
      
      return !injectionPatterns.some(pattern => pattern.test(value));
    });

    this.validators.set('aiSafeContent', (value) => {
      if (!value) return true;
      
      // Check for potentially harmful content requests
      const harmfulPatterns = [
        /how\s+to\s+(make|create|build)\s+(bomb|explosive|weapon)/gi,
        /illegal\s+(drugs|activities|hacking)/gi,
        /personal\s+(information|data|details)\s+of/gi,
        /private\s+(keys|passwords|credentials)/gi,
        /bypass\s+(security|authentication|firewall)/gi,
        /exploit\s+(vulnerability|weakness)/gi,
        /social\s+engineering\s+(attack|technique)/gi,
        /phishing\s+(email|attack|scam)/gi
      ];
      
      return !harmfulPatterns.some(pattern => pattern.test(value));
    });

    this.validators.set('noExcessiveRepetition', (value) => {
      if (!value) return true;
      
      // Check for excessive character or word repetition (potential spam/DoS)
      const charRepetition = /(.)\1{20,}/g;
      const wordRepetition = /\b(\w+)(\s+\1){10,}/gi;
      
      return !charRepetition.test(value) && !wordRepetition.test(value);
    });

    this.validators.set('reasonableLength', (value, maxLength = 5000) => {
      return !value || value.length <= maxLength;
    });

    this.validators.set('noMaliciousCode', (value) => {
      if (!value) return true;
      
      // Check for various code injection attempts
      const codePatterns = [
        /<script[^>]*>.*?<\/script>/gis,
        /javascript\s*:/gi,
        /vbscript\s*:/gi,
        /data\s*:\s*text\/html/gi,
        /expression\s*\(/gi,
        /eval\s*\(/gi,
        /setTimeout\s*\(/gi,
        /setInterval\s*\(/gi,
        /Function\s*\(/gi,
        /document\s*\.\s*write/gi,
        /innerHTML\s*=/gi,
        /outerHTML\s*=/gi
      ];
      
      return !codePatterns.some(pattern => pattern.test(value));
    });

    this.validators.set('noSensitiveDataRequest', (value) => {
      if (!value) return true;
      
      // Check for requests for sensitive information
      const sensitivePatterns = [
        /api\s+key/gi,
        /access\s+token/gi,
        /password/gi,
        /credit\s+card/gi,
        /social\s+security/gi,
        /bank\s+account/gi,
        /private\s+key/gi,
        /secret\s+key/gi,
        /authentication\s+token/gi,
        /session\s+id/gi
      ];
      
      return !sensitivePatterns.some(pattern => pattern.test(value));
    });
  }

  // Initialize default sanitizers
  initializeDefaultSanitizers() {
    this.sanitizers.set('trim', (value) => {
      return typeof value === 'string' ? value.trim() : value;
    });

    this.sanitizers.set('lowercase', (value) => {
      return typeof value === 'string' ? value.toLowerCase() : value;
    });

    this.sanitizers.set('uppercase', (value) => {
      return typeof value === 'string' ? value.toUpperCase() : value;
    });

    this.sanitizers.set('removeHtml', (value) => {
      if (typeof value !== 'string') return value;
      return value.replace(/<[^>]*>/g, '');
    });

    this.sanitizers.set('escapeHtml', (value) => {
      if (typeof value !== 'string') return value;
      const div = document.createElement('div');
      div.textContent = value;
      return div.innerHTML;
    });

    this.sanitizers.set('removeScript', (value) => {
      if (typeof value !== 'string') return value;
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    });

    this.sanitizers.set('alphanumericOnly', (value) => {
      if (typeof value !== 'string') return value;
      return value.replace(/[^a-zA-Z0-9\s]/g, '');
    });

    this.sanitizers.set('numericOnly', (value) => {
      if (typeof value !== 'string') return value;
      return value.replace(/[^0-9.-]/g, '');
    });

    this.sanitizers.set('maxLength', (value, max) => {
      if (typeof value !== 'string') return value;
      return value.substring(0, max);
    });

    this.sanitizers.set('removeExtraSpaces', (value) => {
      if (typeof value !== 'string') return value;
      return value.replace(/\s+/g, ' ').trim();
    });

    // AI-specific sanitizers
    this.sanitizers.set('aiPromptSanitize', (value) => {
      if (typeof value !== 'string') return value;
      
      let sanitized = value;
      
      // Remove potential prompt injection markers
      sanitized = sanitized.replace(/\[system\]/gi, '[user-input]');
      sanitized = sanitized.replace(/\<\|system\|\>/gi, '<|user-input|>');
      sanitized = sanitized.replace(/\bDAN\b/gi, 'USER');
      
      // Normalize whitespace and remove excessive repetition
      sanitized = sanitized.replace(/\s+/g, ' ');
      sanitized = sanitized.replace(/(.)\1{10,}/g, '$1$1$1'); // Limit character repetition
      
      // Remove potential code injection
      sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '');
      sanitized = sanitized.replace(/javascript\s*:/gi, 'text:');
      
      return sanitized.trim();
    });

    this.sanitizers.set('removePromptInjection', (value) => {
      if (typeof value !== 'string') return value;
      
      let sanitized = value;
      
      // Remove common prompt injection phrases
      const injectionPhrases = [
        /ignore\s+(previous|all)\s+(instructions?|prompts?)/gi,
        /forget\s+(everything|all|previous)/gi,
        /system\s*:\s*you\s+are\s+now/gi,
        /act\s+as\s+(if\s+you\s+are\s+)?a\s+different/gi,
        /pretend\s+(to\s+be|you\s+are)/gi,
        /override\s+(your\s+)?(instructions?|guidelines?|rules?)/gi
      ];
      
      injectionPhrases.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[filtered content]');
      });
      
      return sanitized;
    });

    this.sanitizers.set('limitAIInputLength', (value, maxLength = 5000) => {
      if (typeof value !== 'string') return value;
      
      if (value.length > maxLength) {
        return value.substring(0, maxLength) + '... [truncated]';
      }
      
      return value;
    });

    this.sanitizers.set('normalizeAIInput', (value) => {
      if (typeof value !== 'string') return value;
      
      let normalized = value;
      
      // Normalize unicode characters
      normalized = normalized.normalize('NFKC');
      
      // Remove zero-width characters that might be used for obfuscation
      normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
      
      // Normalize quotes
      normalized = normalized.replace(/[""]/g, '"');
      normalized = normalized.replace(/['']/g, "'");
      
      // Remove excessive punctuation
      normalized = normalized.replace(/[!]{3,}/g, '!!');
      normalized = normalized.replace(/[?]{3,}/g, '??');
      
      return normalized;
    });
  }

  // Initialize default error messages
  initializeDefaultMessages() {
    this.errorMessages.set('required', 'This field is required');
    this.errorMessages.set('email', 'Please enter a valid email address');
    this.errorMessages.set('url', 'Please enter a valid URL');
    this.errorMessages.set('minLength', 'Must be at least {min} characters long');
    this.errorMessages.set('maxLength', 'Must be no more than {max} characters long');
    this.errorMessages.set('numeric', 'Please enter a valid number');
    this.errorMessages.set('integer', 'Please enter a valid whole number');
    this.errorMessages.set('range', 'Value must be between {min} and {max}');
    this.errorMessages.set('pattern', 'Invalid format');
    this.errorMessages.set('alphanumeric', 'Only letters, numbers, and spaces are allowed');
    this.errorMessages.set('noScript', 'Script tags are not allowed');
    this.errorMessages.set('safeHtml', 'Potentially dangerous HTML detected');
    this.errorMessages.set('filename', 'Invalid filename format');
    this.errorMessages.set('json', 'Invalid JSON format');
    
    // AI-specific error messages
    this.errorMessages.set('aiPrompt', 'Input contains potential prompt injection attempts');
    this.errorMessages.set('aiSafeContent', 'Input contains potentially harmful content requests');
    this.errorMessages.set('noExcessiveRepetition', 'Input contains excessive repetition');
    this.errorMessages.set('reasonableLength', 'Input exceeds maximum allowed length');
    this.errorMessages.set('noMaliciousCode', 'Input contains potentially malicious code');
    this.errorMessages.set('noSensitiveDataRequest', 'Input requests sensitive information');
  }

  // Setup automatic form validation
  setupFormValidation() {
    document.addEventListener('DOMContentLoaded', () => {
      this.attachFormValidation();
    });

    // Re-attach validation when new forms are added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'FORM' || node.querySelector('form')) {
              this.attachFormValidation();
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Attach validation to all forms
  attachFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
      if (!form.hasAttribute('data-validation-attached')) {
        this.attachToForm(form);
        form.setAttribute('data-validation-attached', 'true');
      }
    });
  }

  // Attach validation to a specific form
  attachToForm(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // Real-time validation on input
      input.addEventListener('input', (e) => {
        this.validateField(e.target);
      });

      // Validation on blur
      input.addEventListener('blur', (e) => {
        this.validateField(e.target);
      });
    });

    // Form submission validation
    form.addEventListener('submit', (e) => {
      if (!this.validateForm(form)) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  // Setup real-time validation
  setupRealTimeValidation() {
    document.addEventListener('input', (e) => {
      if (e.target.hasAttribute('data-validate-realtime')) {
        this.validateField(e.target);
      }
    });
  }

  // Validate a single field
  validateField(field) {
    const rules = this.getFieldRules(field);
    const value = field.value;
    const sanitizedValue = this.sanitizeValue(value, rules.sanitizers || []);
    
    // Update field value with sanitized version if different
    if (sanitizedValue !== value) {
      field.value = sanitizedValue;
    }

    const errors = [];
    
    // Run validators
    for (const rule of rules.validators || []) {
      const { validator, params, message } = rule;
      const isValid = this.runValidator(validator, sanitizedValue, params);
      
      if (!isValid) {
        errors.push(message || this.getErrorMessage(validator, params));
      }
    }

    this.displayFieldErrors(field, errors);
    return errors.length === 0;
  }

  // Validate entire form
  validateForm(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  // Get validation rules for a field
  getFieldRules(field) {
    const rules = {
      validators: [],
      sanitizers: []
    };

    // Parse data attributes
    const validateAttr = field.getAttribute('data-validate');
    if (validateAttr) {
      const ruleStrings = validateAttr.split('|');
      
      ruleStrings.forEach(ruleString => {
        const [ruleName, ...params] = ruleString.split(':');
        const parsedParams = params.length > 0 ? params[0].split(',') : [];
        
        if (this.validators.has(ruleName)) {
          rules.validators.push({
            validator: ruleName,
            params: parsedParams,
            message: field.getAttribute(`data-${ruleName}-message`)
          });
        }
      });
    }

    // Parse sanitizer attributes
    const sanitizeAttr = field.getAttribute('data-sanitize');
    if (sanitizeAttr) {
      rules.sanitizers = sanitizeAttr.split('|');
    }

    return rules;
  }

  // Run a specific validator
  runValidator(validatorName, value, params = []) {
    const validator = this.validators.get(validatorName);
    if (!validator) return true;
    
    return validator(value, ...params);
  }

  // Sanitize a value
  sanitizeValue(value, sanitizers = []) {
    let sanitized = value;
    
    sanitizers.forEach(sanitizerName => {
      const [name, ...params] = sanitizerName.split(':');
      const sanitizer = this.sanitizers.get(name);
      
      if (sanitizer) {
        sanitized = sanitizer(sanitized, ...params);
      }
    });
    
    return sanitized;
  }

  // Get error message for a validator
  getErrorMessage(validatorName, params = []) {
    let message = this.errorMessages.get(validatorName) || 'Invalid input';
    
    // Replace parameter placeholders
    params.forEach((param, index) => {
      const placeholder = `{${index === 0 ? 'min' : index === 1 ? 'max' : index}}`;
      message = message.replace(placeholder, param);
    });
    
    return message;
  }

  // Display field errors
  displayFieldErrors(field, errors) {
    // Remove existing error displays
    this.clearFieldErrors(field);
    
    if (errors.length === 0) {
      field.classList.remove('validation-error');
      field.classList.add('validation-success');
      return;
    }

    field.classList.add('validation-error');
    field.classList.remove('validation-success');
    
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'validation-errors';
    errorContainer.setAttribute('data-field-errors', field.name || field.id);
    
    errors.forEach(error => {
      const errorElement = document.createElement('div');
      errorElement.className = 'validation-error-message';
      errorElement.textContent = error;
      errorContainer.appendChild(errorElement);
    });
    
    // Insert error container after the field
    field.parentNode.insertBefore(errorContainer, field.nextSibling);
  }

  // Clear field errors
  clearFieldErrors(field) {
    const fieldName = field.name || field.id;
    const existingErrors = document.querySelectorAll(`[data-field-errors="${fieldName}"]`);
    existingErrors.forEach(error => error.remove());
  }

  // Validate data object
  validateData(data, rules) {
    const errors = {};
    const sanitized = {};
    
    Object.keys(rules).forEach(fieldName => {
      const fieldRules = rules[fieldName];
      const value = data[fieldName];
      
      // Sanitize value
      const sanitizedValue = this.sanitizeValue(value, fieldRules.sanitizers || []);
      sanitized[fieldName] = sanitizedValue;
      
      // Validate value
      const fieldErrors = [];
      
      for (const rule of fieldRules.validators || []) {
        const { validator, params, message } = rule;
        const isValid = this.runValidator(validator, sanitizedValue, params);
        
        if (!isValid) {
          fieldErrors.push(message || this.getErrorMessage(validator, params));
        }
      }
      
      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized
    };
  }

  // Security-focused validation methods
  validateAndSanitizeUserInput(input, type = 'general') {
    const securityRules = {
      general: ['trim', 'removeScript', 'escapeHtml'],
      filename: ['trim', 'alphanumericOnly'],
      numeric: ['trim', 'numericOnly'],
      text: ['trim', 'removeScript', 'maxLength:1000'],
      aiPrompt: ['normalizeAIInput', 'aiPromptSanitize', 'removePromptInjection', 'limitAIInputLength:5000'],
      aiResponse: ['normalizeAIInput', 'removeScript', 'escapeHtml', 'limitAIInputLength:10000']
    };
    
    const sanitizers = securityRules[type] || securityRules.general;
    return this.sanitizeValue(input, sanitizers);
  }

  // AI-specific validation methods
  validateAIPrompt(prompt) {
    const rules = {
      validators: [
        { validator: 'required', params: [], message: 'Prompt is required' },
        { validator: 'reasonableLength', params: [5000], message: 'Prompt is too long' },
        { validator: 'aiPrompt', params: [], message: 'Prompt contains injection attempts' },
        { validator: 'aiSafeContent', params: [], message: 'Prompt contains harmful content' },
        { validator: 'noExcessiveRepetition', params: [], message: 'Prompt contains excessive repetition' },
        { validator: 'noMaliciousCode', params: [], message: 'Prompt contains malicious code' },
        { validator: 'noSensitiveDataRequest', params: [], message: 'Prompt requests sensitive data' }
      ],
      sanitizers: ['normalizeAIInput', 'aiPromptSanitize', 'removePromptInjection', 'limitAIInputLength:5000']
    };

    return this.validateData({ prompt }, { prompt: rules });
  }

  validateAIResponse(response) {
    const rules = {
      validators: [
        { validator: 'reasonableLength', params: [10000], message: 'Response is too long' },
        { validator: 'noMaliciousCode', params: [], message: 'Response contains malicious code' },
        { validator: 'safeHtml', params: [], message: 'Response contains unsafe HTML' }
      ],
      sanitizers: ['normalizeAIInput', 'removeScript', 'escapeHtml', 'limitAIInputLength:10000']
    };

    return this.validateData({ response }, { response: rules });
  }

  // Enhanced XSS prevention for AI content
  preventAIXSS(input) {
    if (typeof input !== 'string') return input;
    
    let cleaned = input;
    
    // Remove script tags and event handlers
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: and data: URLs
    cleaned = cleaned.replace(/javascript:/gi, 'blocked:');
    cleaned = cleaned.replace(/data:\s*text\/html/gi, 'blocked:text/html');
    
    // Remove potentially dangerous HTML elements
    const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'meta', 'link', 'style'];
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
      cleaned = cleaned.replace(regex, '');
      const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
      cleaned = cleaned.replace(selfClosing, '');
    });
    
    // Escape remaining HTML
    return this.sanitizers.get('escapeHtml')(cleaned);
  }

  // Detect potential prompt injection attempts
  detectPromptInjection(input) {
    if (typeof input !== 'string') return false;
    
    const injectionIndicators = [
      // Direct instruction overrides
      /ignore\s+(previous|all)\s+(instructions?|prompts?|rules?)/gi,
      /forget\s+(everything|all|previous|instructions?)/gi,
      /disregard\s+(previous|all)\s+(instructions?|prompts?)/gi,
      
      // Role manipulation
      /you\s+are\s+now\s+(a|an)/gi,
      /act\s+as\s+(if\s+you\s+are\s+)?(a|an)\s+different/gi,
      /pretend\s+(to\s+be|you\s+are)\s+(a|an)/gi,
      /roleplay\s+as\s+(a|an)/gi,
      /simulate\s+(being|a)/gi,
      
      // System manipulation
      /system\s*:\s*you\s+are/gi,
      /\[system\]/gi,
      /\<\|system\|\>/gi,
      /override\s+(your\s+)?(instructions?|guidelines?|rules?|programming)/gi,
      
      // Jailbreak attempts
      /jailbreak/gi,
      /\bDAN\b/gi,
      /developer\s+mode/gi,
      /unrestricted\s+mode/gi,
      /god\s+mode/gi,
      
      // Prompt leaking
      /what\s+(are\s+)?your\s+(instructions?|prompts?|rules?)/gi,
      /show\s+me\s+your\s+(instructions?|prompts?|system\s+message)/gi,
      /repeat\s+your\s+(instructions?|prompts?)/gi
    ];
    
    return injectionIndicators.some(pattern => pattern.test(input));
  }

  // Rate limiting for AI requests
  checkAIRateLimit(userId, requestType = 'general') {
    const rateLimits = {
      general: { requests: 60, window: 60000 }, // 60 requests per minute
      conversation: { requests: 30, window: 60000 }, // 30 per minute
      analysis: { requests: 20, window: 60000 } // 20 per minute
    };
    
    const limit = rateLimits[requestType] || rateLimits.general;
    const key = `ai_rate_${userId}_${requestType}`;
    const now = Date.now();
    
    // Get or create rate limit data
    let rateLimitData = this.validationCache.get(key) || { requests: [], window: limit.window };
    
    // Remove old requests outside the window
    rateLimitData.requests = rateLimitData.requests.filter(timestamp => 
      now - timestamp < limit.window
    );
    
    // Check if limit exceeded
    if (rateLimitData.requests.length >= limit.requests) {
      return {
        allowed: false,
        resetTime: rateLimitData.requests[0] + limit.window,
        remaining: 0
      };
    }
    
    // Add current request
    rateLimitData.requests.push(now);
    this.validationCache.set(key, rateLimitData);
    
    return {
      allowed: true,
      remaining: limit.requests - rateLimitData.requests.length,
      resetTime: now + limit.window
    };
  }

  // XSS Prevention
  preventXSS(input) {
    if (typeof input !== 'string') return input;
    
    // Remove script tags
    let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove javascript: URLs
    cleaned = cleaned.replace(/javascript:/gi, '');
    
    // Remove on* event handlers
    cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Escape remaining HTML
    return this.sanitizers.get('escapeHtml')(cleaned);
  }

  // SQL Injection Prevention (for client-side validation)
  preventSQLInjection(input) {
    if (typeof input !== 'string') return input;
    
    const sqlKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
      'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', '--', ';', '/*', '*/'
    ];
    
    let cleaned = input;
    sqlKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    return cleaned;
  }

  // Add custom validator
  addValidator(name, validatorFn, errorMessage) {
    this.validators.set(name, validatorFn);
    if (errorMessage) {
      this.errorMessages.set(name, errorMessage);
    }
  }

  // Add custom sanitizer
  addSanitizer(name, sanitizerFn) {
    this.sanitizers.set(name, sanitizerFn);
  }

  // Bulk validation for forms
  validateFormData(formData, validationRules) {
    const result = {
      isValid: true,
      errors: {},
      sanitized: {}
    };
    
    Object.keys(validationRules).forEach(fieldName => {
      const value = formData.get ? formData.get(fieldName) : formData[fieldName];
      const rules = validationRules[fieldName];
      
      const fieldResult = this.validateData({ [fieldName]: value }, { [fieldName]: rules });
      
      if (!fieldResult.isValid) {
        result.isValid = false;
        result.errors[fieldName] = fieldResult.errors[fieldName];
      }
      
      result.sanitized[fieldName] = fieldResult.sanitized[fieldName];
    });
    
    return result;
  }

  // Performance optimization - cached validation
  validateWithCache(value, rules, cacheKey) {
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      if (cached.value === value) {
        return cached.result;
      }
    }
    
    const result = this.validateData({ field: value }, { field: rules });
    
    this.validationCache.set(cacheKey, {
      value,
      result: result.isValid
    });
    
    // Limit cache size
    if (this.validationCache.size > 100) {
      const firstKey = this.validationCache.keys().next().value;
      this.validationCache.delete(firstKey);
    }
    
    return result.isValid;
  }

  // Clear validation cache
  clearCache() {
    this.validationCache.clear();
  }

  // Get validation summary for debugging
  getValidationSummary() {
    return {
      validators: Array.from(this.validators.keys()),
      sanitizers: Array.from(this.sanitizers.keys()),
      cacheSize: this.validationCache.size,
      attachedForms: document.querySelectorAll('form[data-validation-attached]').length
    };
  }
}

// Initialize ValidationSystem globally
const validationSystem = new ValidationSystem();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationSystem;
}

// Add validation styles to document
function addValidationStyles() {
  if (document.getElementById('validation-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'validation-styles';
  style.textContent = `
    /* Validation field states */
    .validation-error {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 1px #ef4444 !important;
    }
    
    .validation-success {
      border-color: #10b981 !important;
      box-shadow: 0 0 0 1px #10b981 !important;
    }
    
    /* Error messages */
    .validation-errors {
      margin-top: 0.25rem;
      font-size: 0.875rem;
    }
    
    .validation-error-message {
      color: #ef4444;
      display: flex;
      align-items: center;
      margin-bottom: 0.125rem;
    }
    
    .validation-error-message:before {
      content: "⚠";
      margin-right: 0.25rem;
      font-size: 0.75rem;
    }
    
    /* Form validation states */
    form.validation-pending {
      opacity: 0.8;
      pointer-events: none;
    }
    
    /* Glassmorphism integration */
    .glass-card .validation-error {
      background: rgba(239, 68, 68, 0.1);
      backdrop-filter: blur(10px);
    }
    
    .glass-card .validation-success {
      background: rgba(16, 185, 129, 0.1);
      backdrop-filter: blur(10px);
    }
    
    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .validation-error-message {
        color: #fca5a5;
      }
    }
    
    /* Animation for error appearance */
    .validation-errors {
      animation: slideIn 0.2s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Responsive design */
    @media (max-width: 640px) {
      .validation-error-message {
        font-size: 0.8rem;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize styles when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addValidationStyles);
} else {
  addValidationStyles();
}