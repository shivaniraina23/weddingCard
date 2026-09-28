// Loading screen
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('hidden');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }, 1500);
});

// Navigation management
const app = document.getElementById('app');
const pages = document.querySelectorAll('.page');
const navDots = document.querySelectorAll('.nav-dot');
let currentPageIndex = 0;
let isTransitioning = false;
const transitionDuration = 1000; // Match CSS transition

// Reveal Animations using IntersectionObserver
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const elements = entry.target.querySelectorAll('.animate-on-scroll');
      elements.forEach((el, i) => {
        setTimeout(() => el.classList.add('animated'), i * 150);
      });
      // Optionally unobserve if you only want it to run once
      // revealObserver.unobserve(entry.target);
    } else {
      // Reset animations when leaving page (optional, based on preference)
      const elements = entry.target.querySelectorAll('.animate-on-scroll');
      elements.forEach(el => el.classList.remove('animated'));
    }
  });
}, { threshold: 0.2 });

pages.forEach(page => revealObserver.observe(page));

// Scroll & transition tracking
let boundaryDeltaY = 0;
let boundaryTimer = null;
let lastScrollTime = 0;

// Listen to scroll events on each page to track internal scroll activity
pages.forEach(page => {
  page.addEventListener('scroll', () => {
    lastScrollTime = Date.now();
  }, { passive: true });
});

// Helper: Calculate whether active page can scroll internally
function getScrollMetrics(element) {
  if (!element) {
    return { canScrollDown: false, canScrollUp: false, isScrollable: false, scrollTop: 0, maxScroll: 0 };
  }
  const scrollTop = element.scrollTop;
  const maxScroll = Math.max(0, element.scrollHeight - element.clientHeight);
  const tolerance = 6; // px tolerance for subpixel/zoom rounding

  const isScrollable = maxScroll > tolerance;
  const canScrollDown = isScrollable && scrollTop < maxScroll - tolerance;
  const canScrollUp = isScrollable && scrollTop > tolerance;

  return { canScrollDown, canScrollUp, isScrollable, scrollTop, maxScroll };
}

