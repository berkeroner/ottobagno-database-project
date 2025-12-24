const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

function extractSqlMessage(err) {
  return (
    err?.originalError?.info?.message ||
    err?.originalError?.message ||
    err?.message ||
    'Payment operation failed.'
  );
}

// PAYMENT FOR AN ORDER

router.post('/pay', async (req, res) => {
  const { orderId, paymentMethod, amount } = req.body;

  if (!orderId || !paymentMethod || amount == null) {
    return res.status(400).send('There are missing fields.');
  }

  try {
    const pool = await sql.connect(config);

    await pool.request()
      .input('OrderID', sql.Int, parseInt(orderId))
      .input('PaymentMethod', sql.NVarChar(30), String(paymentMethod))
      .input('Amount', sql.Decimal(12, 2), Number(amount))
      .execute('sp_AddPayment');

    const statusResult = await pool.request()
      .input('OrderID', sql.Int, parseInt(orderId))
      .execute('sp_GetSalesOrderStatus');

    res.json({
      message: 'Payment saved.',
      order: statusResult.recordset?.[0] || null
    });
  } catch (e) {
    const msg = extractSqlMessage(e);
    res.status(400).send(msg);
  }
});

module.exports = router;
