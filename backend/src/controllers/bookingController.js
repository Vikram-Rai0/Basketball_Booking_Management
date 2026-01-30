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

    res
      .status(201)
      .json({
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
