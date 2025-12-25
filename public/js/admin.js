// public/js/admin.js

/* =========================================================
   ADMIN (INIT + MODULES)
========================================================= */

function initAdminPage() {
  const c = requireCustomerOrRedirect();
  if (!c) return;

  // Hardcoded admin kontrolü (korundu)
  if (c.FirstName !== 'admin' || c.LastName !== 'admin') {
    alert('Unauthorized Access!');
    window.location.href = 'index.html';
    return;
  }

  const infoEl = $('adminInfo');
  if (infoEl) infoEl.innerText = `Admin: ${c.FirstName} ${c.LastName}`;

  /* ---------- Products ---------- */
  $('btnAddProduct')?.addEventListener('click', adminAddProduct);
  $('btnDeleteProduct')?.addEventListener('click', adminDeleteProduct);
  $('btnProducts')?.addEventListener('click', () => adminLoadProducts());

  const searchInput = $('productSearch');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') adminLoadProducts(e.target.value);
    });
  }

  /* ---------- Orders ---------- */
  $('btnAllOrders')?.addEventListener('click', adminLoadAllOrders);

  /* ---------- Employees ---------- */
  $('btnEmployees')?.addEventListener('click', adminLoadEmployees);
  $('btnEmpAdd')?.addEventListener('click', adminAddEmployee);
  $('btnEmpDelete')?.addEventListener('click', adminDeleteEmployee);

  /* ---------- Purchase / Raw Material ---------- */
  $('btnPurchaseList')?.addEventListener('click', adminLoadPurchaseOrders);
  $('purchase-tab')?.addEventListener('shown.bs.tab', () => {
    loadPurchaseDropdowns();
    adminLoadRawMaterialStockStatus();
  });

  const btnPurchase = $('btnPurchaseSubmit') || $('btnCreatePurchaseOrder');
  btnPurchase?.addEventListener('click', e => {
    e.preventDefault();
    adminCreatePurchaseOrder();
  });

  /* ---------- Production ---------- */
  $('btnExecuteProduction')?.addEventListener('click', adminExecuteProduction);
  $('prodSelectProduct')?.addEventListener('change', adminLoadBOM);
  $('production-tab')?.addEventListener('shown.bs.tab', loadProductionDropdown);

  /* ---------- Customers ---------- */
  $('btnCustomers')?.addEventListener('click', adminLoadCustomers);
  $('btnCustAdd')?.addEventListener('click', adminAddCustomer);
  $('btnCustDelete')?.addEventListener('click', adminDeleteCustomer);
  $('customers-tab')?.addEventListener('shown.bs.tab', adminLoadCustomers);

  /* ---------- Initial ---------- */
  loadPurchaseDropdowns();
  loadProductionDropdown();
}

/* =========================================================
   DROPDOWNS
========================================================= */

async function loadPurchaseDropdowns() {
  try {
    const suppliers = await apiJson('/api/admin/suppliers');
    const supSelect = $('supplierSelect');
    if (supSelect) {
      supSelect.innerHTML = '<option value="">Select...</option>';
      suppliers.forEach(s =>
        supSelect.innerHTML += `<option value="${s.SupplierID}">${s.CompanyName}</option>`
      );
    }

    const materials = await apiJson('/api/admin/raw-materials');
    const matSelect = $('materialSelect');
    if (matSelect) {
      matSelect.innerHTML = '<option value="">Select...</option>';
      materials.forEach(m =>
        matSelect.innerHTML += `
          <option value="${m.MaterialID}">
            ${m.MaterialName} (Stock: ${m.StockQuantity})
          </option>`
      );
    }
  } catch (e) {
    console.error('Dropdown error:', e);
  }
}

async function loadProductionDropdown() {
  const prodSelect = $('prodSelectProduct');
  if (prodSelect && prodSelect.options.length > 1) return;

  try {
    const products = await apiJson('/api/admin/products');
    if (prodSelect) {
      prodSelect.innerHTML = '<option value="">Select product...</option>';
      products.forEach(p => {
        if (p.ProductCode) {
          prodSelect.innerHTML += `
            <option value="${p.ProductCode}">
              ${p.ProductCode} - ${p.ProductName} (Stock: ${p.StockQuantity})
            </option>`;
        }
      });
    }
  } catch (e) {
    console.error('Product loading error:', e);
  }
}

/* =========================================================
   PRODUCTS
========================================================= */

