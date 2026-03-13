import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VehicleHire = () => {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [searchParams, setSearchParams] = useState({
        vb_date: '',
        vb_days: 1
    });
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requesting, setRequesting] = useState(null);
    const [activeBookings, setActiveBookings] = useState([]);
    const [hasActiveBooking, setHasActiveBooking] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [checkingBooking, setCheckingBooking] = useState(true);

    const [searchParamsUrl] = useSearchParams();
    const urlLinkedRbId = searchParamsUrl.get('rb_id');

    useEffect(() => {
        fetchActiveBookings();
    }, []);

    const fetchActiveBookings = async () => {
        try {
            const response = await axios.get('/api/guest/bookings/active');
            const bookingsData = response.data;
            setHasActiveBooking(bookingsData.hasActiveBooking);
            setActiveBookings(bookingsData.bookings || []);

            if (bookingsData.bookings && bookingsData.bookings.length > 0) {
                const targetId = urlLinkedRbId ? parseInt(urlLinkedRbId, 10) : bookingsData.bookings[0].rb_id;
                setSelectedBooking(targetId);
            }
        } catch (error) {
            console.error('Error fetching active bookings:', error);
        } finally {
            setCheckingBooking(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.get('/api/bookings/vehicles/available', {
                params: {
                    date: searchParams.vb_date,
                    days: searchParams.vb_days
                }
            });
            setVehicles(res.data || []);
            setHasSearched(true);
        } catch (error) {
            console.error('Error searching vehicles:', error);
            alert('Failed to search vehicles');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestHire = async (vehicle) => {
        if (!confirm(`Request to hire ${vehicle.vehicle_type} for ${searchParams.vb_days} days?`)) return;

        setRequesting(vehicle.vehicle_id);
        try {
            const payload = {
                vehicle_id: vehicle.vehicle_id,
                vb_date: searchParams.vb_date,
                vb_days: parseInt(searchParams.vb_days),
                rb_id: urlLinkedRbId || selectedBooking
            };
            console.log('Vehicle hire payload:', payload);


            const response = await axios.post('/api/bookings/vehicles', payload);
            alert(`Hire request sent and linked to booking #${response.data.linkedBooking}! Please wait for a driver to accept.`);
            // Optionally remove from list or refresh
            const newVehicles = vehicles.filter(v => v.vehicle_id !== vehicle.vehicle_id);
            setVehicles(newVehicles);
        } catch (error) {
            console.error('Error requesting hire:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to send request';
            alert(`ERROR from server: ${errorMsg}\nCode: ${error.response?.status}`);
            
            if (error.response?.data?.requiresBooking) {
                alert(error.response.data.message || 'You must have an active room booking to hire a vehicle.');
                navigate('/guest/rooms');
            } else {
                alert(error.response?.data?.error || error.response?.data?.message || 'Failed to send request');
            }
        } finally {
            setRequesting(null);
        }
    };

    // Get today's date for min attribute
    const today = new Date().toISOString().split('T')[0];

    // Restrict dates based on selected/linked booking
    const currentLinkedBooking = activeBookings.find(b => b.rb_id == (urlLinkedRbId ? parseInt(urlLinkedRbId, 10) : selectedBooking));
    
    let minDate = today;
    let maxDate = '';

    if (currentLinkedBooking) {
        const checkIn = new Date(currentLinkedBooking.rb_checkin);
        const checkOut = new Date(currentLinkedBooking.rb_checkout);
        
        // Add 1 day buffer as allowed by backend
        const bufferStart = new Date(checkIn);
        bufferStart.setDate(bufferStart.getDate() - 1);
        const bufferEnd = new Date(checkOut);
        bufferEnd.setDate(bufferEnd.getDate() + 1);

        const minS = bufferStart.toISOString().split('T')[0];
        const maxS = bufferEnd.toISOString().split('T')[0];

        minDate = minS > today ? minS : today;
        maxDate = maxS;
    }

    const getPassengerCount = (vehicleType) => {
        const type = vehicleType?.toLowerCase() || '';
        if (type.includes('van')) return '12';
        if (type.includes('mini') || type.includes('small')) return '4';
        if (type.includes('jeep')) return '5';
        if (type.includes('car')) return '4';
        if (type.includes('three') || type.includes('wheeler')) return '3';
        return '4';
    };

    if (checkingBooking) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    // Check if user has active booking
    if (!hasActiveBooking && !urlLinkedRbId) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 max-w-md text-center shadow-lg">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🏨</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Room Booking Required</h2>
                    <p className="text-slate-600 mb-6">
                        You must have an active room booking to hire a vehicle.
                        Book your stay first to arrange transportation!
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
        <div className="p-8 overflow-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Vehicle Hire</h3>
                    <p className="text-sm text-slate-500">Search for available vehicles for your dates</p>

                    {/* Booking Info */}
                    {activeBookings.length > 0 && !urlLinkedRbId && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-block">
                            <p className="text-sm text-slate-700">
                                <span className="font-medium">📌 Linked to:</span> {activeBookings.find(b => b.rb_id == selectedBooking)?.room_type} ({new Date(activeBookings.find(b => b.rb_id == selectedBooking)?.rb_checkin).toLocaleDateString()} - {new Date(activeBookings.find(b => b.rb_id == selectedBooking)?.rb_checkout).toLocaleDateString()})
                            </p>
                            {activeBookings.length > 1 && (
                                <select
                                    value={selectedBooking}
                                    onChange={(e) => setSelectedBooking(parseInt(e.target.value))}
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

                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            required
                            min={minDate}
                            max={maxDate}
                            value={searchParams.vb_date}
                            onChange={(e) => setSearchParams({ ...searchParams, vb_date: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Number of Days</label>
                        <input
                            type="number"
                            required
                            min="1"
                            max="30"
                            value={searchParams.vb_days}
                            onChange={(e) => setSearchParams({ ...searchParams, vb_days: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                            {loading ? 'Searching...' : 'Search Vehicles'}
                        </button>
                    </div>
                </form>
            </div>

            {hasSearched && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {vehicles.length > 0 ? (
                        vehicles.map((vehicle) => (
                            <div key={vehicle.vehicle_id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-slate-900 text-lg">{vehicle.vehicle_type}</h4>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                        Available
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4 text-sm text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">🚗</span>
                                        <span>{vehicle.vehicle_number}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">👥</span>
                                        <span>{getPassengerCount(vehicle.vehicle_type)} passengers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">💰</span>
                                        <span>Per Day: <span className="font-semibold text-gold-600">Rs. {vehicle.vehicle_price_per_day}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                                        <span className="font-bold text-slate-900">Total Est:</span>
                                        <span className="font-bold text-green-600">Rs. {vehicle.vehicle_price_per_day * searchParams.vb_days}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); handleRequestHire(vehicle); }}
                                    disabled={requesting === vehicle.vehicle_id}
                                    className="w-full py-3 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {requesting === vehicle.vehicle_id ? 'Sending Request...' : 'Request Hire'}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
                            <p className="text-slate-500">No vehicles available for the selected dates.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VehicleHire;
