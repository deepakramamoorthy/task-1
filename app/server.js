const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  user: 'myuser',
  host: 'db',    
  database: 'mydatabase', 
  password: 'mypassword', 
  port: 5432,
});

async function initializeDb() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        value INTEGER
      );
    `);

    const { rowCount } = await client.query('SELECT COUNT(*) FROM items');
    if (rowCount === 0) {
      await client.query(`
        INSERT INTO items (name, value) VALUES
        ('Item A', 100),
        ('Item B', 200),
        ('Item C', 300);
      `);
      console.log('Initial data inserted.');
    } else {
      console.log('Items table already exists and contains data.');
    }
    client.release();
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initializeDb();

app.get('/', (req, res) => {
  res.send('Node.js app is running. Go to /data to fetch data from the database.');
});

app.get('/data', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM items ORDER BY id;');
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Error fetching data');
  }
});

app.listen(port, () => {
  console.log(`Node.js app listening at http://localhost:${port}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  pool.end(() => {
    console.log('Database connection pool closed.');
    process.exit(0);
  });
});
