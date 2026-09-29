/**
 * Devlika Master Lock - Background Service Worker
 * Mengontrol:
 * 1. Kunci Seluruh Browser (Browser Master Lock)
 * 2. Kunci Tab Tertentu (Specific Tab Lock)
 * 3. Kunci Link / Website Tertentu (Domain Blacklist Lock)
 * 4. Auto-lock saat komputer ditinggal (Idle Detection)
 */

importScripts("crypto.js");

const LOCK_PAGE_PATH = "lock.html";
let isEnforcing = false;

// Pastikan storage.session dapat diakses di extension pages (lock & popup)
if (chrome.storage && chrome.storage.session && chrome.storage.session.setAccessLevel) {
  chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" }).catch(() => {});
}

/**
 * Cek apakah browser saat ini dalam keadaan terkunci total
 * @returns {Promise<boolean>}
 */
async function checkIsLocked() {
  const sessionData = await chrome.storage.session.get("unlocked");
  return !sessionData.unlocked;
}

/**
 * Dapatkan URL halaman lock.html lengkap
 */
function getLockPageUrl() {
  return chrome.runtime.getURL(LOCK_PAGE_PATH);
}

/**
 * Ambil URL tab dengan aman (memeriksa pendingUrl dan url)
 * @param {chrome.tabs.Tab} tab
 * @returns {string}
 */
function getTabUrl(tab) {
  if (!tab) return "";
  return tab.pendingUrl || tab.url || "";
}

/**
 * Ambil status brute-force / cooldown dari session storage
 */
async function getSecurityState() {
  const data = await chrome.storage.session.get(["failedAttempts", "cooldownUntil"]);
  return {
    failedAttempts: Number(data.failedAttempts) || 0,
    cooldownUntil: Number(data.cooldownUntil) || 0
  };
}

/**
 * Simpan status brute-force / cooldown ke session storage
 */
async function setSecurityState(failedAttempts, cooldownUntil) {
  await chrome.storage.session.set({ failedAttempts, cooldownUntil });
}

// ==========================================
// 1. FITUR KUNCI TAB TERTENTU (SPECIFIC TAB)
// ==========================================

async function getLockedTabsMap() {
  const data = await chrome.storage.session.get("lockedTabsMap");
  return data.lockedTabsMap || {};
}

async function lockSpecificTab(tab) {
  if (!tab || !tab.id) return;
  const currentUrl = getTabUrl(tab);
  const lockUrl = getLockPageUrl();
  if (currentUrl.startsWith(lockUrl)) return;

  const map = await getLockedTabsMap();
  map[tab.id] = {
    originalUrl: currentUrl || "about:blank",
    title: tab.title || "Tab"
  };
  await chrome.storage.session.set({ lockedTabsMap: map });

  // Arahkan tab tersebut ke halaman lock mode tab
  const targetRedirect = `${lockUrl}?mode=tab&tabId=${tab.id}&targetUrl=${encodeURIComponent(currentUrl)}`;
  await chrome.tabs.update(tab.id, { url: targetRedirect });
}

async function unlockSpecificTab(tabId) {
  const map = await getLockedTabsMap();
  const info = map[tabId];
  if (info) {
    delete map[tabId];
    await chrome.storage.session.set({ lockedTabsMap: map });
    return info.originalUrl;
  }
  return null;
}

// ==========================================
// 2. FITUR KUNCI WEBSITE TERTENTU (DOMAIN LOCK)
// ==========================================

// ==========================================
// 2. FITUR KUNCI WEBSITE & LINK (DOMAIN/PATH LOCK)
// ==========================================

/**
 * Normalisasi item rule website jika masih berupa string (migrasi data lama)
 */
function normalizeSiteItem(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    return parseSitePattern(raw, true);
  }
  if (typeof raw === "object") {
    if (!raw.id) {
      raw.id = "site_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    }
    if (raw.enabled === undefined) {
      raw.enabled = true;
    }
    if (!raw.pattern) {
      raw.pattern = raw.domain || "";
    }
    if (!raw.type) {
      raw.type = raw.path ? "path" : "domain";
    }
    return raw;
  }
  return null;
}

/**
 * Parsing input teks website/link ke dalam struktur objek aturan
 * Mendukung:
 * - Domain: "youtube.com" (mengunci seluruh youtube.com dan subpage-nya)
 * - Subdomain: "web.whatsapp.com" (hanya web.whatsapp.com)
 * - Link/Path: "facebook.com/messages" (hanya path tersebut)
 * - Full URL: "https://web.whatsapp.com/" (otomatis dibersihkan)
 */
