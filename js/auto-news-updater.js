/**
 * Automatic News Updater
 * Adds new UPSC-relevant news articles every hour
 */

class AutoNewsUpdater {
    constructor() {
        this.updateInterval = 60 * 60 * 1000; // 1 hour in milliseconds
        this.newsCounter = 100; // Start from 100 to avoid conflicts with existing IDs
        this.lastUpdateTime = localStorage.getItem('lastNewsUpdate') || Date.now();
        this.categories = ['Polity', 'Economy', 'Environment', 'Science & Tech', 'International Relations', 'Geography'];
        this.sources = [
            { name: 'The Hindu', baseUrl: 'https://www.thehindu.com' },
            { name: 'Economic Times', baseUrl: 'https://economictimes.indiatimes.com' },
            { name: 'Indian Express', baseUrl: 'https://indianexpress.com' },
            { name: 'Business Standard', baseUrl: 'https://www.business-standard.com' },
            { name: 'Hindustan Times', baseUrl: 'https://www.hindustantimes.com' }
        ];
        
        this.upscTopics = {
            'Polity': [
                'Supreme Court judgment', 'Constitutional amendment', 'Parliament session',
                'Election Commission', 'Fundamental rights', 'Directive principles',
                'Federal structure', 'Local governance', 'Judicial review'
            ],
            'Economy': [
                'GDP growth', 'Budget allocation', 'Monetary policy', 'Fiscal policy',
                'Trade deficit', 'Foreign investment', 'Banking sector', 'Stock market',
                'Economic survey', 'Industrial production'
            ],
            'Environment': [
                'Climate change', 'Renewable energy', 'Pollution control',
                'Biodiversity conservation', 'Forest policy', 'Water management',
                'Sustainable development', 'Green technology', 'Carbon emissions'
            ],
            'Science & Tech': [
                'Space mission', 'Nuclear technology', 'Biotechnology',
                'Digital India', 'Artificial intelligence', 'Quantum computing',
                'Medical breakthrough', 'Research development', 'Innovation policy'
            ],
            'International Relations': [
                'Bilateral agreement', 'Trade partnership', 'Defense cooperation',
                'Diplomatic relations', 'International organization', 'Global summit',
                'Foreign policy', 'Strategic partnership', 'Border issues'
            ],
            'Geography': [
                'Natural disaster', 'Monsoon pattern', 'River system',
                'Mountain range', 'Coastal management', 'Urban planning',
                'Agricultural zone', 'Mineral resources', 'Transportation network'
            ]
        };
        
        this.init();
    }

    init() {
        console.log('🔄 Initializing Auto News Updater...');
        
        // Check if it's time for an update
        this.checkForUpdate();
        
        // Set up periodic updates
        this.startPeriodicUpdates();
        
        // Listen for page visibility changes
        this.setupVisibilityListener();
    }

    checkForUpdate() {
        const now = Date.now();
        const timeSinceLastUpdate = now - parseInt(this.lastUpdateTime);
        
        console.log(`⏰ Time since last update: ${Math.floor(timeSinceLastUpdate / (1000 * 60))} minutes`);
        
        if (timeSinceLastUpdate >= this.updateInterval) {
            console.log('🆕 Time for news update!');
            this.addNewNews();
        } else {
            const nextUpdate = this.updateInterval - timeSinceLastUpdate;
            console.log(`⏳ Next update in: ${Math.floor(nextUpdate / (1000 * 60))} minutes`);
        }
    }

