import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Handle redirection when user is authenticated
    useEffect(() => {
        if (user) {
            if (user.role === 'guest') navigate('/guest/bookings');
            else if (user.role === 'admin') navigate('/admin/dashboard');
            else if (user.role === 'receptionist') navigate('/receptionist/dashboard');
            else if (user.role === 'kitchen') navigate('/kitchen/dashboard');
            else if (user.role === 'driver') navigate('/driver/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // pass null for role since it's now unified
        const result = await login(null, email, password);

        if (result.success) {
            toast.success(`Welcome back!`);
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative bg-black">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    alt="Luxury Hotel"
                    className="h-full w-full object-cover opacity-40 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            </div>

            {/* Login Form */}
            <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gold-500/30 relative z-10 transform transition-all hover:border-gold-500/50 duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-gold-500 mb-2 uppercase tracking-widest drop-shadow-sm">
                        Janas Blue Water Corner
                    </h1>
                    <div className="h-0.5 w-16 bg-gold-500/50 mx-auto mb-4 rounded-full"></div>
                    <h2 className="text-xl font-sans font-light text-slate-300 uppercase tracking-[0.2em]">Login</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600"
                            placeholder="Type your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all pr-10 placeholder:text-slate-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gold-500 transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-xs font-medium text-slate-400 hover:text-gold-400 transition-colors">
                            Forgot Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-black font-serif font-bold text-lg uppercase tracking-widest hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:-translate-y-0.5 rounded-lg border border-gold-400/20"
                    >
                        Login
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm mb-2">New to Janas Blue Water?</p>
                    <Link to="/register" className="inline-block px-6 py-2 border border-slate-700 rounded-full text-sm text-gold-500 hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-all uppercase tracking-wider font-medium">
                        Create Customer Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
