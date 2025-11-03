/**
 * Gemini API Client
 * Handles authentication, request formatting, response parsing, and error handling for Google's Gemini API
 */
class GeminiAPIClient {
    constructor(apiKey, config = {}) {
        this.apiKey = apiKey;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = config.model || 'gemini-1.5-flash';
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 1000;
        this.timeout = config.timeout || 30000;
        
        // Rate limiting configuration
        this.rateLimiting = {
            requestsPerMinute: config.requestsPerMinute || 60,
            requestsPerHour: config.requestsPerHour || 1000,
            ...config.rateLimiting
        };
        
        // Request tracking for rate limiting
        this.requestHistory = [];
        
        if (!this.apiKey) {
            throw new Error('Gemini API key is required');
        }
    }

    /**
     * Generate content using Gemini API
     * @param {string} prompt - The input prompt
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} API response
     */
    async generateContent(prompt, options = {}) {
        const requestPayload = this.formatRequest(prompt, options);
        return await this.makeRequest(requestPayload);
    }

    /**
     * Generate streaming content (for future implementation)
     * @param {string} prompt - The input prompt
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} API response
     */
    async generateStreamContent(prompt, options = {}) {
        // For now, use regular generation - streaming can be added later
        return await this.generateContent(prompt, options);
    }

    /**
     * Format request payload for Gemini API
     * @param {string} prompt - The input prompt
     * @param {Object} options - Generation options
     * @returns {Object} Formatted request payload
     */
    formatRequest(prompt, options = {}) {
        const parts = [{
            text: prompt
        }];

        // Add image if provided
        if (options.image) {
            try {
                // Convert base64 image to the format Gemini expects
                const imageData = options.image.split(',')[1]; // Remove data:image/jpeg;base64, prefix
                const mimeType = options.image.split(';')[0].split(':')[1]; // Extract mime type
                
                console.log('📸 Adding image to request:', { mimeType, dataLength: imageData.length });
                
                parts.push({
                    inline_data: {
                        mime_type: mimeType,
                        data: imageData
                    }
                });
            } catch (error) {
                console.error('❌ Error processing image for API:', error);
                // Continue without image if there's an error
            }
        }

        return {
            contents: [{
                parts: parts
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                topK: options.topK || 40,
                topP: options.topP || 0.95,
                maxOutputTokens: options.maxOutputTokens || 4096,
                ...options.generationConfig
            },
            safetySettings: options.safetySettings || [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };
    }

    /**
     * Make HTTP request to Gemini API with retry logic
     * @param {Object} payload - Request payload
     * @returns {Promise<Object>} API response
     */
    async makeRequest(payload) {
        // Check rate limits before making request
        await this.checkRateLimit();
        
        const url = `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`;
        
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await this.executeRequest(url, payload);
                
                // Track successful request
                this.trackRequest();
                
                return this.parseResponse(response);
            } catch (error) {
                if (attempt === this.maxRetries) {
                    throw this.handleAPIError(error);
                }
                
                // Check if error is retryable
                if (this.isRetryableError(error)) {
                    const delay = this.calculateBackoffDelay(attempt);
                    await this.delay(delay);
                    continue;
                }
                
                throw this.handleAPIError(error);
            }
        }
    }

