const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

router.post('/login', async (req, res) => {
  const { firstName, lastName, email } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).send('Missing fields.');
  }

  try {
    const pool = await sql.connect(config);

    const r = await pool.request()
      .input('FirstName', sql.NVarChar(50), firstName.trim())
      .input('LastName', sql.NVarChar(50), lastName.trim())
      .input('Email', sql.NVarChar(100), email.trim())
      .execute('sp_LoginCustomer');

    if (!r.recordset || r.recordset.length === 0) {
      return res.status(404).send('Customer not found or invalid credentials.');
    }

    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).send(e.message);
  }
});


// REGISTER
router.post('/register', async (req, res) => {
  const { firstName, lastName, phoneNumber, email, address, customerType, regionId, countryId } = req.body;

  if (!firstName || !lastName || !phoneNumber || !email || !address || !customerType) {
    return res.status(400).send('Missing fields.');
  }

  try {
    const pool = await sql.connect(config);

    const insertRes = await pool.request()
      .input('FirstName', sql.NVarChar(50), firstName)
      .input('LastName', sql.NVarChar(50), lastName)
      .input('PhoneNumber', sql.NVarChar(20), phoneNumber)
      .input('Email', sql.NVarChar(100), email)
      .input('Address', sql.NVarChar(250), address)
      .execute('sp_AddCustomer');

    const newId = insertRes.recordset[0]?.NewID;
    if (!newId) throw new Error("Registration failed.");

    if (customerType === 'domestic') {
      if (!regionId) throw new Error("Region ID required for domestic.");
      await pool.request()
        .input('CustomerID', sql.Int, newId)
        .input('RegionID', sql.Int, regionId)
        .execute('sp_AddDomesticCustomer');
    } else if (customerType === 'international') {
      if (!countryId) throw new Error("Country ID required for international.");
      await pool.request()
        .input('CustomerID', sql.Int, newId)
        .input('CountryID', sql.Int, countryId)
        .execute('sp_AddInternationalCustomer');
    }

    res.json({ ok: true, customerId: newId });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// UPDATE PROFILE
router.post('/update', async (req, res) => {
  const { customerId, firstName, lastName, phoneNumber, email, address } = req.body;

  if (!customerId || !firstName || !lastName) {
    return res.status(400).send("Missing fields.");
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('FirstName', sql.NVarChar(50), firstName)
      .input('LastName', sql.NVarChar(50), lastName)
      .input('PhoneNumber', sql.NVarChar(20), phoneNumber)
      .input('Email', sql.NVarChar(100), email)
      .input('Address', sql.NVarChar(250), address)
      .execute('sp_UpdateCustomer');

    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// GET ME
router.get('/me/:id', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request()
      .input('CustomerID', sql.Int, req.params.id)
      .execute('sp_GetCustomer');

    if (r.recordset.length === 0) return res.status(404).send("User not found.");
    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// GET REGIONS
router.get('/regions', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().query('SELECT RegionID, RegionName FROM DomesticRegion');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// GET COUNTRIES
router.get('/countries', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().query('SELECT CountryID, CountryName FROM Country');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;