import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import royalHotelBg from '../../assets/royal_hotel_interior.jpg';

const ActivateAccount = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('verifying'); // verifying, valid, invalid, success
    const [error, setError] = useState('');

    const [hasPassword, setHasPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            setError('No activation token provided.');
            return;
        }

        // Verify Token
        const verifyToken = async () => {
            try {
                // Adjust API URL as needed (assuming proxy or constant)
                const res = await axios.get(`http://localhost:5000/api/auth/activate-account?token=${token}`);
                if (res.data.valid) {
                    setEmail(res.data.email);
                    setHasPassword(res.data.hasPassword);
                    setStatus('valid');
                }
            } catch (err) {
                setStatus('invalid');
                setError(err.response?.data?.error || 'Invalid or expired token.');
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!hasPassword && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/auth/activate-account', {
                token,
                password: hasPassword ? null : password,
                confirmPassword: hasPassword ? null : confirmPassword
            });
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Activation failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative bg-black">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                    src={royalHotelBg}
                    alt="Luxury Hotel"
                    className="h-full w-full object-cover opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>

            <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gold-500/30 relative z-10 transform transition-all hover:border-gold-500/50 duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-gold-500 mb-2 uppercase tracking-widest drop-shadow-sm">
                        Janas Blue Water Corner
                    </h1>
                    <div className="h-0.5 w-16 bg-gold-500/50 mx-auto mb-4 rounded-full"></div>
                    <h2 className="text-xl font-sans font-light text-slate-300 uppercase tracking-[0.2em]">Activate Account</h2>
                </div>

                {status === 'verifying' && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
                        <p className="text-slate-300 tracking-wider text-sm uppercase">Verifying activation link...</p>
                    </div>
                )}

                {status === 'invalid' && (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-red-400 mb-6 font-medium">{error}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-gold-500 hover:text-gold-400 font-semibold tracking-wider uppercase text-sm border-b border-transparent hover:border-gold-500 transition-all"
                        >
                            Back to Login
                        </button>
                    </div>
                )}

                {status === 'valid' && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-black/50 text-slate-400 cursor-not-allowed outline-none"
                            />
                        </div>

                        {!hasPassword && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Set Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600"
                                        placeholder="Create a new password"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gold-500/80 uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-black/50 text-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition-all placeholder:text-slate-600"
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-black font-serif font-bold text-lg uppercase tracking-widest hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:-translate-y-0.5 rounded-lg border border-gold-400/20"
                        >
                            {hasPassword ? 'Verify & Activate' : 'Activate Account'}
                        </button>
                    </form>
                )}

                {status === 'success' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gold-500 mb-2">Success!</h3>
                        <p className="text-slate-300 mb-6">Your account has been successfully activated.</p>
                        <p className="text-slate-500 text-sm animate-pulse">Redirecting to login...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivateAccount;
