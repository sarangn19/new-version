/**
 * Daily Challenge Option Selection Fix
 * Fixes the option selection issue in the daily challenge quiz
 */

class DailyChallengeOptionFix {
    constructor() {
        this.selectedOptionIndex = null;
        this.quizAttempted = false;
        this.quizCorrect = false;
        this.currentMCQ = 0;
        this.init();
    }

    init() {
        console.log('🔧 Initializing Daily Challenge Option Selection Fix...');
        
        // Override the global functions with fixed versions
        this.overrideGlobalFunctions();
        
        // Add event listeners for better option handling
        this.addEventListeners();
    }

    overrideGlobalFunctions() {
        // Override the original renderQuiz function to use fixed functions
        if (window.renderQuiz) {
            window.originalRenderQuiz = window.renderQuiz;
        }
        
        // Fixed selectQuizOption function
        window.selectQuizOptionFixed = (index) => {
            console.log('🎯 Option selected (FIXED):', index);
            
            if (this.quizAttempted) {
                console.log('⚠️ Quiz already attempted, ignoring selection');
                return;
            }

            // Clear previous selection styling
            document.querySelectorAll('#quiz-options button').forEach(btn => {
                btn.classList.remove('border-teal-primary', 'ring-2', 'ring-teal-primary', 'shadow-lg');
                btn.setAttribute('aria-checked', 'false');
            });

            // Set new selection
            this.selectedOptionIndex = index;
            console.log('✅ Selected option index set to:', this.selectedOptionIndex);

            // Apply selection styling immediately
            const selectedButton = document.querySelector(`#quiz-options button:nth-child(${index + 1})`);
            if (selectedButton) {
                selectedButton.classList.add('border-teal-primary', 'ring-2', 'ring-teal-primary', 'shadow-lg');
                selectedButton.setAttribute('aria-checked', 'true');
            }

            // Enable check button
            const checkBtn = document.getElementById('check-answer-btn');
            if (checkBtn) {
                checkBtn.disabled = false;
                checkBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                checkBtn.classList.add('hover:bg-teal-600');
            }
        };

        // Fixed checkQuizAnswer function
        window.checkQuizAnswerFixed = () => {
            console.log('🔍 Checking answer (FIXED). Selected option:', this.selectedOptionIndex);
            
            if (this.selectedOptionIndex === null || this.selectedOptionIndex === undefined) {
                console.log('❌ No option selected');
                this.showToast("Please select an option first!", 'error');
                return;
            }

            this.quizAttempted = true;
            
            // Get current question data
            const currentQuestion = window.dailyChallenge?.mcqs?.[this.currentMCQ];
            if (!currentQuestion) {
                console.error('❌ Current question not found');
                return;
            }

            this.quizCorrect = this.selectedOptionIndex === currentQuestion.answerIndex;
            console.log('🎯 Correct answer index:', currentQuestion.answerIndex, 'Selected:', this.selectedOptionIndex, 'Result:', this.quizCorrect ? 'CORRECT' : 'INCORRECT');

            // Show result
            if (this.quizCorrect) {
                this.showToast("You nailed the daily challenge!", 'success');
            } else {
                this.showToast("Keep going, you'll get it next time.", 'info');
            }

            // Update UI to show results
            this.renderQuizResults();
        };

        // Fixed nextQuestion function
        window.nextQuestionFixed = () => {
            if (window.dailyChallenge && this.currentMCQ < window.dailyChallenge.mcqs.length - 1) {
                this.currentMCQ++;
                this.resetQuestionState();
                this.renderQuiz();
            }
        };

        // Fixed resetQuiz function
        window.resetQuizFixed = () => {
            this.currentMCQ = 0;
            this.resetQuestionState();
            this.showToast("Quiz reset. Good luck!", 'info');
            this.renderQuiz();
        };

        // Also create fallback functions that work immediately
        if (!window.selectQuizOptionFixed) {
            window.selectQuizOptionFixed = (index) => this.selectQuizOptionFixed(index);
        }
        if (!window.checkQuizAnswerFixed) {
            window.checkQuizAnswerFixed = () => this.checkQuizAnswerFixed();
        }
        if (!window.nextQuestionFixed) {
            window.nextQuestionFixed = () => this.nextQuestionFixed();
        }
        if (!window.resetQuizFixed) {
            window.resetQuizFixed = () => this.resetQuizFixed();
        }

        console.log('✅ Global functions overridden with fixed versions');
    }

    resetQuestionState() {
        this.quizAttempted = false;
        this.selectedOptionIndex = null;
        this.quizCorrect = false;
    }

