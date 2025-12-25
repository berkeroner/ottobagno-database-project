// public/js/api.js

// Kısa DOM helper
const $ = (id) => document.getElementById(id);

// API base (aynı origin için boş bırak)
const API_BASE = ''; // prod: '' | local: 'http://localhost:3000'

// Low-level fetch
async function apiFetch(url, options = {}) {
  const res = await fetch(API_BASE + url, {
    credentials: 'same-origin',
    ...options
  });
  return res;
}

// JSON bekleyen istekler
async function apiJson(url, options = {}) {
  const res = await apiFetch(url, options);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'API error');
  }
  return res.json();
}

// Text/plain bekleyen istekler
async function apiText(url, options = {}) {
  const res = await apiFetch(url, options);
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || 'API error');
  return txt;
}

// Güvenli JSON parse
function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/* --------- Global expose (önemli!) --------- */
window.$ = $;
window.apiFetch = apiFetch;
window.apiJson = apiJson;
window.apiText = apiText;
window.safeJsonParse = safeJsonParse;
