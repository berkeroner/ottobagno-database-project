
USE OttoBagno;
GO

CREATE TABLE Country (
    CountryID        INT IDENTITY(1,1) PRIMARY KEY,
    CountryName      NVARCHAR(100) NOT NULL,
    CurrencyCode     CHAR(3) NOT NULL,
    ShippingZone     NVARCHAR(100) NOT NULL
)

CREATE TABLE DomesticRegion (
    RegionID                 INT IDENTITY(1,1) PRIMARY KEY,
    RegionName               NVARCHAR(100) NOT NULL,
    ShippingCostMultiplier   DECIMAL(6,2) NOT NULL
    CONSTRAINT DF_DomesticRegion_ShippingCostMultiplier DEFAULT (1.00),
    CONSTRAINT CK_DomesticRegion_Multiplier CHECK (ShippingCostMultiplier > 0)
)

CREATE TABLE ProductClass (
    ClassID       INT IDENTITY(1,1) PRIMARY KEY,
    ClassName     NVARCHAR(100) NOT NULL,
    SubClassName  NVARCHAR(100) NULL
)

CREATE TABLE ProductCollection (
    CollectionID   INT IDENTITY(1,1) PRIMARY KEY,
    CollectionName NVARCHAR(100) NOT NULL UNIQUE
)

CREATE TABLE ProductionStep (
    StepID     INT IDENTITY(1,1) PRIMARY KEY,
    StepName   NVARCHAR(100) NOT NULL UNIQUE
)


CREATE TABLE Employee (
    EmployeeID     INT IDENTITY(1,1) PRIMARY KEY,
    FirstName      NVARCHAR(50) NOT NULL,
    LastName       NVARCHAR(50) NOT NULL,
    Role           NVARCHAR(50) NOT NULL,
    PhoneNumber    NVARCHAR(20) NOT NULL,
    Email          NVARCHAR(250) NOT NULL UNIQUE
)

CREATE TABLE Customer (
    CustomerID     INT IDENTITY(1,1) PRIMARY KEY,
    FirstName      NVARCHAR(50) NOT NULL,
    LastName       NVARCHAR(50) NOT NULL,
    PhoneNumber    NVARCHAR(20) NOT NULL,
    Email          NVARCHAR(100) NOT NULL UNIQUE,
    Address        NVARCHAR(250) NOT NULL
)

CREATE TABLE DomesticCustomer (
    CustomerID   INT NOT NULL PRIMARY KEY,
    RegionID     INT NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (RegionID) REFERENCES DomesticRegion(RegionID)
)

CREATE TABLE InternationalCustomer (
    CustomerID   INT NOT NULL PRIMARY KEY,
    CountryID    INT NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (CountryID) REFERENCES Country(CountryID)
)

CREATE TABLE Supplier (
    SupplierID      INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName     NVARCHAR(100) NOT NULL,
    ContactPerson   NVARCHAR(100) NULL,
    PhoneNumber     NVARCHAR(20) NULL,
    Email           NVARCHAR(100) NULL,
    Address         NVARCHAR(250) NULL
)

CREATE TABLE Product (
    ProductCode        NVARCHAR(20) PRIMARY KEY,
    ProductName        NVARCHAR(100) NOT NULL,
    SalesPrice         DECIMAL(10,2) NOT NULL,
    Color              NVARCHAR(30) NOT NULL,
    StockQuantity      INT NOT NULL CONSTRAINT DF_Product_StockQuantity DEFAULT (0),
    ClassID            INT NULL,
    CollectionID       INT NULL,
    IsActive           BIT NOT NULL DEFAULT(1),
    SalesPriceWithVAT  AS (SalesPrice * 1.20) PERSISTED,
    FOREIGN KEY (ClassID) REFERENCES ProductClass(ClassID),
    FOREIGN KEY (CollectionID) REFERENCES ProductCollection(CollectionID),
    CONSTRAINT CK_Product_SalesPrice CHECK (SalesPrice >= 0),
    CONSTRAINT CK_Product_Stock CHECK (StockQuantity >= 0)
)

CREATE TABLE RawMaterial (
    MaterialID         INT IDENTITY(1,1) PRIMARY KEY,
    MaterialName       NVARCHAR(100) NOT NULL,
    UnitPrice          DECIMAL(10,2) NOT NULL,
    StockQuantity      INT NOT NULL DEFAULT (0),
    SafetyStockLevel   INT NOT NULL DEFAULT (0),
    CONSTRAINT CK_RawMaterial_UnitPrice CHECK (UnitPrice >= 0),
    CONSTRAINT CK_RawMaterial_Stock CHECK (StockQuantity >= 0),
    CONSTRAINT CK_RawMaterial_Safety CHECK (SafetyStockLevel >= 0)
)


CREATE TABLE MaterialSupplier (
    MaterialSupplierID     INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SupplierProductCode    NVARCHAR(50) NOT NULL,
    LeadTimeDays           INT NOT NULL DEFAULT (0),
    MaterialID             INT NOT NULL,
    SupplierID             INT NOT NULL,
    UNIQUE (MaterialID, SupplierID),
    FOREIGN KEY (MaterialID) REFERENCES RawMaterial(MaterialID),
    FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID),
    CONSTRAINT CK_MaterialSupplier_LeadTime CHECK (LeadTimeDays >= 0)
)

CREATE TABLE BillOfMaterials (
    ProductCode        NVARCHAR(20) NOT NULL,
    MaterialID         INT NOT NULL,
    RequiredQuantity   DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (ProductCode, MaterialID),
    FOREIGN KEY (ProductCode) REFERENCES Product(ProductCode),
    FOREIGN KEY (MaterialID) REFERENCES RawMaterial(MaterialID),
    CONSTRAINT CK_BOM_RequiredQty CHECK (RequiredQuantity > 0)
)

