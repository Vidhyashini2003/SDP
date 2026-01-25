import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from '../config/axios';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

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

    const bottomItems = [
        { icon: UserIcon, label: 'My Profile', path: '/guest/profile' },
        { icon: LockClosedIcon, label: 'Change Password', path: '/guest/change-password' }
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Header Bar - Fixed & Clean */}
            <nav className="bg-white border-b border-slate-200 fixed w-full top-0 z-50 h-[64px] flex items-center justify-center">
                <h1 className="text-3xl font-extrabold tracking-tight uppercase bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
                    Janas Blue Water Corner
                </h1>
            </nav>

            {/* Sidebar and Main Content */}
            <div className="flex pt-[64px]">
                {/* Left Sidebar - Fixed */}
                <div className="fixed left-0 top-[64px] bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
                    {/* Portal Header & User Info */}
                    <div className="p-6 bg-slate-900 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-lg border-2 border-slate-600 shrink-0">
                                {(profileData.guest_name || user?.name || 'G').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                                    Guest Portal
                                </p>
                                <p className="text-xs text-slate-300 font-medium leading-none mb-0.5">Welcome,</p>
                                <p className="font-bold text-lg truncate leading-tight text-white" title={profileData.guest_name || user?.name}>
                                    {profileData.guest_name || user?.name || 'Guest'}
                                </p>
                            </div>
                        </div>
                    </div>

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

                    <div className="p-4 border-t border-slate-200 space-y-1">
                        {bottomItems.map((item, idx) => (
                            <Link
                                key={idx}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive(item.path)
                                    ? 'bg-blue-500 text-white'
                                    : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        ))}

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors mt-2"
                        >
                            <span className="text-lg">🚪</span>
                            <span className="font-medium text-sm">Logout</span>
                        </button>
                    </div>
                </div>

                {/* Main Content - Pushed Right */}
                <div className="flex-1 ml-64 p-4 min-h-[calc(100vh-64px)]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default GuestLayout;
