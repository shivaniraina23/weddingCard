// Loading screen
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    }, 1500);
  }
});

// Navigation management
const app = document.getElementById('app');
const pages = document.querySelectorAll('.page');
const navDots = document.querySelectorAll('.nav-dot');
let currentPageIndex = 0;
let isTransitioning = false;
const transitionDuration = 600; // Match CSS transition

// Reveal Animations using IntersectionObserver
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const elements = entry.target.querySelectorAll('.animate-on-scroll');
      elements.forEach((el, i) => {
        setTimeout(() => el.classList.add('animated'), i * 150);
      });
    } else {
      const elements = entry.target.querySelectorAll('.animate-on-scroll');
      elements.forEach(el => el.classList.remove('animated'));
    }
  });
}, { threshold: 0.2 });

pages.forEach(page => revealObserver.observe(page));

// Internal scroll & transition boundary tracking
let reachedBottomTime = 0;
let reachedTopTime = 0;

// Listen to scroll events on each page to track when edge is reached
pages.forEach(page => {
  page.addEventListener('scroll', () => {
    const isAtBottom = (page.scrollTop + page.clientHeight) >= (page.scrollHeight - 15);
    const isAtTop = page.scrollTop <= 10;

    if (!isAtBottom) {
      reachedBottomTime = 0;
    } else if (reachedBottomTime === 0) {
      reachedBottomTime = Date.now();
    }

    if (!isAtTop) {
      reachedTopTime = 0;
    } else if (reachedTopTime === 0) {
      reachedTopTime = Date.now();
    }
  }, { passive: true });
});

// Refined switchPage trigger
function switchPage(index) {
  if (index < 0 || index >= pages.length || index === currentPageIndex || isTransitioning) return;

  isTransitioning = true;
  reachedBottomTime = 0;
  reachedTopTime = 0;

  // Update nav dots
  navDots.forEach(dot => dot.classList.remove('active'));
  navDots[index]?.classList.add('active');

  const oldPage = pages[currentPageIndex];
  const newPage = pages[index];

  // Reset scroll position of target page so it opens at top
  if (newPage) {
    newPage.scrollTop = 0;
  }

  // Fade out old page
  if (oldPage) oldPage.classList.remove('active');

  // Fade in new page
  if (newPage) newPage.classList.add('active');

  currentPageIndex = index;

  // Update Scroll to Top button visibility
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    if (currentPageIndex > 0) {
      scrollTopBtn.classList.add('show');
    } else {
      scrollTopBtn.classList.remove('show');
    }
  }

  setTimeout(() => {
    isTransitioning = false;
  }, transitionDuration);
}

// Subtle Parallax Effect
window.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;

  const activePage = pages[currentPageIndex];
  if (!activePage) return;
  const floatingElements = activePage.querySelectorAll('.floating');

  floatingElements.forEach(el => {
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
});

// Initial state setup
if (pages.length > 0) {
  pages[0].classList.add('active');
}

// Wheel / Scroll Handling
window.addEventListener('wheel', (e) => {
  if (isTransitioning) return;
  if (Math.abs(e.deltaY) < 10) return;

  const activePage = pages[currentPageIndex];
  if (!activePage) return;

  // BLOCK SCROLLING DOWN FROM PAGE 1 (Index 0)
  // Page 2 can only be opened via the "Open Invitation" button
  if (currentPageIndex === 0 && e.deltaY > 0) {
    return;
  }

  const maxScroll = Math.max(0, activePage.scrollHeight - activePage.clientHeight);
  const isScrollable = maxScroll > 15;

  if (e.deltaY > 0) {
    // Scrolling DOWN (Pages 2 through 6)
    if (!isScrollable) {
      switchPage(currentPageIndex + 1);
      return;
    }

    const isAtBottom = (activePage.scrollTop + activePage.clientHeight) >= (activePage.scrollHeight - 15);

    if (!isAtBottom) {
      reachedBottomTime = 0;
      return;
    }

    if (reachedBottomTime === 0) {
      reachedBottomTime = Date.now();
      return;
    }

    if (Date.now() - reachedBottomTime >= 120) {
      reachedBottomTime = 0;
      switchPage(currentPageIndex + 1);
    }
  } else if (e.deltaY < 0) {
    // Scrolling UP
    if (!isScrollable) {
      switchPage(currentPageIndex - 1);
      return;
    }

    const isAtTop = activePage.scrollTop <= 10;

    if (!isAtTop) {
      reachedTopTime = 0;
      return;
    }

    if (reachedTopTime === 0) {
      reachedTopTime = Date.now();
      return;
    }

    if (Date.now() - reachedTopTime >= 120) {
      reachedTopTime = 0;
      switchPage(currentPageIndex - 1);
    }
  }
}, { passive: true });

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
  if (isTransitioning) return;

  const activePage = pages[currentPageIndex];
  if (!activePage) return;

  const maxScroll = Math.max(0, activePage.scrollHeight - activePage.clientHeight);
  const isScrollable = maxScroll > 15;

  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
    if (isScrollable && (activePage.scrollTop + activePage.clientHeight) < (activePage.scrollHeight - 15)) {
      e.preventDefault();
      activePage.scrollBy({ top: e.key === ' ' || e.key === 'PageDown' ? 300 : 100, behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    switchPage(currentPageIndex + 1);
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    if (isScrollable && activePage.scrollTop > 10) {
      e.preventDefault();
      activePage.scrollBy({ top: e.key === 'PageUp' ? -300 : -100, behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    switchPage(currentPageIndex - 1);
  }
});

// Touch / Swipe Navigation
let touchStartY = 0;
let touchStartX = 0;
let touchStartScrollTop = 0;
let isTouchActive = false;

document.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) return;
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
  isTouchActive = true;

  const activePage = pages[currentPageIndex];
  touchStartScrollTop = activePage ? activePage.scrollTop : 0;
}, { passive: true });

