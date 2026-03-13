import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';
import { 
    BuildingOfficeIcon, 
    CakeIcon, 
    TicketIcon, 
    TruckIcon,
    ClipboardDocumentListIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

const GuestDashboard = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState({
        rooms: [],
        activities: [],
        foodOrders: [],
        vehicles: []
    });
    const [activeBooking, setActiveBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                await Promise.all([
                    fetchAllBookings(),
                    fetchActiveBooking()
                ]);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    const fetchActiveBooking = async () => {
        try {
            const res = await axios.get('/api/guest/bookings/active');
            if (res.data?.hasActiveBooking) {
                setActiveBooking(res.data.bookings[0]);
            }
        } catch (error) {
            console.error('Error fetching active booking:', error);
        }
    };

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
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (['active', 'checked-in', 'confirmed', 'success', 'booked', 'delivered'].includes(s)) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (['pending', 'ordered', 'pending payment'].includes(s)) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        if (['cancelled', 'failed'].includes(s)) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getTotalCount = () => {
        return bookings.rooms.length + bookings.activities.length +
            bookings.foodOrders.length + bookings.vehicles.length;
    };

    const getRecentActivity = () => {
        const combined = [
            ...bookings.rooms.map(r => ({ id: r.rb_id, type: 'Room', date: r.check_in_date, title: r.room_type, status: r.rb_status })),
            ...bookings.activities.map(a => ({ id: a.ab_id, type: 'Activity', date: a.booking_date, title: a.activity_name, status: a.ab_status })),
            ...bookings.foodOrders.map(f => ({ id: f.order_id, type: 'Dining', date: f.order_date, title: `${f.items?.length || 0} Items`, status: f.order_status })),
            ...bookings.vehicles.map(v => ({ id: v.vb_id, type: 'Transport', date: v.booking_date, title: v.vehicle_type, status: v.vb_status }))
        ];
        return combined.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-gold-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const recentItems = getRecentActivity();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header - Fixed Clipping */}
            <div className="pb-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Guest <span className="bg-gradient-to-r from-gold-500 to-yellow-600 bg-clip-text text-transparent px-1">Dashboard</span>
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Welcome back! Here's an overview of your activity.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total', value: getTotalCount(), icon: ClipboardDocumentListIcon, color: 'slate' },
                    { label: 'Rooms', value: bookings.rooms.length, icon: BuildingOfficeIcon, color: 'gold' },
                    { label: 'Activities', value: bookings.activities.length, icon: TicketIcon, color: 'purple' },
                    { label: 'Orders', value: bookings.foodOrders.length, icon: CakeIcon, color: 'green' },
                    { label: 'Vehicles', value: bookings.vehicles.length, icon: TruckIcon, color: 'orange' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-slate-50 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 leading-none">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Hero CTA - Left side */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden h-full flex flex-col justify-center min-h-[400px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                        
                        <div className="relative z-10 space-y-6">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                                <SparklesIcon className="w-4 h-4 text-gold-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-400">Exclusive Travel</span>
                            </div>
                            
                            <h2 className="text-4xl font-black leading-tight">Ready for your next adventure?</h2>
                            <p className="text-slate-400 font-medium">Explore our premium rooms and book your stay at Janas Blue Water Corner today.</p>
                            
                            <button 
                                onClick={() => navigate('/guest/rooms')}
                                className="inline-flex items-center gap-3 bg-gold-500 hover:bg-gold-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-gold-600/20 active:scale-95 group"
                            >
                                <BuildingOfficeIcon className="w-5 h-5" />
                                Book a Room
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Activity - Right side */}
                <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm h-full">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Recent Activity</h3>
                        <button 
                            onClick={() => navigate('/guest/my-bookings')}
                            className="text-[10px] font-black text-gold-600 uppercase tracking-widest hover:text-gold-700 underline underline-offset-4"
                        >
                            View All Bookings
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-50">
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentItems.length > 0 ? recentItems.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4">
                                            <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider">{item.type}</span>
                                        </td>
                                        <td className="py-4">
                                            <p className="text-sm font-bold text-slate-600">{item.title}</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="text-xs font-medium text-slate-500">{formatDate(item.date)}</p>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase tracking-widest ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center">
                                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No activity found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {activeBooking && (
                        <div className="mt-8 pt-6 border-t border-slate-50">
                            <div className="flex items-center gap-3 bg-emerald-50/50 px-4 py-3 rounded-2xl border border-emerald-50 transition-all hover:border-emerald-100">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Stay Detected</p>
                                    <p className="text-xs font-bold text-slate-900">
                                        You are currently staying in Room {activeBooking.room_number || activeBooking.room_type}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => navigate('/guest/my-bookings')}
                                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/10"
                                >
                                    Manage
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestDashboard;
