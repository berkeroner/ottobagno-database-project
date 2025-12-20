const sql = require('mssql');

const config = {
    user: 'USERNAME',
    password: 'PASSWORD',
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
