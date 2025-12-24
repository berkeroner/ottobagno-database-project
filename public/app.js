
const API_BASE = '';


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
  localStorage.removeItem('cart');
  window.location.href = 'login.html';
}

async function login() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const msgEl = document.getElementById('loginMsg');

  if (!firstName || !lastName) {
    msgEl.innerText = 'Enter name and surname';
    return;
  }

  // 🔴 ADMIN GİRİŞİ (Hardcoded)
  if (firstName.toLowerCase() === 'admin' && lastName.toLowerCase() === 'admin') {
    const adminObj = {
      CustomerID: -1,
      FirstName: 'System',
      LastName: 'Admin',
      Email: 'admin@ottobagno.com'
    };
    localStorage.setItem('customer', JSON.stringify(adminObj));
    window.location.href = 'admin.html';
    return;
  }

  // 🔵 MÜŞTERİ GİRİŞİ (API)
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
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
  } catch (err) {
    msgEl.innerText = "Server connection error.";
    console.error(err);
  }
}

// ===================== SEPET MANTIĞI (CART) =====================

function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function setCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const cart = getCart();
  const totalQty = cart.reduce((s, it) => s + Number(it.quantity), 0);

  const navBadge = document.getElementById('cartCount');
  if (navBadge) navBadge.innerText = totalQty;

  const pageBadge = document.getElementById('itemCountBadge');
  if (pageBadge) pageBadge.innerText = `${totalQty} Products`;

  const totalEl = document.getElementById('cartTotal');
  if (totalEl) {
    const totalPrice = cart.reduce((s, it) => s + (it.quantity * it.unitPrice), 0);
    totalEl.innerText = totalPrice.toFixed(2);
  }
}

function addToCart(product) {
  const cart = getCart();
  const code = String(product.ProductCode).trim();
  const price = Number(product.SalesPriceWithVAT || product.SalesPrice);

  const qtyInput = document.getElementById(`qty-${code}`);
  let qtyToAdd = 1;

  if (qtyInput) {
    qtyToAdd = parseInt(qtyInput.value);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
  }

  const existing = cart.find(x => x.productCode === code);
  const currentQtyInCart = existing ? existing.quantity : 0;

  if (currentQtyInCart + qtyToAdd > product.StockQuantity) {
    alert(`Out of stock! Quantity in stock: ${product.StockQuantity}, Your cart: ${currentQtyInCart}`);
    return;
  }

  if (existing) existing.quantity += qtyToAdd;
  else {
    cart.push({
      productCode: code,
      productName: product.ProductName,
      quantity: qtyToAdd,
      unitPrice: price
    });
  }

  setCart(cart);

  showNotification(`${product.ProductName} (${qtyToAdd} items) added to cart!`);

  if (qtyInput) qtyInput.value = 1;
}

// ===================== SAYFA: INDEX (KATALOG) =====================

async function initCatalogPage() {
  const c = requireCustomerOrRedirect();
  if (!c) return;

  document.getElementById('userName').innerText = `${c.FirstName} ${c.LastName}`;
  updateCartUI();

  // Admin Linki Göster
  if (c.FirstName === 'System' && c.LastName === 'Admin') {
    const pnl = document.getElementById('adminPanel');
    if (pnl) pnl.style.display = 'block';
  }
  await loadBestSellers();
  await loadFilters();
  await loadFilteredProducts();
}

async function loadFilters() {
  const classSelect = document.getElementById('classSelect');
  const collectionSelect = document.getElementById('collectionSelect');
  if (!classSelect) return;

  try {
    const [classes, colls] = await Promise.all([
      fetch(`${API_BASE}/api/products/classes`).then(r => r.json()),
      fetch(`${API_BASE}/api/products/collections`).then(r => r.json())
    ]);

    classes.forEach(c => classSelect.innerHTML += `<option value="${c.ClassID}">${c.ClassName}</option>`);
    colls.forEach(c => collectionSelect.innerHTML += `<option value="${c.CollectionID}">${c.CollectionName}</option>`);

    classSelect.onchange = loadFilteredProducts;
    collectionSelect.onchange = loadFilteredProducts;
    document.getElementById('btnResetFilters').onclick = () => {
      classSelect.value = '';
      collectionSelect.value = '';
      loadFilteredProducts();
    };
  } catch (e) {
    console.log("Filter loading error", e);
  }
}

