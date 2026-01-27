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
                                <div key={'room' + idx} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg text-slate-900 border-l-4 border-blue-500 pl-3">{booking.room_type}</h4>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(booking.rb_status)}`}>
                                                    {booking.rb_status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600 space-y-1 pl-4">
                                                <p><span className="font-medium">Guest:</span> {booking.guest_name}</p>
                                                <p><span className="font-medium">Dates:</span> {formatDate(booking.rb_checkin)} - {formatDate(booking.rb_checkout)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">ID:  <span className="font-mono">#{booking.rb_id}</span></p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {bookings.activities.map((booking, idx) => (
                                <div key={'act' + idx} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg text-slate-900 border-l-4 border-purple-500 pl-3">{booking.activity_name}</h4>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(booking.ab_status)}`}>
                                                    {booking.ab_status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600 space-y-1 pl-4">
                                                <p><span className="font-medium">Guest:</span> {booking.guest_name}</p>
                                                <p><span className="font-medium">Schedule:</span> {formatDate(booking.ab_start_time)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">ID: <span className="font-mono">#{booking.ab_id}</span></p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {bookings.foodOrders.map((order, idx) => (
                                <div key={'food' + idx} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg text-slate-900 border-l-4 border-emerald-500 pl-3">
                                                    {order.item_details || `Order #${order.order_id}`}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                                                    {order.order_status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600 space-y-1 pl-4">
                                                <p><span className="font-medium">Guest:</span> {order.guest_name}</p>
                                                <p><span className="font-medium">Date:</span> {new Date(order.order_date).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">ID: <span className="font-mono">#{order.order_id}</span></p>
                                            <p className="text-sm font-bold text-slate-900 mt-1">Rs. {order.order_total_amount || '0.00'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {bookings.vehicles.map((vb, idx) => (
                                <div key={'veh' + idx} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg text-slate-900 border-l-4 border-orange-500 pl-3">{vb.vehicle_type}</h4>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(vb.vb_status)}`}>
                                                    {vb.vb_status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600 space-y-1 pl-4">
                                                <p><span className="font-medium">Guest:</span> {vb.guest_name}</p>
                                                <p><span className="font-medium">Journey Date:</span> {formatDate(vb.vb_date)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">ID: <span className="font-mono">#{vb.vb_id}</span></p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Rooms Tab */}
                    {activeTab === 'rooms' && (
                        <div className="space-y-4">
                            {bookings.rooms.map((booking, idx) => (
                                <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg text-slate-900">{booking.room_type}</h4>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(booking.rb_status)}`}>
                                                    {booking.rb_status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600 space-y-1">
                                                <p><span className="font-medium">Guest:</span> {booking.guest_name}</p>
                                                <p><span className="font-medium">Phone:</span> {booking.guest_phone}</p>
                                                <p><span className="font-medium">From:</span> {booking.nationality}, {booking.guest_address}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">Booking ID: <span className="font-mono">#{booking.rb_id}</span></p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Booked on: {new Date(booking.rb_date || booking.created_at || Date.now()).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-t border-slate-100 bg-slate-50 rounded-lg px-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Dates</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {formatDate(booking.rb_checkin)} — {formatDate(booking.rb_checkout)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Financials</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                Total: Rs. {booking.rb_total_amount}
                                                <span className="ml-2 text-xs font-normal text-slate-500">(Payment ID: {booking.rb_payment_id || 'Pending'})</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-3 justify-end">
                                        {booking.rb_status === 'Booked' && (
                                            <button onClick={() => handleStatusUpdate('room', booking.rb_id, 'Checked-in')} className="px-4 py-2 bg-gold-600 text-white text-sm font-medium rounded-lg hover:bg-gold-700 transition-colors shadow-sm">
                                                Check-In Guest
                                            </button>
                                        )}
                                        {booking.rb_status === 'Checked-in' && (
                                            <button onClick={() => handleStatusUpdate('room', booking.rb_id, 'Checked-out')} className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
                                                Check-Out Guest
                                            </button>
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
                                <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg text-slate-900">{booking.activity_name}</h4>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(booking.ab_status)}`}>
                                                    {booking.ab_status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600 space-y-1">
                                                <p><span className="font-medium">Guest:</span> {booking.guest_name}</p>
                                                <p><span className="font-medium">Phone:</span> {booking.guest_phone}</p>
                                                <p><span className="font-medium">From:</span> {booking.nationality}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">Booking ID: <span className="font-mono">#{booking.ab_id}</span></p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-t border-slate-100 bg-slate-50 rounded-lg px-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Schedule</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {formatDate(booking.ab_start_time)}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">Price/Hr: Rs. {booking.activity_price_per_hour}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Financials</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                Total: Rs. {booking.ab_total_amount}
                                                <span className="ml-2 text-xs font-normal text-slate-500">(Payment ID: {booking.ab_payment_id || 'Pending'})</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Food Tab */}
                    {activeTab === 'food' && (
                        <div className="space-y-4">
                            {bookings.foodOrders.map((order, idx) => (
                                <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg text-slate-900">
                                                    {order.item_details || `Order #${order.order_id}`}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                                                    {order.order_status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600 space-y-1">
                                                <p><span className="font-medium">Dining Option:</span> {order.dining_option}</p>
                                                <p><span className="font-medium">Guest:</span> {order.guest_name} ({order.guest_phone})</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500 font-mono">{new Date(order.order_date).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="py-3 border-t border-slate-100 bg-slate-50 rounded-lg px-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Payment</p>
                                                <p className="text-sm font-medium text-slate-900">
                                                    Payment ID: {order.payment_id || 'Pending'}
                                                </p>
                                            </div>
                                            <p className="text-lg font-bold text-gold-600">
                                                Total: Rs. {order.order_total_amount || '0.00'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Vehicles Tab */}
                    {activeTab === 'vehicles' && (
                        <div className="space-y-4">
                            {bookings.vehicles.map((vb, idx) => (
                                <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg text-slate-900">{vb.vehicle_type}</h4>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(vb.vb_status)}`}>
                                                    {vb.vb_status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600 space-y-1">
                                                <p><span className="font-medium">Guest:</span> {vb.guest_name}</p>
                                                <p><span className="font-medium">Phone:</span> {vb.guest_phone}</p>
                                                <p><span className="font-medium">From:</span> {vb.nationality}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">Booking ID: <span className="font-mono">#{vb.vb_id}</span></p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-t border-slate-100 bg-slate-50 rounded-lg px-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Journey Date</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {formatDate(vb.vb_date)}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">Duration: {vb.vb_days} Days</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Financials</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                Payment ID: {vb.vb_payment_id || 'Pending'}
                                            </p>
                                        </div>
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
