import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  DollarSign,
  XCircle,
  CheckCircle,
  AlertCircle,
  Loader,
  User,
  Mail,
  Phone,
  CreditCard,
} from "lucide-react";
import api from "../../utils/api";

/* ---------- Helper Functions ---------- */
const formatTime = (time) => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/* ---------- Component ---------- */
const MyBookings = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const [upcomingRes, historyRes] = await Promise.all([
        api.get("/bookings/my-bookings?type=upcoming"),
        api.get("/bookings/my-bookings?type=history"),
      ]);

      setUpcomingBookings(upcomingRes.data);
      setHistoryBookings(historyRes.data);
    } catch (err) {
      setError("Failed to load bookings");
      console.error("Fetch bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this booking? You will receive a full refund.",
      )
    ) {
      return;
    }

    setActionLoading(id);
    try {
      const response = await api.patch(`/bookings/cancel/${id}`);

      if (response.data.refund_amount) {
        alert(
          `✅ Booking cancelled successfully!\n\n` +
            `Refund: $${response.data.refund_amount.toFixed(2)}\n` +
            `Policy: ${response.data.refund_policy}`,
        );
      } else {
        alert("✅ Booking cancelled successfully!");
      }

      await fetchBookings();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to cancel booking";
      alert(`❌ ${message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Confirmed",
      },
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "Pending",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Cancelled",
      },
      completed: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Completed",
      },
      expired: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Expired",
      },
    };
    return badges[status] || badges.expired;
  };

  const BookingCard = ({ booking, showCancelButton = false }) => {
    const status = getStatusBadge(booking.booking_status);
    const isPending = booking.booking_status === "pending";
    const isConfirmed = booking.booking_status === "confirmed";

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 border-b border-orange-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {booking.service_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Booking #{booking.booking_id}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* Booking Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Date */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <Calendar className="text-orange-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Date
                </p>
                <p className="font-semibold text-gray-900">
                  {formatDate(booking.booking_date)}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <Clock className="text-orange-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Time
                </p>
                <p className="font-semibold text-gray-900">
                  {formatTime(booking.start_time)} -{" "}
                  {formatTime(booking.end_time)}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <CreditCard className="text-orange-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Payment
                </p>
                <p className="font-semibold text-gray-900 capitalize">
                  {booking.payment_method}
                </p>
              </div>
            </div>

            {/* Total Amount */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <DollarSign className="text-orange-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Total
                </p>
                <p className="font-semibold text-gray-900">
                  ${Number(booking.total_amount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {isPending && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3">
              <AlertCircle
                className="text-yellow-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <div>
                <p className="text-sm text-yellow-800 font-semibold">
                  Payment Pending
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Complete payment within 15 minutes to confirm your booking.
                </p>
              </div>
            </div>
          )}

          {booking.booking_status === "cancelled" && booking.cancelled_at && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
              <XCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <div>
                <p className="text-sm text-red-800 font-semibold">
                  Booking Cancelled
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Cancelled on {new Date(booking.cancelled_at).toLocaleString()}
                  {booking.payment_status === "refunded" &&
                    " • Full refund processed"}
                </p>
              </div>
            </div>
          )}

          {booking.booking_status === "completed" && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
              <CheckCircle
                className="text-blue-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <div>
                <p className="text-sm text-blue-800 font-semibold">
                  Booking Completed
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Thank you for using our service!
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          {showCancelButton && isConfirmed && (
            <button
              onClick={() => handleCancelBooking(booking.booking_id)}
              disabled={actionLoading === booking.booking_id}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition disabled:opacity-50 border-2 border-red-200"
            >
              {actionLoading === booking.booking_id ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle size={20} />
                  Cancel Booking
                </>
              )}
            </button>
          )}

          {/* Booking Details Footer */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
            <div className="flex items-center justify-between">
              <span>
                Booked on {new Date(booking.created_at).toLocaleString()}
              </span>
              {booking.payment_status === "completed" && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle size={16} />
                  Paid
                </span>
              )}
              {booking.payment_status === "refunded" && (
                <span className="flex items-center gap-1 text-orange-600 font-medium">
                  <DollarSign size={16} />
                  Refunded
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  /* ---------- Loading State ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader
            className="animate-spin mx-auto mb-4 text-orange-500"
            size={48}
          />
          <p className="text-gray-600 font-medium">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  /* ---------- Error State ---------- */
  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-2xl flex items-center gap-4">
        <AlertCircle size={32} />
        <div>
          <p className="font-semibold text-lg">{error}</p>
          <button
            onClick={fetchBookings}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Empty State ---------- */
  if (upcomingBookings.length === 0 && historyBookings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border-2 border-gray-200 p-16 text-center"
      >
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <Calendar className="text-gray-400" size={48} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          No Bookings Yet
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          You haven't made any bookings. Start by booking a court and it will
          appear here!
        </p>
        <button
          onClick={() => (window.location.href = "/services")}
          className="px-8 py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition inline-flex items-center gap-2"
        >
          <Calendar size={20} />
          Book Your First Court
        </button>
      </motion.div>
    );
  }

  /* ---------- Main Render ---------- */
  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">
                Total Bookings
              </p>
              <p className="text-4xl font-bold text-green-900">
                {upcomingBookings.length + historyBookings.length}
              </p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-green-500 flex items-center justify-center">
              <Calendar className="text-white" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Upcoming</p>
              <p className="text-4xl font-bold text-blue-900">
                {upcomingBookings.length}
              </p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center">
              <Clock className="text-white" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium mb-1">
                Total Spent
              </p>
              <p className="text-4xl font-bold text-orange-900">
                $
                {[...upcomingBookings, ...historyBookings]
                  .filter((b) => b.payment_status === "completed")
                  .reduce((sum, b) => sum + Number(b.total_amount), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center">
              <DollarSign className="text-white" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Calendar className="text-orange-600" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Upcoming Bookings
              </h2>
              <p className="text-sm text-gray-600">
                Your confirmed reservations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.booking_id}
                  booking={booking}
                  showCancelButton={true}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* History */}
      {historyBookings.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Clock className="text-gray-600" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Booking History
              </h2>
              <p className="text-sm text-gray-600">
                Past and cancelled bookings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {historyBookings.map((booking) => (
                <BookingCard
                  key={booking.booking_id}
                  booking={booking}
                  showCancelButton={false}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
