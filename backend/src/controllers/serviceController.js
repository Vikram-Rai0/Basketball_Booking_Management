import pool from '../config/db.js';

//Get all services ( Admin sees only their own , unless super admin)
const getAllServices = async (req, res) => {
  try {
    const admin_id = req.user.user_id;
    const isAAdminb = req.user.role === 'admin';

    let query = 'SELECT * FROM services ORDERD BY service_id';
    let params = [];

    //Each admin sees only their own services
    if (isAAdminb) {
      {
        query = 'SELECT * FROM services WHERE admin_id =? OERDER BY service_id';
        params = [admin_id];
      }
      const [services] = await pool.query(query, params);
      res.json(services);
    }
  }
  catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//Get active services only (public - all active services)
const getActiveServices = async (req, res) => {
  try {
    const [services] = await pool.query('SELECT * FROM services WHERE status = "active" ORDER BY service_id');
  }
  catch (error) {
    console.error('Get active services error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//Create new service (Admin only)
const createService = async (req, res) => {
  try {
    const { service_name, description, price, status } = req.body;
    const admin_id = req.user.user_id;

    if (!service_name || !price) {
      return res.status(400).json({ message: 'Please provide service name and price' });
    }
    const [result] = await pool.query(
      'INSERT INTO services (service_name, description, price, status, admin_id) VALUES (?,?,?,?,?)',
      [service_name, description, price, status || 'active', admin_id]
    );
    res.status(201).json({
      message: 'Service created successfully',
      service_id: result.insertId,
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const updateService = async (req, res) => {
  try {
    const { service_id } = req.params;
    const { service_name, description, price, status } = req.body;
    const admin_id = req.user.user_id;

    //Check if service belongs to this admin
    const [service] = await pool.query(
      'SELECT * FROM service WHERE  service_id = ? AND admin_id = ?',
      [service_id, admin_id]
    );
    if (service.length === 0) {
      return res.status(404).json({ message: 'Service not found ' })
    } else if (!admin_id) {
      return res.status(403).json({ message: 'Access denied,only admin can update service' })
    }
    await pool.query(
      'UPDATE services SET service_name = ?, description = ?, price = ?, status = ? WHere service_id = ? AND admin_id = ?',
      [service_name, description, price, status, service_id, admin_id]
    );
    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message }
    )
  }
}

const deleteService = async (req, res) => {
  try {
    const { service_id } = req.params;
    const admin_id = req.user.user_id;

    //Check if service belongs tot his admin
    const [service] = await pool.query(
      'SELECT * FROM services WHERE  service_id = ? AND  admin_id = ?',
      [service_id, admin_id]
    );
    if (service.length === 0) {
      return res.status(404).json({ message: 'Service not found' })
    } else if (!admin_id) {
      return res.status(403).json({ message: 'Access denied, only admin can delete service' })
    }

    // Check if there are any bookings for this service
    const [bookings] = await pool.query(
      'SELECT * FROM bookings WHERE service_id = ?',
      [service_id]
    );

    if (bookings.length > 0) {
      return res.status(400).json({ message: 'Cannot delete service with active bookings' });
    }

    await pool.query(
      'DELETE FROM time_slots WHERE service_id = ?',
      [service_id]
    );

    //Delete the service

    await pool.query(
      'DELETE FROM services WHERE service_id = ? AND admin_id = ?',
      [service_id, admin_id]
    );
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get time slots for a services (filtered by admin ownership)
const getTimeSlots = async (req, res) => {
  try {
    const { service_id } = req.params;
    const admin_id = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    let query = 'SELECT * FROM time_slots WHERE service_id = ? ORDER BY start_time';
    let params = [service_id];

    //If admin, verify they own this service 
    if (isAdmin) {
      const [service] = await pool.query(
        'SELECT * from services WHERE service_id=? AND adin_id =?',
        [service_id, admin_id]
      );

      if (service.length === 0) {
        return res.status(404).json({ message: 'you do not have permission to view these time slots' });
      }
    }

    const [slots] = await pool.query(query, params);
    res.json(slots);
  }
  catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAvilableSlots = async (req, res) => {
  try {
    const { service_id } = req.params;
    const { booking_date } = req.query;

    if (!booking_date) {
      return res.status(400).json({ message: 'Please Provide booking date' });
    }

    //Get all slots for the service
    const [allSlots] = await pool.query(
      'SELECT * FROM time_slots WHERE service_id = ? AND STATUS = "available" ORDER BY start_time',
      [service_id]
    );

    //Get booked slots for the date
    const [booked] = await pool.query(
      'SELECT slot_id FROM bookings WHERE service_id = ? AND booking_date = ? AND booking_status = "confirmed"',
      [service_id]
    );

    const bookedSlotIds = new Set(booked.map(b => b.slot_id));
    const avilable = allSlots.filter(slot => !bookedSlotIds.has(slot.slot_id));

    res.json(avilable);
  }
  catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Create time slot (Admin only -for own services)
const createTimeSlot = async (req,res) => {
  try{
    const { service_id , start_time, end_time, status } = req.body;
    const admin_id = req.user.user_id;
    if(!service_id || !start_time || !end_time){
      return res.status(400).json({ message: 'Please provide required fields'});
    }

    //Verify admin owns this service 
    const [ service] = await pool.query(
      'SELECT * FROM services WHERE service_id = ? AND admin_id = ?',
      [service_id, admin_id]
    );

    if(service.length === 0){
      return res.status(403).json({ message: 'You do not have permission to create time slots for this service'});
    }

    const [result] = await pool.query(
      'INSERT INTO time_slots (service_id, start_time, end_time, status) VALUES (?,?,?,?)',
      [service_id, start_time, end_time, status || 'available',admin_id]
    );

    res.status(201).json({
      message: 'Time slot created successfully',
      slot_id: result.insertId,
    });
  } catch (error){
    console.error('Create time slot error:', error);
    res.status(500).json({ message: 'Server error', error: error.message
    })
  }
}