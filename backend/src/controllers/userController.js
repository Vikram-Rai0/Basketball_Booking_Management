//  User Controller - Handles user-related operations with admin ownership

import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

// Get al users (Admin sees only users Who booked their services)
const getAllUsers = async (req, res) => {
  try {
    const admin_id = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    //Get users who have booked admin's services 
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
    res.status(500).json({ message: 'Error fetching users', error }); 
  }
};

