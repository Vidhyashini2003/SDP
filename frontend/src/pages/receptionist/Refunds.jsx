import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SERVICE_COLORS = {
    Room:     { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   icon: '🏨' },
    Activity: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: '🏋️' },
    Vehicle:  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: '🚗' },
    Food:     { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  icon: '🍽️' },
    Unknown:  { bg: 'bg-slate-100',  text: 'text-slate-700',  border: 'border-slate-200',  icon: '❓' },
};

const STATUS_COLORS = {
    Pending:  'bg-amber-50 text-amber-700 border-amber-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-red-50 text-red-600 border-red-200',
};

const ReceptionistRefunds = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Pending');
    const [pendingCount, setPendingCount] = useState(0);

    // Confirmation modal state
    const [modal, setModal] = useState({ open: false, refund: null, action: '' });
    const [processing, setProcessing] = useState(false);

    // Detail expand state
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchRefunds();
    }, [activeTab]);

    useEffect(() => {
        fetchPendingCount();
    }, []);

    const fetchPendingCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/receptionist/refunds', {
                params: { status: 'Pending' },
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingCount(res.data.length);
        } catch { /* silent */ }
    };

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/receptionist/refunds', {
                params: { status: activeTab },
                headers: { Authorization: `Bearer ${token}` }
            });
            setRefunds(response.data);
            if (activeTab === 'Pending') setPendingCount(response.data.length);
        } catch (error) {
            console.error('Error fetching refunds:', error);
            toast.error('Failed to load refunds');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (refund, action) => setModal({ open: true, refund, action });
    const closeModal = () => setModal({ open: false, refund: null, action: '' });

    const handleProcessRefund = async () => {
        if (!modal.refund) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/receptionist/refunds/${modal.refund.refund_id}`,
                { status: modal.action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(
                modal.action === 'Approved'
                    ? `✅ Refund approved! Guest has been notified.`
                    : `❌ Refund rejected.`
            );
            closeModal();
            fetchRefunds();
        } catch (error) {
            console.error('Process error:', error);
            toast.error('Failed to process refund');
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const getBookingInfo = (refund) => {
        if (refund.service_type === 'Room' && refund.rb_checkin) {
            return `${formatDate(refund.rb_checkin)} → ${formatDate(refund.rb_checkout)}`;
        }
        if (refund.service_type === 'Activity' && refund.ab_start_time) {
            return `${formatDate(refund.ab_start_time)} → ${formatDate(refund.ab_end_time)}`;
        }
        if (refund.service_type === 'Vehicle' && refund.vb_date) {
            return `${formatDate(refund.vb_date)}${refund.vb_days ? ` (${refund.vb_days} day${refund.vb_days > 1 ? 's' : ''})` : ''}`;
        }
        if (refund.service_type === 'Food' && refund.order_date) {
            return `Ordered: ${formatDate(refund.order_date)}${refund.scheduled_date ? ` · Scheduled: ${formatDate(refund.scheduled_date)}` : ''}`;
        }
        return null;
    };

    const cleanReason = (reason) => {
        if (!reason) return '—';
        return reason
            .replace(/System cascade: Trip #\d+ cancelled\. Reason: /gi, '')
            .replace(/Trip #\d+ cancelled\.? /gi, '')
            .replace(/Trip #\d+ cancelled/gi, '')
            .trim();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Refund Management</h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Review and process guest refund requests from maintenance events
                    </p>
                </div>
                {pendingCount > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="text-amber-700 font-semibold text-sm">{pendingCount} pending refund{pendingCount !== 1 ? 's' : ''}</p>
                            <p className="text-amber-600 text-xs">Require your action</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                {['Pending', 'History'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === tab
                                ? 'bg-white shadow text-slate-900'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab === 'Pending' ? '⏳ Pending Requests' : '📋 History'}
                        {tab === 'Pending' && pendingCount > 0 && (
                            <span className="ml-2 bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500">Loading refunds...</p>
                </div>
            ) : refunds.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <p className="text-4xl mb-3">{activeTab === 'Pending' ? '🎉' : '📭'}</p>
                    <p className="text-slate-700 font-semibold text-lg">
                        {activeTab === 'Pending' ? 'No pending refunds!' : 'No refund history'}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                        {activeTab === 'Pending' ? 'All refund requests have been processed.' : 'Processed refunds will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {refunds.map((refund) => {
                        const svcColor = SERVICE_COLORS[refund.service_type] || SERVICE_COLORS.Unknown;
                        const bookingInfo = getBookingInfo(refund);
                        const isExpanded = expandedId === refund.refund_id;

                        return (
                            <div
                                key={refund.refund_id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
                            >
                                {/* Main Row */}
                                <div className="p-5 flex flex-wrap items-center gap-4">

                                    {/* Service Badge */}
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${svcColor.bg} ${svcColor.text} ${svcColor.border} flex-shrink-0`}>
                                        <span>{svcColor.icon}</span>
                                        <span>{refund.service_type}</span>
                                    </div>

                                    {/* Guest Info */}
                                    <div className="flex-1 min-w-[160px]">
                                        <p className="font-semibold text-slate-900 text-sm">
                                            {refund.guest_name || '—'}
                                        </p>
                                        <p className="text-xs text-slate-400">{refund.guest_email}</p>
                                    </div>

                                    {/* Reason */}
                                    <div className="flex-1 min-w-[200px]">
                                        <p className="text-xs text-slate-400 mb-0.5">Reason</p>
                                        <p className="text-sm text-slate-700 line-clamp-2">{cleanReason(refund.refund_reason)}</p>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs text-slate-400 mb-0.5">Refund Amount</p>
                                        <p className="text-lg font-bold text-slate-900">
                                            Rs. {Number(refund.refund_amount).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div className="flex-shrink-0">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_COLORS[refund.refund_status] || STATUS_COLORS.Pending}`}>
                                            {refund.refund_status === 'Approved' && '✅ '}
                                            {refund.refund_status === 'Rejected' && '❌ '}
                                            {refund.refund_status === 'Pending' && '⏳ '}
                                            {refund.refund_status}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {activeTab === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => openModal(refund, 'Approved')}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={() => openModal(refund, 'Rejected')}
                                                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all"
                                                >
                                                    ✗ Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : refund.refund_id)}
                                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                                            title="View details"
                                        >
                                            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Detail Row */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-0 border-t border-slate-100 mt-0">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                                            <div>
                                                <p className="text-xs text-slate-400 mb-0.5">Refund Date</p>
                                                <p className="text-sm font-medium text-slate-700">{formatDate(refund.refund_date)}</p>
                                            </div>
                                            {bookingInfo && (
                                                <div>
                                                    <p className="text-xs text-slate-400 mb-0.5">Booking Period</p>
                                                    <p className="text-sm font-medium text-slate-700">{bookingInfo}</p>
                                                </div>
                                            )}
                                        </div>
                                        {refund.refund_status === 'Approved' && (
                                            <div className="mt-3 flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 text-xs font-medium">
                                                <span>✅</span>
                                                <span>Guest has been notified via their notification centre that the refund is being processed.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirmation Modal */}
            {modal.open && modal.refund && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className={`p-5 ${modal.action === 'Approved' ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-red-50 border-b border-red-100'}`}>
                            <p className="text-2xl mb-1">{modal.action === 'Approved' ? '✅' : '❌'}</p>
                            <h3 className={`text-lg font-bold ${modal.action === 'Approved' ? 'text-emerald-800' : 'text-red-800'}`}>
                                {modal.action === 'Approved' ? 'Approve Refund' : 'Reject Refund'}
                            </h3>
                            <p className={`text-sm mt-1 ${modal.action === 'Approved' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {modal.action === 'Approved'
                                    ? 'Once approved, the guest will be notified immediately via their account.'
                                    : 'The refund request will be marked as rejected.'}
                            </p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-3">
                            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Guest</span>
                                    <span className="font-semibold text-slate-800">{modal.refund.guest_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Service</span>
                                    <span className="font-semibold text-slate-800">
                                        {SERVICE_COLORS[modal.refund.service_type]?.icon} {modal.refund.service_type}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Refund Amount</span>
                                    <span className="font-bold text-slate-900 text-base">
                                        Rs. {Number(modal.refund.refund_amount).toLocaleString()}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-slate-200">
                                    <p className="text-xs text-slate-400 mb-1">Reason</p>
                                    <p className="text-sm text-slate-700">{cleanReason(modal.refund.refund_reason)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 pb-5 flex gap-3 justify-end">
                            <button
                                onClick={closeModal}
                                disabled={processing}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessRefund}
                                disabled={processing}
                                className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100
                                    ${modal.action === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {processing ? 'Processing...' : `Confirm ${modal.action}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistRefunds;