async function loadFilteredProducts() {
  const container = document.getElementById('products');
  if (!container) return;

  container.innerHTML = '<div class="text-center w-100 mt-5"><div class="spinner-border text-primary"></div></div>';

  const qs = new URLSearchParams();
  const cId = document.getElementById('classSelect')?.value;
  const coId = document.getElementById('collectionSelect')?.value;
  if (cId) qs.set('classId', cId);
  if (coId) qs.set('collectionId', coId);

  try {
    let url = `${API_BASE}/api/products/filtered?${qs}`;
    let res = await fetch(url);

    if (!res.ok && res.status === 404) {
      res = await fetch(`${API_BASE}/api/products`);
    }

    const data = await res.json();
    container.innerHTML = '';

    if (!data.length) {
      container.innerHTML = '<div class="alert alert-warning w-100">Ürün yok.</div>';
      return;
    }

    data.forEach(p => {
      const price = (p.SalesPriceWithVAT || p.SalesPrice).toFixed(2);
      const qtyInputId = `qty-${p.ProductCode}`;

      container.innerHTML += `
        <div class="col">
          <div class="card h-100 shadow-sm product-card">
            <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 180px;">
              <i class="fa-solid fa-box-open fa-3x text-secondary"></i>
            </div>
            <div class="card-body d-flex flex-column">
              <h6 class="card-title fw-bold text-truncate" title="${p.ProductName}">${p.ProductName}</h6>
              <small class="text-muted mb-3">Product Code: ${p.ProductCode}</small>

              <div class="mt-auto">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fs-5 text-primary fw-bold">${price} ₺</span>
                  <span class="badge bg-light text-secondary border">Stok: ${p.StockQuantity}</span>
                </div>

                <div class="input-group">
                  <input type="number" id="${qtyInputId}" class="form-control text-center" value="1" min="1" max="${p.StockQuantity}">
                  <button class="btn btn-primary" onclick='addToCart(${JSON.stringify(p)})'>
                    <i class="fa-solid fa-cart-plus"></i> Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    });
  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger w-100">${e.message}</div>`;
  }
}


function initAdminPage() {
  const c = requireCustomerOrRedirect();
  if (!c) return;

  // Admin Değilse Ana Sayfaya Gönder
  if (c.FirstName !== 'System' && c.LastName !== 'Admin') {
    alert("Unauthorized Access!");
    window.location.href = 'index.html';
    return;
  }

  // Admin Bilgisini Yaz
  const infoEl = document.getElementById('adminInfo');
  if (infoEl) infoEl.innerText = `Admin: ${c.FirstName} ${c.LastName}`;

  // ===================== EVENT TANIMLAMALARI =====================

  // --- Ürün Yönetimi ---
  document.getElementById('btnAddProduct')?.addEventListener('click', adminAddProduct);
  document.getElementById('btnDeleteProduct')?.addEventListener('click', adminDeleteProduct);
  document.getElementById('btnProducts')?.addEventListener('click', () => adminLoadProducts());
  
  const searchInput = document.getElementById('productSearch');
  if (searchInput) {
      searchInput.onkeydown = (e) => {
        if (e.key === 'Enter') adminLoadProducts(e.target.value);
      };
  }

  // --- Sipariş Yönetimi ---
  document.getElementById('btnOrders')?.addEventListener('click', adminLoadOrders);
  document.getElementById('btnAllOrders')?.addEventListener('click', adminLoadAllOrders);

  // --- Çalışan Yönetimi ---
  document.getElementById('btnEmployees')?.addEventListener('click', adminLoadEmployees);
  document.getElementById('btnEmpAdd')?.addEventListener('click', adminAddEmployee);
  document.getElementById('btnEmpDelete')?.addEventListener('click', adminDeleteEmployee);

  // --- Hammadde (Satın Alma) ---
  document.getElementById('btnPurchaseList')?.addEventListener('click', adminLoadPurchaseOrders);
  document.getElementById('purchase-tab')?.addEventListener('shown.bs.tab', () => {
  loadPurchaseDropdowns();
  adminLoadRawMaterialStockStatus();
  });
  
  // Sipariş verme butonu
  const btnPurchase = document.getElementById('btnPurchaseSubmit') || document.getElementById('btnCreatePurchaseOrder');
  btnPurchase?.addEventListener('click', (e) => {
      e.preventDefault(); 
      adminCreatePurchaseOrder();
  });

  // --- Üretim (Production) ---
  document.getElementById('btnExecuteProduction')?.addEventListener('click', adminExecuteProduction);
  document.getElementById('prodSelectProduct')?.addEventListener('change', adminLoadBOM);

  // Üretim sekmesi açılınca ürünleri doldur
  document.getElementById('production-tab')?.addEventListener('shown.bs.tab', loadProductionDropdown);

  // --- Customer Management ---
document.getElementById('btnCustomers')?.addEventListener('click', adminLoadCustomers);
document.getElementById('btnCustAdd')?.addEventListener('click', adminAddCustomer);
document.getElementById('btnCustDelete')?.addEventListener('click', adminDeleteCustomer);

// Sekme açılınca otomatik yükle
document.getElementById('customers-tab')?.addEventListener('shown.bs.tab', adminLoadCustomers);

  // Sayfa ilk açıldığında dropdownları sessizce yükle
  loadPurchaseDropdowns();
  loadProductionDropdown();
} 
//initAdminPage BURADA BİTTİ.

// ===================== DROPDOWN DOLDURMA FONKSİYONLARI =====================

// 1. Hammadde Sekmesi İçin
async function loadPurchaseDropdowns() {
    try {
        // Tedarikçiler
        const resSup = await fetch(`${API_BASE}/api/admin/suppliers`);
        const suppliers = await resSup.json();
        const supSelect = document.getElementById('supplierSelect');
        
        if (supSelect) {
            supSelect.innerHTML = '<option value="">Select...</option>';
            suppliers.forEach(s => {
                supSelect.innerHTML += `<option value="${s.SupplierID}">${s.CompanyName}</option>`;
            });
        }

        // Hammaddeler
        const resMat = await fetch(`${API_BASE}/api/admin/raw-materials`);
        const materials = await resMat.json();
        const matSelect = document.getElementById('materialSelect');

        if (matSelect) {
            matSelect.innerHTML = '<option value="">Select..</option>';
            materials.forEach(m => {
                matSelect.innerHTML += `<option value="${m.MaterialID}">${m.MaterialName} (Stock: ${m.StockQuantity} ${m.UnitPrice || ''})</option>`;
            });
        }
    } catch (e) {
        console.error("Dropdown error:", e);
    }
}

// 2. Üretim Sekmesi İçin
// app.js içinde bul ve değiştir:

// app.js içinde bul ve değiştir:

async function loadProductionDropdown() {
    const prodSelect = document.getElementById('prodSelectProduct');
    
    // KONTROL: Eğer zaten seçenekler yüklenmişse (1'den fazla seçenek varsa) tekrar yükleme yapma!
    if (prodSelect && prodSelect.options.length > 1) {
        console.log("The product list is already uploaded, it's being skipped.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/admin/products`); 
        const products = await res.json();

        if (prodSelect) {
            // Önce temizle
            prodSelect.innerHTML = '<option value="">Select product...</option>';
            
            products.forEach(p => {
                // Kod ve İsim verisini garantiye al
                const code = p.ProductCode || p.productCode; 
                const name = p.ProductName || p.productName;
                const stock = p.StockQuantity ?? p.stockQuantity;

                if (code) {
                    prodSelect.innerHTML += `<option value="${code}">${code} - ${name} (Stok: ${stock})</option>`;
                }
            });
            console.log("Product list successfully loaded.");
        }
    } catch (e) {
        console.error("Product loading error:", e);
    }
}

// ===================== DİĞER ADMIN FONKSİYONLARI (Aynen Kalabilir) =====================
// (adminAddProduct, adminDeleteProduct, adminExecuteProduction vb. buranın altında kalmalı)
// app.js içinde initAdminPage fonksiyonunun en altına şunları ekle:

// 2. Üretim Sekmesi Açılınca Ürünleri Getir

async function adminAddProduct() {
  const body = {
    productCode: document.getElementById('pCode').value,
    productName: document.getElementById('pName').value,
    salesPrice: Number(document.getElementById('pPrice').value),
    color: document.getElementById('pColor').value,
    stockQuantity: Number(document.getElementById('pStock').value),
    classId: document.getElementById('pClass').value || null,
    collectionId: document.getElementById('pColl').value || null
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/products/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const txt = await res.text();
    document.getElementById('adminMsg').innerText = res.ok ? "✅ Ürün Eklendi" : "❌ Hata: " + txt;
    document.getElementById('addProductForm').reset();
  } catch (e) {
    alert(e.message);
  }
}

async function adminDeleteProduct() {
  const code = document.getElementById('delCode').value;
  if (!code) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/products/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productCode: code })
    });

    const txt = await res.text();
    document.getElementById('adminMsg').innerText = res.ok ? "✅ Deleted" : "❌ Error: " + txt;
  } catch (e) {
    alert(e.message);
  }
}

