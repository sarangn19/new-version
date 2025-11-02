/**
 * AI Response Cache System
 * Implements intelligent caching for common queries and responses with TTL management,
 * cache invalidation, and conversation context optimization
 */
class AIResponseCache {
    constructor(config = {}) {
        this.storagePrefix = config.storagePrefix || 'upsc_ai_cache_';
        this.defaultTTL = config.defaultTTL || 3600000; // 1 hour in milliseconds
        this.maxCacheSize = config.maxCacheSize || 1000; // Maximum number of cached responses
        this.compressionEnabled = config.compressionEnabled || true;
        this.contextCacheSize = config.contextCacheSize || 100; // Max conversation contexts to cache
        
        // Cache categories with different TTL settings
        this.cacheCategories = {
            common_queries: { ttl: 86400000, priority: 1 }, // 24 hours - high priority
            mcq_explanations: { ttl: 604800000, priority: 2 }, // 7 days - medium priority
            news_summaries: { ttl: 3600000, priority: 3 }, // 1 hour - low priority (news changes)
            essay_feedback: { ttl: 43200000, priority: 2 }, // 12 hours - medium priority
            conversation_context: { ttl: 1800000, priority: 1 } // 30 minutes - high priority
        };
        
        // Storage keys
        this.keys = {
            responses: `${this.storagePrefix}responses`,
            contexts: `${this.storagePrefix}contexts`,
            index: `${this.storagePrefix}index`,
            metadata: `${this.storagePrefix}metadata`,
            stats: `${this.storagePrefix}stats`
        };
        
        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalRequests: 0
        };
        
