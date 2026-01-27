import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { BellIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/api/notifications');
            setNotifications(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
            toast.error('Failed to update status');
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`/api/notifications/mark-all-read`);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            toast.success('All marked as read');
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axios.delete(`/api/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
            toast.success('Notification removed');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
                    <p className="text-slate-600">Stay updated with system alerts and messages</p>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                    >
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-slate-500">
                        <BellIcon className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-600">No notifications</p>
                        <p className="text-sm">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification.notification_id}
                                className={`p-6 transition-colors hover:bg-slate-50 flex gap-4 ${!notification.is_read ? 'bg-blue-50/30' : 'bg-white'}`}
                            >
                                <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${!notification.is_read ? 'bg-blue-600' : 'bg-slate-300'}`} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-base ${!notification.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                                            {formatDate(notification.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                        {notification.message}
                                    </p>
                                    <div className="flex gap-4">
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => markAsRead(notification.notification_id)}
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Mark as read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notification.notification_id)}
                                            className="text-xs font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
