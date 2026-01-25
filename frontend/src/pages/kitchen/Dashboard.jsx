import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate } from 'react-router-dom';

const KitchenDashboard = () => {
    const [stats, setStats] = useState({
        pending: 0,
        cooking: 0,
        completedToday: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/kitchen/orders');
            const orders = res.data;

            const pending = orders.filter(o => o.order_status === 'Pending').length;
            const cooking = orders.filter(o => o.order_status === 'Preparing').length;

            // Filter completed today
            const today = new Date().toDateString();
            const completedToday = orders.filter(o =>
                (o.order_status === 'Delivered') &&
                new Date(o.order_date).toDateString() === today
            ).length;

            setStats({ pending, cooking, completedToday });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Kitchen <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Overview</span>
                </h1>
                <p className="text-slate-500 mt-2">Live status of kitchen operations.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Pending Orders */}
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending Orders</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stats.pending}</h3>
                        </div>
                        <div className="p-3 bg-red-50 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>

                {/* Cooking Now */}
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Cooking Now</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stats.cooking}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>

                {/* Served Today */}
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Served Today</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stats.completedToday}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                        onClick={() => navigate('/kitchen/orders')}
                        className="px-6 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-orange-50 transition-colors shadow-lg"
                    >
                        Go to Orders
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KitchenDashboard;