async function adminAddProduct() {
  const body = {
    productCode: $('pCode')?.value,
    productName: $('pName')?.value,
    salesPrice: Number($('pPrice')?.value),
    color: $('pColor')?.value,
    stockQuantity: Number($('pStock')?.value),
    classId: $('pClass')?.value || null,
    collectionId: $('pColl')?.value || null
  };

  try {
    await apiText('/api/admin/products/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    $('adminMsg').innerText = '✅ Added';
    $('addProductForm')?.reset();
  } catch (e) {
    $('adminMsg').innerText = '❌ ' + e.message;
  }
}

async function adminDeleteProduct() {
  const code = $('delCode')?.value;
  if (!code) return;

  try {
    await apiText('/api/admin/products/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productCode: code })
    });
    $('adminMsg').innerText = '✅ Deleted';
  } catch (e) {
    $('adminMsg').innerText = '❌ ' + e.message;
  }
}

async function adminLoadProducts(searchText = '') {
  const tbody = $('productList');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="9">Loading...</td></tr>';

  try {
    const qs = new URLSearchParams();
    if (searchText) qs.set('search', searchText);

    const data = await apiJson(`/api/admin/products?${qs.toString()}`);
    tbody.innerHTML = '';

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="9">Product not found.</td></tr>';
      return;
    }

    data.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>${p.ProductCode}</td>
          <td>${p.ProductName}</td>
          <td>${p.SalesPrice ?? ''}</td>
          <td>${p.SalesPriceWithVAT ?? ''}</td>
          <td>${p.Color ?? ''}</td>
          <td>${p.StockQuantity ?? ''}</td>
          <td>${p.ClassID ?? ''}</td>
          <td>${p.CollectionID ?? ''}</td>
          <td>${p.StockStatus ?? ''}</td>
        </tr>`;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="9">${e.message}</td></tr>`;
  }
}

/* ----------------- Admin: Employees ----------------- */
async function adminLoadEmployees() {
  const tbody = $('empList');
  if (!tbody) return;

  try {
    const data = await apiJson(`${API_BASE}/api/admin/employees`);

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

async function adminAddEmployee() {
  const body = {
    firstName: $('empFirst')?.value.trim(),
    lastName: $('empLast')?.value.trim(),
    role: $('empRole')?.value.trim(),
    phoneNumber: $('empPhone')?.value.trim(),
    email: $('empEmail')?.value.trim(),
  };

  const msg = $('empMsg');
  if (!msg) return;

  msg.className = 'mt-2 fw-bold';
  msg.innerText = '';

  if (!body.firstName || !body.lastName || !body.role || !body.phoneNumber || !body.email) {
    msg.classList.add('text-danger');
    msg.innerText = 'Empty places.';
    return;
  }

  try {
    await apiText(`${API_BASE}/api/admin/employees/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    msg.classList.add('text-success');
    msg.innerText = '✅ Employee added';

    ['empFirst','empLast','empRole','empPhone','empEmail'].forEach(id => { if ($(id)) $(id).value = ''; });
    adminLoadEmployees();
  } catch (e) {
    msg.classList.add('text-danger');
    msg.innerText = '❌ ' + e.message;
  }
}

async function adminDeleteEmployee() {
  const id = Number($('empDelId')?.value);
  const msg = $('empMsg');
  if (!msg) return;

  msg.className = 'mt-2 fw-bold';
  msg.innerText = '';

  if (!id) return;

  try {
    await apiText(`${API_BASE}/api/admin/employees/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: id })
    });

    msg.classList.add('text-success');
    msg.innerText = '✅ Employee deleted';
    $('empDelId').value = '';
    adminLoadEmployees();
  } catch (e) {
    msg.classList.add('text-danger');
    msg.innerText = '❌ ' + e.message;
  }
}

/* ----------------- Admin: Orders ----------------- */

