USE OttoBagno;
GO

-- =============================================================
-- Cleaning
-- =============================================================

DELETE FROM dbo.ProductionTracking;
DELETE FROM dbo.ProductionOrder;
DELETE FROM dbo.PurchaseOrderDetail;
DELETE FROM dbo.PurchaseOrder;
DELETE FROM dbo.Payment;
DELETE FROM dbo.OrderDetail;
DELETE FROM dbo.SalesOrder;

DELETE FROM dbo.BillOfMaterials;
DELETE FROM dbo.MaterialSupplier;
DELETE FROM dbo.InternationalCustomer;
DELETE FROM dbo.DomesticCustomer;

DELETE FROM dbo.Product; 
DELETE FROM dbo.RawMaterial;
DELETE FROM dbo.Supplier;
DELETE FROM dbo.Customer;
DELETE FROM dbo.Employee;

DELETE FROM dbo.ProductionStep;
DELETE FROM dbo.ProductCollection;
DELETE FROM dbo.ProductClass;
DELETE FROM dbo.DomesticRegion;
DELETE FROM dbo.Country;

GO
-- ---------------------------------------------------------
-- TABLE: COUNTRY
-- ---------------------------------------------------------
SET IDENTITY_INSERT dbo.Country ON;
INSERT INTO Country (CountryID, CountryName, CurrencyCode, ShippingZone) VALUES
(1, 'Turkey','TRY','Domestic'),
(2, 'Germany','EUR','EU'),
(3, 'France','EUR','EU'),
(4, 'Italy','EUR','EU'),
(5, 'Spain','EUR','EU'),
(6, 'United Kingdom','GBP','EU'),
(7, 'United States','USD','International'),
(8, 'Canada','CAD','International'),
(9, 'Japan','JPY','International'),
(10, 'Australia','AUD','International'),
(11, 'Netherlands','EUR','EU'),
(12, 'Belgium','EUR','EU'),
(13, 'Sweden','SEK','EU'),
(14, 'China','CNY','International'),
(15, 'South Korea','KRW','International'),
(16, 'Brazil','BRL','International'),
(17, 'Russia','RUB','International'),
(18, 'Austria','EUR','EU'),
(19, 'Switzerland','CHF','EU'),
(20, 'Portugal','EUR','EU'),
(21, 'Poland','PLN','EU'),
(22, 'Norway','NOK','International'),
(23, 'Finland','EUR','EU'),
(24, 'Denmark','DKK','EU'),
(25, 'Ireland','EUR','EU'),
(26, 'India','INR','International'),
(27, 'Singapore','SGD','International'),
(28, 'New Zealand','NZD','International'),
(29, 'Mexico','MXN','International'),
(30, 'Argentina','ARS','International');
SET IDENTITY_INSERT dbo.Country OFF;

-- ---------------------------------------------------------
-- TABLE: DOMESTIC REGION
-- ---------------------------------------------------------
SET IDENTITY_INSERT dbo.DomesticRegion ON;
INSERT INTO DomesticRegion (RegionID, RegionName, ShippingCostMultiplier) VALUES
(1, 'Marmara',1.00),
(2, 'Aegean',1.10),
(3, 'Central Anatolia',1.15),
(4, 'Mediterranean',1.20),
(5, 'Black Sea',1.25),
(6, 'Eastern Anatolia',1.35),
(7, 'Southeastern Anatolia',1.30);
SET IDENTITY_INSERT dbo.DomesticRegion OFF;

-- ---------------------------------------------------------
-- TABLE: PRODUCT CLASS
-- ---------------------------------------------------------
SET IDENTITY_INSERT dbo.ProductClass ON;
INSERT INTO ProductClass (ClassID, ClassName, SubClassName) VALUES
(1, 'Bathroom','Sink'),
(2, 'Bathroom','Toilet'),
(3, 'Kitchen','Sink'),
(4, 'Accessory','Mirror'),
(5, 'Accessory','Shelf'),
(6, 'Bathroom','Bathtub'),
(7, 'Bathroom','Shower'),
(8, 'Kitchen','Faucet'),
(9, 'Accessory','Towel Rack'),
(10, 'Spare Parts','Valve'),
(11, 'Spare Parts','Hinge'),
(12, 'Accessory','Soap Dish'),
(13, 'Accessory','Toothbrush Holder'),
(14, 'Bathroom','Jacuzzi'),
(15, 'Kitchen','Waste Disposer');
SET IDENTITY_INSERT dbo.ProductClass OFF;

