
USE OttoBagno;
GO

-- SP-1
-- Add Customer
-- This stored procedure inserts a new customer record into the
-- system with basic contact and address information.

CREATE PROCEDURE sp_AddCustomer
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @PhoneNumber NVARCHAR(20),
    @Email NVARCHAR(100),
    @Address NVARCHAR(250)
AS
BEGIN
    INSERT INTO Customer (FirstName, LastName, PhoneNumber, Email, Address)
    VALUES (@FirstName, @LastName, @PhoneNumber, @Email, @Address);
END;
GO


-- SP-2
-- Add Domestic Customer
-- This stored procedure assigns a customer to a domestic region
-- by inserting a record into the DomesticCustomer table.

CREATE PROCEDURE sp_AddDomesticCustomer
    @CustomerID INT,
    @RegionID INT
AS
BEGIN
    INSERT INTO DomesticCustomer (CustomerID, RegionID)
    VALUES (@CustomerID, @RegionID);
END;
GO


-- SP-3
-- Add International Customer
-- This stored procedure classifies a customer as international
-- by linking the customer to a specific country.

CREATE PROCEDURE sp_AddInternationalCustomer
    @CustomerID INT,
    @CountryID INT
AS
BEGIN
    INSERT INTO InternationalCustomer (CustomerID, CountryID)
    VALUES (@CustomerID, @CountryID);
END;
GO


-- SP-4
-- Create Sales Order
-- This stored procedure creates a new sales order for a customer
-- and returns the generated order identifier.

CREATE PROCEDURE sp_CreateSalesOrder
    @CustomerID INT,
    @SalesEmployeeID INT,
    @UsedCurrency CHAR(3)
AS
BEGIN
    INSERT INTO SalesOrder (CustomerID, SalesEmployeeID, UsedCurrency)
    VALUES (@CustomerID, @SalesEmployeeID, @UsedCurrency);

    SELECT SCOPE_IDENTITY() AS NewOrderID;
END;
GO


-- SP-5
-- Add Order Detail
-- This stored procedure adds product line items to a sales order
-- and automatically triggers stock quantity updates.

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


-- SP-6
-- Add Payment
-- This stored procedure records a completed payment for a sales order
-- and enables automatic order status updates.

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


-- SP-7
-- Create Purchase Order
-- This stored procedure creates a new purchase order associated with
-- a supplier and a responsible employee.

CREATE PROCEDURE sp_CreatePurchaseOrder
    @SupplierID INT,
    @EmployeeID INT
AS
BEGIN
    INSERT INTO PurchaseOrder (SupplierID, ResponsibleEmployeeID)
    VALUES (@SupplierID, @EmployeeID);

    SELECT SCOPE_IDENTITY() AS NewPurchaseOrderID;
END;
GO


-- SP-8
-- Add Purchase Order Detail
-- This stored procedure adds raw material line items to an existing
-- purchase order.

CREATE PROCEDURE sp_AddPurchaseOrderDetail
    @PurchaseOrderID INT,
    @MaterialID INT,
    @Quantity INT,
    @UnitPrice DECIMAL(10,2)
AS
BEGIN
    INSERT INTO PurchaseOrderDetail (PurchaseOrderID, MaterialID, QuantityOrdered, UnitPrice)
    VALUES (@PurchaseOrderID, @MaterialID, @Quantity, @UnitPrice);
END;
GO


-- SP-9
-- Create Production Order
-- This stored procedure creates a production order to initiate the
-- manufacturing of a specified product quantity.

CREATE PROCEDURE sp_CreateProductionOrder
    @ProductCode NVARCHAR(20),
    @Quantity INT,
    @EmployeeID INT
AS
BEGIN
    INSERT INTO ProductionOrder (ProductCode, Quantity, ResponsibleEmployeeID)
    VALUES (@ProductCode, @Quantity, @EmployeeID);
END;
GO


-- SP-10
-- Get Customer Orders
-- This stored procedure retrieves all sales orders for a given customer
-- using a pre-aggregated view.

CREATE PROCEDURE sp_GetCustomerOrders
    @CustomerID INT
AS
BEGIN
    SELECT *
    FROM vSalesOrderTotals
    WHERE CustomerID = @CustomerID;
END;
GO


