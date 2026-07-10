# FC Tweak

A browser extension to tweak your Farcaster experience. Works with Chrome, Arc, and other Chromium browsers, as well as Firefox.

## Features

- Block the home feed to stay focused
- Hide notifications and unread counts

## Installation

### From Chrome Web Store (Recommended)

https://chromewebstore.google.com/detail/fc-tweak/kbponcgllocjppgoolliblbalfbmnjlo

### From GitHub Release

1. Go to the [Releases page](https://github.com/lyoshenka/fctweak/releases)
2. Download the latest `fc-tweak.zip` file
3. Extract the zip file to a folder on your computer
4. Open Chrome or Arc Browser
5. Navigate to `chrome://extensions/`
6. Enable "Developer mode" in the top right corner
7. Click "Load unpacked" and select the extracted folder

### From Source (Chrome / Chromium)

1. Clone this repository
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this folder

### Firefox

Load it temporarily for testing:

1. Clone this repository (or download and extract `fc-tweak-firefox.zip` from a [Release](https://github.com/lyoshenka/fctweak/releases))
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on…"
4. Select the `manifest.json` file in this folder

(Temporary add-ons are removed when Firefox restarts. A permanently-installable, signed version will be available on [addons.mozilla.org](https://addons.mozilla.org) once published.)

## Permissions

This extension only requires:
- `activeTab` - to interact with Farcaster pages
- `storage` - to save your preferences

The extension only runs on farcaster.xyz.

## Privacy

This extension:
- Does not collect any personal data
- Does not send any data to external servers
- Only stores your toggle preference locally in your browser
- Does not track your browsing activity

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.
