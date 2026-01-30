import pool from "../config/db.js";

//Create new booking
const createBooking = async (req, res) => {
  try {
    const { service_id, slot_id, booking_date, booking_time, payment_method } =
      req.body;
    const user_id = req.user.user_id;

    if (
      !service_id ||
      slot_id ||
      !booking_date ||
      !booking_time ||
      !payment_method
    ) {
      return res
        .status(400)
        .json({ message: "Please Provide all required fields" });
    }

    // Check if slot is already booked for this date
    const [existingBooking] = await pool.query(
      'SELECT * FROM bookings WHERE service_id = ? AND slot_id = ? AND booking_date = ? AND booking_status = "confirmed"',
      [service_id, slot_id, booking_date],
    );

    if (existingBooking.length > 0) {
      return res
        .status(400)
        .json({ message: "Slot is already booked for this date" });
    }
    // Get Service Price
    const [service] = await pool.query(
      "SELECT price FROM services WHERE service_id = ?",
      [service_id],
    );

    if (service.length === 0) {
      return res.status(404).json({ message: "Service not found or inactive" });
    }
    const total_amount = service[0].price;

    // Insert new booking
    const [newBooking] = await pool.query(
      "INSERT INTO bookings (user_id, service_id, slot_id, booking_date, payment_method) VALUES (?, ?, ?, ?, ?, ?)",
      [
        user_id,
        service_id,
        slot_id,
        booking_date,
        booking_time,
        payment_method,
      ],
    );

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: newBooking.insertId,
      total_amount: total_amount,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// get user's own bokings
const getUserBookings = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const [bookings] = await pool.query(
      `SELECT b.booking_id, b.booking_date, b.total_amount, b.payment_method, 
      b.payment_status, b.booking_status, s.service_name, t.start_time, 
      t.end_time FROM bookings b JOIN services s ON b.service_id = s.service_id JOIN time_slots t ON b.slot_id = t.slot_id 
      WHERE b.user_id = ? ORDER BY b.booking_date DESC , t.start_time DESC`,

      [user_id],
    );
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// get all bookings (Admin sees only booking for their services)
const getAllBookings = async (req, res) => {
  try {
    const admin_id = req.user.user_id;
    const isAdmin = req.user.role === "admin";

    if (!isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    //Admin sees only boookings for their services
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
       WHERE s.admin_id = ?
       ORDER BY b.booking_date DESC, t.start_time DESC`,
      [admin_id],
    );

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get single booking details
const getBookingById = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.user_id;
    const isAdmin = req.user.role === "admin";

    let query = `
      SELECT 
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
        s.description,
        t.start_time,
        t.end_time
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN services s ON b.service_id = s.service_id
      JOIN time_slots t ON b.slot_id = t.slot_id
      WHERE b.booking_id = ?`;

    let params = [booking_id];

    if (isAdmin) {
      query += " AND s.admin_id = ?";
      params.push(user_id);
    } else {
      query += " AND b.user_id = ?";
      params.push(user_id);
    }

    const [booking] = await pool.query(query, params);

    if (booking.length === 0) {
      return res
        .status(404)
        .json({ message: "Booking not found or access denied" });
    }

    res.json(booking[0]);
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update booking (Admin only - for their services)
const updateBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { booking_status, payment_status } = req.body;
    const admin_id = req.user.user_id;

    // Verify admin owns the service for this booking
    const [booking] = await pool.query(
      `SELECT b.* FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       WHERE b.booking_id = ? AND s.admin_id = ?`,
      [booking_id, admin_id],
    );

    if (booking.length === 0) {
      return res
        .status(404)
        .json({ message: "Booking not found or access denied" });
    }

    const updates = [];
    const values = [];

    if (booking_status) {
      updates.push("booking_status = ?");
      values.push(booking_status);
    }

    if (payment_status) {
      updates.push("payment_status = ?");
      values.push(payment_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(booking_id);

    await pool.query(
      `UPDATE bookings SET ${updates.join(", ")} WHERE booking_id = ?`,
      values,
    );

    res.json({ message: "Booking updated successfully" });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Cancle booking (User can cancle their own, admin can cancle for their services)
const cancleBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.user_id;
    const isAdmin = req.user.role === "admin";

    let query;
    let params;

    if (isAdmin) {
      // Admin can cancle bookings for their services
      query = `SELECT b.* FROM bookings b JOIN services s ON b.service_id = s.servicd_id WHERE b.booking-id = ? AND s.admin_id = ?`;
      params = [booking_id, user_id];
    } else {
      //user can cancle their own bookings
      query = `SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?`;
      params = [booking_id, user_id];
    }

    const [booking] = await pool.query(query, params);

    if (booking.length === 0) {
      return res
        .status(404)
        .json({ message: "Booking not found or access denied" });
    }

    if (booking[0].booking_status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }
    await pool.query(`DELETE FORM booking WHERE booking_id = ?`, [booking_id]);
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancle booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Delete booking (Admin only - for their services)
const deleteBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const admin_id = req.user.user_id;

    // Verify admin owns the service for this booking
    const [booking] = await pool.query(
      `SELECT b.* FROM bookings b JOIN services s ON b.service_id = s.service_id WHERE b.booking_id = ? AND s.admin_id = ?`,
      [booking_id, admin_id],
    )
    if (booking.length === 0) {
      return res.status(404).json({ message: "Booking not found or access denied" });
    }
    await pool.query(`DELETE FROM bookings WHERE booking_id = ?`, [booking_id]);

    res.josn({ message: "Booking delete successfully" });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }

}

// Update payment status ( Admin only - for their services)
const updatePaymentStatus = async (req, res) => {

  try {
    const { booking_id } = req.params;
    const { payment_status } = req.body;
    const admin_id = req.user.user_id;

    const validStatuses = ["pending", "completed", "refunded  "];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }
    // Verify admin owns the service for this booking
    const [booking] = await pool.query(
      `SELECT b.* FROM bookings b JOIN services s ON b.service_id = s.service_id WHERE b.booking_id = ? AND s.admin_id = ?`,
      [booking_id, admin_id],
    );

    if (booking.length === 0) {
      return res
        .status(404)
        .json({ message: "Booking not found or access denied" });
    }

    await pool.query(
      `UPDATE bookings SET payment_status = ? WHERE booking_id = ?`,
      [payment_status, booking_id],
    );

    res.json({ message: "Payment status updated successfully" });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}