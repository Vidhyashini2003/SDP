import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';
import { PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline'; // Assuming you have heroicons
// If icons missing, buttons will be text-based fallbacks or svgs

const StaffManagement = () => {
    const [allStaff, setAllStaff] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        role: 'receptionist',
        vehicle_id: ''
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        filterStaff();
    }, [activeTab, allStaff]);

    const fetchStaff = async () => {
        try {
            const res = await axios.get('/api/admin/staff');
            setAllStaff(res.data);
        } catch (err) {
            console.error('Error fetching staff:', err);
        }
    };

    const filterStaff = () => {
        if (activeTab === 'All') {
            setFilteredStaff(allStaff);
        } else {
            setFilteredStaff(allStaff.filter(staff => staff.role.toLowerCase() === activeTab.toLowerCase()));
        }
    };

    // --- Actions ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/staff/invite', formData);
            toast.success('Staff invitation sent successfully!');
            setShowAddModal(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                role: 'receptionist',
                vehicle_id: ''
            });
            fetchStaff();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to invite staff member');
        }
    };

    const handleDelete = async (id, role) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                await axios.delete(`/api/admin/staff/${role}/${id}`);
                toast.success('Staff member deleted successfully!');
                fetchStaff();
            } catch (err) {
                toast.error('Failed to delete staff member');
            }
        }
    };

    // --- UI Helpers ---
    const tabs = [
        { name: 'All', count: allStaff.length },
        { name: 'Receptionist', count: allStaff.filter(s => s.role === 'receptionist').length },
        { name: 'Kitchen', count: allStaff.filter(s => s.role === 'kitchen').length },
        { name: 'Driver', count: allStaff.filter(s => s.role === 'driver').length }
    ];

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'receptionist': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'kitchen': return 'bg-blue-100 text-blue-600 border-blue-200'; // Assuming 'student' like color
            case 'driver': return 'bg-purple-100 text-purple-600 border-purple-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        return status === 'Active'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700';
        // Using red for inactive to highlight 'Invite Sent' state often being pending/inactive
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
                    <p className="text-slate-500 mt-1">Manage all system staff members</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all"
                >
                    <UserPlusIcon className="w-5 h-5" />
                    Invite Staff
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`pb-3 px-1 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.name
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.name}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.name ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStaff.length > 0 ? (
                            filteredStaff.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500">#{member.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{member.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{member.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(member.account_status)}`}>
                                            {member.account_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(member.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            {/* Edit Button (Placeholder) */}
                                            <button className="text-blue-500 hover:text-blue-700">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(member.id, member.role)}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    No staff members found in this category.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-xl font-bold text-slate-800">Invite Staff Member</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="+1 234 567 890"
                                />
                            </div>

                            {formData.role !== 'driver' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="123 Staff St"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    name="role"
                                    required
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="receptionist">Receptionist</option>
                                    <option value="kitchen">Kitchen Staff</option>
                                    <option value="driver">Driver</option>
                                </select>
                            </div>

                            {formData.role === 'driver' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle ID</label>
                                    <input
                                        name="vehicle_id"
                                        required
                                        value={formData.vehicle_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Enter Vehicle ID"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all"
                                >
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
