// Duolingo-Inspired Animation System
class DuolingoAnimations {
  constructor() {
    this.confettiColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
  }

  // Confetti celebration animation
  triggerConfetti(duration = 3000) {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    // Create 50 confetti pieces
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        this.createConfettiPiece(container);
      }, i * 50);
    }

    // Remove container after animation
    setTimeout(() => {
      document.body.removeChild(container);
    }, duration);
  }

  createConfettiPiece(container) {
    const piece = document.createElement('div');
    const colorIndex = Math.floor(Math.random() * 5) + 1;
    piece.className = `confetti-piece confetti-${colorIndex}`;
    
    // Random position
    piece.style.left = Math.random() * 100 + '%';
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    
    container.appendChild(piece);
  }

  // Success pulse animation
  triggerSuccessPulse(element) {
    element.classList.add('success-pulse');
    setTimeout(() => {
      element.classList.remove('success-pulse');
    }, 600);
  }

  // Celebration bounce
  triggerCelebrationBounce(element) {
    element.classList.add('celebration-bounce');
    setTimeout(() => {
      element.classList.remove('celebration-bounce');
    }, 800);
  }

  // Correct answer feedback
  triggerCorrectAnswer(element) {
    element.classList.add('correct-answer');
    setTimeout(() => {
      element.classList.remove('correct-answer');
    }, 600);
  }

  // Incorrect answer feedback
  triggerIncorrectAnswer(element) {
    element.classList.add('incorrect-answer');
    setTimeout(() => {
      element.classList.remove('incorrect-answer');
    }, 600);
  }

  // Animate progress bar
  animateProgress(progressBar, targetWidth, duration = 800) {
    const fill = progressBar.querySelector('.progress-fill');
    if (!fill) return;

    // Animate width
    setTimeout(() => {
      fill.style.width = targetWidth + '%';
    }, 100);

    // Animate number if present
    const numberEl = progressBar.querySelector('.progress-number');
    if (numberEl) {
      this.animateNumber(numberEl, 0, targetWidth, duration);
    }
  }

  // Animate number counting
  animateNumber(element, start, end, duration = 800) {
    const startTime = performance.now();
    const difference = end - start;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (difference * easeOut));
      
      element.textContent = current + '%';
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  // Stagger animation for multiple elements
  staggerElements(elements, delay = 100) {
    elements.forEach((element, index) => {
      element.style.animationDelay = (index * delay) + 'ms';
      element.classList.add('stagger-item');
    });
  }

  // Bounce button animation
  bounceButton(button) {
    button.classList.add('bounce-button');
    setTimeout(() => {
      button.classList.remove('bounce-button');
    }, 600);
  }

  // Streak fire animation
  animateStreak(element) {
    element.classList.add('streak-fire');
  }

  // Page transition
  transitionPage(exitElement, enterElement) {
    // Exit current page
    exitElement.classList.add('page-exit-active');
    
    setTimeout(() => {
      exitElement.style.display = 'none';
      enterElement.style.display = 'block';
      enterElement.classList.add('page-enter');
      
      // Trigger enter animation
      setTimeout(() => {
        enterElement.classList.add('page-enter-active');
        enterElement.classList.remove('page-enter');
      }, 50);
    }, 200);
  }

  // Wiggle animation for icons
  wiggleIcon(icon) {
    icon.classList.add('wiggle-on-hover');
    setTimeout(() => {
      icon.classList.remove('wiggle-on-hover');
    }, 500);
  }

  // Loading shimmer effect
  addShimmerLoading(element) {
    element.classList.add('shimmer');
  }

  removeShimmerLoading(element) {
    element.classList.remove('shimmer');
  }

  // Heart beat animation
  startHeartBeat(element) {
    element.classList.add('heart-beat');
  }

  stopHeartBeat(element) {
    element.classList.remove('heart-beat');
  }

  // Breathing animation
  startBreathing(element) {
    element.classList.add('breathe');
  }

  stopBreathing(element) {
    element.classList.remove('breathe');
  }

  // Float animation
  startFloating(element) {
    element.classList.add('float');
  }

  stopFloating(element) {
    element.classList.remove('float');
  }
}

// Initialize global animation system
window.duoAnimations = new DuolingoAnimations();

// Helper functions for easy use
function celebrateSuccess(element) {
  window.duoAnimations.triggerConfetti();
  window.duoAnimations.triggerSuccessPulse(element);
}

function showCorrectAnswer(element) {
  window.duoAnimations.triggerCorrectAnswer(element);
}

function showIncorrectAnswer(element) {
  window.duoAnimations.triggerIncorrectAnswer(element);
}

function bounceButton(button) {
  window.duoAnimations.bounceButton(button);
}

function animateProgress(progressBar, percentage) {
  window.duoAnimations.animateProgress(progressBar, percentage);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DuolingoAnimations;
}