// ============================================================
// NoteShare — main.js
// Shared utilities loaded once in <head>/before-content so every
// page script (loaded via {% block scripts %}, after this file)
// can reuse them instead of redefining its own copy.
//
// Auth is session-cookie based (see frontend/app.py) — there is no
// client-side token to manage here. All API calls go through the
// same-origin /api/* proxy, which attaches the bearer token
// server-side.
// ============================================================

// ---- API fetch wrapper ----

async function apiFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers
  };

  let res;
  try {
    res = await fetch(endpoint, { ...options, headers });
  } catch (err) {
    // Network down, DNS failure, request aborted, etc. Every caller in this
    // app treats a null return the same way it treats a 401 (skip its own
    // success handling), so centralizing the catch here means individual
    // call sites don't each need their own try/catch to avoid an unhandled
    // promise rejection.
    showFlash('Network error. Check your connection and try again.', 'danger');
    return null;
  }

  if (res.status === 401) {
    window.location.href = '/login';
    return null;
  }

  return res;
}

// ---- Date formatting ----

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(iso);
}

// ---- HTML escaping ----

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text ?? '');
  return div.innerHTML;
}

// ---- Flash messages ----

function showFlash(message, type = 'success', duration = 4000) {
  const existing = document.querySelector('.flash-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `flash-toast alert alert-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('flash-toast-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- Nav active-link highlighting ----

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
});
