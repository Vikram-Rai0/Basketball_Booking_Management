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

