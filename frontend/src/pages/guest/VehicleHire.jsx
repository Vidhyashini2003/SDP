import { useState, useEffect } from 'react';
import axios from '../../config/axios';

const VehicleHire = () => {
    const [vehicles, setVehicles] = useState([]);
    const [profileData, setProfileData] = useState({ guest_name: '' });
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState({
        pickup_point: '',
        drop_point: '',
        trip_start: '',
        trip_end: '',
        payment_method: 'Cash'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [vehiclesRes, profileRes] = await Promise.all([
                axios.get('/api/bookings/vehicles/available'),
                axios.get('/api/guest/profile')
            ]);

            setVehicles(vehiclesRes.data || []);
            setProfileData(profileRes.data || {});
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const getPassengerCount = (vehicleType) => {
        const type = vehicleType?.toLowerCase() || '';
        if (type.includes('van')) return '12';
        if (type.includes('mini') || type.includes('small')) return '4';
        if (type.includes('jeep')) return '5';
        if (type.includes('car')) return '4';
        if (type.includes('three') || type.includes('wheeler')) return '3';
        return '4';
    };

    const getVehicleDescription = (vehicleType) => {
        const type = vehicleType?.toLowerCase() || '';
        if (type.includes('van')) return 'Comfortable van for group travel';
        if (type.includes('mini')) return 'Compact mini van for small groups';
        if (type.includes('jeep')) return 'Full sized jeep for adventure tours';
        if (type.includes('car')) return 'Standard car for city travel';
        if (type.includes('three') || type.includes('wheeler')) return 'Tuk tuk for short trips';
        return 'Comfortable vehicle for your travel needs';
    };

    const handleBookVehicle = (vehicle) => {
        setSelectedVehicle(vehicle);
        setShowBookingModal(true);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();

        if (!selectedVehicle) return;

        try {
            const start = new Date(bookingData.trip_start);
            const end = new Date(bookingData.trip_end);
            const hours = Math.ceil((end - start) / (1000 * 60 * 60));
            const days = Math.ceil(hours / 24);
            const total_amount = days * selectedVehicle.vehicle_price_per_day;

            const bookingPayload = {
                vehicle_id: selectedVehicle.vehicle_id,
                pickup_point: bookingData.pickup_point,
                drop_point: bookingData.drop_point,
                trip_start: bookingData.trip_start,
                trip_end: bookingData.trip_end,
                total_amount: total_amount,
                payment_method: bookingData.payment_method
            };

            await axios.post('/api/bookings/vehicles', bookingPayload);

            alert('Vehicle booked successfully!');
            setShowBookingModal(false);
            setSelectedVehicle(null);
            setBookingData({
                pickup_point: '',
                drop_point: '',
                trip_start: '',
                trip_end: '',
                payment_method: 'Cash'
            });
            fetchData();
        } catch (error) {
            console.error('Error booking vehicle:', error);
            alert('Failed to book vehicle. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8 overflow-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Vehicle Hire</h3>
                    <p className="text-sm text-slate-500">Book comfortable vehicles for your travel needs</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.vehicle_id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-slate-900 text-lg">{vehicle.vehicle_type}</h4>
                                <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
                                    Available
                                </span>
                            </div>

                            <p className="text-sm text-slate-600 mb-4">{getVehicleDescription(vehicle.vehicle_type)}</p>

                            <div className="space-y-2 mb-4 text-sm text-slate-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500">👥</span>
                                    <span>{getPassengerCount(vehicle.vehicle_type)} passengers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500">📅</span>
                                    <span>Per Day:</span>
                                    <span className="font-semibold text-blue-600">Rs. {vehicle.vehicle_price_per_day}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500">⏰</span>
                                    <span>Per Hour:</span>
                                    <span className="font-semibold text-blue-600">Rs. {vehicle.vehicle_price_per_hour}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleBookVehicle(vehicle)}
                                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-sm"
                            >
                                Book Vehicle
                            </button>
                        </div>
                    ))}
                </div>

                {vehicles.length === 0 && (
                    <p className="text-center text-slate-500 py-12">No vehicles available at the moment</p>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && selectedVehicle && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Book {selectedVehicle.vehicle_type}</h3>
                            <button
                                onClick={() => setShowBookingModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleBookingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Point</label>
                                <input
                                    type="text"
                                    required
                                    value={bookingData.pickup_point}
                                    onChange={(e) => setBookingData({ ...bookingData, pickup_point: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter pickup location"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Drop Point</label>
                                <input
                                    type="text"
                                    required
                                    value={bookingData.drop_point}
                                    onChange={(e) => setBookingData({ ...bookingData, drop_point: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter drop location"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Trip Start</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={bookingData.trip_start}
                                    onChange={(e) => setBookingData({ ...bookingData, trip_start: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Trip End</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={bookingData.trip_end}
                                    onChange={(e) => setBookingData({ ...bookingData, trip_end: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                                <select
                                    value={bookingData.payment_method}
                                    onChange={(e) => setBookingData({ ...bookingData, payment_method: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Vehicle:</span>
                                    <span className="font-medium">{selectedVehicle.vehicle_type}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Rate (per day):</span>
                                    <span className="font-medium">Rs. {selectedVehicle.vehicle_price_per_day}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleHire;
