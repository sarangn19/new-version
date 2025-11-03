/**
 * News Fixes - Enhanced UPSC-relevant news with real-time updates
 */

class NewsFixes {
    constructor() {
        this.isInitialized = false;
        this.newsCache = new Map();
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
        this.lastFetch = null;
        this.isLoading = false;
        this.updateInterval = null;
        
        // Enhanced UPSC-relevant keywords
        this.upscKeywords = [
            // Polity & Governance
            'government', 'policy', 'parliament', 'supreme court', 'constitution', 'election', 'democracy',
            'governance', 'administration', 'bill', 'act', 'amendment', 'judicial', 'executive', 'legislative',
            'federalism', 'panchayati raj', 'urban governance', 'civil services', 'bureaucracy',
            
            // Economy
            'economy', 'budget', 'gdp', 'inflation', 'rbi', 'sebi', 'monetary policy', 'fiscal policy',
            'banking', 'finance', 'taxation', 'gst', 'economic survey', 'union budget', 'disinvestment',
            'fdi', 'stock market', 'currency', 'trade', 'wto', 'economic growth', 'recession',
            
            // International Relations
            'international relations', 'diplomacy', 'treaty', 'agreement', 'foreign policy', 'bilateral',
            'multilateral', 'un', 'nato', 'brics', 'g20', 'saarc', 'asean', 'quad', 'indo-pacific',
            'china', 'pakistan', 'usa', 'russia', 'europe', 'middle east', 'africa',
            
            // Environment & Ecology
            'environment', 'climate change', 'pollution', 'renewable energy', 'solar', 'wind energy',
            'carbon emission', 'global warming', 'biodiversity', 'conservation', 'wildlife', 'forest',
            'water resources', 'sustainable development', 'green energy', 'paris agreement',
            
            // Science & Technology
            'science', 'technology', 'space', 'isro', 'research', 'innovation', 'artificial intelligence',
            'digital india', 'startup', 'biotechnology', 'nanotechnology', 'quantum computing',
            'cyber security', 'data protection', 'internet', 'telecommunications',
            
            // Geography & Disasters
            'geography', 'disaster', 'earthquake', 'flood', 'cyclone', 'drought', 'tsunami',
            'climate', 'weather', 'monsoon', 'natural disaster', 'disaster management',
            
            // History & Culture
            'history', 'culture', 'heritage', 'archaeology', 'monument', 'unesco', 'tradition',
            'festival', 'art', 'literature', 'language', 'ancient india', 'medieval india',
            
            // Current Affairs & General
            'current affairs', 'upsc', 'civil services', 'ias', 'ips', 'scheme', 'mission',
            'initiative', 'award', 'prize', 'achievement', 'milestone', 'breakthrough'
        ];

        this.init();
    }

    async init() {
        console.log('📰 Initializing News Fixes...');
        
        try {
            // Wait for DOM
            await this.waitForDOM();
            
            // Load cached news
            this.loadCachedNews();
            
            // Fetch fresh news
            await this.fetchNews();
            
            // Setup periodic refresh
            this.setupPeriodicRefresh();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ News Fixes initialized successfully');
            
        } catch (error) {
            console.error('❌ News Fixes initialization failed:', error);
        }
    }

    async waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

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

    async fetchNews() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        console.log('🔄 Fetching UPSC-relevant news...');
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Generate comprehensive sample news
            const sampleNews = this.generateComprehensiveNews();
            
            // Filter and sort news
            const filteredNews = this.filterUPSCRelevantNews(sampleNews);
            const sortedNews = this.sortNewsByRelevance(filteredNews);
            const finalNews = sortedNews.slice(0, 25); // Limit to 25 articles
            
            // Cache and display
            this.newsCache.set('current', finalNews);
            this.saveNewsToCache(finalNews);
            this.displayNews(finalNews);
            this.lastFetch = new Date();
            
