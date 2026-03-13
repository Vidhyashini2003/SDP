import { useNavigate, useLocation } from 'react-router-dom';
import royalHotelBg from '../../assets/royal_hotel_interior.jpg';

const CheckEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

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
                    <h2 className="text-xl font-sans font-light text-slate-300 uppercase tracking-[0.2em]">Check Your Email</h2>
                </div>

                <div className="text-center py-6">
                    {/* Email Icon */}
                    <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-500/30">
                        <svg className="w-10 h-10 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h3 className="text-xl font-bold text-gold-500 mb-4">Registration Successful!</h3>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
                        <p className="text-slate-300 mb-4 leading-relaxed">
                            We've sent a verification link to:
                        </p>
                        {email && (
                            <p className="text-gold-400 font-semibold mb-4 break-words">
                                {email}
                            </p>
                        )}
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Please check your email inbox (and spam folder) and click the activation link to activate your account.
                        </p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                        <p className="text-blue-300 text-xs uppercase tracking-wider mb-2">
                            📧 Important
                        </p>
                        <p className="text-slate-300 text-sm">
                            The activation link will expire in 24 hours.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3.5 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-black font-serif font-bold text-lg uppercase tracking-widest hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:-translate-y-0.5 rounded-lg border border-gold-400/20"
                    >
                        Go to Login
                    </button>

                    <p className="text-slate-500 text-xs mt-6">
                        Didn't receive the email?{' '}
                        <button className="text-gold-500 hover:text-gold-400 underline">
                            Resend verification email
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CheckEmail;
