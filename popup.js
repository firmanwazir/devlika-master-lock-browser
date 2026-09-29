/**
 * Devlika Master Lock - Popup Controller
 * Mendukung Kunci Browser, Kunci Tab Tertentu, dan Kunci Website Tertentu
 */

document.addEventListener("DOMContentLoaded", () => {
  // Navigation Tabs
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const lockedCountBadge = document.getElementById("lockedCountBadge");

  // Tab 1 Elements (Dashboard)
  const currentTabDomainDisplay = document.getElementById("currentTabDomainDisplay");
  const currentTabTitleDisplay = document.getElementById("currentTabTitleDisplay");
  const btnLockCurrentTab = document.getElementById("btnLockCurrentTab");
  const btnLockCurrentDomain = document.getElementById("btnLockCurrentDomain");
  const btnLockDomainText = document.getElementById("btnLockDomainText");
  const btnLockNow = document.getElementById("btnLockNow");

  // Tab 2 Elements (Websites)
  const formAddSite = document.getElementById("formAddSite");
  const inputNewDomain = document.getElementById("inputNewDomain");
  const checkNewSiteActive = document.getElementById("checkNewSiteActive");
  const activeCountDisplay = document.getElementById("activeCountDisplay");
  const sitesListContainer = document.getElementById("sitesListContainer");

  // Tab 3 Elements (Settings)
  const selectAutoLock = document.getElementById("selectAutoLock");
  const btnToggleChangePwd = document.getElementById("btnToggleChangePwd");
  const accordion = btnToggleChangePwd ? btnToggleChangePwd.closest(".accordion") : null;
  const changePwdContent = document.getElementById("changePwdContent");
  const changePasswordForm = document.getElementById("changePasswordForm");
  const oldPassword = document.getElementById("oldPassword");
  const newPassword = document.getElementById("newPassword");
  const newHint = document.getElementById("newHint");
  const changeMessage = document.getElementById("changeMessage");
  const btnSubmitChange = document.getElementById("btnSubmitChange");

  let activeDomain = "";
  let activeUrl = "";

  // 1. Tab Navigation Controller
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.add("hidden"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.remove("hidden");
      }
    });
  });

  // 2. Muat Data Tab Aktif & Website Terkunci
  function loadActiveTabAndSites() {
    chrome.runtime.sendMessage({ action: "GET_LOCKED_SITES_INFO" }, (res) => {
      if (chrome.runtime.lastError || !res) return;

      activeDomain = res.currentDomain || "";
      activeUrl = res.currentUrl || "";
      const isInternal = !activeDomain || activeDomain.startsWith("chrome") || activeDomain.startsWith("brave") || activeDomain.startsWith("edge");

      if (isInternal) {
        currentTabDomainDisplay.textContent = "Halaman Internal";
        currentTabTitleDisplay.textContent = res.currentTitle || "Halaman Sistem Browser";
        btnLockCurrentDomain.disabled = true;
        btnLockCurrentDomain.style.opacity = "0.5";
        btnLockDomainText.textContent = "Website Tidak Bisa Dikunci";
      } else {
        currentTabDomainDisplay.textContent = activeDomain;
        currentTabTitleDisplay.textContent = res.currentTitle || activeDomain;
        btnLockCurrentDomain.disabled = false;
        btnLockCurrentDomain.style.opacity = "1";
        btnLockDomainText.textContent = `Kunci ${activeDomain}`;
      }

      renderSitesList(res.sites || []);
    });
  }

  // 3. Render Daftar Website yang Terkunci
  function renderSitesList(sites) {
    const activeSites = sites.filter((s) => (typeof s === "object" ? s.enabled !== false : true));
    const activeCount = activeSites.length;
    const totalCount = sites.length;

    if (lockedCountBadge) {
      lockedCountBadge.textContent = String(activeCount);
    }
    if (activeCountDisplay) {
      activeCountDisplay.textContent = `${activeCount} Aktif / ${totalCount} Total`;
    }

    if (!sitesListContainer) return;
    sitesListContainer.innerHTML = "";

    if (sites.length === 0) {
      sitesListContainer.innerHTML = `
        <div class="sites-empty">
          <span>Belum ada website yang didaftarkan.<br>Ketik nama domain atau paste link di atas untuk menambahkan.</span>
        </div>
      `;
      return;
    }

    sites.forEach((site) => {
      const pattern = typeof site === "object" ? (site.pattern || site.domain) : site;
      const isEnabled = typeof site === "object" ? (site.enabled !== false) : true;
      const siteId = typeof site === "object" ? (site.id || pattern) : pattern;
      const isPath = (typeof site === "object" && site.type === "path") || (pattern && pattern.includes("/"));

      const item = document.createElement("div");
      item.className = "site-item" + (isEnabled ? "" : " disabled");

      // Left info
      const info = document.createElement("div");
      info.className = "site-item-info";
      
      const iconSvg = isPath
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;

      info.innerHTML = `
        ${iconSvg}
        <div class="site-item-text">
          <span class="site-item-name" title="${escapeHtml(pattern)}">${escapeHtml(pattern)}</span>
          <span class="site-type-tag">${isPath ? "Link / Halaman" : "Domain Lengkap"}</span>
        </div>
      `;

      // Right action group: Toggle + Status + Delete
      const actions = document.createElement("div");
      actions.className = "site-actions-group";

      // Status badge
      const statusBadge = document.createElement("span");
      statusBadge.className = `toggle-status-badge ${isEnabled ? "active" : "inactive"}`;
      statusBadge.textContent = isEnabled ? "Aktif" : "Nonaktif";

      // Toggle switch
      const toggleLabel = document.createElement("label");
      toggleLabel.className = "switch-toggle";
      toggleLabel.title = isEnabled ? "Klik untuk menonaktifkan proteksi" : "Klik untuk mengaktifkan proteksi";

      const toggleInput = document.createElement("input");
      toggleInput.type = "checkbox";
      toggleInput.checked = isEnabled;

      const toggleSlider = document.createElement("span");
      toggleSlider.className = "switch-slider";

      toggleLabel.appendChild(toggleInput);
      toggleLabel.appendChild(toggleSlider);

      // Event toggle
      toggleInput.addEventListener("change", () => {
        const nextState = toggleInput.checked;
        statusBadge.className = `toggle-status-badge ${nextState ? "active" : "inactive"}`;
        statusBadge.textContent = nextState ? "Aktif" : "Nonaktif";
        item.classList.toggle("disabled", !nextState);
        toggleLabel.title = nextState ? "Klik untuk menonaktifkan proteksi" : "Klik untuk mengaktifkan proteksi";

        chrome.runtime.sendMessage({
          action: "TOGGLE_LOCKED_SITE",
          id: siteId,
          enabled: nextState
        }, () => {
          loadActiveTabAndSites();
        });
      });

      // Delete button
      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn-delete-site";
      btnDelete.title = "Hapus website ini dari daftar";
      btnDelete.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;

      btnDelete.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "REMOVE_LOCKED_SITE", id: siteId, pattern: pattern }, () => {
          loadActiveTabAndSites();
        });
      });

      actions.appendChild(statusBadge);
      actions.appendChild(toggleLabel);
      actions.appendChild(btnDelete);

      item.appendChild(info);
      item.appendChild(actions);
      sitesListContainer.appendChild(item);
    });
  }

  // 4. Form Tambah Website Terkunci Baru
  if (formAddSite) {
    formAddSite.addEventListener("submit", (e) => {
      e.preventDefault();
      const domainVal = inputNewDomain.value.trim();
      if (!domainVal) return;

      const shouldEnable = checkNewSiteActive ? checkNewSiteActive.checked : true;

      chrome.runtime.sendMessage({
        action: "ADD_LOCKED_SITE",
        site: domainVal,
        enabled: shouldEnable
      }, (res) => {
        inputNewDomain.value = "";
        loadActiveTabAndSites();
      });
    });
  }

  // 5. Kunci Tab Aktif Ini
  if (btnLockCurrentTab) {
    btnLockCurrentTab.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "LOCK_CURRENT_TAB" }, () => {
        window.close();
      });
    });
  }

  // 6. Kunci Domain Aktif Ini
  if (btnLockCurrentDomain) {
    btnLockCurrentDomain.addEventListener("click", () => {
      if (!activeDomain) return;

      chrome.runtime.sendMessage({ action: "ADD_LOCKED_SITE", site: activeDomain, enabled: true }, () => {
        // Alihkan tab aktif langsung ke layar kunci domain
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            const lockUrl = chrome.runtime.getURL("lock.html");
            chrome.tabs.update(tabs[0].id, {
              url: `${lockUrl}?mode=site&domain=${encodeURIComponent(activeDomain)}&targetUrl=${encodeURIComponent(tabs[0].url)}&tabId=${tabs[0].id}`
            });
          }
          window.close();
        });
      });
    });
  }

  // 7. Kunci Seluruh Browser Sekarang
  if (btnLockNow) {
    btnLockNow.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "LOCK_NOW" }, () => {
        window.close();
      });
    });
  }

  // 8. Pengaturan Awal (Auto Lock & Password)
  chrome.runtime.sendMessage({ action: "GET_LOCK_STATE" }, (state) => {
    if (chrome.runtime.lastError || !state) return;
    if (state.autoLockMinutes !== undefined && selectAutoLock) {
      selectAutoLock.value = String(state.autoLockMinutes);
    }
  });

  if (selectAutoLock) {
    selectAutoLock.addEventListener("change", (e) => {
      const minutes = Number(e.target.value);
      chrome.runtime.sendMessage({
        action: "UPDATE_SETTINGS",
        autoLockMinutes: minutes
      });
    });
  }

  // 9. Accordion Ganti Password
  if (btnToggleChangePwd && accordion) {
    btnToggleChangePwd.addEventListener("click", () => {
      const isOpen = accordion.classList.contains("open");
      accordion.classList.toggle("open", !isOpen);
      if (changePwdContent) {
        changePwdContent.classList.toggle("hidden", isOpen);
      }
      if (!isOpen && oldPassword) {
        oldPassword.focus();
      }
    });
  }

  // 10. Submit Ganti Password
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const oldPwd = oldPassword.value;
      const newPwd = newPassword.value;
      const hint = newHint ? newHint.value.trim() : "";

      if (newPwd.length < 4) {
        showMessage("Kata sandi baru minimal 4 karakter!", "error");
        return;
      }

      btnSubmitChange.disabled = true;
      changeMessage.classList.add("hidden");

      chrome.runtime.sendMessage(
        {
          action: "CHANGE_PASSWORD",
          oldPassword: oldPwd,
          newPassword: newPwd,
          newHint: hint
        },
        (res) => {
          btnSubmitChange.disabled = false;
          if (!res) {
            showMessage("Gagal menghubungi background worker.", "error");
            return;
          }

          if (res.success) {
            showMessage("✓ Kata sandi berhasil diperbarui!", "success");
            oldPassword.value = "";
            newPassword.value = "";
            if (newHint) newHint.value = "";
            setTimeout(() => {
              if (accordion) accordion.classList.remove("open");
              if (changePwdContent) changePwdContent.classList.add("hidden");
              if (changeMessage) changeMessage.classList.add("hidden");
            }, 1500);
          } else {
            showMessage(res.error || "Gagal mengubah kata sandi!", "error");
          }
        }
      );
    });
  }

  // Helpers
  function showMessage(msg, type) {
    if (!changeMessage) return;
    changeMessage.textContent = msg;
    changeMessage.className = `feedback-msg ${type}`;
    changeMessage.classList.remove("hidden");
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Panggil pemuatan data awal
  loadActiveTabAndSites();
});
