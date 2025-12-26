
-- SP-1 — Add Domestic Customer

CREATE PROCEDURE sp_AddDomesticCustomer
    @CustomerID INT,
    @RegionID INT
AS
BEGIN
    INSERT INTO DomesticCustomer (CustomerID, RegionID)
    VALUES (@CustomerID, @RegionID);
END;
GO


-- SP-2 — Add International Customer

CREATE PROCEDURE sp_AddInternationalCustomer
    @CustomerID INT,
    @CountryID INT
AS
BEGIN
    INSERT INTO InternationalCustomer (CustomerID, CountryID)
    VALUES (@CustomerID, @CountryID);
END;
GO


-- SP-3 — Create Sales Order

      CREATE OR ALTER PROCEDURE [dbo].[sp_CreateSalesOrder]
          @CustomerID INT,
          @SalesEmployeeID INT = NULL,
          @UsedCurrency CHAR(3),
          @CountryID INT
      AS
      BEGIN
          SET NOCOUNT ON;

          IF @SalesEmployeeID IS NOT NULL
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM Employee WHERE EmployeeID = @SalesEmployeeID)
              BEGIN
                  THROW 50002, 'Employee not found', 1;
              END
          END

          INSERT INTO SalesOrder (CustomerID, SalesEmployeeID, UsedCurrency, CountryID)
          VALUES (@CustomerID, @SalesEmployeeID, @UsedCurrency, @CountryID);
            
          SELECT SCOPE_IDENTITY() AS NewOrderID;
      END;
      GO


-- SP-4

CREATE PROCEDURE sp_AddOrderDetail
    @OrderID INT,
    @ProductCode NVARCHAR(20),
    @Quantity INT,
    @UnitPrice DECIMAL(10,2)
AS
BEGIN
    DECLARE @PName NVARCHAR(100);
    DECLARE @PColor NVARCHAR(30);

    SELECT @PName = ProductName, @PColor = Color 
    FROM dbo.Product 
    WHERE ProductCode = @ProductCode;

    INSERT INTO OrderDetail (OrderID, ProductCode, Quantity, UnitPrice)
    VALUES (@OrderID, @ProductCode, @Quantity, @UnitPrice);
END;
GO


-- SP-5

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

-- SP-6

CREATE OR ALTER PROCEDURE dbo.sp_GetCustomerOrders
    @CustomerID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        OrderID, 
        OrderDate, 
        OrderStatus, 
        TotalAmount AS CalculatedTotal, 
        UsedCurrency
    FROM dbo.SalesOrder
    WHERE CustomerID = @CustomerID
    ORDER BY OrderDate DESC, OrderID DESC;
END;
GO


-- SP-7

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
    v.StockStatus

  FROM dbo.Product p
  INNER JOIN dbo.vProductStockStatus v
    ON v.ProductCode = p.ProductCode

  WHERE (
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


-- SP-8
CREATE OR ALTER PROCEDURE dbo.sp_AddProduct
    @ProductCode   NVARCHAR(20),
    @ProductName   NVARCHAR(100),
    @SalesPrice    DECIMAL(10,2),
    @Color         NVARCHAR(30),
    @StockQuantity INT,
    @ClassID       INT = NULL,
    @CollectionID  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @SalesPrice < 0
            THROW 50101, 'Invalid price.', 1;

        IF @StockQuantity < 0
            THROW 50104, 'Invalid stock quantity.', 1;

        IF @ClassID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ProductClass WHERE ClassID = @ClassID)
            THROW 50102, 'ClassID not found.', 1;

        IF @CollectionID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ProductCollection WHERE CollectionID = @CollectionID)
            THROW 50103, 'CollectionID not found.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Product WHERE ProductCode = @ProductCode)
            THROW 50100, 'ProductCode already exists.', 1;

        INSERT INTO dbo.Product
            (ProductCode, ProductName, SalesPrice, Color, StockQuantity, ClassID, CollectionID)
        VALUES
            (@ProductCode, @ProductName, @SalesPrice, @Color, @StockQuantity, @ClassID, @CollectionID);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO






-- SP-9

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



-- SP-10

