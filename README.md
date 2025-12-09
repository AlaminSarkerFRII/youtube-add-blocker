# YouTube Clean UI - Ad Blocker Extension

A lightweight browser extension that hides ad UI elements and distractions on YouTube, providing a cleaner viewing experience.

## 🚀 Features

- **Ad Blocking**: Automatically hides video ads, pre-roll ads, and mid-roll ads
- **UI Cleanup**: Removes promotional content, suggested ads, and distracting elements
- **Auto-Skip**: Automatically clicks "Skip Ad" buttons when they appear
- **Real-time Monitoring**: Continuously monitors for new ad elements using DOM observers
- **Toggle Control**: Enable/disable the extension through options page
- **Lightweight**: Minimal performance impact with efficient cleanup routines

## 📁 Project Structure

```
youtube-add-blocker/
├── manifest.json       # Extension manifest file
├── content.js          # Main ad blocking logic
├── styles.css          # CSS rules to hide ad elements
├── options.html        # Extension options page
└── README.md          # This documentation
```

## 🛠️ How It Works

### Core Mechanism

The extension uses a multi-layered approach to block ads:

1. **CSS Hiding**: Immediate hiding of known ad elements using CSS selectors
2. **JavaScript Removal**: Dynamic removal of ad elements that load after page load
3. **Auto-Skip Functionality**: Automatically clicks skip buttons when detected
4. **DOM Observation**: Monitors for newly added ad elements in real-time
5. **Navigation Handling**: Re-applies blocking when navigating within YouTube's SPA

### Key Components

#### 1. `content.js` - Main Logic
- **Periodic Cleanup**: Runs cleanup every 800ms to catch late-loading ads
- **DOM Observer**: Uses MutationObserver to detect new DOM elements
- **Navigation Watcher**: Monitors URL changes in YouTube's single-page application
- **Auto-Skip**: Attempts to click skip buttons on video ads
- **Toggle Control**: Respects user preferences from localStorage

#### 2. `styles.css` - CSS Blocking
- Hides ad elements using `display: none !important`
- Targets specific YouTube ad selectors
- Prevents layout shifts from hidden elements
- Covers player ads, sidebar promotions, and banner ads

#### 3. `manifest.json` - Extension Configuration
- Manifest V3 compliant
- Permissions for YouTube domains
- Content scripts injection at document start
- ActiveTab and scripting permissions

#### 4. `options.html` - User Control
- Simple toggle to enable/disable the extension
- Uses localStorage to persist user preferences
- Checkbox interface for easy control

## 🎯 Targeted Elements

The extension targets and blocks the following types of ads:

### Video Player Ads
- Pre-roll video ads
- Mid-roll video ads
- Ad overlays and banners
- Skip button containers
- Ad progress bars
- Ad text and messages

### UI Promotions
- Promoted videos in search results
- Companion ads on watch page
- Statement banners
- Masthead advertisements
- End-screen ads

### Homepage & Sidebar
- Promoted content cards
- Experimental features
- Engagement panels marked as ads
- Rich list headers with ads

## 📦 Installation

### For Development
1. Clone or download this repository
2. Open your browser and navigate to `chrome://extensions/` (Chrome) or `about:debugging` (Firefox)
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder
5. The extension should now appear in your extensions list

### For Production
1. Package the extension files into a ZIP archive
2. Upload to the Chrome Web Store or Firefox Add-ons marketplace

## ⚙️ Configuration

### Enabling/Disabling
1. Right-click the extension icon in your browser toolbar
2. Select "Options" from the context menu
3. Toggle the "Enable cleanup" checkbox
4. Changes are saved automatically

### Advanced Customization
To modify which elements are blocked, edit the following:

- **CSS Selectors**: Update `styles.css` to add/remove CSS selectors
- **JavaScript Selectors**: Modify the `AD_SELECTORS` array in `content.js`
- **Cleanup Interval**: Change the `800ms` interval in `content.js` for different performance

## 🔧 Technical Details

### Performance Optimizations
- **Efficient Selectors**: Uses specific CSS selectors to minimize DOM queries
- **Throttled Cleanup**: 800ms interval balances responsiveness with performance
- **MutationObserver**: Efficiently detects only relevant DOM changes
- **Early Injection**: Runs at `document_start` to catch ads before they render

### Browser Compatibility
- **Chrome**: Manifest V3 compatible
- **Firefox**: Requires minor manifest modifications
- **Edge**: Chromium-based versions supported
- **Safari**: Requires Safari Web Extension conversion

