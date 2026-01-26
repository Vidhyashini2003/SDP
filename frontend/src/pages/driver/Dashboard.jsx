import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate } from 'react-router-dom';

const DriverDashboard = () => {
    const [stats, setStats] = useState({
        active: 0,
        completed: 0,
        upcoming: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/driver/trips');
            const trips = res.data;

            const active = trips.filter(t => t.vb_status === 'In Progress').length;
            const completed = trips.filter(t => t.vb_status === 'Completed').length;
            const upcoming = trips.filter(t => t.vb_status === 'Booked').length;

            setStats({ active, completed, upcoming });
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
                    Welcome Back, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Driver</span>
                </h1>
                <p className="text-slate-500 mt-2">Here is your trip summary for today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Upcoming Trips */}
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Upcoming Trips</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stats.upcoming}</h3>
                        </div>
                        <div className="p-3 bg-gold-50 rounded-xl text-gold-600 group-hover:bg-gold-600 group-hover:text-white transition-colors duration-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>

                {/* Active Trips */}
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Trips</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stats.active}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v3.283a1 1 0 00.948.682l1.905.021a2 2 0 011.947 1.83 2 2 0 01-1.83 2.146l-1.99.102A1 1 0 004 14.12V16m16.89-2.008a1 1 0 00-.916-1.127 2 2 0 01-1.974-1.895 2 2 0 011.83-2.146l1.99-.102A1 1 0 0021 7.88V6a1 1 0 00-1-1H16" /></svg>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>

                {/* Completed Trips */}
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Completed Trips</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stats.completed}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                </div>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Ready to start driving?</h2>
                        <p className="text-indigo-100 max-w-lg">
                            Check your assigned trips and manage your schedule directly from the trips panel.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/driver/trips')}
                        className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
                    >
                        Go to Trips
                    </button>
                </div>

                {/* Decorative background circles */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500 rounded-full opacity-50 mix-blend-multiply filter blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-indigo-700 rounded-full opacity-50 mix-blend-multiply filter blur-3xl"></div>
            </div>
        </div>
    );
};

export default DriverDashboard;
