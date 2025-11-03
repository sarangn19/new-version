/**
 * Immediate Daily Challenge Fix
 * This provides an immediate fix for the option selection issue
 */

// Immediate fix - create the functions right away
(function() {
    console.log('🔧 Applying immediate daily challenge fix...');
    
    let selectedOptionIndex = null;
    let quizAttempted = false;
    let quizCorrect = false;
    
    // Fixed option selection function
    window.selectQuizOptionFixed = function(index) {
        console.log('🎯 Option selected (IMMEDIATE FIX):', index);
        
        if (quizAttempted) {
            console.log('⚠️ Quiz already attempted, ignoring selection');
            return;
        }

        // Clear previous selections
        document.querySelectorAll('#quiz-options button').forEach(btn => {
            btn.classList.remove('border-teal-primary', 'ring-2', 'ring-teal-primary', 'shadow-lg');
            btn.classList.remove('border-[var(--teal-primary)]', 'ring-[var(--teal-primary)]');
            btn.classList.remove('border-teal-500', 'ring-teal-500');
            btn.style.borderColor = '';
            btn.style.boxShadow = '';
            btn.setAttribute('aria-checked', 'false');
        });

        // Set new selection
        selectedOptionIndex = index;
        console.log('✅ Selected option index set to:', selectedOptionIndex);

        // Apply selection styling with CSS variable support
        const selectedButton = document.querySelector(`#quiz-options button:nth-child(${index + 1})`);
        if (selectedButton) {
            // Try CSS variable approach first, fallback to direct classes
            selectedButton.classList.add('border-teal-500', 'ring-2', 'ring-teal-500', 'shadow-lg');
            selectedButton.style.borderColor = 'var(--teal-primary, #2C7A7B)';
            selectedButton.style.boxShadow = '0 0 0 2px var(--teal-primary, #2C7A7B)';
            selectedButton.setAttribute('aria-checked', 'true');
        }

        // Enable check button
        const checkBtn = document.getElementById('check-answer-btn');
        if (checkBtn) {
            checkBtn.disabled = false;
            checkBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            checkBtn.style.pointerEvents = 'auto';
        }
    };

    // Fixed answer checking function
    window.checkQuizAnswerFixed = function() {
        console.log('🔍 Checking answer (IMMEDIATE FIX). Selected option:', selectedOptionIndex);
        
        if (selectedOptionIndex === null || selectedOptionIndex === undefined) {
            console.log('❌ No option selected');
            if (window.showToast) {
                window.showToast("Please select an option first!", 'error');
            } else {
                alert("Please select an option first!");
            }
            return;
        }

        quizAttempted = true;
        
        // Get current question data
        const currentQuestion = window.dailyChallenge?.mcqs?.[window.dailyChallenge?.currentMCQ || 0];
        if (!currentQuestion) {
            console.error('❌ Current question not found');
            return;
        }

        quizCorrect = selectedOptionIndex === currentQuestion.answerIndex;
        console.log('🎯 Correct answer index:', currentQuestion.answerIndex, 'Selected:', selectedOptionIndex, 'Result:', quizCorrect ? 'CORRECT' : 'INCORRECT');

        // Show result
        if (quizCorrect) {
            if (window.showToast) {
                window.showToast("You nailed the daily challenge!", 'success');
            } else {
                alert("Correct! Excellent work.");
            }
        } else {
            if (window.showToast) {
                window.showToast("Keep going, you'll get it next time.", 'info');
            } else {
                alert("Incorrect. The correct answer is " + String.fromCharCode(65 + currentQuestion.answerIndex) + ".");
            }
        }

        // Update UI to show results
        showQuizResults();
    };

    // Show quiz results
    function showQuizResults() {
        const optionsContainer = document.getElementById('quiz-options');
        const feedbackDiv = document.getElementById('quiz-feedback');
        const checkBtn = document.getElementById('check-answer-btn');
        const nextBtn = document.getElementById('next-question-btn');
        const retryBtn = document.getElementById('retry-quiz-btn');

        if (!optionsContainer || !window.dailyChallenge) return;

        const currentQuestion = window.dailyChallenge.mcqs[window.dailyChallenge.currentMCQ || 0];
        
        // Update option buttons to show results
        const buttons = optionsContainer.querySelectorAll('button');
        buttons.forEach((button, index) => {
            // Remove selection styling
            button.classList.remove('border-teal-primary', 'ring-2', 'ring-teal-primary', 'shadow-lg', 'hover:bg-gray-600/70');
            
            if (index === currentQuestion.answerIndex) {
                // Correct answer
                button.classList.add('bg-green-800/50', 'border-green-500', 'shadow-md');
                button.setAttribute('aria-checked', 'true');
            } else if (index === selectedOptionIndex) {
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

        const currentMCQ = window.dailyChallenge.currentMCQ || 0;
        if (currentMCQ < window.dailyChallenge.mcqs.length - 1) {
            if (nextBtn) {
                nextBtn.classList.remove('hidden');
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
            }
        }

        // Show feedback
        if (feedbackDiv) {
            feedbackDiv.classList.remove('hidden');
            feedbackDiv.innerHTML = `
                <div class="p-3 rounded-lg ${quizCorrect ? 'bg-green-700/30 border-l-4 border-green-500' : 'bg-red-700/30 border-l-4 border-red-500'}">
                    <p class="text-xs font-medium ${quizCorrect ? 'text-green-400' : 'text-red-400'}">
                        ${quizCorrect ? 'Correct! Excellent work.' : 'Incorrect.'}
                    </p>
                    <p class="text-xs text-white/70 pt-1">${currentQuestion.explanation || 'No explanation available.'}</p>
                </div>
            `;
        }
    }

    // Fixed next question function
    window.nextQuestionFixed = function() {
        if (window.dailyChallenge && (window.dailyChallenge.currentMCQ || 0) < window.dailyChallenge.mcqs.length - 1) {
            window.dailyChallenge.currentMCQ = (window.dailyChallenge.currentMCQ || 0) + 1;
            resetQuestionState();
            if (window.renderQuiz) {
                window.renderQuiz();
            }
        }
    };

    // Fixed reset quiz function
    window.resetQuizFixed = function() {
        if (window.dailyChallenge) {
            window.dailyChallenge.currentMCQ = 0;
        }
        resetQuestionState();
        if (window.showToast) {
            window.showToast("Quiz reset. Good luck!", 'info');
        }
        if (window.renderQuiz) {
            window.renderQuiz();
        }
    };

    function resetQuestionState() {
        quizAttempted = false;
        selectedOptionIndex = null;
        quizCorrect = false;
    }

    // Override the original functions to use the fixed ones
    window.selectQuizOption = window.selectQuizOptionFixed;
    window.checkQuizAnswer = window.checkQuizAnswerFixed;
    window.nextQuestion = window.nextQuestionFixed;
    window.resetQuiz = window.resetQuizFixed;

    console.log('✅ Immediate daily challenge fix applied');
})();