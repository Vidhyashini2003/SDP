import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate } from 'react-router-dom';

const ChefHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/chef/orders');
            // Filter for only completed history items (Delivered or Cancelled)
            const historyOrders = res.data.filter(o =>
                o.order_status === 'Delivered' || o.order_status === 'Cancelled' || o.order_status === 'Incomplete'
            );
            setOrders(historyOrders);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching history:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500 font-medium italic">Loading culinary history...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Culinary Mission History</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {orders.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 font-medium italic">
                        No culinary missions have been archived yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Order ID</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Date & Time</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Guest / Room</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Dining Option</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Items</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Amount</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => (
                                    <tr key={order.order_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-600">
                                            #{order.order_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{new Date(order.order_date).toLocaleDateString()}</div>
                                            <div className="text-[10px] font-black uppercase text-slate-400">{new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{order.guest_name}</div>
                                            <div className="text-[10px] font-black uppercase text-slate-500">
                                                {order.room_number !== 'N/A' ? `Room ${order.room_number}` : 'Lobby'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${order.dining_option === 'Dine-in'
                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                : 'bg-gold-50 text-gold-700 border-gold-200'
                                                }`}>
                                                {order.dining_option || 'Delivery'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="text-slate-600 text-xs font-medium">
                                                        <span className="font-black text-slate-400 mr-2">{item.quantity}x</span>
                                                        {item.item_name}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-black text-slate-900 text-base">
                                            Rs. {order.total_amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${order.order_status === 'Delivered'
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : 'bg-red-100 text-red-700 border border-red-200'
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

export default ChefHistory;
