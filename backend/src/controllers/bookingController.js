// Booking Controller - Production Ready with Time-Based Logic
import pool from '../config/database.js';

/* ================= HELPER FUNCTIONS ================= */

/**
 * Check if a booking date/time is in the past
 */
const isBookingInPast = (bookingDate, startTime) => {
  const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
  return bookingDateTime < new Date();
};

/**
 * Check if a booking is within the cutoff window (1 hour before start)
 */
const isWithinCutoffWindow = (bookingDate, startTime) => {
  const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
  const now = new Date();
  const hoursDifference = (bookingDateTime - now) / (1000 * 60 * 60);
  return hoursDifference < 1; // Less than 1 hour
};

/**
 * Calculate hours until booking
 */
const getHoursUntilBooking = (bookingDate, startTime) => {
  const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
  const now = new Date();
  return (bookingDateTime - now) / (1000 * 60 * 60);
};

/* ================= CREATE BOOKING WITH PROPER LOCKING ================= */
const createBooking = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { service_id, slot_id, booking_date, payment_method } = req.body;
    const user_id = req.user.user_id;

    if (!service_id || !slot_id || !booking_date || !payment_method) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate date format
    const bookingDateObj = new Date(booking_date);
    if (isNaN(bookingDateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Start transaction
    await connection.beginTransaction();

    // 1. Get slot details first
    const [slot] = await connection.query(
      `SELECT t.slot_id, t.start_time, t.end_time, t.status, s.price, s.status as service_status
       FROM time_slots t
       JOIN services s ON t.service_id = s.service_id
       WHERE t.slot_id = ? AND t.service_id = ?
       FOR UPDATE`,
      [slot_id, service_id]
    );

    if (slot.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Time slot not found' });
    }

    const slotData = slot[0];

    // 2. Check if slot is available
    if (slotData.status !== 'available') {
      await connection.rollback();
      return res.status(400).json({ message: 'Time slot is not available' });
    }

    if (slotData.service_status !== 'active') {
      await connection.rollback();
      return res.status(400).json({ message: 'Service is not active' });
    }

    // 3. Validate booking is not in the past
    if (isBookingInPast(booking_date, slotData.start_time)) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Cannot book past time slots'
      });
    }

    // 4. Validate booking is not within cutoff window (1 hour)
    if (isWithinCutoffWindow(booking_date, slotData.start_time)) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Bookings must be made at least 1 hour in advance'
      });
    }

    // 5. Clean up expired pending bookings for this slot/date
    await connection.query(
      `UPDATE bookings 
       SET booking_status = 'expired', updated_at = NOW()
       WHERE slot_id = ? 
       AND booking_date = ? 
       AND booking_status = 'pending'
       AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) > 15`,
      [slot_id, booking_date]
    );

    // 6. Check if slot is already booked for this date (with lock)
    const [existingBooking] = await connection.query(
      `SELECT b.booking_id, b.booking_status, b.created_at
       FROM bookings b
       WHERE b.slot_id = ? 
       AND b.booking_date = ? 
       AND b.booking_status IN ('confirmed', 'pending')
       FOR UPDATE`,
      [slot_id, booking_date]
    );

    if (existingBooking.length > 0) {
      const existing = existingBooking[0];

      // If it's pending, check if it's still valid
      if (existing.booking_status === 'pending') {
        const minutesElapsed = (Date.now() - new Date(existing.created_at).getTime()) / (1000 * 60);

        if (minutesElapsed <= 15) {
          await connection.rollback();
          return res.status(409).json({
            message: 'This time slot is currently reserved by another user. Please try again in a few minutes.',
            reserved: true
          });
        }
      } else {
        // Confirmed booking
        await connection.rollback();
        return res.status(409).json({
          message: 'This time slot is already booked for the selected date'
        });
      }
    }

    const total_amount = slotData.price;
    const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // 7. Create the booking with 'pending' status
    const [result] = await connection.query(
      `INSERT INTO bookings 
        (user_id, service_id, slot_id, booking_date, total_amount, payment_method, 
         booking_status, payment_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pending', NOW(), NOW())`,
      [user_id, service_id, slot_id, booking_date, total_amount, payment_method]
    );

    const booking_id = result.insertId;

    // 8. Commit transaction
    await connection.commit();

    // Return booking details
    res.status(201).json({
      message: 'Booking created successfully. Please complete payment within 15 minutes.',
      booking_id,
      total_amount,
      status: 'pending',
      expires_at: expires_at.toISOString(),
      expires_in_minutes: 15
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create booking error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'This slot is already booked for the selected date'
      });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

