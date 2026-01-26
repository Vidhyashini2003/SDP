import { useState, useEffect } from 'react';
import axios from '../../config/axios';

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        guest_address: '',
        nationality: '',
        card_number: '',
        card_holder_name: '',
        card_expiry: '',
        card_cvv: ''
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
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Full Name
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="guest_name"
                                value={profileData.guest_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{profileData.guest_name}</p>
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
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{profileData.nationality}</p>
                        )}
                    </div>

                    {/* Address - Full Width */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Address
                        </label>
                        {isEditing ? (
                            <textarea
                                name="guest_address"
                                value={profileData.guest_address}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        ) : (
                            <p className="text-slate-900 font-medium">{profileData.guest_address}</p>
                        )}
                    </div>

                    {/* Payment Information Section */}
                    <div className="md:col-span-2 pt-6 border-t border-slate-200">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">Payment Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Card Number */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Card Number
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="card_number"
                                        value={profileData.card_number || ''}
                                        onChange={handleChange}
                                        placeholder="1234 5678 9012 3456"
                                        maxLength="19"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-slate-900 font-medium">{profileData.card_number || 'Not added'}</p>
                                )}
                            </div>

                            {/* Card Holder Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Card Holder Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="card_holder_name"
                                        value={profileData.card_holder_name || ''}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-slate-900 font-medium">{profileData.card_holder_name || 'Not added'}</p>
                                )}
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Expiry Date
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="card_expiry"
                                        value={profileData.card_expiry || ''}
                                        onChange={handleChange}
                                        placeholder="MM/YY"
                                        maxLength="5"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-slate-900 font-medium">{profileData.card_expiry || 'Not added'}</p>
                                )}
                            </div>

                            {/* CVV */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    CVV
                                </label>
                                {isEditing ? (
                                    <input
                                        type="password"
                                        name="card_cvv"
                                        value={profileData.card_cvv || ''}
                                        onChange={handleChange}
                                        placeholder="123"
                                        maxLength="3"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-slate-900 font-medium">{profileData.card_cvv ? '•••' : 'Not added'}</p>
                                )}
                            </div>
                        </div>
                    </div>
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
