import { useState, useEffect } from 'react';
import axios from '../../config/axios';

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        guest_email: '',
        guest_phone: '',
        guest_nic_passport: '',
        nationality: ''
    });
    const [originalData, setOriginalData] = useState({});

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const response = await axios.get('/api/guest/profile');
            setProfileData(response.data);
            setOriginalData(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setProfileData(originalData);
        setIsEditing(false);
    };

    const handleSave = async () => {
        try {
            await axios.put('/api/guest/profile', profileData);
            setOriginalData(profileData);
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.error || 'Failed to update profile');
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
                    {/* First Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            First Name
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="first_name"
                                value={profileData.first_name || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{profileData.first_name}</p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Last Name
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="last_name"
                                value={profileData.last_name || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{profileData.last_name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Email
                        </label>
                        {isEditing ? (
                            <input
                                type="email"
                                name="guest_email"
                                value={profileData.guest_email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{profileData.guest_email}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Phone
                        </label>
                        {isEditing ? (
                            <input
                                type="tel"
                                name="guest_phone"
                                value={profileData.guest_phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{profileData.guest_phone}</p>
                        )}
                    </div>

                    {/* Nationality */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Nationality
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="nationality"
                                value={profileData.nationality}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{profileData.nationality}</p>
                        )}
                    </div>

                    {/* NIC / Passport - Full Width */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            NIC / Passport Number
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="guest_nic_passport"
                                value={profileData.guest_nic_passport || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{profileData.guest_nic_passport}</p>
                        )}
                    </div>

                    {/* Payment Information Section */}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors"
                            >
                                Save Changes
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

export default Profile;
