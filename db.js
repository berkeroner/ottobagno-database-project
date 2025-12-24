const sql = require('mssql');

const config = {
    user: 'USERNAME',
    password: 'PASSWORD',
    server: 'SERVERNAME',
    database: 'DATABASENAME',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

module.exports = {
    sql,
    config
};
