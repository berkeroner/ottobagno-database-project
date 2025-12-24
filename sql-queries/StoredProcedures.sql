
USE OttoBagno;
GO

-- SP-2 — Add Domestic Customer
-- Assigns an existing customer to a domestic region by inserting
-- a relationship record into the DomesticCustomer table.

CREATE PROCEDURE sp_AddDomesticCustomer
    @CustomerID INT,
    @RegionID INT
AS
BEGIN
    INSERT INTO DomesticCustomer (CustomerID, RegionID)
    VALUES (@CustomerID, @RegionID);
END;
GO


-- SP-3 — Add International Customer
-- Classifies an existing customer as international by linking
-- the customer to a country in the InternationalCustomer table.

CREATE PROCEDURE sp_AddInternationalCustomer
    @CustomerID INT,
    @CountryID INT
AS
BEGIN
    INSERT INTO InternationalCustomer (CustomerID, CountryID)
    VALUES (@CustomerID, @CountryID);
END;
GO


-- SP-4 — Create Sales Order
-- Creates a new sales order for a customer in SalesOrder and
-- returns the newly generated OrderID using SCOPE_IDENTITY().

CREATE PROCEDURE [dbo].[sp_CreateSalesOrder]
  @CustomerID INT,
  @SalesEmployeeID INT,
  @UsedCurrency CHAR(3),
  @CountryID INT
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO SalesOrder (CustomerID, SalesEmployeeID, UsedCurrency, CountryID)
  VALUES (@CustomerID, @SalesEmployeeID, @UsedCurrency, @CountryID);

  SELECT SCOPE_IDENTITY() AS NewOrderID;
END
GO



-- SP-5 — Add Order Detail
-- Adds a product line item to a sales order by inserting into
-- OrderDetail (stock changes are expected to be handled by
-- triggers if defined).

CREATE PROCEDURE sp_AddOrderDetail
    @OrderID INT,
    @ProductCode NVARCHAR(20),
    @Quantity INT,
    @UnitPrice DECIMAL(10,2)
AS
BEGIN
    INSERT INTO OrderDetail (OrderID, ProductCode, Quantity, UnitPrice)
    VALUES (@OrderID, @ProductCode, @Quantity, @UnitPrice);
END;
GO


-- SP-6 — Add Payment
-- Records a payment made towards a sales order in the Payment table.

CREATE PROCEDURE sp_AddPayment
    @OrderID INT,
    @PaymentMethod NVARCHAR(30),
    @Amount DECIMAL(12,2)
AS
BEGIN
    INSERT INTO Payment (OrderID, PaymentMethod, Amount, PaymentStatus)
    VALUES (@OrderID, @PaymentMethod, @Amount, 'Completed');
END;
GO

-- SP-7 — Create Purchase Order
-- This stored procedure creates a new purchase order for raw materials,
-- assigns a responsible employee, adds the line item, updates the total
-- amount, and adjusts raw material stock.

CREATE OR ALTER PROCEDURE [dbo].[sp_CreatePurchaseOrder]
    @SupplierID INT,
    @EmployeeID INT, 
    @MaterialID INT,
    @Quantity INT,
    @ExpectedDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentPrice DECIMAL(10,2);
    DECLARE @NewPOID INT;
    DECLARE @RealEmployeeID INT;

    IF @EmployeeID = 1 OR @EmployeeID IS NULL OR @EmployeeID = 0
    BEGIN
        SELECT TOP 1 @RealEmployeeID = EmployeeID 
        FROM Employee 
        WHERE EmployeeID <> 1
        ORDER BY NEWID();

        IF @RealEmployeeID IS NULL SET @RealEmployeeID = 1;
    END
    ELSE
    BEGIN
        SET @RealEmployeeID = @EmployeeID;
    END

    SELECT TOP 1 @CurrentPrice = ISNULL(UnitPrice, 0) FROM RawMaterial WHERE MaterialID = @MaterialID;
    IF @CurrentPrice IS NULL SET @CurrentPrice = 0;

    INSERT INTO PurchaseOrder (
        SupplierID, 
        ResponsibleEmployeeID, 
        OrderDate, 
        ExpectedDeliveryDate, 
        OrderStatus, 
        TotalAmount
    )
    VALUES (
        @SupplierID, 
        @RealEmployeeID, 
        SYSDATETIME(), 
        @ExpectedDate, 
        'New', 
        0
    );

    SET @NewPOID = SCOPE_IDENTITY();

    INSERT INTO PurchaseOrderDetail (PurchaseOrderID, MaterialID, QuantityOrdered, UnitPrice)
    VALUES (@NewPOID, @MaterialID, @Quantity, @CurrentPrice);

    UPDATE PurchaseOrder 
    SET TotalAmount = @Quantity * @CurrentPrice 
    WHERE PurchaseOrderID = @NewPOID;

    UPDATE RawMaterial
    SET StockQuantity = ISNULL(StockQuantity, 0) + @Quantity
    WHERE MaterialID = @MaterialID;

    SELECT @NewPOID as PurchaseOrderID;
