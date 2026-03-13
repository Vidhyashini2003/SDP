import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ClockIcon, FireIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const ChefDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        pendingOrders: 0,
        activeCooking: 0,
        totalToday: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/chef/orders');
            const orders = response.data;

            const pending = orders.filter(o => o.order_status === 'Pending').length;
            const cooking = orders.filter(o => o.order_status === 'Preparing').length;
            const today = new Date().toDateString();
            const completedToday = orders.filter(o =>
                (o.order_status === 'Delivered') &&
                new Date(o.order_date).toDateString() === today
            ).length;

            setStats({
                pendingOrders: pending,
                activeCooking: cooking,
                totalToday: completedToday
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500 font-medium italic animate-pulse">Loading culinary dashboard...</div>;

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Chef <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Overview</span>
                </h1>
                <p className="text-slate-500 mt-2">Live status of culinary operations.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Pending Orders */}
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending Orders</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stats.pendingOrders}</h3>
                        </div>
                        <div className="p-3 bg-red-50 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                            <ClockIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>

                {/* Cooking Now */}
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Cooking Now</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stats.activeCooking}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                            <FireIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>

                {/* Served Today */}
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Served Today</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stats.totalToday}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                            <ClipboardDocumentListIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Orders need attention!</h2>
                        <p className="text-orange-100">
                            Check the incoming orders panel to start preparing meals for guests.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/chef/orders')}
                        className="px-6 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-orange-50 transition-colors shadow-lg"
                    >
                        Go to Orders
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChefDashboard;
