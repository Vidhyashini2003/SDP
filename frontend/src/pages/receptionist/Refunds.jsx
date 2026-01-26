import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ReceptionistRefunds = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'History'

    useEffect(() => {
        fetchRefunds();
    }, [activeTab]);

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/receptionist/refunds', {
                params: { status: activeTab },
                headers: { Authorization: `Bearer ${token}` }
            });
            setRefunds(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching refunds:', error);
            // toast.error('Failed to load refunds');
            setLoading(false);
        }
    };

    const handleProcessRefund = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/receptionist/refunds/${id}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Refund ${status}`);
            fetchRefunds(); // Refresh list
        } catch (error) {
            console.error('Process error:', error);
            toast.error('Failed to process refund');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-2">Refund Management</h1>
            <p className="text-slate-600 mb-8">Manage customer refund requests</p>

            <div className="mb-6 flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('Pending')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'Pending' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Pending Requests
                    {activeTab === 'Pending' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('History')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'History' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Refund History
                    {activeTab === 'History' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-600">Loading refunds...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Guest</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Reason</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                    {activeTab === 'Pending' && <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {refunds.map((refund) => (
                                    <tr key={refund.refund_id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-500">{formatDate(refund.refund_date)}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900">{refund.guest_name}</p>
                                            <p className="text-xs text-slate-500">{refund.guest_email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{refund.refund_reason}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">Rs. {Number(refund.refund_amount).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold
                                                ${refund.refund_status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    refund.refund_status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                {refund.refund_status}
                                            </span>
                                        </td>
                                        {activeTab === 'Pending' && (
                                            <td className="px-6 py-4 space-x-2">
                                                <button
                                                    onClick={() => handleProcessRefund(refund.refund_id, 'Approved')}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleProcessRefund(refund.refund_id, 'Rejected')}
                                                    className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-semibold rounded-lg shadow-sm transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {refunds.length === 0 && (
                                    <tr>
                                        <td colSpan={activeTab === 'Pending' ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                                            No {activeTab.toLowerCase()} refunds found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistRefunds;