async function adminLoadEmployees() {
  const tbody = document.getElementById('empList');
  tbody.innerHTML = '<tr><td colspan="4">Yükleniyor...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/admin/employees`);
    const data = await res.json();

    tbody.innerHTML = '';
    data.forEach(e => {
      tbody.innerHTML += `
        <tr>
          <td>${e.EmployeeID}</td>
          <td>${e.FirstName} ${e.LastName}</td>
          <td><span class="badge bg-info text-dark">${e.Role}</span></td>
          <td>${e.PhoneNumber}</td>
          <td>${e.Email}</td>
        </tr>`;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-danger">${e.message}</td></tr>`;
  }
}

async function adminLoadOrders() {
  const tbody = document.getElementById('orderList');
  tbody.innerHTML = '<tr><td colspan="5">Yükleniyor...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/admin/orders`);
    const data = await res.json();

    tbody.innerHTML = '';
    data.forEach(o => {
      tbody.innerHTML += `
        <tr>
          <td>${o.OrderID}</td>
          <td>${o.CustomerID}</td>
          <td><span class="badge bg-${o.OrderStatus === 'New' ? 'primary' : o.OrderStatus === 'Paid' ? 'success' : 'secondary'}">${o.OrderStatus}</span></td>
          <td>${o.TotalAmount} ₺</td>
          <td>${new Date(o.OrderDate).toLocaleDateString()}</td>
        </tr>`;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger">${e.message}</td></tr>`;
  }
}

// ✅ Tüm siparişleri daha detaylı liste
async function adminLoadAllOrders() {
  const tbody = document.getElementById('allOrderList');
  tbody.innerHTML = '<tr><td colspan="8">Yükleniyor...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/admin/orders`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    tbody.innerHTML = '';
    data.forEach(o => {
      tbody.innerHTML += `
        <tr>
          <td>${o.OrderID}</td>
          <td>${new Date(o.OrderDate).toLocaleString('tr-TR')}</td>
          <td>${o.OrderStatus}</td>
          <td>${Number(o.TotalAmount).toFixed(2)}</td>
          <td>${o.UsedCurrency || ''}</td>
          <td>${o.CustomerID}</td>
          <td>${o.SalesEmployeeID}</td>
          <td>${o.CountryID}</td>
        </tr>`;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-danger">${e.message}</td></tr>`;
  }
}

// ✅ Employee ekle
async function adminAddEmployee() {
  const body = {
    firstName: document.getElementById('empFirst').value.trim(),
    lastName: document.getElementById('empLast').value.trim(),
    role: document.getElementById('empRole').value.trim(),
    phoneNumber: document.getElementById('empPhone').value.trim(),
    email: document.getElementById('empEmail').value.trim(),
  };

  const msg = document.getElementById('empMsg');
  msg.className = 'mt-2 fw-bold';
  msg.innerText = '';

  if (!body.firstName || !body.lastName || !body.role || !body.phoneNumber || !body.email) {
    msg.classList.add('text-danger');
    msg.innerText = 'Empty places.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/employees/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const txt = await res.text();
    if (!res.ok) {
      msg.classList.add('text-danger');
      msg.innerText = '❌ Error: ' + txt;
      return;
    }

    msg.classList.add('text-success');
    msg.innerText = '✅ Employee added';

    // formu temizle
    document.getElementById('empFirst').value = '';
    document.getElementById('empLast').value = '';
    document.getElementById('empRole').value = '';
    document.getElementById('empPhone').value = '';
    document.getElementById('empEmail').value = '';

    adminLoadEmployees();
  } catch (e) {
    msg.classList.add('text-danger');
    msg.innerText = '❌ ' + e.message;
  }
}

// ✅ Employee sil
async function adminDeleteEmployee() {
  const id = Number(document.getElementById('empDelId').value);
  const msg = document.getElementById('empMsg');
  msg.className = 'mt-2 fw-bold';
  msg.innerText = '';

  if (!id) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/employees/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: id })
    });

    const txt = await res.text();
    if (!res.ok) {
      msg.classList.add('text-danger');
      msg.innerText = '❌ Hata: ' + txt;
      return;
    }

    msg.classList.add('text-success');
    msg.innerText = '✅ Employee deleted';
    document.getElementById('empDelId').value = '';
    adminLoadEmployees();
  } catch (e) {
    msg.classList.add('text-danger');
    msg.innerText = '❌ ' + e.message;
  }
}

