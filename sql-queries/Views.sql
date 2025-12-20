
USE OttoBagno;
GO

-- VIEW-1
-- Sales By Customer Type
-- This view compares domestic and international sales by aggregating
-- order counts and revenue according to customer type.

CREATE VIEW vSalesByCustomerType
AS
SELECT
    CASE 
        WHEN dc.CustomerID IS NOT NULL THEN 'Domestic'
        WHEN ic.CustomerID IS NOT NULL THEN 'International'
        ELSE 'Unknown'
    END AS CustomerType,
    COUNT(DISTINCT so.OrderID) AS OrderCount,
    SUM(od.LineTotal) AS Revenue
FROM SalesOrder so
    JOIN OrderDetail od ON so.OrderID = od.OrderID
    LEFT JOIN DomesticCustomer dc ON so.CustomerID = dc.CustomerID
    LEFT JOIN InternationalCustomer ic ON so.CustomerID = ic.CustomerID
WHERE so.OrderStatus <> 'Cancelled'
GROUP BY
    CASE 
        WHEN dc.CustomerID IS NOT NULL THEN 'Domestic'
        WHEN ic.CustomerID IS NOT NULL THEN 'International'
        ELSE 'Unknown'
    END;
GO


-- VIEW-2
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

-- VIEW-3
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
        WHEN StockQuantity < 100 THEN 'LOW STOCK'
        ELSE 'OK'
    END AS StockStatus
FROM Product p;
GO

-- VIEW-4
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

-- VIEW-5
-- Purchase Order Summary
-- This view summarizes each purchase order by calculating its total amount and
-- number of items using aggregated data from PurchaseOrderDetail and supplier information.

CREATE VIEW vPurchaseOrderSummary
AS
SELECT
    po.PurchaseOrderID,
    po.OrderDate,
    po.OrderStatus,
    s.CompanyName AS SupplierName,
    SUM(pod.LineTotal) AS TotalAmount,
    COUNT(pod.PurchaseOrderDetailID) AS ItemCount
FROM PurchaseOrder po
    LEFT JOIN PurchaseOrderDetail pod ON po.PurchaseOrderID = pod.PurchaseOrderID
    INNER JOIN Supplier s ON po.SupplierID = s.SupplierID
GROUP BY po.PurchaseOrderID, po.OrderDate, po.OrderStatus, s.CompanyName;
GO

-- VIEW-6
-- Order Payment Status
-- This view determines the payment status of each sales order by comparing the
-- total order amount with the sum of payments made for that order.

CREATE VIEW vOrderPaymentStatus
AS
SELECT
    so.OrderID,
    SUM(p.Amount) AS PaidAmount,
    so.TotalAmount,
    CASE
        WHEN SUM(p.Amount) >= so.TotalAmount THEN 'Paid'
        WHEN SUM(p.Amount) > 0 THEN 'Partially Paid'
        ELSE 'Unpaid'
    END AS PaymentStatus
FROM SalesOrder so
    LEFT JOIN Payment p ON so.OrderID = p.OrderID
GROUP BY so.OrderID, so.TotalAmount;
GO

-- VIEW-7
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

-- VIEW-8
-- Supplier Purchase Summary
-- This view summarizes purchasing activity by calculating total purchase
-- orders and spending amounts for each supplier.

CREATE VIEW vSupplierPurchaseSummary
AS
SELECT
    s.SupplierID,
    s.CompanyName,
    COUNT(DISTINCT po.PurchaseOrderID) AS PurchaseOrderCount,
    SUM(pod.LineTotal) AS TotalPurchasedAmount
FROM Supplier s
    LEFT JOIN PurchaseOrder po ON s.SupplierID = po.SupplierID
    LEFT JOIN PurchaseOrderDetail pod ON po.PurchaseOrderID = pod.PurchaseOrderID
WHERE po.PurchaseOrderID IS NOT NULL
GROUP BY s.SupplierID, s.CompanyName;
GO

