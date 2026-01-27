// User Controller - Handle user management (Admin operations)
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT user_id, full_name, email, phone, role, status, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get logged-in user's profile
const getUserProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const [users] = await pool.query(
      'SELECT user_id, full_name, email, phone, role, status, created_at FROM users WHERE user_id = ?',
      [user_id]
    );

    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update logged-in user's profile
const updateUserProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { full_name, phone } = req.body;
    await pool.query('UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?', [full_name, phone, user_id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new user (Admin only)
const createUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    // Validate input
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, phone, password_hash, role || 'user']
    );

    res.status(201).json({
      message: 'User created successfully',
      user_id: result.insertId
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { full_name, email, phone } = req.body;

    // Check if user exists
    const [user] = await pool.query(
      'SELECT * FROM users WHERE user_id = ?',
      [user_id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user
    await pool.query(
      'UPDATE users SET full_name = ?, email = ?, phone = ? WHERE user_id = ?',
      [full_name, email, phone, user_id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change user status (Admin only - Activate/Deactivate)
const changeUserStatus = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Check if user exists
    const [user] = await pool.query(
      'SELECT * FROM users WHERE user_id = ?',
      [user_id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deactivating admins
    if (user[0].role === 'admin' && status === 'inactive') {
      return res.status(400).json({ message: 'Cannot deactivate admin account' });
    }

    // Update status
    await pool.query(
      'UPDATE users SET status = ? WHERE user_id = ?',
      [status, user_id]
    );

    res.json({ message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user statistics (Admin only)
const getUserStats = async (req, res) => {
  try {
    // Total users
    const [totalUsers] = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE role = "user"'
    );

    // Active users
    const [activeUsers] = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE status = "active" AND role = "user"'
    );

    // New users this month
    const [newUsers] = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())'
    );

    res.json({
      totalUsers: totalUsers[0].total,
      activeUsers: activeUsers[0].total,
      newUsersThisMonth: newUsers[0].total
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export {
  getAllUsers,
  createUser,
  updateUser,
  changeUserStatus,
  getUserStats,
  getUserProfile,
  updateUserProfile,
};
