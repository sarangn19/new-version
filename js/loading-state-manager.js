// LoadingStateManager - Consistent loading indicators and progress management
class LoadingStateManager {
  constructor() {
    this.activeLoaders = new Map();
    this.loadingStates = new Map();
    this.progressBars = new Map();
    this.skeletonLoaders = new Map();
    this.defaultConfig = {
      showDelay: 200, // Delay before showing loader to avoid flashing
      minDuration: 500, // Minimum duration to show loader
      timeout: 30000, // Maximum loading time before timeout
      showProgress: true,
      showSkeleton: false,
      showSpinner: true
    };
    
    this.initializeLoadingStyles();
    this.setupGlobalLoadingHandlers();
  }

  // Initialize loading styles
  initializeLoadingStyles() {
    if (!document.getElementById('loading-styles')) {
      const styles = document.createElement('style');
      styles.id = 'loading-styles';
      styles.textContent = `
        /* Loading Spinner Styles */
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }

        .loading-spinner.large {
          width: 40px;
          height: 40px;
          border-width: 4px;
        }

        .loading-spinner.small {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Loading Overlay Styles */
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .loading-overlay.fullscreen {
          position: fixed;
          z-index: 9999;
        }

        /* Progress Bar Styles */
        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
          border-radius: 2px;
          transition: width 0.3s ease;
          position: relative;
        }

        .progress-bar-indeterminate .progress-bar-fill {
          width: 30%;
          animation: progress-indeterminate 2s infinite;
        }

        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        /* Skeleton Loading Styles */
        .skeleton {
          background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }

        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .skeleton-text {
          height: 1em;
          margin-bottom: 0.5em;
        }

        .skeleton-text:last-child {
          margin-bottom: 0;
          width: 60%;
        }

        .skeleton-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .skeleton-button {
          height: 36px;
          width: 100px;
          border-radius: 6px;
        }

        .skeleton-card {
          height: 200px;
          border-radius: 8px;
        }

        /* Loading Button States */
        .btn-loading {
          position: relative;
          pointer-events: none;
          opacity: 0.7;
        }

        .btn-loading .btn-text {
          opacity: 0;
        }

        .btn-loading::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s linear infinite;
        }

        /* Fade transitions */
        .loading-fade-enter {
          opacity: 0;
          transform: translateY(10px);
        }

        .loading-fade-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .loading-fade-exit {
          opacity: 1;
          transform: translateY(0);
        }

        .loading-fade-exit-active {
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // Setup global loading handlers
  setupGlobalLoadingHandlers() {
    // Handle form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM' && !form.dataset.noLoading) {
        this.showFormLoading(form);
      }
    });

    // Handle button clicks with data-loading attribute
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-loading]');
      if (button) {
        this.showButtonLoading(button);
      }
    });

    // Handle AJAX requests (if using fetch)
    this.interceptFetchRequests();
  }

  // Intercept fetch requests for automatic loading states
  interceptFetchRequests() {
    const originalFetch = window.fetch;
    
    window.fetch = (...args) => {
      const url = args[0];
      const options = args[1] || {};
      
      // Skip if loading is disabled for this request
      if (options.noLoading) {
        return originalFetch.apply(this, args);
      }

      // Generate loading ID based on URL
      const loadingId = `fetch_${this.generateId()}`;
      
      // Show loading state
      this.showLoading(loadingId, {
        message: 'Loading...',
        showProgress: true
      });

      return originalFetch.apply(this, args)
        .then(response => {
          this.hideLoading(loadingId);
          return response;
        })
        .catch(error => {
          this.hideLoading(loadingId);
          throw error;
        });
    };
  }

  // Show loading state
  showLoading(id, options = {}) {
    const config = { ...this.defaultConfig, ...options };
    
    // Clear any existing timeout for this ID
    if (this.activeLoaders.has(id)) {
      this.hideLoading(id);
    }

    const loadingState = {
      id: id,
      config: config,
      startTime: Date.now(),
      showTimeout: null,
      hideTimeout: null,
      element: null,
      progressElement: null
    };

    // Delay showing the loader to avoid flashing for quick operations
    loadingState.showTimeout = setTimeout(() => {
      this.displayLoading(loadingState);
    }, config.showDelay);

    // Set timeout for maximum loading duration
    if (config.timeout > 0) {
      loadingState.hideTimeout = setTimeout(() => {
        this.hideLoading(id, true);
      }, config.timeout);
    }

    this.activeLoaders.set(id, loadingState);
    return id;
  }

  // Display loading UI
  displayLoading(loadingState) {
    const { id, config } = loadingState;
    
    // Create loading element based on target
    if (config.target) {
      loadingState.element = this.createTargetedLoader(config.target, config);
    } else {
      loadingState.element = this.createGlobalLoader(config);
    }

    // Create progress bar if needed
    if (config.showProgress) {
      loadingState.progressElement = this.createProgressBar(id, config);
    }

    // Store the state
    this.loadingStates.set(id, loadingState);

    // Dispatch loading start event
    this.dispatchLoadingEvent('loadingStart', { id, config });
  }

  // Create targeted loader for specific element
  createTargetedLoader(target, config) {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    
    if (!targetElement) {
      console.warn('Loading target element not found:', target);
      return this.createGlobalLoader(config);
    }

    // Make target relative if not already positioned
    const computedStyle = window.getComputedStyle(targetElement);
    if (computedStyle.position === 'static') {
      targetElement.style.position = 'relative';
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    
    if (config.showSkeleton) {
      overlay.appendChild(this.createSkeletonLoader(config));
    } else {
      overlay.appendChild(this.createSpinnerLoader(config));
    }

    targetElement.appendChild(overlay);
    
    // Add fade-in animation
    requestAnimationFrame(() => {
      overlay.classList.add('loading-fade-enter-active');
    });

    return overlay;
  }

  // Create global loader
  createGlobalLoader(config) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay fullscreen';
    
    const container = document.createElement('div');
    container.className = 'text-center text-white';
    
    if (config.showSkeleton) {
      container.appendChild(this.createSkeletonLoader(config));
    } else {
      container.appendChild(this.createSpinnerLoader(config));
    }

    if (config.message) {
      const message = document.createElement('div');
      message.className = 'mt-4 text-sm';
      message.textContent = config.message;
      container.appendChild(message);
    }

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Add fade-in animation
    requestAnimationFrame(() => {
      overlay.classList.add('loading-fade-enter-active');
    });

    return overlay;
  }

  // Create spinner loader
  createSpinnerLoader(config) {
    const spinner = document.createElement('div');
    spinner.className = `loading-spinner ${config.size || 'medium'}`;
    return spinner;
  }

  // Create skeleton loader
  createSkeletonLoader(config) {
    const container = document.createElement('div');
    container.className = 'skeleton-container';

    const skeletonType = config.skeletonType || 'text';
    
    switch (skeletonType) {
      case 'text':
        for (let i = 0; i < (config.skeletonLines || 3); i++) {
          const line = document.createElement('div');
          line.className = 'skeleton skeleton-text';
          container.appendChild(line);
        }
        break;
        
      case 'card':
        const card = document.createElement('div');
        card.className = 'skeleton skeleton-card';
        container.appendChild(card);
        break;
        
      case 'avatar':
        const avatar = document.createElement('div');
        avatar.className = 'skeleton skeleton-avatar';
        container.appendChild(avatar);
        break;
        
      default:
        // Custom skeleton HTML
        if (config.skeletonHTML) {
          container.innerHTML = config.skeletonHTML;
          container.querySelectorAll('.skeleton').forEach(el => {
            el.classList.add('skeleton');
          });
        }
    }

    return container;
  }

  // Create progress bar
  createProgressBar(id, config) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-bar-container fixed top-0 left-0 right-0 z-50';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-bar-fill';
    progressFill.style.width = '0%';
    
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);
    
    // Add to page
    document.body.appendChild(progressContainer);
    
    // Store reference
    this.progressBars.set(id, {
      container: progressContainer,
      fill: progressFill,
      progress: 0
    });

    // Start indeterminate animation if no specific progress
    if (!config.determinate) {
      progressBar.classList.add('progress-bar-indeterminate');
    }

    return progressContainer;
  }

  // Update progress
  updateProgress(id, progress) {
    const progressBar = this.progressBars.get(id);
    if (progressBar) {
      progress = Math.max(0, Math.min(100, progress));
      progressBar.progress = progress;
      progressBar.fill.style.width = `${progress}%`;
      
      // Remove indeterminate class if progress is set
      const container = progressBar.container.querySelector('.progress-bar');
      if (container) {
        container.classList.remove('progress-bar-indeterminate');
      }
    }
  }

  // Hide loading state
  hideLoading(id, isTimeout = false) {
    const loadingState = this.activeLoaders.get(id);
    
    if (!loadingState) {
      return;
    }

    // Clear timeouts
    if (loadingState.showTimeout) {
      clearTimeout(loadingState.showTimeout);
    }
    if (loadingState.hideTimeout) {
      clearTimeout(loadingState.hideTimeout);
    }

    // Ensure minimum duration has passed
    const elapsed = Date.now() - loadingState.startTime;
    const minDuration = loadingState.config.minDuration;
    
    if (elapsed < minDuration && !isTimeout) {
      setTimeout(() => {
        this.hideLoading(id, false);
      }, minDuration - elapsed);
      return;
    }

    // Remove loading UI
    this.removeLoadingUI(loadingState);

    // Clean up
    this.activeLoaders.delete(id);
    this.loadingStates.delete(id);
    this.progressBars.delete(id);

    // Dispatch loading end event
    this.dispatchLoadingEvent('loadingEnd', { id, isTimeout });
  }

  // Remove loading UI with animation
  removeLoadingUI(loadingState) {
    const { element, progressElement } = loadingState;

    // Remove main loading element
    if (element) {
      element.classList.add('loading-fade-exit-active');
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 300);
    }

    // Remove progress bar
    if (progressElement) {
      progressElement.style.opacity = '0';
      setTimeout(() => {
        if (progressElement.parentNode) {
          progressElement.parentNode.removeChild(progressElement);
        }
      }, 300);
    }
  }

  // Show button loading state
  showButtonLoading(button) {
    if (button.classList.contains('btn-loading')) {
      return;
    }

    // Store original text
    const originalText = button.textContent;
    button.dataset.originalText = originalText;
    
    // Add loading class
    button.classList.add('btn-loading');
    button.disabled = true;

    // Update text if specified
    const loadingText = button.dataset.loadingText;
    if (loadingText) {
      button.innerHTML = `<span class="btn-text">${loadingText}</span>`;
    }

    return button;
  }

  // Hide button loading state
  hideButtonLoading(button) {
    if (!button.classList.contains('btn-loading')) {
      return;
    }

    button.classList.remove('btn-loading');
    button.disabled = false;

    // Restore original text
    const originalText = button.dataset.originalText;
    if (originalText) {
      button.textContent = originalText;
      delete button.dataset.originalText;
    }
  }

  // Show form loading state
  showFormLoading(form) {
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) {
      this.showButtonLoading(submitButton);
    }

    // Disable all form inputs
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
      input.disabled = true;
      input.dataset.wasDisabled = input.disabled;
    });

    form.classList.add('form-loading');
  }

  // Hide form loading state
  hideFormLoading(form) {
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) {
      this.hideButtonLoading(submitButton);
    }

    // Re-enable form inputs
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
      if (!input.dataset.wasDisabled) {
        input.disabled = false;
      }
      delete input.dataset.wasDisabled;
    });

    form.classList.remove('form-loading');
  }

  // Show loading for async operation
  async withLoading(operation, options = {}) {
    const id = this.generateId();
    
    try {
      this.showLoading(id, options);
      const result = await operation();
      return result;
    } finally {
      this.hideLoading(id);
    }
  }

  // Show loading with progress tracking
  async withProgressLoading(operation, options = {}) {
    const id = this.generateId();
    
    try {
      this.showLoading(id, { ...options, showProgress: true, determinate: true });
      
      // Create progress callback
      const updateProgress = (progress) => {
        this.updateProgress(id, progress);
      };

      const result = await operation(updateProgress);
      return result;
    } finally {
      this.hideLoading(id);
    }
  }

  // Create skeleton loading for specific content
  createContentSkeleton(container, config = {}) {
    const skeletonId = this.generateId();
    
    // Store original content
    const originalContent = container.innerHTML;
    container.dataset.originalContent = originalContent;
    
    // Create skeleton based on content type
    const skeleton = this.generateSkeletonFromContent(container, config);
    container.innerHTML = skeleton;
    container.classList.add('skeleton-loading');

    return {
      id: skeletonId,
      restore: () => {
        container.innerHTML = originalContent;
        container.classList.remove('skeleton-loading');
        delete container.dataset.originalContent;
      }
    };
  }

  // Generate skeleton HTML from existing content
  generateSkeletonFromContent(container, config) {
    const elements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, img, button, .card');
    let skeletonHTML = '';

    elements.forEach(el => {
      const tagName = el.tagName.toLowerCase();
      
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          skeletonHTML += '<div class="skeleton skeleton-text" style="height: 1.5em; margin-bottom: 1em;"></div>';
          break;
        case 'p':
          skeletonHTML += '<div class="skeleton skeleton-text"></div>';
          break;
        case 'img':
          const width = el.offsetWidth || 200;
          const height = el.offsetHeight || 150;
          skeletonHTML += `<div class="skeleton" style="width: ${width}px; height: ${height}px; margin-bottom: 1em;"></div>`;
          break;
        case 'button':
          skeletonHTML += '<div class="skeleton skeleton-button"></div>';
          break;
        default:
          if (el.classList.contains('card')) {
            skeletonHTML += '<div class="skeleton skeleton-card"></div>';
          } else {
            skeletonHTML += '<div class="skeleton skeleton-text"></div>';
          }
      }
    });

    return skeletonHTML || '<div class="skeleton skeleton-text"></div>'.repeat(3);
  }

  // Dispatch loading events
  dispatchLoadingEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  // Generate unique ID
  generateId() {
    return `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get active loading states
  getActiveLoadingStates() {
    return Array.from(this.activeLoaders.keys());
  }

  // Check if loading is active
  isLoading(id = null) {
    if (id) {
      return this.activeLoaders.has(id);
    }
    return this.activeLoaders.size > 0;
  }

  // Hide all loading states
  hideAllLoading() {
    const activeIds = Array.from(this.activeLoaders.keys());
    activeIds.forEach(id => this.hideLoading(id));
  }

  // Set global loading defaults
  setDefaults(newDefaults) {
    this.defaultConfig = { ...this.defaultConfig, ...newDefaults };
  }

  // Create loading wrapper for elements
  wrapWithLoading(element, options = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'loading-wrapper';
    wrapper.style.position = 'relative';
    
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    return {
      showLoading: () => {
        const id = this.generateId();
        this.showLoading(id, { ...options, target: wrapper });
        return id;
      },
      hideLoading: (id) => {
        this.hideLoading(id);
      }
    };
  }
}

// Initialize global loading state manager
window.loadingStateManager = new LoadingStateManager();

// Convenience functions
window.showLoading = (id, options) => window.loadingStateManager.showLoading(id, options);
window.hideLoading = (id) => window.loadingStateManager.hideLoading(id);
window.updateProgress = (id, progress) => window.loadingStateManager.updateProgress(id, progress);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingStateManager;
}