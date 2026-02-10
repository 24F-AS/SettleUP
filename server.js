const express = require('express');
const cors = require('cors');
const pool = require('./db');

const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.pool = pool;
  next();
});

app.get('/', (req, res) => {
  res.status(200).send(' SettleUp Backend API is running successfully!');
});

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);

app.use((req, res) => {
  res.status(404).json({ error: ' Route not found' });
});

app.use((err, req, res, next) => {
  console.error(' Global Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(` Server running on port ${port}`);
  console.log(`  Access API at: http://localhost:${port}/`);
});