    /**
     * Execute HTTP request
     * @param {string} url - Request URL
     * @param {Object} payload - Request payload
     * @returns {Promise<Response>} Fetch response
     */
    async executeRequest(url, payload) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Parse and validate API response
     * @param {Response} response - Fetch response
     * @returns {Promise<Object>} Parsed response data
     */
    async parseResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                errorData: errorData
            });
            throw new Error(`API request failed: ${response.status} ${response.statusText}`, {
                cause: { status: response.status, data: errorData }
            });
        }
        
        const data = await response.json();
        
        // Log the response for debugging
        console.log('API Response received:', data);
        
        if (!this.validateResponse(data)) {
            console.error('Response validation failed. Response structure:', JSON.stringify(data, null, 2));
            throw new Error('Invalid API response format', { cause: { data } });
        }
        
        return data;
    }

    /**
     * Validate API response structure
     * @param {Object} response - API response data
     * @returns {boolean} Whether response is valid
     */
    validateResponse(response) {
        // Check basic response structure
        if (!response || typeof response !== 'object') {
            console.error('Invalid response: not an object');
            return false;
        }
        
        // Check for error in response
        if (response.error) {
            console.error('API returned error:', response.error);
            return false;
        }
        
        // Check for candidates array
        if (!response.candidates || !Array.isArray(response.candidates)) {
            console.error('Invalid response: no candidates array');
            return false;
        }
        
        if (response.candidates.length === 0) {
            console.error('Invalid response: empty candidates array');
            return false;
        }
        
        // Check first candidate structure
        const candidate = response.candidates[0];
        if (!candidate || typeof candidate !== 'object') {
            console.error('Invalid response: invalid first candidate');
            return false;
        }
        
        // Check for content
        if (!candidate.content || typeof candidate.content !== 'object') {
            console.error('Invalid response: no content in candidate');
            return false;
        }
        
        // Check for parts array (new API format may not have parts)
        if (candidate.content.parts && Array.isArray(candidate.content.parts)) {
            // Old format with parts array
            if (candidate.content.parts.length === 0) {
                console.error('Invalid response: empty parts array');
                return false;
            }

            // Check if first part has text
            const firstPart = candidate.content.parts[0];
            if (!firstPart || typeof firstPart !== 'object' || !firstPart.text) {
                console.error('Invalid response: no text in first part');
                return false;
            }
        } else if (candidate.content.text) {
            // New format with direct text property
            if (!candidate.content.text || typeof candidate.content.text !== 'string') {
                console.error('Invalid response: no valid text in content');
                return false;
            }
        } else {
            console.error('Invalid response: no parts array or text in content');
            return false;
        }
        
        return true;
    }

    /**
     * Check rate limiting before making request
     * @returns {Promise<void>}
     */
    async checkRateLimit() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const oneHourAgo = now - 3600000;
        
        // Clean old requests
        this.requestHistory = this.requestHistory.filter(time => time > oneHourAgo);
        
        const recentRequests = this.requestHistory.filter(time => time > oneMinuteAgo);
        
        // Check minute limit
        if (recentRequests.length >= this.rateLimiting.requestsPerMinute) {
            const oldestRecent = Math.min(...recentRequests);
            const waitTime = 60000 - (now - oldestRecent);
            await this.delay(waitTime);
        }
        
        // Check hour limit
        if (this.requestHistory.length >= this.rateLimiting.requestsPerHour) {
            const oldestInHour = Math.min(...this.requestHistory);
            const waitTime = 3600000 - (now - oldestInHour);
            await this.delay(waitTime);
        }
    }

    /**
     * Track request for rate limiting
     */
    trackRequest() {
        this.requestHistory.push(Date.now());
    }

    /**
     * Handle API errors with appropriate error types
     * @param {Error} error - Original error
     * @returns {Error} Processed error
     */
    handleAPIError(error) {
        if (error.name === 'AbortError') {
            return new Error('Request timeout', { cause: error });
        }
        
        if (error.cause && error.cause.status) {
            const status = error.cause.status;
            
            switch (status) {
                case 401:
                    return new Error('Invalid API key', { cause: error });
                case 403:
                    return new Error('API access forbidden', { cause: error });
                case 429:
                    return new Error('Rate limit exceeded', { cause: error });
                case 500:
                case 502:
                case 503:
                case 504:
                    return new Error('API server error', { cause: error });
                default:
                    return new Error(`API error: ${status}`, { cause: error });
            }
        }
        
        if (error.message.includes('fetch')) {
            return new Error('Network error', { cause: error });
        }
        
        return error;
    }

    /**
     * Check if error is retryable
     * @param {Error} error - Error to check
     * @returns {boolean} Whether error is retryable
     */
    isRetryableError(error) {
        if (error.cause && error.cause.status) {
            const status = error.cause.status;
            // Retry on server errors and rate limits
            return status >= 500 || status === 429;
        }
        
        // Retry on network errors
        return error.message.includes('fetch') || error.name === 'AbortError';
    }

    /**
     * Calculate exponential backoff delay
     * @param {number} attempt - Current attempt number
     * @returns {number} Delay in milliseconds
     */
    calculateBackoffDelay(attempt) {
        const baseDelay = this.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
        return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
    }

    /**
     * Delay execution for specified time
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Extract text content from API response
     * @param {Object} response - API response
     * @returns {string} Extracted text content
     */
    extractTextContent(response) {
        if (!this.validateResponse(response)) {
            throw new Error('Invalid response format');
        }
        
        const candidate = response.candidates[0];
        
        // Handle new API format with direct text property
        if (candidate.content.text) {
            return candidate.content.text;
        }
        
        // Handle old API format with parts array
        if (candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
            return candidate.content.parts[0].text;
        }
        
        throw new Error('No text content found in response');
    }

    /**
     * Get usage metadata from response
     * @param {Object} response - API response
     * @returns {Object} Usage metadata
     */
    getUsageMetadata(response) {
        return {
            promptTokenCount: response.usageMetadata?.promptTokenCount || 0,
            candidatesTokenCount: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokenCount: response.usageMetadata?.totalTokenCount || 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiAPIClient;
}