import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../config/axios';
import Card from '../../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    UsersIcon,
    ClipboardDocumentCheckIcon,
    BanknotesIcon,
    TruckIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Initial State - Pure Structure, No Values
    const [dashboardData, setDashboardData] = useState({
        counts: {
            guests: 0,
            staff: 0,
            rooms: 0,
            activeVehicles: 0,
            bookings: 0
        },
        financials: {
            totalRevenue: 0,
            revenueByType: []
        }
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await axios.get('/api/admin/dashboard');
                if (res.data && res.data.success) {
                    setDashboardData(res.data);
                }
            } catch (err) {
                console.error('Dashboard Load Error:', err);
                // In production, you might show a toast here
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // --- Data Processing for UI ---

    // 1. Chart Data Mapping
    const chartData = (dashboardData.financials.revenueByType || []).map(item => ({
        name: item.booking_type, // 'Room', 'Food', 'Activity', 'Vehicle'
        revenue: parseFloat(item.total)
    }));

    // 2. Summary List Mapping
    const summaryList = (dashboardData.financials.revenueByType || []).map(item => ({
        type: item.booking_type,
        count: item.count,
        revenue: parseFloat(item.total)
    }));

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
    }

    return (
        <div className="p-8 fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Welcome, <span className="text-blue-600">{user?.name}</span>
                </h1>
                <p className="text-slate-600 mt-1">{getGreeting()} - Overview</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

                {/* Total Guests */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Total Guests</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{dashboardData.counts.guests}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <UsersIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Total Bookings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Total Bookings</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{dashboardData.counts.bookings}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <ClipboardDocumentCheckIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Revenue</p>
                            <h3 className="text-3xl font-bold text-emerald-600 mt-2">
                                Rs. {dashboardData.financials.totalRevenue.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <BanknotesIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Active Vehicles */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Active Vehicles</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{dashboardData.counts.activeVehicles}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <TruckIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts & Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Revenue Chart */}
                <Card>
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Distribution</h3>
                    <div className="h-64">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                No revenue data available
                            </div>
                        )}
                    </div>
                </Card>

                {/* Breakdown List */}
                <Card>
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Performance Summary</h3>
                    <div className="space-y-4">
                        {summaryList.length > 0 ? (
                            summaryList.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-10 bg-blue-500 rounded-l-md"></div>
                                        <div>
                                            <p className="font-semibold text-slate-700">{item.type}</p>
                                            <p className="text-xs text-slate-500">{item.count} Transactions</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-900">
                                        Rs. {item.revenue.toLocaleString()}
                                    </span>
                                    heroicons</div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                No transactions recorded yet.
                            </div>
                        )}
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default AdminDashboard;