CREATE OR ALTER PROCEDURE dbo.sp_DeleteProductFromSales
  @ProductCode NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Product WHERE ProductCode = @ProductCode)
        THROW 50400, 'Product not found.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.OrderDetail od
        JOIN dbo.SalesOrder so ON so.OrderID = od.OrderID
        WHERE od.ProductCode = @ProductCode
          AND so.OrderStatus = 'New'
    )
        THROW 50401, 'Cannot delete: product exists in NEW sales orders.', 1;

    BEGIN TRY
        BEGIN TRAN;

        DELETE FROM dbo.Product
        WHERE ProductCode = @ProductCode;

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO


-- SP-11
CREATE OR ALTER PROCEDURE sp_ListEmployee
AS
BEGIN
  SET NOCOUNT ON;

  SELECT EmployeeID, FirstName, LastName, Role, PhoneNumber, Email
  FROM Employee
  ORDER BY EmployeeID;
END
GO

-- SP-12
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

-- SP-13

CREATE PROCEDURE sp_LoginCustomer
  @FirstName NVARCHAR(50),
  @LastName NVARCHAR(50),
  @Email NVARCHAR(100)
AS
BEGIN
  SELECT TOP 1 CustomerID, FirstName, LastName,
    CASE 
      WHEN LOWER(FirstName) = 'admin' AND LOWER(LastName) = 'admin'
      THEN 1 ELSE 0
    END AS IsAdmin
  FROM Customer
  WHERE FirstName = @FirstName AND LastName = @LastName AND Email = @Email
  ORDER BY CustomerID
END
GO

-- SP-14

CREATE PROCEDURE sp_ListProductClasses
AS
BEGIN
  SET NOCOUNT ON;

  SELECT ClassID, ClassName
  FROM ProductClass
  ORDER BY ClassName;
END
GO

-- SP-15

CREATE PROCEDURE sp_ListProductCollections
AS
BEGIN
  SET NOCOUNT ON;

  SELECT CollectionID, CollectionName
  FROM ProductCollection
  ORDER BY CollectionName;
END
GO

-- SP-16

CREATE OR ALTER PROCEDURE sp_ListFilteredProducts
  @ClassID INT = NULL,
  @CollectionID INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP (500) ProductCode, ProductName, SalesPrice, StockQuantity,
    ClassID, CollectionID
  FROM Product p
  WHERE @ClassID IS NULL OR ClassID = @ClassID
    AND (@CollectionID IS NULL OR CollectionID = @CollectionID)
  ORDER BY p.ProductCode;
END
GO


-- SP-19

CREATE PROCEDURE sp_GetOrderTotal
  @OrderID INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TotalAmount FROM SalesOrder WHERE OrderID = @OrderID;
END
GO

-- SP-20

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

-- SP-21

CREATE OR ALTER PROCEDURE dbo.sp_DeleteEmployee
  @EmployeeID INT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE EmployeeID = @EmployeeID)
      THROW 50201, 'Employee not found.', 1;

    IF EXISTS (SELECT 1 FROM dbo.PurchaseOrder   WHERE ResponsibleEmployeeID = @EmployeeID)
       OR EXISTS (SELECT 1 FROM dbo.ProductionOrder WHERE ResponsibleEmployeeID = @EmployeeID)
       OR EXISTS (SELECT 1 FROM dbo.SalesOrder    WHERE SalesEmployeeID = @EmployeeID)
    BEGIN
      THROW 50202, 'Employee cannot be deleted because it is responsible in order.', 1;
    END

    DELETE FROM dbo.Employee
    WHERE EmployeeID = @EmployeeID;

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END
GO


-- SP-22

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
                    PO.ResponsibleEmployeeID,
                    S.CompanyName AS SupplierName,             
                    E.FirstName + ' ' + E.LastName AS EmployeeName 
                FROM PurchaseOrder PO
                LEFT JOIN Supplier S ON PO.SupplierID = S.SupplierID
                LEFT JOIN Employee E ON PO.ResponsibleEmployeeID = E.EmployeeID
                ORDER BY PO.OrderDate DESC;
            END
            GO
-- SP-23

CREATE PROCEDURE sp_RecalculatePurchaseOrderTotal
  @PurchaseOrderID INT
