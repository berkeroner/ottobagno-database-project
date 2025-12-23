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

// ✅ Employee add (SP: sp_AddEmployee)
router.post('/employees/add', async (req, res) => {
  const { firstName, lastName, role, phoneNumber, email } = req.body;
  if(!firstName || !lastName || !role || !phoneNumber || !email) {
    return res.status(400).send('Eksik alan var.');
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('FirstName', sql.NVarChar(50), firstName)
      .input('LastName', sql.NVarChar(50), lastName)
      .input('Role', sql.NVarChar(50), role)
      .input('PhoneNumber', sql.NVarChar(20), phoneNumber)
      .input('Email', sql.NVarChar(250), email)
      .execute('sp_AddEmployee');

    res.json({ ok:true });
  } catch(e) {
    res.status(400).send(e.message);
  }
});

// ✅ Employee delete (SP: sp_DeleteEmployee)
router.post('/employees/delete', async (req, res) => {
  const { employeeId } = req.body;
  if(!employeeId) return res.status(400).send('employeeId zorunlu.');

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('EmployeeID', sql.Int, employeeId)
      .execute('sp_DeleteEmployee');

    res.json({ ok:true });
  } catch(e) {
    res.status(400).send(e.message);
  }
});

// ✅ Purchase orders list (SP: sp_ListPurchaseOrders)
router.get('/purchase-orders', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().execute('sp_ListPurchaseOrders');
    res.json(r.recordset);
  } catch(e) {
    res.status(500).send(e.message);
  }
});

// ✅ Create purchase order with details
router.post('/purchase-orders/create', async (req, res) => {
  const { supplierId, employeeId, items } = req.body;
  if(!supplierId || !employeeId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send('Eksik alan var.');
  }

  try {
    const pool = await sql.connect(config);

    // 1) create purchase order
    const created = await pool.request()
      .input('SupplierID', sql.Int, supplierId)
      .input('EmployeeID', sql.Int, employeeId)
      .execute('sp_CreatePurchaseOrder');

    const purchaseOrderId = created.recordset?.[0]?.NewPurchaseOrderID;
    if(!purchaseOrderId) throw new Error('PurchaseOrderID alınamadı.');

    // 2) add details
    for (const it of items) {
      if(!it.materialId || !it.quantity || it.unitPrice == null) {
        throw new Error('Item alanları eksik.');
      }

      await pool.request()
        .input('PurchaseOrderID', sql.Int, purchaseOrderId)
        .input('MaterialID', sql.Int, it.materialId)
        .input('Quantity', sql.Int, it.quantity)
        .input('UnitPrice', sql.Decimal(10,2), it.unitPrice)
        .execute('sp_AddPurchaseOrderDetailAndRecalc'); // aşağıda SQL'de oluşturacağız
    }

    res.json({ ok:true, purchaseOrderId });
  } catch(e) {
    res.status(400).send(e.message);
  }
});

// ✅ Ürünleri listele (SP: sp_ListProducts) - search opsiyonel
router.get('/products', async (req, res) => {
  const search = req.query.search || null;

  try {
    const pool = await sql.connect(config);
    const r = await pool.request()
      .input('Search', sql.NVarChar(100), search)
      .execute('sp_ListProducts');

    res.json(r.recordset);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ... Diğer rotaların altına ekle ...

// 1. Bir ürünün reçetesini getir (Frontend'de göstermek için)
router.get('/production/bom/:productCode', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const r = await pool.request()
            .input('ProductCode', sql.NVarChar(20), req.params.productCode)
            .execute('sp_GetProductBOM');
        res.json(r.recordset);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// 2. Üretimi Gerçekleştir
router.post('/production/produce', async (req, res) => {
    const { productCode, quantity } = req.body;
    
    if (!productCode || !quantity || quantity <= 0) {
        return res.status(400).send("Invalid data.");
    }

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('ProductCode', sql.NVarChar(20), productCode)
            .input('ProductionQty', sql.Int, quantity)
            .execute('sp_ExecuteProduction'); // SQL prosedürünü çağır

        res.json({ ok: true, message: "Production was successfully completed, and stock levels have been updated." });
    } catch (e) {
        // SQL'den gelen "Yetersiz Hammadde" hatasını burası yakalar
        res.status(400).send(e.message); 
    }
});
// routes/adminRoutes.js içine ekle:

// 1. Tedarikçileri Listele
router.get('/suppliers', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const r = await pool.request().query('SELECT SupplierID, CompanyName FROM Supplier');
        res.json(r.recordset);
    } catch (e) { res.status(500).send(e.message); }
});

// 2. Hammaddeleri Listele
router.get('/raw-materials', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const r = await pool.request().query('SELECT MaterialID, MaterialName, StockQuantity, Unit FROM RawMaterial');
        res.json(r.recordset);
    } catch (e) { res.status(500).send(e.message); }
});

// 3. Ürünleri Listele (Üretim sekmesi için)
// Zaten /products rotan varsa onu kullanırız, yoksa bunu ekle:
router.get('/products-simple', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const r = await pool.request().query('SELECT ProductCode, ProductName, StockQuantity FROM Product');
        res.json(r.recordset);
    } catch (e) { res.status(500).send(e.message); }
});
// adminRoutes.js dosyasının içine ekle:

// ✅ Hammadde Siparişi (Tarihli ve Otomatik Fiyatlı Yeni Versiyon)
// routes/adminRoutes.js dosyasındaki ilgili kısmı bununla değiştir:

// --- YENİ HAMMADDE SİPARİŞ ROTASI ---
router.post('/purchase', async (req, res) => {
    // 1. Frontend'den gelen veriyi konsola yaz (Hata ayıklamak için)
    console.log("📥 Gelen Sipariş İsteği:", req.body);

    const { supplierId, employeeId, materialId, quantity, expectedDate } = req.body;

    // 2. Veri Kontrolü
    if (!supplierId || !materialId || !quantity || !expectedDate) {
        console.error("❌ Eksik Veri Hatası");
        return res.status(400).send("Eksik bilgi: Lütfen tüm alanların doluluğunu kontrol edin.");
    }

    try {
        const pool = await sql.connect(config);

        // 3. SQL Prosedürünü Çağır
        // Buradaki input isimleri (SupplierID vb.) SQL'deki @SupplierID ile EŞLEŞMELİDİR.
        await pool.request()
            .input('SupplierID', sql.Int, supplierId)
            .input('EmployeeID', sql.Int, employeeId || 1) // Eğer employeeId yoksa 1 (Admin) kullan
            .input('MaterialID', sql.Int, materialId)
            .input('Quantity', sql.Int, quantity)
            .input('ExpectedDate', sql.Date, expectedDate) // Tarih formatı YYYY-MM-DD olmalı
            .execute('sp_CreatePurchaseOrder');
        
        console.log("✅ Sipariş Veritabanına İşlendi.");
        res.json({ message: 'Sipariş başarıyla oluşturuldu.' });

    } catch (e) {
        // 4. Hatanın asıl sebebini terminale yaz
        console.error("🔥 SQL HATASI DETAYI:", e);
        
        // Frontend'e hatayı gönder
        res.status(500).send("Sunucu Hatası: " + e.message);
    }
});