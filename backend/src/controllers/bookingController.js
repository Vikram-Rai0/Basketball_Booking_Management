// Booking Controller - Handle all booking operations
import pool from '../config/database.js';

// Create new booking
const createBooking = async (req, res) => {
  try {
    const { service_id, slot_id, booking_date, booking_time, payment_method } = req.body;
    const user_id = req.user.user_id;

    // Validate input
    if (!service_id || !slot_id || !booking_date || !booking_time || !payment_method) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if slot is already booked for this date
    const [existingBooking] = await pool.query(
      'SELECT * FROM bookings WHERE service_id = ? AND slot_id = ? AND booking_date = ? AND booking_status = "confirmed"',
      [service_id, slot_id, booking_date]
    );

    if (existingBooking.length > 0) {
      return res.status(400).json({ message: 'This time slot is already booked for the selected date' });
    }

    // Get service price
    const [service] = await pool.query(
      'SELECT price, service_name FROM services WHERE service_id = ? AND status = "active"',
      [service_id]
    );

    if (service.length === 0) {
      return res.status(404).json({ message: 'Service not found or inactive' });
    }

    const total_amount = service[0].price;

    // Create booking
    const [result] = await pool.query(
      'INSERT INTO bookings (user_id, service_id, slot_id, booking_date, total_amount, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, service_id, slot_id, booking_date, total_amount, payment_method]
    );

    res.status(201).json({
      message: 'Booking created successfully',
      booking_id: result.insertId,
      total_amount: total_amount
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's own bookings
const getUserBookings = async (req, res) => {
  try {
    const user_id = req.user.user_id;

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
        s.description,
        t.start_time,
        t.end_time
       FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       JOIN time_slots t ON b.slot_id = t.slot_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC, t.start_time DESC`,
      [user_id]
    );

    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all bookings (Admin only)
const getAllBookings = async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT 
        b.booking_id,
        b.booking_date,
        b.total_amount,
        b.payment_method,
        b.payment_status,
        b.booking_status,
        b.created_at,
        u.full_name,
        u.email,
        u.phone,
        s.service_name,
        t.start_time,
        t.end_time
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       JOIN services s ON b.service_id = s.service_id
       JOIN time_slots t ON b.slot_id = t.slot_id
       ORDER BY b.booking_date DESC, t.start_time DESC`
    );

    res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    // Check if booking exists and belongs to user (or user is admin)
    const query = isAdmin
      ? 'SELECT * FROM bookings WHERE booking_id = ?'
      : 'SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?';

    const params = isAdmin ? [booking_id] : [booking_id, user_id];
    const [booking] = await pool.query(query, params);

    if (booking.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking[0].booking_status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Update booking status to cancelled
    await pool.query(
      'UPDATE bookings SET booking_status = "cancelled" WHERE booking_id = ?',
      [booking_id]
    );

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update payment status (Admin only)
const updatePaymentStatus = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { payment_status } = req.body;

    // Validate payment status
    const validStatuses = ['pending', 'completed', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    // Update payment status
    await pool.query(
      'UPDATE bookings SET payment_status = ? WHERE booking_id = ?',
      [payment_status, booking_id]
    );

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get booking statistics (Admin only)
const getBookingStats = async (req, res) => {
  try {
    // Total bookings
    const [totalBookings] = await pool.query(
      'SELECT COUNT(*) as total FROM bookings'
    );

    // Confirmed bookings
    const [confirmedBookings] = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status = "confirmed"'
    );

    // Pending bookings
    const [pendingBookings] = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE payment_status = "pending"'
    );

    // Total revenue
    const [revenue] = await pool.query(
      'SELECT SUM(total_amount) as total FROM bookings WHERE payment_status = "completed"'
    );

    // Total users
    const [totalUsers] = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE role = "user"'
    );

    // Bookings today
    const [todayBookings] = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_date = CURDATE()'
    );

    res.json({
      totalBookings: totalBookings[0].total,
      confirmedBookings: confirmedBookings[0].total,
      pendingBookings: pendingBookings[0].total,
      totalRevenue: revenue[0].total || 0,
      totalUsers: totalUsers[0].total,
      todayBookings: todayBookings[0].total
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  createBooking,
  getUserBookings,
  getAllBookings,
  cancelBooking,
  updatePaymentStatus,
  getBookingStats
};
