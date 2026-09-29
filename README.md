# 🛡️ Devlika Master Lock - Universal Browser Protection
> **Developer:** `devlika`  
> **Compatibility:** Google Chrome, Brave Browser, Microsoft Edge, Opera, Vivaldi (Chromium Manifest V3)  
> **Language:** **English** • [Bahasa Indonesia](README.id.md)

A universal security extension that automatically locks your Chromium-based browser with a **Master Password** upon startup or after inactivity. All new tabs, websites, and address bar navigations are strictly blocked until you authenticate with your password.

---

## ✨ Key Features

1. **Auto-Lock on Browser Startup**:
   - As soon as the browser launches, you are immediately greeted with a dedicated Master Password lock screen.
   - No browsing tabs or websites can be viewed or accessed prior to authenticating.
2. **🔒 Specific Tab Lock**:
   - Need to step away from your workstation while leaving a sensitive tab open (e.g., work email, banking, or private chats)? Lock individual tabs!
   - Simply right-click anywhere on the page and select **"🔒 Lock This Tab Only"**, or click the **"Lock This Tab"** button in the extension popup.
   - The selected tab is instantly protected by the lock screen without disturbing your other tabs.
   - Enter your Master Password to restore the tab, or click **"Cancel & Close Tab"**.
3. **🌐 Domain & URL Path Lock (Website Blacklist)**:
   - Restrict access to designated websites or pages (e.g., `web.whatsapp.com`, `youtube.com`, `instagram.com`, or specific paths like `facebook.com/messages`).
   - **Tab-Scoped Isolation**:
     - Authenticating a locked site in Tab A **only grants access to Tab A**.
     - If that site or link is opened in a new tab (`Ctrl+T` or opened in background), the new tab **remains strictly locked and demands the Master Password again**.
     - Within the authenticated tab, you can navigate, click links, and browse freely without repeatedly retyping your password.
   - **Active / Inactive Toggle Switch**:
     - Every registered website features an on/off toggle switch.
     - You can maintain a standby list of sites and selectively flip them to *Active* whenever protection is desired—no need to delete and re-enter URLs.
     - An *"Activate immediately"* checkbox is provided when adding new rules.
   - **Flexible Link & URL Formats Supported**:
     - **Full Domain**: `youtube.com` $\rightarrow$ Blocks all of `youtube.com`, `www.youtube.com`, `m.youtube.com`, and all nested videos/pages.
     - **Specific Subdomain**: `web.whatsapp.com` $\rightarrow$ Blocks only the WhatsApp web app, leaving the landing site `whatsapp.com` accessible.
     - **Specific Link / Path**: `facebook.com/messages` $\rightarrow$ Blocks only the messenger interface; main feed (`facebook.com`) remains accessible.
     - **Direct URL Pasting**: Freely paste links directly from your address bar (e.g., `https://www.instagram.com/direct/`); the extension automatically strips protocols (`https://`, `http://`), `www.`, and trailing slashes.
   - **Registration Methods**:
     - **Toolbar Popup (Websites Tab)**: Type or paste the domain/link, then click **+ Add Website**.
     - **Toolbar Popup (Dashboard)**: Click **"Lock This Website"**.
     - **Context Menu (Right-Click)**: Right-click any webpage $\rightarrow$ click **"🌐 Lock Entire Website (Domain)"**.
4. **Zero Data Loss Tab Restoration**:
   - Tabs open prior to locking or closing the browser are preserved securely and automatically restored as soon as you unlock.
5. **Anti-Bypass & Navigation Enforcement**:
   - Opening a new tab (`Ctrl+T` or `+`) while locked immediately closes the tab and returns focus to the lock screen.
   - Manually typing URLs into the address bar redirects straight back to the lock screen.
6. **Military-Grade Cryptographic Security**:
   - Powered by the native Web Crypto API with **PBKDF2 (SHA-256) 100,000 iterations** and a **cryptographically secure 128-bit random salt**.
   - Your plaintext password is never stored on disk.
7. **Brute-Force Protection**:
   - After 5 consecutive failed login attempts, a 30-second security cooldown is triggered.
8. **Instant Manual Lock (Keyboard Shortcut)**:
   - Press `Ctrl + Shift + L` (or `Cmd + Shift + L` on macOS) at any time to immediately lock your browser when stepping away.
9. **Idle Auto-Lock**:
   - Configurable from the popup menu (1 minute, 5 minutes, 15 minutes, 30 minutes, 1 hour, or disabled).
