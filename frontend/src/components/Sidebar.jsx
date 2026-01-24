import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ items }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-64px)] overflow-y-auto hidden md:block fixed left-0 top-16 flex flex-col">
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

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-200">
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