function parseSitePattern(input, enabled = true) {
  if (!input) return null;
  let raw = String(input).trim();
  if (!raw) return null;

  let urlObj;
  try {
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      urlObj = new URL("https://" + raw);
    } else {
      urlObj = new URL(raw);
    }
  } catch (e) {
    let clean = raw.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    if (!clean) return null;
    const slashIdx = clean.indexOf("/");
    const domain = (slashIdx === -1 ? clean : clean.slice(0, slashIdx)).toLowerCase();
    const path = slashIdx === -1 ? "" : clean.slice(slashIdx);
    return {
      id: "site_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      pattern: clean,
      domain: domain.replace(/^www\./i, ""),
      path: path,
      type: path ? "path" : "domain",
      enabled: Boolean(enabled),
      createdAt: Date.now()
    };
  }

  let host = urlObj.hostname.toLowerCase();
  let cleanDomain = host.startsWith("www.") ? host.replace(/^www\./, "") : host;

  let path = urlObj.pathname;
  if (path === "/" || !path) {
    path = "";
  } else {
    path = path.replace(/\/+$/, "");
  }

  const isPath = path.length > 0;
  const pattern = isPath ? `${cleanDomain}${path}` : cleanDomain;

  return {
    id: "site_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
    pattern: pattern,
    domain: cleanDomain,
    path: path,
    type: isPath ? "path" : "domain",
    enabled: Boolean(enabled),
    createdAt: Date.now()
  };
}

async function getLockedWebsites() {
  const data = await chrome.storage.local.get("lockedWebsites");
  const rawList = data.lockedWebsites || [];
  let needsSave = false;
  const list = [];

  for (const item of rawList) {
    const normalized = normalizeSiteItem(item);
    if (normalized) {
      list.push(normalized);
      if (typeof item === "string") {
        needsSave = true;
      }
    }
  }

  if (needsSave) {
    await chrome.storage.local.set({ lockedWebsites: list });
  }

  return list;
}

/**
 * Tab-Scoped Session: Menyimpan daftar pattern/domain website yang sudah di-unlock per Tab.
 * Format: { [tabId]: ["youtube.com", "facebook.com/messages"] }
 * Ini memastikan membuka link di tab baru TETAP MEMINTA PASSWORD, kecuali di tab yang sama.
 */
async function getUnlockedSitesForTab(tabId) {
  if (!tabId) return [];
  const data = await chrome.storage.session.get("unlockedTabsSites");
  const map = data.unlockedTabsSites || {};
  return map[tabId] || [];
}

async function addUnlockedSiteForTab(tabId, pattern, domain) {
  if (!tabId) return;
  const data = await chrome.storage.session.get("unlockedTabsSites");
  const map = data.unlockedTabsSites || {};
  const list = map[tabId] || [];
  if (pattern && !list.includes(pattern)) {
    list.push(pattern);
  }
  if (domain && !list.includes(domain)) {
    list.push(domain);
  }
  map[tabId] = list;
  await chrome.storage.session.set({ unlockedTabsSites: map });
}

async function removeTabUnlockedSites(tabId) {
  if (!tabId) return;
  const data = await chrome.storage.session.get("unlockedTabsSites");
  const map = data.unlockedTabsSites || {};
  if (map[tabId]) {
    delete map[tabId];
    await chrome.storage.session.set({ unlockedTabsSites: map });
  }
}

async function clearSiteFromAllUnlockedTabs(pattern, domain) {
  const data = await chrome.storage.session.get("unlockedTabsSites");
  const map = data.unlockedTabsSites || {};
  let changed = false;
  for (const tid in map) {
    if (map[tid].includes(pattern) || (domain && map[tid].includes(domain))) {
      map[tid] = map[tid].filter((d) => d !== pattern && d !== domain);
      changed = true;
    }
  }
  if (changed) {
    await chrome.storage.session.set({ unlockedTabsSites: map });
  }
}

function cleanDomain(input) {
  if (!input) return "";
  let clean = input.trim().toLowerCase();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      clean = new URL(clean).hostname.toLowerCase();
    } catch (e) {}
  }
  return clean.replace(/^\.+|\/+$/g, "");
}

/**
 * Mencocokkan URL yang sedang diakses dengan daftar website/link yang dikunci
 * @returns {object|null} Item aturan yang cocok jika terkunci dan enabled, atau null jika diizinkan
 */
