

-- VIEW-1
-- Sales Order Totals
-- This view calculates the total order amount and total number of items
-- per sales order by aggregating order detail records.

CREATE VIEW vSalesOrderTotals
AS
SELECT
    so.OrderID,
    so.OrderDate,
    so.OrderStatus,
    so.CustomerID,
    SUM(od.LineTotal) AS OrderTotal,
    SUM(od.Quantity) AS TotalItems
FROM SalesOrder so
    LEFT JOIN OrderDetail od ON so.OrderID = od.OrderID
GROUP BY so.OrderID, so.OrderDate, so.OrderStatus, so.CustomerID;
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


