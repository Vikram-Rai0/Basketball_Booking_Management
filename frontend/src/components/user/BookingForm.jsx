import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader,
  Info,
  XCircle,
  Timer,
  CreditCard,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import api from "../../utils/api";

/* --------- Utils --------- */
const getNext7Days = () => {
  const days = [];
  const base = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);

    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      fullDate: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    });
  }
  return days;
};

const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

/* --------- Component --------- */
const BookingForm = () => {
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: Date/Time, 2: Payment, 3: Confirmation
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    service_id: "",
    booking_date: "",
    slot_id: "",
    payment_method: "card",
  });

  // Fetch active services
  useEffect(() => {
    setLoading(true);
    api.get("/services/active")
      .then((res) => {
        setServices(res.data);
        if (res.data.length > 0) {
          // Auto-select first service
          setSelectedService(res.data[0]);
          setFormData(prev => ({ ...prev, service_id: res.data[0].service_id }));
        }
        setError("");
      })
      .catch(() => setError("Failed to load services"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch available slots for selected service & date
  useEffect(() => {
    if (formData.service_id && formData.booking_date) {
      setSlotsLoading(true);
      setError("");
      api
        .get(
          `/bookings/available-slots/${formData.service_id}?date=${formData.booking_date}`
        )
        .then((res) => {
          setAvailableSlots(res.data);
        })
        .catch((err) => {
          console.error("Error fetching slots:", err);
          setError(err.response?.data?.message || "Failed to load time slots");
          setAvailableSlots([]);
        })
        .finally(() => setSlotsLoading(false));
    }
  }, [formData.service_id, formData.booking_date]);

  // Countdown timer for pending booking (15 minutes)
  useEffect(() => {
    if (!pendingBooking) return;

    const interval = setInterval(() => {
      const expiresAt = new Date(pendingBooking.expires_at).getTime();
      const remaining = expiresAt - Date.now();

      if (remaining <= 0) {
        setPendingBooking(null);
        setTimeRemaining(null);
        alert("⏰ Booking expired. Your reservation has been released. Please try again.");
        resetForm();
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingBooking]);

  const resetForm = () => {
    setFormData({
      service_id: services[0]?.service_id || "",
      booking_date: "",
      slot_id: "",
      payment_method: "card",
    });
    setAvailableSlots([]);
    setSelectedService(services[0] || null);
    setPendingBooking(null);
    setTimeRemaining(null);
    setError("");
    setCurrentStep(1);
    setShowSuccessModal(false);
  };

  const handleCreateBooking = async () => {
    if (
      !formData.service_id ||
      !formData.slot_id ||
      !formData.booking_date ||
      !formData.payment_method
    ) {
      setError("Please complete all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        service_id: Number(formData.service_id),
        slot_id: Number(formData.slot_id),
        booking_date: formData.booking_date,
        payment_method: formData.payment_method,
      };

      const res = await api.post("/bookings/create", payload);

      setPendingBooking({
        ...res.data,
        created_at: new Date().toISOString(),
      });

      setCurrentStep(3); // Move to confirmation step
    } catch (error) {
      const message = error.response?.data?.message || "Booking failed. Please try again.";
      setError(message);

      if (error.response?.status === 409) {
        setTimeout(() => {
          if (formData.service_id && formData.booking_date) {
            setSlotsLoading(true);
            api.get(`/bookings/available-slots/${formData.service_id}?date=${formData.booking_date}`)
              .then((res) => setAvailableSlots(res.data))
              .finally(() => setSlotsLoading(false));
          }
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingBooking) return;

    setLoading(true);
    setError("");

    try {
      await api.post(`/bookings/confirm/${pendingBooking.booking_id}`);

      setShowSuccessModal(true);
    } catch (error) {
      const message = error.response?.data?.message || "Payment confirmation failed";
      setError(message);

      if (message.includes("expired")) {
        setTimeout(() => resetForm(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceedToPayment = () => {
    return formData.service_id && formData.booking_date && formData.slot_id;
  };

  const selectedSlot = availableSlots.find(
    (s) => s.slot_id.toString() === formData.slot_id
  );

  const selectedDate = getNext7Days().find(d => d.fullDate === formData.booking_date);

  // Success Modal
  if (showSuccessModal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative"
        >
          <button
            onClick={() => {
              setShowSuccessModal(false);
              resetForm();
            }}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>

          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
            >
              <CheckCircle className="text-green-600" size={48} />
            </motion.div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Booking Confirmed!
            </h2>
            <p className="text-gray-600 mb-8">
              Your court has been booked for {selectedDate?.dayName} at{" "}
              {selectedSlot && `${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}`}
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date</span>
                <span className="font-semibold">{selectedDate?.dayName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Time</span>
                <span className="font-semibold">
                  {selectedSlot && `${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment</span>
                <span className="font-semibold capitalize">{formData.payment_method}</span>
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-gray-600 font-semibold">Total</span>
                <span className="text-2xl font-bold text-orange-600">
                  ${Number(selectedService?.price).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/my-bookings'}
                className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition"
              >
                View My Bookings
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  resetForm();
                }}
                className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Step 3: Confirmation Screen
  if (currentStep === 3 && pendingBooking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-8 py-6 rounded-t-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calendar className="text-orange-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Book Your Court</h2>
                  <p className="text-sm text-gray-500">Step 3 of 3</p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={28} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2">
              <div className="flex-1 h-1 bg-orange-500 rounded-full" />
              <div className="flex-1 h-1 bg-orange-500 rounded-full" />
              <div className="flex-1 h-1 bg-orange-500 rounded-full" />
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Timer className="text-yellow-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Your Details</h3>
              <p className="text-gray-600">
                Complete payment within{" "}
                <span className="font-bold text-red-600 text-lg">{timeRemaining}</span>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Booking Summary */}
            <div className="bg-orange-50 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-900">Booking Summary</h4>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-orange-600 text-sm font-medium hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected Session</span>
                  <span className="font-semibold text-right">
                    {selectedDate?.dayName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="font-semibold">
                    {selectedSlot && `${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-semibold">{selectedService?.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold capitalize">{formData.payment_method}</span>
                </div>
              </div>

              <div className="border-t border-orange-200 mt-4 pt-4 flex justify-between items-center">
                <span className="text-gray-600 font-semibold">Total</span>
                <span className="text-3xl font-bold text-orange-600">
                  ${Number(pendingBooking.total_amount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* User Details Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none"
                  defaultValue="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none"
                  defaultValue="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none"
                  defaultValue="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Confirm Payment
                  </>
                )}
              </button>

              <button
                onClick={resetForm}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Cancel Booking
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-blue-800">
                Your slot will be automatically released if payment is not completed within 15 minutes.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Main booking interface
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-8 py-6 rounded-t-3xl z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="text-orange-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Book Your Court</h2>
                <p className="text-sm text-gray-500">
                  Step {currentStep} of {currentStep === 2 ? 2 : 3}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={28} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2">
            <div className={`flex-1 h-1 rounded-full transition-colors ${currentStep >= 1 ? 'bg-orange-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full transition-colors ${currentStep >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`} />
            {currentStep === 3 && (
              <div className="flex-1 h-1 bg-orange-500 rounded-full" />
            )}
          </div>
        </div>

        {/* Step 1: Date & Time Selection */}
        {currentStep === 1 && (
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Service Selection */}
            {services.length > 1 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Select Service</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.map((service) => (
                    <button
                      key={service.service_id}
                      onClick={() => {
                        setSelectedService(service);
                        setFormData(prev => ({
                          ...prev,
                          service_id: service.service_id,
                          slot_id: "",
                          booking_date: ""
                        }));
                        setAvailableSlots([]);
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${selectedService?.service_id === service.service_id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                        }`}
                    >
                      <div className="font-semibold text-gray-900">{service.service_name}</div>
                      <div className="text-orange-600 font-bold mt-1">
                        ${Number(service.price).toFixed(2)}/hour
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Select Date</h3>
              <div className="grid grid-cols-7 gap-3">
                {getNext7Days().map((d) => (
                  <button
                    key={d.fullDate}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        booking_date: d.fullDate,
                        slot_id: ""
                      }));
                      setError("");
                    }}
                    className={`aspect-square rounded-xl border-2 transition-all p-3 flex flex-col items-center justify-center ${formData.booking_date === d.fullDate
                        ? 'border-orange-500 bg-orange-500 text-white shadow-lg'
                        : 'border-gray-200 hover:border-orange-300 hover:shadow-md text-gray-900'
                      }`}
                  >
                    <div className="text-xs uppercase opacity-70">{d.label}</div>
                    <div className="text-2xl font-bold mt-1">{d.date}</div>
                    <div className="text-xs mt-1 opacity-70">{d.month}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {formData.booking_date && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Available Time Slots
                  {availableSlots.length > 0 && (
                    <span className="text-sm text-gray-500 font-normal ml-2">
                      ({availableSlots.filter(s => s.availability_status === 'available').length} available)
                    </span>
                  )}
                </h3>

                {slotsLoading ? (
                  <div className="text-center py-12">
                    <Loader className="animate-spin mx-auto mb-3 text-orange-600" size={40} />
                    <p className="text-gray-600">Loading time slots...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                    {availableSlots.map((slot) => {
                      const isAvailable = slot.availability_status === 'available';
                      const isSelected = formData.slot_id === slot.slot_id.toString();
                      const statusColors = {
                        available: 'border-gray-200 hover:border-orange-500',
                        booked: 'border-gray-200 bg-gray-50 opacity-50',
                        reserved: 'border-yellow-200 bg-yellow-50',
                        past: 'border-gray-200 bg-gray-50 opacity-50'
                      };

                      return (
                        <button
                          key={slot.slot_id}
                          disabled={!isAvailable}
                          onClick={() => {
                            if (!isAvailable) return;
                            setFormData(prev => ({
                              ...prev,
                              slot_id: slot.slot_id.toString()
                            }));
                            setError("");
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${isSelected
                              ? 'border-orange-500 bg-orange-50 shadow-md'
                              : statusColors[slot.availability_status] || 'border-gray-200'
                            } ${!isAvailable ? 'cursor-not-allowed' : 'hover:shadow-sm'}`}
                        >
                          <Clock size={20} className={`mx-auto mb-2 ${isAvailable ? 'text-gray-700' : 'text-gray-400'
                            }`} />
                          <div className={`font-semibold ${isAvailable ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                            {formatTime(slot.start_time)}
                          </div>
                          <div className={`text-xs mt-1 ${isAvailable ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                            {formatTime(slot.end_time)}
                          </div>
                          {!isAvailable && (
                            <div className="text-xs mt-2 text-red-600 font-medium">
                              {slot.availability_status === 'booked' ? 'Booked' :
                                slot.availability_status === 'reserved' ? 'Reserved' : 'Unavailable'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Calendar className="mx-auto mb-3 text-gray-400" size={48} />
                    <p className="text-gray-600">No slots available for this date</p>
                  </div>
                )}
              </div>
            )}

            {/* Info Note */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3">
              <Info className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Bookings must be made at least 1 hour in advance.
                Your selected slot will be reserved for 15 minutes to complete payment.
              </p>
            </div>

            {/* Continue Button */}
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToPayment()}
              className="w-full mt-6 bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue to Payment
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {currentStep === 2 && (
          <div className="p-8">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
            >
              <ChevronLeft size={20} />
              Back to Date & Time
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Method</h3>
            <p className="text-gray-600 mb-6">Select how you would like to pay</p>

            {/* Selected Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Selected Session</div>
                  <div className="font-semibold text-gray-900">
                    {selectedDate?.dayName} • {selectedSlot && `${formatTime(selectedSlot.start_time)} - ${formatTime(selectedSlot.end_time)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Total</div>
                  <div className="text-2xl font-bold text-orange-600">
                    ${Number(selectedService?.price).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setFormData(prev => ({ ...prev, payment_method: 'card' }))}
                className={`w-full p-5 rounded-xl border-2 transition-all flex items-center justify-between ${formData.payment_method === 'card'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.payment_method === 'card' ? 'bg-orange-500' : 'bg-gray-100'
                    }`}>
                    <CreditCard className={formData.payment_method === 'card' ? 'text-white' : 'text-gray-600'} size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Credit Card</div>
                    <div className="text-sm text-gray-600">Visa, Mastercard, Amex</div>
                  </div>
                </div>
                {formData.payment_method === 'card' && (
                  <CheckCircle className="text-orange-500" size={24} />
                )}
              </button>

              <button
                onClick={() => setFormData(prev => ({ ...prev, payment_method: 'cash' }))}
                className={`w-full p-5 rounded-xl border-2 transition-all flex items-center justify-between ${formData.payment_method === 'cash'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.payment_method === 'cash' ? 'bg-orange-500' : 'bg-gray-100'
                    }`}>
                    <DollarSign className={formData.payment_method === 'cash' ? 'text-white' : 'text-gray-600'} size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Cash</div>
                    <div className="text-sm text-gray-600">Pay at the venue</div>
                  </div>
                </div>
                {formData.payment_method === 'cash' && (
                  <CheckCircle className="text-orange-500" size={24} />
                )}
              </button>

              <button
                onClick={() => setFormData(prev => ({ ...prev, payment_method: 'online' }))}
                className={`w-full p-5 rounded-xl border-2 transition-all flex items-center justify-between ${formData.payment_method === 'online'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.payment_method === 'online' ? 'bg-orange-500' : 'bg-gray-100'
                    }`}>
                    <svg className={`w-6 h-6 ${formData.payment_method === 'online' ? 'text-white' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Online Payment</div>
                    <div className="text-sm text-gray-600">PayPal, Apple Pay, Google Pay</div>
                  </div>
                </div>
                {formData.payment_method === 'online' && (
                  <CheckCircle className="text-orange-500" size={24} />
                )}
              </button>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleCreateBooking}
              disabled={loading || !formData.payment_method}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Booking
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BookingForm;