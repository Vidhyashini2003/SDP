import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';

const Notifications = () => {
    const { user } = useAuth();
    const [damages, setDamages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDamages();
        }
    }, [user]);

    const fetchDamages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/notifications/${user.id}/damages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDamages(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            // toast.error('Failed to load notifications'); 
            setLoading(false);
        }
    };

    const handlePay = async (damageId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:5000/api/notifications/damages/${damageId}/pay`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Payment successful');
            fetchDamages(); // Refresh list
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Payment failed');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const pendingDamages = damages.filter(d => d.status === 'Pending');
    const paidDamages = damages.filter(d => d.status === 'Paid');
    const totalPendingAmount = pendingDamages.reduce((sum, d) => sum + Number(d.charge_amount), 0);

    if (loading) return <div className="p-8 text-center text-slate-600">Loading notifications...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Notifications</h1>
            <p className="text-slate-600 mb-8">Damage payment requests from staff</p>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white border-l-4 border-l-orange-500">
                    <p className="text-sm font-medium text-slate-500 mb-1">Pending Requests</p>
                    <p className="text-3xl font-bold text-slate-800">{pendingDamages.length}</p>
                    <p className="text-xs text-slate-400 mt-2">Awaiting action</p>
                </Card>
                <Card className="bg-white border-l-4 border-l-blue-500">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Amount Due</p>
                    <p className="text-3xl font-bold text-slate-800">Rs. {totalPendingAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2">Pending payments</p>
                </Card>
                <Card className="bg-white border-l-4 border-l-green-500">
                    <p className="text-sm font-medium text-slate-500 mb-1">Paid Requests</p>
                    <p className="text-3xl font-bold text-slate-800">{paidDamages.length}</p>
                    <p className="text-xs text-slate-400 mt-2">Completed</p>
                </Card>
            </div>

            {/* Pending Requests */}
            {pendingDamages.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Payment Requests</h2>
                            <p className="text-sm text-slate-500">Damage payment requests from hotel staff</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                                    <th className="px-6 py-4">From</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 w-1/3">Description</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingDamages.map((damage) => (
                                    <tr key={damage.damage_id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-600">{damage.reported_by || 'Staff'}</td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">{damage.damage_type}</td>
                                        <td className="px-6 py-4 text-slate-600">{damage.description}</td>
                                        <td className="px-6 py-4 text-slate-500">{formatDate(damage.report_date)}</td>
                                        <td className="px-6 py-4 text-blue-600 font-semibold">Rs. {Number(damage.charge_amount).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                                                {damage.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handlePay(damage.damage_id)}
                                                className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                                            >
                                                Pay Now
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Paid History (Optional, but good for completeness) */}
            {paidDamages.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden opacity-75">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">Payment History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paidDamages.map((damage) => (
                                    <tr key={damage.damage_id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-700">{damage.damage_type}</td>
                                        <td className="px-6 py-4 text-slate-600">{damage.description}</td>
                                        <td className="px-6 py-4 text-slate-500">{formatDate(damage.report_date)}</td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">Rs. {Number(damage.charge_amount).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                Paid
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {damages.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                    <p className="text-slate-500">No damage requests found.</p>
                </div>
            )}
        </div>
    );
};

export default Notifications;
