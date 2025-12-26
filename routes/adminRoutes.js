const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

// ADD PRODUCT

router.post('/products/add', async (req, res) => {
  const { productCode, productName, salesPrice, color, stockQuantity, classId, collectionId } = req.body;

  if (!productCode || !productName || salesPrice == null || !color || stockQuantity == null) {
    return res.status(400).send('There are missing fields.');
  }

  try {
    const pool = await sql.connect(config);

    await pool.request()
      .input('ProductCode', sql.NVarChar(20), productCode)
      .input('ProductName', sql.NVarChar(100), productName)
      .input('SalesPrice', sql.Decimal(10, 2), salesPrice)
      .input('Color', sql.NVarChar(30), color)
      .input('StockQuantity', sql.Int, stockQuantity)
      .input('ClassID', sql.Int, classId ?? null)
      .input('CollectionID', sql.Int, collectionId ?? null)
      .execute('sp_AddProduct');

    res.json({ ok: true });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// DELETE PRODUCT

router.post('/products/delete', async (req, res) => {
  const { productCode } = req.body;
  if (!productCode) return res.status(400).send('The productCode is required.');

  try {
    const pool = await sql.connect(config);

    await pool.request()
      .input('ProductCode', sql.NVarChar(20), productCode)
      .execute('sp_DeleteProductFromSales');

    res.json({ ok: true });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// LIST EMPLOYEES

router.get('/employees', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListEmployee');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// LIST SALES ORDERS

router.get('/orders', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListAllSalesOrders');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// UPDATE ORDER STATUS

router.post('/orders/update-status', async (req, res) => {
  const { orderId, newStatus } = req.body;

  if (!orderId || !newStatus) {
    return res.status(400).send('Missing fields.');
  }

  const validStatuses = ['New', 'Paid', 'Shipped', 'Cancelled'];
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).send('Invalid status.');
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('OrderID', sql.Int, orderId)
      .input('NewStatus', sql.NVarChar(20), newStatus)
      .execute('sp_UpdateOrderStatus');

    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ASSIGN SALES EMPLOYEE
router.post('/orders/assign-employee', async (req, res) => {
  const { orderId, employeeId } = req.body;

  if (!orderId || !employeeId) {
    return res.status(400).send('There are missing fields.');
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('OrderID', sql.Int, orderId)
      .input('SalesEmployeeID', sql.Int, employeeId)
      .execute('sp_AssignSalesOrderEmployee');

    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ADD EMPLOYEE

router.post('/employees/add', async (req, res) => {
  const { firstName, lastName, role, phoneNumber, email } = req.body;
  if (!firstName || !lastName || !role || !phoneNumber || !email) {
    return res.status(400).send('There are missing fields.');
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('FirstName', sql.NVarChar(50), firstName)
      .input('LastName', sql.NVarChar(50), lastName)
      .input('Role', sql.NVarChar(50), role)
      .input('PhoneNumber', sql.NVarChar(20), phoneNumber)
      .input('Email', sql.NVarChar(250), email)
      .execute('sp_AddEmployee');

    res.json({ ok: true });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// DELETE EMPLOYEE

router.post('/employees/delete', async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).send('The employeeId is required.');

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('EmployeeID', sql.Int, employeeId)
      .execute('sp_DeleteEmployee');

    res.json({ ok: true });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// LIST PURCHASE ORDERS

router.get('/purchase-orders', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListPurchaseOrders');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// CREATE PURCHASE ORDER WITH DETAILS

router.post('/purchase-orders/create', async (req, res) => {
  const { supplierId, employeeId, items } = req.body;
  if (!supplierId || !employeeId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send('There are missing fields.');
  }

  try {
    const pool = await sql.connect(config);

    const created = await pool.request()
      .input('SupplierID', sql.Int, supplierId)
      .input('EmployeeID', sql.Int, employeeId)
      .execute('sp_CreatePurchaseOrder');

    const purchaseOrderId = created.recordset?.[0]?.NewPurchaseOrderID;
    if (!purchaseOrderId) throw new Error('Failed to create purchase order.');

    for (const it of items) {
      if (!it.materialId || !it.quantity || it.unitPrice == null) {
        throw new Error('There are missing fields in items.');
      }

      await pool.request()
        .input('PurchaseOrderID', sql.Int, purchaseOrderId)
        .input('MaterialID', sql.Int, it.materialId)
        .input('Quantity', sql.Int, it.quantity)
        .input('UnitPrice', sql.Decimal(10, 2), it.unitPrice)
        .execute('sp_AddPurchaseOrderDetailAndRecalc');
    }

    res.json({ ok: true, purchaseOrderId });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// LIST PRODUCTS

router.get('/products', async (req, res) => {
  const search = req.query.search || null;

  try {
    const pool = await sql.connect(config);
    const r = await pool.request()
      .input('Search', sql.NVarChar(100), search)
      .execute('sp_ListProducts');

    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// PRODUCTION ROUTES

router.get('/production/bom/:productCode', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request()
      .input('ProductCode', sql.NVarChar(20), req.params.productCode)
      .execute('sp_GetProductBOM');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// PRODUCE PRODUCT

router.post('/production/produce', async (req, res) => {
  const { productCode, quantity, employeeId } = req.body;

  if (!productCode || !quantity || quantity <= 0) {
    return res.status(400).send("The productCode and a positive quantity are required.");
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('ProductCode', sql.NVarChar(20), productCode)
      .input('ProductionQty', sql.Int, quantity)
      .input('EmployeeID', sql.Int, employeeId || null)
      .execute('sp_ExecuteProduction');

    res.json({ ok: true, message: "Production was successfully completed." });
  } catch (e) {

    res.status(400).send(e.message);
  }
});

// LIST PRODUCTION ORDERS
router.get('/production/orders', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListProductionOrders');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ASSIGN PRODUCTION EMPLOYEE
router.post('/production/assign-employee', async (req, res) => {
  const { productionOrderId, employeeId } = req.body;

  if (!productionOrderId || !employeeId) {
    return res.status(400).send('There are missing fields.');
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('ProductionOrderID', sql.Int, productionOrderId)
      .input('EmployeeID', sql.Int, employeeId)
      .execute('sp_AssignProductionOrderEmployee');

    res.json({ ok: true });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// LIST SUPPLIERS

router.get('/suppliers', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().query('SELECT SupplierID, CompanyName FROM Supplier');
    res.json(r.recordset);
  } catch (e) { res.status(500).send(e.message); }
});

// LIST RAW MATERIALS

router.get('/raw-materials', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().query('SELECT MaterialID, MaterialName, StockQuantity, UnitPrice FROM RawMaterial');
    res.json(r.recordset);
  } catch (e) { res.status(500).send(e.message); }
});

// CREATE PURCHASE ORDER
router.post('/purchase', async (req, res) => {

  const { supplierId, employeeId, materialId, quantity, expectedDate } = req.body;

  if (!supplierId || !materialId || !quantity || !expectedDate) {
    return res.status(400).send("There are missing fields.");
  }

  try {
    const pool = await sql.connect(config);

    await pool.request()
      .input('SupplierID', sql.Int, supplierId)
      .input('EmployeeID', sql.Int, employeeId || null)
      .input('MaterialID', sql.Int, materialId)
      .input('Quantity', sql.Int, quantity)
      .input('ExpectedDate', sql.Date, expectedDate)
      .execute('sp_CreatePurchaseOrder');

    res.json({ message: 'Order created successfully.' });

  } catch (e) {
    res.status(500).send("Error: " + e.message);
  }
});

// ASSIGN PURCHASE ORDER EMPLOYEE
router.post('/purchase-orders/assign-employee', async (req, res) => {
  const { purchaseOrderId, employeeId } = req.body;

  if (!purchaseOrderId || !employeeId) {
    return res.status(400).send('Missing fields.');
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('PurchaseOrderID', sql.Int, purchaseOrderId)
      .input('EmployeeID', sql.Int, employeeId)
      .execute('sp_AssignPurchaseOrderEmployee');

    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// LIST CUSTOMERS

router.get('/customers', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListCustomers');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ADD CUSTOMER

router.post('/customers/add', async (req, res) => {
  const {
    firstName, lastName, phoneNumber, email, address,
    customerType, regionId, countryId
  } = req.body;

  if (!firstName || !lastName || !phoneNumber || !email || !address || !customerType) {
    return res.status(400).send('There are missing fields.');
  }

  try {
    const pool = await sql.connect(config);

    const insertCustomer = await pool.request()
      .input('FirstName', sql.NVarChar(50), firstName)
      .input('LastName', sql.NVarChar(50), lastName)
      .input('PhoneNumber', sql.NVarChar(20), phoneNumber)
      .input('Email', sql.NVarChar(100), email)
      .input('Address', sql.NVarChar(250), address)
      .execute('sp_AddCustomer');

    const newCustomerId = insertCustomer.recordset?.[0]?.NewCustomerID;
    if (!newCustomerId) throw new Error('Customer creation failed.');

    if (customerType === 'domestic') {
      if (!regionId) return res.status(400).send('The regionId is required.');
      await pool.request()
        .input('CustomerID', sql.Int, newCustomerId)
        .input('RegionID', sql.Int, regionId)
        .execute('sp_AddDomesticCustomer');
    }

    if (customerType === 'international') {
      if (!countryId) return res.status(400).send('The countryId is required.');
      await pool.request()
        .input('CustomerID', sql.Int, newCustomerId)
        .input('CountryID', sql.Int, countryId)
        .execute('sp_AddInternationalCustomer');
    }

    res.json({ ok: true, customerId: newCustomerId });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// DELETE CUSTOMER

router.post('/customers/delete', async (req, res) => {
  const { customerId } = req.body;
  if (!customerId) return res.status(400).send('The customerId is required.');

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .execute('sp_DeleteCustomer');

    res.json({ ok: true });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// UPDATE CUSTOMER (ADMIN)
router.post('/customers/update', async (req, res) => {
  const { customerId, phoneNumber, address } = req.body;

  if (!customerId) {
    return res.status(400).send('Missing fields.');
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('PhoneNumber', sql.NVarChar(20), phoneNumber)
      .input('Address', sql.NVarChar(250), address)
      .execute('sp_UpdateCustomer');

    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// RAW MATERIAL STOCK STATUS (from view)
router.get('/raw-material-stock-status', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().query(`
      SELECT MaterialID, MaterialName, StockQuantity, SafetyStockLevel, StockStatus
      FROM dbo.vRawMaterialStockStatus
      ORDER BY
        CASE WHEN StockStatus = 'REORDER REQUIRED' THEN 1 ELSE 2 END,
        MaterialName;
    `);
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});


// UPDATE PRODUCT PRICE
router.post('/products/update-price', async (req, res) => {
  const { productCode, newPrice } = req.body;

  if (!productCode || newPrice === undefined) {
    return res.status(400).send('Missing fields.');
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('ProductCode', sql.NVarChar(20), productCode)
      .input('NewPrice', sql.Decimal(10, 2), newPrice)
      .execute('sp_UpdateProductPrice');

    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// UPDATE PURCHASE ORDER STATUS
router.post('/purchase-orders/update-status', async (req, res) => {
  const { purchaseOrderId, newStatus } = req.body;

  if (!purchaseOrderId || !newStatus) {
    return res.status(400).send('Missing fields.');
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('PurchaseOrderID', sql.Int, purchaseOrderId)
      .input('NewStatus', sql.NVarChar(50), newStatus)
      .execute('sp_UpdatePurchaseOrderStatus');

    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// UPDATE EMPLOYEE ROLE
router.post('/employees/update-role', async (req, res) => {
  const { employeeId, newRole } = req.body;

  if (!employeeId || !newRole) {
    return res.status(400).send('Missing fields.');
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('EmployeeID', sql.Int, employeeId)
      .input('NewRole', sql.NVarChar(50), newRole)
      .execute('sp_UpdateEmployeeRole');

    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;