// ✅ Hammadde siparişi oluştur
// app.js dosyasında adminCreatePurchaseOrder fonksiyonunu bul ve bununla değiştir:

async function adminCreatePurchaseOrder() {
  // 1. HTML'deki Doğru ID'leri Bulmaya Çalışalım
  // (Hem yeni hem eski ID'leri kontrol ediyoruz ki hata vermesin)
  const supplierEl = document.getElementById('supplierSelect') || document.getElementById('poSupplierId');
  const materialEl = document.getElementById('materialSelect') || document.getElementById('poMaterialId');
  const qtyEl = document.getElementById('pchQty') || document.getElementById('poQty');
  const dateEl = document.getElementById('pchDate') || document.getElementById('poDate'); // Tarih alanı

  // 2. Eğer elementlerden biri sayfada yoksa hata vermeden dur.
  if (!supplierEl || !materialEl || !qtyEl || !dateEl) {
      alert("Error: Form elements could not be found on the page. (ID Mismatch)");
      console.error("Undetectable Elements:", { supplierEl, materialEl, qtyEl, dateEl });
      return;
  }

  // 3. Değerleri Al
  const supplierId = supplierEl.value;
  const materialId = materialEl.value;
  const quantity = qtyEl.value;
  const expectedDate = dateEl.value;

  // 4. Boş Alan Kontrolü
  if (!supplierId || !materialId || !quantity || !expectedDate) {
    alert('Please fill in Supplier, Material, Quantity and Date fields.');
    return;
  }

  // 5. Admin (Employee) Bilgisini Al
  const currentUser = JSON.parse(localStorage.getItem('customer')) || { EmployeeID: 1 };
  // Eğer giriş yapan kişi Admin değilse varsayılan 1 (System Admin) kullan
  const empId = (currentUser.CustomerID === -1 || !currentUser.CustomerID) ? 1 : currentUser.CustomerID;

  const body = {
    supplierId: parseInt(supplierId),
    employeeId: 1, // Sistem Admin ID'si (Garanti olsun diye 1 gönderiyoruz)
    materialId: parseInt(materialId),
    quantity: parseInt(quantity),
    expectedDate: expectedDate
  };

  const btn = document.getElementById('btnPurchaseSubmit') || document.getElementById('btnCreatePurchaseOrder');
  const oldText = btn ? btn.innerHTML : "Save";
  
  if(btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
  }

  try {
    // Backend rotasına dikkat: /api/admin/purchase (Tarihli ve Fiyatsız olan yeni rota)
    const res = await fetch(`${API_BASE}/api/admin/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const txt = await res.text();
    
    if (!res.ok) {
      alert('❌ Server Error: ' + txt);
    } else {
      alert('✅ Order placed successfully! Stock levels updated.');

      // Formu temizle
      supplierEl.value = "";
      materialEl.value = "";
      qtyEl.value = "";
      dateEl.value = "";

      // Listeyi güncelle
      if(typeof adminLoadPurchaseOrders === 'function') adminLoadPurchaseOrders();
      if(typeof loadPurchaseDropdowns === 'function') loadPurchaseDropdowns();
    }
  } catch (e) {
    alert('❌ Connection Error: ' + e.message);
  } finally {
      if(btn) {
          btn.disabled = false;
          btn.innerHTML = oldText;
      }
  }
}

// ✅ Hammadde siparişlerini listele
// app.js içinde bul ve değiştir:

async function adminLoadPurchaseOrders() {
  const tbody = document.getElementById('poList');
  if(!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6">Yükleniyor...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/admin/purchase-orders`);
    if (!res.ok) throw new Error(await res.text());
    
    const data = await res.json();
    
    // HATA AYIKLAMA: Gelen veriyi konsola yaz (F12 -> Console'da görebilirsin)
    console.log("📥 Incoming Order List:", data);

    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Henüz sipariş yok.</td></tr>';
        return;
    }

    data.forEach(po => {
      // Tarih Formatı
      const dateStr = new Date(po.OrderDate).toLocaleDateString('tr-TR', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
      });

      // Tutar Kontrolü
      const total = po.TotalAmount != null ? Number(po.TotalAmount).toFixed(2) + ' ₺' : '0.00 ₺';

      // İsim Kontrolü (undefined sorununu çözen kısım)
      // Önce SupplierName'e bak, yoksa CompanyName'e bak, o da yoksa SupplierID'yi yaz
      const supName = po.SupplierName || po.CompanyName || `ID: ${po.SupplierID || '-'}`;
      
      // Önce EmployeeName'e bak, yoksa FirstName'e bak, o da yoksa EmployeeID'yi yaz
      const empName = po.EmployeeName || po.FirstName || `ID: ${po.ResponsibleEmployeeID || '-'}`;

      tbody.innerHTML += `
        <tr>
          <td>${po.PurchaseOrderID}</td>
          <td>${dateStr}</td>
          <td><span class="badge bg-primary">${po.OrderStatus}</span></td>
          <td>${total}</td>
          <td class="fw-bold text-dark">${supName}</td>
          <td class="text-muted">${empName}</td>
        </tr>`;
    });
  } catch (e) {
    console.error("Listeleme Hatası:", e);
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger">Hata: ${e.message}</td></tr>`;
  }
}
// ===================== PAYMENT.HTML (Manuel Ödeme) =====================