CREATE PROCEDURE sp_UpdateCustomer
    @CustomerID   INT,
    @FirstName    NVARCHAR(50),
    @LastName     NVARCHAR(50),
    @PhoneNumber  NVARCHAR(20),
    @Email        NVARCHAR(100),
    @Address      NVARCHAR(250)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.Customer WHERE CustomerID = @CustomerID)
            THROW 50002, 'Customer not found.', 1;

        UPDATE dbo.Customer
        SET FirstName = @FirstName,
            LastName = @LastName,
            PhoneNumber = @PhoneNumber,
            Email = @Email,
            Address = @Address
        WHERE CustomerID = @CustomerID;

        COMMIT TRANSACTION;
    END

END
GO


CREATE PROCEDURE sp_ListProducts
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (500)
        p.ProductCode, p.ProductName, p.SalesPrice, p.SalesPriceWithVAT, p.Color,
        p.StockQuantity, p.ClassID, p.CollectionID
    FROM Product p
    WHERE @Search IS NULL
       OR p.ProductCode LIKE '%' + @Search + '%'
       OR p.ProductName LIKE '%' + @Search + '%'
       OR p.Color       LIKE '%' + @Search + '%'
    ORDER BY p.ProductName;
END
GO

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

        IF @SalesPrice < 0 OR @StockQuantity < 0
            THROW 50101, 'Invalid price or stock.', 1;

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

CREATE PROCEDURE sp_UpdateProduct
    @ProductCode   NVARCHAR(20),
    @ProductName   NVARCHAR(100),
    @SalesPrice    DECIMAL(10,2),
    @Color         NVARCHAR(30),
    @ClassID       INT,
    @CollectionID  INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Product WHERE ProductCode = @ProductCode)
            THROW 50104, 'Product not found.', 1;

        UPDATE Product
        SET ProductName = @ProductName,
            SalesPrice  = @SalesPrice,
            Color       = @Color,
            ClassID     = @ClassID,
            CollectionID= @CollectionID
        WHERE ProductCode = @ProductCode;

        COMMIT TRANSACTION;
    END
END
GO


CREATE PROCEDURE sp_GetSalesOrderById
    @OrderID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        so.OrderID, so.OrderDate, so.OrderStatus, so.TotalAmount, so.UsedCurrency,
        so.CustomerID, c.FirstName, c.LastName, c.Email,
        so.SalesEmployeeID, e.FirstName AS SalesEmpFirstName, e.LastName AS SalesEmpLastName,
        so.CountryID, co.CountryName
    FROM SalesOrder so
    JOIN Customer c ON c.CustomerID = so.CustomerID
    JOIN Employee e ON e.EmployeeID = so.SalesEmployeeID
    JOIN Country co ON co.CountryID = so.CountryID
    WHERE so.OrderID = @OrderID;

    SELECT
        od.OrderDetailID, od.OrderID, od.ProductCode, p.ProductName,
        od.Quantity, od.UnitPrice, od.LineTotal
    FROM dbo.OrderDetail od
    JOIN dbo.Product p ON p.ProductCode = od.ProductCode
    WHERE od.OrderID = @OrderID
    ORDER BY od.OrderDetailID;
END
GO

CREATE PROCEDURE sp_ListSalesOrders
    @CustomerID INT,
    @Status NVARCHAR(20),
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (300)
        so.OrderID, so.OrderDate, so.OrderStatus, so.TotalAmount, so.UsedCurrency,
        so.CustomerID, c.FirstName, c.LastName
    FROM SalesOrder so
    JOIN Customer c ON c.CustomerID = so.CustomerID
    WHERE (@CustomerID IS NULL OR so.CustomerID = @CustomerID)
      AND (@Status IS NULL OR so.OrderStatus = @Status)
      AND (@FromDate IS NULL OR so.OrderDate >= DATEFROMPARTS(YEAR(@FromDate), MONTH(@FromDate), DAY(@FromDate)))
      AND (@ToDate IS NULL OR so.OrderDate < DATEADD(DAY, 1, @ToDate))
    ORDER BY so.OrderID;
END
GO

CREATE PROCEDURE sp_ChangeSalesOrderStatus
    @OrderID INT,
    @NewStatus NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM SalesOrder WHERE OrderID=@OrderID)
            THROW 50110, 'Sales order not found.', 1;

        IF @NewStatus NOT IN ('New','Paid','Shipped','Cancelled')
            THROW 50111, 'Invalid status.', 1;

        UPDATE SalesOrder
        SET OrderStatus = @NewStatus
        WHERE OrderID = @OrderID;

        COMMIT TRANSACTION;
    END
