const express = require('express');
const router = express.Router();
const { sql, config } = require('../db');

// LIST PRODUCT CLASSES

router.get('/classes', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListProductClasses');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// LIST PRODUCT COLLECTIONS

router.get('/collections', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListProductCollections');
    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});


// LIST FILTERED PRODUCTS

router.get('/filtered', async (req, res) => {
  const classId = req.query.classId ? parseInt(req.query.classId) : null;
  const collectionId = req.query.collectionId ? parseInt(req.query.collectionId) : null;

  try {
    const pool = await sql.connect(config);

    const r = await pool.request()
      .input('ClassID', sql.Int, classId)
      .input('CollectionID', sql.Int, collectionId)
      .execute('sp_ListFilteredProducts');

    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// BEST SELLING PRODUCTS (from dbo.vBestSellingProducts)
router.get('/best-sellers', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const r = await pool.request().query(`
      SELECT TOP 3
        ProductCode,
        ProductName,
        TotalQtySold
      FROM dbo.vBestSellingProducts
      ORDER BY TotalQtySold DESC;
    `);

    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});



module.exports = router;