AS
BEGIN
  SET NOCOUNT ON;

  IF NOT EXISTS (SELECT 1 FROM PurchaseOrder WHERE PurchaseOrderID=@PurchaseOrderID)
    THROW 50210, 'Purchase order not found.', 1;

  UPDATE PurchaseOrder
  SET TotalAmount = ISNULL((
    SELECT SUM(LineTotal)
    FROM PurchaseOrderDetail
    WHERE PurchaseOrderID = @PurchaseOrderID
  ), 0)
  WHERE PurchaseOrderID = @PurchaseOrderID;
END
GO



-- SP-24

CREATE OR ALTER PROCEDURE sp_AddPurchaseOrderDetailAndRecalc
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

-- SP-25

CREATE   PROCEDURE [dbo].[sp_GetOrderDetails]
    @OrderID INT
AS
BEGIN
    SELECT 
        OD.ProductCode,
        OD.Quantity,
        OD.UnitPrice,
        (OD.Quantity * OD.UnitPrice) AS LineTotal
    FROM OrderDetail OD
    WHERE OD.OrderID = @OrderID;
END;
GO

-- SP-26

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

-- SP-27

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
    ORDER BY c.CustomerID;
END;
GO

-- SP-28

CREATE OR ALTER PROCEDURE dbo.sp_DeleteCustomer
    @CustomerID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Customer WHERE CustomerID = @CustomerID)
        THROW 50301, 'Customer not found.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.SalesOrder so
        WHERE so.CustomerID = @CustomerID
          AND so.OrderStatus IN ('New', 'Shipped')
    )
        THROW 50302, 'There are active orders for this customer. (New/Shipped)', 1;

    BEGIN TRY
        BEGIN TRAN;

        DELETE od
        FROM dbo.OrderDetail od
        INNER JOIN dbo.SalesOrder so
            ON so.OrderID = od.OrderID
        WHERE so.CustomerID = @CustomerID;

        DELETE FROM dbo.SalesOrder
        WHERE CustomerID = @CustomerID;

        DELETE FROM dbo.DomesticCustomer
        WHERE CustomerID = @CustomerID;

        DELETE FROM dbo.InternationalCustomer
        WHERE CustomerID = @CustomerID;

        DELETE FROM dbo.Customer
        WHERE CustomerID = @CustomerID;

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO

-- SP-29

CREATE PROCEDURE sp_UpdateOrderStatus
    @OrderID INT,
    @NewStatus NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM SalesOrder WHERE OrderID = @OrderID)
    BEGIN
        RAISERROR('Order not found.', 16, 1);
        RETURN;
    END

    UPDATE SalesOrder
    SET OrderStatus = @NewStatus
    WHERE OrderID = @OrderID;
END
GO

-- SP-30

CREATE OR ALTER PROCEDURE sp_UpdateCustomer
    @CustomerID INT,
    @PhoneNumber NVARCHAR(20),
    @Address NVARCHAR(250)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Customer
    SET PhoneNumber = @PhoneNumber,
        Address = @Address
    WHERE CustomerID = @CustomerID;
END
GO

-- SP-31

CREATE PROCEDURE sp_GetCustomer
    @CustomerID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Customer WHERE CustomerID = @CustomerID;
END
GO

-- SP-32

CREATE PROCEDURE sp_UpdateProductPrice
    @ProductCode NVARCHAR(20),
    @NewPrice DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM Product WHERE ProductCode = @ProductCode)
    BEGIN
        THROW 50001, 'Product not found', 1;
    END

    UPDATE Product
    SET SalesPrice = @NewPrice
    WHERE ProductCode = @ProductCode;
END
GO

-- SP-33

            CREATE OR ALTER PROCEDURE [dbo].[sp_CreatePurchaseOrder]
                @SupplierID INT,
                @EmployeeID INT = NULL, 
                @MaterialID INT,
                @Quantity INT,
                @ExpectedDate DATE
            AS
            BEGIN
                SET NOCOUNT ON;
            
                DECLARE @CurrentPrice DECIMAL(10,2);
                DECLARE @NewPOID INT;

                IF @EmployeeID IS NOT NULL
                BEGIN
                    
                    IF NOT EXISTS (SELECT 1 FROM Employee WHERE EmployeeID = @EmployeeID)
                    BEGIN
                         THROW 50003, 'Employee not found.', 1;
                    END
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
                    @EmployeeID, 
                    SYSDATETIME(), 
                    @ExpectedDate, 
                    'New', 
                    0 
                );
                
                SET @NewPOID = SCOPE_IDENTITY();
                
                -- Add Detail
                INSERT INTO PurchaseOrderDetail (PurchaseOrderID, MaterialID, QuantityOrdered, UnitPrice)
                VALUES (@NewPOID, @MaterialID, @Quantity, @CurrentPrice);
                
                -- Update PO Total
                UPDATE PurchaseOrder
                SET TotalAmount = @Quantity * @CurrentPrice
                WHERE PurchaseOrderID = @NewPOID;
                
                -- Update Stock
                UPDATE RawMaterial
                SET StockQuantity = StockQuantity + @Quantity
                WHERE MaterialID = @MaterialID;

                SELECT @NewPOID AS NewPurchaseOrderID;
            END
            GO

