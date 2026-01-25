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
        <div className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-64px)] overflow-y-auto hidden md:block fixed left-0 top-16 flex flex-col">
            {/* Portal Header & User Info */}
            <div className="p-6 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-lg border-2 border-slate-600 shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                            {user?.role === 'kitchen' ? 'Kitchen Portal' : (user?.role || 'Staff') + ' Portal'}
                        </p>
                        <p className="text-xs text-slate-300 font-medium leading-none mb-0.5">Welcome,</p>
                        <p className="font-bold text-lg truncate leading-tight text-white" title={user?.name}>
                            {user?.name || 'User'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-1 flex-1">
                {items.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${location.pathname === item.path
                            ? 'bg-primary-50 text-primary-700 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {item.icon && <item.icon className="w-5 h-5" />}
                            {item.name}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Bottom Section: Profile & Logout */}
            <div className="p-4 border-t border-slate-200 space-y-1">
                {bottomItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${location.pathname === item.path
                            ? 'bg-primary-50 text-primary-700 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </div>
                    </Link>
                ))}


                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