-- ---------------------------------------------------------
-- TABLE: PRODUCT COLLECTION
-- ---------------------------------------------------------
SET IDENTITY_INSERT dbo.ProductCollection ON;
INSERT INTO ProductCollection (CollectionID, CollectionName) VALUES
(1, 'Modern Line'),
(2, 'Classic Line'),
(3, 'Premium Line'),
(4, 'Eco Line'),
(5, 'Luxury Line'),
(6, 'Industrial Line'),
(7, 'Minimalist Line'),
(8, 'Vintage Line'),
(9, 'Bohemian Style'),
(10, 'Scandinavian'),
(11, 'Industrial Chic'),
(12, 'Art Deco'),
(13, 'Futuristic'),
(14, 'Rustic Farmhouse');
SET IDENTITY_INSERT dbo.ProductCollection OFF;

-- ---------------------------------------------------------
-- TABLE: PRODUCTION STEP
-- ---------------------------------------------------------
SET IDENTITY_INSERT dbo.ProductionStep ON;
INSERT INTO ProductionStep (StepID, StepName) VALUES
(1, 'Cutting'),
(2, 'Molding'),
(3, 'Assembly'),
(4, 'Painting'),
(5, 'Quality Control'),
(6, 'Polishing'),
(7, 'Packaging'),
(8, 'Drying');
SET IDENTITY_INSERT dbo.ProductionStep OFF;

-- ---------------------------------------------------------
-- TABLE: EMPLOYEE
-- ---------------------------------------------------------
SET IDENTITY_INSERT dbo.Employee ON;
INSERT INTO Employee (EmployeeID, FirstName, LastName, Role, PhoneNumber, Email) VALUES
(1, 'Ahmet','Yilmaz','Sales','0500000001','ahmet@company.com'),
(2, 'Ayse','Demir','Sales','0500000002','ayse@company.com'),
(3, 'Mehmet','Kaya','Production','0500000003','mehmet@company.com'),
(4, 'Elif','Acar','Production','0500000004','elif@company.com'),
(5, 'Can','Ozkan','Purchasing','0500000005','can@company.com'),
(6, 'Merve','Sari','Sales','0500000006','merve@company.com'),
(7, 'Burak','Celik','Production','0500000007','burak@company.com'),
(8, 'Zeynep','Aslan','Purchasing','0500000008','zeynep@company.com'),
(9, 'Emre','Tas','Sales','0500000009','emre@company.com'),
(10, 'Selin','Kurt','Production','0500000010','selin@company.com'),
(11, 'Murat','Koc','Sales','0500000011','murat@company.com'),
(12, 'Esra','Yildiz','Production','0500000012','esra@company.com'),
(13, 'Hakan','Simsek','Warehouse','0500000013','hakan@company.com'),
(14, 'Deniz','Kara','Logistics','0500000014','deniz@company.com'),
(15, 'Cem','Ozturk','Manager','0500000015','cem@company.com'),
(16, 'Pinar','Gunes','Sales','0500000016','pinar@company.com'),
(17, 'Tolga','Bulut','Production','0500000017','tolga@company.com'),
(18, 'Yasemin','Er','Purchasing','0500000018','yasemin@company.com'),
(19, 'Okan','Sen','Maintenance','0500000019','okan@company.com'),
(20, 'Leyla','Can','Quality','0500000020','leyla@company.com'),
(21, 'Kemal','Sunal','HR','0500000021','kemal.hr@company.com'),
(22, 'Sener','Sen','Finance','0500000022','sener.fin@company.com'),
(23, 'Adile','Nasit','Admin','0500000023','adile.adm@company.com'),
(24, 'Halit','Akcatepe','IT','0500000024','halit.it@company.com'),
(25, 'Munir','Ozkul','Manager','0500000025','munir.mgr@company.com'),
(26, 'Tarik','Akan','Sales','0500000026','tarik.sales@company.com'),
(27, 'Cuneyt','Arkin','Security','0500000027','cuneyt.sec@company.com'),
(28, 'Fatma','Girik','Quality','0500000028','fatma.qual@company.com');
SET IDENTITY_INSERT dbo.Employee OFF;

