import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Activate Account</h2>

                {status === 'verifying' && <p className="text-center text-gray-600">Verifying link...</p>}

                {status === 'invalid' && (
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-blue-500 hover:underline"
                        >
                            Go to Login
                        </button>
                    </div>
                )}

                {status === 'valid' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                            />
                        </div>

                        {!hasPassword && (
                            <>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Set Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            type="submit"
                            className="w-full bg-gold-600 text-white py-2 rounded-md hover:bg-gold-700 transition"
                        >
                            {hasPassword ? 'Verify Email & Activate' : 'Activate Account'}
                        </button>
                    </form>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <p className="text-green-600 text-lg mb-2">Account Activated Successfully!</p>
                        <p className="text-gray-500">Redirecting to login...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivateAccount;
