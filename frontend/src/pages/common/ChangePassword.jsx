import { useState } from 'react';
import axios from '../../config/axios'; // Use configured axios
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // Import icons

const ChangePassword = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    // Visibility state
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error('New passwords do not match');
        }

        if (formData.newPassword.length < 8) {
            return toast.error('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(formData.newPassword)) {
            return toast.error('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(formData.newPassword)) {
            return toast.error('Password must contain at least one lowercase letter');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)) {
            return toast.error('Password must contain at least one special character');
        }

        setLoading(true);
        try {
            await axios.put('/api/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            toast.success('Password updated successfully');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Change password error:', error);
            toast.error(error.response?.data?.error || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const toggleButton = (show, setShow) => (
        <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
        >
            {show ? (
                <EyeSlashIcon className="h-5 w-5" />
            ) : (
                <EyeIcon className="h-5 w-5" />
            )}
        </button>
    );

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Change Password</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                    <div className="relative">
                        <input
                            type={showCurrent ? "text" : "password"}
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
                            placeholder="••••••••"
                        />
                        {toggleButton(showCurrent, setShowCurrent)}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <div className="relative">
                        <input
                            type={showNew ? "text" : "password"}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
                            placeholder="••••••••"
                        />
                        {toggleButton(showNew, setShowNew)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                        <input
                            type={showConfirm ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
                            placeholder="••••••••"
                        />
                        {toggleButton(showConfirm, setShowConfirm)}
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gold-600 hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all
                            ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePassword;
