import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const ReceptionistBookings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [bookings, setBookings] = useState({
        rooms: [],
        activities: [],
        foodOrders: [],
        vehicles: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const [roomsRes, actRes, ordersRes, vehiclesRes] = await Promise.all([
                    axios.get('/api/receptionist/bookings/rooms'),
                    axios.get('/api/receptionist/bookings/activities'),
                    axios.get('/api/receptionist/bookings/orders'),
                    axios.get('/api/receptionist/bookings/vehicles')
                ]);
                setBookings({
                    rooms: roomsRes.data || [],
                    activities: actRes.data || [],
                    foodOrders: ordersRes.data || [],
                    vehicles: vehiclesRes.data || []
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching bookings:', error);
                toast.error('Failed to load bookings');
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'checked-in': 'bg-blue-500',
            'confirmed': 'bg-green-500',
            'pending': 'bg-yellow-500',
            'active': 'bg-gold-500',
            'booked': 'bg-green-500',
            'delivered': 'bg-green-500',
            'ordered': 'bg-yellow-500',
            'cancelled': 'bg-red-500',
            'completed': 'bg-slate-500',
            'rejected': 'bg-red-500'
        };
        return `${statusColors[status?.toLowerCase()] || 'bg-slate-500'} text-white`;
    };

    const handleStatusUpdate = async (type, id, newStatus) => {
        // Implementation for easy status updates directly from the list if needed
        // For now, let's keep it simple or port the existing logic for rooms/activities
        try {
            let endpoint = '';
            if (type === 'room') endpoint = `/api/receptionist/bookings/rooms/${id}/status`;
            else if (type === 'activity') endpoint = `/api/receptionist/bookings/activities/${id}/status`;

            if (endpoint) {
                await axios.put(endpoint, { status: newStatus });
                toast.success('Status updated');
                // Refresh logic would be ideal here
                window.location.reload(); // Simple refresh for now
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const tabs = [
        { id: 'all', label: 'All Bookings', icon: '📋' },
        { id: 'rooms', label: 'Rooms', icon: '🏨' },
        { id: 'activities', label: 'Activities', icon: '🎯' },
        { id: 'food', label: 'Food Orders', icon: '🍽️' },
        { id: 'vehicles', label: 'Vehicles', icon: '🚗' }
    ];

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Manage Bookings</h1>
                <p className="text-slate-500 mt-1">View and manage all guest bookings and orders.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="border-b border-slate-200 px-6">
                    <div className="flex gap-4 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-4 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                                    ? 'text-gold-600 border-b-2 border-gold-600'
                                    : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
                                    }`}
                            >
                                <span className="text-lg">{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {/* All Bookings */}
                    {activeTab === 'all' && (
                        <div className="space-y-6">
                            {bookings.rooms.map((booking, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">Room: {booking.room_type}</span>
                                            <span className="text-xs text-slate-500">({booking.guest_name})</span>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.rb_status)}`}>
                                        {booking.rb_status}
                                    </span>
                                </div>
                            ))}
                            {bookings.activities.map((booking, idx) => (
                                <div key={'act' + idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">Activity: {booking.activity_name}</span>
                                            <span className="text-xs text-slate-500">({booking.guest_name})</span>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {formatDate(booking.booking_date)}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.ab_status)}`}>
                                        {booking.ab_status}
                                    </span>
                                </div>
                            ))}
                            {bookings.foodOrders.map((order, idx) => (
                                <div key={'food' + idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">Order: {order.item_name} (x{order.order_quantity})</span>
                                            <span className="text-xs text-slate-500">({order.guest_name})</span>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {formatDate(order.order_date)}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.item_status)}`}>
                                        {order.item_status}
                                    </span>
                                </div>
                            ))}
                            {bookings.vehicles.map((vb, idx) => (
                                <div key={'veh' + idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">Vehicle: {vb.vehicle_type}</span>
                                            <span className="text-xs text-slate-500">({vb.guest_name})</span>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {formatDate(vb.vb_date)}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vb.vb_status)}`}>
                                        {vb.vb_status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Rooms Tab */}
                    {activeTab === 'rooms' && (
                        <div className="space-y-4">
                            {bookings.rooms.map((booking, idx) => (
                                <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{booking.room_type}</h4>
                                            <p className="text-sm text-slate-500">Guest: {booking.guest_name} ({booking.guest_phone})</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.rb_status)}`}>
                                            {booking.rb_status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                        <div><span className="text-slate-500">Check-in:</span> {formatDate(booking.check_in_date)}</div>
                                        <div><span className="text-slate-500">Check-out:</span> {formatDate(booking.check_out_date)}</div>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        {booking.rb_status === 'Booked' && (
                                            <button onClick={() => handleStatusUpdate('room', booking.rb_id, 'Checked-in')} className="px-3 py-1 bg-gold-600 text-white text-xs rounded hover:bg-gold-700">Check-In</button>
                                        )}
                                        {booking.rb_status === 'Checked-in' && (
                                            <button onClick={() => handleStatusUpdate('room', booking.rb_id, 'Checked-out')} className="px-3 py-1 bg-slate-600 text-white text-xs rounded hover:bg-slate-700">Check-Out</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Activities Tab */}
                    {activeTab === 'activities' && (
                        <div className="space-y-4">
                            {bookings.activities.map((booking, idx) => (
                                <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{booking.activity_name}</h4>
                                            <p className="text-sm text-slate-500">Guest: {booking.guest_name} ({booking.guest_phone})</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.ab_status)}`}>
                                            {booking.ab_status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500 mt-2">Date: {formatDate(booking.booking_date)}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Food Tab */}
                    {activeTab === 'food' && (
                        <div className="space-y-4">
                            {bookings.foodOrders.map((order, idx) => (
                                <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{order.item_name} (x{order.order_quantity})</h4>
                                            <p className="text-sm text-slate-500">Guest: {order.guest_name}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.item_status)}`}>
                                            {order.item_status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500 mt-2">Total: Rs. {order.order_total_amount}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Vehicles Tab */}
                    {activeTab === 'vehicles' && (
                        <div className="space-y-4">
                            {bookings.vehicles.map((vb, idx) => (
                                <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{vb.vehicle_type}</h4>
                                            <p className="text-sm text-slate-500">Guest: {vb.guest_name}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vb.vb_status)}`}>
                                            {vb.vb_status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500 mt-2">
                                        Date: {formatDate(vb.vb_date)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceptionistBookings;
