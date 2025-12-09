// Options page functionality for YouTube Clean UI Extension

class OptionsController {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadSettings();
        this.loadStatistics();
        this.initializeDefaultValues();
    }

    initializeElements() {
        // Toggle switches
        this.enableCleanToggle = document.getElementById('enableClean');
        this.autoSkipToggle = document.getElementById('autoSkip');
        this.hidePromotedToggle = document.getElementById('hidePromoted');
        this.cleanHomepageToggle = document.getElementById('cleanHomepage');
        this.debugLoggingToggle = document.getElementById('debugLogging');

        // Input elements
        this.cleanupIntervalInput = document.getElementById('cleanupInterval');
        this.customSelectorsTextarea = document.getElementById('customSelectors');
        this.whitelistTextarea = document.getElementById('whitelist');

        // Statistics elements
        this.totalAdsBlockedElement = document.getElementById('totalAdsBlocked');
        this.totalPagesCleanedElement = document.getElementById('totalPagesCleaned');
        this.totalSkipsElement = document.getElementById('totalSkips');
        this.daysActiveElement = document.getElementById('daysActive');

        // Buttons
        this.resetStatsButton = document.getElementById('resetStats');
        this.exportStatsButton = document.getElementById('exportStats');
        this.resetSettingsButton = document.getElementById('resetSettings');
        this.backupSettingsButton = document.getElementById('backupSettings');
        this.restoreSettingsButton = document.getElementById('restoreSettings');

        // Links
        this.helpLink = document.getElementById('helpLink');
        this.githubLink = document.getElementById('githubLink');
        this.reportIssueLink = document.getElementById('reportIssue');

        // Other
        this.statusMessage = document.getElementById('statusMessage');
        this.fileInput = document.getElementById('fileInput');
    }

    attachEventListeners() {
        // Toggle switches
        this.enableCleanToggle.addEventListener('click', () => this.toggleSetting('enableClean'));
        this.autoSkipToggle.addEventListener('click', () => this.toggleSetting('autoSkip'));
        this.hidePromotedToggle.addEventListener('click', () => this.toggleSetting('hidePromoted'));
        this.cleanHomepageToggle.addEventListener('click', () => this.toggleSetting('cleanHomepage'));
        this.debugLoggingToggle.addEventListener('click', () => this.toggleSetting('debugLogging'));

        // Input changes
        this.cleanupIntervalInput.addEventListener('change', () => this.saveInputSetting('cleanupInterval'));
        this.customSelectorsTextarea.addEventListener('change', () => this.saveInputSetting('customSelectors'));
        this.whitelistTextarea.addEventListener('change', () => this.saveInputSetting('whitelist'));

        // Buttons
        this.resetStatsButton.addEventListener('click', () => this.resetStatistics());
        this.exportStatsButton.addEventListener('click', () => this.exportStatistics());
        this.resetSettingsButton.addEventListener('click', () => this.resetAllSettings());
        this.backupSettingsButton.addEventListener('click', () => this.backupSettings());
        this.restoreSettingsButton.addEventListener('click', () => this.restoreSettings());

        // Links
        this.helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.openHelpPage();
        });
        this.githubLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.openGitHub();
        });
        this.reportIssueLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.reportIssue();
        });

        // File input
        this.fileInput.addEventListener('change', (e) => this.handleFileImport(e));
    }

    initializeDefaultValues() {
        // Set default values for settings that might not exist
        const defaultSettings = {
            enableClean: true,
            autoSkip: true,
            hidePromoted: true,
            cleanHomepage: true,
            debugLogging: false,
            cleanupInterval: 500,
            customSelectors: '',
            whitelist: ''
        };

        chrome.storage.sync.get(Object.keys(defaultSettings), (result) => {
            const needsUpdate = {};
            for (const [key, defaultValue] of Object.entries(defaultSettings)) {
                if (result[key] === undefined) {
                    needsUpdate[key] = defaultValue;
                }
            }
            if (Object.keys(needsUpdate).length > 0) {
                chrome.storage.sync.set(needsUpdate, () => {
                    this.loadSettings();
                });
            }
        });
    }

    async loadSettings() {
        try {
            const settings = await chrome.storage.sync.get([
                'enableClean', 'autoSkip', 'hidePromoted', 'cleanHomepage', 
                'debugLogging', 'cleanupInterval', 'customSelectors', 'whitelist'
            ]);

            // Update toggle switches
            this.updateToggle(this.enableCleanToggle, settings.enableClean !== false);
            this.updateToggle(this.autoSkipToggle, settings.autoSkip !== false);
            this.updateToggle(this.hidePromotedToggle, settings.hidePromoted !== false);
            this.updateToggle(this.cleanHomepageToggle, settings.cleanHomepage !== false);
            this.updateToggle(this.debugLoggingToggle, settings.debugLogging === true);

            // Update input fields
            this.cleanupIntervalInput.value = settings.cleanupInterval || 500;
            this.customSelectorsTextarea.value = settings.customSelectors || '';
            this.whitelistTextarea.value = settings.whitelist || '';

            // Sync with localStorage for content script compatibility
            localStorage.setItem('ycu_enabled', settings.enableClean !== false ? '1' : '0');
        } catch (error) {
            this.showStatus('Error loading settings: ' + error.message, 'error');
            console.error('Error loading settings:', error);
        }
    }

    async loadStatistics() {
        try {
            const stats = await chrome.storage.local.get([
                'adsBlocked', 'pagesCleaned', 'adsSkipped', 'installDate'
            ]);

            const adsBlocked = stats.adsBlocked || 0;
            const pagesCleaned = stats.pagesCleaned || 0;
            const adsSkipped = stats.adsSkipped || 0;
            const installDate = stats.installDate || new Date().toISOString();
            
            const daysActive = Math.floor((new Date() - new Date(installDate)) / (1000 * 60 * 60 * 24));

            this.totalAdsBlockedElement.textContent = this.formatNumber(adsBlocked);
            this.totalPagesCleanedElement.textContent = this.formatNumber(pagesCleaned);
            this.totalSkipsElement.textContent = this.formatNumber(adsSkipped);
            this.daysActiveElement.textContent = daysActive;
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    updateToggle(element, isActive) {
        if (isActive) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    }

    async toggleSetting(settingName) {
        try {
            const result = await chrome.storage.sync.get([settingName]);
            const currentValue = result[settingName];
            const newValue = !currentValue;

            await chrome.storage.sync.set({ [settingName]: newValue });

            // Update localStorage for compatibility
            if (settingName === 'enableClean') {
                localStorage.setItem('ycu_enabled', newValue ? '1' : '0');
            }

            // Update UI
            const toggleElement = document.getElementById(settingName);
            this.updateToggle(toggleElement, newValue);

            // Show status
            this.showStatus(`${this.formatSettingName(settingName)} ${newValue ? 'enabled' : 'disabled'}`, 'success');

            // Notify content scripts
            this.notifyContentScripts();
        } catch (error) {
            this.showStatus('Error updating setting: ' + error.message, 'error');
            console.error('Error toggling setting:', error);
        }
    }

    async saveInputSetting(settingName) {
        try {
            let value;
            switch (settingName) {
                case 'cleanupInterval':
                    value = parseInt(this.cleanupIntervalInput.value);
                    break;
                case 'customSelectors':
                    value = this.customSelectorsTextarea.value;
                    break;
                case 'whitelist':
                    value = this.whitelistTextarea.value;
                    break;
            }

            await chrome.storage.sync.set({ [settingName]: value });
            this.showStatus(`${this.formatSettingName(settingName)} updated`, 'success');

            // Notify content scripts of changes
            this.notifyContentScripts();
        } catch (error) {
            this.showStatus('Error saving setting: ' + error.message, 'error');
            console.error('Error saving input setting:', error);
        }
    }

    async resetStatistics() {
        if (!confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            return;
        }

        try {
            await chrome.storage.local.set({
                adsBlocked: 0,
                pagesCleaned: 0,
                adsSkipped: 0
            });

            this.loadStatistics();
            this.showStatus('Statistics reset successfully', 'success');
        } catch (error) {
            this.showStatus('Error resetting statistics: ' + error.message, 'error');
            console.error('Error resetting statistics:', error);
        }
    }

    async exportStatistics() {
        try {
            const stats = await chrome.storage.local.get(['adsBlocked', 'pagesCleaned', 'adsSkipped', 'installDate']);
            const settings = await chrome.storage.sync.get([
                'enableClean', 'autoSkip', 'hidePromoted', 'cleanHomepage', 
                'debugLogging', 'cleanupInterval', 'customSelectors', 'whitelist'
            ]);

            const exportData = {
                timestamp: new Date().toISOString(),
                statistics: stats,
                settings: settings,
                version: '1.0.0'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `youtube-clean-ui-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.showStatus('Data exported successfully', 'success');
        } catch (error) {
            this.showStatus('Error exporting data: ' + error.message, 'error');
            console.error('Error exporting data:', error);
        }
    }

    async resetAllSettings() {
        if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            return;
        }

        try {
            // Clear sync storage
            await chrome.storage.sync.clear();
            
            // Set defaults
            const defaults = {
                enableClean: true,
                autoSkip: true,
                hidePromoted: true,
                cleanHomepage: true,
                debugLogging: false,
                cleanupInterval: 500,
                customSelectors: '',
                whitelist: ''
            };
            
            await chrome.storage.sync.set(defaults);
            
            // Reload settings
            this.loadSettings();
            this.showStatus('All settings reset to defaults', 'success');
            
            // Notify content scripts
            this.notifyContentScripts();
        } catch (error) {
            this.showStatus('Error resetting settings: ' + error.message, 'error');
            console.error('Error resetting settings:', error);
        }
    }

    async backupSettings() {
        this.exportStatistics(); // Reuse export functionality
    }

    restoreSettings() {
        this.fileInput.click();
    }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.settings) {
                await chrome.storage.sync.set(data.settings);
                await this.loadSettings();
                this.showStatus('Settings restored successfully', 'success');
                this.notifyContentScripts();
            }

            if (data.statistics) {
                await chrome.storage.local.set(data.statistics);
                this.loadStatistics();
            }
        } catch (error) {
            this.showStatus('Error importing file: ' + error.message, 'error');
            console.error('Error importing file:', error);
        }

        // Clear file input
        event.target.value = '';
    }

    notifyContentScripts() {
        chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {
                    // Content script might not be loaded
                });
            });
        });
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatSettingName(settingName) {
        return settingName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';

        setTimeout(() => {
            this.statusMessage.style.display = 'none';
        }, 3000);
    }

    openHelpPage() {
        chrome.tabs.create({ 
            url: 'https://github.com/AlaminSarkerFRII/youtube-add-blocker#troubleshooting' 
        });
    }

    openGitHub() {
        chrome.tabs.create({ 
            url: 'https://github.com/AlaminSarkerFRII/youtube-add-blocker' 
        });
    }

    reportIssue() {
        chrome.tabs.create({ 
            url: 'https://github.com/AlaminSarkerFRII/youtube-add-blocker/issues/new' 
        });
    }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OptionsController();
});

// Handle storage changes from other parts of the extension
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.adsBlocked || changes.pagesCleaned || changes.adsSkipped)) {
        // Update statistics if they change
        const options = new OptionsController();
        options.loadStatistics();
    }
});
