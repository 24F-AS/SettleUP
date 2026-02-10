const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/create', async (req, res) => {
  const { groupName, createdBy } = req.body;

  if (!groupName || !createdBy) {
    return res.status(400).json({ message: 'Group name and creator ID are required.' });
  }

  const creatorId = parseInt(createdBy);
  let connection;

  try {
    const [userRows] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [creatorId]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Creator not found.' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [groupResult] = await connection.query(
      'INSERT INTO `groups` (group_name, created_by) VALUES (?, ?)',
      [groupName, creatorId]
    );
    const newGroupId = groupResult.insertId;

    await connection.query(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [newGroupId, creatorId]
    );

    await connection.commit();

    res.status(201).json({
      message: `Group '${groupName}' created successfully!`,
      groupId: newGroupId
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } finally {
        connection.release();
      }
    }
    return res.status(500).json({ message: 'Internal server error during group creation.' });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/mygroups', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT g.group_id, g.group_name, g.created_by
       FROM \`groups\` g
       JOIN group_members gm ON g.group_id = gm.group_id
       WHERE gm.user_id = ?
       ORDER BY g.group_id DESC`,
      [userId]
    );
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error fetching groups.' });
  }
});

router.post('/addmember', async (req, res) => {
  const { groupId, memberEmail, addedBy } = req.body;

  if (!groupId || !memberEmail || !addedBy) {
    return res.status(400).json({ message: 'Group ID, member email, and addedBy are required.' });
  }

  try {
    const [groupCheck] = await pool.query('SELECT group_id FROM `groups` WHERE group_id = ?', [groupId]);
    if (groupCheck.length === 0) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const [userRows] = await pool.query('SELECT user_id FROM users WHERE email = ?', [memberEmail]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const memberId = userRows[0].user_id;

    const [existing] = await pool.query(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, memberId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'User already a member of this group.' });
    }

    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, memberId]);
    return res.status(200).json({
      message: `Member '${memberEmail}' added successfully to group!`
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error during member addition.' });
  }
});

router.get('/:group_id/expenses', async (req, res) => {
  const { group_id } = req.params;

  try {
    const [expenses] = await pool.query(
      `SELECT 
         e.expense_id,
         e.description,
         e.amount,
         u.name AS paid_by_name,
         e.date_created
       FROM expenses e
       JOIN users u ON e.paid_by = u.user_id
       WHERE e.group_id = ?
       ORDER BY e.expense_id DESC`,
      [group_id]
    );

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error while fetching group expenses.' });
  }
});

module.exports = router;
