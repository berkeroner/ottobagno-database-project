const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

// GET /api/products/classes
router.get('/classes', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().query(`
      SELECT ClassID, ClassName
      FROM ProductClass
      ORDER BY ClassName
    `);
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// GET /api/products/collections
router.get('/collections', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().query(`
      SELECT CollectionID, CollectionName
      FROM ProductCollection
      ORDER BY CollectionName
    `);
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// GET /api/products/filtered?classId=1&collectionId=2
router.get('/filtered', async (req, res) => {
  const classId = req.query.classId ? parseInt(req.query.classId) : null;
  const collectionId = req.query.collectionId ? parseInt(req.query.collectionId) : null;

  try {
    const pool = await sql.connect(config);

    const request = pool.request();
    request.input('ClassID', sql.Int, classId);
    request.input('CollectionID', sql.Int, collectionId);

    const r = await request.query(`
      SELECT TOP (500)
        ProductCode, ProductName, SalesPrice, StockQuantity, ClassID, CollectionID
      FROM dbo.Product
      WHERE (@ClassID IS NULL OR ClassID = @ClassID)
        AND (@CollectionID IS NULL OR CollectionID = @CollectionID)
      ORDER BY ProductName
    `);

    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;