END
GO


-- SP-10 — Get Customer Orders
-- Returns all sales orders for a given customer using the
-- pre-aggregated view vSalesOrderTotals.

CREATE OR ALTER PROCEDURE sp_GetCustomerOrders
    @CustomerID INT
AS
BEGIN
    SELECT *
    FROM vSalesOrderTotals
    WHERE CustomerID = @CustomerID;
END;
GO

-- SP-12 — List Products
-- Lists active products (IsActive = 1) with an optional free-text
-- search across product code, name, and color. It controls the
-- stocks by joining with the vProductStockStatus view.

CREATE OR ALTER PROCEDURE dbo.sp_ListProducts
  @Search NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP (500)
    p.ProductCode,
    p.ProductName,
    p.SalesPrice,
    p.SalesPriceWithVAT,
    p.Color,
    p.StockQuantity,
    p.ClassID,
    p.CollectionID,
    p.IsActive,
    v.StockStatus

  FROM dbo.Product p
  INNER JOIN dbo.vProductStockStatus v
    ON v.ProductCode = p.ProductCode

  WHERE p.IsActive = 1
    AND (
      @Search IS NULL
      OR p.ProductCode LIKE '%' + @Search + '%'
      OR p.ProductName LIKE '%' + @Search + '%'
      OR p.Color       LIKE '%' + @Search + '%'
    )

  ORDER BY
    CASE v.StockStatus
      WHEN 'OUT OF STOCK' THEN 1
      WHEN 'LOW STOCK' THEN 2
      ELSE 3
    END,
    p.ProductCode;
END
GO


-- SP-13 — Add Product
-- Inserts a new product after validating uniqueness of ProductCode,
-- non-negative price/stock, and existence of ClassID/CollectionID.

CREATE PROCEDURE sp_AddProduct
    @ProductCode   NVARCHAR(20),
    @ProductName   NVARCHAR(100),
    @SalesPrice    DECIMAL(10,2),
    @Color         NVARCHAR(30),
    @StockQuantity INT,
    @ClassID       INT,
    @CollectionID  INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM Product WHERE ProductCode = @ProductCode)
            THROW 50100, 'ProductCode already exists.', 1;

        IF @SalesPrice < 0
            THROW 50101, 'Invalid price.', 1;
        
        IF @StockQuantity < 0
            THROW 50104, 'Invalid stock quantity.', 1;

        IF @ClassID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ProductClass WHERE ClassID = @ClassID)
            THROW 50102, 'ClassID not found.', 1;

        IF @CollectionID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ProductCollection WHERE CollectionID = @CollectionID)
            THROW 50103, 'CollectionID not found.', 1;

        INSERT INTO dbo.Product (ProductCode, ProductName, SalesPrice, Color, StockQuantity, ClassID, CollectionID)
        VALUES (@ProductCode, @ProductName, @SalesPrice, @Color, @StockQuantity, @ClassID, @CollectionID);

        COMMIT TRANSACTION;
    END
END
GO




