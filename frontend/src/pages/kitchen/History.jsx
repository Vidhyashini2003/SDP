import { useState, useEffect } from 'react';
import axios from '../../config/axios';

const KitchenHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/kitchen/orders');
            // Filter for only completed history items (Delivered or Cancelled)
            const historyOrders = res.data.filter(o =>
                o.order_status === 'Delivered' || o.order_status === 'Cancelled'
            );
            setOrders(historyOrders);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching history:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading history...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Order History</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {orders.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        No past orders found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Order ID</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Date & Time</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Guest / Room</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Dining Option</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Items</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => (
                                    <tr key={order.order_id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono font-medium text-slate-600">
                                            #{order.order_id}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div>{new Date(order.order_date).toLocaleDateString()}</div>
                                            <div className="text-xs text-slate-400">{new Date(order.order_date).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{order.guest_name}</div>
                                            <div className="text-xs text-slate-500">
                                                {order.room_number !== 'N/A' ? `Room ${order.room_number}` : 'Lobby'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${order.dining_option === 'Dine-in'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                {order.dining_option || 'Delivery'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1 max-w-xs">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="text-slate-600 flex justify-between">
                                                        <span>{item.quantity}x {item.item_name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            Rs. {order.total_amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.order_status === 'Delivered'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {order.order_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitchenHistory;
