// Popup functionality for YouTube Clean UI Extension

class PopupController {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadSettings();
        this.loadStatistics();
        this.checkCurrentTab();
        this.initializeDeveloperAnimations();
    }

    initializeElements() {
        // Status elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.toggleSwitch = document.getElementById('toggleSwitch');
        
        // Statistics
        this.adsBlockedElement = document.getElementById('adsBlocked');
        this.pagesCleanedElement = document.getElementById('pagesCleaned');
        
        // Buttons
        this.refreshButton = document.getElementById('refreshButton');
        this.settingsButton = document.getElementById('settingsButton');
        this.reportButton = document.getElementById('reportButton');
        
        // Links
        this.optionsLink = document.getElementById('optionsLink');
        this.helpLink = document.getElementById('helpLink');
        this.githubLink = document.getElementById('githubLink');
        
        // Error message
        this.errorMessage = document.getElementById('errorMessage');
    }

    attachEventListeners() {
        // Toggle switch
        this.toggleSwitch.addEventListener('click', () => this.toggleExtension());
        
        // Buttons
        this.refreshButton.addEventListener('click', () => this.refreshCurrentTab());
        this.settingsButton.addEventListener('click', () => this.openSettings());
        this.reportButton.addEventListener('click', () => this.reportAdIssue());
        
        // Links
        this.optionsLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
        });
        
        this.helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.openHelpPage();
        });
        
        this.githubLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.openGitHub();
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['enabled']);
            const isEnabled = result.enabled !== false; // Default to enabled
            
            this.updateUI(isEnabled);
        } catch (error) {
            this.showError('Failed to load settings: ' + error.message);
            console.error('Error loading settings:', error);
        }
    }

    async loadStatistics() {
        try {
            const result = await chrome.storage.local.get(['adsBlocked', 'pagesCleaned']);
            const stats = {
                adsBlocked: result.adsBlocked || 0,
                pagesCleaned: result.pagesCleaned || 0
            };
            
            this.updateStatistics(stats);
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    updateUI(isEnabled) {
        if (isEnabled) {
            this.toggleSwitch.classList.add('active');
            this.statusIndicator.classList.add('active');
        } else {
            this.toggleSwitch.classList.remove('active');
            this.statusIndicator.classList.remove('active');
        }
    }

    updateStatistics(stats) {
        this.adsBlockedElement.textContent = this.formatNumber(stats.adsBlocked);
        this.pagesCleanedElement.textContent = this.formatNumber(stats.pagesCleaned);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    async toggleExtension() {
        try {
            const result = await chrome.storage.sync.get(['enabled']);
            const newEnabledState = !result.enabled;
            
            await chrome.storage.sync.set({ enabled: newEnabledState });
            
            // Update localStorage in content script
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggle',
                    enabled: newEnabledState
                }).catch(() => {
                    // Content script might not be loaded yet
                });
            }
            
            this.updateUI(newEnabledState);
            this.hideError();
        } catch (error) {
            this.showError('Failed to toggle extension: ' + error.message);
            console.error('Error toggling extension:', error);
        }
    }

    async refreshCurrentTab() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length > 0) {
                // Show loading state
                this.refreshButton.textContent = '🔄 Refreshing...';
                this.refreshButton.disabled = true;
                
                // Wait a moment before refreshing to let ad blocking finish
                setTimeout(() => {
                    chrome.tabs.reload(tabs[0].id);
                    
                    // Close popup after a delay to ensure refresh completes
                    setTimeout(() => {
                        window.close();
                    }, 500);
                }, 300);
            }
        } catch (error) {
            this.showError('Failed to refresh tab: ' + error.message);
            console.error('Error refreshing tab:', error);
            
            // Reset button state on error
            this.refreshButton.textContent = '🔄 Refresh Current Page';
            this.refreshButton.disabled = false;
        }
    }

    async openSettings() {
        try {
            chrome.runtime.openOptionsPage();
            window.close();
        } catch (error) {
            this.showError('Failed to open settings: ' + error.message);
            console.error('Error opening settings:', error);
        }
    }

    async reportAdIssue() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length > 0) {
                const tab = tabs[0];
                
                if (tab.url.includes('youtube.com')) {
                    // Capture screenshot
                    const screenshotUrl = await chrome.tabs.captureVisibleTab();
                    
                    // Create issue report
                    const issueReport = {
                        url: tab.url,
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        screenshot: screenshotUrl
                    };
                    
                    // Store for debugging
                    await chrome.storage.local.set({ 
                        lastIssueReport: issueReport 
                    });
                    
                    // Open GitHub issues
                    const githubUrl = 'https://github.com/AlaminSarkerFRII/youtube-add-blocker/issues/new?template=ad_report.md';
                    chrome.tabs.create({ url: githubUrl });
                    window.close();
                } else {
                    this.showError('Please navigate to YouTube to report an ad issue');
                }
            }
        } catch (error) {
            this.showError('Failed to report issue: ' + error.message);
            console.error('Error reporting issue:', error);
        }
    }

    openHelpPage() {
        chrome.tabs.create({ 
            url: 'https://github.com/AlaminSarkerFRII/youtube-add-blocker#troubleshooting' 
        });
        window.close();
    }

    openGitHub() {
        chrome.tabs.create({ 
            url: 'https://github.com/AlaminSarkerFRII/youtube-add-blocker' 
        });
        window.close();
    }

    async checkCurrentTab() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length > 0) {
                const tab = tabs[0];
                
                // Disable some features if not on YouTube
                if (!tab.url.includes('youtube.com')) {
                    this.refreshButton.disabled = true;
                    this.reportButton.disabled = true;
                    this.refreshButton.style.opacity = '0.5';
                    this.reportButton.style.opacity = '0.5';
                }
            }
        } catch (error) {
            console.error('Error checking current tab:', error);
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    initializeDeveloperAnimations() {
        // Add interactive hover effect to developer name
        const developerName = document.getElementById('developerName');
        const developerCredit = document.getElementById('developerCredit');
        
        if (developerName) {
            // Create heart particles on hover
            developerName.addEventListener('mouseenter', () => {
                this.createHeartParticle(developerName);
            });
            
            // Add glow effect on click
            developerName.addEventListener('click', () => {
                this.createGlowEffect(developerName);
            });
        }
        
        // Add floating animation to credit section
        if (developerCredit) {
            this.addFloatingAnimation(developerCredit);
        }
    }

    createHeartParticle(element) {
        const heart = document.createElement('span');
        heart.className = 'heart-particle';
        heart.textContent = '❤️';
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        element.appendChild(heart);
        
        // Remove after animation completes
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 3000);
    }

    createGlowEffect(element) {
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'scale(1.2)';
        element.style.filter = 'drop-shadow(0 0 20px rgba(255,255,255,0.8))';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.filter = 'none';
        }, 300);
    }

    addFloatingAnimation(element) {
        // Add subtle floating animation
        element.style.animation = 'fadeInUp 1s ease-out, floatUp 6s ease-in-out infinite';
        
        // Change animation timing periodically for variety
        setInterval(() => {
            const duration = (Math.random() * 3 + 4) + 's';
            element.style.animationDuration = `fadeInUp 1s ease-out, floatUp ${duration} ease-in-out infinite`;
        }, 5000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});

// Handle storage changes from other parts of the extension
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' || namespace === 'sync') {
        if (changes.adsBlocked || changes.pagesCleaned) {
            // Update statistics if they change
            const popup = new PopupController();
            popup.loadStatistics();
        }
    }
});