function isUrlMatchingLockedSite(url, lockedList, unlockedList) {
  if (!url || !lockedList || lockedList.length === 0) return null;
  if (
    url.startsWith("chrome-extension://") ||
    url.startsWith("chrome://") ||
    url.startsWith("brave://") ||
    url.startsWith("edge://") ||
    url.startsWith("opera://") ||
    url.startsWith("about:") ||
    url.startsWith("view-source:")
  ) {
    return null;
  }

  let urlObj;
  try {
    urlObj = new URL(url);
  } catch (e) {
    return null;
  }

  const hostname = urlObj.hostname.toLowerCase();
  const pathname = urlObj.pathname.toLowerCase();

  for (const item of lockedList) {
    // JIKA STATUS NONAKTIF, LEWATI (JANGAN DIKUNCI!)
    if (!item || !item.enabled) continue;

    // Jika sudah di-unlock di sesi saat ini, izinkan
    if (unlockedList) {
      if (unlockedList.includes(item.pattern) || unlockedList.includes(item.domain)) {
        continue;
      }
    }

    const itemDomain = (item.domain || "").toLowerCase();
    const baseDomain = itemDomain.replace(/^www\./, "");

    const hostMatches =
      hostname === itemDomain ||
      hostname === baseDomain ||
      hostname.endsWith("." + baseDomain) ||
      hostname === "www." + baseDomain;

    if (!hostMatches) continue;

    // Mode 1: Kunci seluruh domain
    if (item.type === "domain" || !item.path) {
      return item;
    }

    // Mode 2: Kunci path / link spesifik
    const itemPath = (item.path || "").toLowerCase();
    if (
      pathname === itemPath ||
      pathname.startsWith(itemPath + "/") ||
      pathname.startsWith(itemPath + "?") ||
      pathname.startsWith(itemPath)
    ) {
      return item;
    }
  }

  return null;
}

async function addLockedSite(input, enabled = true) {
  const parsed = parseSitePattern(input, enabled);
  if (!parsed) return { success: false, error: "Format link/domain tidak valid" };

  const list = await getLockedWebsites();
  const existingIdx = list.findIndex((s) => s.pattern === parsed.pattern);
  if (existingIdx !== -1) {
    list[existingIdx].enabled = Boolean(enabled);
    await chrome.storage.local.set({ lockedWebsites: list });
  } else {
    list.unshift(parsed);
    await chrome.storage.local.set({ lockedWebsites: list });
  }

  if (enabled) {
    await clearSiteFromAllUnlockedTabs(parsed.pattern, parsed.domain);

    // Langsung arahkan seluruh tab yang sedang membuka situs ini ke layar kunci
    const allTabs = await chrome.tabs.query({});
    const lockUrl = getLockPageUrl();
    for (const t of allTabs) {
      const u = getTabUrl(t);
      if (u && !u.startsWith(lockUrl)) {
        const matched = isUrlMatchingLockedSite(u, [parsed], []);
        if (matched) {
          await chrome.tabs.update(t.id, {
            url: `${lockUrl}?mode=site&domain=${encodeURIComponent(matched.pattern)}&targetUrl=${encodeURIComponent(u)}&tabId=${t.id}`
          }).catch(() => {});
        }
      }
    }
  }

  return { success: true, site: parsed };
}

async function toggleLockedSite(idOrPattern, enabled) {
  const list = await getLockedWebsites();
  const item = list.find((s) => s.id === idOrPattern || s.pattern === idOrPattern);
  if (!item) return { success: false, error: "Website tidak ditemukan" };

  item.enabled = enabled !== undefined ? Boolean(enabled) : !item.enabled;
  await chrome.storage.local.set({ lockedWebsites: list });

  if (item.enabled) {
    await clearSiteFromAllUnlockedTabs(item.pattern, item.domain);

    // Langsung arahkan seluruh tab yang sedang membuka situs ini ke layar kunci
    const allTabs = await chrome.tabs.query({});
    const lockUrl = getLockPageUrl();
    for (const t of allTabs) {
      const u = getTabUrl(t);
      if (u && !u.startsWith(lockUrl)) {
        const matched = isUrlMatchingLockedSite(u, [item], []);
        if (matched) {
          await chrome.tabs.update(t.id, {
            url: `${lockUrl}?mode=site&domain=${encodeURIComponent(matched.pattern)}&targetUrl=${encodeURIComponent(u)}&tabId=${t.id}`
          }).catch(() => {});
        }
      }
    }
  }

  return { success: true, item };
}

async function removeLockedSite(idOrPattern) {
  const list = await getLockedWebsites();
  const item = list.find((s) => s.id === idOrPattern || s.pattern === idOrPattern);
  const nextList = list.filter((s) => s.id !== idOrPattern && s.pattern !== idOrPattern);
  await chrome.storage.local.set({ lockedWebsites: nextList });

  if (item) {
    await clearSiteFromAllUnlockedTabs(item.pattern, item.domain);
  }
  return { success: true };
}

// ==========================================
// 3. FITUR KUNCI TOTAL SELURUH BROWSER
// ==========================================

