
/* =========================================================
   ADMIN (INIT + MODULES)
========================================================= */

function initAdminPage() {
  const c = requireCustomerOrRedirect();
  if (!c) return;

  // Hardcoded admin control
  if (c.FirstName !== 'admin' || c.LastName !== 'admin') {
    alert('Unauthorized Access!');
    window.location.href = 'index.html';
    return;
  }

  const infoEl = $('adminInfo');
  if (infoEl) infoEl.innerText = `Admin: ${c.FirstName} ${c.LastName}`;

  // Products
  $('btnAddProduct')?.addEventListener('click', adminAddProduct);
  $('btnDeleteProduct')?.addEventListener('click', adminDeleteProduct);
  $('btnProducts')?.addEventListener('click', () => adminLoadProducts());

  // Orders
  $('btnAllOrders')?.addEventListener('click', adminLoadAllOrders);

  // Employees
  $('btnEmployees')?.addEventListener('click', adminLoadEmployees);
  $('btnEmpAdd')?.addEventListener('click', adminAddEmployee);
  $('btnEmpDelete')?.addEventListener('click', adminDeleteEmployee);

  // Purchase
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

  // Production
  $('btnExecuteProduction')?.addEventListener('click', adminExecuteProduction);
  $('prodSelectProduct')?.addEventListener('change', adminLoadBOM);
  $('production-tab')?.addEventListener('shown.bs.tab', () => {
    loadProductionDropdown();
    adminLoadProductionOrders();
  });

  // Customers
  $('btnCustomers')?.addEventListener('click', adminLoadCustomers);
  $('btnCustAdd')?.addEventListener('click', adminAddCustomer);
  $('btnCustDelete')?.addEventListener('click', adminDeleteCustomer);
  $('customers-tab')?.addEventListener('shown.bs.tab', adminLoadCustomers);

  // Initial
  loadPurchaseDropdowns();
  loadProductionDropdown();
}

// DROPDOWNS

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

// PRODUCTS

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
          <td>
             <div class="d-flex align-items-center justify-content-center">
               ${p.SalesPrice ?? '-'} 
               <button class="btn btn-sm btn-link text-primary ms-1 p-0" onclick='adminEditProduct("${p.ProductCode}", ${p.SalesPrice || 0})'>
                 <i class="fa-solid fa-pen"></i>
               </button>
             </div>
          </td>
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

// EMPLOYEES

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
          <td>
            <div class="d-flex align-items-center justify-content-center">
              <select class="form-select form-select-sm" style="width: auto;" onchange="adminUpdateEmployeeRole(${e.EmployeeID}, this.value)">
                <option value="Admin" ${e.Role === 'Admin' ? 'selected' : ''}>Admin</option>
                <option value="Sales" ${e.Role === 'Sales' ? 'selected' : ''}>Sales</option>
                <option value="Procurement" ${e.Role === 'Procurement' ? 'selected' : ''}>Procurement</option>
                <option value="Intern" ${e.Role === 'Intern' ? 'selected' : ''}>Intern</option>
                <option value="Manager" ${e.Role === 'Manager' ? 'selected' : ''}>Manager</option>
                <option value="${e.Role}" ${['Admin', 'Sales', 'Procurement', 'Intern', 'Manager'].includes(e.Role) ? '' : 'selected'}>${e.Role}</option>
              </select>
            </div>
          </td>
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

    ['empFirst', 'empLast', 'empRole', 'empPhone', 'empEmail'].forEach(id => { if ($(id)) $(id).value = ''; });
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

