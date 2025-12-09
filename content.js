// Statistics tracking
let adsBlocked = 0;
let pagesCleaned = 0;
let lastCleanupTime = Date.now();

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

// Utility: safe query removal
function removeNodes(selectors) {
  if (!isEnabled()) return;
  
  let blockedCount = 0;
  
  selectors.forEach(sel => {
    try {
      document.querySelectorAll(sel).forEach(node => {
        // Avoid removing essential player nodes by checking common ad classes
        if (node && !node.hasAttribute('data-ycu-hidden')) {
          node.style.display = 'none';
          node.style.visibility = 'hidden';
          node.style.opacity = '0';
          node.setAttribute('data-ycu-hidden', 'true');
          blockedCount++;
        }
      });
    } catch (error) {
      console.warn('Error removing nodes for selector:', sel, error);
    }
  });
  
  // Update statistics if we blocked something
  if (blockedCount > 0) {
    updateStats('adsBlocked');
  }
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

// Check for video ads more aggressively
function checkForVideoAds() {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    // Check for ad indicators
    const adIndicators = [
      '.ytp-ad-player-overlay',
      '.ytp-ad-text',
      '.ytp-ad-skip-button-container',
      '[data-ad-impression]',
      '.ytp-ad-module'
    ];
    
    let hasAd = false;
    for (const selector of adIndicators) {
      if (document.querySelector(selector)) {
        hasAd = true;
        break;
      }
    }
    
    // If ad detected, try to skip or block it
    if (hasAd) {
      trySkipAd();
      updateStats('adsBlocked');
      
      // Try to fast-forward video if possible
      if (videoElement.duration) {
        videoElement.currentTime = videoElement.duration;
      }
    }
  }
}

// More aggressive ad removal
function aggressiveAdRemoval() {
  // Look for ad-related class names in all elements
  const allElements = document.querySelectorAll('*');
  let blockedCount = 0;
  
  allElements.forEach(element => {
    const className = element.className || '';
    const id = element.id || '';
    
    // Check for ad-related patterns
    const adPatterns = [
      'ad', 'advertisement', 'promo', 'sponsored', 
      'commercial', 'banner', 'popup-ad'
    ];
    
    for (const pattern of adPatterns) {
      if (className.includes(pattern) || id.includes(pattern)) {
        // Make sure it's not a false positive
        const isFalsePositive = [
          'load', 'grade', 'badge', 'icon', 'avatar',
          'thumbnail', 'title', 'channel', 'video'
        ].some(safePattern => className.includes(safePattern));
        
        if (!isFalsePositive && !element.hasAttribute('data-ycu-hidden')) {
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.style.opacity = '0';
          element.setAttribute('data-ycu-hidden', 'true');
          blockedCount++;
        }
      }
    }
  });
  
  if (blockedCount > 0) {
    updateStats('adsBlocked');
  }
}

// Initialization
(function init() {
  // Initialize statistics for this page
  updateStats('pagesCleaned');
  
  // Wait a bit for page to load
  setTimeout(() => {
    startCleanupLoop();
    observeDom();
    onNavigationChange();

    // Try early if DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      removeNodes(AD_SELECTORS);
      trySkipAd();
      aggressiveAdRemoval();
      checkForVideoAds();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        removeNodes(AD_SELECTORS);
        trySkipAd();
        aggressiveAdRemoval();
        checkForVideoAds();
      });
    }
  }, 100);
})();

// Also run cleanup when page gains focus (helps with tab switching)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isEnabled()) {
    removeNodes(AD_SELECTORS);
    trySkipAd();
    aggressiveAdRemoval();
    checkForVideoAds();
  }
});

// Additional cleanup on window focus
window.addEventListener('focus', () => {
  if (isEnabled()) {
    removeNodes(AD_SELECTORS);
    trySkipAd();
    aggressiveAdRemoval();
    checkForVideoAds();
  }
});

// Enhanced video ad detection
function enhancedVideoAdDetection() {
  const video = document.querySelector('video');
  if (!video) return;
  
  // Check for ad-related attributes and classes
  const videoContainer = video.closest('.html5-video-player') || video.closest('.video-player') || video.parentElement;
  
  if (videoContainer) {
    // Look for ad-related class names in video container
    const containerClasses = videoContainer.className || '';
    const adIndicators = [
      'ad-showing', 'ad-interrupting', 'ad-break',
      'ytp-ad-mode', 'ytp-ad-slate', 'ytp-ad-preview'
    ];
    
    const hasAdIndicator = adIndicators.some(indicator => 
      containerClasses.includes(indicator)
    );
    
    if (hasAdIndicator) {
      updateStats('adsBlocked');
      
      // Try multiple skip methods
      trySkipAd();
      
      // Try to mute ad
      video.muted = true;
      
      // Try to fast-forward
      setTimeout(() => {
        if (video.duration) {
          video.currentTime = video.duration;
        }
      }, 100);
    }
    
    // Monitor video for ad changes
    const observer = new MutationObserver(() => {
      if (isEnabled()) {
        checkForVideoAds();
        enhancedVideoAdDetection();
      }
    });
    
    observer.observe(videoContainer, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    });
  }
}

// Periodic enhanced detection
setInterval(() => {
  if (isEnabled()) {
    enhancedVideoAdDetection();
    aggressiveAdRemoval();
  }
}, 1000); // Check every second for ads