-- SP-22 — Recalculate Sales Order Total
-- This stored procedure recalculates and updates the total amount
-- of a sales order based on its order details.

CREATE PROCEDURE sp_RecalculateSalesOrderTotal
    @OrderID INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM SalesOrder WHERE OrderID = @OrderID)
            THROW 50150, 'Sales order not found.', 1;

        UPDATE SalesOrder
        SET TotalAmount = ISNULL((
            SELECT SUM(LineTotal)
            FROM OrderDetail
            WHERE OrderID = @OrderID
        ), 0)
        WHERE OrderID = @OrderID;

        COMMIT TRANSACTION;
    END
END
GO



-- SP-25 — Delete Product from Sales
-- This stored procedure marks a product as inactive in the Product table.

CREATE OR ALTER PROCEDURE dbo.sp_DeleteProductFromSales
  @ProductCode NVARCHAR(20)
AS
BEGIN
  SET NOCOUNT ON;

  IF NOT EXISTS (SELECT 1 FROM dbo.Product WHERE ProductCode = @ProductCode)
    THROW 50170, 'Product not found.', 1;

  UPDATE dbo.Product
  SET IsActive = 0
  WHERE ProductCode = @ProductCode;
END
GO

-- SP-26 — List Employees
-- This stored procedure retrieves a list of active employees.

CREATE OR ALTER PROCEDURE sp_ListEmployee
AS
BEGIN
  SET NOCOUNT ON;

  SELECT EmployeeID, FirstName, LastName, Role, PhoneNumber, Email
  FROM Employee
  WHERE IsActive = 1
  ORDER BY EmployeeID;
END
GO

-- SP-27 — List All Sales Orders
-- This stored procedure retrieves a list of all sales orders.

CREATE PROCEDURE sp_ListAllSalesOrders
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 500
    OrderID, OrderDate, OrderStatus, TotalAmount, UsedCurrency,
    CustomerID, SalesEmployeeID, CountryID
  FROM SalesOrder
  ORDER BY OrderID;
END
GO

-- SP-28 — Login Customer
-- Performs a simple customer lookup by first and last name and
-- returns IsAdmin = 1 only when the name is admin admin;
-- otherwise returns IsAdmin = 0.

CREATE PROCEDURE sp_LoginCustomer
  @FirstName NVARCHAR(50),
  @LastName NVARCHAR(50)
AS
BEGIN
  SELECT TOP 1 CustomerID, FirstName, LastName,
    CASE 
      WHEN LOWER(FirstName) = 'admin' AND LOWER(LastName) = 'admin'
      THEN 1 ELSE 0
    END AS IsAdmin
  FROM Customer
  WHERE FirstName = @FirstName AND LastName = @LastName
  ORDER BY CustomerID
END
GO

-- SP-29 — List Product Classes
-- This stored procedure retrieves a list of product classes.

CREATE PROCEDURE sp_ListProductClasses
AS
BEGIN
  SET NOCOUNT ON;

  SELECT ClassID, ClassName
  FROM ProductClass
  ORDER BY ClassName;
END
GO

-- SP-30 — List Product Collections
-- This stored procedure retrieves a list of product collections.

CREATE PROCEDURE sp_ListProductCollections
AS
BEGIN
  SET NOCOUNT ON;

  SELECT CollectionID, CollectionName
  FROM ProductCollection
  ORDER BY CollectionName;
END
GO

-- SP-31 — List Filtered Products
-- This stored procedure retrieves a list of active products,
-- optionally filtered by class ID and collection ID.

CREATE OR ALTER PROCEDURE sp_ListFilteredProducts
  @ClassID INT = NULL,
  @CollectionID INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP (500) ProductCode, ProductName, SalesPrice, StockQuantity,
    ClassID, CollectionID
  FROM Product p
  WHERE IsActive = 1 AND (@ClassID IS NULL OR ClassID = @ClassID)
    AND (@CollectionID IS NULL OR CollectionID = @CollectionID)
  ORDER BY p.ProductCode;
END
GO

