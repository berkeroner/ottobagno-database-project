
// AUTH (LOGIN / LOGOUT / REQUIRE CUSTOMER)

function getLoggedInCustomer() {
  const s = localStorage.getItem('customer');
  return s ? safeJsonParse(s, null) : null;
}

function requireCustomerOrRedirect() {
  const c = getLoggedInCustomer();
  if (!c || !c.CustomerID) {
    window.location.href = 'login.html';
    return null;
  }
  return c;
}

function logout() {
  localStorage.removeItem('customer');
  localStorage.removeItem('cart');
  window.location.href = 'login.html';
}

async function login() {
  const firstName = $('firstName')?.value.trim();
  const lastName = $('lastName')?.value.trim();
  const email = $('email')?.value.trim();
  const msgEl = $('loginMsg');

  if (!firstName || !lastName || !email) {
    if (msgEl) msgEl.innerText = 'Enter name, surname and email';
    return;
  }

  if (firstName.toLowerCase() === 'admin' && lastName.toLowerCase() === 'admin') {
    const adminObj = {
      CustomerID: -1,
      FirstName: 'admin',
      LastName: 'admin',
      Email: 'admin@ottobagno.com',
      Role: 'admin'
    };
    localStorage.setItem('customer', JSON.stringify(adminObj));
    window.location.href = 'admin.html';
    return;
  }

  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email })
    });

    if (!res.ok) {
      if (msgEl) msgEl.innerText = await res.text();
      return;
    }

    const customer = await res.json();
    localStorage.setItem('customer', JSON.stringify(customer));
    window.location.href = 'index.html';

  } catch (err) {
    if (msgEl) msgEl.innerText = 'Server connection error.';
    console.error(err);
  }
}

// LOGIN PAGE INIT

function initLoginPage() {
  const btn = $('btnLogin');
  if (btn) btn.onclick = login;

  // Login with enter
  const lastNameInput = $('lastName');
  if (lastNameInput) {
    lastNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') login();
    });
  }
}

// ADMIN CHECK

function requireAdminOrRedirect() {
  const c = getLoggedInCustomer();
  if (!c || c.FirstName !== 'admin' || c.LastName !== 'admin') {
    alert('Unauthorized access!');
    window.location.href = 'index.html';
    return null;
  }
  return c;
}

window.getLoggedInCustomer = getLoggedInCustomer;
window.requireCustomerOrRedirect = requireCustomerOrRedirect;
window.requireAdminOrRedirect = requireAdminOrRedirect;
window.login = login;
window.logout = logout;
window.initLoginPage = initLoginPage;
