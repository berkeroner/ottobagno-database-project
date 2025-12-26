
// MY ORDERS + ORDER DETAILS MODAL

async function initMyOrdersPage() {
  const customer = requireCustomerOrRedirect();
  if (!customer) return;

  const tbody = $('myOrdersList');
  const noMsg = $('noOrdersMsg');
  if (!tbody) return;

  if (noMsg) noMsg.classList.add('d-none');

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="py-4 text-center">
        <div class="spinner-border text-primary"></div>
      </td>
    </tr>
  `;

  try {
    const res = await apiFetch(`/api/orders/my-orders?customerId=${customer.CustomerID}`);
    if (!res.ok) throw new Error('Orders could not be loaded.');

    const response = await res.json();
    const orders = Array.isArray(response) ? response : (response?.data ?? []);

    tbody.innerHTML = '';

    if (!orders || orders.length === 0) {
      if (noMsg) noMsg.classList.remove('d-none');
      return;
    }

    orders.forEach(o => {
      const dateObj = o.OrderDate ? new Date(o.OrderDate) : null;
      const dateStr = (dateObj && !isNaN(dateObj))
        ? dateObj.toLocaleDateString('tr-TR', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
        : '-';

      let badgeClass = 'bg-secondary';
      if (o.OrderStatus === 'New') badgeClass = 'bg-primary';
      else if (o.OrderStatus === 'Paid') badgeClass = 'bg-success';
      else if (o.OrderStatus === 'Shipped') badgeClass = 'bg-info text-dark';
      else if (o.OrderStatus === 'Cancelled') badgeClass = 'bg-danger';

      const totalAmount = Number(o.CalculatedTotal ?? 0);
      const totalStr = Number.isFinite(totalAmount) ? totalAmount.toFixed(2) : '0.00';

      tbody.innerHTML += `
        <tr>
          <td class="fw-bold">#${o.OrderID ?? '-'}</td>
          <td>${dateStr}</td>
          <td class="fw-bold text-dark">${totalStr} ${o.UsedCurrency || 'TRY'}</td>
          <td>
            <span class="badge ${badgeClass} px-3 py-2 rounded-pill">
              ${o.OrderStatus || '-'}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="showOrderDetails(${o.OrderID})">
              <i class="fa-solid fa-list-ul"></i> Details
            </button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-danger py-3 text-center">
          ${err.message || 'Error loading orders.'}
        </td>
      </tr>
    `;
  }
}

async function showOrderDetails(orderId) {
  const modalEl = $('orderDetailModal');
  const modalTitle = $('detailModalTitle');
  const modalBody = $('modalBodyContent');
  if (!modalEl || !modalTitle || !modalBody) return;

  if (!window.bootstrap || !bootstrap.Modal) {
    alert('Bootstrap modal not found.');
    return;
  }

  const modal = new bootstrap.Modal(modalEl);
  modalTitle.innerText = `Order Details #${orderId}`;
  modal.show();

  try {
    const items = await apiJson(`/api/orders/details/${orderId}`);

    modalBody.innerHTML = '';
    if (!items || items.length === 0) {
      modalBody.innerHTML = '<tr><td colspan="5">No details found.</td></tr>';
      return;
    }

    items.forEach(it => {
      modalBody.innerHTML += `
        <tr>
          <td>${it.ProductCode}</td>
          <td class="fw-bold">${it.ProductName}</td>
          <td>${it.Quantity}</td>
          <td>${Number(it.UnitPrice || 0).toFixed(2)} ₺</td>
          <td class="fw-bold text-primary">${Number(it.LineTotal || 0).toFixed(2)} ₺</td>
        </tr>`;
    });
  } catch (e) {
    modalBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-danger">Error: ${e.message}</td>
      </tr>
    `;
  }
}

window.initMyOrdersPage = initMyOrdersPage;
window.showOrderDetails = showOrderDetails;