CREATE TABLE SalesOrder (
    OrderID          INT IDENTITY(1,1) PRIMARY KEY,
    OrderDate        DATETIME2(0) NOT NULL DEFAULT (SYSDATETIME()),
    OrderStatus      NVARCHAR(20) NOT NULL DEFAULT ('New'),
    TotalAmount      DECIMAL(12,2) NOT NULL DEFAULT (0),
    UsedCurrency     CHAR(3) NOT NULL,
    CustomerID       INT NOT NULL,
    SalesEmployeeID  INT,
    CountryID INT NOT NULL,
    FOREIGN KEY (CountryID) REFERENCES Country(CountryID),
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (SalesEmployeeID) REFERENCES Employee(EmployeeID),
    CONSTRAINT CK_SalesOrder_Status CHECK (OrderStatus IN ('New','Paid','Shipped','Cancelled'))
)

CREATE TABLE OrderDetail (
    OrderDetailID   INT IDENTITY(1,1) PRIMARY KEY,
    Quantity        INT NOT NULL,
    UnitPrice       DECIMAL(10,2) NOT NULL,
    LineTotal       AS (Quantity * UnitPrice) PERSISTED,
    OrderID         INT NOT NULL,
    ProductCode     NVARCHAR(20) NOT NULL,
    UNIQUE (OrderID, ProductCode),
    FOREIGN KEY (OrderID) REFERENCES SalesOrder(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductCode) REFERENCES Product(ProductCode),
    CONSTRAINT CK_OrderDetail_Qty CHECK (Quantity > 0),
    CONSTRAINT CK_OrderDetail_UnitPrice CHECK (UnitPrice >= 0)
)

CREATE TABLE Payment (
    PaymentID       INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    PaymentDate     DATETIME2(0) NOT NULL CONSTRAINT DF_Payment_PaymentDate DEFAULT (SYSDATETIME()),
    PaymentMethod   NVARCHAR(30) NOT NULL,
    Amount          DECIMAL(12,2) NOT NULL,
    PaymentStatus   NVARCHAR(20) NOT NULL CONSTRAINT DF_Payment_Status DEFAULT ('Pending'),
    OrderID         INT NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES SalesOrder(OrderID) ON DELETE CASCADE,
    CONSTRAINT CK_Payment_Amount CHECK (Amount > 0),
    CONSTRAINT CK_Payment_Status CHECK (PaymentStatus IN ('Pending','Completed','Failed','Refunded'))
)

CREATE TABLE PurchaseOrder (
    PurchaseOrderID         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderDate               DATETIME2(0) NOT NULL DEFAULT (SYSDATETIME()),
    ExpectedDeliveryDate    DATE NULL,
    OrderStatus             NVARCHAR(20) NOT NULL DEFAULT ('New'),
    TotalAmount             DECIMAL(12,2) NOT NULL DEFAULT (0),
    SupplierID              INT NOT NULL,
    ResponsibleEmployeeID   INT NOT NULL,
    FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID),
    FOREIGN KEY (ResponsibleEmployeeID) REFERENCES Employee(EmployeeID),
    CONSTRAINT CK_PurchaseOrder_Status CHECK (OrderStatus IN ('New','Ordered','Received','Cancelled'))
)

CREATE TABLE PurchaseOrderDetail (
    PurchaseOrderDetailID  INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    QuantityOrdered        INT NOT NULL,
    UnitPrice              DECIMAL(10,2) NOT NULL,
    LineTotal              AS (QuantityOrdered * UnitPrice) PERSISTED,
    PurchaseOrderID        INT NOT NULL,
    MaterialID             INT NOT NULL,
    UNIQUE (PurchaseOrderID, MaterialID),
    FOREIGN KEY (PurchaseOrderID) REFERENCES PurchaseOrder(PurchaseOrderID) ON DELETE CASCADE,
    FOREIGN KEY (MaterialID) REFERENCES RawMaterial(MaterialID),
    CONSTRAINT CK_POD_Qty CHECK (QuantityOrdered > 0),
    CONSTRAINT CK_POD_UnitPrice CHECK (UnitPrice >= 0)
)

CREATE TABLE ProductionOrder (
    ProductionOrderID      INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Quantity               INT NOT NULL,
    StartDate              DATE NOT NULL DEFAULT (CONVERT(date, SYSDATETIME())),
    ProductionStatus       NVARCHAR(20) NOT NULL DEFAULT ('Planned'),
    ProductCode            NVARCHAR(20) NOT NULL,
    ResponsibleEmployeeID  INT NOT NULL,
    FOREIGN KEY (ProductCode) REFERENCES Product(ProductCode),
    FOREIGN KEY (ResponsibleEmployeeID) REFERENCES Employee(EmployeeID),
    CONSTRAINT CK_ProductionOrder_Qty CHECK (Quantity > 0),
    CONSTRAINT CK_ProductionOrder_Status CHECK (ProductionStatus IN ('Planned','InProgress','Completed','Cancelled'))
)

CREATE TABLE ProductionTracking (
    TrackingID         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StartTime          DATETIME2(0) NOT NULL,
    EndTime            DATETIME2(0) NULL,
    ProductionOrderID  INT NOT NULL,
    StepID             INT NOT NULL,
    UNIQUE (ProductionOrderID, StepID),
    FOREIGN KEY (ProductionOrderID) REFERENCES ProductionOrder(ProductionOrderID) ON DELETE CASCADE,
    FOREIGN KEY (StepID) REFERENCES ProductionStep(StepID),
    CONSTRAINT CK_Tracking_Times CHECK (EndTime IS NULL OR EndTime >= StartTime)
)
