const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

// ✅ Ürün ekle (SP: sp_AddProduct)
router.post('/products/add', async (req, res) => {
  const { productCode, productName, salesPrice, color, stockQuantity, classId, collectionId } = req.body;

  if (!productCode || !productName || salesPrice == null || !color || stockQuantity == null) {
    return res.status(400).send('Eksik alan var.');
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

// ✅ Ürün sil (SP: sp_DeleteProductFromSales)
router.post('/products/delete', async (req, res) => {
  const { productCode } = req.body;
  if (!productCode) return res.status(400).send('productCode zorunlu.');

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

// ✅ Tüm çalışanlar (SP: sp_ListEmployees)
router.get('/employees', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListEmployees');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ✅ Tüm siparişler (SP: sp_ListAllSalesOrders)
router.get('/orders', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListAllSalesOrders');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;

// ✅ Employee add (SP: sp_AddEmployee)
router.post('/employees/add', async (req, res) => {
  const { firstName, lastName, role, phoneNumber, email } = req.body;
  if(!firstName || !lastName || !role || !phoneNumber || !email) {
    return res.status(400).send('Eksik alan var.');
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

    res.json({ ok:true });
  } catch(e) {
    res.status(400).send(e.message);
  }
});

// ✅ Employee delete (SP: sp_DeleteEmployee)
router.post('/employees/delete', async (req, res) => {
  const { employeeId } = req.body;
  if(!employeeId) return res.status(400).send('employeeId zorunlu.');

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('EmployeeID', sql.Int, employeeId)
      .execute('sp_DeleteEmployee');

    res.json({ ok:true });
  } catch(e) {
    res.status(400).send(e.message);
  }
});

// ✅ Purchase orders list (SP: sp_ListPurchaseOrders)
router.get('/purchase-orders', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListPurchaseOrders');
    res.json(r.recordset);
  } catch(e) {
    res.status(500).send(e.message);
  }
});

// ✅ Create purchase order with details
router.post('/purchase-orders/create', async (req, res) => {
  const { supplierId, employeeId, items } = req.body;
  if(!supplierId || !employeeId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send('Eksik alan var.');
  }

  try {
    const pool = await sql.connect(config);

    // 1) create purchase order
    const created = await pool.request()
      .input('SupplierID', sql.Int, supplierId)
      .input('EmployeeID', sql.Int, employeeId)
      .execute('sp_CreatePurchaseOrder');

    const purchaseOrderId = created.recordset?.[0]?.NewPurchaseOrderID;
    if(!purchaseOrderId) throw new Error('PurchaseOrderID alınamadı.');

    // 2) add details
    for (const it of items) {
      if(!it.materialId || !it.quantity || it.unitPrice == null) {
        throw new Error('Item alanları eksik.');
      }

      await pool.request()
        .input('PurchaseOrderID', sql.Int, purchaseOrderId)
        .input('MaterialID', sql.Int, it.materialId)
        .input('Quantity', sql.Int, it.quantity)
        .input('UnitPrice', sql.Decimal(10,2), it.unitPrice)
        .execute('sp_AddPurchaseOrderDetailAndRecalc'); // aşağıda SQL'de oluşturacağız
    }

    res.json({ ok:true, purchaseOrderId });
  } catch(e) {
    res.status(400).send(e.message);
  }
});

// ✅ Ürünleri listele (SP: sp_ListProducts) - search opsiyonel
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


