/**
 * Background Processing System
 * Handles background workers for news fetching, analytics updates, and AI processing tasks
 * with queue management and scheduled task execution
 */
class BackgroundProcessor {
    constructor(config = {}) {
        this.config = {
            maxConcurrentTasks: config.maxConcurrentTasks || 3,
            taskTimeout: config.taskTimeout || 30000, // 30 seconds
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 5000, // 5 seconds
            queueCheckInterval: config.queueCheckInterval || 1000, // 1 second
            ...config
        };
        
        // Task queues
        this.queues = {
            high: [], // High priority tasks (user-initiated)
            medium: [], // Medium priority tasks (scheduled updates)
            low: [] // Low priority tasks (background maintenance)
        };
        
        // Active tasks tracking
        this.activeTasks = new Map();
        this.taskHistory = [];
        this.maxHistorySize = 100;
        
        // Scheduled tasks
        this.scheduledTasks = new Map();
        this.intervals = new Map();
        
        // Statistics
        this.stats = {
            tasksProcessed: 0,
            tasksSucceeded: 0,
            tasksFailed: 0,
            averageProcessingTime: 0,
            queueSizes: { high: 0, medium: 0, low: 0 }
        };
        
        // Processing state
        this.isProcessing = false;
        this.processingInterval = null;
        
        this.initialize();
    }

    /**
     * Initialize background processor
     */
    initialize() {
        try {
            // Start queue processing
            this.startProcessing();
            
            // Set up default scheduled tasks
            this.setupDefaultScheduledTasks();
            
            console.log('Background Processor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Background Processor:', error);
        }
    }

    /**
     * Add task to processing queue
     * @param {Object} task - Task configuration
     * @param {string} priority - Task priority ('high', 'medium', 'low')
     * @returns {string} Task ID
     */
    addTask(task, priority = 'medium') {
        try {
            const taskId = this.generateTaskId();
            const taskObject = {
                id: taskId,
                type: task.type,
                handler: task.handler,
                data: task.data || {},
                priority: priority,
                createdAt: Date.now(),
                attempts: 0,
                maxAttempts: task.maxAttempts || this.config.retryAttempts,
                timeout: task.timeout || this.config.taskTimeout,
                onSuccess: task.onSuccess,
                onError: task.onError,
                onProgress: task.onProgress
            };
            
            // Add to appropriate queue
            if (this.queues[priority]) {
                this.queues[priority].push(taskObject);
                this.updateQueueStats();
            } else {
                throw new Error(`Invalid priority: ${priority}`);
            }
            
            console.log(`Task ${taskId} added to ${priority} priority queue`);
            return taskId;
        } catch (error) {
            console.error('Error adding task to queue:', error);
            throw error;
        }
    }

    /**
     * Schedule recurring task
     * @param {Object} task - Task configuration
     * @param {number} interval - Interval in milliseconds
     * @param {string} priority - Task priority
     * @returns {string} Scheduled task ID
     */
    scheduleTask(task, interval, priority = 'medium') {
        try {
            const scheduleId = this.generateTaskId();
            
            const scheduledTask = {
                id: scheduleId,
                task: task,
                interval: interval,
                priority: priority,
                lastRun: null,
                nextRun: Date.now() + interval,
                isActive: true
            };
            
            this.scheduledTasks.set(scheduleId, scheduledTask);
            
            // Set up interval
            const intervalId = setInterval(() => {
                if (scheduledTask.isActive) {
                    this.addTask(task, priority);
                    scheduledTask.lastRun = Date.now();
                    scheduledTask.nextRun = Date.now() + interval;
                }
            }, interval);
            
            this.intervals.set(scheduleId, intervalId);
            
            console.log(`Task scheduled with ID ${scheduleId}, interval: ${interval}ms`);
            return scheduleId;
        } catch (error) {
            console.error('Error scheduling task:', error);
            throw error;
        }
    }

    /**
     * Start queue processing
     */
    startProcessing() {
        if (this.isProcessing) {
            return;
        }
        
        this.isProcessing = true;
        this.processingInterval = setInterval(() => {
            this.processQueues();
        }, this.config.queueCheckInterval);
        
        console.log('Background processing started');
    }

