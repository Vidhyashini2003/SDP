import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../config/axios';
import Card from '../../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalRooms: 0, totalStaff: 0, totalRevenue: 0 });
    const [revenueData, setRevenueData] = useState([]);
    const [bookingSummary, setBookingSummary] = useState([
        { type: 'Rooms', count: 128, revenue: 'Rs. 21619' },
        { type: 'Food & Beverage', count: 98, revenue: 'Rs. 8204' },
        { type: 'Activities', count: 74, revenue: 'Rs. 6226' },
        { type: 'Transport', count: 45, revenue: 'Rs. 3608' }
    ]);

    useEffect(() => {
        axios.get('/api/admin/dashboard')
            .then(res => setStats(res.data))
            .catch(err => console.error(err));

        // Mock chart data - monthly revenue breakdown
        setRevenueData([
            { name: 'Rooms', revenue: 135000 },
            { name: 'Food', revenue: 95000 },
            { name: 'Activities', revenue: 65000 },
            { name: 'Transport', revenue: 42000 },
        ]);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="p-8">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Welcome, {user?.name || 'Manager'}
                </h1>
                <p className="text-slate-600 mt-1">{getGreeting()}! Manage your hotel operations</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white">
                    <p className="text-slate-500 text-sm mb-1">Total Guests</p>
                    <p className="text-3xl font-bold text-slate-900">128</p>
                    <p className="text-xs text-slate-400 mt-1">All time</p>
                </Card>
                <Card className="bg-white">
                    <p className="text-slate-500 text-sm mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold text-slate-900">58</p>
                    <p className="text-xs text-slate-400 mt-1">This month</p>
                </Card>
                <Card className="bg-white">
                    <p className="text-slate-500 text-sm mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-primary-600">Rs. {stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">This month</p>
                </Card>
                <Card className="bg-white">
                    <p className="text-slate-500 text-sm mb-1">Active Vehicles</p>
                    <p className="text-3xl font-bold text-slate-900">5</p>
                    <p className="text-xs text-slate-400 mt-1">N and general</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue by Service Type Chart */}
                <Card>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue by Service Type</h3>
                    <p className="text-sm text-slate-500 mb-4">Monthly revenue breakdown</p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="revenue" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Booking/Revenue Summary */}
                <Card>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Summary</h3>
                    <p className="text-sm text-slate-500 mb-6">By category</p>
                    <div className="space-y-4">
                        {bookingSummary.map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                <div>
                                    <p className="font-semibold text-slate-900">{item.type}</p>
                                    <p className="text-xs text-slate-500">{item.count} bookings</p>
                                </div>
                                <div className="px-4 py-2 bg-primary-50 text-primary-700 font-semibold rounded-lg text-sm">
                                    {item.revenue}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Quick Actions */}
                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => navigate('/admin/staff')}
                            className="p-6 bg-slate-50 hover:bg-slate-100 rounded-xl text-center border border-slate-200 transition-all hover:shadow-md"
                        >
                            <span className="block text-4xl mb-3">👥</span>
                            <span className="font-semibold text-slate-700">Manage Staff</span>
                        </button>
                        <button className="p-6 bg-slate-50 hover:bg-slate-100 rounded-xl text-center border border-slate-200 transition-all hover:shadow-md">
                            <span className="block text-4xl mb-3">📊</span>
                            <span className="font-semibold text-slate-700">Reports</span>
                        </button>
                        <button className="p-6 bg-slate-50 hover:bg-slate-100 rounded-xl text-center border border-slate-200 transition-all hover:shadow-md">
                            <span className="block text-4xl mb-3">🍽️</span>
                            <span className="font-semibold text-slate-700">Menu</span>
                        </button>
                        <button className="p-6 bg-slate-50 hover:bg-slate-100 rounded-xl text-center border border-slate-200 transition-all hover:shadow-md">
                            <span className="block text-4xl mb-3">🏷️</span>
                            <span className="font-semibold text-slate-700">Offers</span>
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