-- ---------------------------------------------------------
-- TABLE: SUPPLIER
-- ---------------------------------------------------------
SET IDENTITY_INSERT dbo.Supplier ON;
INSERT INTO Supplier (SupplierID, CompanyName, ContactPerson, PhoneNumber, Email, Address) VALUES
(1, 'SteelCo','Adam Steel','0212000001','steel@sup.com','Germany'),
(2, 'GlassWorks','Laura Glass','0212000002','glass@sup.com','France'),
(3, 'Ceramix','Paul Stone','0212000003','ceramix@sup.com','Italy'),
(4, 'EcoRaw','Marta Green','0212000004','eco@sup.com','Spain'),
(5, 'MetalPro','John Iron','0212000005','metal@sup.com','USA'),
(6, 'AsiaMat','Ken Wu','0212000006','asia@sup.com','China'),
(7, 'NordicSup','Erik Snow','0212000007','nordic@sup.com','Sweden'),
(8, 'GlobalParts','Anna Global','0212000008','global@sup.com','UK'),
(9, 'PrimeSupply','Tom Prime','0212000009','prime@sup.com','Canada'),
(10, 'RawSource','Ali Source','0212000010','raw@sup.com','Turkey'),
(11, 'ChemCorp','Hans Chem','0212000011','chem@sup.com','Germany'),
(12, 'WoodWorks','Sven Wood','0212000012','wood@sup.com','Sweden'),
(13, 'TechComponents','Mike Tech','0212000013','tech@sup.com','Japan'),
(14, 'RubberFlex','Jose Rubber','0212000014','rubber@sup.com','Brazil'),
(15, 'PackMasters','Tim Box','0212000015','pack@sup.com','USA'),
(16, 'FastLogistics','John Swift','0212000016','fast@sup.com','USA'),
(17, 'SafeChem','Sarah Safe','0212000017','safe@sup.com','Germany'),
(18, 'MicroChips','Lee Min','0212000018','micro@sup.com','Korea'),
(19, 'HeavyMetals','Ivan Drago','0212000019','heavy@sup.com','Russia'),
(20, 'FineWoods','Bjorn Ironside','0212000020','fine@sup.com','Norway'),
(21, 'LuxuryPaints','Pierre Art','0212000021','lux@sup.com','France'),
(22, 'CeramicPro','Mario Tile','0212000022','tile@sup.com','Italy'),
(23, 'CheapPlastics','Wang Plastic','0212000023','cheap@sup.com','China'),
(24, 'BioPack','Emma Green','0212000024','bio@sup.com','UK'),
(25, 'SmartSensors','Elon Sensor','0212000025','smart@sup.com','USA'),
(26, 'LocalSteel','Mehmet Celik','0212000026','yerli@sup.com','Turkey'),
(27, 'AnadoluCam','Veli Cam','0212000027','cam@sup.com','Turkey');
SET IDENTITY_INSERT dbo.Supplier OFF;

