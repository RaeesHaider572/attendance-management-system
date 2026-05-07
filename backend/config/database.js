const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Sa@128',
    server: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'AttendanceDataB',
    options: {
        encrypt: false, // For local SQL Server
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Connection pool
let pool = null;

async function getConnection() {
    try {
        if (pool && pool.connected) {
            return pool;
        }
        pool = await sql.connect(dbConfig);
        console.log('✅ Database connected successfully');
        return pool;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

module.exports = { getConnection, sql };