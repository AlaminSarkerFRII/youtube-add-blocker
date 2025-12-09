// YouTube Clean UI - Stable Ad Blocker
// Optimized to prevent crashes and ensure smooth video playback

// Statistics tracking
let adsBlocked = 0;
let pagesCleaned = 0;
let isProcessing = false;

// Update statistics in storage
function updateStats(type) {
  if (type === 'adsBlocked') {
    adsBlocked++;
    chrome.storage.local.get(['adsBlocked'], (result) => {
      const total = (result.adsBlocked || 0) + 1;
      chrome.storage.local.set({ adsBlocked: total });
    });
  } else if (type === 'pagesCleaned') {
    pagesCleaned++;
    chrome.storage.local.get(['pagesCleaned'], (result) => {
      const total = (result.pagesCleaned || 0) + 1;
      chrome.storage.local.set({ pagesCleaned: total });
    });
  }
}

// Check if extension is enabled
function isEnabled() {
  try {
    return localStorage.getItem('ycu_enabled') !== '0';
  } catch (error) {
    console.warn('Error checking enabled state:', error);
    return true;
  }
}

// Safe element removal with crash prevention
function removeNodes(selectors) {
  if (!isEnabled() || isProcessing) return;
  
  let blockedCount = 0;
  isProcessing = true;
  
  try {
    // Process selectors in smaller batches to prevent overload
    let processed = 0;
    const maxSelectors = Math.min(selectors.length, 10); // Limit to prevent crashes
    
    for (let i = 0; i < maxSelectors; i++) {
      const sel = selectors[i];
      
      try {
        const nodes = document.querySelectorAll(sel);
        nodes.forEach(node => {
          if (node && !node.hasAttribute('data-ycu-hidden')) {
            // Don't block video-related elements
            const tagName = node.tagName.toLowerCase();
            const className = node.className || '';
            
            const isVideoElement = tagName === 'video' || 
                                 tagName === 'canvas' ||
                                 className.includes('html5-video-player') ||
                                 className.includes('video-container');
            
            if (!isVideoElement) {
              node.style.display = 'none';
              node.setAttribute('data-ycu-hidden', 'true');
              blockedCount++;
            }
          }
        });
        processed++;
        
        // Small delay every few selectors to prevent overload
        if (processed % 3 === 0) {
          // Non-blocking delay
          const start = Date.now();
          while (Date.now() - start < 5) {
            // Very small delay
          }
        }
      } catch (error) {
        console.warn('Error with selector:', sel, error);
      }
    }
  } catch (error) {
    console.error('Critical error in removeNodes:', error);
  } finally {
    isProcessing = false;
  }
  
  // Update statistics
  if (blockedCount > 0) {
    updateStats('adsBlocked');
  }
}

// Safe ad skip with minimal interference
function trySkipAd() {
  if (!isEnabled()) return;
  
  try {
    const skipButtons = [
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-container button'
    ];

    for (const sel of skipButtons) {
      try {
        const btn = document.querySelector(sel);
        if (btn && btn.offsetParent !== null) {
          btn.click();
          updateStats('adsBlocked');
          break;
        }
      } catch (error) {
        console.warn('Skip button error:', error);
      }
    }
  } catch (error) {
    console.error('Critical error in trySkipAd:', error);
  }
}

// Core ad selectors (conservative)
const AD_SELECTORS = [
  // Video player ads
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
  
  // Sidebar and promoted content
  'ytd-promoted-video-renderer',
  '.ytd-promoted-sparkles-web-renderer',
  'ytd-companion-slot-renderer',
  'ytd-statement-banner-renderer',
  'ytd-display-ad-renderer',
  'ytd-action-companion-renderer',
  
  // Homepage ads
  'ytd-rich-list-header-renderer',
  'ytd-engagement-panel-section-list-renderer[panel-target-id="engagement-panel-ads"]',
  '#masthead-ad',
  '.ad-container',
  '.ad-div',
  '.ad-banner',
  '#player-ads',
  
  // Generic ad indicators
  '[data-ad-impression]',
  '.ytp-ad-module',
  '[data-ad-format]'
];

// Periodic cleanup (conservative)
let cleanupInterval;

function startCleanupLoop() {
  if (cleanupInterval) clearInterval(cleanupInterval);
  
  // Longer interval to prevent crashes
  cleanupInterval = setInterval(() => {
    if (isEnabled() && !isProcessing) {
      removeNodes(AD_SELECTORS);
      trySkipAd();
    }
  }, 2000); // 2 seconds - much more conservative
}

// DOM observer (limited)
function observeDom() {
  try {
    // Check if document.documentElement exists before observing
    if (!document.documentElement) {
      console.warn('document.documentElement not available, retrying...');
      setTimeout(observeDom, 100);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      if (!isEnabled() || isProcessing) return;
      
      let needsCleanup = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0 && m.addedNodes.length < 10) {
          needsCleanup = true;
          break;
        }
      }
      
      if (needsCleanup && !isProcessing) {
        setTimeout(() => {
          if (isEnabled() && !isProcessing) {
            removeNodes(AD_SELECTORS.slice(0, 10)); // Limit to first 10 selectors
            trySkipAd();
          }
        }, 500);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false
    });
  } catch (error) {
    console.error('DOM observer error:', error);
  }
}

// Navigation watcher (simplified)
function onNavigationChange() {
  let lastUrl = location.href;
  
  try {
    // Check if document.body exists before observing
    if (!document.body) {
      console.warn('document.body not available, retrying...');
      setTimeout(onNavigationChange, 100);
      return;
    }

    const observer = new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl && !isProcessing) {
        lastUrl = url;
        updateStats('pagesCleaned');
        
        setTimeout(() => {
          if (isEnabled() && !isProcessing) {
            removeNodes(AD_SELECTORS.slice(0, 5)); // Very conservative on navigation
          }
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: false // Less intensive
    });
  } catch (error) {
    console.error('Navigation observer error:', error);
  }
}

// Safe initialization
function init() {
  try {
    updateStats('pagesCleaned');
    
    // Wait longer for page to stabilize
    setTimeout(() => {
      try {
        startCleanupLoop();
        observeDom();
        onNavigationChange();

        // Initial cleanup (very conservative)
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setTimeout(() => {
            if (isEnabled() && !isProcessing) {
              removeNodes(AD_SELECTORS.slice(0, 5)); // Only first 5 selectors initially
              trySkipAd();
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    }, 1000); // Longer initial delay
  } catch (error) {
    console.error('Critical initialization error:', error);
  }
}

// Event listeners (minimal)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isEnabled() && !isProcessing) {
    setTimeout(() => {
      removeNodes(AD_SELECTORS.slice(0, 3));
      trySkipAd();
    }, 500);
  }
});

window.addEventListener('focus', () => {
  if (isEnabled() && !isProcessing) {
    setTimeout(() => {
      removeNodes(AD_SELECTORS.slice(0, 3));
      trySkipAd();
    }, 500);
  }
});

// Start the extension
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
