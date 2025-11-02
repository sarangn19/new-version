// PerformanceOptimizer - Performance optimization and monitoring
class PerformanceOptimizer {
  constructor() {
    this.performanceMetrics = new Map();
    this.imageCache = new Map();
    this.lazyLoadObserver = null;
    this.resourceCache = new Map();
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    
    this.initializePerformanceMonitoring();
    this.initializeLazyLoading();
    this.initializeImageOptimization();
    this.initializeCaching();
    this.optimizeExistingContent();
  }

  // Initialize performance monitoring
  initializePerformanceMonitoring() {
    // Monitor page load performance
    if ('performance' in window) {
      this.measurePageLoad();
      this.monitorResourceLoading();
      this.trackUserInteractions();
    }

    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Set up performance observer
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }
  }

  // Measure page load performance
  measurePageLoad() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        const metrics = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
          timestamp: new Date().toISOString()
        };

        this.performanceMetrics.set('pageLoad', metrics);
        this.analyzePageLoadPerformance(metrics);
      }, 0);
    });
  }

  // Monitor resource loading
  monitorResourceLoading() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.analyzeResourcePerformance(entry);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  // Track user interactions
  trackUserInteractions() {
    const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart'];
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, this.throttle((event) => {
        this.measureInteractionPerformance(event);
      }, 100), { passive: true });
    });
  }

  // Setup performance observer
  setupPerformanceObserver() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      observer.observe({ 
        entryTypes: ['measure', 'navigation', 'resource', 'paint'] 
      });
    } catch (error) {
      console.warn('PerformanceObserver not fully supported:', error);
    }
  }

  // Process performance entries
  processPerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'measure':
        this.handleCustomMeasure(entry);
        break;
      case 'resource':
        this.handleResourceEntry(entry);
        break;
      case 'paint':
        this.handlePaintEntry(entry);
        break;
    }
  }

  // Initialize lazy loading
  initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadLazyElement(entry.target);
            this.lazyLoadObserver.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      // Observe existing lazy elements
      this.observeLazyElements();
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadAllLazyElements();
    }
  }

  // Observe lazy elements
  observeLazyElements() {
    const lazyElements = document.querySelectorAll('[data-lazy-src], [data-lazy-load]');
    lazyElements.forEach(element => {
      this.lazyLoadObserver.observe(element);
    });
  }

  // Load lazy element
  loadLazyElement(element) {
    const startTime = performance.now();

    if (element.dataset.lazySrc) {
      // Lazy load image
      this.loadLazyImage(element);
    } else if (element.dataset.lazyLoad) {
      // Lazy load component
      this.loadLazyComponent(element);
    }

    // Measure loading time
    const loadTime = performance.now() - startTime;
    this.recordMetric('lazyLoad', loadTime);
  }

  // Load lazy image with optimization
  loadLazyImage(img) {
    const src = img.dataset.lazySrc;
    const placeholder = img.dataset.placeholder;

    // Show placeholder while loading
    if (placeholder && !img.src) {
      img.src = placeholder;
    }

    // Create optimized image
    const optimizedImg = new Image();
    optimizedImg.onload = () => {
      img.src = optimizedImg.src;
      img.classList.add('loaded');
      img.classList.remove('loading');
    };

    optimizedImg.onerror = () => {
      img.classList.add('error');
      img.classList.remove('loading');
      // Use fallback image
      if (img.dataset.fallback) {
        img.src = img.dataset.fallback;
      }
    };

    img.classList.add('loading');
    optimizedImg.src = this.optimizeImageUrl(src);
  }

  // Load lazy component
  loadLazyComponent(element) {
    const componentName = element.dataset.lazyLoad;
    
    // Simulate component loading
    element.innerHTML = '<div class="loading-spinner">Loading...</div>';
    
    setTimeout(() => {
      this.loadComponent(componentName, element);
    }, 100);
  }

  // Initialize image optimization
  initializeImageOptimization() {
    // Optimize existing images
    this.optimizeExistingImages();
    
    // Set up image loading optimization
    this.setupImageLoadingOptimization();
  }

  // Optimize existing images
  optimizeExistingImages() {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach(img => {
      this.optimizeImage(img);
    });
  }

  // Optimize individual image
  optimizeImage(img) {
    // Add loading attribute for native lazy loading
    if (!img.loading && 'loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy';
    }

    // Add error handling
    if (!img.onerror) {
      img.onerror = () => {
        this.handleImageError(img);
      };
    }

    // Optimize src URL
    if (img.src && !img.dataset.optimized) {
      img.src = this.optimizeImageUrl(img.src);
      img.dataset.optimized = 'true';
    }

    // Add intersection observer for better control
    if (this.lazyLoadObserver && !img.complete) {
      this.lazyLoadObserver.observe(img);
    }
  }

  // Optimize image URL
  optimizeImageUrl(url) {
    // Skip data URLs and external URLs
    if (url.startsWith('data:') || url.includes('://') && !url.includes(window.location.hostname)) {
      return url;
    }

    // Add cache busting for development
    if (this.isDevelopment()) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}v=${Date.now()}`;
    }

    return url;
  }

  // Handle image loading errors
  handleImageError(img) {
    // Try fallback image
    if (img.dataset.fallback && img.src !== img.dataset.fallback) {
      img.src = img.dataset.fallback;
      return;
    }

    // Use placeholder
    const placeholder = this.createImagePlaceholder(img);
    img.parentNode.replaceChild(placeholder, img);
  }

  // Create image placeholder
  createImagePlaceholder(img) {
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder bg-gray-700 flex items-center justify-center text-gray-400';
    placeholder.style.width = img.width || '100px';
    placeholder.style.height = img.height || '100px';
    placeholder.innerHTML = `
      <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
      </svg>
    `;
    return placeholder;
  }

  // Setup image loading optimization
  setupImageLoadingOptimization() {
    // Preload critical images
    this.preloadCriticalImages();
    
    // Set up responsive image loading
    this.setupResponsiveImages();
  }

  // Preload critical images
  preloadCriticalImages() {
    const criticalImages = [
      'image/logo.png',
      'image/DP1.png',
      'image/DP2.png'
    ];

    criticalImages.forEach(src => {
      if (!this.imageCache.has(src)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
        this.imageCache.set(src, true);
      }
    });
  }

  // Setup responsive images
  setupResponsiveImages() {
    const images = document.querySelectorAll('img[data-responsive]');
    
    images.forEach(img => {
      this.makeImageResponsive(img);
    });
  }

  // Make image responsive
  makeImageResponsive(img) {
    const breakpoints = {
      small: 480,
      medium: 768,
      large: 1024
    };

    const updateImageSrc = () => {
      const width = window.innerWidth;
      let size = 'large';
      
      if (width <= breakpoints.small) size = 'small';
      else if (width <= breakpoints.medium) size = 'medium';
      
      const baseSrc = img.dataset.responsive;
      const newSrc = `${baseSrc}?w=${breakpoints[size]}`;
      
      if (img.src !== newSrc) {
        img.src = newSrc;
      }
    };

    updateImageSrc();
    window.addEventListener('resize', this.throttle(updateImageSrc, 250));
  }

  // Initialize caching strategies
  initializeCaching() {
    // Set up localStorage caching for API responses
    this.setupLocalStorageCache();
    
    // Set up memory caching for frequently accessed data
    this.setupMemoryCache();
    
    // Set up cache cleanup
    this.setupCacheCleanup();
  }

  // Setup localStorage caching
  setupLocalStorageCache() {
    this.cacheConfig = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 5 * 1024 * 1024, // 5MB
      prefix: 'perf_cache_'
    };
  }

  // Cache data with expiration
  cacheData(key, data, maxAge = null) {
    try {
      const cacheItem = {
        data: data,
        timestamp: Date.now(),
        maxAge: maxAge || this.cacheConfig.maxAge
      };

      const cacheKey = this.cacheConfig.prefix + key;
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      
      // Update memory cache
      this.resourceCache.set(key, cacheItem);
      
    } catch (error) {
      console.warn('Failed to cache data:', error);
      // Clean up cache if storage is full
      this.cleanupCache();
    }
  }

  // Get cached data
  getCachedData(key) {
    try {
      // Check memory cache first
      if (this.resourceCache.has(key)) {
        const item = this.resourceCache.get(key);
        if (this.isCacheValid(item)) {
          return item.data;
        } else {
          this.resourceCache.delete(key);
        }
      }

      // Check localStorage cache
      const cacheKey = this.cacheConfig.prefix + key;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const item = JSON.parse(cached);
        if (this.isCacheValid(item)) {
          // Update memory cache
          this.resourceCache.set(key, item);
          return item.data;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Failed to get cached data:', error);
    }
    
    return null;
  }

  // Check if cache item is valid
  isCacheValid(item) {
    return Date.now() - item.timestamp < item.maxAge;
  }

  // Setup memory cache
  setupMemoryCache() {
    this.memoryCache = new Map();
    this.maxMemoryCacheSize = 100; // Maximum number of items
  }

  // Add to memory cache with LRU eviction
  addToMemoryCache(key, value) {
    // Remove oldest items if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value: value,
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  // Get from memory cache
  getFromMemoryCache(key) {
    const item = this.memoryCache.get(key);
    if (item) {
      item.accessCount++;
      item.lastAccessed = Date.now();
      return item.value;
    }
    return null;
  }

  // Setup cache cleanup
  setupCacheCleanup() {
    // Clean up cache every hour
    setInterval(() => {
      this.cleanupCache();
    }, 60 * 60 * 1000);

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanupCache();
    });
  }

  // Clean up expired cache items
  cleanupCache() {
    try {
      // Clean localStorage cache
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cacheConfig.prefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (!this.isCacheValid(item)) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        }
      });

      // Clean memory cache
      for (const [key, item] of this.memoryCache.entries()) {
        if (Date.now() - item.timestamp > 30 * 60 * 1000) { // 30 minutes
          this.memoryCache.delete(key);
        }
      }

      // Clean resource cache
      for (const [key, item] of this.resourceCache.entries()) {
        if (!this.isCacheValid(item)) {
          this.resourceCache.delete(key);
        }
      }

    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  // Optimize existing content
  optimizeExistingContent() {
    // Optimize CSS delivery
    this.optimizeCSSDelivery();
    
    // Optimize JavaScript execution
    this.optimizeJavaScriptExecution();
    
    // Optimize DOM operations
    this.optimizeDOMOperations();
  }

  // Optimize CSS delivery
  optimizeCSSDelivery() {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    
    stylesheets.forEach(link => {
      // Add preload hint for non-critical CSS
      if (!link.dataset.critical) {
        link.rel = 'preload';
        link.as = 'style';
        link.onload = function() {
          this.rel = 'stylesheet';
        };
      }
    });
  }

  // Optimize JavaScript execution
  optimizeJavaScriptExecution() {
    // Defer non-critical scripts
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
    
    scripts.forEach(script => {
      if (!script.dataset.critical) {
        script.defer = true;
      }
    });
  }

  // Optimize DOM operations
  optimizeDOMOperations() {
    // Batch DOM updates
    this.setupDOMBatching();
    
    // Optimize scroll handlers
    this.optimizeScrollHandlers();
  }

  // Setup DOM batching
  setupDOMBatching() {
    this.domUpdateQueue = [];
    this.domUpdateScheduled = false;

    this.batchDOMUpdate = (updateFn) => {
      this.domUpdateQueue.push(updateFn);
      
      if (!this.domUpdateScheduled) {
        this.domUpdateScheduled = true;
        requestAnimationFrame(() => {
          this.domUpdateQueue.forEach(fn => fn());
          this.domUpdateQueue = [];
          this.domUpdateScheduled = false;
        });
      }
    };
  }

  // Optimize scroll handlers
  optimizeScrollHandlers() {
    let ticking = false;
    
    const optimizedScrollHandler = (callback) => {
      return () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            callback();
            ticking = false;
          });
          ticking = true;
        }
      };
    };

    // Replace existing scroll handlers
    const scrollElements = document.querySelectorAll('[data-scroll-handler]');
    scrollElements.forEach(element => {
      const handler = element.dataset.scrollHandler;
      if (window[handler]) {
        element.addEventListener('scroll', optimizedScrollHandler(window[handler]), { passive: true });
      }
    });
  }

  // Debounce function
  debounce(func, wait, immediate = false) {
    const key = func.toString();
    
    return (...args) => {
      const later = () => {
        this.debounceTimers.delete(key);
        if (!immediate) func.apply(this, args);
      };
      
      const callNow = immediate && !this.debounceTimers.has(key);
      
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }
      
      this.debounceTimers.set(key, setTimeout(later, wait));
      
      if (callNow) func.apply(this, args);
    };
  }

  // Throttle function
  throttle(func, limit) {
    const key = func.toString();
    
    return (...args) => {
      if (!this.throttleTimers.has(key)) {
        func.apply(this, args);
        this.throttleTimers.set(key, setTimeout(() => {
          this.throttleTimers.delete(key);
        }, limit));
      }
    };
  }

  // Start memory monitoring
  startMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.recordMetric('memory', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          timestamp: Date.now()
        });
        
        // Warn if memory usage is high
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          this.handleHighMemoryUsage(usagePercent);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  // Handle high memory usage
  handleHighMemoryUsage(usagePercent) {
    console.warn(`High memory usage detected: ${usagePercent.toFixed(1)}%`);
    
    // Clear caches
    this.cleanupCache();
    
    // Trigger garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Notify error handler
    if (window.errorHandler) {
      window.errorHandler.handleError({
        type: 'performance',
        message: `High memory usage: ${usagePercent.toFixed(1)}%`,
        context: { memoryUsage: usagePercent }
      }, { showToUser: false });
    }
  }

  // Record performance metric
  recordMetric(name, value) {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }
    
    const metrics = this.performanceMetrics.get(name);
    metrics.push({
      value: value,
      timestamp: Date.now()
    });
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  // Analyze page load performance
  analyzePageLoadPerformance(metrics) {
    const issues = [];
    
    if (metrics.totalLoadTime > 3000) {
      issues.push('Slow page load time');
    }
    
    if (metrics.firstContentfulPaint > 1500) {
      issues.push('Slow first contentful paint');
    }
    
    if (metrics.domContentLoaded > 2000) {
      issues.push('Slow DOM content loaded');
    }
    
    if (issues.length > 0) {
      console.warn('Performance issues detected:', issues);
    }
  }

  // Analyze resource performance
  analyzeResourcePerformance(entry) {
    if (entry.duration > 1000) {
      console.warn(`Slow resource loading: ${entry.name} took ${entry.duration}ms`);
    }
    
    if (entry.transferSize > 1024 * 1024) { // 1MB
      console.warn(`Large resource: ${entry.name} is ${(entry.transferSize / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  // Measure interaction performance
  measureInteractionPerformance(event) {
    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric('interaction', {
        type: event.type,
        duration: duration,
        target: event.target.tagName
      });
      
      if (duration > 16) { // More than one frame at 60fps
        console.warn(`Slow interaction: ${event.type} took ${duration.toFixed(2)}ms`);
      }
    });
  }

  // Get performance report
  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: {},
      recommendations: []
    };

    // Compile metrics
    for (const [name, values] of this.performanceMetrics.entries()) {
      if (values.length > 0) {
        const latest = values[values.length - 1];
        const average = values.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0) / values.length;
        
        report.metrics[name] = {
          latest: latest.value,
          average: average,
          count: values.length
        };
      }
    }

    // Generate recommendations
    report.recommendations = this.generatePerformanceRecommendations(report.metrics);

    return report;
  }

  // Generate performance recommendations
  generatePerformanceRecommendations(metrics) {
    const recommendations = [];

    if (metrics.pageLoad && metrics.pageLoad.latest.totalLoadTime > 3000) {
      recommendations.push('Consider optimizing images and reducing resource sizes');
    }

    if (metrics.memory && metrics.memory.latest.used > metrics.memory.latest.limit * 0.8) {
      recommendations.push('High memory usage detected - consider clearing caches');
    }

    if (metrics.lazyLoad && metrics.lazyLoad.average > 100) {
      recommendations.push('Lazy loading is slow - check image sizes and network');
    }

    return recommendations;
  }

  // Check if in development mode
  isDevelopment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
  }

  // Load component (placeholder implementation)
  loadComponent(componentName, element) {
    // This would load actual components in a real implementation
    element.innerHTML = `<div class="component-${componentName}">Component ${componentName} loaded</div>`;
  }

  // Handle custom measure
  handleCustomMeasure(entry) {
    this.recordMetric('customMeasure', {
      name: entry.name,
      duration: entry.duration
    });
  }

  // Handle resource entry
  handleResourceEntry(entry) {
    this.recordMetric('resource', {
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize
    });
  }

  // Handle paint entry
  handlePaintEntry(entry) {
    this.recordMetric('paint', {
      name: entry.name,
      startTime: entry.startTime
    });
  }

  // Load all lazy elements (fallback)
  loadAllLazyElements() {
    const lazyElements = document.querySelectorAll('[data-lazy-src], [data-lazy-load]');
    lazyElements.forEach(element => {
      this.loadLazyElement(element);
    });
  }
}

// Initialize global performance optimizer
window.performanceOptimizer = new PerformanceOptimizer();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizer;
}