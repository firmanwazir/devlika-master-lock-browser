/**
 * Devlika Master Lock - Lock Screen Script
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const lockCard = document.getElementById("lockCard");
  const statusSubtitle = document.getElementById("statusSubtitle");

  // Sections
  const unlockSection = document.getElementById("unlockSection");
  const setupSection = document.getElementById("setupSection");

  // Mode badge & buttons
  const lockModeBadge = document.getElementById("lockModeBadge");
  const lockModeIcon = document.getElementById("lockModeIcon");
  const lockModeText = document.getElementById("lockModeText");
  const btnUnlockText = document.getElementById("btnUnlockText");
  const btnCancelUnlock = document.getElementById("btnCancelUnlock");

  // Unlock elements
  const unlockForm = document.getElementById("unlockForm");
  const unlockPassword = document.getElementById("unlockPassword");
  const btnToggleUnlockEye = document.getElementById("btnToggleUnlockEye");
  const btnUnlockSubmit = document.getElementById("btnUnlockSubmit");
  const unlockMessage = document.getElementById("unlockMessage");
  const capsLockWarning = document.getElementById("capsLockWarning");
  const cooldownBox = document.getElementById("cooldownBox");
  const cooldownText = document.getElementById("cooldownText");
  const btnShowHint = document.getElementById("btnShowHint");
  const hintContent = document.getElementById("hintContent");
  const hintText = document.getElementById("hintText");

  // Setup elements
  const setupForm = document.getElementById("setupForm");
  const setupPassword = document.getElementById("setupPassword");
  const setupConfirmPassword = document.getElementById("setupConfirmPassword");
  const setupHint = document.getElementById("setupHint");
  const btnToggleSetupEye = document.getElementById("btnToggleSetupEye");
  const btnSetupSubmit = document.getElementById("btnSetupSubmit");
  const setupMessage = document.getElementById("setupMessage");

  // Parameter URL untuk mendeteksi mode kunci: browser, tab, atau site
  const urlParams = new URLSearchParams(window.location.search);
  const lockMode = urlParams.get("mode") || "browser"; // "browser" | "tab" | "site"
  const domainParam = urlParams.get("domain") || "";
  const targetUrlParam = urlParams.get("targetUrl") || "";
  const tabIdParam = urlParams.get("tabId") || "";

  let cooldownTimer = null;

  // 1. Ambil status kunci dari background worker
  try {
    chrome.runtime.sendMessage({ action: "GET_LOCK_STATE" }, (state) => {
      if (chrome.runtime.lastError) {
        console.warn("Background communication error:", chrome.runtime.lastError);
        return;
      }

      if (!state) return;

      // Jika browser tidak terkunci dan sudah punya password, dan mode adalah "browser", tutup tab
      if (!state.isLocked && state.hasPassword && lockMode === "browser") {
        window.close();
        return;
      }

      // Jika belum ada password, tampilkan form Setup
      if (!state.hasPassword) {
        showSetupView();
      } else {
        showUnlockView(state);
      }
    });
  } catch (err) {
    console.error("Init state error:", err);
  }

  function showSetupView() {
    unlockSection.classList.add("hidden");
    setupSection.classList.remove("hidden");
    statusSubtitle.textContent = "Amankan browser Anda dengan Master Password";
    setupPassword.focus();
  }

  function showUnlockView(state) {
    setupSection.classList.add("hidden");
    unlockSection.classList.remove("hidden");
    unlockPassword.focus();

    if (lockMode === "tab") {
      statusSubtitle.textContent = "Tab ini telah dikunci khusus demi privasi Anda.";
      lockModeIcon.textContent = "🔒";
      lockModeText.textContent = "Tab Khusus Terkunci";
      lockModeBadge.classList.remove("hidden");
      btnUnlockText.textContent = "Buka Kunci Tab Ini";
      btnCancelUnlock.classList.remove("hidden");
    } else if (lockMode === "site") {
      const isPath = domainParam && domainParam.includes("/");
      statusSubtitle.textContent = isPath
        ? "Akses ke link/halaman ini dibatasi dengan Master Password."
        : "Akses ke seluruh website ini dibatasi dengan Master Password.";
      lockModeIcon.textContent = isPath ? "🔗" : "🌐";
      lockModeText.textContent = domainParam
        ? `${isPath ? "Link" : "Situs"}: ${domainParam}`
        : "Website Terkunci";
      lockModeBadge.classList.remove("hidden");
      btnUnlockText.textContent = isPath ? "Buka Akses Link Ini" : "Buka Akses Website Ini";
      btnCancelUnlock.classList.remove("hidden");
    } else {
      statusSubtitle.textContent = "Browser terkunci. Masukkan Master Password.";
      lockModeBadge.classList.add("hidden");
      btnUnlockText.textContent = "Buka Kunci Browser";
      btnCancelUnlock.classList.add("hidden");
    }

    if (state.hint) {
      hintText.textContent = state.hint;
      btnShowHint.parentElement.classList.remove("hidden");
    } else {
      btnShowHint.parentElement.classList.add("hidden");
    }

    if (state.cooldownUntil && state.cooldownUntil > 0) {
      startCooldown(Math.ceil(state.cooldownUntil / 1000));
    }
  }

  // Tombol Batal & Tutup Tab
  if (btnCancelUnlock) {
    btnCancelUnlock.addEventListener("click", () => {
      if (tabIdParam) {
        chrome.runtime.sendMessage({ action: "CLOSE_TAB", tabId: Number(tabIdParam) }, () => {
          try { window.close(); } catch (e) {}
        });
      } else {
        try { window.close(); } catch (e) {}
      }
    });
  }

  // Fokuskan kembali input ketika jendela browser difokuskan
  window.addEventListener("focus", () => {
    if (!unlockSection.classList.contains("hidden")) {
      unlockPassword.focus();
    } else if (!setupSection.classList.contains("hidden")) {
      setupPassword.focus();
    }
  });

  // 2. Toggle Show/Hide Password
  function setupEyeToggle(btn, input) {
    if (!btn || !input) return;
    const eyeOpen = btn.querySelector(".eye-open");
    const eyeClosed = btn.querySelector(".eye-closed");

    btn.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      if (eyeOpen && eyeClosed) {
        eyeOpen.classList.toggle("hidden", isPassword);
        eyeClosed.classList.toggle("hidden", !isPassword);
      }
      input.focus();
    });
  }

  setupEyeToggle(btnToggleUnlockEye, unlockPassword);
  setupEyeToggle(btnToggleSetupEye, setupPassword);

  // 3. Deteksi Caps Lock
  function checkCapsLock(e) {
    if (e.getModifierState && e.getModifierState("CapsLock")) {
      capsLockWarning.classList.remove("hidden");
    } else {
      capsLockWarning.classList.add("hidden");
    }
  }

  unlockPassword.addEventListener("keydown", checkCapsLock);
  unlockPassword.addEventListener("keyup", checkCapsLock);

  // 4. Tampilkan Hint Sandi
  if (btnShowHint) {
    btnShowHint.addEventListener("click", () => {
      hintContent.classList.toggle("hidden");
    });
  }

  // 5. Cooldown Timer Manager
  function startCooldown(seconds) {
    if (cooldownTimer) clearInterval(cooldownTimer);
    btnUnlockSubmit.disabled = true;
    cooldownBox.classList.remove("hidden");

    let remaining = seconds;
    cooldownText.textContent = `Terlalu banyak percobaan. Coba lagi dalam ${remaining}s...`;

    cooldownTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
        cooldownBox.classList.add("hidden");
        btnUnlockSubmit.disabled = false;
        unlockPassword.focus();
      } else {
        cooldownText.textContent = `Terlalu banyak percobaan. Coba lagi dalam ${remaining}s...`;
      }
    }, 1000);
  }

  // 6. Shake card on error
  function triggerShake() {
    lockCard.classList.remove("shake");
    // Reflow
    void lockCard.offsetWidth;
    lockCard.classList.add("shake");
  }

  // 7. Handle Submit UNLOCK
  unlockForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (btnUnlockSubmit.disabled) return;

    const password = unlockPassword.value;
    if (!password) return;

    btnUnlockSubmit.disabled = true;
    unlockMessage.classList.add("hidden");

    let messagePayload;
    if (lockMode === "tab") {
      messagePayload = { action: "UNLOCK_SPECIFIC_TAB", tabId: Number(tabIdParam), password };
    } else if (lockMode === "site") {
      messagePayload = {
        action: "UNLOCK_SITE",
        domain: domainParam,
        targetUrl: targetUrlParam,
        tabId: tabIdParam ? Number(tabIdParam) : null,
        password
      };
    } else {
      messagePayload = { action: "UNLOCK", password };
    }

    chrome.runtime.sendMessage(messagePayload, (res) => {
      btnUnlockSubmit.disabled = false;

      if (!res) {
        showError(unlockMessage, "Terjadi gangguan koneksi latar belakang.");
        return;
      }

      if (res.success) {
        showSuccess(unlockMessage, "✓ Kata sandi benar! Membuka akses...");
        btnUnlockSubmit.disabled = true;
        unlockPassword.value = "";

        if (res.redirectUrl) {
          window.location.replace(res.redirectUrl);
        }
      } else {
        triggerShake();
        if (res.isCooldown) {
          startCooldown(res.cooldownSeconds);
        } else {
          showError(unlockMessage, res.error || "Kata sandi salah!");
          unlockPassword.select();
        }
      }
    });
  });

  // 8. Handle Submit SETUP
  setupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (btnSetupSubmit.disabled) return;

    const password = setupPassword.value;
    const confirm = setupConfirmPassword.value;
    const hint = setupHint.value.trim();

    if (password.length < 4) {
      showError(setupMessage, "Kata sandi minimal 4 karakter!");
      triggerShake();
      return;
    }

    if (password !== confirm) {
      showError(setupMessage, "Konfirmasi kata sandi tidak cocok!");
      triggerShake();
      setupConfirmPassword.focus();
      return;
    }

    btnSetupSubmit.disabled = true;
    setupMessage.classList.add("hidden");

    chrome.runtime.sendMessage(
      { action: "SETUP_PASSWORD", password, hint },
      (res) => {
        btnSetupSubmit.disabled = false;
        if (res && res.success) {
          showSuccess(setupMessage, "✓ Master Password berhasil disimpan! Membuka browser...");
          btnSetupSubmit.disabled = true;
          // Background service worker akan memulihkan tab / membuka new tab
        } else {
          showError(setupMessage, res?.error || "Gagal menyimpan kata sandi.");
        }
      }
    );
  });

  // Helpers
  function showError(el, msg) {
    el.textContent = msg;
    el.className = "feedback-msg error";
    el.classList.remove("hidden");
  }

  function showSuccess(el, msg) {
    el.textContent = msg;
    el.className = "feedback-msg success";
    el.classList.remove("hidden");
  }
});
