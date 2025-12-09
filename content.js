// Utility: safe query removal
function removeNodes(selectors) {
  if (!isEnabled()) return;
  
  selectors.forEach(sel => {
    try {
      document.querySelectorAll(sel).forEach(node => {
        // Avoid removing essential player nodes by checking common ad classes
        if (node && !node.hasAttribute('data-ycu-hidden')) {
          node.style.display = 'none';
          node.style.visibility = 'hidden';
          node.style.opacity = '0';
          node.setAttribute('data-ycu-hidden', 'true');
        }
      });
    } catch (error) {
      console.warn('Error removing nodes for selector:', sel, error);
    }
  });
}

// Utility: try to click "Skip Ad" if it's visible
function trySkipAd() {
  if (!isEnabled()) return;
  
  const skipButtons = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-ad-skip-button-container button'
  ];

  for (const sel of skipButtons) {
    try {
      const btn = document.querySelector(sel);
      if (btn && isVisible(btn)) {
        btn.click();
        break;
      }
    } catch (error) {
      console.warn('Error clicking skip button:', sel, error);
    }
  }
}

// Visibility check
function isVisible(el) {
  if (!el) return false;
  
  try {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      style.opacity !== '0'
    );
  } catch (error) {
    return false;
  }
}

// Core selectors to suppress
const AD_SELECTORS = [
  '.video-ads',
  '.ytp-ad-module',
  '.ytp-ad-player-overlay',
  '.ytp-ad-preview-slot',
  '.ytp-ad-text',
  '.ytp-ad-skip-button-container',
  '.ytp-ad-progress-list',
  '.ytp-ad-message-container',
  '.ytp-ad-overlay-slot',
  '.ytp-ad-image-overlay',
  '.ytp-ad-player-overlay-layout',
  '.ytp-ad-button',
  '.ytp-endscreen-ads-slot',
  'ad-slot',
  '.ad-slot',
  'ytd-promoted-video-renderer',
  '.ytd-promoted-video-renderer',
  'ytd-promoted-sparkles-web-renderer',
  '.ytd-promoted-sparkles-web-renderer',
  'ytd-promoted-sparkles-text-search-renderer',
  '.ytd-promoted-sparkles-text-search-renderer',
  'ytd-companion-slot-renderer',
  '.ytd-companion-slot-renderer',
  'ytd-statement-banner-renderer',
  '.ytd-statement-banner-renderer',
  'ytd-display-ad-renderer',
  '.ytd-display-ad-renderer',
  'ytd-action-companion-renderer',
  '.ytd-action-companion-renderer',
  'ytd-breaking-news-shell',
  '.ytd-breaking-news-shell',
  'ytd-rich-list-header-renderer',
  '.ytd-rich-list-header-renderer',
  'ytd-engagement-panel-section-list-renderer[panel-target-id="engagement-panel-ads"]',
  '#masthead-ad',
  '.ad-container',
  '.ad-div',
  '.ad-banner',
  '#player-ads',
  '.ytp-ad-overlay',
  '[data-ad-impression]',
  '.ytp-ad-module',
  // Additional common ad selectors
  '[data-ad-format]',
  '.ytd-ad-slot-renderer',
  '.ytd-in-feed-ad-layout-renderer',
  '.ytd-action-companion-ad-renderer'
];

// Periodic cleanup
let cleanupInterval;

function startCleanupLoop() {
  if (cleanupInterval) clearInterval(cleanupInterval);
  cleanupInterval = setInterval(() => {
    if (isEnabled()) {
      removeNodes(AD_SELECTORS);
      trySkipAd(); // only acts if a visible "Skip" exists
    }
  }, 500); // Reduced interval for better responsiveness
}

// Observe DOM mutations
function observeDom() {
  const observer = new MutationObserver(mutations => {
    if (!isEnabled()) return;
    
    let needsCleanup = false;
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        needsCleanup = true;
        break;
      }
    }
    if (needsCleanup) {
      removeNodes(AD_SELECTORS);
      trySkipAd();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function onNavigationChange() {
  // YouTube is an SPA; watch URL changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      // Re-run cleanup on navigation
      if (isEnabled()) {
        removeNodes(AD_SELECTORS);
        trySkipAd();
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

// Check if extension is enabled
function isEnabled() {
  try {
    return localStorage.getItem('ycu_enabled') !== '0';
  } catch (error) {
    console.warn('Error checking enabled state:', error);
    return true; // Default to enabled if there's an error
  }
}

// Initialization
(function init() {
  // Wait a bit for page to load
  setTimeout(() => {
    startCleanupLoop();
    observeDom();
    onNavigationChange();

    // Try early if DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      removeNodes(AD_SELECTORS);
      trySkipAd();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        removeNodes(AD_SELECTORS);
        trySkipAd();
      });
    }
  }, 100);
})();

// Also run cleanup when page gains focus (helps with tab switching)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isEnabled()) {
    removeNodes(AD_SELECTORS);
    trySkipAd();
  }
});

// Additional cleanup on window focus
window.addEventListener('focus', () => {
  if (isEnabled()) {
    removeNodes(AD_SELECTORS);
    trySkipAd();
  }
});