-- ---------------------------------------------------------
-- TABLE: CUSTOMER
-- ---------------------------------------------------------
SET IDENTITY_INSERT dbo.Customer ON;
INSERT INTO Customer (CustomerID, FirstName, LastName, PhoneNumber, Email, Address) VALUES
(1, 'Ali','Kara','0530000001','ali1@gmail.com','Istanbul'),
(2, 'Veli','Yildiz','0530000002','veli2@gmail.com','Ankara'),
(3, 'Ayhan','Demir','0530000003','ayhan3@gmail.com','Izmir'),
(4, 'Fatma','Aydin','0530000004','fatma4@gmail.com','Bursa'),
(5, 'Kemal','Arslan','0530000005','kemal5@gmail.com','Antalya'),
(6, 'John','Smith','0530000006','john6@gmail.com','Berlin'),
(7, 'Marie','Dubois','0530000007','marie7@gmail.com','Paris'),
(8, 'Marco','Rossi','0530000008','marco8@gmail.com','Rome'),
(9, 'Carlos','Garcia','0530000009','carlos9@gmail.com','Madrid'),
(10, 'Emma','Brown','0530000010','emma10@gmail.com','London'),
(11, 'Lucas','Muller','0530000011','lucas11@gmail.com','Munich'),
(12, 'Sophie','Martin','0530000012','sophie12@gmail.com','Lyon'),
(13, 'Paolo','Bianchi','0530000013','paolo13@gmail.com','Milan'),
(14, 'Anna','Nowak','0530000014','anna14@gmail.com','Warsaw'),
(15, 'David','Wilson','0530000015','david15@gmail.com','New York'),
(16, 'Sarah','Taylor','0530000016','sarah16@gmail.com','Boston'),
(17, 'Michael','Lee','0530000017','michael17@gmail.com','Toronto'),
(18, 'Linda','White','0530000018','linda18@gmail.com','Vancouver'),
(19, 'Kenji','Tanaka','0530000019','kenji19@gmail.com','Tokyo'),
(20, 'Yuki','Sato','0530000020','yuki20@gmail.com','Osaka'),
(21, 'Oliver','Clark','0530000021','oliver21@gmail.com','Sydney'),
(22, 'Noah','Walker','0530000022','noah22@gmail.com','Melbourne'),
(23, 'Isabella','Lopez','0530000023','isabella23@gmail.com','Barcelona'),
(24, 'Mia','Hernandez','0530000024','mia24@gmail.com','Seville'),
(25, 'Ethan','Young','0530000025','ethan25@gmail.com','Chicago'),
(26, 'Osman','Yilmaz','0530000026','osman26@gmail.com','Adana'),
(27, 'Huseyin','Celik','0530000027','huseyin27@gmail.com','Gaziantep'),
(28, 'Zehra','Polat','0530000028','zehra28@gmail.com','Konya'),
(29, 'Mustafa','Koc','0530000029','mustafa29@gmail.com','Kayseri'),
(30, 'Hacer','Ozer','0530000030','hacer30@gmail.com','Eskisehir'),
(31, 'Hans','Zimmer','0530000031','hans31@gmail.com','Hamburg'),
(32, 'Klaus','Weber','0530000032','klaus32@gmail.com','Frankfurt'),
(33, 'Pierre','Moreau','0530000033','pierre33@gmail.com','Nice'),
(34, 'Giulia','Ricci','0530000034','giulia34@gmail.com','Naples'),
(35, 'Carmen','Diaz','0530000035','carmen35@gmail.com','Valencia'),
(36, 'James','Bond','0530000036','james36@gmail.com','Manchester'),
(37, 'Lars','Johansson','0530000037','lars37@gmail.com','Stockholm'),
(38, 'Wei','Zhang','0530000038','wei38@gmail.com','Shanghai'),
(39, 'Li','Wang','0530000039','li39@gmail.com','Beijing'),
(40, 'Min-Ji','Kim','0530000040','minji40@gmail.com','Seoul'),
(41, 'Diego','Silva','0530000041','diego41@gmail.com','Sao Paulo'),
(42, 'Igor','Petrov','0530000042','igor42@gmail.com','Moscow'),
(43, 'Emily','Davis','0530000043','emily43@gmail.com','Los Angeles'),
(44, 'Daniel','Martinez','0530000044','daniel44@gmail.com','Miami'),
(45, 'Grace','Anderson','0530000045','grace45@gmail.com','Seattle'),
(46, 'Liam','Thomas','0530000046','liam46@gmail.com','Liverpool'),
(47, 'Charlotte','White','0530000047','charlotte47@gmail.com','Bristol'),
(48, 'Amir','Khan','0530000048','amir48@gmail.com','Dubai'),
(49, 'Sofia','Rodriguez','0530000049','sofia49@gmail.com','Mexico City'),
(50, 'Hiroshi','Yamamoto','0530000050','hiroshi50@gmail.com','Kyoto');
SET IDENTITY_INSERT dbo.Customer OFF;