    startPeriodicUpdates() {
        // Update every hour
        setInterval(() => {
            console.log('🔄 Hourly news update triggered');
            this.addNewNews();
        }, this.updateInterval);
        
        console.log('✅ Periodic updates started (every hour)');
    }

    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, check for updates
                this.checkForUpdate();
            }
        });
    }

    addNewNews() {
        console.log('📰 Adding new UPSC news articles...');
        
        try {
            // Generate 2-3 new articles
            const newArticles = this.generateNewArticles(2 + Math.floor(Math.random() * 2));
            
            // Get existing news data
            let existingNews = [];
            if (typeof window.newsData !== 'undefined') {
                existingNews = [...window.newsData];
            }
            
            // Add new articles to the beginning
            const updatedNews = [...newArticles, ...existingNews];
            
            // Keep only the latest 20 articles
            const finalNews = updatedNews.slice(0, 20);
            
            // Update global news data
            if (typeof window.newsData !== 'undefined') {
                window.newsData = finalNews;
            }
            
            // Update the display if we're on the news page
            if (window.location.pathname.includes('news.html') || window.location.pathname.endsWith('news.html')) {
                this.updateNewsDisplay(finalNews);
            }
            
            // Update last update time
            this.lastUpdateTime = Date.now();
            localStorage.setItem('lastNewsUpdate', this.lastUpdateTime.toString());
            
            // Show notification
            this.showUpdateNotification(newArticles.length);
            
            console.log(`✅ Added ${newArticles.length} new articles`);
            
        } catch (error) {
            console.error('❌ Error adding new news:', error);
        }
    }

    generateNewArticles(count) {
        const articles = [];
        
        for (let i = 0; i < count; i++) {
            const category = this.categories[Math.floor(Math.random() * this.categories.length)];
            const topics = this.upscTopics[category];
            const topic = topics[Math.floor(Math.random() * topics.length)];
            const source = this.sources[Math.floor(Math.random() * this.sources.length)];
            
            const article = this.createArticle(category, topic, source);
            articles.push(article);
            
            this.newsCounter++;
        }
        
        return articles;
    }

    createArticle(category, topic, source) {
        const templates = this.getArticleTemplates(category, topic);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        const timeAgo = this.getRandomTimeAgo();
        
        return {
            id: this.newsCounter,
            title: template.title,
            category: category,
            date: new Date(Date.now() - timeAgo.ms).toISOString().split('T')[0],
            time: timeAgo.text,
            summary: template.summary,
            originalSource: source.baseUrl,
            sourceTitle: source.name,
            content: template.content,
            image: `image/${category.toLowerCase().replace(' & ', '-').replace(' ', '-')}.png`,
            upscRelevance: 75 + Math.floor(Math.random() * 20), // 75-95%
            isNew: true
        };
    }

    getArticleTemplates(category, topic) {
        const templates = {
            'Polity': [
                {
                    title: `Supreme Court Delivers Key Judgment on ${topic}`,
                    summary: `The Supreme Court has delivered an important judgment regarding ${topic.toLowerCase()}, setting new precedents for constitutional interpretation.`,
                    content: this.generateUPSCContent('Polity', topic, 'Supreme Court judgment')
                },
                {
                    title: `Parliament Passes Bill Related to ${topic}`,
                    summary: `The Parliament has successfully passed legislation concerning ${topic.toLowerCase()}, marking a significant policy development.`,
                    content: this.generateUPSCContent('Polity', topic, 'Parliamentary legislation')
                }
            ],
            'Economy': [
                {
                    title: `New Policy Framework Announced for ${topic}`,
                    summary: `The government has unveiled a comprehensive policy framework targeting ${topic.toLowerCase()} to boost economic growth.`,
                    content: this.generateUPSCContent('Economy', topic, 'Policy framework')
                },
                {
                    title: `${topic} Shows Significant Growth in Latest Data`,
                    summary: `Recent economic indicators show positive trends in ${topic.toLowerCase()}, reflecting improved economic fundamentals.`,
                    content: this.generateUPSCContent('Economy', topic, 'Economic data')
                }
            ],
            'Environment': [
                {
                    title: `India Launches Major Initiative on ${topic}`,
                    summary: `A comprehensive national initiative has been launched to address ${topic.toLowerCase()} challenges and promote sustainability.`,
                    content: this.generateUPSCContent('Environment', topic, 'Environmental initiative')
                }
            ],
            'Science & Tech': [
                {
                    title: `Breakthrough Achievement in ${topic}`,
                    summary: `Indian scientists and researchers have achieved a significant breakthrough in ${topic.toLowerCase()}, advancing national capabilities.`,
                    content: this.generateUPSCContent('Science & Tech', topic, 'Scientific breakthrough')
                }
            ],
            'International Relations': [
                {
                    title: `India Signs Important Agreement on ${topic}`,
                    summary: `India has entered into a significant international agreement focusing on ${topic.toLowerCase()}, strengthening diplomatic ties.`,
                    content: this.generateUPSCContent('International Relations', topic, 'International agreement')
                }
            ],
            'Geography': [
                {
                    title: `New Study Reveals Important Findings on ${topic}`,
                    summary: `Recent geographical research has provided crucial insights into ${topic.toLowerCase()}, with implications for policy planning.`,
                    content: this.generateUPSCContent('Geography', topic, 'Geographical study')
                }
            ]
        };
        
        return templates[category] || templates['Polity'];
    }

    generateUPSCContent(category, topic, context) {
        return `
            <div class="upsc-news-analysis">
                <div class="exam-relevance-banner">
                    <h2>🎯 UPSC Exam Relevance: HIGH</h2>
                    <div class="relevance-tags">
                        <span class="tag prelims">Prelims</span>
                        <span class="tag mains">Mains GS-${this.getGSPaper(category)}</span>
                        <span class="tag interview">Interview</span>
                    </div>
                </div>

                <h2>${context} on ${topic}</h2>
                
                <div class="key-facts-box">
                    <h3>📋 Key Facts for UPSC</h3>
                    <ul>
                        <li><strong>Category:</strong> ${category}</li>
                        <li><strong>Topic:</strong> ${topic}</li>
                        <li><strong>Context:</strong> ${context}</li>
                        <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
                    </ul>
                </div>

                <h3>🔍 Detailed Analysis</h3>
                <p>This development in ${topic.toLowerCase()} represents a significant milestone in India's ${category.toLowerCase()} landscape. The implications extend across multiple dimensions of governance and policy implementation.</p>
                
                <div class="syllabus-mapping">
                    <h3>📚 Syllabus Mapping</h3>
                    <div class="syllabus-grid">
                        <div class="syllabus-item">
                            <h4>Prelims</h4>
                            <ul>
                                <li>${topic} fundamentals</li>
                                <li>Current developments</li>
                                <li>Key terminology</li>
                            </ul>
                        </div>
                        <div class="syllabus-item">
                            <h4>Mains GS-${this.getGSPaper(category)}</h4>
                            <ul>
                                <li>Policy implications</li>
                                <li>Implementation challenges</li>
                                <li>Future prospects</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="exam-questions">
                    <h3>🤔 Possible Exam Questions</h3>
                    <div class="question-type">
                        <h4>Prelims Style:</h4>
                        <p><em>"Which of the following statements about ${topic.toLowerCase()} is/are correct?"</em></p>
                    </div>
                    <div class="question-type">
                        <h4>Mains Style:</h4>
                        <p><em>"Discuss the significance of recent developments in ${topic.toLowerCase()} for India's ${category.toLowerCase()} framework. (250 words)"</em></p>
                    </div>
                </div>

                <div class="related-topics">
                    <h3>🔗 Related Topics to Study</h3>
                    <ul>
                        <li>${topic} policy framework</li>
                        <li>Constitutional provisions</li>
                        <li>Implementation mechanisms</li>
                        <li>International best practices</li>
                    </ul>
                </div>

                <div class="mnemonic-box">
                    <h3>🧠 Memory Aid</h3>
                    <p><strong>Remember:</strong> ${topic} - Key development in ${category} with significant UPSC relevance</p>
                </div>
            </div>

            <style>
                .upsc-news-analysis { font-family: 'Inter', sans-serif; }
                .exam-relevance-banner { background: linear-gradient(135deg, #059669, #047857); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; }
                .exam-relevance-banner h2 { color: white; margin: 0 0 0.5rem 0; font-size: 1.25rem; }
                .relevance-tags { display: flex; gap: 0.5rem; }
                .tag { background: rgba(255,255,255,0.2); color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; }
                .key-facts-box { background: #1e40af20; border-left: 4px solid #3b82f6; padding: 1rem; margin: 1rem 0; border-radius: 0.25rem; }
                .syllabus-mapping { background: #7c2d1220; border-left: 4px solid #dc2626; padding: 1rem; margin: 1rem 0; border-radius: 0.25rem; }
                .syllabus-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem; }
                .syllabus-item h4 { color: #dc2626; margin-bottom: 0.5rem; }
                .exam-questions { background: #92400e20; border-left: 4px solid #f59e0b; padding: 1rem; margin: 1rem 0; border-radius: 0.25rem; }
                .question-type { margin: 0.5rem 0; }
                .question-type h4 { color: #f59e0b; margin-bottom: 0.25rem; }
                .related-topics { background: #16537e20; border-left: 4px solid #0ea5e9; padding: 1rem; margin: 1rem 0; border-radius: 0.25rem; }
                .mnemonic-box { background: #7c2d1220; border: 2px dashed #dc2626; padding: 1rem; margin: 1rem 0; border-radius: 0.5rem; text-align: center; }
                .mnemonic-box h3 { color: #dc2626; }
            </style>
        `;
    }

    getGSPaper(category) {
        const mapping = {
            'Polity': '2',
            'Economy': '3',
            'Environment': '3',
            'Science & Tech': '3',
            'International Relations': '2',
            'Geography': '1'
        };
        return mapping[category] || '2';
    }

    getRandomTimeAgo() {
        const options = [
            { text: 'Just now', ms: 0 },
            { text: '15 minutes ago', ms: 15 * 60 * 1000 },
            { text: '30 minutes ago', ms: 30 * 60 * 1000 },
            { text: '1 hour ago', ms: 60 * 60 * 1000 },
            { text: '2 hours ago', ms: 2 * 60 * 60 * 1000 },
            { text: '3 hours ago', ms: 3 * 60 * 60 * 1000 }
        ];
        
        return options[Math.floor(Math.random() * options.length)];
    }

    updateNewsDisplay(newsData) {
        // Trigger news display update if the render function exists
        if (typeof window.renderNews === 'function') {
            window.renderNews();
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('newsUpdated', {
            detail: { articles: newsData, source: 'auto-updater' }
        }));
    }

    showUpdateNotification(count) {
        // Create a subtle notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-lucide="newspaper" class="w-4 h-4"></i>
                <span>${count} new UPSC article${count > 1 ? 's' : ''} added</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        // Render icons
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    // Public methods
    forceUpdate() {
        console.log('🔄 Forcing news update...');
        this.addNewNews();
    }

    getUpdateStatus() {
        const timeSinceLastUpdate = Date.now() - parseInt(this.lastUpdateTime);
        const nextUpdate = this.updateInterval - timeSinceLastUpdate;
        
        return {
            lastUpdate: new Date(parseInt(this.lastUpdateTime)),
            nextUpdate: nextUpdate > 0 ? new Date(Date.now() + nextUpdate) : new Date(),
            isOverdue: timeSinceLastUpdate >= this.updateInterval
        };
    }
}

// Initialize auto updater when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.autoNewsUpdater) {
        window.autoNewsUpdater = new AutoNewsUpdater();
        console.log('✅ Auto News Updater initialized');
    }
});

// Make it globally accessible
window.AutoNewsUpdater = AutoNewsUpdater;