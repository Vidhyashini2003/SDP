import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const KitchenOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
        // Optional: Poll every 30 seconds for new orders
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('/api/kitchen/orders');
            setOrders(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await axios.put(`/api/kitchen/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order marked as ${newStatus}`);
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleItemStatusUpdate = async (itemId, newStatus) => {
        try {
            await axios.put(`/api/kitchen/orders/items/${itemId}/status`, { status: newStatus });
            toast.success(`Item marked as ${newStatus}`);
            fetchOrders();
        } catch (error) {
            console.error('Error updating item status:', error);
            toast.error('Failed to update item status');
        }
    };

    if (loading) return <div className="p-8">Loading orders...</div>;

    const pendingOrders = orders.filter(o => o.order_status === 'Pending' || o.order_status === 'Preparing');
    const completedOrders = orders.filter(o => o.order_status === 'Prepared' || o.order_status === 'Delivered' || o.order_status === 'Cancelled'); // Added Prepared

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Incoming Orders</h1>
                <button onClick={fetchOrders} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                    Refresh
                </button>
            </div>

            {/* Active Orders Section */}
            <div className="mb-10">
                <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Active Orders
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pendingOrders.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                            No active orders at the moment.
                        </div>
                    ) : (
                        pendingOrders.map(order => (
                            <OrderCard key={order.order_id} order={order} onUpdateStatus={handleStatusUpdate} onUpdateItemStatus={handleItemStatusUpdate} />
                        ))
                    )}
                </div>
            </div>

            {/* Completed History Section (Collapsible or just list recent) */}
            <div>
                <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Recent History
                </h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-600">Order ID</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Guest</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Room</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Date</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {completedOrders.slice(0, 5).map(order => (
                                <tr key={order.order_id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-mono">#{order.order_id}</td>
                                    <td className="px-6 py-3">{order.guest_name}</td>
                                    <td className="px-6 py-3">{order.room_number}</td>
                                    <td className="px-6 py-3">{new Date(order.order_date).toLocaleTimeString()}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.order_status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {order.order_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const OrderCard = ({ order, onUpdateStatus, onUpdateItemStatus }) => {
    // Calculate waiting time roughly
    const elapsedMinutes = Math.floor((new Date() - new Date(order.order_date)) / 60000);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full active-order-card">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-900">Order #{order.order_id}</span>
                        {elapsedMinutes > 30 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">Late</span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-bold rounded border ${order.dining_option === 'Dine-in'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                            {order.dining_option === 'Dine-in' ? '🍽️ Dine-in' : '🛵 Delivery'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {order.room_number !== 'N/A' ? `Room ${order.room_number}` : 'Lobby / N/A'} • {order.guest_name}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-mono text-slate-400 block">
                        {new Date(order.order_date).toLocaleTimeString()}
                    </span>
                    <span className={`text-xs font-bold ${order.order_status === 'Preparing' ? 'text-orange-600' : 'text-slate-500'}`}>
                        {order.order_status === 'Prepared' && order.dining_option === 'Dine-in'
                            ? 'Ready to Dine-in'
                            : order.order_status}
                    </span>
                </div>
            </div>

            <div className="flex-1 bg-slate-50 rounded-lg p-3 mb-4 space-y-2">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white rounded border border-slate-100 shadow-sm">
                        <div className="flex gap-2 items-center">
                            <span className="font-bold text-slate-700">{item.quantity}x</span>
                            <span className="text-slate-800">{item.item_name}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${item.item_status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                item.item_status === 'Preparing' ? 'bg-orange-100 text-orange-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {item.item_status}
                            </span>
                            {item.item_status === 'Pending' && (
                                <button
                                    onClick={() => onUpdateItemStatus(item.order_item_id, 'Preparing')}
                                    className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors text-xs"
                                    title="Start Preparing"
                                >
                                    Cook
                                </button>
                            )}
                            {item.item_status === 'Preparing' && (
                                <button
                                    onClick={() => onUpdateItemStatus(item.order_item_id, 'Completed')}
                                    className="p-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors text-xs"
                                    title="Mark Complete"
                                >
                                    Done
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
                {/* Show Completion Button ONLY if all items are completed or order is already marked Prepared */}
                {(order.order_status === 'Prepared' || order.items.every(i => i.item_status === 'Completed')) && (
                    <button
                        onClick={() => onUpdateStatus(order.order_id, 'Delivered')}
                        className={`w-full py-2 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${order.dining_option === 'Dine-in'
                                ? 'bg-purple-600 hover:bg-purple-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {order.dining_option === 'Dine-in' ? (
                            <>
                                <span>🍽️</span>
                                Dine-in Completed
                            </>
                        ) : (
                            <>
                                <span>🛵</span>
                                Delivery Completed
                            </>
                        )}
                    </button>
                )}
                {(order.order_status === 'Pending' || order.order_status === 'Preparing') && (
                    <div className="text-center text-xs text-slate-400">
                        Update individual items above to progress order
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitchenOrders;
