import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Register = () => {
    const navigate = useNavigate();
    const { registerGuest } = useAuth();
    const [formData, setFormData] = useState({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        guest_password: '',
        confirmPassword: '',
        guest_address: '',
        nationality: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate password match
        if (formData.guest_password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        // Validate password length
        if (formData.guest_password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        // Remove confirmPassword before sending to backend
        const { confirmPassword, ...dataToSend } = formData;
        const result = await registerGuest(dataToSend);

        if (result.success) {
            toast.success('Account created successfully!');
            navigate('/login');
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    alt="Hotel Background"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 to-slate-900/50" />
            </div>

            {/* Registration Form */}
            <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-100 relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-gold-600 mb-4 uppercase tracking-wider">Janas Blue Water Corner</h1>
                    <h2 className="text-2xl font-sans font-light text-slate-600 uppercase tracking-widest">Create Account</h2>
                    <p className="text-slate-400 mt-2 font-serif italic">Join our exclusive members club</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            name="guest_name"
                            required
                            value={formData.guest_name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-none border-b-2 border-slate-200 focus:border-gold-500 bg-slate-50 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            name="guest_email"
                            type="email"
                            required
                            value={formData.guest_email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-none border-b-2 border-slate-200 focus:border-gold-500 bg-slate-50 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input
                            name="guest_phone"
                            required
                            value={formData.guest_phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-none border-b-2 border-slate-200 focus:border-gold-500 bg-slate-50 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="+1 234 567 890"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <input
                            name="guest_address"
                            required
                            value={formData.guest_address}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-none border-b-2 border-slate-200 focus:border-gold-500 bg-slate-50 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="123 Main St, City"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label>
                        <input
                            name="nationality"
                            required
                            value={formData.nationality}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-none border-b-2 border-slate-200 focus:border-gold-500 bg-slate-50 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                            placeholder="e.g., American, Indian, British"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                name="guest_password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.guest_password}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-none border-b-2 border-slate-200 focus:border-gold-500 bg-slate-50 focus:bg-white outline-none transition-all pr-10 placeholder:text-slate-400"
                                placeholder="••••••••"
                                minLength={6}
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
                        <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-none border-b-2 border-slate-200 focus:border-gold-500 bg-slate-50 focus:bg-white outline-none transition-all pr-10 placeholder:text-slate-400"
                                placeholder="••••••••"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showConfirmPassword ? (
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
                        className="w-full py-4 bg-black hover:bg-slate-800 text-white font-serif font-bold text-lg uppercase tracking-widest shadow-lg hover:shadow-gold-500/20 transition-all mt-6"
                    >
                        Create Account
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Already have an account? <Link to="/login" className="text-gold-600 font-semibold hover:text-gold-700 uppercase tracking-wide text-xs">Sign In</Link>
                </div>
            </div>

        </div>
    );
};

export default Register;
