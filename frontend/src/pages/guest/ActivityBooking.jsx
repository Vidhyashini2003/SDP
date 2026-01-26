import { useState, useEffect } from 'react';
import axios from '../../config/axios';

const ActivityBooking = () => {
    const [activities, setActivities] = useState([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [bookingData, setBookingData] = useState({
        ab_date: '',
        ab_time: ''
    });

    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const response = await axios.get('/api/bookings/activities/available');
            setActivities(response.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
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

    const handleBookNow = (activity) => {
        setSelectedActivity(activity);
        setBookingData({ ab_date: '', ab_time: '' });
        setAvailableSlots([]);
        setSelectedSlot(null);
        setShowBookingModal(true);
    };

    const handleConfirmBooking = async () => {
        if (!bookingData.ab_date || !selectedSlot) {
            alert('Please select date and a time slot');
            return;
        }

        try {
            await axios.post('/api/bookings/activities', {
                activity_id: selectedActivity.activity_id,
                start_time: `${bookingData.ab_date} ${selectedSlot}`,
                end_time: `${bookingData.ab_date} ${parseInt(selectedSlot.split(':')[0]) + 1}:00:00`,
                total_amount: selectedActivity.activity_price_per_hour,
                payment_method: 'Cash'
            });

            alert('Activity booked successfully!');
            setShowBookingModal(false);
            setBookingData({ ab_date: '', ab_time: '' });
            fetchActivities();
        } catch (error) {
            console.error('Error booking activity:', error);
            alert(error.response?.data?.error || 'Failed to book activity');
        }
    };

    return (
        <div className="p-8 overflow-auto">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Activity Booking</h3>
                <p className="text-slate-500 text-sm mt-1">Explore exciting water sports and cultural tours</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {activities.map((activity) => (
                    <div
                        key={activity.activity_id}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="mb-4">
                            <h4 className="text-lg font-bold text-slate-900 mb-1">
                                {activity.activity_name}
                            </h4>
                            <p className="text-sm text-slate-500">
                                {activity.activity_description || 'Enjoy this amazing activity'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                            <span>🕒</span>
                            <span>{activity.activity_duration || '1 hour'}</span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <div>
                                <p className="text-2xl font-bold text-blue-600">
                                    Rs. {activity.activity_price_per_hour?.toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500">per hour</p>
                            </div>
                            <button
                                onClick={() => handleBookNow(activity)}
                                className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors"
                            >
                                Book Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {activities.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No activities available at the moment. Please check back later.
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && selectedActivity && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                        <button
                            onClick={() => setShowBookingModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl"
                        >
                            ×
                        </button>

                        <div className="mb-6 border-b border-slate-100 pb-4">
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">Book Activity</h2>
                            <p className="text-lg text-blue-600 font-medium">{selectedActivity.activity_name}</p>
                            <p className="text-sm text-slate-500">Rs. {selectedActivity.activity_price_per_hour?.toLocaleString()} per hour</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                                <input
                                    type="date"
                                    name="ab_date"
                                    value={bookingData.ab_date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={handleDateChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {bookingData.ab_date && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Select Time Slot</label>
                                    {isLoadingSlots ? (
                                        <div className="text-center py-4 text-slate-500">Loading slots...</div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-3">
                                            {availableSlots.map((slot) => {
                                                const startHour = parseInt(slot.time.split(':')[0]);
                                                const endHour = startHour + 1;
                                                const timeLabel = `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;

                                                return (
                                                    <button
                                                        key={slot.time}
                                                        onClick={() => !slot.isBooked && setSelectedSlot(slot.time)}
                                                        disabled={slot.isBooked}
                                                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all
                                                            ${slot.isBooked
                                                                ? 'bg-red-50 text-red-400 cursor-not-allowed border border-red-100'
                                                                : selectedSlot === slot.time
                                                                    ? 'bg-gold-500 text-white shadow-md'
                                                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                                            }
                                                        `}
                                                    >
                                                        {timeLabel}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setShowBookingModal(false)}
                                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmBooking}
                                disabled={!selectedSlot}
                                className="flex-1 py-3 px-4 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityBooking;
