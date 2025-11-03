/**
 * News Display Interface
 * Handles the display, filtering, and interaction with news articles
 * Integrates with NewsIntegrationService for dynamic content
 */
class NewsDisplayInterface {
    constructor(config = {}) {
        this.config = {
            containerId: config.containerId || 'news-container',
            itemsPerPage: config.itemsPerPage || 12,
            autoRefresh: config.autoRefresh !== false,
            refreshInterval: config.refreshInterval || 300000, // 5 minutes
            enableBookmarks: config.enableBookmarks !== false,
            enableSearch: config.enableSearch !== false,
            enableFilters: config.enableFilters !== false,
            ...config
        };
        
        // Services
        this.newsService = null; // Will be set when NewsIntegrationService is available
        this.profileManager = window.ProfileManager ? new ProfileManager() : null;
        
        // State
        this.currentArticles = [];
        this.filteredArticles = [];
        this.currentFilters = {
            query: '',
            categories: [],
            subjects: [],
            dateRange: null,
            relevanceThreshold: 3,
            sortBy: 'relevance'
        };
        this.currentPage = 1;
        this.isLoading = false;
        this.refreshTimer = null;
        
        // UI Elements
        this.container = null;
        this.searchInput = null;
        this.filterControls = null;
        this.sortControls = null;
        this.loadingIndicator = null;
        
        this.initialize();
    }

    /**
     * Initialize the news display interface
     */
    async initialize() {
        try {
            // Find or create container
            this.container = document.getElementById(this.config.containerId);
            if (!this.container) {
                console.warn(`News container ${this.config.containerId} not found`);
                return;
            }
            
            // Initialize UI components
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Connect to news service if available
            if (window.NewsIntegrationService) {
                this.newsService = new NewsIntegrationService();
                await this.newsService.initialize();
                
                // Connect AI service if available
                if (window.AIServiceManager && window.aiServiceManager) {
                    this.newsService.setAIService(window.aiServiceManager);
                }
            }
            
            // Load initial news
            await this.loadNews();
            
            // Start auto-refresh if enabled
            if (this.config.autoRefresh) {
                this.startAutoRefresh();
            }
            
            console.log('News Display Interface initialized successfully');
        } catch (error) {
            console.error('Failed to initialize News Display Interface:', error);
            this.showError('Failed to initialize news interface');
        }
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Create search input if enabled
        if (this.config.enableSearch) {
            this.initializeSearchInput();
        }
        
        // Filter controls disabled
        // if (this.config.enableFilters) {
        //     this.initializeFilterControls();
        // }
        
        // Create sort controls
        this.initializeSortControls();
        
        // Create loading indicator
        this.createLoadingIndicator();
        
        // Create news grid container
        this.createNewsGrid();
    }