async function adminUpdateEmployeeRole(employeeId, newRole) {
  try {
    await apiText(`${API_BASE}/api/admin/employees/update-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, newRole })
    });
    console.log(`Role updated for ID ${employeeId} to ${newRole}`);
  } catch (e) {
    alert('Failed to update role: ' + e.message);
    adminLoadEmployees();
  }
}

// ORDERS

async function adminLoadAllOrders() {
  const tbody = $('allOrderList');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8">Yükleniyor...</td></tr>';

  try {
    const [orders, employees] = await Promise.all([
      apiJson(`${API_BASE}/api/admin/orders`),
      apiJson(`${API_BASE}/api/admin/employees`)
    ]);

    const salesEmployees = employees.filter(e => e.Role === 'Sales');

    tbody.innerHTML = '';
    orders.forEach(o => {
      let salesOptions = `<option value="">Select...</option>`;
      salesEmployees.forEach(se => {
        const isSelected = se.EmployeeID === o.SalesEmployeeID ? 'selected' : '';
        salesOptions += `<option value="${se.EmployeeID}" ${isSelected}>${se.FirstName} ${se.LastName}</option>`;
      });

      const salesDropdown = `
        <select class="form-select form-select-sm" onchange="adminAssignSalesEmployee(${o.OrderID}, this.value)">
          ${salesOptions}
        </select>
      `;

      tbody.innerHTML += `
        <tr>
          <td>${o.OrderID}</td>
          <td>${new Date(o.OrderDate).toLocaleString('tr-TR')}</td>
          <td>
            <select class="form-select form-select-sm" onchange="adminUpdateOrderStatus(${o.OrderID}, this.value)">
              <option value="New" ${o.OrderStatus === 'New' ? 'selected' : ''}>New</option>
              <option value="Paid" ${o.OrderStatus === 'Paid' ? 'selected' : ''}>Paid</option>
              <option value="Shipped" ${o.OrderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Cancelled" ${o.OrderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>${Number(o.TotalAmount).toFixed(2)}</td>
          <td>${o.UsedCurrency || ''}</td>
          <td>${o.CustomerID}</td>
          <td>
             ${o.SalesEmployeeID ? '' : '<span class="badge bg-warning text-dark mb-1">Unassigned</span>'}
             ${salesDropdown}
          </td>
          <td>${o.CountryID}</td>
        </tr>`;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-danger">${e.message}</td></tr>`;
  }
}

async function adminAssignSalesEmployee(orderId, employeeId) {
  if (!employeeId) return;

  try {
    await apiText(`${API_BASE}/api/admin/orders/assign-employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, employeeId: Number(employeeId) })
    });
    adminLoadAllOrders();
  } catch (e) {
    alert('Failed to assign employee: ' + e.message);
    adminLoadAllOrders();
  }
}

async function adminUpdateOrderStatus(orderId, newStatus) {
  try {
    const res = await apiText(`${API_BASE}/api/admin/orders/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, newStatus })
    });
  } catch (e) {
    alert('Failed to update status: ' + e.message);
    adminLoadAllOrders();
  }
}