-- SP-34

            CREATE OR ALTER PROCEDURE sp_ExecuteProduction
                @ProductCode NVARCHAR(20),
                @ProductionQty INT,
                @EmployeeID INT = NULL
            AS
            BEGIN
                SET NOCOUNT ON;

                DECLARE @NewProductionOrderID INT;

                IF @EmployeeID IS NOT NULL
                BEGIN

                     IF NOT EXISTS (SELECT 1 FROM Employee WHERE EmployeeID = @EmployeeID)
                     BEGIN
                         THROW 50003, 'Employee not found.', 1;
                     END
                END

                INSERT INTO ProductionOrder (
                    ProductCode, 
                    Quantity, 
                    StartDate, 
                    ProductionStatus, 
                    ResponsibleEmployeeID
                )
                VALUES (
                    @ProductCode, 
                    @ProductionQty, 
                    CONVERT(date, SYSDATETIME()), 
                    'Completed',
                    @EmployeeID
                );
                
                SET @NewProductionOrderID = SCOPE_IDENTITY();

                IF EXISTS (
                    SELECT 1
                    FROM BillOfMaterials BOM
                    JOIN RawMaterial RM ON BOM.MaterialID = RM.MaterialID
                    WHERE BOM.ProductCode = @ProductCode
                      AND RM.StockQuantity < (BOM.RequiredQuantity * @ProductionQty)
                )
                BEGIN
                    THROW 50006, 'Insufficient raw material stock.', 1;
                END

                -- Deduct Stock
                UPDATE RM
                SET RM.StockQuantity = RM.StockQuantity - (BOM.RequiredQuantity * @ProductionQty)
                FROM RawMaterial RM
                JOIN BillOfMaterials BOM ON RM.MaterialID = BOM.MaterialID
                WHERE BOM.ProductCode = @ProductCode;

                -- Add Product Stock
                UPDATE Product
                SET StockQuantity = StockQuantity + @ProductionQty
                WHERE ProductCode = @ProductCode;

            END
            GO

-- SP-35

            CREATE OR ALTER PROCEDURE sp_GetFirstAvailableSalesEmployee
            AS
            BEGIN
                SET NOCOUNT ON;
                SELECT TOP 1 EmployeeID, FirstName, LastName
                FROM Employee
                WHERE Role = 'Sales' AND EmployeeID <> 1
                ORDER BY EmployeeID;
            END
            GO

-- SP-36

            CREATE OR ALTER PROCEDURE sp_UpdateEmployeeRole
                @EmployeeID INT,
                @NewRole NVARCHAR(50)
            AS
            BEGIN
                SET NOCOUNT ON;

                IF NOT EXISTS (SELECT 1 FROM Employee WHERE EmployeeID = @EmployeeID)
                BEGIN
                    THROW 50005, 'Employee not found.', 1;
                END

                UPDATE Employee
                SET Role = @NewRole
                WHERE EmployeeID = @EmployeeID;
            END
            GO

-- SP-37

            CREATE OR ALTER PROCEDURE sp_UpdatePurchaseOrderStatus
                @PurchaseOrderID INT,
                @NewStatus NVARCHAR(50)
            AS
            BEGIN
                SET NOCOUNT ON;

                IF NOT EXISTS (SELECT 1 FROM PurchaseOrder WHERE PurchaseOrderID = @PurchaseOrderID)
                BEGIN
                    THROW 50004, 'Purchase Order not found.', 1;
                END

                UPDATE PurchaseOrder
                SET OrderStatus = @NewStatus
                WHERE PurchaseOrderID = @PurchaseOrderID;
            END
            GO