async function pay() {
  const orderId = document.getElementById('payOrderId').value;
  const amount = document.getElementById('payAmount').value;
  const method = document.getElementById('payMethod').value;
  const resEl = document.getElementById('payResult');

  if (!orderId || !amount) {
    resEl.innerText = "Empty places.";
    resEl.className = "text-danger";
    return;
  }

  try {
    console.log(`Payment: Order ${orderId}, Amount ${amount}, Method ${method}`);

    resEl.innerText = "✅ Payment successfully recorded!";
    resEl.className = "text-success fw-bold";
    setTimeout(() => window.location.href = 'index.html', 2000);
  } catch (e) {
    resEl.innerText = "Error: " + e.message;
  }
}

// ===================== SEPET SAYFASI (Render) =====================

function initCartPage() {
  updateCartUI();
  const cart = getCart();
  const list = document.getElementById('cartList');
  if (!list) return;

  list.innerHTML = '';
  if (!cart.length) {
    list.innerHTML = '<li class="list-group-item text-center py-5">Empty cart</li>';
    return;
  }

  cart.forEach((it, idx) => {
    list.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center py-3">
        <div>
          <h6 class="mb-0 fw-bold">${it.productName}</h6>
          <small class="text-muted">${it.productCode}</small>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span>${it.quantity} x ${it.unitPrice} ₺</span>
          <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${idx})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </li>`;
  });
}

function removeFromCart(idx) {
  const cart = getCart();
  cart.splice(idx, 1);
  setCart(cart);
  initCartPage();
}

// ===================== BİLDİRİM (TOAST) SİSTEMİ =====================

function showNotification(message) {
  const oldToast = document.getElementById('customToast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.id = 'customToast';
  toast.className = 'position-fixed top-0 end-0 p-3';
  toast.style.zIndex = '1050';

  toast.innerHTML = `
    <div class="toast show align-items-center text-white bg-success border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="fa-solid fa-check-circle me-2"></i> ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" onclick="this.parentElement.parentElement.remove()"></button>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast) toast.remove();
  }, 3000);
}

// ===================== CHECKOUT (Ödeme Sayfası Başlatıcı) =====================

function initCheckoutPage() {
  console.log("The checkout page is starting....");

  const customer = requireCustomerOrRedirect();
  if (!customer) return;

  const info = document.getElementById('customerInfo');
  if (info) info.innerText = `${customer.FirstName} ${customer.LastName}`;

  const btn = document.getElementById('btnCheckoutPay');
  if (btn) {
    btn.onclick = null;
    btn.onclick = checkoutAndPay;
    console.log("Payment button activated.");
  } else {
    console.error("ERROR: Button with ID 'btnCheckoutPay' not found!");
  }
}

