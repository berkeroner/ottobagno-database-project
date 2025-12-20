const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

// Customer login (FirstName + LastName)
router.post('/login', async (req, res) => {
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).send('İsim ve soyisim zorunlu.');
  }

  try {
    const pool = await sql.connect(config);

    const r = await pool.request()
      .input('FirstName', sql.NVarChar(50), firstName.trim())
      .input('LastName', sql.NVarChar(50), lastName.trim())
      .query(`
        SELECT TOP 1 CustomerID, FirstName, LastName
        FROM Customer
        WHERE FirstName = @FirstName AND LastName = @LastName
        ORDER BY CustomerID DESC
      `);

    if (r.recordset.length === 0) {
      return res.status(404).send('Müşteri bulunamadı.');
    }

    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;