### Security Considerations
- Minimal permissions (only YouTube domains)
- No external network requests
- No data collection or tracking
- Local storage only for user preferences

## 🐛 Troubleshooting

### Common Issues

**Extension not working:**
- Ensure the extension is enabled in your browser
- Check that you're on youtube.com or www.youtube.com
- Verify Developer mode is enabled if using unpacked extension
- Check the extension options page to ensure "Enable cleanup" is checked

**Ads still appearing:**
- **Check Extension Status**: Right-click the extension icon → Options → Ensure "Enable cleanup" is checked
- **Browser Console**: Press F12 → Console tab → Look for any error messages
- **Refresh Page**: Sometimes a hard refresh (Ctrl+F5) is needed after enabling
- **YouTube Updates**: YouTube frequently changes their UI; selectors may need updating
- **Extension Reload**: In `chrome://extensions/`, click the reload button for the extension
- **Multiple Ad Blockers**: Disable other ad blockers temporarily to check for conflicts

**Performance issues:**
- The cleanup interval can be increased to reduce CPU usage
- Consider disabling if experiencing slow page loads

**Extension not loading:**
- Check manifest.json for syntax errors
- Verify all files are present in the extension directory
- Look for browser console errors during extension load

### Advanced Debugging Steps

**1. Check if Extension is Active:**
```javascript
// Open browser console (F12) and run:
console.log('Extension enabled:', localStorage.getItem('ycu_enabled') !== '0');
```

**2. Test Selector Matching:**
```javascript
// In console, check if ad elements are found:
document.querySelectorAll('.ytp-ad-module').length;
document.querySelectorAll('[data-ad-impression]').length;
```

**3. Manual Cleanup Test:**
```javascript
// Force cleanup manually:
const AD_SELECTORS = ['.ytp-ad-module', '.ytp-ad-player-overlay', '.ytp-ad-text'];
AD_SELECTORS.forEach(sel => {
  document.querySelectorAll(sel).forEach(node => {
    node.style.display = 'none';
    console.log('Hidden:', sel);
  });
});
```

**4. Check for YouTube UI Changes:**
- Use browser dev tools (F12) to inspect ad elements
- Look for new class names or attributes on ad elements
- Compare with the selectors in `AD_SELECTORS` array

### Common Reasons Why Ads Still Show

1. **Extension Disabled**: The toggle in options is turned off
2. **Outdated Selectors**: YouTube updated their UI and class names
3. **Timing Issues**: Ads load before the extension initializes
4. **Browser Caching**: Old version of extension is cached
5. **Conflicting Extensions**: Other ad blockers interfering
6. **YouTube Experiments**: New ad formats not yet covered
7. **Network Issues**: Ads served from different domains

### Quick Fixes to Try

1. **Hard Refresh**: Ctrl+F5 or Cmd+Shift+R
2. **Extension Reload**: Go to `chrome://extensions/` → Click reload
3. **Clear Browser Cache**: Temporary fix for cached issues
4. **Disable Other Ad Blockers**: Test for conflicts
5. **Check Console Errors**: F12 → Console for debugging info
6. **Verify Permissions**: Ensure extension has YouTube permissions

### If Problems Persist

1. **Report the Issue**: Include console errors and ad screenshots
2. **Check for Updates**: Extension may need selector updates
3. **Try Different Browser**: Test if browser-specific issue
4. **Disable/Re-enable**: Toggle extension off and on
5. **Reinstall Extension**: Fresh installation may resolve issues

## 🔄 Updates & Maintenance

### Regular Updates Needed
- YouTube frequently changes their UI structure
- Ad selectors may require periodic updates
- Monitor user feedback for new ad types

### Updating Selectors
1. Identify new ad elements using browser dev tools
2. Add selectors to `AD_SELECTORS` array in `content.js`
3. Add CSS rules to `styles.css` if needed
4. Test thoroughly across different YouTube pages

## 🤝 Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request with details

### Areas for Improvement
- Additional UI elements to target
- Performance optimizations
- Browser compatibility enhancements
- User interface improvements

## 📄 License

This project is open source. Check the repository for license details.

## ⚠️ Disclaimer

This extension is designed to enhance user experience by blocking advertisements. Use responsibly and in accordance with YouTube's terms of service. The extension may need regular updates as YouTube changes their platform.

---

**Note**: This extension blocks ads by hiding UI elements and does not interfere with YouTube's core functionality. It focuses on providing a cleaner, distraction-free viewing experience.
