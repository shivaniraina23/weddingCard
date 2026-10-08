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
let isShortcutMode = false; // Tracks if user navigated via shortcut modal
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

  // Update Scroll to Top button visibility (Only in normal feed mode)
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    if (currentPageIndex > 0 && !isShortcutMode) {
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
  if (isTransitioning || isShortcutMode) return; // Disable scrolling across pages in shortcut mode
  if (Math.abs(e.deltaY) < 10) return;

  const activePage = pages[currentPageIndex];
  if (!activePage) return;

  if (currentPageIndex === 0 && e.deltaY > 0) {
    return;
  }

  const maxScroll = Math.max(0, activePage.scrollHeight - activePage.clientHeight);
  const isScrollable = maxScroll > 15;

  if (e.deltaY > 0) {
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
  if (isTransitioning || isShortcutMode) return; // Disable shortcut mode page switching

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

document.addEventListener('touchend', (e) => {
  if (!isTouchActive || isTransitioning || isShortcutMode) return; // Disable touch page switching in shortcut mode
  isTouchActive = false;

  const touchEndY = e.changedTouches[0].clientY;
  const touchEndX = e.changedTouches[0].clientX;
  const diffY = touchStartY - touchEndY;
  const diffX = touchStartX - touchEndX;

  if (Math.abs(diffX) > Math.abs(diffY)) return;
  if (Math.abs(diffY) < 35) return;

  const activePage = pages[currentPageIndex];
  if (!activePage) return;

  if (currentPageIndex === 0 && diffY > 35) {
    return;
  }

  const maxScroll = Math.max(0, activePage.scrollHeight - activePage.clientHeight);
  const isScrollable = maxScroll > 15;

  if (diffY > 35) {
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
    isShortcutMode = false;
    switchPage(index);
  });
});

// Scroll to Top Button Click Handler
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTransitioning) return;
    isShortcutMode = false;
    switchPage(0);
  });
}

// Audio Helper Function
function playWeddingAudio() {
  const audio = document.getElementById('wedding-audio');
  const musicBtn = document.getElementById('music-btn');

  if (audio && audio.paused) {
    audio.muted = false;
    audio.volume = 1.0;
    audio.play().then(() => {
      if (musicBtn) musicBtn.classList.remove('is-muted');
    }).catch((err) => console.log("Audio play blocked by browser:", err));
  }
}

// --- AUDIO & BUTTON CONTROLS ---
document.addEventListener('DOMContentLoaded', () => {
  const enterBtn = document.getElementById('enter-btn');
  const audio = document.getElementById('wedding-audio');
  const musicBtn = document.getElementById('music-btn');

  // Play audio on "Open Invitation" click
  if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      playWeddingAudio();
      isShortcutMode = false;
      switchPage(1);
    });
  }

  // Toggle Mute / Unmute manually
  if (musicBtn) {
    musicBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!audio) return;

      if (!audio.paused) {
        audio.pause();
        musicBtn.classList.add('is-muted');
      } else {
        playWeddingAudio();
      }
    });
  }

  // Handle visibility & tab changes
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

// Navigation Modal Controls
const navToggleBtn = document.getElementById('nav-toggle-btn');
const navCloseBtn = document.getElementById('nav-close-btn');
const navModal = document.getElementById('nav-modal');

function openNavMenu() {
  if (navModal) navModal.classList.add('active');
  playWeddingAudio(); // Trigger audio playback when opening nav menu
}

function closeNavMenu() {
  if (navModal) navModal.classList.remove('active');
}

if (navToggleBtn) navToggleBtn.addEventListener('click', openNavMenu);
if (navCloseBtn) navCloseBtn.addEventListener('click', closeNavMenu);

window.addEventListener('click', (e) => {
  if (e.target === navModal) closeNavMenu();
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

function sendWishesToWhatsApp(event) {
  event.preventDefault();

  const name = document.getElementById('guest-name').value.trim();
  const attendance = document.querySelector('input[name="attendance"]:checked').value;
  const blessing = document.getElementById('guest-blessing').value.trim();

  let message = `*🌸 Wedding Blessings & RSVP 🌸*\n\n`;
  message += `*From:* ${name}\n`;
  message += `*Attendance:* ${attendance}\n`;
  if (blessing) {
    message += `*Blessings:* "${blessing}"\n`;
  }

  const phoneNumber = "919149451381";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, '_blank');
}

// Dynamic Tab Switcher for Wedding Details / Travel Page
function switchDetailTab(tabId, btnElement) {
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active-content');
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add('active-content');
  }

  if (btnElement) {
    btnElement.classList.add('active');
  }
}

// Helper function to reset detail tabs back to default (e.g., Schedule tab)
function resetDetailTabsToDefault() {
  const defaultTabBtn = document.querySelector('.tab-btn');
  const firstTabContent = document.querySelector('.tab-content');

  if (defaultTabBtn && firstTabContent) {
    // Reset buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    defaultTabBtn.classList.add('active');

    // Reset contents
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active-content'));
    firstTabContent.classList.add('active-content');
  }
}

// Centralized Shortcut Navigation Function
function navigateToSection(targetPageId, targetTabId = null) {
  closeNavMenu();

  const navDotsEl = document.querySelector('.nav-dots');
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  if (targetPageId === 'page-1') {
    // Returning Home -> Restores Main Feed Navigation Mode
    isShortcutMode = false;
    if (navDotsEl) navDotsEl.style.display = 'flex';

    // Reset tabbed sections back to default (Schedule tab)
    resetDetailTabsToDefault();
  } else {
    // Entering Shortcut Mode -> Disable main feed scroll & side dots
    isShortcutMode = true;
    if (navDotsEl) navDotsEl.style.display = 'none';
    if (scrollTopBtn) scrollTopBtn.classList.remove('show');
  }

  const targetPage = document.getElementById(targetPageId);
  if (targetPage) {
    // Reset target page internal scroll to top
    targetPage.scrollTop = 0;

    // Switch active page
    const index = Array.from(pages).findIndex(p => p.id === targetPageId);
    if (index !== -1) {
      pages.forEach(p => p.classList.remove('active'));
      targetPage.classList.add('active');
      currentPageIndex = index;
    }

    // If a specific inner tab was requested by the shortcut (e.g., Travel tab)
    if (targetTabId) {
      const tabBtnToActivate = document.querySelector(`[onclick*="${targetTabId}"]`);
      switchDetailTab(targetTabId, tabBtnToActivate);
    }
  }
}

// Shortcut Click Handlers
function goToHome(e) {
  if (e) e.preventDefault();
  navigateToSection('page-1');
}

function goToWeddingInfo(e) {
  if (e) e.preventDefault();
  navigateToSection('page-4'); // Default tab will open
}

function goToTravelInfo(e) {
  if (e) e.preventDefault();
  navigateToSection('page-4', 'travel-tab'); // Opens page-4 directly on travel tab
}

function goToBlessings(e) {
  if (e) e.preventDefault();
  navigateToSection('page-5');
}

function goToRsvp(e) {
  if (e) e.preventDefault();
  navigateToSection('page-6');
}