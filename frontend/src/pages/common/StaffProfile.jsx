import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const StaffProfile = () => {
    const { user, setUser } = useAuth(); // Assuming setUser updates context local state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        // phone/address might not be relevant for all roles, but we handle it gracefully
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put('/api/auth/profile', formData);
            toast.success('Profile updated successfully');
            // Update local user context if possible, or just rely on next login/refresh
            // simple hack: update the user object in local storage and context
            // But context update depends on how AuthContext is built. 
            // For now, we trust the backend update.
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">My Profile</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffProfile;