async function enforceLock() {
  if (isEnforcing) return;
  isEnforcing = true;

  try {
    const isLocked = await checkIsLocked();
    if (!isLocked) {
      isEnforcing = false;
      return;
    }

    const lockUrl = getLockPageUrl();
    const allWindows = await chrome.windows.getAll({ populate: true });
    if (allWindows.length === 0) {
      isEnforcing = false;
      return;
    }

    // 1. Simpan semua URL tab yang sedang dibuka ke lockedTabs
    const localData = await chrome.storage.local.get(["lockedTabs", "passwordHash"]);
    let savedUrls = localData.lockedTabs || [];

    for (const win of allWindows) {
      if (win.type !== "popup" && win.tabs) {
        for (const tab of win.tabs) {
          const u = getTabUrl(tab);
          if (u && !u.startsWith(lockUrl) && !u.startsWith("chrome://") && !u.startsWith("brave://") && !u.startsWith("edge://")) {
            if (!savedUrls.includes(u)) {
              savedUrls.push(u);
            }
          }
        }
      }
    }

    if (savedUrls.length > 0) {
      await chrome.storage.local.set({ lockedTabs: savedUrls });
    }

    // 2. Tutup tab biasa di jendela normal agar konten web tidak terlihat di background
    for (const win of allWindows) {
      if (win.type !== "popup" && win.tabs) {
        const tabsToClose = win.tabs.filter((t) => !getTabUrl(t).startsWith(lockUrl)).map((t) => t.id);
        if (tabsToClose.length === win.tabs.length) {
          await chrome.tabs.create({ windowId: win.id, url: "about:blank", active: false }).catch(() => {});
        }
        await chrome.tabs.remove(tabsToClose).catch(() => {});
      }
    }

    // 3. Periksa apakah sudah ada popup lock window yang aktif
    const sessionData = await chrome.storage.session.get("lockWindowId");
    let activeLockWinId = sessionData.lockWindowId;

    if (activeLockWinId) {
      try {
        const win = await chrome.windows.get(activeLockWinId);
        if (win) {
          await chrome.windows.update(activeLockWinId, { focused: true, state: "maximized" }).catch(() => {});
          isEnforcing = false;
          return;
        }
      } catch (e) {
        activeLockWinId = null;
      }
    }

    // 4. Buka lock.html di JENDELA POPUP KHUSUS (Tanpa header, tanpa toolbar, tanpa menu extensions)
    const newLockWin = await chrome.windows.create({
      url: lockUrl,
      type: "popup",
      state: "maximized",
      focused: true
    });
    await chrome.storage.session.set({ lockWindowId: newLockWin.id });
  } catch (err) {
    console.error("[Devlika Master Lock] Enforce lock error:", err);
  } finally {
    isEnforcing = false;
  }
}

async function lockNow() {
  const isLocked = await checkIsLocked();
  if (isLocked) {
    const sessionData = await chrome.storage.session.get("lockWindowId");
    if (sessionData.lockWindowId) {
      await chrome.windows.update(sessionData.lockWindowId, { focused: true, state: "maximized" }).catch(() => {});
    }
    return;
  }

  await chrome.storage.session.set({ unlocked: false });
  await enforceLock();
}

async function unlockAndRestoreTabs() {
  await chrome.storage.session.set({ unlocked: true });
  await setSecurityState(0, 0);

  const lockUrl = getLockPageUrl();
  const sessionData = await chrome.storage.session.get("lockWindowId");
  const lockWinId = sessionData.lockWindowId;

  // Dapatkan URL yang tersimpan
  const localData = await chrome.storage.local.get("lockedTabs");
  const urlsToRestore = localData.lockedTabs || [];

  // Buka jendela normal
  const allWindows = await chrome.windows.getAll({ populate: true });
  let normalWin = allWindows.find((w) => w.type === "normal");

  if (!normalWin) {
    normalWin = await chrome.windows.create({ type: "normal", state: "maximized", focused: true });
  } else {
    await chrome.windows.update(normalWin.id, { state: "maximized", focused: true }).catch(() => {});
  }

  // Pulihkan tab-tab pengguna
  if (urlsToRestore.length > 0) {
    for (let i = 0; i < urlsToRestore.length; i++) {
      await chrome.tabs.create({ windowId: normalWin.id, url: urlsToRestore[i], active: i === 0 }).catch(() => {});
    }
    await chrome.storage.local.remove("lockedTabs");
  } else {
    await chrome.tabs.create({ windowId: normalWin.id, active: true }).catch(() => {});
  }

  // Tutup tab kosong atau tab lock yang tersisa di normalWin
  const tabsInNormal = await chrome.tabs.query({ windowId: normalWin.id });
  const leftoverTabs = tabsInNormal.filter((t) => getTabUrl(t).startsWith(lockUrl) || getTabUrl(t) === "about:blank").map((t) => t.id);
  if (leftoverTabs.length > 0 && leftoverTabs.length < tabsInNormal.length) {
    await chrome.tabs.remove(leftoverTabs).catch(() => {});
  }

  // Tutup jendela popup lock
  if (lockWinId) {
    await chrome.windows.remove(lockWinId).catch(() => {});
    await chrome.storage.session.remove("lockWindowId");
  }
}

// ==========================================
// 4. CONTEXT MENUS (KLIK KANAN DI HALAMAN)
// ==========================================