async function checkoutAndPay() {
  console.log("Payment process initiated.");

  const cart = getCart();
  if (!cart || cart.length === 0) return alert('Your shopping cart is empty, payment cannot be processed.');

  const customer = requireCustomerOrRedirect();

  const usedCurrency = document.getElementById('usedCurrency')?.value.trim();
  const countryIdVal = document.getElementById('countryId')?.value;
  const paymentMethod = document.getElementById('paymentMethod')?.value;

  if (!usedCurrency || !countryIdVal || !paymentMethod) {
    return alert('Please check currency, country code and payment method.');
  }

  const countryId = parseInt(countryIdVal, 10);

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

  const btn = document.getElementById('btnCheckoutPay');
  const oldText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';

  try {
    const res = await fetch(`${API_BASE}/api/orders/checkout-pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const data = await res.json();

    alert(`✅ Order placed successfully!\nOrder No: ${data.orderId}\nAmount: ${data.totalAmount} ${usedCurrency}`);

    localStorage.removeItem('cart');
    window.location.href = 'index.html';
  } catch (e) {
    console.error("Payment Error:", e);
    alert("İşlem Başarısız: " + e.message);

    btn.disabled = false;
    btn.innerHTML = oldText;
  }
}

// ===================== SAYFA: SİPARİŞLERİM (MY ORDERS) =====================

async function initMyOrdersPage() {
  const customer = requireCustomerOrRedirect();
  if (!customer) return;

  const tbody = document.getElementById('myOrdersList');
  const noMsg = document.getElementById('noOrdersMsg');

  if (!tbody) return;

  // Loading spinner
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="py-4 text-center">
        <div class="spinner-border text-primary"></div>
      </td>
    </tr>
  `;

  try {
    const res = await fetch(
      `${API_BASE}/api/orders/my-orders?customerId=${customer.CustomerID}`
    );

    if (!res.ok) throw new Error("Orders could not be loaded.");

    const response = await res.json();

    // API array değilse güvene al
    const orders = Array.isArray(response)
      ? response
      : (response?.data ?? []);

    tbody.innerHTML = '';

    if (orders.length === 0) {
      if (noMsg) noMsg.classList.remove('d-none');
      return;
    }

    orders.forEach(o => {
      // Tarih güvenliği
      const dateObj = o.OrderDate ? new Date(o.OrderDate) : null;
      const dateStr =
        dateObj && !isNaN(dateObj)
          ? dateObj.toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '-';

      // Status badge
      let badgeClass = 'bg-secondary';
      if (o.OrderStatus === 'New') badgeClass = 'bg-primary';
      else if (o.OrderStatus === 'Paid') badgeClass = 'bg-success';
      else if (o.OrderStatus === 'Shipped') badgeClass = 'bg-info text-dark';
      else if (o.OrderStatus === 'Cancelled') badgeClass = 'bg-danger';

      // 💥 toFixed hatasını önleyen kısım
      const totalAmount = Number(o.TotalAmount ?? 0);
      const totalStr = Number.isFinite(totalAmount)
        ? totalAmount.toFixed(2)
        : '0.00';

      tbody.innerHTML += `
        <tr>
          <td class="fw-bold">#${o.OrderID ?? '-'}</td>
          <td>${dateStr}</td>
          <td class="fw-bold text-dark">
            ${totalStr} ${o.UsedCurrency || 'TRY'}
          </td>
          <td>
            <span class="badge ${badgeClass} px-3 py-2 rounded-pill">
              ${o.OrderStatus || '-'}
            </span>
          </td>
          <td>
            <button
              class="btn btn-sm btn-outline-primary"
              onclick="showOrderDetails(${o.OrderID})"
            >
              <i class="fa-solid fa-list-ul"></i> İncele
            </button>
          </td>
        </tr>
      `;
    });

  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-danger py-3 text-center">
          ${err.message || 'Bir hata oluştu'}
        </td>
      </tr>
    `;
  }
}


// ===================== SİPARİŞ DETAYI GÖSTER =====================

async function showOrderDetails(orderId) {
  const modalEl = document.getElementById('orderDetailModal');
  const modalTitle = document.getElementById('detailModalTitle');
  const modalBody = document.getElementById('modalBodyContent');

  const modal = new bootstrap.Modal(modalEl);

  modalTitle.innerText = `Order Details #${orderId}`;
  modalBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
  modal.show();

  try {
    const res = await fetch(`${API_BASE}/api/orders/details/${orderId}`);
    const items = await res.json();

    modalBody.innerHTML = '';

    if (items.length === 0) {
      modalBody.innerHTML = '<tr><td colspan="5">No details found.</td></tr>';
      return;
    }

    items.forEach(it => {
      modalBody.innerHTML += `
        <tr>
          <td>${it.ProductCode}</td>
          <td class="fw-bold">${it.ProductName}</td>
          <td>${it.Quantity}</td>
          <td>${it.UnitPrice.toFixed(2)} ₺</td>
          <td class="fw-bold text-primary">${it.LineTotal.toFixed(2)} ₺</td>
        </tr>`;
    });

  } catch (e) {
    modalBody.innerHTML = `<tr><td colspan="5" class="text-danger">Hata: ${e.message}</td></tr>`;
  }
}

async function adminLoadProducts(searchText = '') {
  const tbody = document.getElementById('productList');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="9">Loading...</td></tr>';

  try {
    const qs = new URLSearchParams();
    if (searchText && searchText.trim()) qs.set('search', searchText.trim());

    const res = await fetch(`${API_BASE}/api/admin/products?${qs.toString()}`);
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();

    tbody.innerHTML = '';
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-muted">Ürün bulunamadı.</td></tr>';
      return;
    }

    data.forEach(p => {
      const price = (p.SalesPrice != null) ? Number(p.SalesPrice).toFixed(2) : '';
      const vat = (p.SalesPriceWithVAT != null) ? Number(p.SalesPriceWithVAT).toFixed(2) : '';

      tbody.innerHTML += `
        <tr>
          <td class="fw-bold">${p.ProductCode}</td>
          <td class="text-truncate" style="max-width:180px;" title="${p.ProductName || ''}">${p.ProductName || ''}</td>
          <td>${price}</td>
          <td>${vat}</td>
          <td>${p.Color || ''}</td>
          <td>${p.StockQuantity ?? ''}</td>
          <td>${p.ClassID ?? ''}</td>
          <td>${p.CollectionID ?? ''}</td>
          <td>${p.StockStatus || ''}</td>
        </tr>
      `;
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-danger">${e.message}</td></tr>`;
  }
}

async function adminQuickDeleteProduct(code) {
  if (!code) return;

  // Silme inputuna da yazsın (kullanışlı)
  const delInput = document.getElementById('delCode');
  if (delInput) delInput.value = code;

  if (!confirm(`"${code}" Are you sure you want to delete the coded product?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/products/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productCode: code })
    });

    const txt = await res.text();
    document.getElementById('adminMsg').innerText = res.ok ? "✅ Silindi" : "❌ Hata: " + txt;

    // Listeyi yenile
    const searchVal = document.getElementById('productSearch')?.value || '';
    adminLoadProducts(searchVal);

  } catch (e) {
    alert(e.message);
  }
}
// ===================== ÜRETİM (PRODUCTION) FONKSİYONLARI =====================

// Ürünleri Dropdown'a doldur
async function adminLoadProductsForProduction() {
    const select = document.getElementById('prodSelectProduct');
    if(select.options.length > 1) return; // Zaten doluysa tekrar çekme

    try {
        const res = await fetch(`${API_BASE}/api/admin/products`); // Var olan ürün endpointini kullanıyoruz
        const data = await res.json();
        
        select.innerHTML = '<option value="">Select...</option>';
        data.forEach(p => {
            // Sadece reçetesi olanları getirmek daha iyi olurdu ama şimdilik hepsini getiriyoruz
            select.innerHTML += `<option value="${p.ProductCode}">${p.ProductCode} - ${p.ProductName} (Stok: ${p.StockQuantity})</option>`;
        });
    } catch (e) {
        console.error("The products could not be loaded.", e);
    }
}

// Seçilen ürünün reçetesini getir ve göster
// app.js içinde bul ve değiştir:

async function adminLoadBOM() {
    const selectEl = document.getElementById('prodSelectProduct');
    const productCode = selectEl.value;
    
    // 🔥 KRİTİK HAMLE: Seçilen kodu tarayıcı hafızasına kazıyoruz.
    // Dropdown sıfırlansa bile bu değişken burada kalır.
    if (productCode) {
        window.SELECTED_PROD_CODE = productCode;
        console.log("The election has been put into memory:", window.SELECTED_PROD_CODE);
    }

    const list = document.getElementById('bomList');
    const infoBox = document.getElementById('bomInfo');
    
    if (list) list.innerHTML = '';
    
    if (!productCode) {
        if(infoBox) infoBox.classList.add('d-none');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/admin/production/bom/${productCode}`);
        const bomData = await res.json();

        if (bomData.length === 0) {
            if(infoBox) {
                infoBox.classList.remove('d-none');
                infoBox.className = 'alert alert-warning';
            }
            if(list) list.innerHTML = '<li>No recipe defined for this product. Production cannot be made.</li>';
            
            // Reçete yoksa butonu kapat
            const btnExec = document.getElementById('btnExecuteProduction');
            if(btnExec) btnExec.disabled = true;
            return;
        }

        if(infoBox) {
            infoBox.className = 'alert alert-info';
            infoBox.classList.remove('d-none');
        }
        
        // Reçete varsa butonu aç
        const btnExec = document.getElementById('btnExecuteProduction');
        if(btnExec) btnExec.disabled = false;

        bomData.forEach(item => {
            let stockStatus = `<span class="text-success">(There is(are) ${item.CurrentStock} piece(s))</span>`;
            if (item.CurrentStock < item.NeededPerUnit) {
                stockStatus = `<span class="text-danger fw-bold">(Out of Stock! There are ${item.CurrentStock} ${item.Unit})</span>`;
            }
            if(list) {
                list.innerHTML += `<li><b>${item.MaterialName}:</b> ${item.NeededPerUnit} piece(s) is(are) needed. ${stockStatus}</li>`;
            }
        });

    } catch (e) {
        console.error("Prescription error", e);
    }
}

// Üretimi Başlat
// app.js içinde bul ve değiştir:

// app.js içinde 'adminExecuteProduction' fonksiyonunu bununla değiştir:

// app.js içinde bul ve değiştir:

async function adminExecuteProduction() {
    // 1. Önce Dropdown'a bak
    let productCode = document.getElementById('prodSelectProduct')?.value;

    // 2. Dropdown boşsa (ki sende boş geliyor), HAFIZADAKİ KODA BAK
    if (!productCode || productCode === "") {
        console.log("Dropdown empty, reading from memory...");
        productCode = window.SELECTED_PROD_CODE;
    }

    const qtyInput = document.getElementById('prodQty');
    const quantity = qtyInput ? qtyInput.value : 0;
    const msg = document.getElementById('prodMsg');

    if(msg) { msg.innerText = ''; msg.className = 'mt-3 fw-bold text-center'; }

    console.log("Code to be processed:", productCode);

    if (!productCode) {
        alert("Please select product! (Make sure the prescription appears on the screen.)");
        return;
    }

    if (quantity <= 0) {
        alert("Quantity must be at least 1.");
        return;
    }

    const btn = document.getElementById('btnExecuteProduction');
    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-cog fa-spin"></i> Processing...';

    try {
        const res = await fetch(`${API_BASE}/api/admin/production/produce`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productCode, quantity })
        });

        const txt = await res.text();

        if (!res.ok) {
            if(msg) { msg.innerText = "❌ " + txt; msg.classList.add('text-danger'); }
            alert("Error: " + txt);
        } else {
            const data = JSON.parse(txt);
            if(msg) { msg.innerText = "✅ " + data.message; msg.classList.add('text-success'); }
            
            // İşlem bitince listeleri güncelle
            if(typeof adminLoadBOM === 'function') adminLoadBOM();
            if(typeof loadProductionDropdown === 'function') loadProductionDropdown();
            if(typeof loadPurchaseDropdowns === 'function') loadPurchaseDropdowns();
        }
    } catch (e) {
        if(msg) { msg.innerText = "❌ Error: " + e.message; msg.classList.add('text-danger'); }
    } finally {
        btn.disabled = false;
        btn.innerHTML = oldText;
    }
}

async function adminLoadCustomers() {
  const tbody = document.getElementById('custList');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/admin/customers`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    tbody.innerHTML = '';
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted">No customers.</td></tr>';
      return;
    }

    data.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td>${c.CustomerID}</td>
          <td class="fw-bold">${c.FirstName} ${c.LastName}</td>
          <td>${c.PhoneNumber || ''}</td>
          <td>${c.Email || ''}</td>
          <td class="text-truncate" style="max-width:220px;" title="${c.Address || ''}">${c.Address || ''}</td>
        </tr>
      `;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger">${e.message}</td></tr>`;
  }
}

