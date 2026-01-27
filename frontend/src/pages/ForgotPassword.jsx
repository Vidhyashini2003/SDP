import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                setEmail('');
            } else {
                toast.error(data.error || 'Failed to send reset email');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
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
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    alt="Luxury Hotel"
                    className="h-full w-full object-cover opacity-30 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
            </div>

            <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gold-500/30 relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-serif font-bold text-gold-500 mb-2 uppercase tracking-widest">Forgot Password</h1>
                    <div className="h-0.5 w-10 bg-gold-500/50 mx-auto mb-4 rounded-full"></div>
                    <p className="text-slate-400 text-sm font-light">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-black font-serif font-bold text-lg uppercase tracking-widest hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:-translate-y-0.5 rounded-lg border border-gold-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-gold-500 font-semibold hover:text-gold-400 uppercase tracking-wide text-xs border border-transparent hover:border-gold-500/30 px-4 py-2 rounded-full transition-all">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
