// User Controller - Handle user operations with admin ownership
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

// Get all users (Admin sees only users who booked their services)
const getAllUsers = async (req, res) => {
  try {
    const admin_id = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get users who have booked admin's services
    const [users] = await pool.query(
      `SELECT DISTINCT 
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.created_at
       FROM users u
       JOIN bookings b ON u.user_id = b.user_id
       JOIN services s ON b.service_id = s.service_id
       WHERE s.admin_id = ? AND u.role = 'user'
       ORDER BY u.created_at DESC`,
      [admin_id]
    );

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID (Admin can view users who booked their services)
const getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    const admin_id = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user has booked admin's services
    const [user] = await pool.query(
      `SELECT DISTINCT 
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.created_at
       FROM users u
       JOIN bookings b ON u.user_id = b.user_id
       JOIN services s ON b.service_id = s.service_id
       WHERE u.user_id = ? AND s.admin_id = ?`,
      [user_id, admin_id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found or access denied' });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's bookings (Admin can view bookings of users who used their services)
const getUserBookings = async (req, res) => {
  try {
    const { user_id } = req.params;
    const admin_id = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get bookings for admin's services only
    const [bookings] = await pool.query(
      `SELECT 
        b.booking_id,
        b.booking_date,
        b.total_amount,
        b.payment_method,
        b.payment_status,
        b.booking_status,
        b.created_at,
        s.service_name,
        t.start_time,
        t.end_time
       FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       JOIN time_slots t ON b.slot_id = t.slot_id
       WHERE b.user_id = ? AND s.admin_id = ?
       ORDER BY b.booking_date DESC`,
      [user_id, admin_id]
    );

    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user (Limited - admin can only update users who booked their services)
const updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { full_name, email, phone } = req.body;
    const admin_id = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify user has booked admin's services
    const [hasBooking] = await pool.query(
      `SELECT COUNT(*) as count FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       WHERE b.user_id = ? AND s.admin_id = ?`,
      [user_id, admin_id]
    );

    if (hasBooking[0].count === 0) {
      return res.status(403).json({ message: 'You can only update users who have booked your services' });
    }

    const updates = [];
    const values = [];

    if (full_name) {
      updates.push('full_name = ?');
      values.push(full_name);
    }

    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (phone) {
      updates.push('phone = ?');
      values.push(phone);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(user_id);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user (Admin cannot delete, only view users who booked their services)
const deleteUser = async (req, res) => {
  try {
    return res.status(403).json({
      message: 'User deletion is not allowed. Please contact system administrator.'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export {
  getAllUsers,
  getUserById,
  getUserBookings,
  updateUser,
  deleteUser,
  getUserStats
};