    /**
     * Initialize search input
     */
    initializeSearchInput() {
        this.searchInput = document.getElementById('search-input');
        if (this.searchInput) {
            // Add debounced search
            let searchTimeout;
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.query = e.target.value;
                    this.applyFilters();
                }, 300);
            });
        }
    }

    /**
     * Initialize filter controls
     */
    initializeFilterControls() {
        // Create category filter buttons
        this.createCategoryFilters();
        
        // Create relevance filter
        this.createRelevanceFilter();
        
        // Create date range filter
        this.createDateRangeFilter();
    }

    /**
     * Create category filter buttons
     */
    createCategoryFilters() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'flex flex-wrap gap-2 mb-4';
        filterContainer.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
                <span class="text-sm text-white/70">Categories:</span>
            </div>
        `;
        
        const categories = [
            { id: 'polity', name: 'Polity', color: 'yellow' },
            { id: 'economics', name: 'Economics', color: 'green' },
            { id: 'geography', name: 'Geography', color: 'blue' },
            { id: 'history', name: 'History', color: 'purple' },
            { id: 'science', name: 'Science & Tech', color: 'cyan' },
            { id: 'environment', name: 'Environment', color: 'emerald' },
            { id: 'international', name: 'International', color: 'orange' }
        ];
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex flex-wrap gap-2';
        
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = `px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 
                border border-${category.color}-500/30 text-${category.color}-400 
                hover:bg-${category.color}-500/20 hover:border-${category.color}-500/50`;
            button.textContent = category.name;
            button.dataset.category = category.id;
            
            button.addEventListener('click', () => {
                this.toggleCategoryFilter(category.id, button);
            });
            
            buttonContainer.appendChild(button);
        });
        
        filterContainer.appendChild(buttonContainer);
        
        // Insert after search or at the beginning of main content
        const mainContent = document.querySelector('#main-content .max-w-7xl');
        if (mainContent) {
            const searchContainer = mainContent.querySelector('.mb-2');
            if (searchContainer) {
                searchContainer.parentNode.insertBefore(filterContainer, searchContainer.nextSibling);
            } else {
                mainContent.insertBefore(filterContainer, mainContent.firstChild);
            }
        }
    }

    /**
     * Create relevance filter slider
     */
    createRelevanceFilter() {
        // Relevance filter disabled - no UI element created
        console.log('📰 Relevance filter disabled');
    }

    /**
     * Create date range filter
     */
    createDateRangeFilter() {
        const dateContainer = document.createElement('div');
        dateContainer.className = 'flex items-center gap-4 mb-4 p-3 bg-white/5 rounded-lg';
        dateContainer.innerHTML = `
            <span class="text-sm text-white/70">Date Range:</span>
            <select id="date-range-select" class="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white">
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
            </select>
            <div id="custom-date-inputs" class="hidden flex items-center gap-2">
                <input type="date" id="date-from" class="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white">
                <span class="text-white/50">to</span>
                <input type="date" id="date-to" class="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white">
            </div>
        `;
        
        const select = dateContainer.querySelector('#date-range-select');
        const customInputs = dateContainer.querySelector('#custom-date-inputs');
        const dateFrom = dateContainer.querySelector('#date-from');
        const dateTo = dateContainer.querySelector('#date-to');
        
        select.addEventListener('change', (e) => {
            const value = e.target.value;
            
            if (value === 'custom') {
                customInputs.classList.remove('hidden');
            } else {
                customInputs.classList.add('hidden');
                this.setDateRangeFilter(value);
            }
        });
        
        [dateFrom, dateTo].forEach(input => {
            input.addEventListener('change', () => {
                if (dateFrom.value && dateTo.value) {
                    this.currentFilters.dateRange = {
                        from: new Date(dateFrom.value),
                        to: new Date(dateTo.value)
                    };
                    this.applyFilters();
                }
            });
        });
        
        // Insert into main content
        const mainContent = document.querySelector('#main-content .max-w-7xl');
        if (mainContent) {
            const relevanceFilter = mainContent.querySelector('.flex.items-center.gap-4.mb-4.p-3');
            if (relevanceFilter) {
                relevanceFilter.parentNode.insertBefore(dateContainer, relevanceFilter.nextSibling);
            }
        }
    }

    /**
     * Initialize sort controls
     */
    initializeSortControls() {
        const sortBtn = document.getElementById('sort-btn');
        const sortMenu = document.getElementById('sort-menu');
        
        if (sortBtn && sortMenu) {
            // Update sort options for news-specific sorting
            sortMenu.innerHTML = `
                <button class="sort-option w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm" data-sort="date">
                    <i data-lucide="calendar" class="w-4 h-4 inline mr-2"></i>
                    By Date
                </button>
                <button class="sort-option w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm" data-sort="credibility">
                    <i data-lucide="shield-check" class="w-4 h-4 inline mr-2"></i>
                    By Credibility
                </button>
                <button class="sort-option w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm" data-sort="category">
                    <i data-lucide="folder" class="w-4 h-4 inline mr-2"></i>
                    By Category
                </button>
            `;
            
            // Add event listeners
            sortMenu.querySelectorAll('.sort-option').forEach(option => {
                option.addEventListener('click', () => {
                    this.currentFilters.sortBy = option.dataset.sort;
                    this.applyFilters();
                    sortMenu.classList.add('hidden');
                });
            });
        }
    }

    /**
     * Create loading indicator
     */
    createLoadingIndicator() {
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center';
        this.loadingIndicator.innerHTML = `
            <div class="bg-[var(--bg-dark-2)] rounded-2xl p-6 flex items-center gap-4 border border-white/10">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--teal-primary)]"></div>
                <span class="text-white">Loading news...</span>
            </div>
        `;
        document.body.appendChild(this.loadingIndicator);
    }

    /**
     * Create news grid container
     */
    createNewsGrid() {
        // Find existing news grid or create new one
        let newsGrid = document.querySelector('section[aria-label="News cards"]');
        if (!newsGrid) {
            newsGrid = document.createElement('section');
            newsGrid.setAttribute('aria-label', 'News cards');
            newsGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr';
            
            const mainContent = document.querySelector('#main-content .max-w-7xl');
            if (mainContent) {
                mainContent.appendChild(newsGrid);
            }
        }
        
        this.newsGrid = newsGrid;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle window resize for responsive layout
        window.addEventListener('resize', () => {
            this.adjustLayout();
        });
        
        // Handle visibility change for auto-refresh
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoRefresh();
            } else {
                this.resumeAutoRefresh();
            }
        });
    }

    /**
     * Load news articles
     */
    async loadNews(refresh = false) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoading();
            
            let articles = [];
            
            if (this.newsService) {
                // Use NewsIntegrationService for real news
                articles = await this.newsService.fetchLatestNews(
                    this.currentFilters.categories,
                    this.config.itemsPerPage * 2 // Fetch more for filtering
                );
            } else {
                // No fallback data - show empty state
                articles = [];
            }
            
            this.currentArticles = articles;
            this.applyFilters();
            
        } catch (error) {
            console.error('Error loading news:', error);
            this.showError('Failed to load news articles');
            
            // Show empty state on error
            this.currentArticles = [];
            this.applyFilters();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    /**
     * Apply current filters to articles
     */
    async applyFilters() {
        try {
            let filtered = [...this.currentArticles];
            
            // Apply text search
            if (this.currentFilters.query.trim()) {
                const query = this.currentFilters.query.toLowerCase();
                filtered = filtered.filter(article => 
                    article.title?.toLowerCase().includes(query) ||
                    article.description?.toLowerCase().includes(query) ||
                    article.keywords?.some(keyword => keyword.toLowerCase().includes(query))
                );
            }
            
            // Apply category filter
            if (this.currentFilters.categories.length > 0) {
                filtered = filtered.filter(article => 
                    this.currentFilters.categories.includes(article.category?.toLowerCase())
                );
            }
            
            // Relevance threshold filtering disabled
            // filtered = filtered.filter(article => 
            //     (article.upscRelevance?.score || 0) >= this.currentFilters.relevanceThreshold
            // );
            
            // Apply date range filter
            if (this.currentFilters.dateRange) {
                const { from, to } = this.currentFilters.dateRange;
                filtered = filtered.filter(article => {
                    const articleDate = new Date(article.publishedAt);
                    return articleDate >= from && articleDate <= to;
                });
            }
            
            // Apply sorting
            filtered = this.sortArticles(filtered, this.currentFilters.sortBy);
            
            this.filteredArticles = filtered;
            this.renderArticles();
            
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showError('Error filtering articles');
        }
    }

    /**
     * Sort articles by specified criteria
     */
    sortArticles(articles, sortBy) {
        switch (sortBy) {
            case 'relevance':
                return articles.sort((a, b) => {
                    const scoreA = (a.upscRelevance?.score || 0) * (a.credibilityScore || 5);
                    const scoreB = (b.upscRelevance?.score || 0) * (b.credibilityScore || 5);
                    return scoreB - scoreA;
                });
                
            case 'date':
                return articles.sort((a, b) => 
                    new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
                );
                
            case 'credibility':
                return articles.sort((a, b) => 
                    (b.credibilityScore || 0) - (a.credibilityScore || 0)
                );
                
            case 'category':
                return articles.sort((a, b) => 
                    (a.category || '').localeCompare(b.category || '')
                );
                
            default:
                return articles;
        }
    }

    /**
     * Render articles in the grid
     */
    renderArticles() {
        if (!this.newsGrid) return;
        
        // Clear existing articles
        this.newsGrid.innerHTML = '';
        
        // Render filtered articles
        const articlesToShow = this.filteredArticles.slice(0, this.config.itemsPerPage);
        
        if (articlesToShow.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        articlesToShow.forEach((article, index) => {
            const articleElement = this.createArticleElement(article, index);
            this.newsGrid.appendChild(articleElement);
        });
        
        // Refresh icons
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    /**
     * Create article element
     */
    createArticleElement(article, index) {
        const articleEl = document.createElement('article');
        articleEl.className = 'news-card glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300';
        
        const categoryColor = this.getCategoryColor(article.category);
        const relevanceScore = article.upscRelevance?.score || 0;
        const credibilityScore = article.credibilityScore || 5;
        const timeAgo = this.getTimeAgo(article.publishedAt);
        
        articleEl.innerHTML = `
            <div class="h-48 bg-gradient-to-br ${categoryColor} relative overflow-hidden">
                ${article.urlToImage ? 
                    `<img src="${article.urlToImage}" alt="${article.title}" class="w-full h-full object-cover" onerror="this.style.display='none';">` : 
                    ''
                }
                <div class="absolute top-3 right-3">
                    <button class="bookmark-btn w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition" 
                            title="Bookmark" onclick="event.stopPropagation(); newsDisplayInterface.toggleBookmark('${article.id}')">
                        <i data-lucide="bookmark" class="w-4 h-4 text-white/80"></i>
                    </button>
                </div>
                <div class="absolute bottom-3 left-3">
                    <span class="category-badge px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                        ${this.formatCategory(article.category)}
                    </span>
                </div>
                ${article.aiSummary ? 
                    `<div class="absolute top-3 left-3">
                        <span class="px-2 py-1 rounded-full bg-blue-500/80 text-white text-xs font-medium flex items-center gap-1">
                            <i data-lucide="sparkles" class="w-3 h-3"></i>
                            AI Summary
                        </span>
                    </div>` : 
                    ''
                }
            </div>
            <div class="p-6 flex flex-col h-full">
                <h3 class="news-card-title text-lg font-medium leading-snug mb-3 group-hover:text-[var(--teal-primary)] transition-colors">
                    ${article.title}
                </h3>
                <p class="news-card-description text-sm text-white/70 mb-4 line-clamp-3 flex-1">
                    ${article.aiSummary?.text || article.description || 'No description available'}
                </p>
                ${article.keyPoints && article.keyPoints.length > 0 ? 
                    `<div class="mb-4">
                        <div class="text-xs text-white/50 mb-2">Key Points:</div>
                        <ul class="text-xs text-white/70 space-y-1">
                            ${article.keyPoints.slice(0, 2).map(point => `<li class="flex items-start gap-2"><span class="w-1 h-1 bg-[var(--teal-primary)] rounded-full mt-2 flex-shrink-0"></span><span class="line-clamp-1">${point}</span></li>`).join('')}
                        </ul>
                    </div>` : 
                    ''
                }
                <div class="flex items-center justify-between text-xs text-white/60 mt-auto">
                    <div class="flex items-center gap-2">
                        <span>${article.source?.name || 'Unknown Source'}</span>
                        ${article.url ? '<i data-lucide="external-link" class="w-3.5 h-3.5"></i>' : ''}
                    </div>
                    <div class="flex items-center gap-4">
                        <span title="UPSC Relevance Score">Relevance: <span class="text-white font-medium">${relevanceScore}/10</span></span>
                        <span title="Source Credibility">Credibility: <span class="text-white font-medium">${credibilityScore}/10</span></span>
                        <span>${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add click handler
        articleEl.addEventListener('click', () => {
            this.viewArticle(article);
        });
        
        return articleEl;
    }

    /**
     * Render empty state when no articles found
     */
    renderEmptyState() {
        this.newsGrid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div class="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <i data-lucide="newspaper" class="w-8 h-8 text-white/50"></i>
                </div>
                <h3 class="text-lg font-medium text-white mb-2">No news articles found</h3>
                <p class="text-white/60 mb-4">Try adjusting your filters or search terms</p>
                <button onclick="newsDisplayInterface.clearFilters()" 
                        class="px-4 py-2 bg-[var(--teal-primary)] text-white rounded-lg hover:bg-[var(--teal-primary)]/80 transition">
                    Clear Filters
                </button>
            </div>
        `;
        
        // Refresh icons
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    /**
     * Get category color classes
     */
    getCategoryColor(category) {
        const colors = {
            'polity': 'from-yellow-600/20 to-orange-600/20',
            'economics': 'from-green-600/20 to-emerald-600/20',
            'geography': 'from-blue-600/20 to-cyan-600/20',
            'history': 'from-purple-600/20 to-pink-600/20',
            'science': 'from-cyan-600/20 to-blue-600/20',
            'environment': 'from-emerald-600/20 to-green-600/20',
            'international': 'from-orange-600/20 to-red-600/20'
        };
        
        return colors[category?.toLowerCase()] || 'from-gray-600/20 to-gray-700/20';
    }

    /**
     * Format category name for display
     */
    formatCategory(category) {
        if (!category) return 'General';
        
        const formatted = category.charAt(0).toUpperCase() + category.slice(1);
        
        // Map to UPSC paper names
        const paperMapping = {
            'Polity': 'GS-II',
            'Economics': 'GS-III',
            'Geography': 'GS-I',
            'History': 'GS-I',
            'Science': 'GS-III',
            'Environment': 'GS-III',
            'International': 'GS-II'
        };
        
        return paperMapping[formatted] || formatted;
    }

    /**
     * Get time ago string
     */
    getTimeAgo(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Toggle category filter
     */
    toggleCategoryFilter(categoryId, button) {
        const index = this.currentFilters.categories.indexOf(categoryId);
        
        if (index === -1) {
            // Add category
            this.currentFilters.categories.push(categoryId);
            button.classList.add('bg-opacity-20', 'border-opacity-50');
        } else {
            // Remove category
            this.currentFilters.categories.splice(index, 1);
            button.classList.remove('bg-opacity-20', 'border-opacity-50');
        }
        
        this.applyFilters();
    }

    /**
     * Set date range filter
     */
    setDateRangeFilter(range) {
        const now = new Date();
        
        switch (range) {
            case 'today':
                this.currentFilters.dateRange = {
                    from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                    to: now
                };
                break;
                
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                this.currentFilters.dateRange = {
                    from: weekAgo,
                    to: now
                };
                break;
                
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                this.currentFilters.dateRange = {
                    from: monthAgo,
                    to: now
                };
                break;
                
            default:
                this.currentFilters.dateRange = null;
        }
        
        this.applyFilters();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilters = {
            query: '',
            categories: [],
            subjects: [],
            dateRange: null,
            relevanceThreshold: 3,
            sortBy: 'relevance'
        };
        
        // Reset UI elements
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        
        // Reset category buttons
        document.querySelectorAll('[data-category]').forEach(button => {
            button.classList.remove('bg-opacity-20', 'border-opacity-50');
        });
        
        // Reset relevance slider
        const relevanceSlider = document.getElementById('relevance-slider');
        const relevanceValue = document.getElementById('relevance-value');
        if (relevanceSlider && relevanceValue) {
            relevanceSlider.value = '3';
            relevanceValue.textContent = '3';
        }
        
        // Reset date range
        const dateSelect = document.getElementById('date-range-select');
        if (dateSelect) {
            dateSelect.value = '';
        }
        
        this.applyFilters();
    }

    /**
     * Toggle bookmark for article
     */
    toggleBookmark(articleId) {
        if (!this.profileManager) {
            this.showToast('Bookmark feature not available');
            return;
        }
        
        const article = this.currentArticles.find(a => a.id === articleId);
        if (!article) {
            this.showToast('Article not found');
            return;
        }
        
        try {
            const bookmarks = this.profileManager.getBookmarks();
            const existingBookmark = bookmarks.find(b => b.title === article.title);
            
            if (existingBookmark) {
                // Remove bookmark
                this.profileManager.removeBookmark(existingBookmark.id);
                this.updateBookmarkButton(articleId, false);
                this.showToast('Bookmark removed');
            } else {
                // Add bookmark
                const bookmarkData = {
                    title: article.title,
                    category: article.category || 'news',
                    type: 'news',
                    url: article.url || `#news-${articleId}`,
                    metadata: {
                        source: article.source?.name,
                        publishedAt: article.publishedAt,
                        relevanceScore: article.upscRelevance?.score
                    }
                };
                
                this.profileManager.addBookmark(bookmarkData);
                this.updateBookmarkButton(articleId, true);
                this.showToast('News bookmarked successfully!');
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            this.showToast('Failed to update bookmark');
        }
    }

    /**
     * Update bookmark button appearance
     */
    updateBookmarkButton(articleId, isBookmarked) {
        const button = document.querySelector(`button[onclick*="toggleBookmark('${articleId}')"]`);
        if (button) {
            const icon = button.querySelector('i');
            if (icon) {
                if (isBookmarked) {
                    icon.classList.remove('text-white/80');
                    icon.classList.add('text-yellow-400');
                    button.classList.add('bookmarked');
                } else {
                    icon.classList.remove('text-yellow-400');
                    icon.classList.add('text-white/80');
                    button.classList.remove('bookmarked');
                }
            }
        }
    }

    /**
     * View article in modal
     */
    viewArticle(article) {
        // Create and show article modal
        this.showArticleModal(article);
    }

    /**
     * Show article in modal
     */
    showArticleModal(article) {
        // Remove existing modal
        const existingModal = document.getElementById('news-modal');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }
        
        const modal = document.createElement('div');
        modal.id = 'news-modal';
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        
        const relevanceScore = article.upscRelevance?.score || 0;
        const credibilityScore = article.credibilityScore || 5;
        
        modal.innerHTML = `
            <div class="bg-[var(--bg-dark-2)] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <button id="backToNews" class="p-2 rounded-lg hover:bg-white/10 transition">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>
                        <div class="flex items-center gap-3">
                            <span class="px-3 py-1 rounded-full text-xs bg-[var(--teal-primary)]/20 text-[var(--teal-primary)]">
                                ${this.formatCategory(article.category)}
                            </span>
                            <span class="text-white/60 text-sm">${this.getTimeAgo(article.publishedAt)}</span>
                            <div class="flex items-center gap-2 text-xs text-white/60">
                                <span>Relevance: ${relevanceScore}/10</span>
                                <span>•</span>
                                <span>Credibility: ${credibilityScore}/10</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${article.url ? 
                            `<a href="${article.url}" target="_blank" rel="noopener noreferrer" 
                                class="p-2 rounded-lg hover:bg-white/10 transition" title="Open original article">
                                <i data-lucide="external-link" class="w-5 h-5"></i>
                            </a>` : 
                            ''
                        }
                        <button onclick="newsDisplayInterface.toggleBookmark('${article.id}')" 
                                class="p-2 rounded-lg hover:bg-white/10 transition" title="Bookmark">
                            <i data-lucide="bookmark" class="w-5 h-5"></i>
                        </button>
                        <button id="closeNewsModal" class="p-2 rounded-lg hover:bg-white/10 transition text-white/50 hover:text-white">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
                
                <div class="overflow-y-auto max-h-[75vh]">
                    ${article.urlToImage ? 
                        `<img src="${article.urlToImage}" alt="${article.title}" class="w-full h-64 object-cover rounded-lg mb-6">` : 
                        ''
                    }
                    
                    <div class="prose prose-invert max-w-none">
                        <h1 class="text-2xl font-bold text-white mb-4">${article.title}</h1>
                        
                        ${article.aiSummary ? 
                            `<div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                                <div class="flex items-center gap-2 mb-3">
                                    <i data-lucide="sparkles" class="w-4 h-4 text-blue-400"></i>
                                    <span class="text-sm font-medium text-blue-400">AI Summary</span>
                                </div>
                                <p class="text-white/90 text-sm leading-relaxed">${article.aiSummary.text}</p>
                                ${article.aiSummary.upscRelevance ? 
                                    `<div class="mt-3 pt-3 border-t border-blue-500/20">
                                        <p class="text-xs text-blue-300"><strong>UPSC Relevance:</strong> ${article.aiSummary.upscRelevance}</p>
                                    </div>` : 
                                    ''
                                }
                            </div>` : 
                            ''
                        }
                        
                        ${article.keyPoints && article.keyPoints.length > 0 ? 
                            `<div class="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                                <h3 class="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                                    <i data-lucide="list" class="w-4 h-4"></i>
                                    Key Points
                                </h3>
                                <ul class="space-y-2">
                                    ${article.keyPoints.map(point => 
                                        `<li class="text-white/90 text-sm flex items-start gap-2">
                                            <span class="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                                            <span>${point}</span>
                                        </li>`
                                    ).join('')}
                                </ul>
                            </div>` : 
                            ''
                        }
                        
                        <div class="text-white/90 leading-relaxed">
                            ${article.content || article.description || 'Full article content not available. Please visit the original source for complete details.'}
                        </div>
                        
                        ${article.source ? 
                            `<div class="mt-6 pt-4 border-t border-white/10">
                                <p class="text-sm text-white/60">
                                    Source: <span class="text-white">${article.source.name}</span>
                                    ${article.publishedAt ? ` • Published: ${new Date(article.publishedAt).toLocaleDateString()}` : ''}
                                </p>
                            </div>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };
        
        modal.querySelector('#closeNewsModal').addEventListener('click', closeModal);
        modal.querySelector('#backToNews').addEventListener('click', closeModal);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close on escape key
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        
        // Refresh icons
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.remove('hidden');
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColor = type === 'error' ? 'bg-red-600' : 'bg-gray-800';
        toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        this.refreshTimer = setInterval(() => {
            if (!document.hidden) {
                this.loadNews(true);
            }
        }, this.config.refreshInterval);
    }

    /**
     * Stop auto-refresh timer
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Pause auto-refresh
     */
    pauseAutoRefresh() {
        // Auto-refresh will be paused when document is hidden
    }

    /**
     * Resume auto-refresh
     */
    resumeAutoRefresh() {
        // Auto-refresh will resume when document becomes visible
        if (this.config.autoRefresh && !this.refreshTimer) {
            this.startAutoRefresh();
        }
    }

    /**
     * Adjust layout for responsive design
     */
    adjustLayout() {
        // Responsive layout adjustments can be added here
    }

    /**
     * Get mock news data (fallback)
     */
    getMockNewsData() {
        // Return empty array - no mock data
        return [];
    }

    /**
     * Destroy the interface and cleanup resources
     */
    destroy() {
        this.stopAutoRefresh();
        
        if (this.loadingIndicator && document.body.contains(this.loadingIndicator)) {
            document.body.removeChild(this.loadingIndicator);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.adjustLayout);
        document.removeEventListener('visibilitychange', this.pauseAutoRefresh);
        
        console.log('News Display Interface destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsDisplayInterface;
}