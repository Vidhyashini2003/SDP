import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

import royalHotelBg from '../assets/royal_hotel_interior.jpg';

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
        if (formData.guest_password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }
        if (!/[A-Z]/.test(formData.guest_password)) {
            toast.error('Password must contain at least one uppercase letter');
            return;
        }
        if (!/[a-z]/.test(formData.guest_password)) {
            toast.error('Password must contain at least one lowercase letter');
            return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.guest_password)) {
            toast.error('Password must contain at least one special character');
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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative bg-black">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                    src={royalHotelBg}
                    alt="Luxury Hotel"
                    className="h-full w-full object-cover opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/40" />
            </div>

            {/* Registration Form */}
            <div className="max-w-xl w-full bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gold-500/30 relative z-10 transform transition-all hover:border-gold-500/50 duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-serif font-bold text-gold-500 mb-2 uppercase tracking-widest">
                        Create New Account
                    </h1>
                    <div className="h-0.5 w-12 bg-gold-500/50 mx-auto mb-4 rounded-full"></div>
                    <p className="text-slate-400 font-light text-sm tracking-wide">Create your Janas Blue Water Customer Account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                            <input
                                name="guest_name"
                                required
                                value={formData.guest_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600"
                                placeholder="Jana Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Email</label>
                            <input
                                name="guest_email"
                                type="email"
                                required
                                value={formData.guest_email}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600"
                                placeholder="guest@example.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Phone</label>
                            <input
                                name="guest_phone"
                                required
                                value={formData.guest_phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600"
                                placeholder="+94 ..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Nationality</label>
                            <input
                                name="nationality"
                                required
                                value={formData.nationality}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600"
                                placeholder="e.g., Sri Lankan"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Address</label>
                        <textarea
                            name="guest_address"
                            required
                            value={formData.guest_address}
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600 resize-none"
                            placeholder="Your full address"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    name="guest_password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.guest_password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all pr-10 placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gold-500 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
                            <div className="relative">
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all pr-10 placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gold-500 transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-black font-serif font-bold text-lg uppercase tracking-widest hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:-translate-y-0.5 rounded-lg border border-gold-400/20 mt-4"
                    >
                        Register
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400">
                    Already have an account? <Link to="/login" className="text-gold-500 font-semibold hover:text-gold-400 ml-1 uppercase text-xs tracking-wider">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
