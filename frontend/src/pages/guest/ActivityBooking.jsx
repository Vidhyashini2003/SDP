import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../../config/axios';
import { useNavigate } from 'react-router-dom';
import DemoPaymentGateway from '../../components/DemoPaymentGateway';

const ActivityBooking = () => {
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [bookingData, setBookingData] = useState({
        ab_date: '',
        ab_time: ''
    });
    const [activeBookings, setActiveBookings] = useState([]);
    const [hasActiveBooking, setHasActiveBooking] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);

    const [searchParams] = useSearchParams();
    const urlLinkedRbId = searchParams.get('rb_id');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [activitiesRes, activeBookingsRes] = await Promise.all([
                axios.get('/api/bookings/activities/available'),
                axios.get('/api/guest/bookings/active')
            ]);

            setActivities(activitiesRes.data);

            const bookingsData = activeBookingsRes.data;
            setHasActiveBooking(bookingsData.hasActiveBooking);
            setActiveBookings(bookingsData.bookings || []);

            if (bookingsData.bookings && bookingsData.bookings.length > 0) {
                const targetId = urlLinkedRbId ? parseInt(urlLinkedRbId, 10) : bookingsData.bookings[0].rb_id;
                setSelectedBooking(targetId);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const fetchSlots = async (date) => {
        if (!selectedActivity || !date) return;
        setIsLoadingSlots(true);
        try {
            const response = await axios.get('/api/bookings/activities/slots', {
                params: { activity_id: selectedActivity.activity_id, date }
            });
            setAvailableSlots(response.data);
        } catch (error) {
            console.error('Error fetching slots:', error);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleDateChange = (e) => {
        const date = e.target.value;
        setBookingData({ ...bookingData, ab_date: date });
        setSelectedSlot(null);
        fetchSlots(date);
    };

    const handleConfirmBooking = () => {
        if (!bookingData.ab_date || !selectedSlot) {
            alert('Please select date and a time slot');
            return;
        }

        const duration = parseInt(selectedActivity.activity_duration) || 1;
        const totalAmount = selectedActivity.activity_price_per_hour * duration;
        setPaymentAmount(totalAmount);
        setIsPaymentModalOpen(true);
    };

    const confirmActivityBooking = async () => {
        try {
            const [hour, minute] = selectedSlot.split(':').map(Number);
            const startTime = new Date(`${bookingData.ab_date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
            const duration = parseInt(selectedActivity.activity_duration) || 1;
            const endTime = new Date(startTime.getTime() + (duration * 60 * 60 * 1000));

            const payload = {
                activity_id: selectedActivity.activity_id,
                start_time: startTime.toISOString().replace('T', ' ').substring(0, 19),
                end_time: endTime.toISOString().replace('T', ' ').substring(0, 19),
                total_amount: paymentAmount,
                rb_id: urlLinkedRbId || selectedBooking || activeBookings[0]?.rb_id
            };

            const response = await axios.post('/api/bookings/activities', payload);

            alert(`Activity booked successfully! Receipt Ref: JAN-${Math.random().toString(36).substring(7).toUpperCase()}`);
            setBookingData({ ab_date: '', ab_time: '' });
            setSelectedSlot(null);
            setSelectedActivity(null);
            fetchData();
        } catch (error) {
            console.error('Error booking activity:', error);
            if (error.response?.data?.requiresBooking) {
                alert(error.response.data.message || 'You must have an active room booking to book activities.');
                navigate('/guest/rooms');
            } else {
                const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to book activity';
                alert(`${errorMsg}`);
            }
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const currentLinkedBookingKey = urlLinkedRbId ? parseInt(urlLinkedRbId, 10) : selectedBooking;
    const currentLinkedBooking = activeBookings.find(b => b.rb_id === currentLinkedBookingKey);
    
    let minDate = today;
    let maxDate = '';

    if (currentLinkedBooking) {
        const checkIn = new Date(currentLinkedBooking.rb_checkin).toISOString().split('T')[0];
        const checkOut = new Date(currentLinkedBooking.rb_checkout).toISOString().split('T')[0];
        minDate = checkIn > today ? checkIn : today;
        maxDate = checkOut;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    if (!hasActiveBooking && !urlLinkedRbId) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 max-w-md text-center shadow-lg">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🏨</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Room Booking Required</h2>
                    <p className="text-slate-600 mb-6">
                        You must have an active room booking to book activities.
                        Reserve your room first to unlock exciting experiences!
                    </p>
                    <button
                        onClick={() => navigate('/guest/rooms')}
                        className="w-full bg-gold-500 hover:bg-gold-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
                    >
                        Book a Room Now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full overflow-hidden flex flex-col">
            <div className="mb-6 flex-shrink-0">
                <h3 className="text-2xl font-bold text-slate-900">Activity Booking</h3>
                <p className="text-slate-500 text-sm mt-1">Explore exciting water sports and cultural tours</p>

                {activeBookings.length > 0 && !urlLinkedRbId && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-block">
                        <p className="text-sm text-slate-700">
                            <span className="font-medium">📌 Linked to:</span> {activeBookings.find(b => b.rb_id === selectedBooking)?.room_type || 'Selected Booking'} ({new Date(activeBookings.find(b => b.rb_id === selectedBooking)?.rb_checkin).toLocaleDateString()} - {new Date(activeBookings.find(b => b.rb_id === selectedBooking)?.rb_checkout).toLocaleDateString()})
                        </p>
                        {activeBookings.length > 1 && (
                            <select
                                value={selectedBooking}
                                onChange={(e) => {
                                    const newId = parseInt(e.target.value);
                                    setSelectedBooking(newId);
                                    setBookingData({ ...bookingData, ab_date: '' });
                                    setSelectedSlot(null);
                                }}
                                className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                            >
                                {activeBookings.map(booking => (
                                    <option key={booking.rb_id} value={booking.rb_id}>
                                        {booking.room_type} ({new Date(booking.rb_checkin).toLocaleDateString()} - {new Date(booking.rb_checkout).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {urlLinkedRbId && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-block">
                        <p className="text-sm text-slate-700">
                            <span className="font-medium">📌 Linked to Room Booking:</span> #{urlLinkedRbId}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex-1 flex gap-8 overflow-hidden">
                {/* Left Side: Activity List */}
                <div className="w-3/5 overflow-y-auto pr-4 space-y-4">
                    <h4 className="font-semibold text-slate-900 mb-2 sticky top-0 bg-slate-50 py-2 z-10">Select Activity</h4>
                    {activities.map((activity) => (
                        <div
                            key={activity.activity_id}
                            onClick={() => {
                                setSelectedActivity(activity);
                                setBookingData({ ...bookingData, ab_date: '' });
                                setAvailableSlots([]);
                                setSelectedSlot(null);
                            }}
                            className={`p-6 rounded-xl border-2 transition-all cursor-pointer bg-white ${
                                selectedActivity?.activity_id === activity.activity_id
                                    ? 'border-gold-500 shadow-md transform scale-[1.01]'
                                    : 'border-slate-200 hover:border-gold-300 hover:shadow-sm'
                            }`}
                        >
                            <h4 className="text-xl font-bold text-slate-900 mb-2">
                                {activity.activity_name}
                            </h4>
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                {activity.activity_description || 'Enjoy this amazing activity'}
                            </p>
                            <div className="flex items-center justify-between">
                                <p className="text-xl font-bold text-gold-600">
                                    Rs. {activity.activity_price_per_hour?.toLocaleString()}/hour
                                </p>
                                <span className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                    selectedActivity?.activity_id === activity.activity_id
                                        ? 'bg-gold-500 text-white'
                                        : 'bg-slate-100 text-slate-600 group-hover:bg-gold-100'
                                }`}>
                                    {selectedActivity?.activity_id === activity.activity_id ? '✓ Selected' : 'Select'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {activities.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No activities available at the moment.
                        </div>
                    )}
                </div>

                {/* Right Side: Booking Controls */}
                <div className="w-2/5 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                    <h4 className="font-bold text-slate-900 text-xl mb-6">Select Date & Time</h4>
                    
                    {!selectedActivity ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
                            <span className="text-5xl mb-4">🏊</span>
                            <p>Please select an activity from the list to continue</p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="pb-4 border-b border-slate-100">
                                <p className="text-sm font-medium text-gold-600 mb-1 uppercase tracking-wider">Now Booking</p>
                                <h5 className="text-2xl font-bold text-slate-900">{selectedActivity.activity_name}</h5>
                                <p className="text-slate-500 text-sm mt-1">Duration: {selectedActivity.activity_duration || 1} hour(s)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={bookingData.ab_date}
                                        min={minDate}
                                        max={maxDate}
                                        onChange={handleDateChange}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-gold-100 focus:border-gold-500 outline-none transition-all appearance-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">📅</span>
                                </div>
                            </div>

                            {bookingData.ab_date && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Time Slot</label>
                                    {isLoadingSlots ? (
                                        <div className="flex items-center gap-2 text-slate-500 py-3">
                                            <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm">Fetching availability...</span>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={selectedSlot || ''}
                                                onChange={(e) => setSelectedSlot(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-gold-100 focus:border-gold-500 outline-none transition-all appearance-none"
                                            >
                                                <option value="">Select time</option>
                                                {availableSlots.map((slot) => {
                                                    const startHour = parseInt(slot.time.split(':')[0]);
                                                    const duration = parseInt(selectedActivity.activity_duration) || 1;
                                                    const endHour = startHour + duration;
                                                    const timeLabel = `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;

                                                    return (
                                                        <option 
                                                            key={slot.time} 
                                                            value={slot.time} 
                                                            disabled={slot.isBooked}
                                                        >
                                                            {timeLabel} {slot.isBooked ? '(Already Booked)' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
                                {selectedSlot && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Total Calculation</span>
                                        <span className="font-bold text-slate-900">Rs. {(selectedActivity.activity_price_per_hour * (parseInt(selectedActivity.activity_duration) || 1)).toLocaleString()}</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={!selectedSlot || isLoadingSlots}
                                    className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-xl shadow-lg shadow-gold-100 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:shadow-none"
                                >
                                    Confirm Activity Booking
                                </button>
                                <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest">
                                    Payments are processed securely
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <DemoPaymentGateway 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentSuccess={confirmActivityBooking}
                amount={paymentAmount}
            />
        </div>
        </div>
    );
};

export default ActivityBooking;
