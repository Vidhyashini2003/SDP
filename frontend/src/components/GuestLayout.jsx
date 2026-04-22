import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from '../config/axios';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const GuestLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [profileData, setProfileData] = useState({ first_name: '', last_name: '' });

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
        { icon: '🏨', label: 'Book Room', path: '/guest/rooms' },
        { icon: '📝', label: 'Special Requests', path: '/guest/special-requests' },
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
            <nav className="bg-slate-900 border-b border-white/10 fixed w-full top-0 z-50 h-[64px] flex items-center justify-center shadow-md">
                <h1 className="text-3xl font-extrabold tracking-widest uppercase text-[#D4AF37] font-serif drop-shadow-sm">
                    Janas Blue Water Corner
                </h1>
            </nav>

            {/* Sidebar and Main Content */}
            <div className="flex pt-[64px]">
                {/* Left Sidebar - Fixed */}
                <div className="fixed left-0 top-[64px] bottom-0 w-64 bg-gradient-to-b from-[#EED581] via-[#D4AF37] to-[#B69528] border-r border-[#9C7F1F] flex flex-col overflow-y-auto shadow-2xl z-20">
                    {/* Portal Header & User Info */}
                    <div className="p-6 text-slate-900 border-b border-black/10 bg-black/20">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-900 text-[#D4AF37] flex items-center justify-center font-serif font-bold text-xl border-2 border-white/30 shadow-lg shrink-0">
                                {(profileData.first_name || user?.name || 'G').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest mb-1 font-serif opacity-90">
                                    Guest Portal
                                </p>
                                <p className="font-serif font-bold text-lg truncate leading-tight text-slate-900 drop-shadow-sm" title={profileData.first_name ? `${profileData.first_name} ${profileData.last_name}` : user?.name}>
                                    {profileData.first_name ? `${profileData.first_name} ${profileData.last_name}` : user?.name || 'Guest'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        {menuItems.map((item, idx) => (
                            <Link
                                key={idx}
                                to={item.path}
                                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${isActive(item.path)
                                    ? 'bg-white text-[#8C701B] shadow-[0_4px_12px_rgba(0,0,0,0.1)] translate-x-1 font-bold'
                                    : 'text-slate-900 hover:bg-white/20 hover:translate-x-1 hover:shadow-sm'
                                    }`}
                            >
                                <span className={`text-lg transition-colors ${isActive(item.path) ? '' : 'group-hover:text-slate-900'}`}>{item.icon}</span>
                                <span className="tracking-wide">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-black/10 bg-black/20 space-y-2">
                        {bottomItems.map((item, idx) => (
                            <Link
                                key={idx}
                                to={item.path}
                                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${isActive(item.path)
                                    ? 'bg-slate-900 text-[#D4AF37] shadow-lg'
                                    : 'text-slate-900 hover:bg-slate-900/10'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                                <span className="tracking-wide">{item.label}</span>
                            </Link>
                        ))}

                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform active:scale-95 text-center tracking-wide mt-4"
                        >
                            Logout
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
