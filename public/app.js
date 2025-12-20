// ===================== AUTH (Customer) =====================

function getLoggedInCustomer() {
  const s = localStorage.getItem('customer');
  return s ? JSON.parse(s) : null;
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
  window.location.href = 'login.html';
}

async function login() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const msgEl = document.getElementById('loginMsg');

  if (!firstName || !lastName) {
    msgEl.innerText = 'İsim ve soyisim gir.';
    return;
  }

  // ✅ ADMIN KURALİ (DB'ye gitmez)
  if (firstName.toLowerCase() === 'admin' && lastName.toLowerCase() === 'admin') {
    const adminObj = { CustomerID: -1, FirstName: 'admin', LastName: 'admin' };
    localStorage.setItem('customer', JSON.stringify(adminObj));
    window.location.href = 'admin.html';
    return;
  }

  // ✅ NORMAL CUSTOMER LOGIN (SP ile)
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName })
  });

  if (!res.ok) {
    msgEl.innerText = await res.text();
    return;
  }

  const customer = await res.json();
  localStorage.setItem('customer', JSON.stringify(customer));
  window.location.href = 'index.html';
}



// ===================== CART STORAGE =====================

function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function setCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((s, it) => s + it.quantity, 0);
  const el = document.getElementById('cartCount');
  if (el) el.innerText = count;
}

function cartTotal(cart) {
  return cart.reduce((s, it) => s + (it.quantity * it.unitPrice), 0);
}

// ===================== CATALOG =====================

async function initCatalogPage() {
  const c = requireCustomerOrRedirect();
  if (!c) return;

  updateCartCount();
  await loadFilters();
  await loadFilteredProducts();
}

async function loadFilters() {
  const classSelect = document.getElementById('classSelect');
  const collectionSelect = document.getElementById('collectionSelect');

  classSelect.innerHTML = `<option value="">(Hepsi)</option>`;
  collectionSelect.innerHTML = `<option value="">(Hepsi)</option>`;

  const classes = await fetch('/api/products/classes').then(r => r.json());
  classes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.ClassID;
    opt.innerText = c.ClassName;
    classSelect.appendChild(opt);
  });

  const colls = await fetch('/api/products/collections').then(r => r.json());
  colls.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.CollectionID;
    opt.innerText = c.CollectionName;
    collectionSelect.appendChild(opt);
  });

  // ✅ ÖNEMLİ: Filtre değişince listeyi yenile
  classSelect.onchange = loadFilteredProducts;
  collectionSelect.onchange = loadFilteredProducts;

  // ✅ Reset butonu
  const btnReset = document.getElementById('btnResetFilters');
  if (btnReset) btnReset.onclick = resetFilters;
}


async function loadFilteredProducts() {
  const classId = document.getElementById('classSelect')?.value || '';
  const collectionId = document.getElementById('collectionSelect')?.value || '';

  const qs = new URLSearchParams();
  if (classId) qs.set('classId', classId);
  if (collectionId) qs.set('collectionId', collectionId);

  const url = '/api/products/filtered' + (qs.toString() ? `?${qs.toString()}` : '');
  console.log("FILTER URL:", url);

  const res = await fetch(url);
  const data = await res.json();

  const ul = document.getElementById('products');
  ul.innerHTML = '';

  data.forEach(p => {
    const li = document.createElement('li');
    li.innerText = `${p.ProductCode} - ${p.ProductName} (Stock: ${p.StockQuantity}, Price: ${p.SalesPrice}) `;

    const btn = document.createElement('button');
    btn.innerText = 'Sepete Ekle';
    btn.onclick = () => addToCart(p);
    li.appendChild(btn);

    ul.appendChild(li);
  });
}


function resetFilters() {
  document.getElementById('classSelect').value = '';
  document.getElementById('collectionSelect').value = '';
  loadFilteredProducts();
}

function addToCart(p) {
  const qty = parseInt(prompt('Kaç adet?'), 10);
  if (!qty || qty <= 0) return alert('Quantity geçersiz.');

  if (qty > p.StockQuantity) return alert('Yetersiz stok!');

  const cart = getCart();
  const code = String(p.ProductCode).trim().toUpperCase();

  const existing = cart.find(x => x.productCode === code);
  if (existing) existing.quantity += qty;
  else {
    cart.push({
      productCode: code,
      productName: p.ProductName,
      quantity: qty,
      unitPrice: Number(p.SalesPrice)
    });
  }

  setCart(cart);
  alert('Sepete eklendi.');
}

// ===================== CART PAGE =====================

function initCartPage() {
  const c = requireCustomerOrRedirect();
  if (!c) return;

  updateCartCount();
  renderCartPage();

  const btn = document.getElementById('btnCheckout');
  if (btn) {
    btn.onclick = () => {
      const cart = getCart();
      if (!cart || cart.length === 0) return alert('Sepet boş.');
      window.location.href = 'checkout.html';
    };
  }
}

