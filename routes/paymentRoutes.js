const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

function extractSqlMessage(err) {
  return (
    err?.originalError?.info?.message ||
    err?.originalError?.message ||
    err?.message ||
    'Ödeme alınamadı.'
  );
}

// Ödeme ekle
router.post('/pay', async (req, res) => {
  const { orderId, paymentMethod, amount } = req.body;

  if (!orderId || !paymentMethod || amount == null) {
    return res.status(400).send('orderId / paymentMethod / amount zorunlu.');
  }

  try {
    const pool = await sql.connect(config);

    await pool.request()
      .input('OrderID', sql.Int, parseInt(orderId))
      .input('PaymentMethod', sql.NVarChar(30), String(paymentMethod))
      .input('Amount', sql.Decimal(12, 2), Number(amount))
      .execute('sp_AddPayment');

    // (Opsiyonel) ödeme sonrası order durumunu göstermek için çekelim
    const statusResult = await pool.request()
      .input('OrderID', sql.Int, parseInt(orderId))
      .query('SELECT OrderID, OrderStatus, TotalAmount FROM SalesOrder WHERE OrderID = @OrderID');

    res.json({
      message: 'Ödeme kaydedildi.',
      order: statusResult.recordset?.[0] || null
    });
  } catch (e) {
    const msg = extractSqlMessage(e);
    res.status(400).send(msg);
  }
});

module.exports = router;
