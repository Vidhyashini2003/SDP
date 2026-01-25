import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import { toast } from 'react-hot-toast';

const ReceptionistDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [bookings, setBookings] = useState({
        rooms: [],
        activities: [],
        foodOrders: [],
        vehicles: []
    });
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, roomsRes, actRes, ordersRes, vehiclesRes] = await Promise.all([
                    axios.get('/api/receptionist/dashboard'),
                    axios.get('/api/receptionist/bookings/rooms'),
                    axios.get('/api/receptionist/bookings/activities'),
                    axios.get('/api/receptionist/bookings/orders'),
                    axios.get('/api/receptionist/bookings/vehicles')
                ]);
                setStats(statsRes.data);
                setBookings({
                    rooms: roomsRes.data || [],
                    activities: actRes.data || [],
                    foodOrders: ordersRes.data || [],
                    vehicles: vehiclesRes.data || []
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
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
            'active': 'bg-blue-500',
            'booked': 'bg-green-500',
            'delivered': 'bg-green-500',
            'ordered': 'bg-yellow-500',
            'cancelled': 'bg-red-500',
            'completed': 'bg-slate-500',
            'rejected': 'bg-red-500'
        };
        return `${statusColors[status?.toLowerCase()] || 'bg-slate-500'} text-white`;
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
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Front Desk Dashboard</h1>
                <p className="text-slate-500 mt-1">Welcome back, {user?.name || 'Receptionist'}. Manage bookings and guest services.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white border-blue-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase">Room Bookings</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.activeRoomBookings}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white border-purple-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase">Activities</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.activeActivityBookings}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white border-orange-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase">Vehicles</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.activeVehicleBookings}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v3.283a1 1 0 00.948.682l1.905.021a2 2 0 011.947 1.83 2 2 0 01-1.83 2.146l-1.99.102A1 1 0 004 14.12V16m16.89-2.008a1 1 0 00-.916-1.127 2 2 0 01-1.974-1.895 2 2 0 011.83-2.146l1.99-.102A1 1 0 0021 7.88V6a1 1 0 00-1-1H16" /></svg>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white border-emerald-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase">Total Guests</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalGuests}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions or Recent Summary could go here */}
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Quick Access</h3>
                <div className="flex gap-4">
                    <a href="/receptionist/bookings" className="px-4 py-2 bg-white text-blue-600 rounded-lg shadow-sm font-medium hover:bg-blue-600 hover:text-white transition-colors">Manage Bookings</a>
                    <a href="/receptionist/guests" className="px-4 py-2 bg-white text-blue-600 rounded-lg shadow-sm font-medium hover:bg-blue-600 hover:text-white transition-colors">View Guests</a>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDashboard;