10. **Password Hint & Master Password Management**:
    - Optional password hint for recovery assistance.
    - Change your Master Password anytime through the extension popup.

---

## 🚀 Installation Guide (Chrome, Brave, Edge, Opera)

Follow these quick steps to load the unpacked extension into your browser:

### Step 1: Open the Extensions Page
- **Google Chrome**: Navigate to `chrome://extensions`
- **Brave Browser**: Navigate to `brave://extensions`
- **Microsoft Edge**: Navigate to `edge://extensions`
- **Opera**: Navigate to `opera://extensions`

In the upper-right corner of the page, toggle on **"Developer mode"**.

### Step 2: Load the Extension
1. In the upper-left corner, click **"Load unpacked"**.
2. Browse to and select this extension folder:
   ```
   d:\WebServer\www\extensions\devlika-master-lock
   ```
3. Click **Select Folder**.
4. **Devlika Master Lock** is now installed! 🎉

### Step 3 (CRITICAL): Enable in Incognito / Private Mode
To prevent bypassing the lock screen via a Private/Incognito window:
1. On the extensions page, find the **Devlika Master Lock** card.
2. Click **"Details"**.
3. Scroll down and turn on the toggle for **"Allow in Incognito"** (or **"Allow in Private"**).

---

## 🔒 How to Use

1. **Initial Setup**:
   - Upon first install, the **Setup Master Password** page opens automatically.
   - Enter your desired password (minimum 4 characters).
   - Confirm your password and enter an optional hint.
   - Click **"Activate & Unlock Browser"**.

2. **Unlocking the Browser**:
   - When launching your browser, enter your Master Password and hit **Enter** or click **"Unlock Browser"**.
   - Your previously opened tabs will be automatically restored.

3. **Locking a Specific Tab**:
   - Open the tab you wish to lock.
   - **Method A**: Right-click anywhere on the webpage $\rightarrow$ select **"🔒 Lock This Tab Only"**.
   - **Method B**: Click the Devlika Lock toolbar icon $\rightarrow$ on the active tab card, click **"Lock This Tab"**.
   - The tab will be isolated with a lock screen. Enter your Master Password to reopen it, or click **"Cancel & Close Tab"**.

4. **Locking & Managing Websites / Links**:
   - **Add New Site**:
     - Click the extension icon $\rightarrow$ go to the **"Websites"** tab.
     - Enter a domain or paste a link (e.g., `youtube.com`, `web.whatsapp.com`, or `facebook.com/messages`).
     - Check **"Activate immediately"** to lock right away, or leave unchecked to keep it on standby.
     - Click **+ Add Website**.
   - **Toggle Active / Inactive**:
     - In the **"Websites"** tab, click any switch toggle to turn protection ON (green) or OFF (gray).
   - **Quick Lock via Right-Click**:
     - Right-click any page $\rightarrow$ select **"🌐 Lock Entire Website (Domain)"**.
   - **Delete a Website Rule**:
     - Click the trash can icon next to any rule to permanently remove it from the list.

5. **Locking the Entire Browser Manually**:
   - Press `Ctrl + Shift + L`, **OR**
   - Click the **Devlika Master Lock** toolbar icon and click **"Lock Entire Browser"**.

6. **Updating Auto-Lock Timer & Password**:
   - Click the extension icon $\rightarrow$ switch to the **"Settings"** tab.
   - Choose your preferred inactivity cooldown timer.
   - Click **"Change Master Password"** to update your credentials.

---

## 📁 Project Structure

```
d:\WebServer\www\extensions\devlika-master-lock/
├── manifest.json              # Chromium Manifest V3 configuration
├── background.js             # Background Service Worker (Frameless lock, tab-scoped routing & navigation)
├── crypto.js                 # Web Crypto API module (PBKDF2 + SHA-256 + Salt)
├── lock.html                 # Lock screen UI & setup wizard
├── lock.css                  # Dark-mode glassmorphic styling
├── lock.js                   # Lock screen logic, validation, & feedback
├── popup.html                # Quick access toolbar menu
├── popup.css                 # Popup menu styling
├── popup.js                  # Toolbar menu controller, switch toggles & settings
├── icons/                    # High-res padlock icons (16, 32, 48, 128 px)
├── README.md                 # English Documentation
└── README.id.md              # Indonesian Documentation (Dokumentasi Bahasa Indonesia)
```

---
**Created & Maintained by devlika** 🚀