// Refined switchPage trigger
function switchPage(index) {
  if (index < 0 || index >= pages.length || index === currentPageIndex || isTransitioning) return;

  isTransitioning = true;
  boundaryDeltaY = 0;

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
  oldPage.classList.remove('active');

  // Fade in new page
  newPage.classList.add('active');

  currentPageIndex = index;

  // Update Scroll to Top button visibility
  if (scrollTopBtn) {
    if (currentPageIndex > 0) {
      scrollTopBtn.classList.add('show');
    } else {
      scrollTopBtn.classList.remove('show');
    }
  }

  setTimeout(() => {
    isTransitioning = false;
    boundaryDeltaY = 0;
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

// Initial state
pages[0].classList.add('active');

// Wheel / Scroll Handling with Internal Scroll Protection
window.addEventListener('wheel', (e) => {
  clearAutoScrollTimer();
  if (isTransitioning) return;

  const activePage = pages[currentPageIndex];
  if (!activePage) return;

  const { canScrollDown, canScrollUp, isScrollable } = getScrollMetrics(activePage);

  if (e.deltaY > 0) {
    // Scrolling DOWN
    if (canScrollDown) {
      // Content has room to scroll down: allow native scrolling and keep track of scroll activity
      boundaryDeltaY = 0;
      lastScrollTime = Date.now();
      return;
    }

    // User is at the bottom of the page (or page is not scrollable).
    // Prevent accidental overshoot immediately after finishing internal scroll:
    if (isScrollable && (Date.now() - lastScrollTime < 450)) {
      boundaryDeltaY = 0;
      return;
    }

    // Accumulate boundary scroll delta for intentional transition
    boundaryDeltaY += e.deltaY;
    clearTimeout(boundaryTimer);
    boundaryTimer = setTimeout(() => {
      boundaryDeltaY = 0;
    }, 350);

    const threshold = isScrollable ? 100 : 50;
    if (boundaryDeltaY >= threshold) {
      boundaryDeltaY = 0;
      switchPage(currentPageIndex + 1);
    }
  } else if (e.deltaY < 0) {
    // Scrolling UP
    if (canScrollUp) {
      // Content has room to scroll up: allow native scrolling
      boundaryDeltaY = 0;
      lastScrollTime = Date.now();
      return;
    }

    // User is at the top of the page (or page is not scrollable).
    if (isScrollable && (Date.now() - lastScrollTime < 450)) {
      boundaryDeltaY = 0;
      return;
    }

    boundaryDeltaY += Math.abs(e.deltaY);
    clearTimeout(boundaryTimer);
    boundaryTimer = setTimeout(() => {
      boundaryDeltaY = 0;
    }, 350);

    const threshold = isScrollable ? 100 : 50;
    if (boundaryDeltaY >= threshold) {
      boundaryDeltaY = 0;
      switchPage(currentPageIndex - 1);
    }
  }
}, { passive: true });

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
  clearAutoScrollTimer();
  if (isTransitioning) return;

  const activePage = pages[currentPageIndex];
  if (!activePage) return;

  const { canScrollDown, canScrollUp } = getScrollMetrics(activePage);

  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
    if (canScrollDown) {
      e.preventDefault();
      activePage.scrollBy({ top: e.key === ' ' || e.key === 'PageDown' ? 300 : 100, behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    switchPage(currentPageIndex + 1);
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    if (canScrollUp) {
      e.preventDefault();
      activePage.scrollBy({ top: e.key === 'PageUp' ? -300 : -100, behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    switchPage(currentPageIndex - 1);
  }
});

// Touch / Swipe Navigation with Internal Scroll Protection
let touchStartY = 0;
let touchStartX = 0;
let touchStartScrollTop = 0;
let isTouchActive = false;

document.addEventListener('touchstart', (e) => {
  clearAutoScrollTimer();
  if (e.touches.length !== 1) return;
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
  isTouchActive = true;

  const activePage = pages[currentPageIndex];
  touchStartScrollTop = activePage ? activePage.scrollTop : 0;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (!isTouchActive || isTransitioning) return;
  isTouchActive = false;

  const touchEndY = e.changedTouches[0].clientY;
  const touchEndX = e.changedTouches[0].clientX;
  const diffY = touchStartY - touchEndY;
  const diffX = touchStartX - touchEndX;

  // Ignore horizontal swipes
  if (Math.abs(diffX) > Math.abs(diffY)) return;

  const activePage = pages[currentPageIndex];
  if (!activePage) return;

  const currentScrollTop = activePage.scrollTop;
  const scrollDiff = Math.abs(currentScrollTop - touchStartScrollTop);

  // If internal scrolling occurred during this gesture, stay on current page
  if (scrollDiff > 8) {
    return;
  }

  const { canScrollDown, canScrollUp } = getScrollMetrics(activePage);

  // Swiping UP -> intended to scroll down
  if (diffY > 60) {
    if (!canScrollDown) {
      switchPage(currentPageIndex + 1);
    }
  }
  // Swiping DOWN -> intended to scroll up
  else if (diffY < -60) {
    if (!canScrollUp) {
      switchPage(currentPageIndex - 1);
    }
  }
}, { passive: true });

// Nav dot clicks
navDots.forEach((dot, index) => {
  dot.addEventListener('click', (e) => {
    e.preventDefault();
    clearAutoScrollTimer();
    switchPage(index);
  });
});

// Auto-scroll from Page 1 to Page 2 after 5s inactivity
let autoScrollTimer;
const AUTO_SCROLL_DELAY = 5000; // 5 seconds

function startAutoScrollTimer() {
  autoScrollTimer = setTimeout(() => {
    // Only auto-scroll if we are still on the first page
    if (currentPageIndex === 0 && !isTransitioning) {
      switchPage(1);
    }
  }, AUTO_SCROLL_DELAY);
}

function clearAutoScrollTimer() {
  if (autoScrollTimer) {
    clearTimeout(autoScrollTimer);
    autoScrollTimer = null;

    // Remove listeners once timer is cleared to save resources
    window.removeEventListener('scroll', clearAutoScrollTimer);
    window.removeEventListener('touchstart', clearAutoScrollTimer);
    window.removeEventListener('mousedown', clearAutoScrollTimer);
    window.removeEventListener('keydown', clearAutoScrollTimer);
  }
}

// Start timer on load
window.addEventListener('load', () => {
  startAutoScrollTimer();

  // Clear timer on any user interaction
  window.addEventListener('scroll', clearAutoScrollTimer);
  window.addEventListener('touchstart', clearAutoScrollTimer);
  window.addEventListener('mousedown', clearAutoScrollTimer);
  window.addEventListener('keydown', clearAutoScrollTimer);
});

// Scroll to Top Functionality
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    if (isTransitioning) return;
    switchPage(0);
  });
}
// Music Control Logic
const musicToggle = document.getElementById('musicToggle');
const bgMusic = document.getElementById('bgMusic');
let isPlaying = false;

if (musicToggle && bgMusic) {
  musicToggle.addEventListener('click', () => {
    if (isPlaying) {
      bgMusic.pause();
      musicToggle.classList.remove('playing');
    } else {
      bgMusic.play().catch(e => console.log("Audio play blocked by browser", e));
      musicToggle.classList.add('playing');
    }
    isPlaying = !isPlaying;
  });
}

// Contact/RSVP Form Simulation
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button');
    const originalText = btn.textContent;

    // Disable button and show loading state
    btn.disabled = true;
    btn.textContent = 'Sending...';

    // Simulate API call
    setTimeout(() => {
      btn.textContent = 'Message Sent! ✨';
      contactForm.reset();

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = originalText;
      }, 3000);
    }, 1500);
  });
}

// Countdown Timer
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

// Countdown Timer