        this.initialize();
    }

    /**
     * Initialize cache system and load existing statistics
     */
    initialize() {
        try {
            // Load existing statistics
            const savedStats = localStorage.getItem(this.keys.stats);
            if (savedStats) {
                this.stats = { ...this.stats, ...JSON.parse(savedStats) };
            }
            
            // Initialize metadata if not exists
            if (!localStorage.getItem(this.keys.metadata)) {
                const metadata = {
                    version: '1.0.0',
                    createdAt: new Date().toISOString(),
                    lastCleanup: new Date().toISOString()
                };
                localStorage.setItem(this.keys.metadata, JSON.stringify(metadata));
            }
            
            // Perform initial cleanup
            this.performCleanup();
            
            console.log('AI Response Cache initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AI Response Cache:', error);
        }
    }

    /**
     * Generate cache key from prompt and options
     * @param {string} prompt - The input prompt
     * @param {Object} options - Generation options
     * @param {string} mode - AI assistant mode
     * @returns {string} Cache key
     */
    generateCacheKey(prompt, options = {}, mode = 'general') {
        // Normalize prompt (remove extra whitespace, convert to lowercase)
        const normalizedPrompt = prompt.trim().toLowerCase().replace(/\s+/g, ' ');
        
        // Create key components
        const keyComponents = [
            mode,
            normalizedPrompt,
            options.temperature || 0.7,
            options.maxOutputTokens || 2048
        ];
        
        // Generate hash-like key
        const keyString = keyComponents.join('|');
        return this.hashString(keyString);
    }

    /**
     * Check if response is cached and valid
     * @param {string} prompt - The input prompt
     * @param {Object} options - Generation options
     * @param {string} mode - AI assistant mode
     * @returns {Object|null} Cached response or null
     */
    getCachedResponse(prompt, options = {}, mode = 'general') {
        try {
            this.stats.totalRequests++;
            
            const cacheKey = this.generateCacheKey(prompt, options, mode);
            const cachedData = localStorage.getItem(`${this.keys.responses}_${cacheKey}`);
            
            if (!cachedData) {
                this.stats.misses++;
                this.saveStats();
                return null;
            }
            
            const cached = JSON.parse(cachedData);
            
            // Check if cache entry is still valid
            if (this.isCacheEntryValid(cached)) {
                this.stats.hits++;
                this.saveStats();
                
                // Update access time for LRU
                cached.lastAccessed = Date.now();
                localStorage.setItem(`${this.keys.responses}_${cacheKey}`, JSON.stringify(cached));
                
                return {
                    ...cached.response,
                    fromCache: true,
                    cacheHit: true
                };
            } else {
                // Remove expired entry
                this.removeCacheEntry(cacheKey);
                this.stats.misses++;
                this.saveStats();
                return null;
            }
        } catch (error) {
            console.error('Error retrieving cached response:', error);
            this.stats.misses++;
            this.saveStats();
            return null;
        }
    }

    /**
     * Cache AI response with metadata
     * @param {string} prompt - The input prompt
     * @param {Object} options - Generation options
     * @param {string} mode - AI assistant mode
     * @param {Object} response - AI response to cache
     * @param {string} category - Cache category
     */
    cacheResponse(prompt, options = {}, mode = 'general', response, category = 'common_queries') {
        try {
            const cacheKey = this.generateCacheKey(prompt, options, mode);
            const categoryConfig = this.cacheCategories[category] || this.cacheCategories.common_queries;
            
            const cacheEntry = {
                key: cacheKey,
                prompt: prompt,
                mode: mode,
                options: options,
                response: response,
                category: category,
                priority: categoryConfig.priority,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                expiresAt: Date.now() + categoryConfig.ttl,
                accessCount: 1,
                size: JSON.stringify(response).length
            };
            
            // Check cache size and evict if necessary
            this.ensureCacheSpace();
            
            // Store cache entry
            localStorage.setItem(`${this.keys.responses}_${cacheKey}`, JSON.stringify(cacheEntry));
            
            // Update cache index
            this.updateCacheIndex(cacheKey, cacheEntry);
            
        } catch (error) {
            console.error('Error caching response:', error);
        }
    }

    /**
     * Cache conversation context for quick retrieval
     * @param {string} conversationId - Conversation ID
     * @param {Object} context - Context data
     */
    cacheConversationContext(conversationId, context) {
        try {
            const cacheKey = `context_${conversationId}`;
            const categoryConfig = this.cacheCategories.conversation_context;
            
            const contextEntry = {
                key: cacheKey,
                conversationId: conversationId,
                context: context,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                expiresAt: Date.now() + categoryConfig.ttl,
                size: JSON.stringify(context).length
            };
            
            localStorage.setItem(`${this.keys.contexts}_${cacheKey}`, JSON.stringify(contextEntry));
            
        } catch (error) {
            console.error('Error caching conversation context:', error);
        }
    }

    /**
     * Get cached conversation context
     * @param {string} conversationId - Conversation ID
     * @returns {Object|null} Cached context or null
     */
    getCachedContext(conversationId) {
        try {
            const cacheKey = `context_${conversationId}`;
            const cachedData = localStorage.getItem(`${this.keys.contexts}_${cacheKey}`);
            
            if (!cachedData) {
                return null;
            }
            
            const cached = JSON.parse(cachedData);
            
            if (this.isCacheEntryValid(cached)) {
                // Update access time
                cached.lastAccessed = Date.now();
                localStorage.setItem(`${this.keys.contexts}_${cacheKey}`, JSON.stringify(cached));
                
                return cached.context;
            } else {
                // Remove expired context
                localStorage.removeItem(`${this.keys.contexts}_${cacheKey}`);
                return null;
            }
        } catch (error) {
            console.error('Error retrieving cached context:', error);
            return null;
        }
    }

    /**
     * Invalidate cache entries by pattern or category
     * @param {Object} criteria - Invalidation criteria
     */
    invalidateCache(criteria = {}) {
        try {
            const index = this.getCacheIndex();
            let invalidatedCount = 0;
            
            for (const entry of index) {
                let shouldInvalidate = false;
                
                // Check invalidation criteria
                if (criteria.category && entry.category === criteria.category) {
                    shouldInvalidate = true;
                }
                
                if (criteria.mode && entry.mode === criteria.mode) {
                    shouldInvalidate = true;
                }
                
                if (criteria.olderThan && entry.createdAt < criteria.olderThan) {
                    shouldInvalidate = true;
                }
                
                if (criteria.pattern && entry.prompt.includes(criteria.pattern)) {
                    shouldInvalidate = true;
                }
                
                if (shouldInvalidate) {
                    this.removeCacheEntry(entry.key);
                    invalidatedCount++;
                }
            }
            
            console.log(`Cache invalidation completed: ${invalidatedCount} entries removed`);
            return invalidatedCount;
        } catch (error) {
            console.error('Error invalidating cache:', error);
            return 0;
        }
    }

    /**
     * Perform cache cleanup and maintenance
     */
    performCleanup() {
        try {
            const now = Date.now();
            let cleanedCount = 0;
            
            // Clean expired response cache entries
            const responseKeys = this.getStorageKeysByPrefix(this.keys.responses);
            for (const key of responseKeys) {
                const cachedData = localStorage.getItem(key);
                if (cachedData) {
                    const cached = JSON.parse(cachedData);
                    if (!this.isCacheEntryValid(cached)) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                }
            }
            
            // Clean expired context cache entries
            const contextKeys = this.getStorageKeysByPrefix(this.keys.contexts);
            for (const key of contextKeys) {
                const cachedData = localStorage.getItem(key);
                if (cachedData) {
                    const cached = JSON.parse(cachedData);
                    if (!this.isCacheEntryValid(cached)) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                }
            }
            
            // Update cleanup timestamp
            this.updateCleanupTimestamp();
            
            console.log(`Cache cleanup completed: ${cleanedCount} expired entries removed`);
        } catch (error) {
            console.error('Error during cache cleanup:', error);
        }
    }

    /**
     * Get cache statistics and performance metrics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        try {
            const responseKeys = this.getStorageKeysByPrefix(this.keys.responses);
            const contextKeys = this.getStorageKeysByPrefix(this.keys.contexts);
            
            let totalSize = 0;
            let categoryStats = {};
            
            // Calculate response cache statistics
            for (const key of responseKeys) {
                const cachedData = localStorage.getItem(key);
                if (cachedData) {
                    const cached = JSON.parse(cachedData);
                    totalSize += cached.size || 0;
                    
                    if (!categoryStats[cached.category]) {
                        categoryStats[cached.category] = { count: 0, size: 0 };
                    }
                    categoryStats[cached.category].count++;
                    categoryStats[cached.category].size += cached.size || 0;
                }
            }
            
            // Calculate hit rate
            const hitRate = this.stats.totalRequests > 0 
                ? (this.stats.hits / this.stats.totalRequests * 100).toFixed(2)
                : 0;
            
            return {
                ...this.stats,
                hitRate: `${hitRate}%`,
                totalEntries: responseKeys.length,
                contextEntries: contextKeys.length,
                totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
                categoryBreakdown: categoryStats,
                cacheUtilization: `${((responseKeys.length / this.maxCacheSize) * 100).toFixed(2)}%`
            };
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return { ...this.stats, error: 'Failed to calculate statistics' };
        }
    }

    /**
     * Clear all cache data
     */
    clearCache() {
        try {
            // Remove all response cache entries
            const responseKeys = this.getStorageKeysByPrefix(this.keys.responses);
            for (const key of responseKeys) {
                localStorage.removeItem(key);
            }
            
            // Remove all context cache entries
            const contextKeys = this.getStorageKeysByPrefix(this.keys.contexts);
            for (const key of contextKeys) {
                localStorage.removeItem(key);
            }
            
            // Clear index and metadata
            localStorage.removeItem(this.keys.index);
            localStorage.removeItem(this.keys.metadata);
            
            // Reset statistics
            this.stats = {
                hits: 0,
                misses: 0,
                evictions: 0,
                totalRequests: 0
            };
            this.saveStats();
            
            console.log('Cache cleared successfully');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    // Private helper methods

    /**
     * Check if cache entry is still valid
     * @param {Object} cacheEntry - Cache entry to validate
     * @returns {boolean} Whether entry is valid
     */
    isCacheEntryValid(cacheEntry) {
        return cacheEntry.expiresAt > Date.now();
    }

    /**
     * Ensure cache has space for new entries
     */
    ensureCacheSpace() {
        try {
            const responseKeys = this.getStorageKeysByPrefix(this.keys.responses);
            
            if (responseKeys.length >= this.maxCacheSize) {
                // Implement LRU eviction
                const entries = [];
                
                for (const key of responseKeys) {
                    const cachedData = localStorage.getItem(key);
                    if (cachedData) {
                        const cached = JSON.parse(cachedData);
                        entries.push({
                            key: key.replace(`${this.keys.responses}_`, ''),
                            lastAccessed: cached.lastAccessed,
                            priority: cached.priority || 3,
                            size: cached.size || 0
                        });
                    }
                }
                
                // Sort by priority (lower is higher priority) and last accessed time
                entries.sort((a, b) => {
                    if (a.priority !== b.priority) {
                        return b.priority - a.priority; // Higher priority number = lower priority
                    }
                    return a.lastAccessed - b.lastAccessed; // Older first
                });
                
                // Remove 10% of entries to make space
                const toRemove = Math.ceil(entries.length * 0.1);
                for (let i = 0; i < toRemove; i++) {
                    this.removeCacheEntry(entries[i].key);
                    this.stats.evictions++;
                }
            }
        } catch (error) {
            console.error('Error ensuring cache space:', error);
        }
    }

    /**
     * Remove cache entry and update index
     * @param {string} cacheKey - Cache key to remove
     */
    removeCacheEntry(cacheKey) {
        try {
            localStorage.removeItem(`${this.keys.responses}_${cacheKey}`);
            this.removeFromCacheIndex(cacheKey);
        } catch (error) {
            console.error('Error removing cache entry:', error);
        }
    }

    /**
     * Get cache index
     * @returns {Array} Cache index
     */
    getCacheIndex() {
        try {
            const indexData = localStorage.getItem(this.keys.index);
            return indexData ? JSON.parse(indexData) : [];
        } catch (error) {
            console.error('Error getting cache index:', error);
            return [];
        }
    }

    /**
     * Update cache index with new entry
     * @param {string} cacheKey - Cache key
     * @param {Object} cacheEntry - Cache entry metadata
     */
    updateCacheIndex(cacheKey, cacheEntry) {
        try {
            const index = this.getCacheIndex();
            
            // Remove existing entry if present
            const existingIndex = index.findIndex(entry => entry.key === cacheKey);
            if (existingIndex !== -1) {
                index.splice(existingIndex, 1);
            }
            
            // Add new entry
            index.push({
                key: cacheKey,
                category: cacheEntry.category,
                mode: cacheEntry.mode,
                prompt: cacheEntry.prompt.substring(0, 100), // Store truncated prompt for reference
                createdAt: cacheEntry.createdAt,
                expiresAt: cacheEntry.expiresAt
            });
            
            localStorage.setItem(this.keys.index, JSON.stringify(index));
        } catch (error) {
            console.error('Error updating cache index:', error);
        }
    }

    /**
     * Remove entry from cache index
     * @param {string} cacheKey - Cache key to remove
     */
    removeFromCacheIndex(cacheKey) {
        try {
            const index = this.getCacheIndex();
            const filteredIndex = index.filter(entry => entry.key !== cacheKey);
            localStorage.setItem(this.keys.index, JSON.stringify(filteredIndex));
        } catch (error) {
            console.error('Error removing from cache index:', error);
        }
    }

    /**
     * Get storage keys by prefix
     * @param {string} prefix - Key prefix to search for
     * @returns {Array} Array of matching keys
     */
    getStorageKeysByPrefix(prefix) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * Generate hash-like string from input
     * @param {string} str - Input string
     * @returns {string} Hash-like string
     */
    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36);
    }

    /**
     * Save statistics to localStorage
     */
    saveStats() {
        try {
            localStorage.setItem(this.keys.stats, JSON.stringify(this.stats));
        } catch (error) {
            console.error('Error saving cache stats:', error);
        }
    }

    /**
     * Update cleanup timestamp in metadata
     */
    updateCleanupTimestamp() {
        try {
            const metadata = JSON.parse(localStorage.getItem(this.keys.metadata) || '{}');
            metadata.lastCleanup = new Date().toISOString();
            localStorage.setItem(this.keys.metadata, JSON.stringify(metadata));
        } catch (error) {
            console.error('Error updating cleanup timestamp:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIResponseCache;
} else if (typeof window !== 'undefined') {
    window.AIResponseCache = AIResponseCache;
}