END
GO


CREATE PROCEDURE sp_UpdateProductionOrderStatus
    @ProductionOrderID INT,
    @NewStatus NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        IF @NewStatus NOT IN ('Planned','InProgress','Completed','Cancelled')
            THROW 50120, 'Invalid production status.', 1;

        IF NOT EXISTS (SELECT 1 FROM ProductionOrder WHERE ProductionOrderID=@ProductionOrderID)
            THROW 50121, 'Production order not found.', 1;

        UPDATE ProductionOrder
        SET ProductionStatus = @NewStatus
        WHERE ProductionOrderID = @ProductionOrderID;

        COMMIT TRANSACTION;
    END
END
GO

CREATE PROCEDURE sp_AddProductionTrackingStart
    @ProductionOrderID INT,
    @StepID INT,
    @StartTime DATETIME2(0)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM ProductionOrder WHERE ProductionOrderID=@ProductionOrderID)
            THROW 50130, 'Production order not found.', 1;

        IF NOT EXISTS (SELECT 1 FROM ProductionStep WHERE StepID=@StepID)
            THROW 50131, 'Production step not found.', 1;

        IF @StartTime IS NULL SET @StartTime = SYSDATETIME();

        INSERT INTO ProductionTracking (StartTime, EndTime, ProductionOrderID, StepID)
        VALUES (@StartTime, NULL, @ProductionOrderID, @StepID);

        COMMIT TRANSACTION;
    END

END
GO

CREATE PROCEDURE sp_AddProductionTrackingEnd
    @ProductionOrderID INT,
    @StepID INT,
    @EndTime DATETIME2(0)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        IF @EndTime IS NULL SET @EndTime = SYSDATETIME();

        IF NOT EXISTS (
            SELECT 1 FROM ProductionTracking
            WHERE ProductionOrderID=@ProductionOrderID AND StepID=@StepID
        )
            THROW 50140, 'Tracking record not found.', 1;

        UPDATE ProductionTracking
        SET EndTime = @EndTime
        WHERE ProductionOrderID=@ProductionOrderID AND StepID=@StepID;

        COMMIT TRANSACTION;
    END
END
GO

CREATE PROCEDURE sp_ListProductionOrders
    @Status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (300)
        po.ProductionOrderID, po.ProductCode, p.ProductName,
        po.Quantity, po.StartDate, po.ProductionStatus,
        po.ResponsibleEmployeeID
    FROM dbo.ProductionOrder po
    JOIN dbo.Product p ON p.ProductCode = po.ProductCode
    WHERE @Status IS NULL OR po.ProductionStatus = @Status
    ORDER BY po.ProductionOrderID DESC;
END
GO

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


CREATE PROCEDURE sp_UpdateOrderDetail
    @OrderDetailID INT,
    @Quantity INT,
    @UnitPrice DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        DECLARE @OrderID INT;

        SELECT @OrderID = OrderID
        FROM OrderDetail
        WHERE OrderDetailID = @OrderDetailID;

        IF @OrderID IS NULL
            THROW 50150, 'Order detail not found.', 1;

        IF @Quantity <= 0 OR @UnitPrice < 0
            THROW 50151, 'Invalid quantity or unit price.', 1;

        UPDATE OrderDetail
        SET Quantity = @Quantity,
            UnitPrice = @UnitPrice
        WHERE OrderDetailID = @OrderDetailID;

        EXEC sp_RecalculateSalesOrderTotal @OrderID;

        COMMIT TRANSACTION;
    END
END
GO


CREATE PROCEDURE sp_DeleteOrderDetail
    @OrderDetailID INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        DECLARE @OrderID INT;

        SELECT @OrderID = OrderID
        FROM OrderDetail
        WHERE OrderDetailID = @OrderDetailID;

        IF @OrderID IS NULL
            THROW 50160, 'Order detail not found.', 1;

        DELETE FROM OrderDetail
        WHERE OrderDetailID = @OrderDetailID;

        EXEC sp_RecalculateSalesOrderTotal @OrderID;

        COMMIT TRANSACTION;
    END
END
GO


CREATE PROCEDURE sp_DeleteProductFromSales
    @ProductCode NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Product WHERE ProductCode = @ProductCode)
            THROW 50170, 'Product not found.', 1;

        DELETE FROM Product
        WHERE ProductCode = @ProductCode;

        COMMIT TRANSACTION;
    END
END
GO