// PURCHASE ORDERS
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
    employeeId: null,
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
    const [orders, employees] = await Promise.all([
      apiJson(`${API_BASE}/api/admin/purchase-orders`),
      apiJson(`${API_BASE}/api/admin/employees`)
    ]);

    const purchasingEmployees = employees.filter(e => {
      const r = (e.Role || '').trim().toLowerCase();
      return r === 'purchasing';
    });

    tbody.innerHTML = '';

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No purchase orders found.</td></tr>';
      return;
    }

    orders.forEach(po => {
      const dateStr = new Date(po.OrderDate).toLocaleDateString('tr-TR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });

      const total = po.TotalAmount != null ? Number(po.TotalAmount).toFixed(2) + ' ₺' : '0.00 ₺';
      const supName = po.SupplierName || po.CompanyName || `ID: ${po.SupplierID || '-'}`;

      let empOptions = `<option value="">Unassigned</option>`;
      purchasingEmployees.forEach(pe => {
        const isSelected = po.ResponsibleEmployeeID === pe.EmployeeID ? 'selected' : '';
        empOptions += `<option value="${pe.EmployeeID}" ${isSelected}>${pe.FirstName} ${pe.LastName}</option>`;
      });

      const empCellContent = `
        <select class="form-select form-select-sm" style="width:auto;" onchange="adminAssignPurchaseOrderEmployee(${po.PurchaseOrderID}, this.value)">
          ${empOptions}
        </select>
      `;

      tbody.innerHTML += `
        <tr>
          <td>${po.PurchaseOrderID}</td>
          <td>${dateStr}</td>
          <td>
            <select class="form-select form-select-sm" onchange="adminUpdatePurchaseOrderStatus(${po.PurchaseOrderID}, this.value)">
              <option value="New" ${po.OrderStatus === 'New' ? 'selected' : ''}>New</option>
              <option value="Pending" ${po.OrderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Received" ${po.OrderStatus === 'Received' ? 'selected' : ''}>Received</option>
              <option value="Cancelled" ${po.OrderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              <option value="${po.OrderStatus}" ${['New', 'Pending', 'Received', 'Cancelled'].includes(po.OrderStatus) ? '' : 'selected'}>${po.OrderStatus}</option>
            </select>
          </td>
          <td>${total}</td>
          <td class="fw-bold text-dark">${supName}</td>
          <td class="text-muted">${empCellContent}</td>
        </tr>`;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger">Error: ${e.message}</td></tr>`;
  }
}

async function adminAssignPurchaseOrderEmployee(purchaseOrderId, employeeId) {
  if (!employeeId) return;

  try {
    await apiText(`${API_BASE}/api/admin/purchase-orders/assign-employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseOrderId, employeeId: Number(employeeId) })
    });
    console.log(`PO ${purchaseOrderId} assigned to ${employeeId}`);
    adminLoadPurchaseOrders();
  } catch (e) {
    alert('Failed to assign employee: ' + e.message);
    adminLoadPurchaseOrders();
  }
}

async function adminUpdatePurchaseOrderStatus(purchaseOrderId, newStatus) {
  try {
    await apiText(`${API_BASE}/api/admin/purchase-orders/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseOrderId, newStatus })
    });
    console.log(`PO ${purchaseOrderId} updated to ${newStatus}`);
  } catch (e) {
    alert('Failed to update status: ' + e.message);
    adminLoadPurchaseOrders();
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

// PRODUCTION

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
    alert('Please select product!');
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

async function adminLoadProductionOrders() {
  const tbody = $('prodOrderList');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

  try {
    const [orders, employees] = await Promise.all([
      apiJson(`${API_BASE}/api/admin/production/orders`),
      apiJson(`${API_BASE}/api/admin/employees`)
    ]);

    const prodEmployees = employees.filter(e => e.Role === 'Production');

    tbody.innerHTML = '';
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted">No production history.</td></tr>';
      return;
    }

    orders.forEach(o => {
      const dateStr = new Date(o.StartDate).toLocaleDateString('tr-TR');

      let empOptions = `<option value="">Select...</option>`;
      prodEmployees.forEach(pe => {
        const isSelected = pe.EmployeeID === o.ResponsibleEmployeeID ? 'selected' : '';
        empOptions += `<option value="${pe.EmployeeID}" ${isSelected}>${pe.FirstName} ${pe.LastName}</option>`;
      });

      const empDropdown = `
        <select class="form-select form-select-sm" style="width:auto; margin:auto;"
          onchange="adminAssignProductionEmployee(${o.ProductionOrderID}, this.value)">
          ${empOptions}
        </select>
      `;

      tbody.innerHTML += `
        <tr>
          <td>${o.ProductionOrderID}</td>
          <td>${dateStr}</td>
          <td>${o.ProductCode} - ${o.ProductName || ''}</td>
          <td>${o.Quantity}</td>
          <td>${o.ProductionStatus}</td>
          <td>
            ${o.ResponsibleEmployeeID ? '' : '<span class="badge bg-warning text-dark mb-1">Unassigned</span>'}
            ${empDropdown}
          </td>
        </tr>
      `;
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger">${e.message}</td></tr>`;
  }
}

async function adminAssignProductionEmployee(productionOrderId, employeeId) {
  if (!employeeId) return;

  try {
    await apiText(`${API_BASE}/api/admin/production/assign-employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productionOrderId, employeeId: Number(employeeId) })
    });
    console.log(`Production Order ${productionOrderId} assigned to ${employeeId}`);
    adminLoadProductionOrders();
  } catch (e) {
    alert('Failed to assign employee: ' + e.message);
    adminLoadProductionOrders();
  }
}

// CUSTOMERS

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
          <td>
            <button class="btn btn-sm btn-warning" onclick='adminEditCustomer(${JSON.stringify(c)})'>
              <i class="fa-solid fa-pen"></i>
            </button>
          </td>
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

    ['custFirst', 'custLast', 'custPhone', 'custEmail', 'custAddress', 'custRegionId', 'custCountryId'].forEach(id => {
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
window.initAdminPage = initAdminPage;
window.adminUpdateOrderStatus = adminUpdateOrderStatus;
window.adminAssignSalesEmployee = adminAssignSalesEmployee;
window.adminAssignProductionEmployee = adminAssignProductionEmployee;
window.adminEditCustomer = adminEditCustomer;
window.adminEditProduct = adminEditProduct;
window.adminUpdateEmployeeRole = adminUpdateEmployeeRole;
window.adminUpdatePurchaseOrderStatus = adminUpdatePurchaseOrderStatus;

// EDIT PRODUCT PRICE MODAL LOGIC
let editProductModalInstance = null;

function adminEditProduct(code, currentPrice) {
  const m = document.getElementById('editProductModal');
  if (!editProductModalInstance) editProductModalInstance = new bootstrap.Modal(m);

  document.getElementById('editProdCode').value = code;
  document.getElementById('displayProdCode').value = code;
  document.getElementById('editProdPrice').value = currentPrice;
  document.getElementById('editProdMsg').innerText = '';

  editProductModalInstance.show();
}

document.addEventListener('DOMContentLoaded', () => {
  const editProdForm = document.getElementById('editProductForm');
  if (editProdForm) {
    editProdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await adminUpdateProductPriceSubmit();
    });
  }
});

async function adminUpdateProductPriceSubmit() {
  const msg = document.getElementById('editProdMsg');
  msg.innerText = '';

  const body = {
    productCode: document.getElementById('editProdCode').value,
    newPrice: document.getElementById('editProdPrice').value
  };

  try {
    const res = await apiText('/api/admin/products/update-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = safeJsonParse(res, null);
    if (data && data.ok) {
      alert('Price updated!');
      if (editProductModalInstance) editProductModalInstance.hide();
      adminLoadProducts();
    } else {
      msg.innerText = 'Error: ' + res;
      msg.className = 'text-danger fw-bold mb-2';
    }
  } catch (err) {
    msg.innerText = 'Error: ' + err.message;
    msg.className = 'text-danger fw-bold mb-2';
  }
}

// EDIT CUSTOMER MODAL LOGIC
let editModalInstance = null;

function adminEditCustomer(c) {
  const m = document.getElementById('editCustomerModal');
  if (!editModalInstance) editModalInstance = new bootstrap.Modal(m);

  document.getElementById('editCustId').value = c.CustomerID;
  document.getElementById('editCustFirst').value = c.FirstName;
  document.getElementById('editCustLast').value = c.LastName;
  document.getElementById('editCustEmail').value = c.Email;
  document.getElementById('editCustPhone').value = c.PhoneNumber;
  document.getElementById('editCustAddress').value = c.Address;

  document.getElementById('editCustMsg').innerText = '';

  editModalInstance.show();
}

document.addEventListener('DOMContentLoaded', () => {
  const editForm = document.getElementById('editCustomerForm');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await adminUpdateCustomerSubmit();
    });
  }
});

async function adminUpdateCustomerSubmit() {
  const msg = document.getElementById('editCustMsg');
  msg.innerText = '';

  const body = {
    customerId: document.getElementById('editCustId').value,
    phoneNumber: document.getElementById('editCustPhone').value,
    address: document.getElementById('editCustAddress').value
  };

  try {
    const res = await apiText('/api/admin/customers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = safeJsonParse(res, null);
    if (data && data.ok) {
      alert('Customer updated!');
      if (editModalInstance) editModalInstance.hide();
      adminLoadCustomers();
    } else {
      msg.innerText = 'Error: ' + res;
      msg.className = 'text-danger fw-bold mb-2';
    }
  } catch (err) {
    msg.innerText = 'Error: ' + err.message;
    msg.className = 'text-danger fw-bold mb-2';
  }
}