import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';
import { TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const CustomerManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await axios.get('/api/admin/customers');
            setCustomers(res.data);
        } catch (err) {
            console.error('Error fetching customers:', err);
            toast.error('Failed to load customers');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this customer? This action cannot be undone.')) {
            try {
                // Reusing the generic Delete Staff endpoint logic which works on User ID
                // Note: Router mapped /customers/:id to deleteStaff, so url is /api/admin/customers/${id}
                await axios.delete(`/api/admin/customers/${id}`);
                toast.success('Customer removed successfully!');
                fetchCustomers();
            } catch (err) {
                toast.error('Failed to remove customer');
            }
        }
    };

    // Filter logic
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        return status === 'Active'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Customer Management</h1>
                    <p className="text-slate-500 mt-1">View and manage registered guests</p>
                </div>
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <UserGroupIcon className="w-6 h-6 text-blue-600" />
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <input
                    type="text"
                    placeholder="Search customers by name or email..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500">#{customer.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{customer.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{customer.phone || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.account_status)}`}>
                                            {customer.account_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(customer.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(customer.id)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                            title="Remove Customer"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    No customers found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-gray-500 text-center">
                Total Customers: {customers.length}
            </div>
        </div>
    );
};

export default CustomerManagement;