    /**
     * Stop queue processing
     */
    stopProcessing() {
        if (!this.isProcessing) {
            return;
        }
        
        this.isProcessing = false;
        
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        
        // Stop all scheduled tasks
        for (const [scheduleId, intervalId] of this.intervals) {
            clearInterval(intervalId);
        }
        this.intervals.clear();
        
        console.log('Background processing stopped');
    }

    /**
     * Process task queues
     */
    async processQueues() {
        try {
            // Check if we can process more tasks
            if (this.activeTasks.size >= this.config.maxConcurrentTasks) {
                return;
            }
            
            // Process queues in priority order
            const priorities = ['high', 'medium', 'low'];
            
            for (const priority of priorities) {
                const queue = this.queues[priority];
                
                while (queue.length > 0 && this.activeTasks.size < this.config.maxConcurrentTasks) {
                    const task = queue.shift();
                    this.processTask(task);
                }
                
                // Update queue statistics
                this.updateQueueStats();
            }
        } catch (error) {
            console.error('Error processing queues:', error);
        }
    }

    /**
     * Process individual task
     * @param {Object} task - Task to process
     */
    async processTask(task) {
        try {
            // Mark task as active
            this.activeTasks.set(task.id, task);
            task.startTime = Date.now();
            task.attempts++;
            
            console.log(`Processing task ${task.id} (${task.type}), attempt ${task.attempts}`);
            
            // Set up timeout
            const timeoutId = setTimeout(() => {
                this.handleTaskTimeout(task);
            }, task.timeout);
            
            try {
                // Execute task handler
                let result;
                if (typeof task.handler === 'function') {
                    result = await task.handler(task.data, (progress) => {
                        if (task.onProgress) {
                            task.onProgress(progress);
                        }
                    });
                } else {
                    // Handle predefined task types
                    result = await this.executeTaskType(task);
                }
                
                // Clear timeout
                clearTimeout(timeoutId);
                
                // Task completed successfully
                this.handleTaskSuccess(task, result);
                
            } catch (error) {
                clearTimeout(timeoutId);
                this.handleTaskError(task, error);
            }
        } catch (error) {
            console.error(`Error processing task ${task.id}:`, error);
            this.handleTaskError(task, error);
        }
    }

    /**
     * Execute predefined task types
     * @param {Object} task - Task to execute
     * @returns {Promise<any>} Task result
     */
    async executeTaskType(task) {
        switch (task.type) {
            case 'news_fetch':
                return await this.executeNewsFetch(task.data);
            
            case 'analytics_update':
                return await this.executeAnalyticsUpdate(task.data);
            
            case 'cache_cleanup':
                return await this.executeCacheCleanup(task.data);
            
            case 'performance_analysis':
                return await this.executePerformanceAnalysis(task.data);
            
            case 'conversation_cleanup':
                return await this.executeConversationCleanup(task.data);
            
            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }
    }

