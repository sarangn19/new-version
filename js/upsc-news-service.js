/**
 * UPSC News Service
 * Fetches and manages UPSC-relevant news from multiple sources
 */
class UPSCNewsService {
    constructor() {
        this.newsCache = new Map();
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
        this.lastFetch = null;
        this.isLoading = false;
        
        // UPSC-relevant keywords for filtering
        this.upscKeywords = [
            'government', 'policy', 'parliament', 'supreme court', 'constitution',
            'economy', 'budget', 'gdp', 'inflation', 'rbi', 'sebi',
            'international relations', 'diplomacy', 'treaty', 'agreement',
            'environment', 'climate change', 'pollution', 'renewable energy',
            'science', 'technology', 'space', 'isro', 'research',
            'history', 'culture', 'heritage', 'archaeology',
            'geography', 'disaster', 'earthquake', 'flood',
            'current affairs', 'upsc', 'civil services', 'ias', 'ips',
            'scheme', 'mission', 'initiative', 'act', 'bill',
            'election', 'democracy', 'governance', 'administration'
        ];

        this.init();
    }

    /**
     * Initialize the news service
     */
    init() {
        console.log('📰 Initializing UPSC News Service...');
        
        // Load cached news
        this.loadCachedNews();
        
        // Fetch fresh news
        this.fetchNews();
        
        // Set up periodic refresh
        this.setupPeriodicRefresh();
    }

    /**
     * Load cached news from localStorage
     */
    loadCachedNews() {
        try {
            const cached = localStorage.getItem('upscNewsCache');
            if (cached) {
                const { news, timestamp } = JSON.parse(cached);
                const now = Date.now();
                
                if (now - timestamp < this.cacheExpiry) {
                    this.newsCache.set('current', news);
                    this.lastFetch = new Date(timestamp);
                    console.log('📰 Loaded cached news:', news.length, 'articles');
                    
                    // Display cached news immediately
                    this.displayNews(news);
                    return true;
                }
            }
        } catch (error) {
            console.error('Error loading cached news:', error);
        }
        return false;
    }

    /**
     * Save news to cache
     */
    saveNewsToCache(news) {
        try {
            const cacheData = {
                news: news,
                timestamp: Date.now()
            };
            localStorage.setItem('upscNewsCache', JSON.stringify(cacheData));
            console.log('💾 News cached successfully');
        } catch (error) {
            console.error('Error caching news:', error);
        }
    }

    /**
     * Fetch news from multiple sources
     */
    async fetchNews() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        console.log('🔄 Fetching UPSC-relevant news...');
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Fetch from multiple sources
            const newsPromises = [
                this.fetchFromNewsAPI(),
                this.fetchFromRSS(),
                this.generateSampleNews() // Fallback with sample data
            ];
            
            const results = await Promise.allSettled(newsPromises);
            
