// ============================================================
// NoteShare — main.js
// Shared utilities, auth guards, token helpers
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// ---- Token helpers ----

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function isLoggedIn() {
  return !!getToken();
}

// ---- API fetch wrapper ----

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(API_BASE + endpoint, {
    ...options,
    headers
  });

  if (res.status === 401) {
    clearAuth();
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
  div.textContent = String(text || '');
  return div.innerHTML;
}

// ---- Flash messages ----

function showFlash(message, type = 'success', duration = 3000) {
  const existing = document.querySelector('.flash-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `flash-toast alert alert-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 24px;
    z-index: 9999;
    min-width: 280px;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- Route guards ----

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

function requireAdmin() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = '/dashboard';
    return false;
  }
  return true;
}

// ---- Init: redirect if not logged in (for protected pages) ----

document.addEventListener('DOMContentLoaded', () => {
  const publicPaths = ['/login', '/register'];
  const currentPath = window.location.pathname;

  if (!publicPaths.includes(currentPath) && !isLoggedIn()) {
    window.location.href = '/login';
    return;
  }

  // Highlight active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
});

// ---- CSS animations for toast ----
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);