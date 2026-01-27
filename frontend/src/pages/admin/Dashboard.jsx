import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../config/axios';
import Card from '../../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    UsersIcon,
    ClipboardDocumentCheckIcon,
    BanknotesIcon,
    TruckIcon
} from '@heroicons/react/24/outline'; // v2 imports

const AdminDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/admin/dashboard');
                if (res.data && res.data.success) {
                    setData(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen text-slate-500">
                <div className="animate-pulse">Loading dashboard...</div>
            </div>
        );
    }

    // Default values if data is missing (safety check)
    const stats = data?.summary || { guests: 0, bookings: 0, active_vehicles: 0, staff: 0 };
    const financials = data?.revenue || { total: 0, breakdown: [] };

    // Prepare chart data
    const chartData = financials.breakdown.map(item => ({
        name: item.type,
        revenue: item.amount
    }));

    return (
        <div className="p-8 fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Welcome back, <span className="text-gold-600">{user?.name}</span>
                </h1>
                <p className="text-slate-500 mt-1">{getGreeting()} - Here is your daily overview</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                {/* 1. Total Guests */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Guests</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats.guests}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <UsersIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* 2. Total Bookings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats.bookings}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <ClipboardDocumentCheckIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* 3. Total Revenue */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                            <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">
                                Rs. {financials.total.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <BanknotesIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* 4. Active Vehicles */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Vehicles</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats.active_vehicles}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <TruckIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts & Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Revenue Chart (Takes up 2 columns) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Distribution</h3>
                    <div className="h-80 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                No revenue data recorded yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Specific Breakdown List (Takes up 1 column) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Details by Category</h3>
                    <div className="space-y-4">
                        {financials.breakdown.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-10 rounded-full ${item.type === 'Room Booking' ? 'bg-blue-500' :
                                            item.type === 'Dining' ? 'bg-emerald-500' :
                                                item.type === 'Activity' ? 'bg-purple-500' : 'bg-orange-500'
                                        }`}></div>
                                    <div>
                                        <p className="font-semibold text-slate-700">{item.type}</p>
                                        <p className="text-xs text-slate-400">{item.count} Transactions</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900 text-sm">Rs. {item.amount.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}

                        {financials.breakdown.length === 0 && (
                            <p className="text-center text-slate-400 py-4 text-sm">No transaction details available.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