/* ================= CONFIRM BOOKING (After Payment) ================= */
const confirmBooking = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { booking_id } = req.params;
    const user_id = req.user.user_id;

    await connection.beginTransaction();

    // Lock and fetch booking with slot details
    const [booking] = await connection.query(
      `SELECT b.*, t.start_time, t.end_time
       FROM bookings b
       JOIN time_slots t ON b.slot_id = t.slot_id
       WHERE b.booking_id = ? AND b.user_id = ?
       FOR UPDATE`,
      [booking_id, user_id]
    );

    if (booking.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }

    const bookingData = booking[0];

    // Check if booking is still pending
    if (bookingData.booking_status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({
        message: `Booking is already ${bookingData.booking_status}`
      });
    }

    // Check if booking has expired (15 minutes timeout)
    const createdAt = new Date(bookingData.created_at);
    const now = new Date();
    const minutesElapsed = (now - createdAt) / (1000 * 60);

    if (minutesElapsed > 15) {
      await connection.query(
        'UPDATE bookings SET booking_status = "expired", updated_at = NOW() WHERE booking_id = ?',
        [booking_id]
      );
      await connection.commit();
      return res.status(400).json({
        message: 'Booking has expired. Please create a new booking.'
      });
    }

    // Verify slot is not in the past or within cutoff
    if (isBookingInPast(bookingData.booking_date, bookingData.start_time)) {
      await connection.query(
        'UPDATE bookings SET booking_status = "expired", updated_at = NOW() WHERE booking_id = ?',
        [booking_id]
      );
      await connection.commit();
      return res.status(400).json({
        message: 'Cannot confirm booking for a past time slot'
      });
    }

    if (isWithinCutoffWindow(bookingData.booking_date, bookingData.start_time)) {
      await connection.query(
        'UPDATE bookings SET booking_status = "expired", updated_at = NOW() WHERE booking_id = ?',
        [booking_id]
      );
      await connection.commit();
      return res.status(400).json({
        message: 'Booking time is too soon. Cannot confirm.'
      });
    }

    // Confirm the booking
    await connection.query(
      `UPDATE bookings 
       SET booking_status = 'confirmed', 
           payment_status = 'completed',
           updated_at = NOW()
       WHERE booking_id = ?`,
      [booking_id]
    );

    await connection.commit();

    res.json({
      message: 'Booking confirmed successfully',
      booking_id,
      status: 'confirmed'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

/* ================= GET AVAILABLE SLOTS FOR A DATE ================= */
const getAvailableSlots = async (req, res) => {
  try {
    const { service_id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Validate date format
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Don't allow booking in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({ message: 'Cannot book slots in the past' });
    }

    const isToday = bookingDate.getTime() === today.getTime();

    // Clean up expired pending bookings first
    await pool.query(
      `UPDATE bookings 
       SET booking_status = 'expired', updated_at = NOW()
       WHERE booking_date = ?
       AND booking_status = 'pending'
       AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) > 15`,
      [date]
    );

    const [slots] = await pool.query(
      `SELECT
        t.slot_id,
        t.start_time,
        t.end_time,
        t.status as slot_status,
        CASE
          -- Check if slot is confirmed booked
          WHEN EXISTS (
            SELECT 1 FROM bookings b2
            WHERE b2.slot_id = t.slot_id
              AND b2.booking_date = ?
              AND b2.booking_status = 'confirmed'
          ) THEN 'booked'
          
          -- Check if slot has active pending reservation (< 15 mins old)
          WHEN EXISTS (
            SELECT 1 FROM bookings b3
            WHERE b3.slot_id = t.slot_id
              AND b3.booking_date = ?
              AND b3.booking_status = 'pending'
              AND TIMESTAMPDIFF(MINUTE, b3.created_at, NOW()) <= 15
          ) THEN 'reserved'
          
          -- If today, check if slot is in the past or within cutoff (1 hour)
          WHEN ? = CURDATE() 
           AND TIMESTAMP(?, t.start_time) <= DATE_ADD(NOW(), INTERVAL 1 HOUR)
          THEN 'past'
          
          -- Otherwise available if slot status is available
          WHEN t.status = 'available' THEN 'available'
          
          ELSE 'unavailable'
        END AS availability_status,
        -- Include time until slot (for frontend display)
        CASE
          WHEN ? = CURDATE() THEN
            TIMESTAMPDIFF(MINUTE, NOW(), TIMESTAMP(?, t.start_time))
          ELSE NULL
        END AS minutes_until_start
      FROM time_slots t
      WHERE t.service_id = ?
        AND t.status = 'available'
        -- Only show future slots if today (not within cutoff)
        AND (
          ? != CURDATE() 
          OR TIMESTAMP(?, t.start_time) > DATE_ADD(NOW(), INTERVAL 1 HOUR)
        )
      ORDER BY t.start_time`,
      [date, date, date, date, date, date, service_id, date, date]
    );

    res.json(slots);
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ================= GET USER'S BOOKINGS (SEPARATED: UPCOMING & HISTORY) ================= */
const getUserBookings = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { type } = req.query; // 'upcoming' or 'history'

    let dateCondition = '';
    let statusCondition = '';

    if (type === 'upcoming') {
      // Upcoming: confirmed bookings that haven't started yet
      dateCondition = `AND TIMESTAMP(b.booking_date, t.start_time) > NOW()`;
      statusCondition = `AND b.booking_status IN ('confirmed', 'pending')`;
    } else if (type === 'history') {
      // History: completed, cancelled, expired, or past bookings
      statusCondition = `AND (
        b.booking_status IN ('completed', 'cancelled', 'expired')
        OR TIMESTAMP(b.booking_date, t.end_time) < NOW()
      )`;
    }

    const [bookings] = await pool.query(
      `SELECT 
        b.booking_id,
        b.booking_date,
        b.total_amount,
        b.payment_method,
        b.payment_status,
        b.booking_status,
        b.created_at,
        b.updated_at,
        b.cancelled_at,
        s.service_name,
        s.description,
        t.start_time,
        t.end_time,
        -- Calculate if booking is in past
        CASE 
          WHEN TIMESTAMP(b.booking_date, t.end_time) < NOW() THEN 1
          ELSE 0
        END AS is_past
       FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       JOIN time_slots t ON b.slot_id = t.slot_id
       WHERE b.user_id = ?
       ${statusCondition}
       ${dateCondition}
       ORDER BY b.booking_date DESC, t.start_time DESC`,
      [user_id]
    );

    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ================= GET ALL BOOKINGS (ADMIN) ================= */
const getAllBookings = async (req, res) => {
  try {
    const admin_id = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [bookings] = await pool.query(
      `SELECT 
        b.booking_id,
        b.booking_date,
        b.total_amount,
        b.payment_method,
        b.payment_status,
        b.booking_status,
        b.created_at,
        b.updated_at,
        b.cancelled_at,
        u.full_name,
        u.email,
        u.phone,
        s.service_name,
        t.start_time,
        t.end_time,
        CASE 
          WHEN TIMESTAMP(b.booking_date, t.end_time) < NOW() THEN 1
          ELSE 0
        END AS is_past
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       JOIN services s ON b.service_id = s.service_id
       JOIN time_slots t ON b.slot_id = t.slot_id
       WHERE s.admin_id = ?
       ORDER BY b.booking_date DESC, t.start_time DESC`,
      [admin_id]
    );

    res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ================= CANCEL BOOKING WITH FULL REFUND ================= */
const cancelBooking = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { booking_id } = req.params;
    const user_id = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    await connection.beginTransaction();

    let query;
    let params;

    if (isAdmin) {
      query = `SELECT b.*, t.start_time, t.end_time 
               FROM bookings b
               JOIN time_slots t ON b.slot_id = t.slot_id
               JOIN services s ON b.service_id = s.service_id
               WHERE b.booking_id = ? AND s.admin_id = ?
               FOR UPDATE`;
      params = [booking_id, user_id];
    } else {
      query = `SELECT b.*, t.start_time, t.end_time
               FROM bookings b
               JOIN time_slots t ON b.slot_id = t.slot_id
               WHERE b.booking_id = ? AND b.user_id = ? 
               FOR UPDATE`;
      params = [booking_id, user_id];
    }

    const [booking] = await connection.query(query, params);

    if (booking.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Booking not found or access denied' });
    }

    const bookingData = booking[0];

    // Check if already cancelled
    if (bookingData.booking_status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Check if booking is expired
    if (bookingData.booking_status === 'expired') {
      await connection.rollback();
      return res.status(400).json({ message: 'Cannot cancel expired booking' });
    }

    // Check if booking is in the past
    const hoursUntil = getHoursUntilBooking(bookingData.booking_date, bookingData.start_time);

    if (hoursUntil < 0) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Cannot cancel past bookings'
      });
    }

    // Calculate refund (always 100% as per requirements)
    const refundAmount = Number(bookingData.total_amount);

    // Cancel the booking
    await connection.query(
      `UPDATE bookings 
       SET booking_status = 'cancelled', 
           payment_status = CASE 
             WHEN payment_status = 'completed' THEN 'refunded'
             ELSE payment_status
           END,
           cancelled_at = NOW(),
           updated_at = NOW()
       WHERE booking_id = ?`,
      [booking_id]
    );

    await connection.commit();

    res.json({
      message: 'Booking cancelled successfully',
      refund_amount: refundAmount,
      refund_policy: 'Full refund - 100%'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

/* ================= CLEANUP EXPIRED BOOKINGS (Background Job) ================= */
const cleanupExpiredBookings = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Mark bookings as expired if they've been pending for more than 15 minutes
    const [result] = await connection.query(
      `UPDATE bookings 
       SET booking_status = 'expired',
           updated_at = NOW()
       WHERE booking_status = 'pending' 
       AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) > 15`
    );

    await connection.commit();

    if (result.affectedRows > 0) {
      console.log(`✅ Cleaned up ${result.affectedRows} expired booking(s)`);
    }
  } catch (error) {
    await connection.rollback();
    console.error('❌ Cleanup error:', error);
  } finally {
    connection.release();
  }
};

/* ================= MARK COMPLETED BOOKINGS (Background Job) ================= */
const markCompletedBookings = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Mark confirmed bookings as completed if the booking date and time have passed
    const [result] = await connection.query(
      `UPDATE bookings b
       JOIN time_slots t ON b.slot_id = t.slot_id
       SET b.booking_status = 'completed',
           b.updated_at = NOW()
       WHERE b.booking_status = 'confirmed'
       AND TIMESTAMP(b.booking_date, t.end_time) < NOW()`
    );

    await connection.commit();

    if (result.affectedRows > 0) {
      console.log(`✅ Marked ${result.affectedRows} booking(s) as completed`);
    }
  } catch (error) {
    await connection.rollback();
    console.error('❌ Mark completed error:', error);
  } finally {
    connection.release();
  }
};

/* ================= GET BOOKING STATISTICS ================= */
const getBookingStats = async (req, res) => {
  try {
    const admin_id = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [totalBookings] = await pool.query(
      `SELECT COUNT(*) as total FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       WHERE s.admin_id = ?`,
      [admin_id]
    );

    const [confirmedBookings] = await pool.query(
      `SELECT COUNT(*) as total FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       WHERE b.booking_status = 'confirmed' AND s.admin_id = ?`,
      [admin_id]
    );

    const [pendingBookings] = await pool.query(
      `SELECT COUNT(*) as total FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       WHERE b.booking_status = 'pending' AND s.admin_id = ?`,
      [admin_id]
    );

    const [revenue] = await pool.query(
      `SELECT COALESCE(SUM(b.total_amount), 0) as total FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       WHERE b.payment_status = 'completed' AND s.admin_id = ?`,
      [admin_id]
    );

    const [totalUsers] = await pool.query(
      `SELECT COUNT(DISTINCT b.user_id) as total FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       WHERE s.admin_id = ?`,
      [admin_id]
    );

    const [todayBookings] = await pool.query(
      `SELECT COUNT(*) as total FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       WHERE b.booking_date = CURDATE() AND s.admin_id = ?`,
      [admin_id]
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
  confirmBooking,
  getAvailableSlots,
  getUserBookings,
  getAllBookings,
  cancelBooking,
  cleanupExpiredBookings,
  markCompletedBookings,
  getBookingStats
};