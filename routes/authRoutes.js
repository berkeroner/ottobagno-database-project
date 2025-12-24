const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

router.post('/login', async (req, res) => {
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).send('There are missing fields.');
  }

  try {
    const pool = await sql.connect(config);

    const r = await pool.request()
      .input('FirstName', sql.NVarChar(50), firstName.trim())
      .input('LastName', sql.NVarChar(50), lastName.trim())
      .execute('sp_LoginCustomer');

    if (!r.recordset || r.recordset.length === 0) {
      return res.status(404).send('Customer not found.');
    }

    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;
