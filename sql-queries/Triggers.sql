
USE OttoBagno;
GO

-- TRIGGER-1
-- Decrease Product Stock
-- This trigger automatically updates product stock levels after
-- a sales transaction and prevents negative inventory quantities.



-- TRIGGER-2,3
-- Prevent Customer Type Conflict
-- This triggers enforce the disjoint specialization rule by preventing
-- a customer from being classified as both domestic and international.

CREATE TRIGGER trg_PreventCustomerTypeConflict
ON DomesticCustomer
AFTER INSERT

AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN InternationalCustomer ic
            ON ic.CustomerID = i.CustomerID
    )
    BEGIN
        RAISERROR ('Customer cannot be both Domestic and International.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO


CREATE TRIGGER trg_PreventCustomerTypeConflict_Int
ON InternationalCustomer
AFTER INSERT

AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN DomesticCustomer dc
            ON dc.CustomerID = i.CustomerID
    )
    BEGIN
        RAISERROR ('Customer cannot be both Domestic and International.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO


-- TRIGGER-4
-- Update Order Status After Payment
-- This trigger automatically updates the sales order status once
-- the total completed payments cover the order amount.

CREATE TRIGGER trg_UpdateOrderStatusAfterPayment
ON Payment
AFTER INSERT

AS
BEGIN
    SET NOCOUNT ON;

    UPDATE so
    SET so.OrderStatus = 'Paid'
    FROM SalesOrder so
    JOIN (
        SELECT OrderID, SUM(Amount) AS TotalPaid
        FROM Payment
        WHERE PaymentStatus = 'Completed'
        GROUP BY OrderID
    ) p ON so.OrderID = p.OrderID
    WHERE p.TotalPaid >= so.TotalAmount;
END;
GO

CREATE OR ALTER  TRIGGER [dbo].[trg_OrderDetail_StockManager]
ON [dbo].[OrderDetail]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StockChanges TABLE (ProductCode NVARCHAR(20), Delta INT);

    INSERT INTO @StockChanges (ProductCode, Delta)
    SELECT 
        ISNULL(n.ProductCode, o.ProductCode) AS ProductCode,
        ISNULL(o.Qty, 0) - ISNULL(n.Qty, 0) AS Delta
    FROM 
        (SELECT ProductCode, SUM(Quantity) AS Qty FROM deleted GROUP BY ProductCode) o
    FULL OUTER JOIN 
        (SELECT ProductCode, SUM(Quantity) AS Qty FROM inserted GROUP BY ProductCode) n 
        ON o.ProductCode = n.ProductCode;

    IF EXISTS (
        SELECT 1 
        FROM @StockChanges sc
        JOIN dbo.Product p ON p.ProductCode = sc.ProductCode
        WHERE p.StockQuantity + sc.Delta < 0
    )
    BEGIN

        THROW 51000, N'Out of stock!', 1;
        RETURN;
    END

    UPDATE p
    SET p.StockQuantity = p.StockQuantity + sc.Delta
    FROM dbo.Product p
    JOIN @StockChanges sc ON p.ProductCode = sc.ProductCode
    WHERE sc.Delta <> 0;

END;
GO
ALTER TABLE [dbo].[OrderDetail] ENABLE TRIGGER [trg_OrderDetail_StockManager]
GO
