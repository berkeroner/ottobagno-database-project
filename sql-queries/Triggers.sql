
USE OttoBagno;
GO

-- TRIGGER-1
-- Decrease Product Stock
-- This trigger automatically updates product stock levels after
-- a sales transaction and prevents negative inventory quantities.

CREATE TRIGGER trg_DecreaseProductStock
ON OrderDetail
AFTER INSERT

AS
BEGIN
    SET NOCOUNT ON;

    UPDATE p
    SET p.StockQuantity = p.StockQuantity - i.Quantity
    FROM Product p
    JOIN inserted i ON i.ProductCode = p.ProductCode;

    IF EXISTS (
        SELECT 1
        FROM Product
        WHERE StockQuantity < 0
    )

    BEGIN
        RAISERROR ('Insufficient product stock.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO


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
