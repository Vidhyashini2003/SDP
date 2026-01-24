import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass sticky top-0 z-50 px-4 py-3 flex justify-between items-center text-slate-800">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                Janas Blue Water Corner
            </Link>

            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <span className="text-sm font-medium hidden md:block">
                            Welcome, {user.name} ({user.role})
                        </span>
                        {user.role === 'guest' && (
                            <div className="flex gap-4 text-sm font-medium text-slate-600">
                                <Link to="/guest/bookings" className="hover:text-primary-600 transaction-colors">My Bookings</Link>
                                <Link to="/guest/order" className="hover:text-primary-600 transaction-colors">Order Food</Link>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="text-sm bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-4 py-2 rounded-full transition-colors"
                        >
                            Logout
                        </button>
                    </>
                ) : null}
            </div>
        </nav>
    );
};

export default Navbar;
