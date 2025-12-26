
-- INDEX-1
-- SalesOrder - CustomerID
-- This index improves the performance of queries that
-- retrieve sales orders for a specific customer.

CREATE INDEX IX_SalesOrder_CustomerID
ON SalesOrder(CustomerID);


-- INDEX-2
-- OrderDetail - OrderID
-- This index optimizes the retrieval of order detail
-- records associated with a specific sales order.

CREATE INDEX IX_OrderDetail_OrderID
ON OrderDetail(OrderID);


-- INDEX-3
-- OrderDetail - ProductCode
-- This index enhances query performance when analyzing
-- sales data by product.

CREATE INDEX IX_OrderDetail_ProductCode
ON OrderDetail(ProductCode);


-- INDEX-4
-- Payment - OrderID
-- This index accelerates access to payment records related
-- to a specific sales order.

CREATE INDEX IX_Payment_OrderID
ON Payment(OrderID);


-- INDEX-5
-- PurchaseOrder - SupplierID
-- This index improves query efficiency when listing purchase
-- orders for a given supplier.

CREATE INDEX IX_PurchaseOrder_SupplierID
ON PurchaseOrder(SupplierID);


-- INDEX-6
-- PurchaseOrderDetail - PurchaseOrderID
-- This index optimizes the retrieval of purchase order detail
-- records for a specific purchase order.

CREATE INDEX IX_PurchaseOrderDetail_PurchaseOrderID
ON PurchaseOrderDetail(PurchaseOrderID);


-- INDEX-7
-- ProductionOrder - ProductCode
-- This index enhances performance when retrieving production
-- orders associated with a specific product.

CREATE INDEX IX_ProductionOrder_ProductCode
ON ProductionOrder(ProductCode);


-- INDEX-8
-- BOM - ProductCode
-- This index speeds up access to bill of materials information
-- for a given product during production planning.

CREATE INDEX IX_BillOfMaterials_ProductCode
ON BillOfMaterials(ProductCode);


-- INDEX-9
-- SalesOrder - OrderDate
-- This index improves performance for queries that filter or
-- report sales orders by status and order date.

CREATE INDEX IX_SalesOrder_Status_OrderDate
ON SalesOrder (OrderStatus, OrderDate);


-- INDEX-10
-- OrderDetail - ProductCode
-- This index optimizes product-based sales analysis by accelerating
-- access to order detail quantities and line totals.

CREATE INDEX IX_OrderDetail_ProductCode_Inc
ON OrderDetail (ProductCode)
INCLUDE (Quantity, LineTotal, OrderID);


-- INDEX-11
-- Payment - OrderID
-- This index enhances query efficiency when filtering payment records
-- by payment status and related sales orders.

CREATE INDEX IX_Payment_Status_OrderID
ON Payment (PaymentStatus, OrderID);


-- INDEX-12
-- PurchaseOrder - ExpectedDeliveryDate
-- This index speeds up purchase order tracking queries based on order
-- status and expected delivery dates.

CREATE INDEX IX_PurchaseOrder_Status_ExpectedDate
ON PurchaseOrder (OrderStatus, ExpectedDeliveryDate);

