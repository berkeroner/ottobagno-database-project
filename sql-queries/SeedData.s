
USE OttoBagno;
GO

INSERT INTO Country (CountryName, CurrencyCode, ShippingZone) VALUES
('Turkey','TRY','Domestic'),
('Germany','EUR','EU'),
('France','EUR','EU'),
('Italy','EUR','EU'),
('Spain','EUR','EU'),
('United Kingdom','GBP','EU'),
('United States','USD','International'),
('Canada','CAD','International'),
('Japan','JPY','International'),
('Australia','AUD','International');

INSERT INTO DomesticRegion (RegionName, ShippingCostMultiplier) VALUES
('Marmara',1.00),
('Aegean',1.10),
('Central Anatolia',1.15),
('Mediterranean',1.20),
('Black Sea',1.25);

INSERT INTO ProductClass (ClassName, SubClassName) VALUES
('Bathroom','Sink'),
('Bathroom','Toilet'),
('Kitchen','Sink'),
('Accessory','Mirror'),
('Accessory','Shelf');

INSERT INTO ProductCollection (CollectionName) VALUES
('Modern Line'),
('Classic Line'),
('Premium Line'),
('Eco Line'),
('Luxury Line');

INSERT INTO ProductionStep (StepName) VALUES
('Cutting'),
('Molding'),
('Assembly'),
('Painting'),
('Quality Control');

INSERT INTO Employee (FirstName, LastName, Role, PhoneNumber, Email) VALUES
('Ahmet','Yilmaz','Sales','0500000001','ahmet@company.com'),
('Ayse','Demir','Sales','0500000002','ayse@company.com'),
('Mehmet','Kaya','Production','0500000003','mehmet@company.com'),
('Elif','Acar','Production','0500000004','elif@company.com'),
('Can','Ozkan','Purchasing','0500000005','can@company.com'),
('Merve','Sari','Sales','0500000006','merve@company.com'),
('Burak','Celik','Production','0500000007','burak@company.com'),
('Zeynep','Aslan','Purchasing','0500000008','zeynep@company.com'),
('Emre','Tas','Sales','0500000009','emre@company.com'),
('Selin','Kurt','Production','0500000010','selin@company.com');

INSERT INTO Customer (FirstName, LastName, PhoneNumber, Email, Address) VALUES
('Ali','Kara','0530000001','ali1@gmail.com','Istanbul'),
('Veli','Yildiz','0530000002','veli2@gmail.com','Ankara'),
('Ayhan','Demir','0530000003','ayhan3@gmail.com','Izmir'),
('Fatma','Aydin','0530000004','fatma4@gmail.com','Bursa'),
('Kemal','Arslan','0530000005','kemal5@gmail.com','Antalya'),
('John','Smith','0530000006','john6@gmail.com','Berlin'),
('Marie','Dubois','0530000007','marie7@gmail.com','Paris'),
('Marco','Rossi','0530000008','marco8@gmail.com','Rome'),
('Carlos','Garcia','0530000009','carlos9@gmail.com','Madrid'),
('Emma','Brown','0530000010','emma10@gmail.com','London'),
('Lucas','Muller','0530000011','lucas11@gmail.com','Munich'),
('Sophie','Martin','0530000012','sophie12@gmail.com','Lyon'),
('Paolo','Bianchi','0530000013','paolo13@gmail.com','Milan'),
('Anna','Nowak','0530000014','anna14@gmail.com','Warsaw'),
('David','Wilson','0530000015','david15@gmail.com','New York'),
('Sarah','Taylor','0530000016','sarah16@gmail.com','Boston'),
('Michael','Lee','0530000017','michael17@gmail.com','Toronto'),
('Linda','White','0530000018','linda18@gmail.com','Vancouver'),
('Kenji','Tanaka','0530000019','kenji19@gmail.com','Tokyo'),
('Yuki','Sato','0530000020','yuki20@gmail.com','Osaka'),
('Oliver','Clark','0530000021','oliver21@gmail.com','Sydney'),
('Noah','Walker','0530000022','noah22@gmail.com','Melbourne'),
('Isabella','Lopez','0530000023','isabella23@gmail.com','Barcelona'),
('Mia','Hernandez','0530000024','mia24@gmail.com','Seville'),
('Ethan','Young','0530000025','ethan25@gmail.com','Chicago');

INSERT INTO DomesticCustomer (CustomerID, RegionID) VALUES
(1,1),(2,2),(3,3),(4,4),(5,5),
(6,1),(7,2),(8,3),(9,4),(10,5),
(11,1),(12,2);

INSERT INTO InternationalCustomer (CustomerID, CountryID) VALUES
(13,2),(14,3),(15,4),(16,5),(17,6),
(18,7),(19,8),(20,9),(21,10),
(22,7),(23,6),(24,5),(25,4);

INSERT INTO Supplier (CompanyName, ContactPerson, PhoneNumber, Email, Address) VALUES
('SteelCo','Adam Steel','0212000001','steel@sup.com','Germany'),
('GlassWorks','Laura Glass','0212000002','glass@sup.com','France'),
('Ceramix','Paul Stone','0212000003','ceramix@sup.com','Italy'),
('EcoRaw','Marta Green','0212000004','eco@sup.com','Spain'),
('MetalPro','John Iron','0212000005','metal@sup.com','USA'),
('AsiaMat','Ken Wu','0212000006','asia@sup.com','China'),
('NordicSup','Erik Snow','0212000007','nordic@sup.com','Sweden'),
('GlobalParts','Anna Global','0212000008','global@sup.com','UK'),
('PrimeSupply','Tom Prime','0212000009','prime@sup.com','Canada'),
('RawSource','Ali Source','0212000010','raw@sup.com','Turkey');

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
('P025','Premium Toilet',3200,'White',12,2,5);

INSERT INTO RawMaterial (MaterialName, UnitPrice, StockQuantity, SafetyStockLevel) VALUES
('Steel',50,1000,200),
('Glass',40,800,150),
('Ceramic',60,900,200),
('Plastic',20,1200,300),
('Paint White',15,500,100),
('Paint Black',15,400,100),
('Paint Silver',18,350,80),
('Glue',10,600,120),
('Screws',5,2000,500),
('Packaging',8,1500,300),
('Electronics',120,200,50),
('LED Strip',30,300,70),
('Stone',70,400,90),
('Wood',25,700,150),
('Rubber',12,600,120),
('Copper',55,500,100),
('Aluminum',45,800,180),
('Glass Panel',65,300,60),
('Steel Rod',52,450,90),
('Mirror Glass',75,250,50),
('Sealant',9,550,100),
('Polish',11,480,90),
('Foam',14,520,110),
('Sensor',95,150,40),
('Cable',7,900,200);

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
('SN-01',10,24,6),('CB-01',2,25,10);

INSERT INTO BillOfMaterials (ProductCode, MaterialID, RequiredQuantity) VALUES
('P001',1,2),('P001',5,1),
('P002',1,2),('P002',6,1),
('P003',3,3),('P003',5,1),
('P004',3,3),('P004',6,1),
('P005',1,2),('P005',2,2),
('P006',2,1),('P006',20,1),
('P007',2,1),('P007',20,1),
('P008',14,2),('P009',14,2),
('P010',13,3),('P011',4,2),
('P012',3,3),('P013',20,2),
('P014',14,2),('P015',1,3),
('P016',11,2),('P017',20,1),
('P018',18,2);



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
