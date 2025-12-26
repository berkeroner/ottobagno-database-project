
// DOM helper
const $ = (id) => document.getElementById(id);

// API base
const API_BASE = ''; // local: 'http://localhost:3000'

// Low-level fetch
async function apiFetch(url, options = {}) {
  const res = await fetch(API_BASE + url, {
    credentials: 'same-origin',
    ...options
  });
  return res;
}

async function apiJson(url, options = {}) {
  const res = await apiFetch(url, options);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'API error');
  }
  return res.json();
}

async function apiText(url, options = {}) {
  const res = await apiFetch(url, options);
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || 'API error');
  return txt;
}

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

window.$ = $;
window.apiFetch = apiFetch;
window.apiJson = apiJson;
window.apiText = apiText;
window.safeJsonParse = safeJsonParse;
