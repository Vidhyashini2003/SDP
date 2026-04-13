import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const DriverRefunds = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRefunds();
    }, []);

    const fetchRefunds = async () => {
        try {
            const res = await axios.get('/api/driver/refunds');
            setRefunds(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching refunds:', error);
            setLoading(false);
            toast.error('Failed to load refund requests');
        }
    };

    const handleProcessRefund = async (refundId) => {
        if (!window.confirm('Mark this refund as processed? This confirms you have initiated the refund to the guest.')) return;
        try {
            await axios.put(`/api/driver/refunds/${refundId}/process`);
            toast.success('Refund marked as processed');
            fetchRefunds();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to process refund');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600"></div>
        </div>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Processed': return 'bg-blue-100 text-blue-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Refund Requests</h1>
                    <p className="text-slate-500 mt-1">Manage and track guest refund requests for cancelled trips.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Total Pending: </span>
                    <span className="text-lg font-bold text-gold-600">{refunds.filter(r => r.refund_status === 'Pending').length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {refunds.length === 0 ? (
                    <div className="bg-white p-16 rounded-2xl shadow-sm border border-slate-200 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl text-slate-300">💸</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Refund Requests</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            When guests cancel paid trips, refund requests will appear here for your reference.
                        </p>
                    </div>
                ) : (
                    refunds.map((refund) => (
                        <div 
                            key={refund.refund_id} 
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(refund.refund_status)}`}>
                                            {refund.refund_status}
                                        </span>
                                        <span className="text-sm text-slate-400 font-mono">#{refund.refund_id}</span>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-xs text-slate-500 font-medium">
                                            {new Date(refund.refund_date).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Guest Name</label>
                                            <p className="text-slate-900 font-semibold">{refund.guest_name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Trip Details</label>
                                            <p className="text-slate-900 font-semibold">
                                                {refund.trip_type} <span className="text-slate-400 font-normal">#{refund.trip_id}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Refund Amount</label>
                                            <p className="text-2xl font-black text-rose-600">Rs. {refund.refund_amount}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Reason for Refund</label>
                                        <p className="text-sm text-slate-700 italic">"{refund.refund_reason}"</p>
                                    </div>
                                </div>

                                {refund.refund_status === 'Pending' && (
                                    <div className="flex items-center justify-center min-w-[160px]">
                                        <button
                                            onClick={() => handleProcessRefund(refund.refund_id)}
                                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95 text-sm"
                                        >
                                            Proceed Refund
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-12 p-6 bg-gold-50 rounded-2xl border border-gold-100">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-gold-100 rounded-xl text-gold-600 text-xl font-bold italic">i</div>
                    <div>
                        <h4 className="font-bold text-gold-900">About Refunds</h4>
                        <p className="text-sm text-gold-800 leading-relaxed mt-1">
                            Refunds are processed by the management. These records are for your information so you are aware of adjustments to your trip history. If you have concerns about a specific refund, please contact the dispatch office.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverRefunds;
