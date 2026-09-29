# Devlika Master Lock

A password-protection extension for Chromium-based browsers (Chrome, Brave, Edge, Opera). It locks the browser on startup or after idle time and allows locking individual tabs or specific websites.

[English](README.md) | [Bahasa Indonesia](README.id.md)

---

## Features

- **Startup Lock**: Prompts for a master password when the browser is opened.
- **Tab Lock**: Lock any specific tab via right-click or the toolbar popup.
- **Website / Link Lock**: Block specific domains (e.g., `youtube.com`), subdomains (`web.whatsapp.com`), or URL paths (`facebook.com/messages`).
- **Tab-Scoped Unlock**: Unlocking a website in one tab only applies to that tab. Opening the same website in a new tab still requires the password.
- **Enable / Disable Toggles**: Toggle individual website rules on or off directly from the popup without deleting them.
- **Auto-Lock on Idle**: Optional timer (1 to 60 minutes) to lock the browser after inactivity.
- **Password Security**: Uses Web Crypto API with PBKDF2 (SHA-256) and a 128-bit salt. Plaintext passwords are not stored.
- **Brute-Force Delay**: 30-second cooldown after 5 failed attempts.
- **Keyboard Shortcut**: `Ctrl + Shift + L` (or `Cmd + Shift + L` on macOS) to lock immediately.

---

## Installation

1. Open your browser's extension page:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select this directory.
4. *(Optional)* In the extension details page, enable **Allow in Incognito / Private** to prevent bypassing via incognito windows.

---

## Usage

1. **Initial Setup**: Set your master password (minimum 4 characters) and an optional hint on first run.
2. **Locking a Tab**: Right-click anywhere on the page and select **"Lock This Tab Only"**, or click **"Lock This Tab"** in the extension popup.
3. **Locking a Website**:
   - From the active page: Right-click and choose **"Lock Entire Website (Domain)"**, or click **"Lock This Website"** in the popup.
   - From the popup: Open the **Websites** tab, enter a domain or URL, and click **+ Add Website**.
4. **Toggling Rules**: Go to the **Websites** tab in the popup to enable or disable individual rules.
5. **Lock Browser**: Press `Ctrl + Shift + L` or click **"Lock Entire Browser"** in the popup.

---

## File Structure

```
├── manifest.json       # Manifest V3 config
├── background.js      # Service worker for navigation and tab locking
├── crypto.js          # PBKDF2 hashing helper
├── lock.html / .js    # Lock screen interface and logic
├── popup.html / .js   # Toolbar popup interface and rule management
├── lock.css / popup.css
└── icons/             # Extension icons
```

---

Author: devlika
