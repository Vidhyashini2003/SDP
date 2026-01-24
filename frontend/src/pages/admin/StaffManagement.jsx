import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Card from '../../components/Card';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'receptionist'
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await axios.get('/api/admin/staff');
            setStaff(res.data);
        } catch (err) {
            console.error('Error fetching staff:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/staff', formData);
            toast.success('Staff member added successfully!');
            setShowAddModal(false);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'receptionist'
            });
            fetchStaff();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to add staff member');
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

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'receptionist': return 'bg-blue-100 text-blue-700';
            case 'kitchen': return 'bg-green-100 text-green-700';
            case 'driver': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg transition-all"
                >
                    + Add Staff
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {staff.map((member) => (
                    <Card key={`${member.role}-${member.id}`} className="hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(member.role)}`}>
                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600">
                                    <div>📧 {member.email}</div>
                                    <div>📱 {member.phone || 'N/A'}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(member.id, member.role)}
                                className="ml-4 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </Card>
                ))}

                {staff.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        No staff members found. Add your first staff member to get started.
                    </div>
                )}
            </div>

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Add Staff Member</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                            >
                                ×
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
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
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
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    name="role"
                                    required
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="receptionist">Receptionist</option>
                                    <option value="kitchen">Kitchen Staff</option>
                                    <option value="driver">Driver</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg transition-all"
                                >
                                    Add Staff
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
