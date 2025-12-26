const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

function extractSqlMessage(err) {
  return (
    err?.originalError?.info?.message ||
    err?.originalError?.message ||
    err?.message ||
    'Order creation failed.'
  );
}

// CHECKOUT & PAY

router.post('/checkout-pay', async (req, res) => {
  const { customerId, usedCurrency, countryId, paymentMethod, items } = req.body;

  if (!customerId || !countryId || !usedCurrency || !paymentMethod) {
    return res.status(400).send('There are missing fields.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send('Empty cart.');
  }

  try {
    const pool = await sql.connect(config);
    const tx = new sql.Transaction(pool);

    await tx.begin();

    try {
      const orderResult = await new sql.Request(tx)
        .input('CustomerID', sql.Int, customerId)
        .input('SalesEmployeeID', sql.Int, null)
        .input('UsedCurrency', sql.Char(3), usedCurrency)
        .input('CountryID', sql.Int, countryId)
        .execute('sp_CreateSalesOrder');

      const newOrderId = orderResult.recordset[0].NewOrderID;
      if (!newOrderId) throw new Error('Order creation failed.');

      for (const it of items) {
        await new sql.Request(tx)
          .input('OrderID', sql.Int, newOrderId)
          .input('ProductCode', sql.NVarChar(20), it.productCode)
          .input('Quantity', sql.Int, it.quantity)
          .input('UnitPrice', sql.Decimal(10, 2), it.unitPrice)
          .execute('sp_AddOrderDetail');
      }

      await new sql.Request(tx)
        .input('OrderID', sql.Int, newOrderId)
        .execute('sp_RecalculateSalesOrderTotal');

      const totalRes = await new sql.Request(tx)
        .input('OrderID', sql.Int, newOrderId)
        .execute('sp_GetOrderTotal');

      const totalAmount = totalRes.recordset[0].TotalAmount;

      await new sql.Request(tx)
        .input('OrderID', sql.Int, newOrderId)
        .input('PaymentMethod', sql.NVarChar(30), paymentMethod)
        .input('Amount', sql.Decimal(12, 2), totalAmount)
        .execute('sp_AddPayment');

      await tx.commit();

      return res.json({
        orderId: newOrderId,
        totalAmount,
        message: 'Order placed successfully.'
      });

    } catch (errInside) {
      await tx.rollback();

      const msg = extractSqlMessage(errInside);

      if (msg.toLowerCase().includes('not enough')) {
        return res.status(400).send('Not enough!');
      }

      return res.status(400).send(msg);
    }

  } catch (errOutside) {
    return res.status(500).send(errOutside.message);
  }
});

// LIST ORDERS

router.get('/my-orders', async (req, res) => {
  const { customerId } = req.query;

  if (!customerId) {
    return res.status(400).send('The customerId is required.');
  }

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .execute('sp_GetCustomerOrders');

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send('Orders not retrieved: ' + err.message);
  }
});

// ORDER DETAILS

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
    res.status(500).send('Order details not retrieved: ' + err.message);
  }
});

module.exports = router;
