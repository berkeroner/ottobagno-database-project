# OttoBagno Database Project

This project is a comprehensive database management system developed for a bathroom and kitchen products e-commerce platform. It features a backend built with Node.js and Express.js, and uses MSSQL (SQL Server) for robust database management.

## Prerequisites

To run this project, you need to have the following installed:

1.  **Node.js**: (v14 or later is recommended)
2.  **Microsoft SQL Server**: (SQL Server 2017+ or Express Edition)
3.  **SQL Server Management Studio (SSMS)**, **Azure Data Studio**, or any other SQL client: To execute the database scripts.

## Installation and Setup

### 1. Download Project & Install Dependencies

Clone or download the project, then open a terminal in the root directory and install dependencies:

```bash
npm install
```

### 2. Database Setup

The project requires a database named `testson` and specific tables/procedures.

1.  Create a database named `testson` in SQL Server (or update `db.js` if you choose a different name).
2.  Execute the scripts in the `sql-queries` folder in the **EXACT ORDER** listed below:
    -   `1. CreateTables.sql`: Creates the database tables.
    -   `2. SeedData.sql`: Populates tables with sample data.
    -   `3. StoreProcedures.sql`: Adds stored procedures.
    -   `4. Triggers.sql`: Adds database triggers.
    -   `5. Views.sql`: Creates database views.
    -   `6. Indexes.sql`: Adds indexes for performance optimization.

> **NOTE:** Do not forget to update the SQL Server connection credentials in the `db.js` file to match your local setup!

`db.js` Configuration Example:
```javascript
const config = {
    user: 'USERNAME', // Your SQL Server username
    password: 'PASSWORD', // Your SQL Server password
    server: 'SERVERNAME',
    database: 'DATABASENAME',
    // ...
};
```

### 3. Start the Application

Once the database is ready, start the application:

```bash
npm start
```

The server will run on `http://localhost:3000` by default. Open this URL in your browser.

## Login Information

You can use the following credentials to log in. There is no password field; login is authentication-based on First Name, Last Name, and Email matching.

### Admin Login
To access the Admin Panel:
-   **First Name:** `admin`
-   **Last Name:** `admin`
-   **Email:** `admin@ottobagno.com` (or any email)

### Customer Login
Sample customer data (from `SeedData.sql`):
-   **First Name:** `FirstName`
-   **Last Name:** `LastName`
-   **Email:** `Email`

## Project Structure

-   `public/`: HTML, CSS, and JavaScript (Frontend) files.
-   `routes/`: Express.js API routes (`auth`, `admin`, `product`, `order`, etc.).
-   `sql-queries/`: Database setup scripts.
-   `server.js`: Application entry point and server configuration.
-   `db.js`: Database connection configuration.

## Features

-   Customer Registration and Login.
-   Product Listing and Search.
-   Shopping Cart and Order Placement.
-   **Admin Panel:**
    -   Product Management (Add/Delete/Update).
    -   Employee Management.
    -   Purchase Order: Used to restock raw materials. When products run low, Purchase Orders are created for suppliers.
    -   Order Management and Status Updates.
    -   Raw Material and Supplier Management.
    -   Production Order Creation.

## Future Improvements

The following features are planned for future releases to enhance the application:

-   **Enhanced Security**: Implementation of password hashing (e.g., bcrypt) and JWT-based authentication for secure sessions.
-   **Payment Gateway Integration**: Integration with real payment providers (Stripe, PayPal, etc.) to replace the current simulated payment system.
-   **Advanced Analytics Dashboard**: Visual charts and graphs for sales trends, top-selling products, and inventory forecasts.
-   **Docker Support**: Containerizing the Node.js app and SQL Server for consistent development and deployment environments.
-   **Email Notifications**: Automated email services for order confirmations, shipping updates, and low-stock alerts.
-   **Mobile Optimization**: Further improvements to the UI for a seamless mobile experience.