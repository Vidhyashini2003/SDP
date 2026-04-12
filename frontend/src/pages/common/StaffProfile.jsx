import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const StaffProfile = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address_no: '',
        street: '',
        city: '',
        district: '',
        address: '',
        vehicle_id: '',
        role: ''
    });
    const [originalData, setOriginalData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/auth/me');
            const data = res.data;
            const profile = {
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || '',
                phone: data.phone || '',
                address_no: data.address_no || '',
                street: data.street || '',
                city: data.city || '',
                district: data.district || '',
                address: data.address || '',
                vehicle_id: data.vehicle_id || '',
                role: data.role || ''
            };
            setFormData(profile);
            setOriginalData(profile);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            toast.error('Failed to load profile data');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData(originalData);
        setIsEditing(false);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await axios.put('/api/auth/profile', formData);
            setOriginalData(formData);
            updateUser({
                name: `${formData.first_name} ${formData.last_name}`.trim(),
                first_name: formData.first_name,
                last_name: formData.last_name
            });
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 overflow-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-3xl">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Profile Information</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage your account details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">First Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                                required
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{formData.first_name}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Last Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                                required
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{formData.last_name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Email</label>
                        {isEditing ? (
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                                required
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{formData.email}</p>
                        )}
                    </div>

                    {formData.role !== 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Phone</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                                    placeholder="+1 234 567 890"
                                />
                            ) : (
                                <p className="text-slate-900 font-medium">{formData.phone}</p>
                            )}
                        </div>
                    )}

                    {(formData.role === 'receptionist' || formData.role === 'chef' || formData.role === 'driver') && (
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Address Configuration</h4>
                            {isEditing ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">No</label>
                                        <input
                                            type="text"
                                            name="address_no"
                                            value={formData.address_no}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                                            placeholder="12/A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Street</label>
                                        <input
                                            type="text"
                                            name="street"
                                            value={formData.street}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                                            placeholder="Kandy Road"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                                            placeholder="Peradeniya"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">District</label>
                                        <input
                                            type="text"
                                            name="district"
                                            value={formData.district}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                                            placeholder="Kandy"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-900 font-medium whitespace-pre-line">
                                    {[formData.address_no, formData.street, formData.city, formData.district].filter(Boolean).join(', ')}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleEdit}
                            className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffProfile;
