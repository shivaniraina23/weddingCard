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

// Refined switchPage trigger
function switchPage(index) {
  if (index < 0 || index >= pages.length || index === currentPageIndex || isTransitioning) return;

  isTransitioning = true;

  // Update nav dots
  navDots.forEach(dot => dot.classList.remove('active'));
  navDots[index]?.classList.add('active');

  const oldPage = pages[currentPageIndex];
  const newPage = pages[index];

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
  }, transitionDuration);
}

// Subtle Parallax Effect
window.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;

  const activePage = pages[currentPageIndex];
  const floatingElements = activePage.querySelectorAll('.floating');

  floatingElements.forEach(el => {
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
});

// Initial state
pages[0].classList.add('active');

// Wheel / Scroll "interference"
window.addEventListener('wheel', (e) => {
  if (isTransitioning) return;
  if (Math.abs(e.deltaY) < 30) return; // Threshold for intentional scroll

  if (e.deltaY > 0) {
    switchPage(currentPageIndex + 1);
  } else {
    switchPage(currentPageIndex - 1);
  }
}, { passive: true });

// Keyboard "interference"
document.addEventListener('keydown', (e) => {
  if (isTransitioning) return;
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault();
    switchPage(currentPageIndex + 1);
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    switchPage(currentPageIndex - 1);
  }
});

// Touch / Swipe "interference"
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (isTransitioning) return;
  const touchEndY = e.changedTouches[0].clientY;
  const diff = touchStartY - touchEndY;

  if (Math.abs(diff) > 50) { // Threshold for swipe
    if (diff > 0) {
      switchPage(currentPageIndex + 1);
    } else {
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

// Auto-scroll from Page 1 to Page 2 after 5s inactivity
let autoScrollTimer;
const AUTO_SCROLL_DELAY = 5000; // 5 seconds

function startAutoScrollTimer() {
  autoScrollTimer = setTimeout(() => {
    const scrollPos = window.scrollY;
    // Only auto-scroll if we are still on the first page
    if (scrollPos < window.innerHeight / 2) {
      const page2 = document.getElementById('page-2');
      if (page2) {
        page2.scrollIntoView({ behavior: 'smooth' });
      }
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
