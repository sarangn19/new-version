/**
 * UI Performance Optimizer
 * Implements progressive loading, virtual scrolling, and optimistic UI updates
 * for better user experience in AI interactions
 */
class UIPerformanceOptimizer {
    constructor(config = {}) {
        this.config = {
            virtualScrollThreshold: config.virtualScrollThreshold || 50, // Start virtual scrolling after 50 messages
            chunkSize: config.chunkSize || 20, // Load messages in chunks of 20
            debounceDelay: config.debounceDelay || 150, // Debounce scroll events
            intersectionThreshold: config.intersectionThreshold || 0.1,
            preloadDistance: config.preloadDistance || 5, // Preload 5 messages ahead
            maxCachedElements: config.maxCachedElements || 100,
            ...config
        };
        
        // Virtual scrolling state
        this.virtualScrolling = {
            enabled: false,
            container: null,
            itemHeight: 0,
            totalItems: 0,
            visibleStart: 0,
            visibleEnd: 0,
            scrollTop: 0,
            containerHeight: 0
        };
        
        // Progressive loading state
        this.progressiveLoading = {
            isLoading: false,
            hasMore: true,
            currentPage: 0,
            itemsPerPage: this.config.chunkSize
        };
        
        // Optimistic UI state
        this.optimisticUpdates = new Map();
        this.pendingUpdates = new Set();
        
        // Performance monitoring
        this.performanceMetrics = {
            renderTimes: [],
            scrollEvents: 0,
            virtualizedItems: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        // Element cache for virtual scrolling
        this.elementCache = new Map();
        
        // Intersection observer for lazy loading
        this.intersectionObserver = null;
        
        // Debounced functions
        this.debouncedScrollHandler = this.debounce(this.handleScroll.bind(this), this.config.debounceDelay);
        this.debouncedResizeHandler = this.debounce(this.handleResize.bind(this), this.config.debounceDelay);
        
        this.initialize();
    }

    /**
     * Initialize UI performance optimizer
     */
    initialize() {
        try {
            // Set up intersection observer for lazy loading
            this.setupIntersectionObserver();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            console.log('UI Performance Optimizer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize UI Performance Optimizer:', error);
        }
    }

    /**
     * Enable virtual scrolling for a container
     * @param {HTMLElement} container - Container element
     * @param {Array} items - Array of items to virtualize
     * @param {Function} renderItem - Function to render individual items
     * @returns {Object} Virtual scrolling controller
     */
    enableVirtualScrolling(container, items, renderItem) {
        if (!container || !Array.isArray(items)) {
            throw new Error('Invalid container or items for virtual scrolling');
        }
        
        const controller = {
            container: container,
            items: items,
            renderItem: renderItem,
            isEnabled: false
        };
        
        // Only enable if we have enough items
        if (items.length >= this.config.virtualScrollThreshold) {
            this.setupVirtualScrolling(controller);
            controller.isEnabled = true;
        } else {
            // Use regular rendering for small lists
            this.renderAllItems(controller);
        }
        
        return controller;
    }

    /**
     * Set up virtual scrolling for a container
     * @param {Object} controller - Virtual scrolling controller
     */
    setupVirtualScrolling(controller) {
        const { container, items, renderItem } = controller;
        
        // Calculate item height (assume uniform height)
        const sampleItem = this.createSampleItem(renderItem, items[0]);
        container.appendChild(sampleItem);
        const itemHeight = sampleItem.offsetHeight;
        container.removeChild(sampleItem);
        
        // Set up virtual scrolling state
        this.virtualScrolling = {
            enabled: true,
            container: container,
            itemHeight: itemHeight,
            totalItems: items.length,
            visibleStart: 0,
            visibleEnd: 0,
            scrollTop: 0,
            containerHeight: container.clientHeight
        };
        
        // Create virtual container
        this.createVirtualContainer(container, items.length * itemHeight);
        
        // Set up scroll listener
        container.addEventListener('scroll', this.debouncedScrollHandler);
        window.addEventListener('resize', this.debouncedResizeHandler);
        
        // Initial render
        this.updateVirtualScrolling(controller);
        
        console.log(`Virtual scrolling enabled for ${items.length} items`);
    }

    /**
     * Create virtual container with proper height
     * @param {HTMLElement} container - Container element
     * @param {number} totalHeight - Total height of all items
     */
    createVirtualContainer(container, totalHeight) {
        // Create spacer elements
        const topSpacer = document.createElement('div');
        topSpacer.className = 'virtual-scroll-top-spacer';
        topSpacer.style.height = '0px';
        
        const bottomSpacer = document.createElement('div');
        bottomSpacer.className = 'virtual-scroll-bottom-spacer';
        bottomSpacer.style.height = totalHeight + 'px';
        
        const viewport = document.createElement('div');
        viewport.className = 'virtual-scroll-viewport';
        
        // Clear container and add virtual elements
        container.innerHTML = '';
        container.appendChild(topSpacer);
        container.appendChild(viewport);
        container.appendChild(bottomSpacer);
        
        // Store references
        this.virtualScrolling.topSpacer = topSpacer;
        this.virtualScrolling.viewport = viewport;
        this.virtualScrolling.bottomSpacer = bottomSpacer;
    }

    /**
     * Update virtual scrolling based on scroll position
     * @param {Object} controller - Virtual scrolling controller
     */
    updateVirtualScrolling(controller) {
        const { container, items, renderItem } = controller;
        const vs = this.virtualScrolling;
        
        if (!vs.enabled) return;
        
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        
        // Calculate visible range with buffer
        const buffer = Math.ceil(containerHeight / vs.itemHeight);
        const visibleStart = Math.max(0, Math.floor(scrollTop / vs.itemHeight) - buffer);
        const visibleEnd = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / vs.itemHeight) + buffer);
        
