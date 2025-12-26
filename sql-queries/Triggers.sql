
-- TRIGGER-4
-- Update Order Status After Payment
-- This trigger automatically updates the sales order status once
-- the total completed payments cover the order amount.

CREATE OR ALTER TRIGGER trg_UpdateOrderStatusAfterPayment
ON Payment
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE so
    SET so.OrderStatus = 'New'
    FROM SalesOrder so
    JOIN (
        SELECT P.OrderID, SUM(P.Amount) AS TotalPaid
        FROM Payment P
        WHERE P.PaymentStatus = 'Completed'
        AND P.OrderID IN (SELECT OrderID FROM inserted)
        GROUP BY P.OrderID
    ) p ON so.OrderID = p.OrderID
    WHERE p.TotalPaid >= so.TotalAmount 
      AND so.OrderID IN (SELECT OrderID FROM inserted);
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
