// Background script for YouTube Clean UI Extension

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set default values
        chrome.storage.sync.set({
            enableClean: true,
            autoSkip: true,
            hidePromoted: true,
            cleanHomepage: true,
            debugLogging: false,
            cleanupInterval: 500,
            customSelectors: '',
            whitelist: ''
        });

        // Set install date for statistics
        chrome.storage.local.set({
            installDate: new Date().toISOString(),
            adsBlocked: 0,
            pagesCleaned: 0,
            adsSkipped: 0
        });

        console.log('YouTube Clean UI Extension installed');
    } else if (details.reason === 'update') {
        console.log('YouTube Clean UI Extension updated');
    }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'getSettings':
            chrome.storage.sync.get([
                'enableClean', 'autoSkip', 'hidePromoted', 'cleanHomepage',
                'debugLogging', 'cleanupInterval', 'customSelectors', 'whitelist'
            ]).then(sendResponse);
            return true; // Keep message channel open for async response

        case 'updateStats':
            // Update statistics from content script
            if (message.stats) {
                chrome.storage.local.get(message.stats.keys).then(current => {
                    const updated = {};
                    for (const key of message.stats.keys) {
                        updated[key] = (current[key] || 0) + (message.stats.values[key] || 0);
                    }
                    chrome.storage.local.set(updated);
                });
            }
            break

        case 'screenshot':
            // Handle screenshot capture for issue reporting
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                sendResponse({ screenshot: dataUrl });
            });
            return true;
    }
});

// Update badge with statistics
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.adsBlocked) {
            const count = changes.adsBlocked.newValue || 0;
            chrome.action.setBadgeText({ text: count.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
        }
    }
});

// Initialize badge
chrome.storage.local.get(['adsBlocked']).then(result => {
    const count = result.adsBlocked || 0;
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
});
