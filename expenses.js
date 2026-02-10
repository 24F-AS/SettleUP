// routes/expenses.js

const express = require('express');
const router = express.Router();
const pool = require('../db');

// ---------------------------------------------------------
// Add an expense
//  - Frontend sends: group_id, paid_by, description, amount
//  - Backend:
//      * inserts into expenses
//      * looks up all group members
//      * creates equal splits in transaction_splits
// ---------------------------------------------------------
router.post('/add', async (req, res) => {
  const { group_id, paid_by, description, amount } = req.body;

  if (!group_id || !paid_by || !amount) {
    return res.status(400).json({ error: 'Missing required fields (group_id, paid_by, amount).' });
  }

  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1) Insert expense
    const [result] = await connection.query(
      `INSERT INTO expenses (group_id, paid_by, description, amount)
       VALUES (?, ?, ?, ?)`,
      [group_id, paid_by, description || null, amt]
    );
    const expense_id = result.insertId;

    // 2) Get members of this group
    const [members] = await connection.query(
      `SELECT user_id FROM group_members WHERE group_id = ?`,
      [group_id]
    );

    let memberIds = members.map(m => m.user_id);

    // Fallback: if somehow no members, at least split on payer
    if (!memberIds.length) {
      memberIds = [paid_by];
    }

    const share = Number((amt / memberIds.length).toFixed(2));

    // 3) Create splits: each member owes equal share
    for (const uid of memberIds) {
      await connection.query(
        `INSERT INTO transaction_splits (expense_id, owed_by, share_amount)
         VALUES (?, ?, ?)`,
        [expense_id, uid, share]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Expense added successfully',
      expense_id
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Internal server error while adding expense.' });
  } finally {
    connection.release();
  }
});

// ---------------------------------------------------------
// Get expenses for a group – used by your UI
// ---------------------------------------------------------
router.get('/group/:group_id', async (req, res) => {
  const { group_id } = req.params;

  try {
    const [expenses] = await pool.query(
      `SELECT 
         e.expense_id, 
         e.description, 
         e.amount, 
         e.paid_by, 
         u.name AS paid_by_name, 
         e.date_created
       FROM expenses e
       JOIN users u ON e.paid_by = u.user_id
       WHERE e.group_id = ?
       ORDER BY e.date_created DESC`,
      [group_id]
    );

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal server error while fetching expenses.' });
  }
});

// kept for compatibility, not used by your current UI
router.get('/from-group/:group_id', async (req, res) => {
  const { group_id } = req.params;

  try {
    const [expenses] = await pool.query(
      `SELECT 
         e.expense_id, 
         e.description, 
         e.amount, 
         e.paid_by, 
         u.name AS paid_by_name, 
         e.date_created
       FROM expenses e
       JOIN users u ON e.paid_by = u.user_id
       WHERE e.group_id = ?
       ORDER BY e.date_created DESC`,
      [group_id]
    );

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal server error while fetching expenses.' });
  }
});

// ---------------------------------------------------------
// Settle balances for a group based on transaction_splits
// Returns: [{ fromId, toId, fromName, toName, amount }]
// ---------------------------------------------------------
router.get('/settle/:group_id', async (req, res) => {
  const { group_id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT e.paid_by, t.owed_by, t.share_amount
       FROM expenses e
       JOIN transaction_splits t ON e.expense_id = t.expense_id
       WHERE e.group_id = ?
         AND t.share_amount > 0`,
      [group_id]
    );

    if (!rows.length) {
      return res.json([]); // nothing to settle
    }

    // Net balances
    const balances = {};
    rows.forEach(r => {
      const paidBy = r.paid_by;
      const owedBy = r.owed_by;
      const share = Number(r.share_amount);

      balances[paidBy] = (balances[paidBy] || 0) + share; // payer gets credit
      balances[owedBy] = (balances[owedBy] || 0) - share; // each participant owes
    });

    const userIds = Object.keys(balances);
    if (!userIds.length) {
      return res.json([]);
    }

    // Get names
    const [users] = await pool.query(
      `SELECT user_id, name FROM users WHERE user_id IN (?)`,
      [userIds]
    );

    const userMap = {};
    users.forEach(u => {
      userMap[u.user_id] = u.name;
    });

    const creditors = [];
    const debtors = [];

    userIds.forEach(id => {
      const bal = Number(balances[id].toFixed(2));
      if (bal > 0.01) {
        creditors.push({ userId: Number(id), balance: bal });
      } else if (bal < -0.01) {
        debtors.push({ userId: Number(id), balance: -bal }); // they owe this much
      }
    });

    if (!creditors.length && !debtors.length) {
      return res.json([]);
    }

    // Greedy matching
    const settlements = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Number(Math.min(debtor.balance, creditor.balance).toFixed(2));

      if (amount > 0.01) {
        settlements.push({
          fromId: debtor.userId,
          toId: creditor.userId,
          fromName: userMap[debtor.userId],
          toName: userMap[creditor.userId],
          amount
        });

        debtor.balance -= amount;
        creditor.balance -= amount;
      }

      if (debtor.balance <= 0.01) i++;
      if (creditor.balance <= 0.01) j++;
    }

    return res.json(settlements);
  } catch (error) {
    console.error('Error in settlement:', error);
    res.status(500).json({ error: 'Internal server error while settling expenses.' });
  }
});

// ---------------------------------------------------------
// Record a single settlement as an expense
// Body: { group_id, fromUserId, toUserId, amount, fromName, toName }
// ---------------------------------------------------------
router.post('/settle-payment', async (req, res) => {
  const { group_id, fromUserId, toUserId, amount, fromName, toName } = req.body;

  if (!group_id || !fromUserId || !toUserId || !amount) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  const description = `Settlement: ${fromName || 'User'} paid ${toName || 'User'} ₹${amt.toFixed(2)}`;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1) Insert settlement expense
    const [result] = await connection.query(
      `INSERT INTO expenses (group_id, paid_by, description, amount)
       VALUES (?, ?, ?, ?)`,
      [group_id, fromUserId, description, amt]
    );
    const expense_id = result.insertId;

    // 2) Split: the receiver is owed the full amount
    await connection.query(
      `INSERT INTO transaction_splits (expense_id, owed_by, share_amount)
       VALUES (?, ?, ?)`,
      [expense_id, toUserId, amt]
    );

    await connection.commit();

    res.status(201).json({ message: 'Settlement recorded successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error recording settlement payment:', error);
    res.status(500).json({ error: 'Internal server error while recording settlement.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