function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "menu_lock_tab",
      title: "🔒 Kunci Tab Ini Saja",
      contexts: ["page", "action"]
    });
    chrome.contextMenus.create({
      id: "menu_lock_site",
      title: "🌐 Kunci Seluruh Website Ini (Domain)",
      contexts: ["page", "action"]
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === "menu_lock_tab") {
    await lockSpecificTab(tab);
  } else if (info.menuItemId === "menu_lock_site") {
    const url = getTabUrl(tab);
    if (url) {
      try {
        const u = new URL(url);
        const hostname = u.hostname;
        if (hostname && !hostname.startsWith("chrome") && !hostname.startsWith("brave") && !hostname.startsWith("edge")) {
          const res = await addLockedSite(hostname, true);
          if (res.success && res.site) {
            // Arahkan tab ke layar kunci domain
            const lockUrl = getLockPageUrl();
            await chrome.tabs.update(tab.id, {
              url: `${lockUrl}?mode=site&domain=${encodeURIComponent(res.site.pattern)}&targetUrl=${encodeURIComponent(url)}&tabId=${tab.id}`
            });
          }
        }
      } catch (e) {}
    }
  }
});

// ==========================================
// 5. EVENT LISTENERS TAB & NAVIGASI
// ==========================================

// Startup & Install
chrome.runtime.onStartup.addListener(async () => {
  setupContextMenus();
  await enforceLock();
});

chrome.runtime.onInstalled.addListener(async () => {
  setupContextMenus();
  const data = await chrome.storage.local.get("passwordHash");
  if (!data.passwordHash) {
    chrome.tabs.create({ url: getLockPageUrl(), active: true });
  } else {
    await enforceLock();
  }
});

(async () => {
  setupContextMenus();
  const isLocked = await checkIsLocked();
  if (isLocked) {
    await enforceLock();
  }
})();

// Saat tab baru dibuka
chrome.tabs.onCreated.addListener(async (tab) => {
  const isLocked = await checkIsLocked();
  const lockUrl = getLockPageUrl();

  // Jika browser terkunci penuh:
  if (isLocked) {
    const currentUrl = getTabUrl(tab);
    if (currentUrl.startsWith(lockUrl)) return;

    const allTabs = await chrome.tabs.query({});
    const existingLockTab = allTabs.find((t) => t.id !== tab.id && getTabUrl(t).startsWith(lockUrl));

    if (existingLockTab) {
      await chrome.tabs.update(existingLockTab.id, { active: true }).catch(() => {});
      if (existingLockTab.windowId) {
        await chrome.windows.update(existingLockTab.windowId, { focused: true }).catch(() => {});
      }
      await chrome.tabs.remove(tab.id).catch(() => {});
    } else {
      await chrome.tabs.create({ url: lockUrl, active: true }).catch(() => {});
      await chrome.tabs.remove(tab.id).catch(() => {});
    }
    return;
  }

  // Jika browser terbuka: periksa apakah URL yang dibuka masuk ke website yang dikunci
  const targetUrl = getTabUrl(tab);
  if (targetUrl) {
    const lockedSites = await getLockedWebsites();
    const unlockedSites = await getUnlockedSitesForTab(tab.id);
    const matchedSite = isUrlMatchingLockedSite(targetUrl, lockedSites, unlockedSites);
    if (matchedSite) {
      await chrome.tabs.update(tab.id, {
        url: `${lockUrl}?mode=site&domain=${encodeURIComponent(matchedSite.pattern)}&targetUrl=${encodeURIComponent(targetUrl)}&tabId=${tab.id}`
      });
    }
  }
});

// Saat URL tab diperbarui
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const isLocked = await checkIsLocked();
  const lockUrl = getLockPageUrl();
  const targetUrl = changeInfo.url || tab.pendingUrl || tab.url || "";

  // 1. Jika browser terkunci penuh:
  if (isLocked) {
    if (targetUrl && !targetUrl.startsWith(lockUrl)) {
      if (targetUrl.startsWith("chrome://") || targetUrl.startsWith("brave://") || targetUrl.startsWith("edge://")) {
        const allTabs = await chrome.tabs.query({});
        const existingLockTab = allTabs.find((t) => t.id !== tabId && getTabUrl(t).startsWith(lockUrl));

        if (existingLockTab) {
          await chrome.tabs.update(existingLockTab.id, { active: true }).catch(() => {});
          if (existingLockTab.windowId) {
            await chrome.windows.update(existingLockTab.windowId, { focused: true }).catch(() => {});
          }
        } else {
          await chrome.tabs.create({ url: lockUrl, active: true }).catch(() => {});
        }
        await chrome.tabs.remove(tabId).catch(() => {});
        return;
      }
      await chrome.tabs.update(tabId, { url: lockUrl }).catch(() => {});
    }
    return;
  }

  // 2. Jika browser terbuka, cek tab spesifik yang dikunci
  const lockedTabsMap = await getLockedTabsMap();
  if (lockedTabsMap[tabId]) {
    if (!targetUrl.startsWith(lockUrl)) {
      const orig = lockedTabsMap[tabId].originalUrl;
      await chrome.tabs.update(tabId, {
        url: `${lockUrl}?mode=tab&tabId=${tabId}&targetUrl=${encodeURIComponent(orig)}`
      });
      return;
    }
  }

  // 3. Cek apakah website ini masuk ke daftar website yang dikunci (Domain Lock / Path Lock)
  if (targetUrl && !targetUrl.startsWith(lockUrl)) {
    const lockedSites = await getLockedWebsites();
    const unlockedSites = await getUnlockedSitesForTab(tabId);
    const matchedSite = isUrlMatchingLockedSite(targetUrl, lockedSites, unlockedSites);
    if (matchedSite) {
      await chrome.tabs.update(tabId, {
        url: `${lockUrl}?mode=site&domain=${encodeURIComponent(matchedSite.pattern)}&targetUrl=${encodeURIComponent(targetUrl)}&tabId=${tabId}`
      });
    }
  }
});