-- SP-38

            CREATE OR ALTER PROCEDURE sp_AssignPurchaseOrderEmployee
                @PurchaseOrderID INT,
                @EmployeeID INT
            AS
            BEGIN
                SET NOCOUNT ON;

                IF NOT EXISTS (SELECT 1 FROM PurchaseOrder WHERE PurchaseOrderID = @PurchaseOrderID)
                BEGIN
                    THROW 50004, 'Purchase Order not found.', 1;
                END
                
                IF NOT EXISTS (
                    SELECT 1 
                    FROM Employee 
                    WHERE EmployeeID = @EmployeeID 
                      AND Role IN ('Purchasing' )
                )
                BEGIN
                    THROW 50005, 'Assigned employee must be in Purchasing role.', 1;
                END

                UPDATE PurchaseOrder
                SET ResponsibleEmployeeID = @EmployeeID
                WHERE PurchaseOrderID = @PurchaseOrderID;
            END
            GO

-- SP-39

            CREATE OR ALTER PROCEDURE sp_AssignSalesOrderEmployee
                @OrderID INT,
                @SalesEmployeeID INT
            AS
            BEGIN
                SET NOCOUNT ON;

                IF NOT EXISTS (SELECT 1 FROM SalesOrder WHERE OrderID = @OrderID)
                BEGIN
                    THROW 50004, 'Sales Order not found.', 1;
                END

                -- Enforce Sales Role
                IF NOT EXISTS (
                    SELECT 1 
                    FROM Employee 
                    WHERE EmployeeID = @SalesEmployeeID 
                      AND Role = 'Sales'
                )
                BEGIN
                    THROW 50005, 'Assigned employee must be in Sales role.', 1;
                END

                UPDATE SalesOrder
                SET SalesEmployeeID = @SalesEmployeeID
                WHERE OrderID = @OrderID;
            END
            GO

-- SP-40

            CREATE OR ALTER PROCEDURE sp_AssignProductionOrderEmployee
                @ProductionOrderID INT,
                @EmployeeID INT
            AS
            BEGIN
                SET NOCOUNT ON;

                IF NOT EXISTS (SELECT 1 FROM ProductionOrder WHERE ProductionOrderID = @ProductionOrderID)
                BEGIN
                    THROW 50004, 'Production Order not found.', 1;
                END

                -- Enforce Production Role
                IF NOT EXISTS (
                    SELECT 1 
                    FROM Employee 
                    WHERE EmployeeID = @EmployeeID 
                      AND Role = 'Production'
                )
                BEGIN
                    THROW 50005, 'Assigned employee must be in Production role.', 1;
                END

                UPDATE ProductionOrder
                SET ResponsibleEmployeeID = @EmployeeID
                WHERE ProductionOrderID = @ProductionOrderID;
            END
            GO

-- SP-41

            CREATE OR ALTER PROCEDURE sp_ListProductionOrders
            AS
            BEGIN
                SET NOCOUNT ON;

                SELECT 
                    PO.ProductionOrderID,
                    PO.StartDate,
                    PO.ProductCode,
                    Pr.ProductName,
                    PO.Quantity,
                    PO.ProductionStatus,
                    PO.ResponsibleEmployeeID,
                    E.FirstName + ' ' + E.LastName AS EmployeeName
                FROM ProductionOrder PO
                LEFT JOIN Product Pr ON PO.ProductCode = Pr.ProductCode
                LEFT JOIN Employee E ON PO.ResponsibleEmployeeID = E.EmployeeID
                ORDER BY PO.StartDate DESC;
            END
            GO

-- SP-42

        CREATE OR ALTER PROCEDURE sp_AddCustomer
            @FirstName NVARCHAR(50),
            @LastName NVARCHAR(50),
            @PhoneNumber NVARCHAR(20),
            @Email NVARCHAR(100),
            @Address NVARCHAR(250)
        AS
        BEGIN
        INSERT INTO Customer (FirstName, LastName, PhoneNumber, Email, Address)
        VALUES (@FirstName, @LastName, @PhoneNumber, @Email, @Address);
        
        SELECT SCOPE_IDENTITY() AS NewID;
        END;
        GO