// Touch / Swipe Navigation
document.addEventListener('touchend', (e) => {
  if (!isTouchActive || isTransitioning) return;
  isTouchActive = false;

  const touchEndY = e.changedTouches[0].clientY;
  const touchEndX = e.changedTouches[0].clientX;
  const diffY = touchStartY - touchEndY;
  const diffX = touchStartX - touchEndX;

  if (Math.abs(diffX) > Math.abs(diffY)) return;
  if (Math.abs(diffY) < 35) return;

  const activePage = pages[currentPageIndex];
  if (!activePage) return;

  // BLOCK SWIPING UP ON PAGE 1 (Index 0)
  // Page 2 can only be opened via the "Open Invitation" button
  if (currentPageIndex === 0 && diffY > 35) {
    return;
  }

  const maxScroll = Math.max(0, activePage.scrollHeight - activePage.clientHeight);
  const isScrollable = maxScroll > 15;

  if (diffY > 35) {
    // Swiping UP -> scrolling DOWN (Pages 2 through 6)
    if (!isScrollable) {
      switchPage(currentPageIndex + 1);
      return;
    }

    const startedNearBottom = touchStartScrollTop >= maxScroll - 20;
    const isAtBottom = (activePage.scrollTop + activePage.clientHeight) >= (activePage.scrollHeight - 20);

    if (startedNearBottom || isAtBottom) {
      switchPage(currentPageIndex + 1);
    }
  } else if (diffY < -35) {
    // Swiping DOWN -> scrolling UP
    if (!isScrollable) {
      switchPage(currentPageIndex - 1);
      return;
    }

    const startedNearTop = touchStartScrollTop <= 15;
    const isAtTop = activePage.scrollTop <= 15;

    if (startedNearTop || isAtTop) {
      switchPage(currentPageIndex - 1);
    }
  }
}, { passive: true });

// Nav dot clicks
navDots.forEach((dot, index) => {
  dot.addEventListener('click', (e) => {
    e.preventDefault();
    switchPage(index);
  });
});

// Scroll to Top Button Click Handler
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Guard against triggering during an active page transition
    if (isTransitioning) return;

    // Switch smoothly back to Page 1 (Index 0)
    switchPage(0);
  });
}

// --- AUDIO & BUTTON CONTROLS ---
document.addEventListener('DOMContentLoaded', () => {
  const enterBtn = document.getElementById('enter-btn');
  const audio = document.getElementById('wedding-audio');
  const musicBtn = document.getElementById('music-btn');

  // 1. Open Invitation Button -> Plays Audio + Goes directly to Page 2
  if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (audio) {
        audio.muted = false;
        audio.volume = 1.0;
        audio.play().then(() => {
          if (musicBtn) musicBtn.classList.remove('is-muted');
        }).catch((err) => console.log("Audio start blocked:", err));
      }

      switchPage(1);
    });
  }

  // 2. Music Icon Toggle -> Mute / Unmute Cleanly
  if (musicBtn) {
    musicBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!audio) return;

      if (!audio.paused) {
        audio.pause();
        musicBtn.classList.add('is-muted');
      } else {
        audio.muted = false;
        audio.volume = 1.0;
        audio.play().then(() => {
          musicBtn.classList.remove('is-muted');
        }).catch((err) => console.log("Play failed:", err));
      }
    });
  }

  // 3. Pause Audio when browser tab goes to background
  document.addEventListener('visibilitychange', () => {
    if (!audio) return;

    if (document.hidden) {
      audio.pause();
    } else if (musicBtn && !musicBtn.classList.contains('is-muted')) {
      audio.play().catch(() => {});
    }
  });

  window.addEventListener('pagehide', () => {
    if (audio) audio.pause();
  });
});

// Countdown Timer Setup
const weddingDate = new Date('December 4, 2026 10:00:00').getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const distance = weddingDate - now;

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  if (daysEl) daysEl.innerText = days.toString().padStart(2, '0');
  if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, '0');
  if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, '0');
  if (secondsEl) secondsEl.innerText = seconds.toString().padStart(2, '0');

  if (distance < 0) {
    clearInterval(countdownInterval);
    const container = document.querySelector('.countdown-container');
    if (container) container.innerHTML = "<h3>The Celebration Has Begun!</h3>";
  }
}

const countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown();