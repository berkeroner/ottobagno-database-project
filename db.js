const sql = require('mssql');

const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'OttoBagno',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

module.exports = {
    sql,
    config
};