// Saat tab aktif berpindah
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const isLocked = await checkIsLocked();
  const lockUrl = getLockPageUrl();

  if (isLocked) {
    const tab = await chrome.tabs.get(activeInfo.tabId).catch(() => null);
    if (!tab) return;
    const currentUrl = getTabUrl(tab);

    if (!currentUrl.startsWith(lockUrl)) {
      if (currentUrl.startsWith("chrome://") || currentUrl.startsWith("brave://") || currentUrl.startsWith("edge://")) {
        const allTabs = await chrome.tabs.query({});
        const existingLockTab = allTabs.find((t) => t.id !== activeInfo.tabId && getTabUrl(t).startsWith(lockUrl));

        if (!existingLockTab) {
          await chrome.tabs.create({ url: lockUrl, active: true }).catch(() => {});
        } else {
          await chrome.tabs.update(existingLockTab.id, { active: true }).catch(() => {});
        }
        await chrome.tabs.remove(activeInfo.tabId).catch(() => {});
        return;
      }
      await chrome.tabs.update(activeInfo.tabId, { url: lockUrl }).catch(() => {});
    }
    return;
  }

  // Cek jika tab ini merupakan tab terkunci spesifik
  const lockedTabsMap = await getLockedTabsMap();
  if (lockedTabsMap[activeInfo.tabId]) {
    const tab = await chrome.tabs.get(activeInfo.tabId).catch(() => null);
    if (tab && !getTabUrl(tab).startsWith(lockUrl)) {
      const orig = lockedTabsMap[activeInfo.tabId].originalUrl;
      await chrome.tabs.update(activeInfo.tabId, {
        url: `${lockUrl}?mode=tab&tabId=${activeInfo.tabId}&targetUrl=${encodeURIComponent(orig)}`
      });
    }
  }
});

// Saat tab ditutup
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // Bersihkan data tab spesifik jika ditutup
  const lockedTabsMap = await getLockedTabsMap();
  if (lockedTabsMap[tabId]) {
    delete lockedTabsMap[tabId];
    await chrome.storage.session.set({ lockedTabsMap });
  }

  // Bersihkan sesi website yang di-unlock untuk tab ini
  await removeTabUnlockedSites(tabId);

  if (removeInfo.isWindowClosing) return;
  const isLocked = await checkIsLocked();
  if (!isLocked) return;

  const lockUrl = getLockPageUrl();
  const tabs = await chrome.tabs.query({});
  if (tabs.length === 0) return;

  const hasLock = tabs.some((t) => getTabUrl(t).startsWith(lockUrl));
  if (!hasLock) {
    await enforceLock();
  }
});

// Jendela lock popup ditutup tanpa login
chrome.windows.onRemoved.addListener(async (closedWinId) => {
  const isLocked = await checkIsLocked();
  if (!isLocked) return;

  const sessionData = await chrome.storage.session.get("lockWindowId");
  if (closedWinId === sessionData.lockWindowId) {
    const allWins = await chrome.windows.getAll();
    for (const w of allWins) {
      await chrome.windows.remove(w.id).catch(() => {});
    }
  }
});

// Fokus jendela dialihkan saat terkunci
chrome.windows.onFocusChanged.addListener(async (focusedWinId) => {
  if (focusedWinId === chrome.windows.WINDOW_ID_NONE) return;

  const isLocked = await checkIsLocked();
  if (!isLocked) return;

  const sessionData = await chrome.storage.session.get("lockWindowId");
  const lockWinId = sessionData.lockWindowId;

  if (lockWinId && focusedWinId !== lockWinId) {
    await chrome.windows.update(lockWinId, { focused: true }).catch(() => {});
  }
});

