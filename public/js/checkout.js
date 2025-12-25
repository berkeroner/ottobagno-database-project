
// CHECKOUT PAGE

function initCheckoutPage() {
  const customer = requireCustomerOrRedirect();
  if (!customer) return;

  const info = $('customerInfo');
  if (info) info.innerText = `${customer.FirstName} ${customer.LastName}`;

  const btn = $('btnCheckoutPay');
  if (btn) {
    btn.onclick = checkoutAndPay;
  } else {
    console.error('Checkout button not found!');
  }
}

async function checkoutAndPay() {
  console.log('Payment process initiated.');

  const cart = getCart();
  if (!cart || cart.length === 0) {
    alert('Your shopping cart is empty!');
    return;
  }

  const customer = requireCustomerOrRedirect();
  if (!customer) return;

  const usedCurrency = $('usedCurrency')?.value?.trim();
  const countryIdVal = $('countryId')?.value;
  const paymentMethod = $('paymentMethod')?.value;

  if (!usedCurrency || !countryIdVal || !paymentMethod) {
    alert('There are missing fields.');
    return;
  }

  const countryId = parseInt(countryIdVal, 10);
  if (!Number.isFinite(countryId)) {
    alert('CountryID is invalid.');
    return;
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

  const btn = $('btnCheckoutPay');
  const oldText = btn?.innerHTML;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Processing...';
  }

  try {
    const res = await apiFetch('/api/orders/checkout-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    alert(`✅ Order placed successfully!\nOrder No: ${data.orderId}\nAmount: ${data.totalAmount} ${usedCurrency}`);

    localStorage.removeItem('cart');
    window.location.href = 'index.html';
  } catch (e) {
    console.error('Payment Error:', e);
    alert('Payment failed: ' + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  }
}

window.initCheckoutPage = initCheckoutPage;
window.checkoutAndPay = checkoutAndPay;
