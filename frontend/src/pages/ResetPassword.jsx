import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import royalHotelBg from '../assets/royal_hotel_interior.jpg';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, confirmPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                navigate('/login');
            } else {
                toast.error(data.error || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative bg-black">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                    src={royalHotelBg}
                    alt="Luxury Hotel"
                    className="h-full w-full object-cover opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-black/40" />
            </div>

            <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gold-500/30 relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-serif font-bold text-gold-500 mb-2 uppercase tracking-widest">Reset Password</h1>
                    <div className="h-0.5 w-10 bg-gold-500/50 mx-auto mb-4 rounded-full"></div>
                    <p className="text-slate-400 text-sm font-light">Secure your account with a new password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">New Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-black font-serif font-bold text-lg uppercase tracking-widest hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:-translate-y-0.5 rounded-lg border border-gold-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
