const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

/* -------------------------------------------------- */
/* Helper functions                                  */
/* -------------------------------------------------- */

function extractSqlMessage(err) {
  return (
    err?.originalError?.info?.message ||
    err?.originalError?.message ||
    err?.message ||
    'Sipariş oluşturulamadı.'
  );
}

/* -------------------------------------------------- */
/* CHECKOUT + PAYMENT (TEK TRANSACTION)               */
/* -------------------------------------------------- */

router.post('/checkout-pay', async (req, res) => {
  const { customerId, usedCurrency, countryId, paymentMethod, items } = req.body;

  if (!customerId || !countryId || !usedCurrency || !paymentMethod) {
    return res.status(400).send(
      'CustomerID / CountryID / Currency / PaymentMethod zorunlu.'
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send('Sepet boş.');
  }

  try {
    const pool = await sql.connect(config);
    const tx = new sql.Transaction(pool);

    await tx.begin();

    try {
      /* 1️⃣ Random employee seç */
      const empResult = await new sql.Request(tx)
        .execute('sp_GetRandomEmployee');

      const salesEmployeeId = empResult.recordset?.[0]?.EmployeeID;
      if (!salesEmployeeId) throw new Error('Employee bulunamadı.');

      /* 2️⃣ SalesOrder oluştur */
      const orderResult = await new sql.Request(tx)
        .input('CustomerID', sql.Int, customerId)
        .input('SalesEmployeeID', sql.Int, salesEmployeeId)
        .input('UsedCurrency', sql.Char(3), usedCurrency)
        .input('CountryID', sql.Int, countryId)
        .execute('sp_CreateSalesOrder');

      const newOrderId = orderResult.recordset[0].NewOrderID;

      /* 3️⃣ OrderDetail (stok trigger burada çalışır) */
      for (const it of items) {
        await new sql.Request(tx)
          .input('OrderID', sql.Int, newOrderId)
          .input('ProductCode', sql.NVarChar(20), it.productCode)
          .input('Quantity', sql.Int, it.quantity)
          .input('UnitPrice', sql.Decimal(10, 2), it.unitPrice)
          .execute('sp_AddOrderDetail');
      }

      /* 4️⃣ Total hesapla */
      await new sql.Request(tx)
        .input('OrderID', sql.Int, newOrderId)
        .execute('sp_RecalculateSalesOrderTotal');

      /* 5️⃣ TotalAmount çek */
      const totalRes = await new sql.Request(tx)
        .input('OrderID', sql.Int, newOrderId)
        .execute('sp_GetOrderTotal');

      const totalAmount = totalRes.recordset[0].TotalAmount;

      /* 6️⃣ Payment ekle */
      await new sql.Request(tx)
        .input('OrderID', sql.Int, newOrderId)
        .input('PaymentMethod', sql.NVarChar(30), paymentMethod)
        .input('Amount', sql.Decimal(12, 2), totalAmount)
        .execute('sp_AddPayment');

      await tx.commit();

      return res.json({
        orderId: newOrderId,
        totalAmount,
        message: 'Ödeme alındı ve sipariş oluşturuldu.'
      });

    } catch (errInside) {
      await tx.rollback();

      const msg = extractSqlMessage(errInside);

      if (msg.toLowerCase().includes('yetersiz')) {
        return res.status(400).send('Yetersiz stok.');
      }

      return res.status(400).send(msg);
    }

  } catch (errOutside) {
    return res.status(500).send(errOutside.message);
  }
});

// ... Mevcut kodların arasına ekle ...

// Müşterinin kendi siparişlerini getir
router.get('/my-orders', async (req, res) => {
    const { customerId } = req.query;

    if (!customerId) {
        return res.status(400).send('CustomerID gerekli.');
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('CustomerID', sql.Int, customerId)
            .execute('sp_GetCustomerOrders');

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Siparişler getirilemedi: ' + err.message);
    }
});
// Sipariş detaylarını getir
router.get('/details/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('OrderID', sql.Int, orderId)
            .execute('sp_GetOrderDetails');

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Detaylar getirilemedi.');
    }
});
/* -------------------------------------------------- */

module.exports = router;