async function adminLoadAllOrders() {
  const tbody = $('allOrderList');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8">Yükleniyor...</td></tr>';

  try {
    const data = await apiJson(`${API_BASE}/api/admin/orders`);

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

/* ----------------- Admin: Purchase Orders -----------------
----------------------------------------------------------- */
async function adminCreatePurchaseOrder() {
  const supplierEl = $('supplierSelect') || $('poSupplierId');
  const materialEl = $('materialSelect') || $('poMaterialId');
  const qtyEl = $('pchQty') || $('poQty');
  const dateEl = $('pchDate') || $('poDate');

  if (!supplierEl || !materialEl || !qtyEl || !dateEl) {
    alert('Error: Form elements could not be found on the page. (ID Mismatch)');
    console.error('Undetectable Elements:', { supplierEl, materialEl, qtyEl, dateEl });
    return;
  }

  const supplierId = supplierEl.value;
  const materialId = materialEl.value;
  const quantity = qtyEl.value;
  const expectedDate = dateEl.value;

  if (!supplierId || !materialId || !quantity || !expectedDate) {
    alert('There are missing fields.');
    return;
  }

  const body = {
    supplierId: parseInt(supplierId, 10),
    employeeId: 1,
    materialId: parseInt(materialId, 10),
    quantity: parseInt(quantity, 10),
    expectedDate
  };

  const btn = $('btnPurchaseSubmit') || $('btnCreatePurchaseOrder');
  const oldText = btn ? btn.innerHTML : 'Save';

  if (btn) {
    btn.disabled = true;
  }

  try {
    await apiText(`${API_BASE}/api/admin/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    alert('✅ Order placed!');

    supplierEl.value = '';
    materialEl.value = '';
    qtyEl.value = '';
    dateEl.value = '';

    if (typeof adminLoadPurchaseOrders === 'function') adminLoadPurchaseOrders();
    if (typeof loadPurchaseDropdowns === 'function') loadPurchaseDropdowns();
  } catch (e) {
    alert('❌ Server/Connection Error: ' + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  }
}

async function adminLoadPurchaseOrders() {
  const tbody = $('poList');
  if (!tbody) return;

  try {
    const data = await apiJson(`${API_BASE}/api/admin/purchase-orders`);

    tbody.innerHTML = '';

    if (data.length === 0) {
      return;
    }

    data.forEach(po => {
      const dateStr = new Date(po.OrderDate).toLocaleDateString('tr-TR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });

      const total = po.TotalAmount != null ? Number(po.TotalAmount).toFixed(2) + ' ₺' : '0.00 ₺';
      const supName = po.SupplierName || po.CompanyName || `ID: ${po.SupplierID || '-'}`;
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
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger">Error: ${e.message}</td></tr>`;
  }
}

async function adminLoadRawMaterialStockStatus() {
  const tbody = $('rawMatStockList');
  if (!tbody) return;

  try {
    const data = await apiJson(`${API_BASE}/api/admin/raw-material-stock-status`);

    tbody.innerHTML = '';
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted">Raw materials not found.</td></tr>`;
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
          <td><span class="badge ${badgeClass}">${rm.StockStatus}</span></td>
        </tr>
      `;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Error: ${e.message}</td></tr>`;
  }
}

/* ----------------- Admin: Production ----------------- */
async function adminLoadBOM() {
  const selectEl = $('prodSelectProduct');
  const productCode = selectEl?.value;

  if (productCode) {
    window.SELECTED_PROD_CODE = productCode;
    console.log('The election has been put into memory:', window.SELECTED_PROD_CODE);
  }

  const list = $('bomList');
  const infoBox = $('bomInfo');

  if (list) list.innerHTML = '';

  if (!productCode) {
    if (infoBox) infoBox.classList.add('d-none');
    return;
  }

  try {
    const bomData = await apiJson(`${API_BASE}/api/admin/production/bom/${productCode}`);

    if (bomData.length === 0) {
      if (infoBox) {
        infoBox.classList.remove('d-none');
        infoBox.className = 'alert alert-warning';
      }
      if (list) list.innerHTML = '<li>No recipe defined for this product. Production cannot be made.</li>';

      const btnExec = $('btnExecuteProduction');
      if (btnExec) btnExec.disabled = true;
      return;
    }

    if (infoBox) {
      infoBox.className = 'alert alert-info';
      infoBox.classList.remove('d-none');
    }

    const btnExec = $('btnExecuteProduction');
    if (btnExec) btnExec.disabled = false;

    bomData.forEach(item => {
      let stockStatus = `<span class="text-success">(There is(are) ${item.CurrentStock} piece(s))</span>`;
      if (item.CurrentStock < item.NeededPerUnit) {
        stockStatus = `<span class="text-danger fw-bold">(Out of Stock! There are ${item.CurrentStock} ${item.Unit})</span>`;
      }
      if (list) {
        list.innerHTML += `<li><b>${item.MaterialName}:</b> ${item.NeededPerUnit} piece(s) is(are) needed. ${stockStatus}</li>`;
      }
    });
  } catch (e) {
    console.error('Prescription error', e);
  }
}

async function adminExecuteProduction() {
  let productCode = $('prodSelectProduct')?.value;

  if (!productCode) {
    productCode = window.SELECTED_PROD_CODE;
  }

  const qtyInput = $('prodQty');
  const quantity = qtyInput ? Number(qtyInput.value) : 0;
  const msg = $('prodMsg');

  if (msg) { msg.innerText = ''; msg.className = 'mt-3 fw-bold text-center'; }

  console.log('Code to be processed:', productCode);

  if (!productCode) {
    alert('Please select product! (Make sure the prescription appears on the screen.)');
    return;
  }

  if (quantity <= 0) {
    alert('Quantity must be at least 1.');
    return;
  }

  const btn = $('btnExecuteProduction');
  const oldText = btn?.innerHTML;

  if (btn) {
    btn.disabled = true;
  }

  try {
    const res = await apiFetch(`${API_BASE}/api/admin/production/produce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productCode, quantity })
    });

    const txt = await res.text();

    if (!res.ok) {
      if (msg) { msg.innerText = '❌ ' + txt; msg.classList.add('text-danger'); }
      alert('Error: ' + txt);
    } else {
      const data = safeJsonParse(txt, { message: txt });
      if (msg) { msg.innerText = '✅ ' + (data.message || 'Done'); msg.classList.add('text-success'); }

      if (typeof adminLoadBOM === 'function') adminLoadBOM();
      if (typeof loadProductionDropdown === 'function') loadProductionDropdown();
      if (typeof loadPurchaseDropdowns === 'function') loadPurchaseDropdowns();
    }
  } catch (e) {
    if (msg) { msg.innerText = '❌ Error: ' + e.message; msg.classList.add('text-danger'); }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  }
}

/* ----------------- Admin: Customers ----------------- */
async function adminLoadCustomers() {
  const tbody = $('custList');
  if (!tbody) return;

  try {
    const data = await apiJson(`${API_BASE}/api/admin/customers`);

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
  const msg = $('custMsg');
  if (!msg) return;

  msg.className = 'small mt-2 fw-bold';
  msg.innerText = '';

  const body = {
    firstName: $('custFirst')?.value.trim(),
    lastName: $('custLast')?.value.trim(),
    phoneNumber: $('custPhone')?.value.trim(),
    email: $('custEmail')?.value.trim(),
    address: $('custAddress')?.value.trim(),
    customerType: $('custType')?.value || '',
    regionId: $('custRegionId')?.value ? Number($('custRegionId').value) : null,
    countryId: $('custCountryId')?.value ? Number($('custCountryId').value) : null
  };

  if (!body.firstName || !body.lastName || !body.phoneNumber || !body.email || !body.address) {
    msg.classList.add('text-danger');
    msg.innerText = 'There are missing fields.';
    return;
  }

  if (body.customerType === 'domestic' && !body.regionId) {
    msg.classList.add('text-danger');
    msg.innerText = 'RegionID is required for Domestic customers.';
    return;
  }

  if (body.customerType === 'international' && !body.countryId) {
    msg.classList.add('text-danger');
    msg.innerText = 'CountryID is required for International customers.';
    return;
  }

  try {
    await apiText(`${API_BASE}/api/admin/customers/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    msg.classList.add('text-success');
    msg.innerText = '✅ Customer added';

    ['custFirst','custLast','custPhone','custEmail','custAddress','custRegionId','custCountryId'].forEach(id => {
      if ($(id)) $(id).value = '';
    });
    if ($('custType')) $('custType').value = '';

    adminLoadCustomers();
  } catch (e) {
    msg.classList.add('text-danger');
    msg.innerText = '❌ ' + e.message;
  }
}

async function adminDeleteCustomer() {
  const id = Number($('custDelId')?.value);
  const msg = $('custMsg');
  if (!msg) return;

  msg.className = 'small mt-2 fw-bold';
  msg.innerText = '';

  if (!id) return;
  if (!confirm(`CustomerID ${id} deleted?`)) return;

  try {
    await apiText(`${API_BASE}/api/admin/customers/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: id })
    });

    msg.classList.add('text-success');
    msg.innerText = '✅ Customer deleted';
    $('custDelId').value = '';

    adminLoadCustomers();
  } catch (e) {
    msg.classList.add('text-danger');
    msg.innerText = '❌ ' + e.message;
  }
}

window.initAdminPage = initAdminPage;