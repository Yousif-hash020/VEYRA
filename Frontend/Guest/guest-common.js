/**
 * Shared helpers for all VEYRA guest pages.
 */
const VEYRA_API_BASE = "http://localhost:5000";
const GUEST_PROPERTY_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80";

function getGuestSession() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!token || !user || user.role !== "guest") {
    return null;
  }
  return { token, user };
}

function redirectToGuestAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/Frontend/auth.html";
}

function requireGuestSession() {
  const session = getGuestSession();
  if (!session) {
    redirectToGuestAuth();
    return null;
  }
  return session;
}

function handleGuestAuthResponse(response) {
  if (response && response.status === 401) {
    redirectToGuestAuth();
    return true;
  }
  return false;
}

async function guestFetch(url, options = {}) {
  const session = getGuestSession();
  if (!session) {
    redirectToGuestAuth();
    return null;
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${session.token}`,
  };

  const response = await fetch(url, { ...options, headers });
  if (handleGuestAuthResponse(response)) {
    return null;
  }
  return response;
}

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function attachImageFallback(img, fallbackSrc = GUEST_PROPERTY_FALLBACK_IMG) {
  if (!img) return;
  img.onerror = function onImageError() {
    this.onerror = null;
    this.src = fallbackSrc;
  };
}

function initGuestLogout() {
  document.querySelectorAll(".nav-logout, #logout-link").forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const session = getGuestSession();
      if (session) {
        try {
          await fetch(`${VEYRA_API_BASE}/api/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${session.token}` },
          });
        } catch (err) {
          console.error("Logout error:", err);
        }
      }
      redirectToGuestAuth();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGuestLogout);
} else {
  initGuestLogout();
}
