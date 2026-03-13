import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline'; // Add icons

const Sidebar = ({ items }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth(); // Destructure user for role

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const role = user?.role || 'admin'; // Fallback to admin if undefined (shouldn't happen in protected)

    const bottomItems = [
        { name: 'My Profile', path: `/${role}/profile`, icon: UserIcon },
        { name: 'Change Password', path: `/${role}/change-password`, icon: LockClosedIcon },
    ];

    return (
        <div className="w-64 bg-gradient-to-b from-[#EED581] via-[#D4AF37] to-[#B69528] border-r border-[#9C7F1F] h-[calc(100vh-64px)] overflow-y-auto hidden md:block fixed left-0 top-16 flex flex-col shadow-2xl z-20">
            {/* Portal Header & User Info */}
            <div className="p-6 text-slate-900 border-b border-black/10 bg-black/20">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-[#D4AF37] flex items-center justify-center font-serif font-bold text-xl border-2 border-white/30 shadow-lg shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-0.5 font-sans opacity-80">
                            {user?.role === 'chef' ? 'Chef Portal' : (user?.role || 'Staff') + ' Portal'}
                        </p>
                        <p className="font-serif font-medium text-xl truncate text-slate-900" title={user?.name}>
                            {user?.name || 'User'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-2 flex-1">
                {items.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${location.pathname === item.path
                            ? 'bg-white text-[#8C701B] shadow-[0_4px_12px_rgba(0,0,0,0.1)] translate-x-1 font-bold'
                            : 'text-slate-900 hover:bg-white/20 hover:translate-x-1 hover:shadow-sm'
                            }`}
                    >
                        {item.icon && <item.icon className={`w-5 h-5 transition-colors ${location.pathname === item.path ? 'text-[#D4AF37]' : 'text-slate-800 group-hover:text-slate-900'}`} />}
                        <span className="tracking-wide">{item.name}</span>
                    </Link>
                ))}
            </div>

            {/* Bottom Section: Profile & Logout */}
            <div className="p-4 border-t border-black/10 bg-black/20 space-y-2">
                {/* Profile Links */}
                <div className="space-y-1 mb-4">
                    <Link
                        to={`/${role}/profile`}
                        className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${location.pathname === `/${role}/profile`
                            ? 'bg-slate-900 text-[#D4AF37] shadow-lg'
                            : 'text-slate-900 hover:bg-slate-900/10'
                            }`}
                    >
                        <UserIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span className="tracking-wide">My Profile</span>
                    </Link>
                    <Link
                        to={`/${role}/change-password`}
                        className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${location.pathname === `/${role}/change-password`
                            ? 'bg-slate-900 text-[#D4AF37] shadow-lg'
                            : 'text-slate-900 hover:bg-slate-900/10'
                            }`}
                    >
                        <LockClosedIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span className="tracking-wide">Change Password</span>
                    </Link>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform active:scale-95 text-center tracking-wide mt-4"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
