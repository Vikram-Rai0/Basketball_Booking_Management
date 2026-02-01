// controllers/analyticsController.js
import pool from '../config/database.js';

/* ================= GET REVENUE ANALYTICS ================= */
export const getRevenueAnalytics = async (req, res) => {
    try {
        const admin_id = req.user?.user_id;
        const isAdmin = req.user?.role === 'admin';

        if (!admin_id || !isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        console.log(`Fetching analytics for admin: ${admin_id}`);

        // Use COALESCE to handle NULL values
        const [dailyRevenue] = await pool.query(
            `SELECT 
                DATE(b.booking_date) as date,
                COUNT(*) as bookings,
                COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            WHERE s.admin_id = ? 
                AND b.payment_status = 'completed'
                AND b.booking_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(b.booking_date)
            ORDER BY date DESC`,
            [admin_id]
        );

        console.log('Daily revenue results:', dailyRevenue);

        // Weekly revenue for last 8 weeks
        const [weeklyRevenue] = await pool.query(
            `SELECT 
                YEARWEEK(b.booking_date, 1) as week,
                CONCAT(
                    DATE_FORMAT(DATE_SUB(b.booking_date, INTERVAL WEEKDAY(b.booking_date) DAY), '%b %d'),
                    ' - ',
                    DATE_FORMAT(DATE_ADD(DATE_SUB(b.booking_date, INTERVAL WEEKDAY(b.booking_date) DAY), INTERVAL 6 DAY), '%b %d')
                ) as week_label,
                COUNT(*) as bookings,
                COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            WHERE s.admin_id = ? 
                AND b.payment_status = 'completed'
                AND b.booking_date >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)
            GROUP BY YEARWEEK(b.booking_date, 1)
            ORDER BY week DESC
            LIMIT 8`,
            [admin_id]
        );

        // Monthly revenue for last 12 months
        const [monthlyRevenue] = await pool.query(
            `SELECT 
                DATE_FORMAT(b.booking_date, '%Y-%m') as month,
                DATE_FORMAT(b.booking_date, '%b %Y') as month_label,
                COUNT(*) as bookings,
                COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            WHERE s.admin_id = ? 
                AND b.payment_status = 'completed'
                AND b.booking_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(b.booking_date, '%Y-%m')
            ORDER BY month DESC`,
            [admin_id]
        );

        // Yearly revenue
        const [yearlyRevenue] = await pool.query(
            `SELECT 
                YEAR(b.booking_date) as year,
                COUNT(*) as bookings,
                COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            WHERE s.admin_id = ? 
                AND b.payment_status = 'completed'
            GROUP BY YEAR(b.booking_date)
            ORDER BY year DESC`,
            [admin_id]
        );

        // This week vs last week - FIXED with better NULL handling
        const [thisWeekResult] = await pool.query(
            `SELECT 
                COALESCE(COUNT(*), 0) as bookings,
                COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            WHERE s.admin_id = ? 
                AND b.payment_status = 'completed'
                AND YEARWEEK(b.booking_date, 1) = YEARWEEK(CURDATE(), 1)`,
            [admin_id]
        );

        const [lastWeekResult] = await pool.query(
            `SELECT 
                COALESCE(COUNT(*), 0) as bookings,
                COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            WHERE s.admin_id = ? 
                AND b.payment_status = 'completed'
                AND YEARWEEK(b.booking_date, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 1)`,
            [admin_id]
        );

        // This month vs last month
        const [thisMonthResult] = await pool.query(
            `SELECT 
                COALESCE(COUNT(*), 0) as bookings,
                COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            WHERE s.admin_id = ? 
                AND b.payment_status = 'completed'
                AND YEAR(b.booking_date) = YEAR(CURDATE())
                AND MONTH(b.booking_date) = MONTH(CURDATE())`,
            [admin_id]
        );

        const [lastMonthResult] = await pool.query(
            `SELECT 
                COALESCE(COUNT(*), 0) as bookings,
                COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            WHERE s.admin_id = ? 
                AND b.payment_status = 'completed'
                AND YEAR(b.booking_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND MONTH(b.booking_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`,
            [admin_id]
        );

        // This year vs last year
        const [thisYearResult] = await pool.query(
            `SELECT 
                COALESCE(COUNT(*), 0) as bookings,
                COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            WHERE s.admin_id = ? 
                AND b.payment_status = 'completed'
                AND YEAR(b.booking_date) = YEAR(CURDATE())`,
            [admin_id]
        );

        const [lastYearResult] = await pool.query(
            `SELECT 
                COALESCE(COUNT(*), 0) as bookings,
                COALESCE(SUM(b.total_amount), 0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            WHERE s.admin_id = ? 
                AND b.payment_status = 'completed'
                AND YEAR(b.booking_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 YEAR))`,
            [admin_id]
        );

        // Calculate percentage change with safe division
        const calculatePercentageChange = (current, previous) => {
            const currentVal = parseFloat(current.revenue) || 0;
            const previousVal = parseFloat(previous.revenue) || 0;
            
            if (previousVal === 0) {
                return currentVal > 0 ? 100.0 : 0.0;
            }
            
            return ((currentVal - previousVal) / previousVal * 100).toFixed(1);
        };

        const thisWeek = thisWeekResult[0] || { bookings: 0, revenue: 0 };
        const lastWeek = lastWeekResult[0] || { bookings: 0, revenue: 0 };
        const thisMonth = thisMonthResult[0] || { bookings: 0, revenue: 0 };
        const lastMonth = lastMonthResult[0] || { bookings: 0, revenue: 0 };
        const thisYear = thisYearResult[0] || { bookings: 0, revenue: 0 };
        const lastYear = lastYearResult[0] || { bookings: 0, revenue: 0 };

        res.json({
            daily: dailyRevenue.map(d => ({
                date: d.date,
                bookings: parseInt(d.bookings) || 0,
                revenue: parseFloat(d.revenue) || 0
            })),
            weekly: weeklyRevenue.map(w => ({
                week: w.week,
                label: w.week_label,
                bookings: parseInt(w.bookings) || 0,
                revenue: parseFloat(w.revenue) || 0
            })),
            monthly: monthlyRevenue.map(m => ({
                month: m.month,
                label: m.month_label,
                bookings: parseInt(m.bookings) || 0,
                revenue: parseFloat(m.revenue) || 0
            })),
            yearly: yearlyRevenue.map(y => ({
                year: y.year,
                bookings: parseInt(y.bookings) || 0,
                revenue: parseFloat(y.revenue) || 0
            })),
            comparisons: {
                week: {
                    current: {
                        bookings: parseInt(thisWeek.bookings) || 0,
                        revenue: parseFloat(thisWeek.revenue) || 0
                    },
                    previous: {
                        bookings: parseInt(lastWeek.bookings) || 0,
                        revenue: parseFloat(lastWeek.revenue) || 0
                    },
                    change: {
                        bookings: (parseInt(thisWeek.bookings) || 0) - (parseInt(lastWeek.bookings) || 0),
                        revenue: (parseFloat(thisWeek.revenue) || 0) - (parseFloat(lastWeek.revenue) || 0),
                        percentage: calculatePercentageChange(thisWeek, lastWeek)
                    }
                },
                month: {
                    current: {
                        bookings: parseInt(thisMonth.bookings) || 0,
                        revenue: parseFloat(thisMonth.revenue) || 0
                    },
                    previous: {
                        bookings: parseInt(lastMonth.bookings) || 0,
                        revenue: parseFloat(lastMonth.revenue) || 0
                    },
                    change: {
                        bookings: (parseInt(thisMonth.bookings) || 0) - (parseInt(lastMonth.bookings) || 0),
                        revenue: (parseFloat(thisMonth.revenue) || 0) - (parseFloat(lastMonth.revenue) || 0),
                        percentage: calculatePercentageChange(thisMonth, lastMonth)
                    }
                },
                year: {
                    current: {
                        bookings: parseInt(thisYear.bookings) || 0,
                        revenue: parseFloat(thisYear.revenue) || 0
                    },
                    previous: {
                        bookings: parseInt(lastYear.bookings) || 0,
                        revenue: parseFloat(lastYear.revenue) || 0
                    },
                    change: {
                        bookings: (parseInt(thisYear.bookings) || 0) - (parseInt(lastYear.bookings) || 0),
                        revenue: (parseFloat(thisYear.revenue) || 0) - (parseFloat(lastYear.revenue) || 0),
                        percentage: calculatePercentageChange(thisYear, lastYear)
                    }
                }
            }
        });
    } catch (error) {
        console.error('Get analytics error details:', error);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({ 
            message: 'Failed to fetch analytics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};


/* ================= GET BOOKING HISTORY ================= */
export const getBookingHistory = async (req, res) => {
    try {
        const admin_id = req.user.user_id;
        const isAdmin = req.user.role === 'admin';
        const { startDate, endDate, status } = req.query;

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

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
        s.service_name,
        t.start_time,
        t.end_time
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN services s ON b.service_id = s.service_id
      JOIN time_slots t ON b.slot_id = t.slot_id
      WHERE s.admin_id = ?
    `;

        const params = [admin_id];

        if (startDate) {
            query += ' AND b.booking_date >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND b.booking_date <= ?';
            params.push(endDate);
        }

        if (status && status !== 'all') {
            query += ' AND b.booking_status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.booking_date DESC, t.start_time DESC';

        const [history] = await pool.query(query, params);

        res.json(history);
    } catch (error) {
        console.error('Get booking history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};