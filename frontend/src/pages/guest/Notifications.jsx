import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import DemoPaymentGateway from '../../components/DemoPaymentGateway';

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [damages, setDamages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Payment State
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, damage: null });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [damagesRes, notificationsRes] = await Promise.all([
                axios.get(`/api/notifications/${user.id}/damages`),
                axios.get(`/api/notifications`)
            ]);
            setDamages(damagesRes.data);
            setNotifications(notificationsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const initiatePayment = (damage) => {
        setPaymentModal({ isOpen: true, damage });
    };

    const confirmPayment = async () => {
        try {
            const damageId = paymentModal.damage.damage_id;
            await axios.post(`/api/notifications/damages/${damageId}/pay`);
            toast.success('Payment successful! Your charge has been settled.');
            setPaymentModal({ isOpen: false, damage: null });
            fetchData(); // Refresh list to remove the paid damage
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Payment processing failed');
            setPaymentModal({ isOpen: false, damage: null });
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axios.delete(`/api/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
            toast.success('Notification removed');
        } catch (error) {
            console.error('Error deleting notification', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const pendingDamages = damages.filter(d => d.status === 'Pending');

    if (loading) return <div className="p-8 text-center text-slate-600">Loading notifications...</div>;

    return (
        <>
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold mb-2">Notifications Center</h1>
                <p className="text-slate-600">Stay updated with your bookings and alerts</p>
            </div>

            {/* ACTIONABLE ALERTS (DAMAGES) */}
            {pendingDamages.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm animate-pulse-slow">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">⚠️</span>
                        <h2 className="text-lg font-bold text-red-800">Action Required: Unpaid Damages</h2>
                    </div>
                    <div className="space-y-4">
                        {pendingDamages.map((damage) => (
                            <div key={damage.damage_id} className="bg-white p-4 rounded-lg border border-red-100 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-semibold text-slate-900">{damage.damage_type}</p>
                                    <p className="text-sm text-slate-600">{damage.description}</p>
                                    <p className="text-xs text-slate-400 mt-1">{formatDate(damage.report_date)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-red-600 mb-2">Rs. {Number(damage.charge_amount).toLocaleString()}</p>
                                    <button
                                        onClick={() => initiatePayment(damage)}
                                        className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                                    >
                                        Settle Charge
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GENERAL NOTIFICATIONS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">Recent Updates</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 italic">No new notifications</div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.notification_id}
                                className={`p-6 transition-colors hover:bg-slate-50 flex gap-4 ${!notification.is_read ? 'bg-blue-50/50' : 'bg-white'}`}
                            >
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.is_read ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-base ${!notification.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                                            {formatDate(notification.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                                        {notification.message}
                                    </p>
                                    <div className="flex gap-4 items-center">
                                        {notification.action_url && (
                                            <button
                                                onClick={() => {
                                                    if (notification.title.includes('Damage') && pendingDamages.length > 0) {
                                                        const match = notification.message.match(/Rs\.\s*([\d,]+)/);
                                                        const amount = match ? Number(match[1].replace(/,/g, '')) : null;
                                                        const matchDmg = pendingDamages.find(d => Number(d.charge_amount) === amount) || pendingDamages[0];
                                                        if (matchDmg) initiatePayment(matchDmg);
                                                        return;
                                                    }
                                                    navigate(notification.action_url);
                                                }}
                                                className="bg-gold-600 hover:bg-gold-700 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-gold-600/20 active:scale-95 flex items-center gap-2"
                                            >
                                                {notification.action_url.includes('payment') || notification.action_url.includes('bookings') ? 'Proceed' : 'Review Details'}
                                                <span className="text-sm">➔</span>
                                            </button>
                                        )}
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => markAsRead(notification.notification_id)}
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notification.notification_id)}
                                            className="text-xs font-semibold text-slate-400 hover:text-red-600"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
        
        {/* Payment Gateway Modal */}
        {paymentModal.damage && (
            <DemoPaymentGateway 
                isOpen={paymentModal.isOpen}
                onClose={() => setPaymentModal({ isOpen: false, damage: null })}
                amount={Number(paymentModal.damage.charge_amount)}
                onPaymentSuccess={confirmPayment}
            />
        )}
        </>
    );
};

export default Notifications;
