

-- VIEW-1
-- Sales Order Totals
-- This view calculates the total order amount and total number of items
-- per sales order by aggregating order detail records.

CREATE OR ALTER VIEW dbo.vSalesOrderTotals
AS
SELECT
    so.OrderID,
    so.OrderDate,
    so.OrderStatus,
    so.CustomerID,

    od.OrderDetailID,
    od.ProductCode,
    od.Quantity,
    od.UnitPrice,
    od.LineTotal,

    SUM(od.LineTotal) OVER (PARTITION BY so.OrderID) AS OrderTotal,
    SUM(od.Quantity)  OVER (PARTITION BY so.OrderID) AS TotalItems
FROM dbo.SalesOrder so
LEFT JOIN dbo.OrderDetail od
    ON od.OrderID = so.OrderID;
GO



-- VIEW-2
-- Product Stock Status
-- This view categorizes product inventory quantities according
-- to business critical situations.

CREATE VIEW vProductStockStatus
AS
SELECT
    p.ProductCode,
    p.ProductName,
    p.StockQuantity,
    CASE
        WHEN StockQuantity = 0 THEN 'OUT OF STOCK'
        WHEN StockQuantity < 10 THEN 'LOW STOCK'
        ELSE 'OK'
    END AS StockStatus
FROM Product p;
GO

-- VIEW-3
-- Raw Material Stock Status
-- This view monitors raw material inventory levels and identifies materials
-- that require replenishment based on safety stock thresholds.

CREATE VIEW vRawMaterialStockStatus
AS
SELECT
    rm.MaterialID,
    rm.MaterialName,
    rm.StockQuantity,
    rm.SafetyStockLevel,
    CASE
        WHEN StockQuantity < SafetyStockLevel THEN 'REORDER REQUIRED'
        ELSE 'OK'
    END AS StockStatus
FROM RawMaterial rm;
GO


-- VIEW-4
-- Best Selling Products
-- This view identifies best-selling products by calculating total quantities
-- sold and total revenue based on sales order details.

CREATE VIEW vBestSellingProducts
AS
SELECT
    p.ProductCode,
    p.ProductName,
    SUM(od.Quantity) AS TotalQtySold,
    SUM(od.LineTotal) AS TotalRevenue
FROM Product p
    JOIN OrderDetail od ON p.ProductCode = od.ProductCode
    JOIN SalesOrder so ON od.OrderID = so.OrderID
WHERE so.OrderStatus <> 'Cancelled'
GROUP BY p.ProductCode, p.ProductName;
GO
