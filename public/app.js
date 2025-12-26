/*
 * app.js
 *
 * Main application entry point.
 * Detects the current page and initializes the corresponding
 * page-specific functions (catalog, cart, checkout, orders, admin).
 *
 * All common utilities and modules (api, auth, cart, ui, etc.)
 * must be loaded before this file.
 */

(function () {

  // Calls a global function if it exists
  const safeCall = (fnName) => {
    const fn = window[fnName];
    if (typeof fn === "function") fn();
  };

  // Get current page file name (index.html, cart.html, etc.)
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  // Update cart badge and totals on all pages
  safeCall("updateCartUI");

  // Initialize page-specific logic
  switch (page) {
    case "index.html":
      safeCall("initCatalogPage");
      break;

    case "cart.html":
      safeCall("initCartPage");
      break;

    case "checkout.html":
      safeCall("initCheckoutPage");
      break;

    case "my-orders.html":
      safeCall("initMyOrdersPage");
      break;

    case "admin.html":
      safeCall("initAdminPage");
      break;

    case "login.html":
      // Optional: initialize login page logic if defined
      safeCall("initLoginPage");
      break;

    default:
      break;
  }

})();
