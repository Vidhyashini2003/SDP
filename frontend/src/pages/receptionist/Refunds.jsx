import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ReceptionistRefunds = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRefunds();
    }, []);

    const fetchRefunds = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/receptionist/refunds', {
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

    if (loading) return <div className="p-8 text-center text-slate-600">Loading refund requests...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-2">Refund Requests</h1>
            <p className="text-slate-600 mb-8">Manage pending refund requests from cancellations</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Guest</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Reason</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>
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
                                    <td className="px-6 py-4 space-x-2">
                                        <button
                                            onClick={() => handleProcessRefund(refund.refund_id, 'Approved')}
                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                                        >
                                            Approve & Refund
                                        </button>
                                        <button
                                            onClick={() => handleProcessRefund(refund.refund_id, 'Rejected')}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-semibold rounded-lg shadow-sm transition-all"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {refunds.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No pending refund requests.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistRefunds;