-- SP-32 — Get Sales Order Status
-- This stored procedure retrieves the status and total amount
-- of a specific sales order.

CREATE PROCEDURE sp_GetSalesOrderStatus
  @OrderID INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT OrderID, OrderStatus, TotalAmount
  FROM SalesOrder
  WHERE OrderID = @OrderID;
END
GO

-- SP-33 — Get Random Employee
-- Returns a random EmployeeID from the Employee table.

CREATE PROCEDURE sp_GetRandomEmployee
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP 1 EmployeeID FROM Employee ORDER BY NEWID();
END
GO

-- SP-34 — Get Order Total
-- Returns TotalAmount for a given sales order (OrderID) from SalesOrder.

CREATE PROCEDURE sp_GetOrderTotal
  @OrderID INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TotalAmount FROM SalesOrder WHERE OrderID = @OrderID;
END
GO

-- SP-35 — Add Employee
-- This stored procedure adds a new employee to the Employee table.

CREATE PROCEDURE sp_AddEmployee
  @FirstName NVARCHAR(50),
  @LastName NVARCHAR(50),
  @Role NVARCHAR(50),
  @PhoneNumber NVARCHAR(20),
  @Email NVARCHAR(250)
AS
BEGIN
  SET NOCOUNT ON;

  IF EXISTS (SELECT 1 FROM Employee WHERE Email = @Email)
    THROW 50200, 'Employee email already exists.', 1;

  INSERT INTO Employee (FirstName, LastName, Role, PhoneNumber, Email)
  VALUES (@FirstName, @LastName, @Role, @PhoneNumber, @Email);
END
GO

-- SP-36 — Delete Employee
-- Soft-deletes an employee by setting Employee.IsActive = 0.
-- Throws an error if the employee does not exist.

CREATE OR ALTER PROCEDURE sp_DeleteEmployee
  @EmployeeID INT
AS
BEGIN
  SET NOCOUNT ON;

  IF NOT EXISTS (SELECT 1 FROM Employee WHERE EmployeeID=@EmployeeID)
    THROW 50201, 'Employee not found.', 1;

  UPDATE Employee
  SET IsActive = 0
  WHERE EmployeeID = @EmployeeID
END
GO

-- SP-37 — List Purchase Orders
-- This stored procedure retrieves a list of purchase orders
-- along with supplier and responsible employee details.

CREATE OR ALTER PROCEDURE [dbo].[sp_ListPurchaseOrders]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        PO.PurchaseOrderID,
        PO.OrderDate,
        PO.OrderStatus,
        PO.TotalAmount,
        PO.ExpectedDeliveryDate,
        S.CompanyName AS SupplierName,             
        E.FirstName + ' ' + E.LastName AS EmployeeName 
    FROM PurchaseOrder PO
    LEFT JOIN Supplier S ON PO.SupplierID = S.SupplierID
    LEFT JOIN Employee E ON PO.ResponsibleEmployeeID = E.EmployeeID
    ORDER BY PO.OrderDate DESC;
END
GO


-- SP-39 — Add Purchase Order Detail and Recalculate
-- This stored procedure adds a line item to an existing purchase order
-- and recalculates the total amount of the purchase order.

CREATE PROCEDURE sp_AddPurchaseOrderDetailAndRecalc
  @PurchaseOrderID INT,
  @MaterialID INT,
  @Quantity INT,
  @UnitPrice DECIMAL(10,2)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRANSACTION;

  IF @Quantity <= 0 OR @UnitPrice < 0
    THROW 50211, 'Invalid quantity or unit price.', 1;

  IF NOT EXISTS (SELECT 1 FROM PurchaseOrder WHERE PurchaseOrderID=@PurchaseOrderID)
    THROW 50212, 'Purchase order not found.', 1;

  IF NOT EXISTS (SELECT 1 FROM RawMaterial WHERE MaterialID=@MaterialID)
    THROW 50213, 'Material not found.', 1;

  INSERT INTO PurchaseOrderDetail (PurchaseOrderID, MaterialID, QuantityOrdered, UnitPrice)
  VALUES (@PurchaseOrderID, @MaterialID, @Quantity, @UnitPrice);

  EXEC sp_RecalculatePurchaseOrderTotal @PurchaseOrderID;

  COMMIT TRANSACTION;
