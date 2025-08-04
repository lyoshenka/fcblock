# FC Block

A Chrome extension to block distracting parts of Farcaster. Works with both Chrome and Arc Browser.

## Installation

### Chrome/Arc Browser (Developer Mode)

1. Clone or download this repository
2. Open browser
3. Navigate to `chrome://extensions/` (or `arc://extensions/` in Arc)
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the `fcblock` folder
6. The extension will now be active on farcaster.xyz

### What it does

- Detects the home feed on farcaster.xyz
- Replaces it with a clean message saying "Nothing to see here"
- Works with dynamic content loading
- Supports both light and dark modes

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main script that blocks the feed
- `styles.css` - Styling for the replacement message

## Permissions

This extension only requires `activeTab` permission and only runs on farcaster.xyz pages.