-- ---------------------------------------------------------
-- TABLO: DOMESTIC/INTERNATIONAL CUSTOMER CONNECTIONS
-- ---------------------------------------------------------
INSERT INTO DomesticCustomer (CustomerID, RegionID) VALUES
(1,1),(2,2),(3,3),(4,4),(5,5),
(6,1),(7,2),(8,3),(9,4),(10,5),
(11,1),(12,2),
(26,6),(27,7),(28,3),(29,3),(30,3);

INSERT INTO InternationalCustomer (CustomerID, CountryID) VALUES
(13,2),(14,3),(15,4),(16,5),(17,6),
(18,7),(19,8),(20,9),(21,10),
(22,7),(23,6),(24,5),(25,4),
(31,2),(32,2),(33,3),(34,4),(35,5),
(36,6),(37,13),(38,14),(39,14),(40,15),
(41,16),(42,17),(43,7),(44,7),(45,7),
(46,6),(47,6),(48,10),(49,29),(50,9);

-- ---------------------------------------------------------
-- TABLE: PRODUCTS
-- ---------------------------------------------------------
INSERT INTO Product (ProductCode, ProductName, SalesPrice, Color, StockQuantity, ClassID, CollectionID) VALUES
('P001','Sink A',1200,'White',50,1,1),
('P002','Sink B',1300,'Black',40,1,2),
('P003','Toilet A',2000,'White',30,2,1),
('P004','Toilet B',2100,'Gray',25,2,2),
('P005','Kitchen Sink A',1500,'Silver',45,3,3),
('P006','Mirror A',800,'Silver',60,4,1),
('P007','Mirror B',900,'Black',55,4,2),
('P008','Shelf A',600,'White',70,5,4),
('P009','Shelf B',650,'Black',65,5,5),
('P010','Luxury Sink',3500,'Gold',10,1,5),
('P011','Eco Sink',1100,'Green',80,1,4),
('P012','Compact Toilet',1800,'White',35,2,3),
('P013','Designer Mirror',1400,'Bronze',20,4,5),
('P014','Wall Shelf',700,'Gray',75,5,1),
('P015','Double Sink',2500,'White',15,1,3),
('P016','Smart Toilet',4000,'White',8,2,5),
('P017','Round Mirror',950,'Silver',45,4,2),
('P018','Glass Shelf',850,'Transparent',50,5,3),
('P019','Stone Sink',2200,'Gray',28,1,2),
('P020','Classic Sink',1600,'White',38,1,1),
('P021','Modern Toilet',2300,'Black',22,2,4),
('P022','LED Mirror',1700,'Black',18,4,5),
('P023','Corner Shelf',720,'White',66,5,2),
('P024','Slim Sink',1400,'White',42,1,3),
('P025','Premium Toilet',3200,'White',12,2,5),
('P026','Industrial Bathtub',5000,'Matte Black',5,6,6),
('P027','Vintage Bathtub',4500,'White',7,6,8),
('P028','Rain Shower Head',1200,'Chrome',40,7,1),
('P029','Hand Shower',600,'Chrome',60,7,2),
('P030','Kitchen Faucet Pro',1800,'Silver',30,8,3),
('P031','Smart Faucet',2200,'Black',25,8,5),
('P032','Heated Towel Rack',1500,'White',20,9,5),
('P033','Minimalist Shelf',500,'Wood',80,5,7),
('P034','Corner Bathtub',5500,'White',4,6,3),
('P035','Sensor Mirror',2000,'Silver',15,4,5),
('P036','Golden Faucet',2500,'Gold',20,8,5),
('P037','Marble Sink',2800,'Marble',10,1,5),
('P038','Eco Toilet',1900,'White',40,2,4),
('P039','Industrial Shelf',800,'Metal',55,5,6),
('P040','Vintage Mirror',1100,'Gold',30,4,8),
('P041','Square Sink',1350,'White',45,1,7),
('P042','Bidet',1200,'White',25,2,2),
('P043','Soap Dispenser',200,'Chrome',100,5,1),
('P044','Bamboo Shelf',650,'Bamboo',60,5,4),
('P045','Massage Bathtub',7000,'White',3,6,5);