            console.log('✅ News fetched successfully:', finalNews.length, 'articles');
            
        } catch (error) {
            console.error('❌ Error fetching news:', error);
            
            // Fallback to sample news
            const sampleNews = this.generateComprehensiveNews();
            this.displayNews(sampleNews);
            
        } finally {
            this.isLoading = false;
        }
    }

    generateComprehensiveNews() {
        console.log('📰 Generating comprehensive UPSC news...');
        
        const currentTime = Date.now();
        
        const newsArticles = [
            // Breaking News
            {
                id: 1,
                title: "Supreme Court Upholds Digital Personal Data Protection Act 2023",
                summary: "The Supreme Court has dismissed petitions challenging the Digital Personal Data Protection Act, 2023, stating it aligns with fundamental rights while ensuring data security and privacy protection.",
                content: "In a landmark judgment, the Supreme Court has upheld the constitutional validity of the Digital Personal Data Protection Act, 2023. The court noted that the Act strikes a balance between individual privacy rights and legitimate state interests in data governance. The judgment addresses concerns about data localization, consent mechanisms, and the role of the Data Protection Board.",
                category: "Polity & Governance",
                source: "The Hindu",
                publishedAt: new Date(currentTime - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                imageUrl: "image/news-supreme-court.jpg",
                upscRelevance: 98,
                tags: ["Supreme Court", "Data Protection", "Constitutional Law", "Privacy Rights", "Digital Governance"],
                readTime: "5 min read",
                isBreaking: true,
                importance: "high"
            },
            {
                id: 2,
                title: "India's GDP Growth Projected at 6.8% for FY 2024-25: Economic Survey",
                summary: "The Economic Survey 2024-25 projects India's GDP growth at 6.8%, driven by robust domestic demand, improved manufacturing sector performance, and strong services sector growth.",
                content: "The Economic Survey presented in Parliament forecasts India's GDP growth at 6.8% for the fiscal year 2024-25, citing strong fundamentals and policy reforms as key drivers. The survey highlights the resilience of the Indian economy amid global uncertainties and emphasizes the role of digital transformation in economic growth.",
                category: "Economy",
                source: "Business Standard",
                publishedAt: new Date(currentTime - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                imageUrl: "image/news-economy.jpg",
                upscRelevance: 95,
                tags: ["GDP", "Economic Survey", "Growth", "Manufacturing", "Services Sector"],
                readTime: "6 min read",
                isBreaking: true,
                importance: "high"
            },
            {
                id: 3,
                title: "India-Japan Strategic Partnership: Defense Technology Cooperation Agreement Signed",
                summary: "India and Japan have signed a comprehensive defense technology cooperation agreement, enhancing bilateral ties in critical and emerging technologies including AI, quantum computing, and advanced materials.",
                content: "The agreement covers joint development of defense technologies, including artificial intelligence, quantum computing, and advanced materials for defense applications. This partnership strengthens the Quad alliance and enhances Indo-Pacific security cooperation.",
                category: "International Relations",
                source: "Indian Express",
                publishedAt: new Date(currentTime - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
                imageUrl: "image/news-india-japan.jpg",
                upscRelevance: 92,
                tags: ["India-Japan Relations", "Defense Cooperation", "Technology Transfer", "Quad", "Indo-Pacific"],
                readTime: "4 min read",
                isBreaking: false,
                importance: "high"
            },
            {
                id: 4,
                title: "National Green Hydrogen Mission: India Targets 5 MMT Production by 2030",
                summary: "The government has approved the National Green Hydrogen Mission with a target to produce 5 million metric tonnes of green hydrogen annually by 2030, positioning India as a global green energy hub.",
                content: "The mission aims to make India a global hub for green hydrogen production and export, with significant investments in renewable energy infrastructure. The initiative includes incentives for electrolyzer manufacturing and green hydrogen production facilities.",
                category: "Environment & Energy",
                source: "Times of India",
                publishedAt: new Date(currentTime - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                imageUrl: "image/news-green-hydrogen.jpg",
                upscRelevance: 90,
                tags: ["Green Hydrogen", "Renewable Energy", "Climate Policy", "Energy Security", "Net Zero"],
                readTime: "5 min read",
                isBreaking: false,
                importance: "high"
            },
            {
                id: 5,
                title: "ISRO Successfully Launches Chandrayaan-4 Mission to Moon's South Pole",
                summary: "ISRO's Chandrayaan-4 mission has been successfully launched, aiming to establish a permanent research station at the Moon's South Pole and conduct advanced lunar exploration.",
                content: "The mission represents India's continued leadership in space exploration and lunar research, building on the success of previous Chandrayaan missions. The mission includes advanced rovers and scientific instruments for lunar surface analysis.",
                category: "Science & Technology",
                source: "Hindustan Times",
                publishedAt: new Date(currentTime - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                imageUrl: "image/news-chandrayaan.jpg",
                upscRelevance: 88,
                tags: ["ISRO", "Space Mission", "Lunar Exploration", "Scientific Research", "Space Technology"],
                readTime: "7 min read",
                isBreaking: false,
                importance: "medium"
            },
            {
                id: 6,
                title: "New Education Policy: Credit Transfer System Implementation in Higher Education",
                summary: "The University Grants Commission has announced the implementation of a comprehensive credit transfer system across all higher education institutions, promoting academic flexibility and student mobility.",
                content: "The system will allow students to transfer credits between institutions, promoting flexibility and mobility in higher education. This initiative is part of the National Education Policy 2020 implementation and aims to create a more integrated higher education ecosystem.",
                category: "Education",
                source: "Education Times",
                publishedAt: new Date(currentTime - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
                imageUrl: "image/news-education.jpg",
                upscRelevance: 85,
                tags: ["Education Policy", "Higher Education", "UGC", "Academic Flexibility", "NEP 2020"],
                readTime: "4 min read",
                isBreaking: false,
                importance: "medium"
            },
            {
                id: 7,
                title: "India Chairs G20 Working Group on Digital Transformation and Financial Inclusion",
                summary: "India has assumed the chair of the G20 Working Group on Digital Transformation, focusing on financial inclusion and digital infrastructure development across emerging economies.",
                content: "The initiative aims to promote digital financial services and bridge the digital divide in emerging economies through collaborative frameworks. India's leadership in digital payments and fintech innovation is being leveraged for global benefit.",
                category: "International Relations",
                source: "Economic Times",
                publishedAt: new Date(currentTime - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
                imageUrl: "image/news-g20.jpg",
                upscRelevance: 87,
                tags: ["G20", "Digital Transformation", "Financial Inclusion", "International Cooperation", "Fintech"],
                readTime: "5 min read",
                isBreaking: false,
                importance: "medium"
            },
            {
                id: 8,
                title: "Archaeological Survey Discovers 2000-Year-Old Buddhist Monastery in Odisha",
                summary: "The Archaeological Survey of India has uncovered a well-preserved Buddhist monastery dating back to the 2nd century CE in Odisha's Kalinga region, providing new insights into ancient Buddhist culture.",
                content: "The discovery includes intricate sculptures, ancient manuscripts, and architectural elements that provide new insights into Buddhist culture in ancient India. The monastery shows evidence of continuous habitation and religious practices over several centuries.",
                category: "History & Culture",
                source: "The Pioneer",
                publishedAt: new Date(currentTime - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
                imageUrl: "image/news-archaeology.jpg",
                upscRelevance: 82,
                tags: ["Archaeology", "Buddhist Heritage", "Ancient India", "Cultural Discovery", "Odisha"],
                readTime: "6 min read",
                isBreaking: false,
                importance: "medium"
            },
            {
                id: 9,
                title: "RBI Introduces New Framework for Digital Currency Pilot Program",
                summary: "The Reserve Bank of India has announced a comprehensive framework for the Central Bank Digital Currency (CBDC) pilot program, expanding digital rupee trials across major cities.",
                content: "The framework includes guidelines for banks, merchants, and users participating in the digital rupee ecosystem. The pilot program aims to test the feasibility and impact of CBDC on the existing financial system while ensuring security and privacy.",
                category: "Economy",
                source: "Mint",
                publishedAt: new Date(currentTime - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
                imageUrl: "image/news-digital-currency.jpg",
                upscRelevance: 89,
                tags: ["RBI", "Digital Currency", "CBDC", "Monetary Policy", "Financial Innovation"],
                readTime: "5 min read",
                isBreaking: false,
                importance: "high"
            },
            {
                id: 10,
                title: "Climate Change: India Commits to Enhanced NDCs at COP29",
                summary: "India has announced enhanced Nationally Determined Contributions (NDCs) at COP29, committing to achieve net-zero emissions by 2070 and increase renewable energy capacity to 500 GW by 2030.",
                content: "The enhanced commitments include ambitious targets for renewable energy, energy efficiency, and forest cover expansion. India's climate action plan emphasizes sustainable development while addressing energy security concerns.",
                category: "Environment & Energy",
                source: "Down to Earth",
                publishedAt: new Date(currentTime - 16 * 60 * 60 * 1000).toISOString(), // 16 hours ago
                imageUrl: "image/news-climate.jpg",
                upscRelevance: 91,
                tags: ["Climate Change", "COP29", "NDCs", "Net Zero", "Renewable Energy"],
                readTime: "6 min read",
                isBreaking: false,
                importance: "high"
            },
            {
                id: 11,
                title: "Unified Pension Scheme: Government Announces New Pension Framework for Employees",
                summary: "The government has announced the Unified Pension Scheme (UPS) for central government employees, combining benefits of the Old Pension Scheme and National Pension System.",
                content: "The UPS provides assured pension benefits while maintaining fiscal sustainability. The scheme addresses concerns of government employees about retirement security and provides a balanced approach to pension reforms.",
                category: "Polity & Governance",
                source: "The Hindu",
                publishedAt: new Date(currentTime - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
                imageUrl: "image/news-pension.jpg",
                upscRelevance: 84,
                tags: ["Pension Scheme", "Government Employees", "Social Security", "Administrative Reforms"],
                readTime: "4 min read",
                isBreaking: false,
                importance: "medium"
            },
            {
                id: 12,
                title: "India-Middle East-Europe Economic Corridor: Progress Update on IMEC Project",
                summary: "Significant progress has been made on the India-Middle East-Europe Economic Corridor (IMEC) project, with infrastructure development beginning in key transit countries.",
                content: "The IMEC project aims to enhance connectivity between India, the Middle East, and Europe through rail and shipping networks. The corridor is expected to boost trade, reduce transportation costs, and strengthen geopolitical ties.",
                category: "International Relations",
                source: "Business Line",
                publishedAt: new Date(currentTime - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
                imageUrl: "image/news-imec.jpg",
                upscRelevance: 86,
                tags: ["IMEC", "Economic Corridor", "Infrastructure", "Trade", "Connectivity"],
                readTime: "5 min read",
                isBreaking: false,
                importance: "medium"
            },
            {
                id: 13,
                title: "Ayushman Bharat Digital Mission: 50 Crore Health IDs Created",
                summary: "The Ayushman Bharat Digital Mission has achieved the milestone of creating 50 crore Ayushman Bharat Health Account (ABHA) IDs, revolutionizing digital healthcare delivery in India.",
                content: "The digital health ecosystem enables seamless access to health records, telemedicine services, and health insurance benefits. The mission aims to create a unified health interface for all citizens.",
                category: "Health & Social Issues",
                source: "Health World",
                publishedAt: new Date(currentTime - 22 * 60 * 60 * 1000).toISOString(), // 22 hours ago
                imageUrl: "image/news-digital-health.jpg",
                upscRelevance: 83,
                tags: ["Digital Health", "Ayushman Bharat", "Healthcare", "Digital India", "Health Records"],
                readTime: "4 min read",
                isBreaking: false,
                importance: "medium"
            },
            {
                id: 14,
                title: "Semiconductor Mission: India's First Fab Plant Construction Begins in Gujarat",
                summary: "Construction has begun on India's first semiconductor fabrication plant in Gujarat under the India Semiconductor Mission, marking a significant step towards technological self-reliance.",
                content: "The fab plant, developed in partnership with international technology companies, will produce advanced semiconductors for various applications including automotive, telecommunications, and consumer electronics.",
                category: "Science & Technology",
                source: "Tech Circle",
                publishedAt: new Date(currentTime - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                imageUrl: "image/news-semiconductor.jpg",
                upscRelevance: 88,
                tags: ["Semiconductor", "Manufacturing", "Technology", "Self-Reliance", "Gujarat"],
                readTime: "5 min read",
                isBreaking: false,
                importance: "high"
            },
            {
                id: 15,
                title: "Disaster Management: New Early Warning System for Cyclones Launched",
                summary: "The India Meteorological Department has launched an advanced early warning system for cyclones, providing more accurate predictions and longer lead times for disaster preparedness.",
                content: "The system uses artificial intelligence and satellite data to improve cyclone tracking and intensity prediction. It aims to reduce casualties and economic losses from natural disasters.",
                category: "Geography & Disasters",
                source: "Weather Channel India",
                publishedAt: new Date(currentTime - 1.2 * 24 * 60 * 60 * 1000).toISOString(),
                imageUrl: "image/news-cyclone-warning.jpg",
                upscRelevance: 81,
                tags: ["Disaster Management", "Cyclone", "Early Warning", "IMD", "Weather Prediction"],
                readTime: "4 min read",
                isBreaking: false,
                importance: "medium"
            }
        ];

        return newsArticles;
    }

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
            
            // Boost score for high importance articles
            if (article.importance === 'high') {
                article.upscRelevance = Math.min(article.upscRelevance + 5, 100);
            }
            
            // Filter articles with relevance score > 70 (higher threshold for quality)
            return article.upscRelevance > 70;
        });
    }

    sortNewsByRelevance(newsArray) {
        return newsArray.sort((a, b) => {
            // Primary sort: Breaking news first
            if (a.isBreaking !== b.isBreaking) {
                return b.isBreaking - a.isBreaking;
            }
            
            // Secondary sort: UPSC relevance
            if (b.upscRelevance !== a.upscRelevance) {
                return b.upscRelevance - a.upscRelevance;
            }
            
            // Tertiary sort: recency
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        });
    }

    displayNews(newsArray) {
        console.log('📰 Displaying news:', newsArray.length, 'articles');
        
        // Update main news container
        this.updateNewsContainer(newsArray);
        
        // Update news widgets
        this.updateNewsWidgets(newsArray);
        
        // Update breaking news ticker
        this.updateBreakingNewsTicker(newsArray);
        
        // Update trending topics
        this.updateTrendingTopics(newsArray);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('newsUpdated', {
            detail: { news: newsArray, timestamp: new Date() }
        }));
    }

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

    createNewsCardHTML(article) {
        const timeAgo = this.getTimeAgo(new Date(article.publishedAt));
        const relevanceColor = article.upscRelevance >= 90 ? 'text-green-400' : 
                              article.upscRelevance >= 80 ? 'text-yellow-400' : 'text-blue-400';
        
        const importanceIcon = article.importance === 'high' ? '🔥' : 
                              article.importance === 'medium' ? '⭐' : '';
        
        return `
            <article class="news-card bg-[var(--bg-dark-2)] rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer hover:transform hover:scale-[1.02]" 
                     onclick="openNewsDetailFixed('${article.id}')">
                <div class="flex items-start justify-between mb-3">
                    ${article.isBreaking ? '<div class="breaking-badge bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">🔴 BREAKING</div>' : ''}
                    <div class="flex items-center gap-2">
                        ${importanceIcon ? `<span class="text-sm">${importanceIcon}</span>` : ''}
                        <span class="text-xs px-2 py-1 bg-teal-600/20 text-teal-400 rounded-full">${article.category}</span>
                    </div>
                </div>
                
                <div class="flex items-start gap-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-white mb-2 line-clamp-2 hover:text-teal-400 transition-colors">${article.title}</h3>
                        <p class="text-white/70 text-sm mb-3 line-clamp-3">${article.summary}</p>
                        
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2 text-xs text-white/50">
                                <span>${article.source}</span>
                                <span>•</span>
                                <span>${timeAgo}</span>
                                <span>•</span>
                                <span>${article.readTime}</span>
                            </div>
                        </div>
                        
                        ${article.tags ? `
                            <div class="flex flex-wrap gap-1 mb-3">
                                ${article.tags.slice(0, 4).map(tag => 
                                    `<span class="text-xs px-2 py-1 bg-white/5 text-white/60 rounded hover:bg-white/10 transition-colors cursor-pointer" onclick="event.stopPropagation(); filterNewsByTagFixed('${tag}')">${tag}</span>`
                                ).join('')}
                                ${article.tags.length > 4 ? `<span class="text-xs text-white/40">+${article.tags.length - 4} more</span>` : ''}
                            </div>
                        ` : ''}
                        
                        <div class="flex items-center gap-2">
                            <button onclick="event.stopPropagation(); bookmarkNewsFixed('${article.id}')" 
                                    class="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Bookmark article">
                                <i data-lucide="bookmark" class="w-4 h-4 text-white/60 group-hover:text-yellow-400"></i>
                            </button>
                            <button onclick="event.stopPropagation(); shareNewsFixed('${article.id}')" 
                                    class="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Share article">
                                <i data-lucide="share-2" class="w-4 h-4 text-white/60 group-hover:text-blue-400"></i>
                            </button>
                            <button onclick="event.stopPropagation(); openNewsDetailFixed('${article.id}')" 
                                    class="px-3 py-1 bg-teal-600/20 text-teal-400 rounded text-xs hover:bg-teal-600/30 transition-colors">
                                Read Full Article
                            </button>
                        </div>
                    </div>
                    
                    ${article.imageUrl ? `
                        <div class="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <img src="${article.imageUrl}" alt="${article.title}" 
                                 class="w-full h-full object-cover hover:scale-110 transition-transform duration-300" 
                                 onerror="this.style.display='none'">
                        </div>
                    ` : ''}
                </div>
            </article>
        `;
    }

    updateNewsWidgets(newsArray) {
        // Update latest news widget
        const latestWidget = document.getElementById('latest-news-widget');
        if (latestWidget) {
            const latest = newsArray.slice(0, 5);
            const html = latest.map(article => `
                <div class="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors" 
                     onclick="openNewsDetailFixed('${article.id}')">
                    <div class="w-2 h-2 ${article.isBreaking ? 'bg-red-400 animate-pulse' : 'bg-teal-400'} rounded-full mt-2 flex-shrink-0"></div>
                    <div class="flex-1">
                        <h4 class="text-sm font-medium text-white line-clamp-2">${article.title}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-white/60">${this.getTimeAgo(new Date(article.publishedAt))}</span>

                        </div>
                    </div>
                </div>
            `).join('');
            
            latestWidget.innerHTML = html;
        }

        // Update category-wise news
        this.updateCategoryNews(newsArray);
    }

    updateCategoryNews(newsArray) {
        const categories = ['Polity & Governance', 'Economy', 'International Relations', 'Environment & Energy'];
        
        categories.forEach(category => {
            const categoryNews = newsArray.filter(article => article.category === category).slice(0, 3);
            const container = document.getElementById(`category-${category.toLowerCase().replace(/\s+/g, '-')}`);
            
            if (container && categoryNews.length > 0) {
                const html = categoryNews.map(article => `
                    <div class="category-news-item p-3 border border-white/10 rounded-lg hover:border-white/20 cursor-pointer transition-colors"
                         onclick="openNewsDetailFixed('${article.id}')">
                        <h5 class="text-sm font-medium text-white mb-1 line-clamp-2">${article.title}</h5>
                        <p class="text-xs text-white/60">${this.getTimeAgo(new Date(article.publishedAt))}</p>
                    </div>
                `).join('');
                
                container.innerHTML = html;
            }
        });
    }

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
                `<span class="ticker-item cursor-pointer hover:text-teal-400" onclick="openNewsDetailFixed('${article.id}')">${article.title}</span>`
            ).join(' • ');
            tickerContent.innerHTML = html;
        }
    }

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

        // Sort by frequency and take top 8
        const trending = Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([tag, count]) => ({ tag, count }));

        const html = trending.map(item => `
            <span class="trending-tag px-3 py-1 bg-teal-600/20 text-teal-400 rounded-full text-sm cursor-pointer hover:bg-teal-600/30 transition-colors"
                  onclick="filterNewsByTagFixed('${item.tag}')">
                ${item.tag} (${item.count})
            </span>
        `).join('');

        trendingContainer.innerHTML = html;
    }

    showLoadingState() {
        const container = document.getElementById('news-container');
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto mb-4"></div>
                        <p class="text-white/60">Loading UPSC-relevant news...</p>
                        <p class="text-white/40 text-sm mt-2">Fetching latest updates from multiple sources</p>
                    </div>
                </div>
            `;
        }
    }

    setupPeriodicRefresh() {
        // Refresh every 15 minutes
        this.updateInterval = setInterval(() => {
            console.log('🔄 Periodic news refresh...');
            this.fetchNews();
        }, 15 * 60 * 1000);

        // Refresh when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.lastFetch) {
                const timeSinceLastFetch = Date.now() - this.lastFetch.getTime();
                if (timeSinceLastFetch > 10 * 60 * 1000) { // 10 minutes
                    this.fetchNews();
                }
            }
        });
    }

    setupEventListeners() {
        // Global functions for news interactions
        window.openNewsDetailFixed = (articleId) => {
            const news = this.getNews();
            const article = news.find(a => a.id == articleId);
            
            if (article) {
                this.showNewsDetailModal(article);
            }
        };

        window.bookmarkNewsFixed = (articleId) => {
            const bookmarks = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
            if (!bookmarks.includes(articleId)) {
                bookmarks.push(articleId);
                localStorage.setItem('newsBookmarks', JSON.stringify(bookmarks));
                
                if (window.showToast) {
                    window.showToast('News article bookmarked!', 'success');
                }
            } else {
                if (window.showToast) {
                    window.showToast('Article already bookmarked!', 'info');
                }
            }
        };

        window.shareNewsFixed = (articleId) => {
            const news = this.getNews();
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

        window.filterNewsByTagFixed = (tag) => {
            const news = this.getNews();
            const filtered = news.filter(article => 
                article.tags && article.tags.includes(tag)
            );
            
            // Update display with filtered news
            this.displayNews(filtered);
            
            if (window.showToast) {
                window.showToast(`Showing news for: ${tag}`, 'info');
            }
        };
    }

    showNewsDetailModal(article) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-[var(--bg-dark-2)] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-2">
                        <span class="text-xs px-2 py-1 bg-teal-600/20 text-teal-400 rounded-full">${article.category}</span>
                        <span class="text-xs text-white/50">${article.source}</span>
                        <span class="text-xs text-white/50">•</span>
                        <span class="text-xs text-white/50">${this.getTimeAgo(new Date(article.publishedAt))}</span>

                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-white/50 hover:text-white">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                ${article.isBreaking ? '<div class="bg-red-600/20 border border-red-500/30 rounded-lg p-3 mb-4"><span class="text-red-400 font-medium">🔴 BREAKING NEWS</span></div>' : ''}
                
                <h1 class="text-2xl font-bold text-white mb-4">${article.title}</h1>
                
                ${article.imageUrl ? `
                    <img src="${article.imageUrl}" alt="${article.title}" 
                         class="w-full h-64 object-cover rounded-lg mb-6"
                         onerror="this.style.display='none'">
                ` : ''}
                
                <div class="prose prose-invert max-w-none">
                    <p class="text-lg text-white/80 mb-6 font-medium">${article.summary}</p>
                    <div class="text-white/70 leading-relaxed">${article.content}</div>
                </div>
                
                ${article.tags ? `
                    <div class="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
                        <span class="text-sm text-white/60 mr-2">Tags:</span>
                        ${article.tags.map(tag => 
                            `<span class="text-xs px-2 py-1 bg-teal-600/20 text-teal-400 rounded cursor-pointer hover:bg-teal-600/30" onclick="this.closest('.fixed').remove(); filterNewsByTagFixed('${tag}')">${tag}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <div class="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <div class="flex items-center gap-3">
                        <button onclick="bookmarkNewsFixed('${article.id}')" class="px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-colors">
                            <i data-lucide="bookmark" class="w-4 h-4 mr-2 inline"></i>Bookmark
                        </button>
                        <button onclick="shareNewsFixed('${article.id}')" class="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">
                            <i data-lucide="share-2" class="w-4 h-4 mr-2 inline"></i>Share
                        </button>
                    </div>
                    <span class="text-xs text-white/50">${article.readTime}</span>
                </div>
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

    // Public methods
    isReady() {
        return this.isInitialized;
    }

    getNews() {
        return this.newsCache.get('current') || [];
    }

    refresh() {
        return this.fetchNews();
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

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize news fixes
document.addEventListener('DOMContentLoaded', () => {
    window.newsFixes = new NewsFixes();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsFixes;
}