function renderCartPage() {
  const cart = getCart();
  const ul = document.getElementById('cartList');
  const totalEl = document.getElementById('cartTotal');

  ul.innerHTML = '';

  cart.forEach((it, idx) => {
    const li = document.createElement('li');

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '1';
    qtyInput.value = it.quantity;
    qtyInput.style.width = '60px';

    qtyInput.onchange = () => {
      const newQty = parseInt(qtyInput.value, 10);
      if (!newQty || newQty <= 0) {
        alert('Quantity geçersiz.');
        qtyInput.value = it.quantity;
        return;
      }
      const newCart = getCart();
      newCart[idx].quantity = newQty;
      setCart(newCart);
      renderCartPage();
    };

    const rm = document.createElement('button');
    rm.innerText = 'Kaldır';
    rm.onclick = () => {
      const newCart = getCart();
      newCart.splice(idx, 1);
      setCart(newCart);
      renderCartPage();
    };

    li.appendChild(document.createTextNode(`${it.productCode} - ${it.productName} | Unit: ${it.unitPrice} | Qty: `));
    li.appendChild(qtyInput);
    li.appendChild(document.createTextNode(' '));
    li.appendChild(rm);

    ul.appendChild(li);
  });

  totalEl.innerText = cartTotal(cart).toFixed(2);
}

// ===================== CHECKOUT PAGE =====================

function initCheckoutPage() {
  const customer = requireCustomerOrRedirect();
  if (!customer) return;

  const info = document.getElementById('customerInfo');
  if (info) info.innerText = `${customer.FirstName} ${customer.LastName} (ID: ${customer.CustomerID})`;

  const btn = document.getElementById('btnCheckoutPay');
  if (!btn) {
    alert("btnCheckoutPay bulunamadı!");
    return;
  }

  btn.onclick = checkoutAndPay;
}

async function checkoutAndPay() {
  try {
    const cart = getCart();
    if (!cart || cart.length === 0) return alert('Sepet boş.');

    const customer = requireCustomerOrRedirect();
    if (!customer) return;

    const usedCurrency = document.getElementById('usedCurrency').value.trim();
    const countryId = parseInt(document.getElementById('countryId').value, 10);
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!usedCurrency || !countryId || !paymentMethod) {
      return alert('Currency / CountryID / PaymentMethod boş olamaz.');
    }

    const body = {
      customerId: customer.CustomerID,
      usedCurrency,
      countryId,
      paymentMethod,
      items: cart.map(x => ({
        productCode: x.productCode,
        quantity: Number(x.quantity),
        unitPrice: Number(x.unitPrice)
      }))
    };

    const res = await fetch('/api/orders/checkout-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const t = await res.text();
      alert(t);
      return;
    }

    const data = await res.json();
    alert(`✅ Ödeme alındı ve sipariş oluşturuldu!\nOrderID: ${data.orderId}\nTotal: ${data.totalAmount}`);

    localStorage.removeItem('cart');
    window.location.href = 'index.html';
  } catch (e) {
    console.error(e);
    alert("Hata: " + e.message);
  }
}

async function adminAddProduct() {
  const msg = document.getElementById('adminMsg');
  msg.innerText = '';

  const body = {
    productCode: document.getElementById('pCode').value.trim(),
    productName: document.getElementById('pName').value.trim(),
    salesPrice: Number(document.getElementById('pPrice').value),
    color: document.getElementById('pColor').value.trim(),
    stockQuantity: Number(document.getElementById('pStock').value),
    classId: document.getElementById('pClass').value ? Number(document.getElementById('pClass').value) : null,
    collectionId: document.getElementById('pColl').value ? Number(document.getElementById('pColl').value) : null
  };

  const res = await fetch('/api/admin/products/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    msg.innerText = await res.text();
    return;
  }

  alert('✅ Ürün eklendi');
}

async function adminDeleteProduct() {
  const msg = document.getElementById('adminMsg');
  msg.innerText = '';

  const productCode = document.getElementById('delCode').value.trim();
  if (!productCode) return alert('ProductCode gir');

  const res = await fetch('/api/admin/products/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productCode })
  });

  if (!res.ok) {
    msg.innerText = await res.text();
    return;
  }

  alert('✅ Ürün silindi');
}

async function adminLoadEmployees() {
  const msg = document.getElementById('adminMsg');
  msg.innerText = '';

  const ul = document.getElementById('empList');
  ul.innerHTML = 'Yükleniyor...';

  const res = await fetch('/api/admin/employees');
  if (!res.ok) {
    ul.innerHTML = '';
    msg.innerText = await res.text();
    return;
  }

  const data = await res.json();
  ul.innerHTML = '';

  data.forEach(e => {
    const li = document.createElement('li');
    li.innerText = `#${e.EmployeeID} - ${e.FirstName} ${e.LastName} | ${e.Role} | ${e.Email}`;
    ul.appendChild(li);
  });
}

async function adminLoadOrders() {
  const msg = document.getElementById('adminMsg');
  msg.innerText = '';

  const ul = document.getElementById('orderList');
  ul.innerHTML = 'Yükleniyor...';

  const res = await fetch('/api/admin/orders');
  if (!res.ok) {
    ul.innerHTML = '';
    msg.innerText = await res.text();
    return;
  }

  const data = await res.json();
  ul.innerHTML = '';

  data.forEach(o => {
    const li = document.createElement('li');
    li.innerText = `OrderID:${o.OrderID} | CustomerID:${o.CustomerID} | Status:${o.OrderStatus} | Total:${o.TotalAmount} | Date:${o.OrderDate}`;
    ul.appendChild(li);
  });
}