END
GO

-- SP-40 — Execute Production
-- This stored procedure executes a production order by checking
-- raw material stock, updating stock quantities, and recording production.

CREATE   PROCEDURE [dbo].[sp_ExecuteProduction]
    @ProductCode NVARCHAR(20),
    @ProductionQty INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;

    BEGIN TRY
        IF EXISTS (
            SELECT 1
            FROM BillOfMaterials BOM
            JOIN RawMaterial RM ON BOM.MaterialID = RM.MaterialID
            WHERE BOM.ProductCode = @ProductCode
              AND (BOM.RequiredQuantity * @ProductionQty) > RM.StockQuantity
        )
        BEGIN
            THROW 51000, 'Yetersiz Hammadde Stoğu! Üretim yapılamaz.', 1;
        END

        UPDATE RM
        SET RM.StockQuantity = RM.StockQuantity - (BOM.RequiredQuantity * @ProductionQty)
        FROM RawMaterial RM
        JOIN BillOfMaterials BOM ON RM.MaterialID = BOM.MaterialID
        WHERE BOM.ProductCode = @ProductCode;

        UPDATE Product
        SET StockQuantity = StockQuantity + @ProductionQty
        WHERE ProductCode = @ProductCode;

        COMMIT TRANSACTION;
        
        SELECT 'Başarılı' as Status, @ProductionQty as ProducedQty;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP-41 — Get Order Details
-- This stored procedure retrieves detailed line items for a specific sales order.

CREATE   PROCEDURE [dbo].[sp_GetOrderDetails]
    @OrderID INT
AS
BEGIN
    SELECT 
        P.ProductCode,
        P.ProductName,
        OD.Quantity,
        OD.UnitPrice,
        (OD.Quantity * OD.UnitPrice) AS LineTotal
    FROM OrderDetail OD
    JOIN Product P ON OD.ProductCode = P.ProductCode
    WHERE OD.OrderID = @OrderID;
END;
GO

-- SP-42 — Get Product BOM
-- This stored procedure retrieves the bill of materials for a specific product.

CREATE   PROCEDURE [dbo].[sp_GetProductBOM]
    @ProductCode NVARCHAR(20)
AS
BEGIN
    SELECT 
        RM.MaterialName,
        RM.StockQuantity as CurrentStock,
        BOM.RequiredQuantity as NeededPerUnit
    FROM BillOfMaterials BOM
    JOIN RawMaterial RM ON BOM.MaterialID = RM.MaterialID
    WHERE BOM.ProductCode = @ProductCode;
END;
GO

-- SP-43 — List Customers
-- Lists active customers (IsActive = 1) including identity, contact, and address fields.

CREATE OR ALTER PROCEDURE sp_ListCustomers
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.CustomerID,
        c.FirstName,
        c.LastName,
        c.PhoneNumber,
        c.Email,
        c.Address
    FROM Customer c
    WHERE IsActive = 1
    ORDER BY c.CustomerID;
END;
GO

-- SP-44 — Delete Customer
-- Soft-deletes a customer by setting IsActive = 0 on Customer and related
-- DomesticCustomer/InternationalCustomer records inside a transaction;
-- returns an error if the customer does not exist.

CREATE OR ALTER PROCEDURE sp_DeleteCustomer
    @CustomerID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Customer WHERE CustomerID = @CustomerID)
    BEGIN
        RAISERROR('Customer not found.', 16, 1);
        RETURN;
    END

    BEGIN TRY
        BEGIN TRAN;

        UPDATE DomesticCustomer
        SET IsActive = 0
        WHERE CustomerID = @CustomerID;

        UPDATE InternationalCustomer
        SET IsActive = 0
        WHERE CustomerID = @CustomerID;

        UPDATE Customer
        SET IsActive = 0
        WHERE CustomerID = @CustomerID;

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END;
GO