-- ---------------------------------------------------------
-- TABLE: RAW MATERIAL
-- ---------------------------------------------------------
SET IDENTITY_INSERT dbo.RawMaterial ON;
INSERT INTO RawMaterial (MaterialID, MaterialName, UnitPrice, StockQuantity, SafetyStockLevel) VALUES
(1, 'Steel',50,1000,200),
(2, 'Glass',40,800,150),
(3, 'Ceramic',60,900,200),
(4, 'Plastic',20,1200,300),
(5, 'Paint White',15,500,100),
(6, 'Paint Black',15,400,100),
(7, 'Paint Silver',18,350,80),
(8, 'Glue',10,600,120),
(9, 'Screws',5,2000,500),
(10, 'Packaging',8,1500,300),
(11, 'Electronics',120,200,50),
(12, 'LED Strip',30,300,70),
(13, 'Stone',70,400,90),
(14, 'Wood',25,700,150),
(15, 'Rubber',12,600,120),
(16, 'Copper',55,500,100),
(17, 'Aluminum',45,800,180),
(18, 'Glass Panel',65,300,60),
(19, 'Steel Rod',52,450,90),
(20, 'Mirror Glass',75,250,50),
(21, 'Sealant',9,550,100),
(22, 'Polish',11,480,90),
(23, 'Foam',14,520,110),
(24, 'Sensor',95,150,40),
(25, 'Cable',7,900,200),
(26, 'Titanium',200,100,20),
(27, 'Bamboo',35,500,100),
(28, 'Marble Slab',150,100,20),
(29, 'Chrome Plating',25,400,80),
(30, 'Gold Plating',300,50,10),
(31, 'Acrylic',45,600,120),
(32, 'Brass',60,400,90),
(33, 'Silicon',15,800,200),
(34, 'Cardboard',5,2000,500),
(35, 'Resin',55,300,60);
SET IDENTITY_INSERT dbo.RawMaterial OFF;

-- ---------------------------------------------------------
-- TABLE: MATERIAL SUPPLIER
-- ---------------------------------------------------------
INSERT INTO MaterialSupplier (SupplierProductCode, LeadTimeDays, MaterialID, SupplierID) VALUES
('ST-01',7,1,1),('GL-01',5,2,2),('CE-01',6,3,3),
('PL-01',4,4,10),('PW-01',3,5,10),
('PB-01',3,6,10),('PS-01',4,7,10),
('GL-02',5,8,8),('SC-01',2,9,5),
('PK-01',3,10,9),('EL-01',10,11,5),
('LED-01',6,12,6),('STN-01',8,13,3),
('WD-01',5,14,7),('RB-01',4,15,1),
('CU-01',7,16,5),('AL-01',6,17,7),
('GP-01',9,18,2),('SR-01',7,19,1),
('MG-01',8,20,2),('SE-01',3,21,9),
('PO-01',4,22,9),('FM-01',4,23,8),
('SN-01',10,24,6),('CB-01',2,25,10),
('TI-01',15,26,5), ('BM-01',10,27,6),
('MR-01',12,28,3), ('CH-01',5,29,1),
('GD-01',14,30,1), ('AC-01',7,31,11),
('BR-01',8,32,1), ('SI-01',4,33,11),
('CD-01',2,34,15), ('RS-01',6,35,11);

-- ---------------------------------------------------------
-- TABLE: BILL OF MATERIALS
-- ---------------------------------------------------------
INSERT INTO BillOfMaterials (ProductCode, MaterialID, RequiredQuantity) VALUES
('P001',1,2),('P001',5,1), ('P002',1,2),('P002',6,1), ('P003',3,3),('P003',5,1),
('P004',3,3),('P004',6,1), ('P005',1,2),('P005',2,2), ('P006',2,1),('P006',20,1),
('P007',2,1),('P007',20,1), ('P008',14,2),('P009',14,2), ('P010',13,3),('P011',4,2),
('P012',3,3),('P013',20,2), ('P014',14,2),('P015',1,3), ('P016',11,2),('P017',20,1),
('P018',18,2), ('P026',31,10), ('P026',6,2), ('P027',31,12), ('P027',5,2),
('P028',1,1), ('P028',29,1), ('P030',1,2), ('P030',29,1), ('P031',1,2), ('P031',24,1),
('P032',17,3), ('P032',11,1), ('P033',27,4), ('P036',32,2), ('P036',30,1),
('P037',28,1), ('P039',1,5);