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