// Sebelum navigasi halaman termuat
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const isLocked = await checkIsLocked();
  const lockUrl = getLockPageUrl();

  // Jika browser terkunci penuh
  if (isLocked) {
    if (!details.url.startsWith(lockUrl)) {
      if (details.url.startsWith("http://") || details.url.startsWith("https://")) {
        const data = await chrome.storage.local.get("lockedTabs");
        const list = data.lockedTabs || [];
        if (!list.includes(details.url)) {
          list.push(details.url);
          await chrome.storage.local.set({ lockedTabs: list });
        }
      }
      await chrome.tabs.update(details.tabId, { url: lockUrl }).catch(() => {});
    }
    return;
  }

  // Jika browser terbuka: cek apakah domain/link masuk ke daftar terkunci
  const lockedSites = await getLockedWebsites();
  const unlockedSites = await getUnlockedSitesForTab(details.tabId);
  const matchedSite = isUrlMatchingLockedSite(details.url, lockedSites, unlockedSites);
  if (matchedSite && !details.url.startsWith(lockUrl)) {
    await chrome.tabs.update(details.tabId, {
      url: `${lockUrl}?mode=site&domain=${encodeURIComponent(matchedSite.pattern)}&targetUrl=${encodeURIComponent(details.url)}&tabId=${details.tabId}`
    }).catch(() => {});
  }
});

// Shortcut Keyboard: Ctrl+Shift+L
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "lock_browser") {
    await lockNow();
  }
});

// Deteksi Idle / Auto-lock
async function setupIdleDetection() {
  const data = await chrome.storage.local.get("autoLockMinutes");
  const minutes = Number(data.autoLockMinutes) || 0;

  if (minutes > 0) {
    const seconds = Math.max(15, minutes * 60);
    try {
      chrome.idle.setDetectionInterval(seconds);
    } catch (e) {}
  }
}

setupIdleDetection();

chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState === "idle" || newState === "locked") {
    const data = await chrome.storage.local.get("autoLockMinutes");
    const minutes = Number(data.autoLockMinutes) || 0;
    if (minutes > 0) {
      await lockNow();
    }
  }
});