            // Combine and process results
            let allNews = [];
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    allNews = allNews.concat(result.value);
                }
            });
            
            // Filter and sort news
            const filteredNews = this.filterUPSCRelevantNews(allNews);
            const sortedNews = this.sortNewsByRelevance(filteredNews);
            const finalNews = sortedNews.slice(0, 20); // Limit to 20 articles
            
            // Cache and display
            this.newsCache.set('current', finalNews);
            this.saveNewsToCache(finalNews);
            this.displayNews(finalNews);
            this.lastFetch = new Date();
            
            console.log('✅ News fetched successfully:', finalNews.length, 'articles');
            
        } catch (error) {
            console.error('❌ Error fetching news:', error);
            
            // Fallback to sample news
            const sampleNews = this.generateSampleNews();
            this.displayNews(sampleNews);
            
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Fetch news from News API (requires API key)
     */
    async fetchFromNewsAPI() {
        // Note: This would require a News API key
        // For demo purposes, we'll return empty array
        console.log('📡 Attempting to fetch from News API...');
        
        try {
            // In a real implementation, you would use:
            // const response = await fetch(`https://newsapi.org/v2/everything?q=india+government&apiKey=${API_KEY}`);
            // const data = await response.json();
            // return this.parseNewsAPIResponse(data);
            
            return []; // Return empty for now
        } catch (error) {
            console.warn('News API fetch failed:', error);
            return [];
        }
    }

    /**
     * Fetch news from RSS feeds
     */
    async fetchFromRSS() {
        console.log('📡 Attempting to fetch from RSS feeds...');
        
        try {
            // Note: Direct RSS fetching is limited by CORS
            // In a real implementation, you would use a proxy service
            return [];
        } catch (error) {
            console.warn('RSS fetch failed:', error);
            return [];
        }
    }

    /**
     * Generate sample UPSC-relevant news
     */
    generateSampleNews() {
        console.log('📰 Generating sample UPSC news...');
        
        const sampleNews = [
            {
                id: 1,
                title: "Supreme Court Upholds Constitutional Validity of Digital Personal Data Protection Act",
                summary: "The Supreme Court has dismissed petitions challenging the Digital Personal Data Protection Act, 2023, stating it aligns with fundamental rights while ensuring data security.",
                content: "In a landmark judgment, the Supreme Court has upheld the constitutional validity of the Digital Personal Data Protection Act, 2023. The court noted that the Act strikes a balance between individual privacy rights and legitimate state interests in data governance.",
                category: "Polity & Governance",
                source: "The Hindu",
                publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                imageUrl: "image/news-1.jpg",
                upscRelevance: 95,
                tags: ["Supreme Court", "Data Protection", "Constitutional Law", "Privacy Rights"],
                readTime: "4 min read",
                isBreaking: true
            },
            {
                id: 2,
                title: "India's GDP Growth Projected at 6.8% for FY 2024-25: Economic Survey",
                summary: "The Economic Survey 2024-25 projects India's GDP growth at 6.8%, driven by robust domestic demand and improved manufacturing sector performance.",
                content: "The Economic Survey presented in Parliament forecasts India's GDP growth at 6.8% for the fiscal year 2024-25, citing strong fundamentals and policy reforms as key drivers.",
                category: "Economy",
                source: "Business Standard",
                publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                imageUrl: "image/news-2.jpg",
                upscRelevance: 92,
                tags: ["GDP", "Economic Survey", "Growth", "Manufacturing"],
                readTime: "5 min read",
                isBreaking: false
            },
            {
                id: 3,
                title: "India-Japan Strategic Partnership: New Defense Technology Cooperation Agreement Signed",
                summary: "India and Japan have signed a comprehensive defense technology cooperation agreement, enhancing bilateral ties in critical and emerging technologies.",
                content: "The agreement covers joint development of defense technologies, including artificial intelligence, quantum computing, and advanced materials for defense applications.",
                category: "International Relations",
                source: "Indian Express",
                publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                imageUrl: "image/news-3.jpg",
                upscRelevance: 88,
                tags: ["India-Japan Relations", "Defense Cooperation", "Technology Transfer"],
                readTime: "3 min read",
                isBreaking: false
            },
            {
                id: 4,
                title: "National Green Hydrogen Mission: India Targets 5 MMT Production by 2030",
                summary: "The government has approved the National Green Hydrogen Mission with a target to produce 5 million metric tonnes of green hydrogen annually by 2030.",
                content: "The mission aims to make India a global hub for green hydrogen production and export, with significant investments in renewable energy infrastructure.",
                category: "Environment & Energy",
                source: "Times of India",
                publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
                imageUrl: "image/news-4.jpg",
                upscRelevance: 85,
                tags: ["Green Hydrogen", "Renewable Energy", "Climate Policy", "Energy Security"],
                readTime: "4 min read",
                isBreaking: false
            },
            {
                id: 5,
                title: "ISRO Successfully Launches Chandrayaan-4 Mission to Moon's South Pole",
                summary: "ISRO's Chandrayaan-4 mission has been successfully launched, aiming to establish a permanent research station at the Moon's South Pole.",
                content: "The mission represents India's continued leadership in space exploration and lunar research, building on the success of previous Chandrayaan missions.",
                category: "Science & Technology",
                source: "Hindustan Times",
                publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
                imageUrl: "image/news-5.jpg",
                upscRelevance: 82,
                tags: ["ISRO", "Space Mission", "Lunar Exploration", "Scientific Research"],
                readTime: "6 min read",
                isBreaking: false
            },
            {
                id: 6,
                title: "New Education Policy: Implementation of Credit Transfer System in Higher Education",
                summary: "The University Grants Commission has announced the implementation of a comprehensive credit transfer system across all higher education institutions.",
                content: "The system will allow students to transfer credits between institutions, promoting flexibility and mobility in higher education.",
                category: "Education",
                source: "Education Times",
                publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), // 16 hours ago
                imageUrl: "image/news-6.jpg",
                upscRelevance: 78,
                tags: ["Education Policy", "Higher Education", "UGC", "Academic Flexibility"],
                readTime: "3 min read",
                isBreaking: false
            },
            {
                id: 7,
                title: "India Chairs G20 Working Group on Digital Transformation and Financial Inclusion",
                summary: "India has assumed the chair of the G20 Working Group on Digital Transformation, focusing on financial inclusion and digital infrastructure development.",
                content: "The initiative aims to promote digital financial services and bridge the digital divide in emerging economies through collaborative frameworks.",
                category: "International Relations",
                source: "Economic Times",
                publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
                imageUrl: "image/news-7.jpg",
                upscRelevance: 80,
                tags: ["G20", "Digital Transformation", "Financial Inclusion", "International Cooperation"],
                readTime: "4 min read",
                isBreaking: false
            },
            {
                id: 8,
                title: "Archaeological Survey Discovers 2000-Year-Old Buddhist Monastery in Odisha",
                summary: "The Archaeological Survey of India has uncovered a well-preserved Buddhist monastery dating back to the 2nd century CE in Odisha's Kalinga region.",
                content: "The discovery includes intricate sculptures, ancient manuscripts, and architectural elements that provide new insights into Buddhist culture in ancient India.",
                category: "History & Culture",
                source: "The Pioneer",
                publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                imageUrl: "image/news-8.jpg",
                upscRelevance: 75,
                tags: ["Archaeology", "Buddhist Heritage", "Ancient India", "Cultural Discovery"],
                readTime: "5 min read",
                isBreaking: false
            }
        ];

        return sampleNews;
    }

    /**
     * Filter news for UPSC relevance
     */
    filterUPSCRelevantNews(newsArray) {
        return newsArray.filter(article => {
            const text = (article.title + ' ' + article.summary + ' ' + (article.tags || []).join(' ')).toLowerCase();
            
            // Check for UPSC-relevant keywords
            const relevanceScore = this.upscKeywords.reduce((score, keyword) => {
                if (text.includes(keyword.toLowerCase())) {
                    return score + 1;
                }
                return score;
            }, 0);
            
            // Set relevance score
            article.upscRelevance = Math.min(relevanceScore * 10, 100);
            
            // Filter articles with relevance score > 30
            return article.upscRelevance > 30;
        });
    }

    /**
     * Sort news by relevance and recency
     */
    sortNewsByRelevance(newsArray) {
        return newsArray.sort((a, b) => {
            // Primary sort: UPSC relevance
            if (b.upscRelevance !== a.upscRelevance) {
                return b.upscRelevance - a.upscRelevance;
            }
            
            // Secondary sort: recency
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        });
    }

    /**
     * Display news on the page
     */
    displayNews(newsArray) {
        console.log('📰 Displaying news:', newsArray.length, 'articles');
        
        // Update main news container
        this.updateNewsContainer(newsArray);
        
        // Update news widgets
        this.updateNewsWidgets(newsArray);
        
        // Update breaking news ticker
        this.updateBreakingNewsTicker(newsArray);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('newsUpdated', {
            detail: { news: newsArray, timestamp: new Date() }
        }));
    }

    /**
     * Update main news container
     */
    updateNewsContainer(newsArray) {
        const container = document.getElementById('news-container');
        if (!container) return;

        const html = newsArray.map(article => this.createNewsCardHTML(article)).join('');
        container.innerHTML = html;

        // Refresh icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Create HTML for a news card
     */
    createNewsCardHTML(article) {
        const timeAgo = this.getTimeAgo(new Date(article.publishedAt));
        const relevanceColor = article.upscRelevance >= 90 ? 'text-green-400' : 
                              article.upscRelevance >= 70 ? 'text-yellow-400' : 'text-blue-400';
        
        return `
            <article class="news-card bg-[var(--bg-dark-2)] rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer" 
                     onclick="openNewsDetail('${article.id}')">
                ${article.isBreaking ? '<div class="breaking-badge bg-red-600 text-white text-xs px-2 py-1 rounded-full mb-3 inline-block">BREAKING</div>' : ''}
                
                <div class="flex items-start gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs px-2 py-1 bg-teal-600/20 text-teal-400 rounded-full">${article.category}</span>
                            <span class="text-xs ${relevanceColor}">UPSC: ${article.upscRelevance}%</span>
                            <span class="text-xs text-white/50">${timeAgo}</span>
                        </div>
                        
                        <h3 class="text-lg font-semibold text-white mb-2 line-clamp-2">${article.title}</h3>
                        <p class="text-white/70 text-sm mb-3 line-clamp-2">${article.summary}</p>
                        
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-white/50">${article.source}</span>
                                <span class="text-xs text-white/50">•</span>
                                <span class="text-xs text-white/50">${article.readTime}</span>
                            </div>
                            
                            <div class="flex items-center gap-2">
                                <button onclick="event.stopPropagation(); bookmarkNews('${article.id}')" 
                                        class="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <i data-lucide="bookmark" class="w-4 h-4 text-white/60"></i>
                                </button>
                                <button onclick="event.stopPropagation(); shareNews('${article.id}')" 
                                        class="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <i data-lucide="share-2" class="w-4 h-4 text-white/60"></i>
                                </button>
                            </div>
                        </div>
                        
                        ${article.tags ? `
                            <div class="flex flex-wrap gap-1 mt-3">
                                ${article.tags.slice(0, 3).map(tag => 
                                    `<span class="text-xs px-2 py-1 bg-white/5 text-white/60 rounded">${tag}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    ${article.imageUrl ? `
                        <div class="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <img src="${article.imageUrl}" alt="${article.title}" 
                                 class="w-full h-full object-cover" 
                                 onerror="this.style.display='none'">
                        </div>
                    ` : ''}
                </div>
            </article>
        `;
    }

    /**
     * Update news widgets (for dashboard, etc.)
     */
    updateNewsWidgets(newsArray) {
        // Update latest news widget
        const latestWidget = document.getElementById('latest-news-widget');
        if (latestWidget) {
            const latest = newsArray.slice(0, 3);
            const html = latest.map(article => `
                <div class="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer" 
                     onclick="openNewsDetail('${article.id}')">
                    <div class="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div class="flex-1">
                        <h4 class="text-sm font-medium text-white line-clamp-2">${article.title}</h4>
                        <p class="text-xs text-white/60 mt-1">${this.getTimeAgo(new Date(article.publishedAt))}</p>
                    </div>
                </div>
            `).join('');
            
            latestWidget.innerHTML = html;
        }

        // Update trending topics
        this.updateTrendingTopics(newsArray);
    }

    /**
     * Update breaking news ticker
     */
    updateBreakingNewsTicker(newsArray) {
        const ticker = document.getElementById('breaking-news-ticker');
        if (!ticker) return;

        const breakingNews = newsArray.filter(article => article.isBreaking);
        if (breakingNews.length === 0) {
            ticker.style.display = 'none';
            return;
        }

        ticker.style.display = 'block';
        const tickerContent = document.getElementById('ticker-content');
        if (tickerContent) {
            const html = breakingNews.map(article => 
                `<span class="ticker-item">${article.title}</span>`
            ).join(' • ');
            tickerContent.innerHTML = html;
        }
    }

    /**
     * Update trending topics
     */
    updateTrendingTopics(newsArray) {
        const trendingContainer = document.getElementById('trending-topics');
        if (!trendingContainer) return;

        // Extract and count tags
        const tagCounts = {};
        newsArray.forEach(article => {
            if (article.tags) {
                article.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // Sort by frequency and take top 5
        const trending = Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count }));

        const html = trending.map(item => `
            <span class="trending-tag px-3 py-1 bg-teal-600/20 text-teal-400 rounded-full text-sm cursor-pointer hover:bg-teal-600/30 transition-colors"
                  onclick="filterNewsByTag('${item.tag}')">
                ${item.tag} (${item.count})
            </span>
        `).join('');

        trendingContainer.innerHTML = html;
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const container = document.getElementById('news-container');
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto mb-4"></div>
                        <p class="text-white/60">Loading UPSC-relevant news...</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Setup periodic refresh
     */
    setupPeriodicRefresh() {
        // Refresh every 30 minutes
        setInterval(() => {
            console.log('🔄 Periodic news refresh...');
            this.fetchNews();
        }, 30 * 60 * 1000);

        // Refresh when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.lastFetch) {
                const timeSinceLastFetch = Date.now() - this.lastFetch.getTime();
                if (timeSinceLastFetch > 15 * 60 * 1000) { // 15 minutes
                    this.fetchNews();
                }
            }
        });
    }

    /**
     * Utility functions
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    /**
     * Public methods
     */
    refresh() {
        return this.fetchNews();
    }

    getNews() {
        return this.newsCache.get('current') || [];
    }

    searchNews(query) {
        const news = this.getNews();
        const lowercaseQuery = query.toLowerCase();
        
        return news.filter(article => 
            article.title.toLowerCase().includes(lowercaseQuery) ||
            article.summary.toLowerCase().includes(lowercaseQuery) ||
            article.category.toLowerCase().includes(lowercaseQuery) ||
            (article.tags && article.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
        );
    }

    filterByCategory(category) {
        const news = this.getNews();
        return news.filter(article => article.category === category);
    }

    getCategories() {
        const news = this.getNews();
        const categories = [...new Set(news.map(article => article.category))];
        return categories.sort();
    }
}

// Global functions for news interactions
window.openNewsDetail = function(articleId) {
    const news = window.upscNewsService?.getNews() || [];
    const article = news.find(a => a.id == articleId);
    
    if (article) {
        // Create modal or navigate to detail page
        showNewsDetailModal(article);
    }
};

window.bookmarkNews = function(articleId) {
    const bookmarks = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
    if (!bookmarks.includes(articleId)) {
        bookmarks.push(articleId);
        localStorage.setItem('newsBookmarks', JSON.stringify(bookmarks));
        
        // Show toast notification
        if (window.showToast) {
            window.showToast('News article bookmarked!', 'success');
        }
    }
};

window.shareNews = function(articleId) {
    const news = window.upscNewsService?.getNews() || [];
    const article = news.find(a => a.id == articleId);
    
    if (article && navigator.share) {
        navigator.share({
            title: article.title,
            text: article.summary,
            url: window.location.href
        });
    } else if (article) {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${article.title}\n${article.summary}\n${window.location.href}`);
        if (window.showToast) {
            window.showToast('News link copied to clipboard!', 'success');
        }
    }
};

window.filterNewsByTag = function(tag) {
    const news = window.upscNewsService?.getNews() || [];
    const filtered = news.filter(article => 
        article.tags && article.tags.includes(tag)
    );
    
    // Update display with filtered news
    if (window.upscNewsService) {
        window.upscNewsService.displayNews(filtered);
    }
};

function showNewsDetailModal(article) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-[var(--bg-dark-2)] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-2">
                    <span class="text-xs px-2 py-1 bg-teal-600/20 text-teal-400 rounded-full">${article.category}</span>
                    <span class="text-xs text-white/50">${article.source}</span>
                    <span class="text-xs text-white/50">•</span>
                    <span class="text-xs text-white/50">${window.upscNewsService.getTimeAgo(new Date(article.publishedAt))}</span>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-white/50 hover:text-white">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            
            <h1 class="text-2xl font-bold text-white mb-4">${article.title}</h1>
            
            ${article.imageUrl ? `
                <img src="${article.imageUrl}" alt="${article.title}" 
                     class="w-full h-64 object-cover rounded-lg mb-6"
                     onerror="this.style.display='none'">
            ` : ''}
            
            <div class="prose prose-invert max-w-none">
                <p class="text-lg text-white/80 mb-6">${article.summary}</p>
                <div class="text-white/70 leading-relaxed">${article.content}</div>
            </div>
            
            ${article.tags ? `
                <div class="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
                    ${article.tags.map(tag => 
                        `<span class="text-xs px-2 py-1 bg-white/5 text-white/60 rounded">${tag}</span>`
                    ).join('')}
                </div>
            ` : ''}
        </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Refresh icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Initialize news service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.upscNewsService = new UPSCNewsService();
    console.log('✅ UPSC News Service initialized');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UPSCNewsService;
}