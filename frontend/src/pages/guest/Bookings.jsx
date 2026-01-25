import { useState, useEffect } from 'react';
import axios from '../../config/axios'; // Use configured axios
import { toast } from 'react-hot-toast';

const GuestBookings = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [bookings, setBookings] = useState({
        rooms: [],
        activities: [],
        foodOrders: [],
        vehicles: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllBookings();
    }, []);

    const fetchAllBookings = async () => {
        try {
            const [bookingsRes, actRes, ordersRes, vehiclesRes] = await Promise.all([
                axios.get('/api/guest/bookings'),
                axios.get('/api/guest/activities'),
                axios.get('/api/guest/orders'),
                axios.get('/api/guest/vehicles')
            ]);

            setBookings({
                rooms: bookingsRes.data?.rooms || [],
                activities: actRes.data || [],
                foodOrders: ordersRes.data || [],
                vehicles: vehiclesRes.data || []
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking? Cancellation is only allowed 24 hours before check-in.')) {
            return;
        }

        try {
            await axios.post(`/api/guest/bookings/rooms/${bookingId}/cancel`);
            toast.success('Booking cancelled successfully');
            fetchAllBookings(); // Refresh list
        } catch (error) {
            console.error('Cancellation error:', error);
            toast.error(error.response?.data?.error || 'Failed to cancel booking');
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'checked-in': 'bg-blue-500',
            'confirmed': 'bg-green-500',
            'pending': 'bg-yellow-500',
            'active': 'bg-blue-500',
            'booked': 'bg-green-500',
            'delivered': 'bg-green-500',
            'ordered': 'bg-yellow-500',
            'cancelled': 'bg-red-500',
            'completed': 'bg-slate-500'
        };
        return `${statusColors[status?.toLowerCase()] || 'bg-slate-500'} text-white`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const tabs = [
        { id: 'all', label: 'All Bookings', icon: '📋' },
        { id: 'rooms', label: 'Rooms', icon: '🏨' },
        { id: 'activities', label: 'Activities', icon: '🎯' },
        { id: 'food', label: 'Food Orders', icon: '🍽️' },
        { id: 'vehicles', label: 'Vehicles', icon: '🚗' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-600">Loading bookings...</div>
            </div>
        );
    }

    return (
        <div className="p-6 overflow-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">My <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Bookings</span></h1>
                <p className="text-slate-500 mt-1">View and manage all your bookings in one place</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="border-b border-slate-200 px-6">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {/* All Bookings Tab */}
                    {activeTab === 'all' && (
                        <div className="space-y-6">
                            {/* Room Bookings */}
                            {bookings.rooms.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-3">🏨 Room Bookings</h3>
                                    <div className="space-y-2">
                                        {bookings.rooms.map((booking, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-slate-900">{booking.room_type}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.rb_status)}`}>
                                                    {booking.rb_status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Food Orders */}
                            {bookings.foodOrders.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-3">🍽️ Food Orders</h3>
                                    <div className="space-y-2">
                                        {bookings.foodOrders.map((order, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-slate-900">{order.item_name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        Qty: {order.order_quantity} • Rs. {order.order_total_amount}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.item_status || order.order_status)}`}>
                                                    {order.item_status || order.order_status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Vehicles */}
                            {bookings.vehicles.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-3">🚗 Vehicle Bookings</h3>
                                    <div className="space-y-2">
                                        {bookings.vehicles.map((vehicle, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-slate-900">{vehicle.vehicle_type}</p>
                                                    <p className="text-sm text-slate-500">{vehicle.vehicle_number}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vehicle.vb_status)}`}>
                                                    {vehicle.vb_status || 'Active'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Activities */}
                            {bookings.activities.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-3">🎯 Activities</h3>
                                    <div className="space-y-2">
                                        {bookings.activities.map((activity, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-slate-900">{activity.activity_name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {formatDate(activity.booking_date)}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.ab_status)}`}>
                                                    {activity.ab_status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {bookings.rooms.length === 0 && bookings.activities.length === 0 && bookings.foodOrders.length === 0 && bookings.vehicles.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📋</div>
                                    <p className="text-slate-500">No bookings yet</p>
                                    <p className="text-sm text-slate-400 mt-1">Start booking rooms, activities, or order food!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Room Bookings Tab */}
                    {activeTab === 'rooms' && (
                        <div className="space-y-3">
                            {bookings.rooms.length > 0 ? (
                                bookings.rooms.map((booking, idx) => (
                                    <div key={idx} className="p-5 border border-slate-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-lg">{booking.room_type}</h4>
                                                <p className="text-sm text-slate-500">Booking ID: {booking.rb_id}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.rb_status)}`}>
                                                {booking.rb_status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-500">Check-in</p>
                                                <p className="font-medium text-slate-900">{formatDate(booking.check_in_date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Check-out</p>
                                                <p className="font-medium text-slate-900">{formatDate(booking.check_out_date)}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">Rs. {booking.total_price || 'N/A'}</p>
                                            </div>
                                            {(booking.rb_status === 'Pending' || booking.rb_status === 'Confirmed' || booking.rb_status === 'Booked') && (
                                                <div className="col-span-2 mt-2">
                                                    <button
                                                        onClick={() => handleCancel(booking.rb_id)}
                                                        className="w-full text-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                                                    >
                                                        Cancel Booking
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">No room bookings</div>
                            )}
                        </div>
                    )}

                    {/* Activities Tab */}
                    {activeTab === 'activities' && (
                        <div className="space-y-3">
                            {bookings.activities.length > 0 ? (
                                bookings.activities.map((activity, idx) => (
                                    <div key={idx} className="p-5 border border-slate-200 rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-lg">{activity.activity_name}</h4>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Date: {formatDate(activity.booking_date)}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    Duration: {activity.duration_hours} hours
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.ab_status)}`}>
                                                {activity.ab_status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">No activity bookings</div>
                            )}
                        </div>
                    )}

                    {/* Food Orders Tab */}
                    {activeTab === 'food' && (
                        <div className="space-y-3">
                            {bookings.foodOrders.length > 0 ? (
                                bookings.foodOrders.map((order, idx) => (
                                    <div key={idx} className="p-5 border border-slate-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-lg">{order.item_name}</h4>
                                                <p className="text-sm text-slate-500">Order #{order.order_item_id}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.item_status || order.order_status)}`}>
                                                {order.item_status || order.order_status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-500">Quantity</p>
                                                <p className="font-medium text-slate-900">{order.order_quantity}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Total</p>
                                                <p className="font-medium text-slate-900">Rs. {order.order_total_amount}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">No food orders</div>
                            )}
                        </div>
                    )}

                    {/* Vehicles Tab */}
                    {activeTab === 'vehicles' && (
                        <div className="space-y-3">
                            {bookings.vehicles.length > 0 ? (
                                bookings.vehicles.map((vehicle, idx) => (
                                    <div key={idx} className="p-5 border border-slate-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-lg">{vehicle.vehicle_type}</h4>
                                                <p className="text-sm text-slate-500">{vehicle.vehicle_number}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vehicle.vb_status)}`}>
                                                {vehicle.vb_status || 'Active'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-500">Pickup</p>
                                                <p className="font-medium text-slate-900">{vehicle.vb_pickup_point || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Drop-off</p>
                                                <p className="font-medium text-slate-900">{vehicle.vb_drop_point || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">No vehicle bookings</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestBookings;
