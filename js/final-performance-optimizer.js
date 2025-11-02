// Final Performance Optimizer - Production-ready optimizations
class FinalPerformanceOptimizer {
  constructor() {
    this.optimizationConfig = {
      minifyCSS: true,
      minifyJS: true,
      optimizeImages: true,
      enableCaching: true,
      enableCompression: true,
      enableLazyLoading: true,
      enablePreloading: true,
      enableServiceWorker: false, // Disabled for now
      performanceMonitoring: true
    };
    
    this.performanceMetrics = new Map();
    this.optimizedAssets = new Set();
    this.criticalResources = new Set();
    
    this.initializeOptimizations();
  }

  // Initialize all performance optimizations
  initializeOptimizations() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.runOptimizations();
      });
    } else {
      this.runOptimizations();
    }
  }

  // Run all optimization procedures
  runOptimizations() {
    console.log('🚀 Starting final performance optimizations...');
    
    // CSS Optimizations
    this.optimizeCSS();
    
    // JavaScript Optimizations
    this.optimizeJavaScript();
    
    // Image Optimizations
    this.optimizeImages();
    
    // Caching Optimizations
    this.setupAdvancedCaching();
    
    // Preloading Optimizations
    this.setupResourcePreloading();
    
    // Lazy Loading Optimizations
    this.enhanceLazyLoading();
    
    // Performance Monitoring
    this.setupPerformanceMonitoring();
    
    // Bundle Analysis
    this.analyzeBundleSize();
    
    console.log('✅ Performance optimizations completed');
  }

  // Optimize CSS delivery and minification
  optimizeCSS() {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    
    stylesheets.forEach((link, index) => {
      // Mark critical CSS
      if (index < 2) { // First 2 stylesheets are critical
        link.dataset.critical = 'true';
        this.criticalResources.add(link.href);
      } else {
        // Defer non-critical CSS
        this.deferCSS(link);
      }
      
      // Add preload hints for faster loading
      this.addPreloadHint(link.href, 'style');
    });

    // Inline critical CSS for faster rendering
    this.inlineCriticalCSS();
    
    // Remove unused CSS (basic implementation)
    this.removeUnusedCSS();
  }

  // Defer non-critical CSS loading
  deferCSS(link) {
    const href = link.href;
    link.media = 'print';
    link.onload = function() {
      this.media = 'all';
    };
    
    // Fallback for browsers that don't support onload
    setTimeout(() => {
      if (link.media === 'print') {
        link.media = 'all';
      }
    }, 3000);
  }

  // Inline critical CSS
  inlineCriticalCSS() {
    // Define critical CSS that should be inlined
    const criticalCSS = `
      /* Critical above-the-fold styles */
      body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
      .loading-spinner { 
        display: inline-block; width: 20px; height: 20px;
        border: 2px solid rgba(255,255,255,0.3); border-radius: 50%;
        border-top-color: #fff; animation: spin 1s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .glass-card { 
        background: rgba(255,255,255,0.05); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
      }
    `;

    // Check if critical CSS is already inlined
    if (!document.getElementById('critical-css')) {
      const style = document.createElement('style');
      style.id = 'critical-css';
      style.textContent = criticalCSS;
      document.head.insertBefore(style, document.head.firstChild);
    }
  }

  // Remove unused CSS (basic implementation)
  removeUnusedCSS() {
    // This is a simplified version - in production, use tools like PurgeCSS
    const unusedSelectors = [
      '.unused-class',
      '.old-component',
      '.deprecated-style'
    ];

    const stylesheets = document.styleSheets;
    for (let i = 0; i < stylesheets.length; i++) {
      try {
        const rules = stylesheets[i].cssRules || stylesheets[i].rules;
        if (rules) {
          for (let j = rules.length - 1; j >= 0; j--) {
            const rule = rules[j];
            if (rule.selectorText && unusedSelectors.some(selector => 
              rule.selectorText.includes(selector))) {
              stylesheets[i].deleteRule(j);
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets can't be accessed
        console.warn('Cannot access stylesheet:', stylesheets[i].href);
      }
    }
  }

  // Optimize JavaScript execution
  optimizeJavaScript() {
    // Defer non-critical scripts
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
    
    scripts.forEach(script => {
      if (!script.dataset.critical) {
        script.defer = true;
      }
    });

    // Minify inline scripts (basic implementation)
    this.minifyInlineScripts();
    
    // Setup code splitting for large modules
    this.setupCodeSplitting();
    
    // Optimize event listeners
    this.optimizeEventListeners();
  }

  // Minify inline scripts
  minifyInlineScripts() {
    const inlineScripts = document.querySelectorAll('script:not([src])');
    
    inlineScripts.forEach(script => {
      if (script.textContent && !script.dataset.minified) {
        // Basic minification - remove comments and extra whitespace
        let minified = script.textContent
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
          .replace(/\/\/.*$/gm, '') // Remove line comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .trim();
        
        script.textContent = minified;
        script.dataset.minified = 'true';
      }
    });
  }

  // Setup code splitting for better performance
  setupCodeSplitting() {
    // Dynamic import wrapper for lazy loading modules
    window.loadModule = async (modulePath) => {
      try {
        const module = await import(modulePath);
        return module;
      } catch (error) {
        console.error('Failed to load module:', modulePath, error);
        throw error;
      }
    };

    // Preload critical modules
    const criticalModules = [
      './js/profile-manager.js',
      './js/error-handler.js'
    ];

    criticalModules.forEach(module => {
      this.addPreloadHint(module, 'script');
    });
  }

  // Optimize event listeners for better performance
  optimizeEventListeners() {
    // Replace multiple event listeners with event delegation
    this.setupEventDelegation();
    
    // Add passive listeners for better scroll performance
    this.setupPassiveListeners();
    
    // Debounce resize and scroll events
    this.setupDebouncedEvents();
  }

  // Setup event delegation for better performance
  setupEventDelegation() {
    // Delegate click events
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      // Handle button clicks
      if (target.matches('button[data-action]')) {
        const action = target.dataset.action;
        this.handleButtonAction(action, target, event);
      }
      
      // Handle link clicks
      if (target.matches('a[data-track]')) {
        this.trackLinkClick(target);
      }
    }, { passive: true });
  }

  // Setup passive listeners
  setupPassiveListeners() {
    const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel'];
    
    passiveEvents.forEach(eventType => {
      // Remove existing non-passive listeners and add passive ones
      document.addEventListener(eventType, (event) => {
        // Handle passive events
        this.handlePassiveEvent(eventType, event);
      }, { passive: true });
    });
  }

  // Setup debounced events
  setupDebouncedEvents() {
    let resizeTimeout;
    let scrollTimeout;

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.handleScroll();
      }, 16); // ~60fps
    }, { passive: true });
  }

  // Optimize images for better performance
  optimizeImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      this.optimizeImage(img);
    });

    // Setup responsive images
    this.setupResponsiveImages();
    
    // Setup image lazy loading
    this.setupImageLazyLoading();
    
    // Preload critical images
    this.preloadCriticalImages();
  }

  // Optimize individual image
  optimizeImage(img) {
    // Add loading attribute for native lazy loading
    if (!img.loading && 'loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy';
    }

    // Add decoding attribute for better performance
    if (!img.decoding) {
      img.decoding = 'async';
    }

    // Optimize image format based on browser support
    this.optimizeImageFormat(img);
    
    // Add error handling
    if (!img.onerror) {
      img.onerror = () => this.handleImageError(img);
    }

    // Add load tracking
    if (!img.onload) {
      img.onload = () => this.trackImageLoad(img);
    }
  }

  // Optimize image format based on browser support
  optimizeImageFormat(img) {
    const src = img.src;
    if (!src || src.startsWith('data:')) return;

    // Check for WebP support
    if (this.supportsWebP() && !src.includes('.webp')) {
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      
      // Test if WebP version exists
      const testImg = new Image();
      testImg.onload = () => {
        img.src = webpSrc;
      };
      testImg.onerror = () => {
        // Keep original format
      };
      testImg.src = webpSrc;
    }
  }

  // Check WebP support
  supportsWebP() {
    if (this._webpSupport !== undefined) {
      return this._webpSupport;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    this._webpSupport = canvas.toDataURL('image/webp').indexOf('webp') !== -1;
    return this._webpSupport;
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
      large: 1024,
      xlarge: 1440
    };

    const updateImageSrc = () => {
      const width = window.innerWidth;
      const dpr = window.devicePixelRatio || 1;
      
      let size = 'xlarge';
      if (width <= breakpoints.small) size = 'small';
      else if (width <= breakpoints.medium) size = 'medium';
      else if (width <= breakpoints.large) size = 'large';
      
      const targetWidth = Math.ceil(breakpoints[size] * dpr);
      const baseSrc = img.dataset.responsive;
      const newSrc = `${baseSrc}?w=${targetWidth}&q=80`;
      
      if (img.src !== newSrc) {
        img.src = newSrc;
      }
    };

    updateImageSrc();
    
    // Throttled resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateImageSrc, 250);
    });
  }

  // Setup advanced image lazy loading
  setupImageLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadLazyImage(img);
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      const lazyImages = document.querySelectorAll('img[data-lazy-src]');
      lazyImages.forEach(img => imageObserver.observe(img));
    }
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
      this.handleImageError(img);
    };

    img.classList.add('loading');
    optimizedImg.src = src;
  }

  // Preload critical images
  preloadCriticalImages() {
    const criticalImages = [
      'image/logo.png',
      'image/DP1.png',
      'image/DP2.png'
    ];

    criticalImages.forEach(src => {
      this.addPreloadHint(src, 'image');
    });
  }

  // Setup advanced caching strategies
  setupAdvancedCaching() {
    // Setup cache headers for static assets
    this.setupCacheHeaders();
    
    // Setup localStorage caching for API responses
    this.setupLocalStorageCache();
    
    // Setup memory caching for frequently accessed data
    this.setupMemoryCache();
    
    // Setup cache invalidation
    this.setupCacheInvalidation();
  }

  // Setup cache headers (for server configuration reference)
  setupCacheHeaders() {
    // This would typically be done on the server, but we can provide guidance
    const cacheConfig = {
      'text/css': 'max-age=31536000', // 1 year for CSS
      'application/javascript': 'max-age=31536000', // 1 year for JS
      'image/*': 'max-age=2592000', // 30 days for images
      'text/html': 'max-age=3600' // 1 hour for HTML
    };

    // Store cache configuration for reference
    window.cacheConfig = cacheConfig;
  }

  // Setup localStorage caching
  setupLocalStorageCache() {
    const cacheManager = {
      set: (key, data, ttl = 3600000) => { // 1 hour default
        const item = {
          data: data,
          timestamp: Date.now(),
          ttl: ttl
        };
        try {
          localStorage.setItem(`cache_${key}`, JSON.stringify(item));
        } catch (e) {
          console.warn('Cache storage failed:', e);
        }
      },
      
      get: (key) => {
        try {
          const item = JSON.parse(localStorage.getItem(`cache_${key}`));
          if (item && Date.now() - item.timestamp < item.ttl) {
            return item.data;
          }
          localStorage.removeItem(`cache_${key}`);
        } catch (e) {
          console.warn('Cache retrieval failed:', e);
        }
        return null;
      },
      
      clear: () => {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('cache_')) {
            localStorage.removeItem(key);
          }
        });
      }
    };

    window.cacheManager = cacheManager;
  }

  // Setup memory cache
  setupMemoryCache() {
    const memoryCache = new Map();
    const maxSize = 100;

    window.memoryCache = {
      set: (key, value) => {
        if (memoryCache.size >= maxSize) {
          const firstKey = memoryCache.keys().next().value;
          memoryCache.delete(firstKey);
        }
        memoryCache.set(key, {
          value: value,
          timestamp: Date.now(),
          accessCount: 1
        });
      },
      
      get: (key) => {
        const item = memoryCache.get(key);
        if (item) {
          item.accessCount++;
          return item.value;
        }
        return null;
      },
      
      clear: () => {
        memoryCache.clear();
      }
    };
  }

  // Setup cache invalidation
  setupCacheInvalidation() {
    // Clear expired cache items periodically
    setInterval(() => {
      this.clearExpiredCache();
    }, 300000); // Every 5 minutes

    // Clear cache on page unload
    window.addEventListener('beforeunload', () => {
      this.clearExpiredCache();
    });
  }

  // Clear expired cache items
  clearExpiredCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (Date.now() - item.timestamp >= item.ttl) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    });
  }

  // Setup resource preloading
  setupResourcePreloading() {
    // Preload critical resources
    const criticalResources = [
      { href: './js/profile-manager.js', as: 'script' },
      { href: './js/error-handler.js', as: 'script' },
      { href: './styles/unified-theme.css', as: 'style' },
      { href: './image/logo.png', as: 'image' }
    ];

    criticalResources.forEach(resource => {
      this.addPreloadHint(resource.href, resource.as);
    });

    // Setup prefetch for likely next pages
    this.setupPrefetching();
  }

  // Add preload hint
  addPreloadHint(href, as) {
    if (document.querySelector(`link[href="${href}"][rel="preload"]`)) {
      return; // Already exists
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (as === 'style') {
      link.onload = function() {
        this.rel = 'stylesheet';
      };
    }
    
    document.head.appendChild(link);
  }

  // Setup prefetching for likely next pages
  setupPrefetching() {
    const prefetchPages = [
      './mcq.html',
      './flashcards.html',
      './notes.html',
      './profile.html'
    ];

    // Prefetch on hover or after initial load
    setTimeout(() => {
      prefetchPages.forEach(page => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = page;
        document.head.appendChild(link);
      });
    }, 2000);
  }

  // Enhance lazy loading for all content
  enhanceLazyLoading() {
    // Setup intersection observer for all lazy content
    if ('IntersectionObserver' in window) {
      const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadLazyContent(entry.target);
            lazyObserver.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '100px 0px',
        threshold: 0.01
      });

      // Observe all lazy elements
      const lazyElements = document.querySelectorAll('[data-lazy-load]');
      lazyElements.forEach(element => lazyObserver.observe(element));
    }
  }

  // Load lazy content
  loadLazyContent(element) {
    const lazyType = element.dataset.lazyLoad;
    
    switch (lazyType) {
      case 'component':
        this.loadLazyComponent(element);
        break;
      case 'iframe':
        this.loadLazyIframe(element);
        break;
      case 'script':
        this.loadLazyScript(element);
        break;
      default:
        console.warn('Unknown lazy load type:', lazyType);
    }
  }

  // Load lazy component
  loadLazyComponent(element) {
    const componentName = element.dataset.component;
    element.innerHTML = '<div class="loading-spinner"></div>';
    
    // Simulate component loading
    setTimeout(() => {
      element.innerHTML = `<div class="component-${componentName}">Component loaded</div>`;
      element.classList.add('loaded');
    }, 100);
  }

  // Load lazy iframe
  loadLazyIframe(element) {
    const src = element.dataset.src;
    if (src) {
      element.src = src;
      element.classList.add('loaded');
    }
  }

  // Load lazy script
  loadLazyScript(element) {
    const src = element.dataset.src;
    if (src) {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        element.classList.add('loaded');
      };
      document.head.appendChild(script);
    }
  }

  // Setup comprehensive performance monitoring
  setupPerformanceMonitoring() {
    // Core Web Vitals monitoring
    this.monitorCoreWebVitals();
    
    // Resource loading monitoring
    this.monitorResourceLoading();
    
    // User interaction monitoring
    this.monitorUserInteractions();
    
    // Memory usage monitoring
    this.monitorMemoryUsage();
    
    // Network monitoring
    this.monitorNetworkConditions();
  }

  // Monitor Core Web Vitals
  monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP monitoring not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID monitoring not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.recordMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS monitoring not supported');
      }
    }
  }

  // Monitor resource loading
  monitorResourceLoading() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.analyzeResourcePerformance(entry);
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  // Monitor user interactions
  monitorUserInteractions() {
    const interactionEvents = ['click', 'scroll', 'keydown'];
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.measureInteractionPerformance(event);
      }, { passive: true });
    });
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.recordMetric('memory', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
      }, 30000); // Every 30 seconds
    }
  }

  // Monitor network conditions
  monitorNetworkConditions() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.recordMetric('network', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });

      connection.addEventListener('change', () => {
        this.recordMetric('networkChange', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }
  }

  // Analyze bundle size and suggest optimizations
  analyzeBundleSize() {
    const scripts = document.querySelectorAll('script[src]');
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    
    let totalJSSize = 0;
    let totalCSSSize = 0;

    // Estimate sizes (in production, use actual file sizes)
    scripts.forEach(script => {
      // Estimate based on file name or use actual size if available
      totalJSSize += this.estimateFileSize(script.src);
    });

    stylesheets.forEach(link => {
      totalCSSSize += this.estimateFileSize(link.href);
    });

    const bundleAnalysis = {
      totalJSSize: totalJSSize,
      totalCSSSize: totalCSSSize,
      totalSize: totalJSSize + totalCSSSize,
      recommendations: this.generateBundleRecommendations(totalJSSize, totalCSSSize)
    };

    this.recordMetric('bundleAnalysis', bundleAnalysis);
    console.log('📊 Bundle Analysis:', bundleAnalysis);
  }

  // Estimate file size (placeholder implementation)
  estimateFileSize(url) {
    // In production, this would fetch actual file sizes
    const fileName = url.split('/').pop();
    
    // Rough estimates based on file names
    if (fileName.includes('min')) return 50000; // 50KB for minified files
    if (fileName.includes('vendor') || fileName.includes('lib')) return 200000; // 200KB for vendor files
    return 100000; // 100KB default estimate
  }

  // Generate bundle optimization recommendations
  generateBundleRecommendations(jsSize, cssSize) {
    const recommendations = [];
    
    if (jsSize > 500000) { // 500KB
      recommendations.push('Consider code splitting for JavaScript bundles');
    }
    
    if (cssSize > 200000) { // 200KB
      recommendations.push('Consider removing unused CSS');
    }
    
    if (jsSize + cssSize > 1000000) { // 1MB total
      recommendations.push('Consider implementing lazy loading for non-critical resources');
    }

    return recommendations;
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
    
    // Keep only last 50 measurements
    if (metrics.length > 50) {
      metrics.splice(0, metrics.length - 50);
    }
  }

  // Analyze resource performance
  analyzeResourcePerformance(entry) {
    if (entry.duration > 1000) {
      console.warn(`⚠️ Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
    }
    
    if (entry.transferSize > 1024 * 1024) { // 1MB
      console.warn(`⚠️ Large resource: ${entry.name} is ${(entry.transferSize / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  // Measure interaction performance
  measureInteractionPerformance(event) {
    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16) { // More than one frame at 60fps
        console.warn(`⚠️ Slow interaction: ${event.type} took ${duration.toFixed(2)}ms`);
      }
      
      this.recordMetric('interaction', {
        type: event.type,
        duration: duration
      });
    });
  }

  // Handle various events
  handleButtonAction(action, button, event) {
    // Handle button actions with performance tracking
    const startTime = performance.now();
    
    // Process action
    switch (action) {
      case 'save':
        this.handleSaveAction(button);
        break;
      case 'load':
        this.handleLoadAction(button);
        break;
      default:
        console.warn('Unknown button action:', action);
    }
    
    const duration = performance.now() - startTime;
    this.recordMetric('buttonAction', { action, duration });
  }

  handleSaveAction(button) {
    // Implement save action
    console.log('Save action triggered');
  }

  handleLoadAction(button) {
    // Implement load action
    console.log('Load action triggered');
  }

  trackLinkClick(link) {
    // Track link clicks for analytics
    this.recordMetric('linkClick', {
      href: link.href,
      text: link.textContent
    });
  }

  handlePassiveEvent(eventType, event) {
    // Handle passive events efficiently
    this.recordMetric('passiveEvent', { type: eventType });
  }

  handleResize() {
    // Handle window resize efficiently
    this.recordMetric('resize', {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  handleScroll() {
    // Handle scroll events efficiently
    this.recordMetric('scroll', {
      scrollY: window.scrollY,
      scrollX: window.scrollX
    });
  }

  handleImageError(img) {
    console.warn('Image failed to load:', img.src);
    
    // Try fallback image
    if (img.dataset.fallback && img.src !== img.dataset.fallback) {
      img.src = img.dataset.fallback;
      return;
    }
    
    // Use placeholder
    img.style.display = 'none';
  }

  trackImageLoad(img) {
    this.recordMetric('imageLoad', {
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    });
  }

  // Get comprehensive performance report
  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: {},
      recommendations: [],
      coreWebVitals: {},
      resourceAnalysis: {}
    };

    // Compile all metrics
    for (const [name, values] of this.performanceMetrics.entries()) {
      if (values.length > 0) {
        const latest = values[values.length - 1];
        const average = values.reduce((sum, item) => {
          const val = typeof item.value === 'number' ? item.value : 0;
          return sum + val;
        }, 0) / values.length;
        
        report.metrics[name] = {
          latest: latest.value,
          average: average,
          count: values.length
        };
      }
    }

    // Extract Core Web Vitals
    if (report.metrics.LCP) report.coreWebVitals.LCP = report.metrics.LCP.latest;
    if (report.metrics.FID) report.coreWebVitals.FID = report.metrics.FID.latest;
    if (report.metrics.CLS) report.coreWebVitals.CLS = report.metrics.CLS.latest;

    // Generate recommendations
    report.recommendations = this.generatePerformanceRecommendations(report);

    return report;
  }

  // Generate performance recommendations
  generatePerformanceRecommendations(report) {
    const recommendations = [];
    
    // Core Web Vitals recommendations
    if (report.coreWebVitals.LCP > 2500) {
      recommendations.push('Improve Largest Contentful Paint by optimizing images and critical resources');
    }
    
    if (report.coreWebVitals.FID > 100) {
      recommendations.push('Reduce First Input Delay by optimizing JavaScript execution');
    }
    
    if (report.coreWebVitals.CLS > 0.1) {
      recommendations.push('Improve Cumulative Layout Shift by setting image dimensions and avoiding dynamic content');
    }

    // Memory recommendations
    if (report.metrics.memory && report.metrics.memory.latest.used > report.metrics.memory.latest.limit * 0.8) {
      recommendations.push('High memory usage detected - consider optimizing data structures and clearing unused references');
    }

    // Bundle size recommendations
    if (report.metrics.bundleAnalysis) {
      recommendations.push(...report.metrics.bundleAnalysis.latest.recommendations);
    }

    return recommendations;
  }

  // Export performance data
  exportPerformanceData() {
    const report = this.getPerformanceReport();
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `performance-report-${Date.now()}.json`;
    link.click();
  }
}

// Initialize final performance optimizer
window.finalPerformanceOptimizer = new FinalPerformanceOptimizer();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinalPerformanceOptimizer;
}