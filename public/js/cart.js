
// CART PAGE

function getCart() {
  return safeJsonParse(localStorage.getItem('cart') || '[]', []);
}

function setCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const cart = getCart();
  const totalQty = cart.reduce((s, it) => s + Number(it.quantity || 0), 0);

  const navBadge = $('cartCount');
  if (navBadge) navBadge.innerText = totalQty;

  const pageBadge = $('itemCountBadge');
  if (pageBadge) pageBadge.innerText = `${totalQty} Products`;

  const totalEl = $('cartTotal');
  if (totalEl) {
    const totalPrice = cart.reduce(
      (s, it) => s + (Number(it.quantity || 0) * Number(it.unitPrice || 0)),
      0
    );
    totalEl.innerText = Number.isFinite(totalPrice) ? totalPrice.toFixed(2) : '0.00';
  }
}

function addToCart(product) {
  const cart = getCart();

  const code = String(product.ProductCode ?? '').trim();
  const price = Number(product.SalesPriceWithVAT || product.SalesPrice || 0);

  if (!code) {
    alert('ProductCode not found.');
    return;
  }

  const qtyInput = $(`qty-${code}`);
  let qtyToAdd = 1;

  if (qtyInput) {
    qtyToAdd = parseInt(qtyInput.value, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }
  }

  const existing = cart.find(x => x.productCode === code);
  const currentQtyInCart = existing ? Number(existing.quantity || 0) : 0;

  const stockQty = Number(product.StockQuantity || 0);
  if (currentQtyInCart + qtyToAdd > stockQty) {
    alert(`Out of stock! Quantity in stock: ${stockQty}, Your cart: ${currentQtyInCart}`);
    return;
  }

  if (existing) {
    existing.quantity = Number(existing.quantity || 0) + qtyToAdd;
  } else {
    cart.push({
      productCode: code,
      productName: product.ProductName || '',
      quantity: qtyToAdd,
      unitPrice: price
    });
  }

  setCart(cart);

  if (typeof showNotification === 'function') {
    showNotification(`${product.ProductName} (${qtyToAdd} items) added to cart!`);
  } else {
    alert(`${product.ProductName} (${qtyToAdd} items) added to cart!`);
  }

  if (qtyInput) qtyInput.value = 1;
}

// Cart page init
function initCartPage() {
  updateCartUI();

  const cart = getCart();
  const list = $('cartList');
  if (!list) return;

  list.innerHTML = '';
  if (!cart.length) {
    list.innerHTML = '<li class="list-group-item text-center py-5">Empty cart</li>';
    return;
  }

  cart.forEach((it, idx) => {
    const qty = Number(it.quantity || 0);
    const unitPrice = Number(it.unitPrice || 0);

    list.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center py-3">
        <div>
          <h6 class="mb-0 fw-bold">${it.productName || ''}</h6>
          <small class="text-muted">${it.productCode || ''}</small>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span>${qty} x ${unitPrice} ₺</span>
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

window.getCart = getCart;
window.setCart = setCart;
window.updateCartUI = updateCartUI;
window.addToCart = addToCart;
window.initCartPage = initCartPage;
window.removeFromCart = removeFromCart;
