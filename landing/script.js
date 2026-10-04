/* ============================================================
   GitInsight AI — Landing Page Interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollReveal();
  initHeroDashboard();
  initParallax();
  initSmoothScroll();
  initAIChat();
});

/* ---------- Navigation ---------- */
function initNavigation() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-mobile-toggle');
  const links = document.querySelector('.nav-links');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });

  if (toggle) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
    });
  }
}

/* ---------- Scroll Reveal ---------- */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve so we can re-trigger if needed
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* ---------- Hero Dashboard Animated Mockup ---------- */
function initHeroDashboard() {
  const bars = document.querySelectorAll('.hero-dash-bar');
  const heights = [30, 50, 25, 70, 45, 85, 35, 60, 90, 40, 75, 55, 80, 30, 65, 95, 50, 70, 40, 85];

  bars.forEach((bar, i) => {
    const h = heights[i % heights.length];
    bar.style.height = h + '%';
  });

  // Animate bars periodically
  setInterval(() => {
    bars.forEach((bar, i) => {
      const newH = Math.random() * 80 + 15;
      bar.style.height = newH + '%';
    });
  }, 4000);

  // Animate dashboard chart bars
  const chartBars = document.querySelectorAll('.dash-chart-bar');
  const chartHeights = [40, 65, 30, 80, 55, 95, 45, 70, 35, 85, 60, 50, 75, 90, 40, 55, 70, 80, 45, 65, 30, 85, 50, 95];
  chartBars.forEach((bar, i) => {
    bar.style.height = (chartHeights[i % chartHeights.length]) + '%';
  });

  setInterval(() => {
    chartBars.forEach((bar) => {
      const newH = Math.random() * 75 + 20;
      bar.style.height = newH + '%';
    });
  }, 5000);

  // Animate team mini bars
  const teamBars = document.querySelectorAll('.team-mini-bar');
  teamBars.forEach((bar) => {
    bar.style.height = (Math.random() * 80 + 15) + '%';
  });

  setInterval(() => {
    teamBars.forEach((bar) => {
      bar.style.height = (Math.random() * 80 + 15) + '%';
    });
  }, 4500);
}

/* ---------- Subtle Parallax ---------- */
function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    parallaxElements.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      const rect = el.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = elementCenter - viewportCenter;

      el.style.transform = `translateY(${distance * speed}px)`;
    });
  }, { passive: true });
}

/* ---------- Smooth Scroll for Anchor Links ---------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector('.nav').offsetHeight;
        const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* ---------- AI Chat Interaction ---------- */
function initAIChat() {
  const suggestions = document.querySelectorAll('.ai-suggestion');
  const inputField = document.querySelector('.ai-input');
  const sendBtn = document.querySelector('.ai-send-btn');

  suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
      if (inputField) {
        inputField.value = suggestion.textContent;
        inputField.focus();

        // Animate the suggestion
        suggestion.style.background = 'var(--gray-300)';
        setTimeout(() => {
          suggestion.style.background = '';
        }, 300);
      }
    });
  });

  if (sendBtn && inputField) {
    const handleSend = () => {
      const text = inputField.value.trim();
      if (!text) return;

      // Quick visual feedback
      sendBtn.style.transform = 'scale(0.9)';
      setTimeout(() => {
        sendBtn.style.transform = '';
      }, 150);

      inputField.value = '';
    };

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }
}

/* ---------- Hero Scroll-Driven Frame Animation ---------- */
// This function is designed to be activated once actual JPG frames are available.
// It accepts a canvas element and an array of Image objects.
function initScrollFrameAnimation(canvas, frames) {
  if (!canvas || !frames || frames.length === 0) return;

  const ctx = canvas.getContext('2d');
  const heroVisual = document.querySelector('.hero-visual');

  function renderFrame(index) {
    const frame = frames[Math.min(index, frames.length - 1)];
    if (frame && frame.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    }
  }

  function onScroll() {
    const rect = heroVisual.getBoundingClientRect();
    const scrollRange = window.innerHeight + rect.height;
    const scrolled = window.innerHeight - rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollRange));
    const frameIndex = Math.floor(progress * (frames.length - 1));
    renderFrame(frameIndex);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  renderFrame(0);
}

// Export for external use
window.GitInsight = {
  initScrollFrameAnimation
};
