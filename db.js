const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'settleup_user',
  password: 'App@2611_db',   // ✅ use a strong password
  database: 'settleup',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  multipleStatements: false
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful!');
    console.log('🔗 Connected to database: settleup');
    connection.release();
  } catch (err) {
    console.error('❌ DATABASE CONNECTION ERROR!');
    console.error(' Please check your credentials and ensure MySQL is running.');
    console.error('Error Message:', err.message);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  console.log('\n🔌 Closing MySQL connection pool...');
  await pool.end();
  console.log(' MySQL connection pool closed. Exiting gracefully.');
  process.exit(0);
});

module.exports = pool;
