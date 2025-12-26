
//CATALOG (FILTERS + PRODUCTS + BEST SELLERS)

async function initCatalogPage() {
  const c = requireCustomerOrRedirect();
  if (!c) return;

  const userNameEl = $('userName');
  if (userNameEl) userNameEl.innerText = `${c.FirstName} ${c.LastName}`;

  updateCartUI();

  if (c.FirstName === 'admin' && c.LastName === 'admin') {
    const pnl = $('adminPanel');
    if (pnl) pnl.style.display = 'block';
  }

  await loadBestSellers();
  await loadFilters();
  await loadFilteredProducts();
}

// Load filters
async function loadFilters() {
  const classSelect = $('classSelect');
  const collectionSelect = $('collectionSelect');
  if (!classSelect) return;

  try {
    const [classes, colls] = await Promise.all([
      apiJson('/api/products/classes'),
      apiJson('/api/products/collections')
    ]);

    classSelect.innerHTML += `<option value="">All Classes</option>`;
    classes.forEach(c =>
      classSelect.innerHTML += `<option value="${c.ClassID}">${c.ClassName}</option>`
    );

    if (collectionSelect) {
      collectionSelect.innerHTML += `<option value="">All Collections</option>`;
      colls.forEach(c =>
        collectionSelect.innerHTML += `<option value="${c.CollectionID}">${c.CollectionName}</option>`
      );
    }

    classSelect.onchange = loadFilteredProducts;
    if (collectionSelect) collectionSelect.onchange = loadFilteredProducts;

    const resetBtn = $('btnResetFilters');
    if (resetBtn) {
      resetBtn.onclick = () => {
        classSelect.value = '';
        if (collectionSelect) collectionSelect.value = '';
        loadFilteredProducts();
      };
    }
  } catch (e) {
    console.error('Filter loading error:', e);
  }
}

// Load filtered products
async function loadFilteredProducts() {
  const container = $('products');
  if (!container) return;

  container.innerHTML = `
    <div class="text-center w-100 mt-5">
      <div class="spinner-border text-primary"></div>
    </div>
  `;

  const qs = new URLSearchParams();
  const cId = $('classSelect')?.value;
  const coId = $('collectionSelect')?.value;

  if (cId) qs.set('classId', cId);
  if (coId) qs.set('collectionId', coId);

  try {
    let res = await apiFetch(`/api/products/filtered?${qs.toString()}`);

    if (!res.ok && res.status === 404) {
      res = await apiFetch('/api/products');
    }

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    container.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<div class="alert alert-warning w-100">Product not found.</div>';
      return;
    }

    data.forEach(p => {
      const price = Number(p.SalesPriceWithVAT || p.SalesPrice || 0).toFixed(2);
      const qtyInputId = `qty-${p.ProductCode}`;

      container.innerHTML += `
        <div class="col">
          <div class="card h-100 shadow-sm product-card">
            <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 180px;">
              <i class="fa-solid fa-box-open fa-3x text-secondary"></i>
            </div>
            <div class="card-body d-flex flex-column">
              <h6 class="card-title fw-bold text-truncate" title="${p.ProductName}">
                ${p.ProductName}
              </h6>
              <small class="text-muted mb-3">Product Code: ${p.ProductCode}</small>

              <div class="mt-auto">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fs-5 text-primary fw-bold">${price} ₺</span>
                  <span class="badge bg-light text-secondary border">
                    Stock: ${p.StockQuantity}
                  </span>
                </div>

                <div class="input-group">
                  <input
                    type="number"
                    id="${qtyInputId}"
                    class="form-control text-center"
                    value="1"
                    min="1"
                    max="${p.StockQuantity}">
                  <button class="btn btn-primary"
                    onclick='addToCart(${JSON.stringify(p)})'>
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

// Render best sellers
function renderBestSellers(items) {
  const el = $('bestSellers');
  if (!el) return;

  if (!Array.isArray(items) || items.length === 0) {
    el.innerHTML = `<div class="alert alert-warning w-100">Best seller data not found.</div>`;
    return;
  }

  el.innerHTML = '';
  items.forEach(p => {
    el.innerHTML += `
      <div class="col">
        <div class="card h-100 shadow-sm product-card">
          <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 140px;">
            <i class="fa-solid fa-fire fa-3x text-danger"></i>
          </div>
          <div class="card-body d-flex flex-column">
            <h6 class="card-title fw-bold text-truncate" title="${p.ProductName}">
              ${p.ProductName}
            </h6>
            <small class="text-muted mb-2">Product Code: ${p.ProductCode}</small>

            <div class="mt-auto">
              <div class="d-flex justify-content-between small">
                <span class="text-muted">Quantity Sold</span>
                <span class="fw-bold">${p.TotalQtySold}</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  });
}

async function loadBestSellers(top = 12) {
  const el = $('bestSellers');
  if (!el) return;

  el.innerHTML = `
    <div class="text-center w-100 mt-3">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2 text-muted">Loading Best Sellers...</p>
    </div>
  `;

  try {
    const data = await apiJson(`/api/products/best-sellers?top=${top}`);
    renderBestSellers(data);
  } catch (e) {
    console.error('Best sellers error:', e);
    el.innerHTML = `
      <div class="alert alert-danger w-100">
        Best sellers could not be loaded: ${e.message}
      </div>
    `;
  }
}

window.initCatalogPage = initCatalogPage;
window.loadFilters = loadFilters;
window.loadFilteredProducts = loadFilteredProducts;
window.loadBestSellers = loadBestSellers;