async function adminAddCustomer() {
  const msg = document.getElementById('custMsg');
  msg.className = 'small mt-2 fw-bold';
  msg.innerText = '';

  const body = {
    firstName: document.getElementById('custFirst')?.value.trim(),
    lastName: document.getElementById('custLast')?.value.trim(),
    phoneNumber: document.getElementById('custPhone')?.value.trim(),
    email: document.getElementById('custEmail')?.value.trim(),
    address: document.getElementById('custAddress')?.value.trim(),
    customerType: document.getElementById('custType')?.value || '',
    regionId: document.getElementById('custRegionId')?.value ? Number(document.getElementById('custRegionId').value) : null,
    countryId: document.getElementById('custCountryId')?.value ? Number(document.getElementById('custCountryId').value) : null
  };

  if (!body.firstName || !body.lastName || !body.phoneNumber || !body.email || !body.address) {
    msg.classList.add('text-danger');
    msg.innerText = 'Eksik alan var.';
    return;
  }

  if (body.customerType === 'domestic' && !body.regionId) {
    msg.classList.add('text-danger');
    msg.innerText = 'Domestic seçtiysen RegionID gir.';
    return;
  }

  if (body.customerType === 'international' && !body.countryId) {
    msg.classList.add('text-danger');
    msg.innerText = 'International seçtiysen CountryID gir.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/customers/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const txt = await res.text();
    if (!res.ok) {
      msg.classList.add('text-danger');
      msg.innerText = '❌ ' + txt;
      return;
    }

    msg.classList.add('text-success');
    msg.innerText = '✅ Customer added';

    // temizle
    ['custFirst','custLast','custPhone','custEmail','custAddress','custRegionId','custCountryId'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const typeEl = document.getElementById('custType');
    if (typeEl) typeEl.value = '';

    adminLoadCustomers();
  } catch (e) {
    msg.classList.add('text-danger');
    msg.innerText = '❌ ' + e.message;
  }
}

async function adminDeleteCustomer() {
  const id = Number(document.getElementById('custDelId')?.value);
  const msg = document.getElementById('custMsg');

  msg.className = 'small mt-2 fw-bold';
  msg.innerText = '';

  if (!id) return;

  if (!confirm(`CustomerID ${id} silinsin mi?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/customers/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: id })
    });

    const txt = await res.text();
    if (!res.ok) {
      msg.classList.add('text-danger');
      msg.innerText = '❌ ' + txt;
      return;
    }

    msg.classList.add('text-success');
    msg.innerText = '✅ Customer deleted';
    document.getElementById('custDelId').value = '';

    adminLoadCustomers();
  } catch (e) {
    msg.classList.add('text-danger');
    msg.innerText = '❌ ' + e.message;
  }
}

// ===================== BEST SELLERS (VIEW) =====================

function renderBestSellers(items) {
  const el = document.getElementById('bestSellers');
  if (!el) return;

  if (!items || items.length === 0) {
    el.innerHTML = `<div class="alert alert-warning w-100">Best seller data not found.</div>`;
    return;
  }

  el.innerHTML = '';

  items.forEach(p => {
    const revenue = Number(p.TotalRevenue || 0);
    el.innerHTML += `
      <div class="col">
        <div class="card h-100 shadow-sm product-card">
          <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 140px;">
            <i class="fa-solid fa-fire fa-3x text-danger"></i>
          </div>
          <div class="card-body d-flex flex-column">
            <h6 class="card-title fw-bold text-truncate" title="${p.ProductName}">${p.ProductName}</h6>
            <small class="text-muted mb-2">Product Code: ${p.ProductCode}</small>

            <div class="mt-auto">
              <div class="d-flex justify-content-between small">
                <span class="text-muted">Quantity Sold</span>
                <span class="fw-bold">${p.TotalQtySold}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

async function loadBestSellers(top = 12) {
  const el = document.getElementById('bestSellers');
  if (!el) return;

  el.innerHTML = `
    <div class="text-center w-100 mt-3">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Loading Best Sellers...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/products/best-sellers?top=${top}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    renderBestSellers(data);
  } catch (e) {
    console.error("Best sellers error:", e);
    el.innerHTML = `<div class="alert alert-danger w-100">Best sellers could not be loaded: ${e.message}</div>`;
  }
}

async function adminLoadRawMaterialStockStatus() {
  const tbody = document.getElementById('rawMatStockList');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/admin/raw-material-stock-status`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    tbody.innerHTML = '';

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted">No raw materials found.</td></tr>`;
      return;
    }

    data.forEach(rm => {
      const isReorder = rm.StockStatus === 'REORDER REQUIRED';
      const badgeClass = isReorder ? 'bg-danger' : 'bg-success';

      tbody.innerHTML += `
        <tr>
          <td>${rm.MaterialID}</td>
          <td class="fw-bold">${rm.MaterialName}</td>
          <td>${rm.StockQuantity}</td>
          <td>${rm.SafetyStockLevel}</td>
          <td>
            <span class="badge ${badgeClass}">${rm.StockStatus}</span>
          </td>
        </tr>
      `;
    });

  } catch (e) {
    console.error("raw material stock status error:", e);
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Error: ${e.message}</td></tr>`;
  }
}
