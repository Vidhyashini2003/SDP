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
        <nav className="bg-slate-900 border-b border-slate-800 fixed w-full top-0 z-50 h-[80px] flex items-center justify-center transition-all duration-300">
            <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-wider text-[#D4AF37] drop-shadow-sm uppercase">
                Janas Blue Water Corner
            </h1>
        </nav>
    );
};

export default Navbar;
