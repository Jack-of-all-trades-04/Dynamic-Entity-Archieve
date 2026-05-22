const mysql = require('mysql2/promise');
require('dotenv').config();

const sqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'mysql-service',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'admin123',
    database: process.env.MYSQL_DATABASE || 'bestiary_db',
    waitForConnections: true,
    connectionLimit: 10
});

console.log('[DB] MySQL Connection Pool created...');

module.exports = sqlPool;
