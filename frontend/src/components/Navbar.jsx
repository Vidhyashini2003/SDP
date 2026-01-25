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
        <nav className="bg-white border-b border-slate-200 fixed w-full top-0 z-50 h-[64px] flex items-center justify-center">
            <h1 className="text-3xl font-extrabold tracking-tight uppercase bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
                Janas Blue Water Corner
            </h1>
        </nav>
    );
};

export default Navbar;
