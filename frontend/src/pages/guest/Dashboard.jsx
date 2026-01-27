import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const GuestDashboard = () => {
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
            const [bookingsRes, ordersRes] = await Promise.all([
                axios.get('/api/guest/bookings'),
                axios.get('/api/guest/orders')
            ]);

            setBookings({
                rooms: bookingsRes.data?.rooms || [],
                activities: bookingsRes.data?.activities || [],
                foodOrders: ordersRes.data || [],
                vehicles: bookingsRes.data?.vehicles || []
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
            const token = localStorage.getItem('token');
            await axios.post(`/api/guest/bookings/rooms/${bookingId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
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

    const getTotalCount = () => {
        return bookings.rooms.length + bookings.activities.length +
            bookings.foodOrders.length + bookings.vehicles.length;
    };

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
                <h1 className="text-3xl font-bold text-slate-900">Guest <span className="bg-gradient-to-r from-gold-500 to-yellow-500 bg-clip-text text-transparent">Dashboard</span></h1>
                <p className="text-slate-500 mt-1">Welcome back! Here's an overview of your activity.</p>
            </div>

            {/* Stats Summary */}
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {/* Total Bookings */}
                <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Bookings</p>
                            <h3 className="text-2xl font-bold text-slate-900">{getTotalCount()}</h3>
                        </div>
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-slate-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>

                {/* Room Bookings */}
                <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Rooms</p>
                            <h3 className="text-2xl font-bold text-slate-900">{bookings.rooms.length}</h3>
                        </div>
                        <div className="p-2 bg-gold-50 rounded-lg text-gold-600 group-hover:bg-gold-600 group-hover:text-white transition-colors duration-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gold-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>

                {/* Activities */}
                <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Activities</p>
                            <h3 className="text-2xl font-bold text-slate-900">{bookings.activities.length}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-purple-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>

                {/* Food Orders */}
                <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Food Orders</p>
                            <h3 className="text-2xl font-bold text-slate-900">{bookings.foodOrders.length}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>

                {/* Vehicle Hire */}
                <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vehicle Hire</p>
                            <h3 className="text-2xl font-bold text-slate-900">{bookings.vehicles.length}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-orange-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>
            </div>

            {/* Dashboard Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/guest/rooms" className="flex flex-col items-center justify-center p-4 bg-gold-50 text-gold-700 rounded-xl hover:bg-gold-100 transition-colors">
                        <span className="text-2xl mb-2">🏨</span>
                        <span className="font-medium text-sm">Book a Room</span>
                    </a>
                    <a href="/guest/food-orders" className="flex flex-col items-center justify-center p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors">
                        <span className="text-2xl mb-2">🍽️</span>
                        <span className="font-medium text-sm">Order Food</span>
                    </a>
                    <a href="/guest/activities" className="flex flex-col items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors">
                        <span className="text-2xl mb-2">🎯</span>
                        <span className="font-medium text-sm">Book Activity</span>
                    </a>
                    <a href="/guest/vehicle-hire" className="flex flex-col items-center justify-center p-4 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors">
                        <span className="text-2xl mb-2">🚗</span>
                        <span className="font-medium text-sm">Hire Vehicle</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default GuestDashboard;
