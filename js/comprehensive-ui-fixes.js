/**
 * Comprehensive UI Fixes
 * Addresses multiple issues across the application
 */

(function() {
    console.log('🔧 Applying comprehensive UI fixes...');

    // Fix 1: Ensure save buttons work in loaded conversations
    function fixSaveButtonsInLoadedConversations() {
        // Add event delegation for save buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('save-btn')) {
                const messageContent = e.target.closest('.text-sm').querySelector('.prose').textContent;
                const saveType = e.target.dataset.type;
                
                if (saveType === 'note') {
                    saveAsNote(messageContent, e.target);
                }
            }
            
            if (e.target.classList.contains('copy-btn')) {
                const messageContent = e.target.closest('.text-sm').querySelector('.prose').textContent;
                copyToClipboard(messageContent, e.target);
            }
        });
    }

    // Fix 2: Real-time statistics update
    function enableRealTimeStatistics() {
        if (window.location.pathname.includes('statistics.html')) {
            // Force update statistics on page load
            setTimeout(() => {
                updateStatisticsData();
            }, 1000);
            
            // Update statistics every 30 seconds
            setInterval(() => {
                updateStatisticsData();
            }, 30000);
        }
    }
    
    function updateStatisticsData() {
        try {
            // Get real data from localStorage
            const notes = JSON.parse(localStorage.getItem('userNotes') || '[]');
            const flashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
            const mcqs = JSON.parse(localStorage.getItem('mcqs') || '[]');
            const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
            
            // Update statistics displays
            const statsElements = {
                'total-notes': notes.length,
                'total-flashcards': flashcards.length,
                'total-mcqs': mcqs.length,
                'study-sessions': studySessions.length,
                'total-study-time': calculateTotalStudyTime(studySessions),
                'average-score': calculateAverageScore(studySessions)
            };
            
            Object.entries(statsElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = typeof value === 'number' ? value.toLocaleString() : value;
                }
            });
            
            // Update charts if functions exist
            if (typeof updateCharts === 'function') {
                updateCharts();
            }
            if (typeof refreshDashboard === 'function') {
                refreshDashboard();
            }
            
            console.log('📊 Statistics updated with real data');
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }
    
    function calculateTotalStudyTime(sessions) {
        const totalMinutes = sessions.reduce((total, session) => {
            return total + (session.duration || 0);
        }, 0);
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    function calculateAverageScore(sessions) {
        const sessionsWithScores = sessions.filter(s => s.score !== undefined);
        if (sessionsWithScores.length === 0) return '0%';
        
        const averageScore = sessionsWithScores.reduce((total, session) => {
            return total + (session.score || 0);
        }, 0) / sessionsWithScores.length;
        
        return Math.round(averageScore) + '%';
    }

    // Fix 3: Fix news reading functionality
    function fixNewsReading() {
        if (window.location.pathname.includes('news.html')) {
            // Ensure news articles can be opened
            window.openNewsArticle = function(newsId) {
                const newsModal = document.getElementById('news-modal');
                const newsContent = document.getElementById('news-content');
                
                if (newsModal && newsContent) {
                    // Show loading state
                    newsContent.innerHTML = '<div class="text-center py-8"><div class="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div><p class="mt-2">Loading article...</p></div>';
                    newsModal.classList.remove('hidden');
                    
                    // Simulate loading and show content
                    setTimeout(() => {
                        const article = getNewsArticle(newsId);
                        if (article) {
                            newsContent.innerHTML = `
                                <div class="prose prose-invert max-w-none">
                                    <h2 class="text-xl font-bold mb-4">${article.title}</h2>
                                    <div class="text-sm text-gray-400 mb-4">${article.date} • ${article.category}</div>
                                    <div class="text-gray-300 leading-relaxed">${article.content}</div>
                                </div>
                            `;
                        }
                    }, 1000);
                }
            };
        }
    }

    // Fix 4: Fix group deletion in community
    function fixGroupDeletion() {
        if (window.location.pathname.includes('community.html')) {
            window.deleteGroup = function() {
                const currentGroupId = getCurrentGroupId();
                
                if (!currentGroupId || currentGroupId === 'general') {
                    showNotification('Cannot delete the general group', 'error');
                    return;
                }
                
                showConfirmModal(
                    'Delete Group',
                    'Are you sure you want to permanently delete this group? This action cannot be undone.',
                    () => {
                        try {
                            // Get current groups
                            const groups = JSON.parse(localStorage.getItem('studyGroups') || '[]');
                            
                            // Remove the group
                            const updatedGroups = groups.filter(group => group.id !== currentGroupId);
                            localStorage.setItem('studyGroups', JSON.stringify(updatedGroups));
                            
                            // Clear group messages
                            localStorage.removeItem(`groupMessages_${currentGroupId}`);
                            
                            // Redirect to general group
                            window.location.href = 'community.html?group=general';
                            
                            showNotification('Group deleted successfully', 'success');
                        } catch (error) {
                            console.error('Error deleting group:', error);
                            showNotification('Failed to delete group', 'error');
                        }
                    }
                );
            };
        }
    }

    // Fix 5: Replace dummy content with real data
    function replaceDummyContent() {
        // Fix MCQ dummy content
        if (window.location.pathname.includes('mcq.html')) {
            setTimeout(() => {
                loadRealMCQs();
            }, 1000);
        }
        
        // Fix flashcard dummy content
        if (window.location.pathname.includes('flashcards.html')) {
            setTimeout(() => {
                loadRealFlashcards();
            }, 1000);
        }
    }

    // Helper functions
    function saveAsNote(content, button) {
        try {
            const notes = JSON.parse(localStorage.getItem('userNotes') || '[]');
            const newNote = {
                id: Date.now(),
                title: content.substring(0, 50) + '...',
                content: content,
                date: new Date().toISOString(),
                tags: ['ai-generated'],
                folder: 'AI Responses'
            };
            
            notes.unshift(newNote);
            localStorage.setItem('userNotes', JSON.stringify(notes));
            
            // Update button state
            button.innerHTML = '✅ Saved';
            button.disabled = true;
            setTimeout(() => {
                button.innerHTML = '📄 Save to Notes';
                button.disabled = false;
            }, 2000);
            
            if (typeof showToast === 'function') {
                showToast('Response saved to notes!', 'success');
            }
        } catch (error) {
            console.error('Error saving note:', error);
            if (typeof showToast === 'function') {
                showToast('Failed to save note', 'error');
            }
        }
    }

    function copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            button.innerHTML = '✅ Copied';
            setTimeout(() => {
                button.innerHTML = '📋 Copy Response';
            }, 2000);
            
            if (typeof showToast === 'function') {
                showToast('Response copied to clipboard!', 'success');
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
            if (typeof showToast === 'function') {
                showToast('Failed to copy response', 'error');
            }
        });
    }

    function getNewsArticle(newsId) {
        // Mock news articles - replace with real API call
        const articles = {
            1: {
                title: "UPSC Civil Services Exam 2024: Important Updates",
                date: "November 3, 2024",
                category: "UPSC Updates",
                content: "The Union Public Service Commission has announced important updates regarding the Civil Services Examination 2024. Candidates are advised to check the official website for detailed information about the examination schedule and syllabus changes."
            },
            2: {
                title: "Economic Survey 2024: Key Highlights",
                date: "November 2, 2024", 
                category: "Economics",
                content: "The Economic Survey 2024 presents a comprehensive analysis of India's economic performance. Key highlights include GDP growth projections, inflation trends, and policy recommendations for sustainable development."
            }
        };
        
        return articles[newsId] || {
            title: "Article Not Found",
            date: new Date().toLocaleDateString(),
            category: "General",
            content: "The requested article could not be found. Please try again later."
        };
    }

    function loadRealMCQs() {
        // Load real MCQs from localStorage or generate some
        const mcqs = JSON.parse(localStorage.getItem('mcqs') || '[]');
        
        if (mcqs.length === 0) {
            // Generate some sample MCQs if none exist
            const sampleMCQs = [
                {
                    id: Date.now(),
                    question: "Which article of the Indian Constitution deals with the Right to Equality?",
                    options: ["Article 14", "Article 15", "Article 16", "All of the above"],
                    correct: 3,
                    explanation: "Articles 14, 15, and 16 all deal with different aspects of the Right to Equality.",
                    subject: "Constitutional Law",
                    difficulty: "Medium"
                }
            ];
            
            localStorage.setItem('mcqs', JSON.stringify(sampleMCQs));
        }
        
        // Trigger MCQ rendering if function exists
        if (typeof renderMCQs === 'function') {
            renderMCQs();
        }
    }

    function loadRealFlashcards() {
        // Load real flashcards from localStorage or generate some
        const flashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
        
        if (flashcards.length === 0) {
            // Generate some sample flashcards if none exist
            const sampleFlashcards = [
                {
                    id: Date.now(),
                    front: "What is the basic structure doctrine?",
                    back: "A judicial principle that certain features of the Constitution are so fundamental that they cannot be altered by Parliament through constitutional amendments.",
                    subject: "Constitutional Law",
                    difficulty: "Hard"
                }
            ];
            
            localStorage.setItem('flashcards', JSON.stringify(sampleFlashcards));
        }
        
        // Trigger flashcard rendering if function exists
        if (typeof renderFlashcards === 'function') {
            renderFlashcards();
        }
    }

    // Apply all fixes
    function applyAllFixes() {
        fixSaveButtonsInLoadedConversations();
        enableRealTimeStatistics();
        fixNewsReading();
        fixGroupDeletion();
        replaceDummyContent();
        
        console.log('✅ All comprehensive UI fixes applied');
    }

    // Initialize fixes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAllFixes);
    } else {
        applyAllFixes();
    }

    // Export for global access
    window.comprehensiveUIFixes = {
        saveAsNote,
        copyToClipboard,
        getNewsArticle,
        loadRealMCQs,
        loadRealFlashcards
    };

})();