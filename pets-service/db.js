const mysql = require('mysql2/promise');

const {
  DB_HOST = 'mariadb',
  DB_USER = 'app',
  DB_PASS = 'app',
  DB_NAME = 'pixelpets',
} = process.env;

let pool;
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME,
      waitForConnections: true, connectionLimit: 10, queueLimit: 0,
    });
    // init table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        species VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return pool;
}

module.exports = { getPool };