    /**
     * Execute news fetching task
     * @param {Object} data - Task data
     * @returns {Promise<Object>} Fetch result
     */
    async executeNewsFetch(data) {
        // Integration with NewsIntegrationService
        if (window.NewsIntegrationService) {
            const newsService = new NewsIntegrationService();
            const categories = data.categories || ['all'];
            const limit = data.limit || 20;
            
            const articles = await newsService.fetchLatestNews(categories, limit);
            
            // Process articles in background
            const processedArticles = [];
            for (const article of articles) {
                try {
                    const summary = await newsService.summarizeArticle(article);
                    const relevance = await newsService.analyzeRelevance(article, 'upsc');
                    
                    processedArticles.push({
                        ...article,
                        summary,
                        relevance,
                        processedAt: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('Error processing article:', error);
                }
            }
            
            return {
                totalFetched: articles.length,
                totalProcessed: processedArticles.length,
                articles: processedArticles
            };
        }
        
        return { error: 'NewsIntegrationService not available' };
    }

    /**
     * Execute analytics update task
     * @param {Object} data - Task data
     * @returns {Promise<Object>} Update result
     */
    async executeAnalyticsUpdate(data) {
        // Integration with PerformanceAnalyticsAI
        if (window.PerformanceAnalyticsAI) {
            const analyticsAI = new PerformanceAnalyticsAI();
            
            // Get user data for analysis
            const userData = data.userData || this.getUserDataForAnalysis();
            
            // Perform analysis
            const analysis = await analyticsAI.analyzeStudyPatterns(userData);
            const weakAreas = await analyticsAI.identifyWeakAreas(userData);
            const recommendations = await analyticsAI.generateDailyTasks(userData, data.goals || []);
            
            return {
                analysis,
                weakAreas,
                recommendations,
                updatedAt: new Date().toISOString()
            };
        }
        
        return { error: 'PerformanceAnalyticsAI not available' };
    }

    /**
     * Execute cache cleanup task
     * @param {Object} data - Task data
     * @returns {Promise<Object>} Cleanup result
     */
    async executeCacheCleanup(data) {
        let cleanedEntries = 0;
        
        // Clean AI response cache
        if (window.AIResponseCache) {
            const cache = new AIResponseCache();
            cache.performCleanup();
            cleanedEntries += 1;
        }
        
        // Clean conversation storage
        if (window.ConversationStorage) {
            const storage = new ConversationStorage();
            storage.performCleanup();
            cleanedEntries += 1;
        }
        
        return {
            cleanedSystems: cleanedEntries,
            cleanedAt: new Date().toISOString()
        };
    }

    /**
     * Execute performance analysis task
     * @param {Object} data - Task data
     * @returns {Promise<Object>} Analysis result
     */
    async executePerformanceAnalysis(data) {
        // Integration with existing performance systems
        const results = {
            timestamp: new Date().toISOString(),
            metrics: {}
        };
        
        // Analyze cache performance
        if (window.AIResponseCache) {
            const cache = new AIResponseCache();
            results.metrics.cache = cache.getCacheStats();
        }
        
        // Analyze queue performance
        results.metrics.backgroundProcessor = this.getProcessorStats();
        
        return results;
    }

    /**
     * Execute conversation cleanup task
     * @param {Object} data - Task data
     * @returns {Promise<Object>} Cleanup result
     */
    async executeConversationCleanup(data) {
        if (window.ConversationStorage) {
            const storage = new ConversationStorage();
            const beforeStats = storage.getStorageStats();
            
            storage.performCleanup();
            
            const afterStats = storage.getStorageStats();
            
            return {
                before: beforeStats,
                after: afterStats,
                cleanedAt: new Date().toISOString()
            };
        }
        
        return { error: 'ConversationStorage not available' };
    }

    /**
     * Handle successful task completion
     * @param {Object} task - Completed task
     * @param {any} result - Task result
     */
    handleTaskSuccess(task, result) {
        try {
            const processingTime = Date.now() - task.startTime;
            
            // Update statistics
            this.stats.tasksProcessed++;
            this.stats.tasksSucceeded++;
            this.updateAverageProcessingTime(processingTime);
            
            // Remove from active tasks
            this.activeTasks.delete(task.id);
            
            // Add to history
            this.addToHistory(task, 'success', result, processingTime);
            
            // Call success callback
            if (task.onSuccess) {
                task.onSuccess(result);
            }
            
            console.log(`Task ${task.id} completed successfully in ${processingTime}ms`);
        } catch (error) {
            console.error('Error handling task success:', error);
        }
    }

    /**
     * Handle task error
     * @param {Object} task - Failed task
     * @param {Error} error - Task error
     */
    handleTaskError(task, error) {
        try {
            const processingTime = Date.now() - task.startTime;
            
            // Check if we should retry
            if (task.attempts < task.maxAttempts) {
                // Re-queue task for retry
                setTimeout(() => {
                    this.queues[task.priority].push(task);
                }, this.config.retryDelay);
                
                console.log(`Task ${task.id} failed, retrying (attempt ${task.attempts + 1}/${task.maxAttempts})`);
            } else {
                // Task failed permanently
                this.stats.tasksProcessed++;
                this.stats.tasksFailed++;
                
                // Remove from active tasks
                this.activeTasks.delete(task.id);
                
                // Add to history
                this.addToHistory(task, 'failed', error.message, processingTime);
                
                // Call error callback
                if (task.onError) {
                    task.onError(error);
                }
                
                console.error(`Task ${task.id} failed permanently:`, error);
            }
        } catch (handlingError) {
            console.error('Error handling task error:', handlingError);
        }
    }

    /**
     * Handle task timeout
     * @param {Object} task - Timed out task
     */
    handleTaskTimeout(task) {
        const error = new Error(`Task ${task.id} timed out after ${task.timeout}ms`);
        this.handleTaskError(task, error);
    }

    /**
     * Set up default scheduled tasks
     */
    setupDefaultScheduledTasks() {
        // Schedule news fetching every 30 minutes
        this.scheduleTask({
            type: 'news_fetch',
            data: { categories: ['all'], limit: 20 }
        }, 30 * 60 * 1000, 'medium'); // 30 minutes
        
        // Schedule analytics update every hour
        this.scheduleTask({
            type: 'analytics_update',
            data: {}
        }, 60 * 60 * 1000, 'medium'); // 1 hour
        
        // Schedule cache cleanup every 6 hours
        this.scheduleTask({
            type: 'cache_cleanup',
            data: {}
        }, 6 * 60 * 60 * 1000, 'low'); // 6 hours
        
        // Schedule conversation cleanup daily
        this.scheduleTask({
            type: 'conversation_cleanup',
            data: {}
        }, 24 * 60 * 60 * 1000, 'low'); // 24 hours
    }

    /**
     * Get processor statistics
     * @returns {Object} Processor statistics
     */
    getProcessorStats() {
        return {
            ...this.stats,
            activeTasks: this.activeTasks.size,
            queueSizes: {
                high: this.queues.high.length,
                medium: this.queues.medium.length,
                low: this.queues.low.length
            },
            scheduledTasks: this.scheduledTasks.size,
            isProcessing: this.isProcessing
        };
    }

    /**
     * Get task history
     * @param {number} limit - Maximum number of entries to return
     * @returns {Array} Task history
     */
    getTaskHistory(limit = 20) {
        return this.taskHistory.slice(-limit);
    }

    /**
     * Cancel scheduled task
     * @param {string} scheduleId - Scheduled task ID
     */
    cancelScheduledTask(scheduleId) {
        const scheduledTask = this.scheduledTasks.get(scheduleId);
        if (scheduledTask) {
            scheduledTask.isActive = false;
            
            const intervalId = this.intervals.get(scheduleId);
            if (intervalId) {
                clearInterval(intervalId);
                this.intervals.delete(scheduleId);
            }
            
            this.scheduledTasks.delete(scheduleId);
            console.log(`Scheduled task ${scheduleId} cancelled`);
        }
    }

    /**
     * Clear all queues
     */
    clearQueues() {
        this.queues.high = [];
        this.queues.medium = [];
        this.queues.low = [];
        this.updateQueueStats();
        console.log('All queues cleared');
    }

    // Private helper methods

    /**
     * Generate unique task ID
     * @returns {string} Task ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Update queue statistics
     */
    updateQueueStats() {
        this.stats.queueSizes = {
            high: this.queues.high.length,
            medium: this.queues.medium.length,
            low: this.queues.low.length
        };
    }

    /**
     * Update average processing time
     * @param {number} processingTime - Latest processing time
     */
    updateAverageProcessingTime(processingTime) {
        const totalTasks = this.stats.tasksSucceeded + this.stats.tasksFailed;
        if (totalTasks === 1) {
            this.stats.averageProcessingTime = processingTime;
        } else {
            this.stats.averageProcessingTime = 
                (this.stats.averageProcessingTime * (totalTasks - 1) + processingTime) / totalTasks;
        }
    }

    /**
     * Add task to history
     * @param {Object} task - Task object
     * @param {string} status - Task status
     * @param {any} result - Task result or error
     * @param {number} processingTime - Processing time
     */
    addToHistory(task, status, result, processingTime) {
        const historyEntry = {
            id: task.id,
            type: task.type,
            priority: task.priority,
            status: status,
            attempts: task.attempts,
            processingTime: processingTime,
            result: typeof result === 'string' ? result : JSON.stringify(result).substring(0, 200),
            completedAt: new Date().toISOString()
        };
        
        this.taskHistory.push(historyEntry);
        
        // Maintain history size limit
        if (this.taskHistory.length > this.maxHistorySize) {
            this.taskHistory.shift();
        }
    }

    /**
     * Get user data for analysis (placeholder)
     * @returns {Object} User data
     */
    getUserDataForAnalysis() {
        // This would integrate with existing user data systems
        return {
            userId: 'default',
            studyTime: 0,
            completedTasks: 0,
            accuracy: 0,
            subjects: []
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundProcessor;
} else if (typeof window !== 'undefined') {
    window.BackgroundProcessor = BackgroundProcessor;
}