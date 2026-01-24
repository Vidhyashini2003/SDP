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
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    alt="Hotel Background"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 to-slate-900/50" />
            </div>

            {/* Login Form */}
            <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-100 relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-blue-600 mb-4">Janas Blue Water Corner</h1>
                    <h2 className="text-3xl font-bold text-slate-900">Sign In</h2>
                    <p className="text-slate-500 mt-2">Access your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all pr-10"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg shadow-primary-500/30 transition-all transform active:scale-95"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Don't have an account? {' '}
                    <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
