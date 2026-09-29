/**
 * Devlika Master Lock - Crypto Utility
 * Menggunakan Web Crypto API dengan PBKDF2 (SHA-256) 100.000 iterasi + salt acak 128-bit.
 */

(function (global) {
  const CryptoHelper = {
    /**
     * Menghasilkan hash kata sandi menggunakan PBKDF2 + salt
     * @param {string} password - Kata sandi teks polos
     * @param {string|null} saltBase64 - Salt dalam format Base64 (opsional, dibuat otomatis jika null)
     * @returns {Promise<{ hash: string, salt: string }>}
     */
    async hashPassword(password, saltBase64 = null) {
      const enc = new TextEncoder();
      let saltBuffer;

      if (saltBase64) {
        const binary = atob(saltBase64);
        saltBuffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          saltBuffer[i] = binary.charCodeAt(i);
        }
      } else {
        saltBuffer = crypto.getRandomValues(new Uint8Array(16));
      }

      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: saltBuffer,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        256
      );

      // Konversi hasil derivedBits ke Base64
      const hashBytes = new Uint8Array(derivedBits);
      let hashBinary = "";
      for (let i = 0; i < hashBytes.length; i++) {
        hashBinary += String.fromCharCode(hashBytes[i]);
      }
      const hash = btoa(hashBinary);

      // Konversi saltBuffer ke Base64
      let saltBinary = "";
      for (let i = 0; i < saltBuffer.length; i++) {
        saltBinary += String.fromCharCode(saltBuffer[i]);
      }
      const salt = btoa(saltBinary);

      return { hash, salt };
    },

    /**
     * Memverifikasi apakah kata sandi cocok dengan hash dan salt yang tersimpan
     * @param {string} inputPassword - Kata sandi input
     * @param {string} storedHash - Hash tersimpan (Base64)
     * @param {string} storedSalt - Salt tersimpan (Base64)
     * @returns {Promise<boolean>}
     */
    async verifyPassword(inputPassword, storedHash, storedSalt) {
      if (!inputPassword || !storedHash || !storedSalt) return false;
      const { hash } = await this.hashPassword(inputPassword, storedSalt);
      return hash === storedHash;
    }
  };

  global.CryptoHelper = CryptoHelper;
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this);