// ==========================================
// 6. MESSAGE DISPATCHER (KOMUNIKASI DENGAN UI)
// ==========================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case "GET_LOCK_STATE": {
          const isLocked = await checkIsLocked();
          const localData = await chrome.storage.local.get([
            "passwordHash",
            "hint",
            "autoLockMinutes"
          ]);
          const security = await getSecurityState();

          sendResponse({
            isLocked,
            hasPassword: Boolean(localData.passwordHash),
            hint: localData.hint || "",
            autoLockMinutes: localData.autoLockMinutes || 0,
            cooldownUntil: Math.max(0, security.cooldownUntil - Date.now()),
            failedAttempts: security.failedAttempts
          });
          break;
        }

        case "SETUP_PASSWORD": {
          const { password, hint } = message;
          if (!password || password.length < 4) {
            sendResponse({ success: false, error: "Kata sandi minimal 4 karakter!" });
            return;
          }

          const { hash, salt } = await CryptoHelper.hashPassword(password);
          await chrome.storage.local.set({
            passwordHash: hash,
            passwordSalt: salt,
            hint: hint || ""
          });

          await setSecurityState(0, 0);
          await unlockAndRestoreTabs();
          sendResponse({ success: true });
          break;
        }

        case "UNLOCK": {
          const now = Date.now();
          const security = await getSecurityState();

          if (security.cooldownUntil > now) {
            const secondsLeft = Math.ceil((security.cooldownUntil - now) / 1000);
            sendResponse({
              success: false,
              isCooldown: true,
              cooldownSeconds: secondsLeft,
              error: `Terlalu banyak percobaan salah. Coba lagi dalam ${secondsLeft} detik.`
            });
            return;
          }

          const localData = await chrome.storage.local.get(["passwordHash", "passwordSalt"]);
          if (!localData.passwordHash || !localData.passwordSalt) {
            sendResponse({ success: false, error: "Kata sandi belum disetel!" });
            return;
          }

          const isValid = await CryptoHelper.verifyPassword(
            message.password,
            localData.passwordHash,
            localData.passwordSalt
          );

          if (isValid) {
            await setSecurityState(0, 0);
            await unlockAndRestoreTabs();
            sendResponse({ success: true });
          } else {
            const nextAttempts = security.failedAttempts + 1;
            if (nextAttempts >= 5) {
              const cooldownTimestamp = Date.now() + 30000;
              await setSecurityState(0, cooldownTimestamp);
              sendResponse({
                success: false,
                isCooldown: true,
                cooldownSeconds: 30,
                error: "5x Percobaan salah! Browser dikunci sementara selama 30 detik."
              });
            } else {
              await setSecurityState(nextAttempts, 0);
              const remaining = 5 - nextAttempts;
              sendResponse({
                success: false,
                isCooldown: false,
                attemptsRemaining: remaining,
                error: `Kata sandi salah! Sisa percobaan: ${remaining}`
              });
            }
          }
          break;
        }

        case "LOCK_NOW": {
          await lockNow();
          sendResponse({ success: true });
          break;
        }

        // Kunci tab saat ini
        case "LOCK_CURRENT_TAB": {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs && tabs[0]) {
            await lockSpecificTab(tabs[0]);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: "Tab aktif tidak ditemukan" });
          }
          break;
        }

        // Buka kunci tab tertentu
        case "UNLOCK_SPECIFIC_TAB": {
          const { tabId, password } = message;
          const localData = await chrome.storage.local.get(["passwordHash", "passwordSalt"]);

          const isValid = await CryptoHelper.verifyPassword(
            password,
            localData.passwordHash,
            localData.passwordSalt
          );

          if (!isValid) {
            sendResponse({ success: false, error: "Kata sandi salah!" });
            return;
          }

          const origUrl = await unlockSpecificTab(tabId);
          sendResponse({ success: true, redirectUrl: origUrl || "about:blank" });
          break;
        }

        // Buka kunci website (domain / link) khusus untuk TAB INI SAJA
        case "UNLOCK_SITE": {
          const { domain, targetUrl, password } = message;
          const targetTabId = message.tabId || (sender && sender.tab ? sender.tab.id : null);

          const localData = await chrome.storage.local.get(["passwordHash", "passwordSalt"]);
          const isValid = await CryptoHelper.verifyPassword(
            password,
            localData.passwordHash,
            localData.passwordSalt
          );

          if (!isValid) {
            sendResponse({ success: false, error: "Kata sandi salah!" });
            return;
          }

          // Catat izin KHUSUS TAB INI SAJA (Tab-Scoped Unlock)
          if (targetTabId) {
            const hostPart = domain && domain.includes("/") ? domain.split("/")[0] : domain;
            await addUnlockedSiteForTab(targetTabId, domain, hostPart);
          }

          const fallbackUrl = targetUrl && targetUrl !== "about:blank" ? targetUrl : `https://${domain}`;
          sendResponse({ success: true, redirectUrl: fallbackUrl });
          break;
        }

        // Tutup tab
        case "CLOSE_TAB": {
          const tabIdToClose = message.tabId || (sender && sender.tab ? sender.tab.id : null);
          if (tabIdToClose) {
            await chrome.tabs.remove(tabIdToClose).catch(() => {});
          }
          sendResponse({ success: true });
          break;
        }

        // Dapatkan data website yang dikunci
        case "GET_LOCKED_SITES_INFO": {
          const sites = await getLockedWebsites();
          const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
          let currentDomain = "";
          let currentTitle = "";
          let currentUrl = "";
          if (activeTabs && activeTabs[0]) {
            currentTitle = activeTabs[0].title || "";
            currentUrl = getTabUrl(activeTabs[0]);
            try {
              currentDomain = new URL(currentUrl).hostname.replace(/^www\./, "");
            } catch (e) {}
          }

          sendResponse({
            sites,
            currentDomain,
            currentTitle,
            currentUrl
          });
          break;
        }

        // Tambah website/link yang dikunci
        case "ADD_LOCKED_SITE": {
          const siteInput = message.site || message.domain;
          const enabled = message.enabled !== undefined ? Boolean(message.enabled) : true;
          const res = await addLockedSite(siteInput, enabled);
          sendResponse(res);
          break;
        }

        // Toggle Aktif / Nonaktif proteksi website tertentu
        case "TOGGLE_LOCKED_SITE": {
          const res = await toggleLockedSite(message.id || message.pattern, message.enabled);
          sendResponse(res);
          break;
        }

        // Hapus website dari daftar kunci
        case "REMOVE_LOCKED_SITE": {
          const res = await removeLockedSite(message.id || message.domain || message.pattern);
          sendResponse(res);
          break;
        }

        case "CHANGE_PASSWORD": {
          const { oldPassword, newPassword, newHint } = message;
          const localData = await chrome.storage.local.get(["passwordHash", "passwordSalt"]);

          const isValid = await CryptoHelper.verifyPassword(
            oldPassword,
            localData.passwordHash,
            localData.passwordSalt
          );

          if (!isValid) {
            sendResponse({ success: false, error: "Kata sandi lama tidak sesuai!" });
            return;
          }

          if (!newPassword || newPassword.length < 4) {
            sendResponse({ success: false, error: "Kata sandi baru minimal 4 karakter!" });
            return;
          }

          const { hash, salt } = await CryptoHelper.hashPassword(newPassword);
          await chrome.storage.local.set({
            passwordHash: hash,
            passwordSalt: salt,
            hint: newHint || ""
          });

          sendResponse({ success: true });
          break;
        }

        case "UPDATE_SETTINGS": {
          const { autoLockMinutes, hint } = message;
          const updates = {};
          if (autoLockMinutes !== undefined) {
            updates.autoLockMinutes = Number(autoLockMinutes);
          }
          if (hint !== undefined) {
            updates.hint = hint;
          }

          await chrome.storage.local.set(updates);
          await setupIdleDetection();
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ error: "Action tidak dikenal" });
      }
    } catch (err) {
      console.error("[Devlika Master Lock] Message handling error:", err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true;
});
