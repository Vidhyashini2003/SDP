import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from '../config/axios';

const GuestLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [profileData, setProfileData] = useState({ guest_name: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/api/guest/profile');
            setProfileData(response.data || {});
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const menuItems = [
        { icon: '📊', label: 'Dashboard', path: '/guest/bookings' },
        { icon: '📋', label: 'My Bookings', path: '/guest/my-bookings' },
        { icon: '🏨', label: 'Room Booking', path: '/guest/rooms' },
        { icon: '🎯', label: 'Activity Booking', path: '/guest/activities' },
        { icon: '🍽️', label: 'Food Orders', path: '/guest/food-orders' },
        { icon: '🚗', label: 'Vehicle Hire', path: '/guest/vehicle-hire' },
        { icon: '🔔', label: 'Notifications', path: '/guest/notifications' }
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Header Bar */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">🏨</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Janas Hotel</h1>
                    <span className="text-slate-500 text-sm">Guest Portal</span>
                </div>

                <div
                    onClick={() => navigate('/guest/profile')}
                    className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
                >
                    <div>
                        <p className="text-sm font-semibold text-slate-900 text-right">
                            {profileData.guest_name || user?.name || 'Guest'}
                        </p>
                        <p className="text-xs text-slate-500 text-right">Guest</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                            {(profileData.guest_name || user?.name || 'G').charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sidebar and Main Content */}
            <div className="flex">
                {/* Left Sidebar */}
                <div className="w-64 bg-white border-r border-slate-200 flex flex-col min-h-[calc(100vh-73px)] sticky top-[73px]">
                    <nav className="flex-1 p-4">
                        {menuItems.map((item, idx) => (
                            <Link
                                key={idx}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive(item.path)
                                    ? 'bg-blue-500 text-white'
                                    : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-slate-200">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <span className="text-lg">🚪</span>
                            <span className="font-medium text-sm">Logout</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default GuestLayout;