    renderQuizResults() {
        const optionsContainer = document.getElementById('quiz-options');
        const feedbackDiv = document.getElementById('quiz-feedback');
        const checkBtn = document.getElementById('check-answer-btn');
        const nextBtn = document.getElementById('next-question-btn');
        const retryBtn = document.getElementById('retry-quiz-btn');

        if (!optionsContainer || !window.dailyChallenge) return;

        const currentQuestion = window.dailyChallenge.mcqs[this.currentMCQ];
        
        // Update option buttons to show results
        const buttons = optionsContainer.querySelectorAll('button');
        buttons.forEach((button, index) => {
            // Remove selection styling
            button.classList.remove('border-teal-primary', 'ring-2', 'ring-teal-primary', 'shadow-lg', 'hover:bg-gray-600/70');
            
            if (index === currentQuestion.answerIndex) {
                // Correct answer
                button.classList.add('bg-green-800/50', 'border-green-500', 'shadow-md');
                button.setAttribute('aria-checked', 'true');
            } else if (index === this.selectedOptionIndex) {
                // Wrong selected answer
                button.classList.add('bg-red-800/50', 'border-red-500', 'shadow-md');
                button.setAttribute('aria-checked', 'true');
            } else {
                // Other options
                button.classList.add('bg-gray-700/50');
                button.setAttribute('aria-checked', 'false');
            }
            
            // Disable further clicking
            button.style.pointerEvents = 'none';
        });

        // Update control buttons
        if (checkBtn) {
            checkBtn.classList.add('hidden');
        }

        if (this.currentMCQ < window.dailyChallenge.mcqs.length - 1) {
            if (nextBtn) {
                nextBtn.classList.remove('hidden');
                nextBtn.onclick = () => window.nextQuestionFixed();
            }
            if (retryBtn) {
                retryBtn.classList.add('hidden');
            }
        } else {
            if (nextBtn) {
                nextBtn.classList.add('hidden');
            }
            if (retryBtn) {
                retryBtn.classList.remove('hidden');
                retryBtn.onclick = () => window.resetQuizFixed();
            }
        }

        // Show feedback
        if (feedbackDiv) {
            feedbackDiv.classList.remove('hidden');
            feedbackDiv.innerHTML = `
                <div class="p-3 rounded-lg ${this.quizCorrect ? 'bg-green-700/30 border-l-4 border-green-500' : 'bg-red-700/30 border-l-4 border-red-500'}">
                    <p class="text-xs font-medium ${this.quizCorrect ? 'text-green-400' : 'text-red-400'}">
                        ${this.quizCorrect ? 'Correct! Excellent work.' : 'Incorrect.'}
                    </p>
                    <p class="text-xs text-white/70 pt-1">${currentQuestion.explanation || 'No explanation available.'}</p>
                </div>
            `;
        }
    }

    renderQuiz() {
        const optionsContainer = document.getElementById('quiz-options');
        const questionEl = document.getElementById('daily-quiz-question');
        const feedbackDiv = document.getElementById('quiz-feedback');
        const checkBtn = document.getElementById('check-answer-btn');
        const retryBtn = document.getElementById('retry-quiz-btn');
        const nextBtn = document.getElementById('next-question-btn');
        const questionCounter = document.getElementById('question-counter');

        if (!optionsContainer || !window.dailyChallenge) return;

        const currentQuestion = window.dailyChallenge.mcqs[this.currentMCQ];
        
        // Update question text
        if (questionEl) {
            questionEl.textContent = currentQuestion.question;
        }
        
        if (questionCounter) {
            questionCounter.textContent = `Question ${this.currentMCQ + 1} of ${window.dailyChallenge.mcqs.length}`;
        }

        // Render options
        optionsContainer.innerHTML = currentQuestion.options.map((option, index) => {
            const classes = 'p-3 rounded-xl cursor-pointer transition duration-200 text-white border border-white/10 inline-flex items-center w-full text-left bg-gray-700/50 hover:bg-gray-600/70';
            
            return `
                <button role="radio" tabindex="0" aria-checked="false" class="${classes}" 
                        onclick="selectQuizOptionFixed(${index})" 
                        onkeydown="if(event.key==='Enter'||event.key===' '){ event.preventDefault(); selectQuizOptionFixed(${index}); }">
                    <span class="text-sm">${String.fromCharCode(65 + index)}. ${option}</span>
                </button>
            `;
        }).join('');

        // Reset UI state
        if (checkBtn) {
            checkBtn.classList.remove('hidden');
            checkBtn.disabled = true;
            checkBtn.classList.add('opacity-50', 'cursor-not-allowed');
            checkBtn.classList.remove('hover:bg-teal-600');
            checkBtn.onclick = () => window.checkQuizAnswerFixed();
        }

        if (nextBtn) {
            nextBtn.classList.add('hidden');
        }

        if (retryBtn) {
            retryBtn.classList.add('hidden');
        }

        if (feedbackDiv) {
            feedbackDiv.classList.add('hidden');
        }
    }

    addEventListeners() {
        // Listen for quiz initialization
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for the quiz to be rendered
            setTimeout(() => {
                this.initializeQuizIfReady();
            }, 2000);
        });

        // Listen for dynamic content updates
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'quiz-options' && mutation.type === 'childList') {
                    console.log('🔄 Quiz options updated, applying fixes...');
                    this.applyOptionFixes();
                }
            });
        });

        const quizContainer = document.getElementById('quiz-options');
        if (quizContainer) {
            observer.observe(quizContainer, { childList: true, subtree: true });
        }
    }

    initializeQuizIfReady() {
        const quizContainer = document.getElementById('quiz-options');
        if (quizContainer && window.dailyChallenge) {
            console.log('🎯 Initializing quiz with fixes...');
            this.renderQuiz();
        }
    }

    applyOptionFixes() {
        // Ensure all option buttons use the fixed function
        const optionButtons = document.querySelectorAll('#quiz-options button');
        optionButtons.forEach((button, index) => {
            button.onclick = () => window.selectQuizOptionFixed(index);
        });
    }

    showToast(message, type = 'info') {
        // Use existing toast function if available, otherwise create simple alert
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
            // Create a simple toast notification
            const toast = document.createElement('div');
            toast.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
                type === 'success' ? 'bg-green-600' : 
                type === 'error' ? 'bg-red-600' : 'bg-blue-600'
            }`;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
    }

    // Public method to get current state for debugging
    getState() {
        return {
            selectedOptionIndex: this.selectedOptionIndex,
            quizAttempted: this.quizAttempted,
            quizCorrect: this.quizCorrect,
            currentMCQ: this.currentMCQ
        };
    }
}

// Initialize the fix when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.dailyChallengeOptionFix = new DailyChallengeOptionFix();
        console.log('✅ Daily Challenge Option Selection Fix initialized');
    }, 1000);
});

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DailyChallengeOptionFix;
}