        // Update spacers
        vs.topSpacer.style.height = (visibleStart * vs.itemHeight) + 'px';
        vs.bottomSpacer.style.height = ((items.length - visibleEnd) * vs.itemHeight) + 'px';
        
        // Render visible items
        this.renderVisibleItems(controller, visibleStart, visibleEnd);
        
        // Update state
        vs.visibleStart = visibleStart;
        vs.visibleEnd = visibleEnd;
        vs.scrollTop = scrollTop;
        
        // Update performance metrics
        this.performanceMetrics.virtualizedItems = visibleEnd - visibleStart;
    }

    /**
     * Render visible items in virtual scrolling
     * @param {Object} controller - Virtual scrolling controller
     * @param {number} start - Start index
     * @param {number} end - End index
     */
    renderVisibleItems(controller, start, end) {
        const { items, renderItem } = controller;
        const viewport = this.virtualScrolling.viewport;
        
        const startTime = performance.now();
        
        // Clear viewport
        viewport.innerHTML = '';
        
        // Render items in range
        for (let i = start; i < end; i++) {
            const item = items[i];
            let element = this.getCachedElement(i);
            
            if (!element) {
                element = renderItem(item, i);
                this.cacheElement(i, element);
                this.performanceMetrics.cacheMisses++;
            } else {
                this.performanceMetrics.cacheHits++;
            }
            
            viewport.appendChild(element);
        }
        
        // Record render time
        const renderTime = performance.now() - startTime;
        this.performanceMetrics.renderTimes.push(renderTime);
        
        // Keep only last 100 render times
        if (this.performanceMetrics.renderTimes.length > 100) {
            this.performanceMetrics.renderTimes.shift();
        }
    }

    /**
     * Enable progressive loading for a container
     * @param {HTMLElement} container - Container element
     * @param {Function} loadMoreItems - Function to load more items
     * @param {Object} options - Progressive loading options
     * @returns {Object} Progressive loading controller
     */
    enableProgressiveLoading(container, loadMoreItems, options = {}) {
        const controller = {
            container: container,
            loadMoreItems: loadMoreItems,
            options: {
                threshold: options.threshold || 200, // Load when 200px from bottom
                initialLoad: options.initialLoad !== false,
                ...options
            },
            isEnabled: true
        };
        
        // Set up scroll listener for progressive loading
        container.addEventListener('scroll', (event) => {
            this.handleProgressiveScroll(controller, event);
        });
        
        // Initial load if enabled
        if (controller.options.initialLoad) {
            this.loadNextChunk(controller);
        }
        
        return controller;
    }

    /**
     * Handle scroll events for progressive loading
     * @param {Object} controller - Progressive loading controller
     * @param {Event} event - Scroll event
     */
    handleProgressiveScroll(controller, event) {
        const container = controller.container;
        const threshold = controller.options.threshold;
        
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        // Check if we're near the bottom
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
            this.loadNextChunk(controller);
        }
    }

    /**
     * Load next chunk of items
     * @param {Object} controller - Progressive loading controller
     */
    async loadNextChunk(controller) {
        if (this.progressiveLoading.isLoading || !this.progressiveLoading.hasMore) {
            return;
        }
        
        this.progressiveLoading.isLoading = true;
        
        try {
            // Show loading indicator
            this.showProgressiveLoadingIndicator(controller.container);
            
            // Load more items
            const result = await controller.loadMoreItems(
                this.progressiveLoading.currentPage,
                this.progressiveLoading.itemsPerPage
            );
            
            if (result && result.items && result.items.length > 0) {
                // Process and append new items
                this.appendProgressiveItems(controller, result.items);
                
                this.progressiveLoading.currentPage++;
                this.progressiveLoading.hasMore = result.hasMore !== false;
            } else {
                this.progressiveLoading.hasMore = false;
            }
        } catch (error) {
            console.error('Error loading more items:', error);
            this.showProgressiveLoadingError(controller.container);
        } finally {
            this.progressiveLoading.isLoading = false;
            this.hideProgressiveLoadingIndicator(controller.container);
        }
    }

    /**
     * Append progressively loaded items
     * @param {Object} controller - Progressive loading controller
     * @param {Array} items - New items to append
     */
    appendProgressiveItems(controller, items) {
        const fragment = document.createDocumentFragment();
        
        items.forEach((item, index) => {
            const element = controller.options.renderItem 
                ? controller.options.renderItem(item, index)
                : this.createDefaultItemElement(item);
            
            // Set up lazy loading for the element
            this.setupLazyLoading(element);
            
            fragment.appendChild(element);
        });
        
        controller.container.appendChild(fragment);
    }

    /**
     * Create optimistic UI update
     * @param {string} id - Update ID
     * @param {HTMLElement} element - Element to update
     * @param {Function} updateFn - Update function
     * @param {Function} rollbackFn - Rollback function
     * @returns {Promise} Update promise
     */
    createOptimisticUpdate(id, element, updateFn, rollbackFn) {
        // Store original state for rollback
        const originalState = {
            innerHTML: element.innerHTML,
            className: element.className,
            style: element.style.cssText
        };
        
        // Apply optimistic update immediately
        updateFn(element);
        
        // Store update info
        this.optimisticUpdates.set(id, {
            element: element,
            originalState: originalState,
            rollbackFn: rollbackFn,
            timestamp: Date.now()
        });
        
        this.pendingUpdates.add(id);
        
        // Add visual indicator for pending state
        element.classList.add('optimistic-update-pending');
        
        return {
            confirm: () => this.confirmOptimisticUpdate(id),
            rollback: () => this.rollbackOptimisticUpdate(id)
        };
    }

    /**
     * Confirm optimistic update
     * @param {string} id - Update ID
     */
    confirmOptimisticUpdate(id) {
        const update = this.optimisticUpdates.get(id);
        if (update) {
            update.element.classList.remove('optimistic-update-pending');
            update.element.classList.add('optimistic-update-confirmed');
            
            // Remove confirmed class after animation
            setTimeout(() => {
                update.element.classList.remove('optimistic-update-confirmed');
            }, 300);
            
            this.optimisticUpdates.delete(id);
            this.pendingUpdates.delete(id);
        }
    }

    /**
     * Rollback optimistic update
     * @param {string} id - Update ID
     */
    rollbackOptimisticUpdate(id) {
        const update = this.optimisticUpdates.get(id);
        if (update) {
            // Restore original state
            update.element.innerHTML = update.originalState.innerHTML;
            update.element.className = update.originalState.className;
            update.element.style.cssText = update.originalState.style;
            
            // Apply rollback function if provided
            if (update.rollbackFn) {
                update.rollbackFn(update.element);
            }
            
            // Add visual indicator for rollback
            update.element.classList.add('optimistic-update-rollback');
            setTimeout(() => {
                update.element.classList.remove('optimistic-update-rollback');
            }, 300);
            
            this.optimisticUpdates.delete(id);
            this.pendingUpdates.delete(id);
        }
    }

    /**
     * Set up lazy loading for an element
     * @param {HTMLElement} element - Element to set up lazy loading for
     */
    setupLazyLoading(element) {
        if (!this.intersectionObserver) {
            return;
        }
        
        // Find images and other lazy-loadable content
        const lazyElements = element.querySelectorAll('[data-lazy-src], [data-lazy-load]');
        
        lazyElements.forEach(lazyElement => {
            this.intersectionObserver.observe(lazyElement);
        });
    }

    /**
     * Set up intersection observer for lazy loading
     */
    setupIntersectionObserver() {
        if (!window.IntersectionObserver) {
            console.warn('IntersectionObserver not supported, lazy loading disabled');
            return;
        }
        
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLazyElement(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: this.config.intersectionThreshold,
            rootMargin: '50px'
        });
    }

    /**
     * Load lazy element when it becomes visible
     * @param {HTMLElement} element - Element to load
     */
    loadLazyElement(element) {
        // Handle lazy images
        const lazySrc = element.dataset.lazySrc;
        if (lazySrc && element.tagName === 'IMG') {
            element.src = lazySrc;
            element.removeAttribute('data-lazy-src');
        }
        
        // Handle custom lazy loading
        const lazyLoad = element.dataset.lazyLoad;
        if (lazyLoad && window[lazyLoad]) {
            window[lazyLoad](element);
            element.removeAttribute('data-lazy-load');
        }
        
        // Add loaded class for styling
        element.classList.add('lazy-loaded');
    }

    /**
     * Show progressive loading indicator
     * @param {HTMLElement} container - Container element
     */
    showProgressiveLoadingIndicator(container) {
        let indicator = container.querySelector('.progressive-loading-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'progressive-loading-indicator flex items-center justify-center p-4 text-white/60';
            indicator.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
                    <span>Loading more...</span>
                </div>
            `;
            container.appendChild(indicator);
        }
        
        indicator.classList.remove('hidden');
    }

    /**
     * Hide progressive loading indicator
     * @param {HTMLElement} container - Container element
     */
    hideProgressiveLoadingIndicator(container) {
        const indicator = container.querySelector('.progressive-loading-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }

    /**
     * Show progressive loading error
     * @param {HTMLElement} container - Container element
     */
    showProgressiveLoadingError(container) {
        let errorElement = container.querySelector('.progressive-loading-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'progressive-loading-error flex items-center justify-center p-4 text-red-400';
            errorElement.innerHTML = `
                <div class="flex items-center space-x-2">
                    <i data-lucide="alert-circle" class="w-4 h-4"></i>
                    <span>Failed to load more items</span>
                    <button class="ml-2 px-2 py-1 bg-red-500/20 rounded text-xs hover:bg-red-500/30" onclick="this.parentElement.parentElement.remove()">
                        Retry
                    </button>
                </div>
            `;
            container.appendChild(errorElement);
        }
        
        errorElement.classList.remove('hidden');
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        const renderTimes = this.performanceMetrics.renderTimes;
        const avgRenderTime = renderTimes.length > 0 
            ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length 
            : 0;
        
        return {
            ...this.performanceMetrics,
            averageRenderTime: avgRenderTime.toFixed(2),
            cacheHitRate: this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses > 0
                ? ((this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses)) * 100).toFixed(2)
                : 0,
            pendingOptimisticUpdates: this.pendingUpdates.size
        };
    }

    // Private helper methods

    /**
     * Handle scroll events for virtual scrolling
     */
    handleScroll() {
        this.performanceMetrics.scrollEvents++;
        
        // Update virtual scrolling if enabled
        if (this.virtualScrolling.enabled) {
            // This will be called by the specific controller
        }
    }

    /**
     * Handle resize events
     */
    handleResize() {
        if (this.virtualScrolling.enabled) {
            this.virtualScrolling.containerHeight = this.virtualScrolling.container.clientHeight;
        }
    }

    /**
     * Create sample item for height calculation
     * @param {Function} renderItem - Render function
     * @param {Object} item - Sample item
     * @returns {HTMLElement} Sample element
     */
    createSampleItem(renderItem, item) {
        const element = renderItem(item, 0);
        element.style.position = 'absolute';
        element.style.visibility = 'hidden';
        return element;
    }

    /**
     * Render all items (non-virtual mode)
     * @param {Object} controller - Controller object
     */
    renderAllItems(controller) {
        const { container, items, renderItem } = controller;
        const fragment = document.createDocumentFragment();
        
        items.forEach((item, index) => {
            const element = renderItem(item, index);
            this.setupLazyLoading(element);
            fragment.appendChild(element);
        });
        
        container.appendChild(fragment);
    }

    /**
     * Get cached element
     * @param {number} index - Item index
     * @returns {HTMLElement|null} Cached element
     */
    getCachedElement(index) {
        return this.elementCache.get(index) || null;
    }

    /**
     * Cache element
     * @param {number} index - Item index
     * @param {HTMLElement} element - Element to cache
     */
    cacheElement(index, element) {
        // Enforce cache size limit
        if (this.elementCache.size >= this.config.maxCachedElements) {
            // Remove oldest entry (simple FIFO)
            const firstKey = this.elementCache.keys().next().value;
            this.elementCache.delete(firstKey);
        }
        
        this.elementCache.set(index, element.cloneNode(true));
    }

    /**
     * Create default item element
     * @param {Object} item - Item data
     * @returns {HTMLElement} Item element
     */
    createDefaultItemElement(item) {
        const element = document.createElement('div');
        element.className = 'default-item p-2 border-b border-white/10';
        element.textContent = typeof item === 'string' ? item : JSON.stringify(item);
        return element;
    }

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor frame rate
        if (window.requestAnimationFrame) {
            let lastTime = performance.now();
            let frameCount = 0;
            
            const measureFPS = (currentTime) => {
                frameCount++;
                
                if (currentTime - lastTime >= 1000) {
                    this.performanceMetrics.fps = frameCount;
                    frameCount = 0;
                    lastTime = currentTime;
                }
                
                requestAnimationFrame(measureFPS);
            };
            
            requestAnimationFrame(measureFPS);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIPerformanceOptimizer;
} else if (typeof window !== 'undefined') {
    window.UIPerformanceOptimizer = UIPerformanceOptimizer;
}