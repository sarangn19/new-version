/**
 * Dashboard Fixes - Comprehensive fixes for dashboard loading and functionality issues
 */

class DashboardFixes {
    constructor() {
        this.isInitialized = false;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.init();
    }

    async init() {
        console.log('🔧 Initializing Dashboard Fixes...');
        
        try {
            // Wait for DOM to be ready
            await this.waitForDOM();
            
            // Fix dashboard loading
            this.fixDashboardLoading();
            
            // Fix daily challenge
            this.fixDailyChallenge();
            
            // Fix rapid flashcards
            this.fixRapidFlashcards();
            
            // Fix recent conversations
            this.fixRecentConversations();
            
            // Initialize components
            this.initializeComponents();
            
            this.isInitialized = true;
            console.log('✅ Dashboard Fixes initialized successfully');
            
        } catch (error) {
            console.error('❌ Dashboard Fixes initialization failed:', error);
            this.retryInitialization();
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

    fixDashboardLoading() {
        console.log('🔧 Fixing dashboard loading...');
        
        // Ensure all dashboard components load properly
        const checkAndLoadComponents = () => {
            // Check if main elements exist
            const mainContent = document.getElementById('main-content');
            const contentGrid = document.getElementById('content-grid');
            const filterChips = document.getElementById('filter-chips');
            
            if (!mainContent || !contentGrid || !filterChips) {
                console.warn('⚠️ Some dashboard elements missing, retrying...');
                setTimeout(checkAndLoadComponents, 1000);
                return;
            }

            // Force render content if not already rendered
            if (contentGrid.children.length === 0) {
                console.log('🔄 Force rendering dashboard content...');
                this.forceRenderContent();
            }

            // Force render filter chips if not already rendered
            if (filterChips.children.length === 0) {
                console.log('🔄 Force rendering filter chips...');
                this.forceRenderFilterChips();
            }

            // Initialize dashboard data
            this.initializeDashboardData();
        };

        // Start checking immediately and retry if needed
        checkAndLoadComponents();
        
        // Also check after a delay in case of slow loading
        setTimeout(checkAndLoadComponents, 2000);
    }

    forceRenderContent() {
        const contentGrid = document.getElementById('content-grid');
        if (!contentGrid) return;

        // Sample content data
        const contentData = [
            {
                id: 1,
                title: "Indian Constitution - Fundamental Rights",
                description: "Comprehensive study material covering Articles 12-35 of the Indian Constitution, including fundamental rights, their scope, limitations, and landmark judgments.",
                date: "Dec 15, 2024",
                tag: "Revision",
                imageUrl: "image/constitution.jpg",
                bookmarked: false
            },
            {
                id: 2,
                title: "Economic Survey 2024 - Key Highlights",
                description: "Analysis of India's economic performance, growth projections, sectoral developments, and policy recommendations from Economic Survey 2024.",
                date: "Dec 14, 2024",
                tag: "New",
                imageUrl: "image/economy.jpg",
                bookmarked: true
            },
            {
                id: 3,
                title: "Environment & Climate Change",
                description: "Current environmental challenges, climate policies, international agreements, and India's commitments to sustainable development goals.",
                date: "Dec 13, 2024",
                tag: "Mock Test",
                imageUrl: "image/environment.jpg",
                bookmarked: false
            },
            {
                id: 4,
                title: "Modern History - Freedom Struggle",
                description: "Detailed coverage of India's independence movement, key personalities, major events, and their impact on contemporary India.",
                date: "Dec 12, 2024",
                tag: "Unattempted",
                imageUrl: "image/history.jpg",
                bookmarked: false
            }
        ];

        const html = contentData.map(item => this.createContentCardHTML(item)).join('');
        contentGrid.innerHTML = html;

        // Refresh icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        console.log('✅ Dashboard content rendered');
    }

    createContentCardHTML(item) {
        const bookmarkIcon = item.bookmarked ? 'bookmark' : 'bookmark-plus';
        const bookmarkColor = item.bookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-white/50';
        const tagColor = item.tag === 'Revision' ? 'text-red-400' : 
                        (item.tag === 'Mock Test' ? 'text-blue-400' : 'text-teal-400');

        return `
            <article class="content-card-group bg-[var(--bg-dark-2)] rounded-2xl overflow-hidden shadow-xl relative pb-6 transition duration-300 hover:shadow-2xl" 
                     aria-labelledby="content-title-${item.id}"> 
                <div class="h-32 rounded-t-2xl border-b border-gray-700 overflow-hidden">
                    <img src="${item.imageUrl}" 
                         onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pgo8L3N2Zz4K';" 
                         alt="${item.title} illustration" 
                         class="w-full h-full object-cover">
                </div>

                <div class="px-4 space-y-1 pt-3">
                    <div class="space-y-1">
                        <h4 id="content-title-${item.id}" class="text-sm font-normal leading-tight text-white">${item.title}</h4>
                        <p class="montserrat text-xs font-normal leading-4 text-white/70">Uploaded on ${item.date}</p>
                    </div>
                    <p class="roboto text-xs font-light leading-snug h-14 overflow-hidden text-white/70" aria-hidden="true">
                        ${item.description}
                    </p>
                    <div class="pt-2">
                        <span class="font-medium text-sm leading-snug ${tagColor}" aria-label="Tag: ${item.tag}">${item.tag}</span>
                    </div>
                </div>

                <!-- Bookmark Button -->
                <button onclick="toggleBookmarkFixed(${item.id}, this)" 
                        aria-pressed="${item.bookmarked ? 'true' : 'false'}" 
                        aria-label="${item.bookmarked ? 'Remove bookmark' : 'Add bookmark'} for ${item.title}" 
                        class="bookmark-btn absolute top-3 right-3 min-w-[44px] min-h-[44px] w-11 h-11 bg-[var(--bg-dark-1)] rounded-full flex items-center justify-center shadow-lg z-20 transition hover:bg-gray-700">
                    <span class="sr-only">${item.bookmarked ? 'Remove bookmark' : 'Add bookmark'} for ${item.title}</span>
                    <i data-lucide="${bookmarkIcon}" class="${bookmarkColor} w-5 h-5 transition duration-300" aria-hidden="true"></i>
                </button>
                
                <!-- Arrow Button -->
                <button aria-label="Open ${item.title}" 
                        onclick="openContentFixed(${item.id})"
                        class="absolute bottom-6 right-6 min-w-[44px] min-h-[44px] w-12 h-12 bg-[var(--bg-dark-1)] rounded-full flex items-center justify-center shadow-xl z-10 transition-all duration-300 group-hover:scale-110 group-hover:bg-gray-700">
                    <i data-lucide="arrow-right" class="text-white w-5 h-5 transition duration-300 group-hover:rotate-45" aria-hidden="true"></i>
                </button>
            </article>
        `;
    }

    forceRenderFilterChips() {
        const chipsContainer = document.getElementById('filter-chips');
        if (!chipsContainer) return;

        const filters = ['All', 'Recent', 'Unattempted', 'Revision', 'Mock Test'];
        const currentFilter = 'All';

        chipsContainer.innerHTML = filters.map(filter => {
            const isActive = filter === currentFilter;
            const classes = isActive
                ? 'bg-teal-600 hover:bg-teal-700 px-3 py-1 text-xs font-medium rounded-full shadow-md transition text-white'
                : 'bg-gray-700/70 border border-white/10 px-3 py-1 text-xs text-white/80 rounded-full transition hover:bg-gray-700';

            return `
                <button onclick="setActiveFilterFixed('${filter}')" class="${classes}">
                    ${filter}
                </button>
            `;
        }).join('');

        console.log('✅ Filter chips rendered');
    }

    fixDailyChallenge() {
        console.log('🔧 Fixing daily challenge...');
        
        const dailyQuizWidget = document.getElementById('daily-quiz-widget');
        if (!dailyQuizWidget) {
            console.warn('Daily quiz widget not found');
            return;
        }

        // Sample MCQ data
        const dailyChallenge = {
            mcqs: [
                {
                    question: "Which Article of the Indian Constitution deals with the Right to Equality?",
                    options: ["Article 14", "Article 15", "Article 16", "All of the above"],
                    answerIndex: 3,
                    explanation: "Articles 14, 15, and 16 all deal with different aspects of the Right to Equality. Article 14 provides equality before law, Article 15 prohibits discrimination, and Article 16 ensures equality of opportunity in public employment."
                },
                {
                    question: "The Economic Survey is presented by which ministry?",
                    options: ["Ministry of Finance", "Ministry of Commerce", "NITI Aayog", "RBI"],
                    answerIndex: 0,
                    explanation: "The Economic Survey is an annual document prepared by the Economic Division of the Department of Economic Affairs, Ministry of Finance, Government of India."
                },
                {
                    question: "Which gas is primarily responsible for global warming?",
                    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
                    answerIndex: 2,
                    explanation: "Carbon dioxide (CO2) is the primary greenhouse gas responsible for global warming, mainly released through burning fossil fuels and deforestation."
                }
            ],
            currentMCQ: 0
        };

        // Store globally for access
        window.dailyChallengeFixed = dailyChallenge;
        window.selectedOptionIndex = null;
        window.quizAttempted = false;
        window.quizCorrect = false;

        this.renderQuizFixed();

        console.log('✅ Daily challenge fixed');
    }

    renderQuizFixed() {
        const optionsContainer = document.getElementById('quiz-options');
        const questionEl = document.getElementById('daily-quiz-question');
        const feedbackDiv = document.getElementById('quiz-feedback');
        const checkBtn = document.getElementById('check-answer-btn');
        const retryBtn = document.getElementById('retry-quiz-btn');
        const nextBtn = document.getElementById('next-question-btn');
        const questionCounter = document.getElementById('question-counter');

        if (!optionsContainer || !questionEl) {
            console.warn('Quiz elements not found');
            return;
        }

        const currentMCQ = window.dailyChallengeFixed.mcqs[window.dailyChallengeFixed.currentMCQ];
        
        // Populate the question text
        questionEl.textContent = currentMCQ.question;
        if (questionCounter) {
            questionCounter.textContent = `Question ${window.dailyChallengeFixed.currentMCQ + 1} of ${window.dailyChallengeFixed.mcqs.length}`;
        }

        optionsContainer.innerHTML = currentMCQ.options.map((option, index) => {
            let classes = 'p-3 rounded-xl cursor-pointer transition duration-200 text-white border border-white/10 inline-flex items-center w-full text-left';
            let ariaChecked = 'false';

            if (window.quizAttempted) {
                if (index === currentMCQ.answerIndex) {
                    classes += ' bg-green-800/50 border-green-500 shadow-md';
                    ariaChecked = 'true';
                } else if (index === window.selectedOptionIndex) {
                    classes += ' bg-red-800/50 border-red-500 shadow-md';
                    ariaChecked = 'true';
                } else {
                    classes += ' bg-gray-700/50';
                }
            } else {
                classes += ' bg-gray-700/50 hover:bg-gray-600/70';
                if (index === window.selectedOptionIndex) {
                    classes += ' border-teal-primary ring-2 ring-teal-primary shadow-lg';
                    ariaChecked = 'true';
                }
            }

            return `
                <button role="radio" tabindex="0" aria-checked="${ariaChecked}" class="${classes}" 
                        onclick="selectQuizOptionFixed(${index})">
                    <span class="text-sm">${String.fromCharCode(65 + index)}. ${option}</span>
                </button>
            `;
        }).join('');

        // Update button states
        if (window.quizAttempted) {
            if (checkBtn) checkBtn.classList.add('hidden');
            if (window.dailyChallengeFixed.currentMCQ < window.dailyChallengeFixed.mcqs.length - 1) {
                if (nextBtn) nextBtn.classList.remove('hidden');
                if (retryBtn) retryBtn.classList.add('hidden');
            } else {
                if (nextBtn) nextBtn.classList.add('hidden');
                if (retryBtn) retryBtn.classList.remove('hidden');
            }
            
            if (feedbackDiv) {
                feedbackDiv.classList.remove('hidden');
                feedbackDiv.innerHTML = `
                    <div class="p-3 rounded-lg ${window.quizCorrect ? 'bg-green-700/30 border-l-4 border-green-500' : 'bg-red-700/30 border-l-4 border-red-500'}">
                        <p class="text-xs font-medium ${window.quizCorrect ? 'text-green-400' : 'text-red-400'}">
                            ${window.quizCorrect ? 'Correct! Excellent work.' : 'Incorrect.'}
                        </p>
                        <p class="text-xs text-white/70 pt-1">${currentMCQ.explanation}</p>
                    </div>
                `;
            }
        } else {
            if (checkBtn) {
                checkBtn.classList.remove('hidden');
                checkBtn.disabled = window.selectedOptionIndex === null;
            }
            if (nextBtn) nextBtn.classList.add('hidden');
            if (retryBtn) retryBtn.classList.add('hidden');
            if (feedbackDiv) feedbackDiv.classList.add('hidden');
        }
    }

    fixRapidFlashcards() {
        console.log('🔧 Fixing rapid flashcards...');
        
        const flashcardCarousel = document.getElementById('flashcard-carousel');
        if (!flashcardCarousel) {
            console.warn('Flashcard carousel not found');
            return;
        }

        // Sample flashcard data
        const flashcards = [
            {
                id: 1,
                front: "What is the basic structure doctrine?",
                back: "The basic structure doctrine is a judicial principle that certain fundamental features of the Constitution cannot be altered by Parliament through constitutional amendments."
            },
            {
                id: 2,
                front: "Who coined the term 'Satyagraha'?",
                back: "Mahatma Gandhi coined the term 'Satyagraha', which means 'holding onto truth' or non-violent resistance."
            },
            {
                id: 3,
                front: "What is GDP deflator?",
                back: "GDP deflator is a measure of the level of prices of all new, domestically produced, final goods and services in an economy."
            }
        ];

        // Store globally for access
        window.flashcardsFixed = flashcards;
        window.currentFlashcardIndex = 0;
        window.flashcardFlipped = false;

        this.renderFlashcardFixed();

        console.log('✅ Rapid flashcards fixed');
    }

    renderFlashcardFixed() {
        const cardContainer = document.getElementById('flashcard-container');
        if (!cardContainer) return;

        const card = window.flashcardsFixed[window.currentFlashcardIndex];
        
        cardContainer.innerHTML = `
            <button id="card-inner" 
                    aria-pressed="${window.flashcardFlipped ? 'true' : 'false'}" 
                    aria-label="Flashcard: ${card.front}. Press Enter or Space to flip" 
                    onclick="flipFlashcardFixed()" 
                    class="w-full h-full cursor-pointer transition-transform duration-500 rounded-lg shadow-xl 
                           bg-[var(--bg-dark-2)] p-4 flex items-center justify-center 
                           text-center border border-white/10 hover:border-teal-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400" 
                    style="transform-style: preserve-3d; ${window.flashcardFlipped ? 'transform: rotateY(180deg);' : 'transform: rotateY(0deg);'}">
                
                <!-- Front Face -->
                <div id="card-front" class="absolute w-full h-full p-4 flex items-center justify-center backface-hidden">
                    <p class="text-xs font-light text-white/50 absolute bottom-2">Press Enter or Space to flip</p>
                    <p class="text-base font-semibold text-teal-400 pt-8">${card.front}</p>
                </div>
                
                <!-- Back Face -->
                <div id="card-back" class="absolute w-full h-full p-4 flex items-center justify-center backface-hidden" style="transform: rotateY(180deg);">
                    <p class="text-xs font-light text-white/80">${card.back}</p>
                </div>
            </button>
        `;

        // Update navigation buttons
        const prevBtn = document.getElementById('flashcard-prev');
        const nextBtn = document.getElementById('flashcard-next');
        
        if (prevBtn) prevBtn.disabled = window.currentFlashcardIndex === 0;
        if (nextBtn) nextBtn.disabled = window.currentFlashcardIndex === window.flashcardsFixed.length - 1;
    }

    fixRecentConversations() {
        console.log('🔧 Fixing recent conversations...');
        
        // Enhanced conversation loading
        window.loadRecentConversationsFixed = async () => {
            try {
                const recentChatsList = document.getElementById('recent-chats-list');
                if (!recentChatsList) return;

                let conversations = [];

                // Try Firebase first
                if (window.firebaseManager?.isReady()) {
                    try {
                        conversations = await window.firebaseManager.getConversations(15);
                        console.log('📥 Loaded conversations from Firebase:', conversations.length);
                    } catch (error) {
                        console.warn('Firebase load failed:', error);
                    }
                }

                // Fallback to localStorage
                if (conversations.length === 0) {
                    const localConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
                    conversations = localConversations.slice(0, 15);
                    console.log('📥 Loaded conversations from localStorage:', conversations.length);
                }

                // Display conversations
                if (conversations.length === 0) {
                    recentChatsList.innerHTML = '<li class="text-white/50 text-center py-4">No recent chats</li>';
                } else {
                    recentChatsList.innerHTML = conversations.map(chat => {
                        const title = chat.title || chat.preview || 'Untitled Conversation';
                        const timestamp = chat.timestamp || chat.createdAt || chat.updatedAt;
                        const timeAgo = this.formatChatTime(timestamp);
                        const syncStatus = chat.synced !== false ? '☁️' : '💾';
                        
                        return `
                            <li class="cursor-pointer hover:bg-white/5 rounded-lg px-3 py-2 transition-colors group" 
                                onclick="loadConversationFixed('${chat.id}')">
                                <div class="text-white/80 text-sm leading-relaxed mb-1">${title}</div>
                                <div class="text-white/40 text-xs flex items-center gap-1">
                                    ${timeAgo}
                                    <span class="text-xs">${syncStatus}</span>
                                </div>
                            </li>
                        `;
                    }).join('');
                }

            } catch (error) {
                console.error('Error loading recent conversations:', error);
                const recentChatsList = document.getElementById('recent-chats-list');
                if (recentChatsList) {
                    recentChatsList.innerHTML = '<li class="text-red-400 text-center py-4">Error loading conversations</li>';
                }
            }
        };

        // Load conversations immediately
        window.loadRecentConversationsFixed();
    }

    initializeComponents() {
        console.log('🔧 Initializing dashboard components...');
        
        // Global functions for dashboard interactions
        window.toggleBookmarkFixed = (id, btn) => {
            console.log('Toggling bookmark for item:', id);
            if (window.showToast) {
                window.showToast('Bookmark toggled!', 'success');
            }
        };

        window.openContentFixed = (id) => {
            console.log('Opening content:', id);
            if (window.showToast) {
                window.showToast('Opening content...', 'info');
            }
        };

        window.setActiveFilterFixed = (filter) => {
            console.log('Setting filter:', filter);
            // Update filter chips
            const chips = document.querySelectorAll('#filter-chips button');
            chips.forEach(chip => {
                if (chip.textContent.trim() === filter) {
                    chip.className = 'bg-teal-600 hover:bg-teal-700 px-3 py-1 text-xs font-medium rounded-full shadow-md transition text-white';
                } else {
                    chip.className = 'bg-gray-700/70 border border-white/10 px-3 py-1 text-xs text-white/80 rounded-full transition hover:bg-gray-700';
                }
            });
        };

        // Quiz functions
        window.selectQuizOptionFixed = (index) => {
            if (window.quizAttempted) return;
            window.selectedOptionIndex = index;
            this.renderQuizFixed();
        };

        window.checkQuizAnswerFixed = () => {
            if (window.selectedOptionIndex === null) {
                if (window.showToast) {
                    window.showToast("Please select an option first!", 'error');
                }
                return;
            }

            window.quizAttempted = true;
            window.quizCorrect = window.selectedOptionIndex === window.dailyChallengeFixed.mcqs[window.dailyChallengeFixed.currentMCQ].answerIndex;

            if (window.quizCorrect && window.showToast) {
                window.showToast("You nailed the daily challenge!", 'success');
            } else if (window.showToast) {
                window.showToast("Keep going, you'll get it next time.", 'info');
            }

            this.renderQuizFixed();
        };

        window.nextQuestionFixed = () => {
            if (window.dailyChallengeFixed.currentMCQ < window.dailyChallengeFixed.mcqs.length - 1) {
                window.dailyChallengeFixed.currentMCQ++;
                window.quizAttempted = false;
                window.selectedOptionIndex = null;
                window.quizCorrect = false;
                this.renderQuizFixed();
            }
        };

        window.resetQuizFixed = () => {
            window.dailyChallengeFixed.currentMCQ = 0;
            window.quizAttempted = false;
            window.selectedOptionIndex = null;
            window.quizCorrect = false;
            if (window.showToast) {
                window.showToast("Quiz reset. Good luck!", 'info');
            }
            this.renderQuizFixed();
        };

        // Flashcard functions
        window.flipFlashcardFixed = () => {
            window.flashcardFlipped = !window.flashcardFlipped;
            this.renderFlashcardFixed();
        };

        window.navigateFlashcardFixed = (direction) => {
            window.flashcardFlipped = false;
            if (direction === 'next' && window.currentFlashcardIndex < window.flashcardsFixed.length - 1) {
                window.currentFlashcardIndex++;
            } else if (direction === 'prev' && window.currentFlashcardIndex > 0) {
                window.currentFlashcardIndex--;
            }
            this.renderFlashcardFixed();
        };

        window.flashcardActionFixed = (action) => {
            const card = window.flashcardsFixed[window.currentFlashcardIndex];
            if (action === 'learned' && window.showToast) {
                window.showToast(`Card on "${card.front.substring(0, 30)}..." marked as Learned!`, 'success');
            } else if (action === 'weak' && window.showToast) {
                window.showToast(`Card on "${card.front.substring(0, 30)}..." flagged as Weak Area.`, 'error');
            }
            
            if (window.currentFlashcardIndex < window.flashcardsFixed.length - 1) {
                window.navigateFlashcardFixed('next');
            } else if (window.showToast) {
                window.showToast("End of Flashcards for today! Great job.", 'info');
            }
        };

        // Update button onclick handlers
        this.updateButtonHandlers();
    }

    updateButtonHandlers() {
        // Update quiz buttons
        const checkBtn = document.getElementById('check-answer-btn');
        const nextBtn = document.getElementById('next-question-btn');
        const retryBtn = document.getElementById('retry-quiz-btn');
        
        if (checkBtn) checkBtn.onclick = window.checkQuizAnswerFixed;
        if (nextBtn) nextBtn.onclick = window.nextQuestionFixed;
        if (retryBtn) retryBtn.onclick = window.resetQuizFixed;

        // Update flashcard buttons
        const prevBtn = document.getElementById('flashcard-prev');
        const nextFlashBtn = document.getElementById('flashcard-next');
        
        if (prevBtn) prevBtn.onclick = () => window.navigateFlashcardFixed('prev');
        if (nextFlashBtn) nextFlashBtn.onclick = () => window.navigateFlashcardFixed('next');

        // Update flashcard action buttons
        const learnedBtn = document.querySelector('button[onclick*="flashcardAction(\'learned\')"]');
        const weakBtn = document.querySelector('button[onclick*="flashcardAction(\'weak\')"]');
        
        if (learnedBtn) learnedBtn.onclick = () => window.flashcardActionFixed('learned');
        if (weakBtn) weakBtn.onclick = () => window.flashcardActionFixed('weak');
    }

    initializeDashboardData() {
        // Load user profile data
        if (window.profileManager) {
            const userNameEl = document.getElementById('user-name');
            const userEmailEl = document.getElementById('user-email');
            const userInitialsEl = document.getElementById('user-initials');
            
            if (userNameEl) userNameEl.textContent = window.profileManager.profileData.name || 'User';
            if (userEmailEl) userEmailEl.textContent = window.profileManager.profileData.email || 'user@upsc.com';
            if (userInitialsEl) userInitialsEl.textContent = window.profileManager.generateInitials(window.profileManager.profileData.name || 'User');
        }

        // Load saved profile picture
        const savedDP = localStorage.getItem('selectedDP');
        const userInitialsEl = document.getElementById('user-initials');
        
        if (savedDP && userInitialsEl) {
            const parentDiv = userInitialsEl.parentElement;
            parentDiv.innerHTML = `<img src="image/${savedDP}.png" alt="Profile Picture" class="w-full h-full object-cover">`;
        }
    }

    formatChatTime(timestamp) {
        if (!timestamp) return 'Unknown time';
        
        const date = new Date(timestamp);
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

    retryInitialization() {
        this.retryAttempts++;
        if (this.retryAttempts < this.maxRetries) {
            console.log(`🔄 Retrying dashboard fixes initialization (${this.retryAttempts}/${this.maxRetries})...`);
            setTimeout(() => this.init(), 2000);
        } else {
            console.error('❌ Dashboard fixes initialization failed after maximum retries');
        }
    }

    // Public methods
    isReady() {
        return this.isInitialized;
    }

    refresh() {
        this.forceRenderContent();
        this.forceRenderFilterChips();
        this.renderQuizFixed();
        this.renderFlashcardFixed();
        if (window.loadRecentConversationsFixed) {
            window.loadRecentConversationsFixed();
        }
    }
}

// Initialize dashboard fixes
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardFixes = new DashboardFixes();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardFixes;
}