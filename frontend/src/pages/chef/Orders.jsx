import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ChefOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { user } = useAuth();

    useEffect(() => {
        fetchOrders(selectedDate);
        const interval = setInterval(() => fetchOrders(selectedDate), 30000);
        return () => clearInterval(interval);
    }, [selectedDate]);

    const fetchOrders = async (date) => {
        try {
            const res = await axios.get(`/api/chef/orders?date=${date}`);
            setOrders(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    const handleStartCooking = async (orderId) => {
        try {
            await axios.put(`/api/chef/orders/${orderId}/start-cooking`);
            toast.success('You have started cooking this order!');
            fetchOrders();
        } catch (error) {
            console.error('Error starting cooking:', error);
            toast.error(error.response?.data?.error || 'Failed to start cooking');
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await axios.put(`/api/chef/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order marked as ${newStatus}`);
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleItemStatusUpdate = async (itemId, newStatus) => {
        try {
            await axios.put(`/api/chef/orders/items/${itemId}/status`, { status: newStatus });
            toast.success(`Item marked as ${newStatus}`);
            fetchOrders();
        } catch (error) {
            console.error('Error updating item status:', error);
            toast.error('Failed to update item status');
        }
    };

    if (loading) return <div className="p-8">Loading culinary missions...</div>;

    // Orders are already filtered by date from the backend
    const activeOrders = orders.filter(o => o.order_status === 'Pending' || o.order_status === 'Preparing' || o.order_status === 'Prepared');
    const historyOrders = orders.filter(o => o.order_status === 'Delivered' || o.order_status === 'Cancelled' || o.order_status === 'Incomplete');

    const recentHistory = historyOrders.slice(0, 10);

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Culinary Dashboard</h1>
                    <p className="text-slate-500 text-sm font-medium">Managing scheduled meals for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-full md:w-auto">
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="p-2 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none border border-slate-100 focus:ring-2 focus:ring-gold-500/20 text-sm"
                    />
                    <button 
                        onClick={() => fetchOrders(selectedDate)} 
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-lg shadow-slate-900/10 font-bold flex items-center gap-2 text-sm"
                    >
                        <span>🔄</span> Refresh
                    </button>
                </div>
            </div>

            {/* Active Orders Section */}
            <div className="mb-10">
                <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    Live Orders
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeOrders.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                            <span className="text-4xl block mb-4">🍳</span>
                            <p className="text-slate-500 font-medium italic">No pending orders for today. Take a break, Chef!</p>
                        </div>
                    ) : (
                        activeOrders.map(order => (
                            <OrderCard 
                                key={order.order_id} 
                                order={order} 
                                currentUser={user}
                                onStartCooking={handleStartCooking}
                                onUpdateStatus={handleStatusUpdate} 
                                onUpdateItemStatus={handleItemStatusUpdate} 
                            />
                        ))
                    )}
                </div>
            </div>

            {/* History Section */}
            <div>
                <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Recently Completed
                </h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-600">Order ID</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Guest</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Room</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Scheduled Date</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Assigned Chef</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Total</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentHistory.map(order => (
                                <tr key={order.order_id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-mono">#{order.order_id}</td>
                                    <td className="px-6 py-3 font-medium">{order.guest_name}</td>
                                    <td className="px-6 py-3">Room {order.room_number || 'N/A'}</td>
                                    <td className="px-6 py-3 text-[10px] font-black uppercase text-gold-600">
                                        {new Date(order.scheduled_date).toLocaleDateString()} • {order.meal_type}
                                    </td>
                                    <td className="px-6 py-3 text-slate-500">{order.chef_name || 'System / Auto'}</td>
                                    <td className="px-6 py-3 font-bold">Rs. {order.total_amount?.toLocaleString()}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            order.order_status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                                            order.order_status === 'Prepared' ? 'bg-blue-100 text-blue-700' :
                                            order.order_status === 'Incomplete' ? 'bg-red-100 text-red-800' :
                                            order.order_status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-600'
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

const OrderCard = ({ order, currentUser, onStartCooking, onUpdateStatus, onUpdateItemStatus }) => {
    const elapsedMinutes = Math.floor((new Date() - new Date(order.order_date)) / 60000);
    const isAssignedToMe = order.assigned_chef_id === currentUser.id;
    const isAssignedToOther = order.assigned_chef_id && order.assigned_chef_id !== currentUser.id;

    return (
        <div className={`bg-white rounded-2xl shadow-sm border p-5 flex flex-col h-full transition-all ${
            isAssignedToMe ? 'border-gold-300 ring-2 ring-gold-100 shadow-md' : 'border-slate-200'
        }`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-slate-900">Order #{order.order_id}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-widest border ${
                            order.meal_type === 'Breakfast' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                            order.meal_type === 'Lunch' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                            {order.meal_type}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                        {order.room_number !== 'N/A' ? `Room ${order.room_number}` : 'Lobby'} • {order.guest_name}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                         {order.dining_option}
                    </span>
                    {elapsedMinutes > 30 && order.order_status !== 'Prepared' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded">Delay</span>
                    )}
                </div>
            </div>

            {/* Assignment Status */}
            <div className="mb-4">
                {order.order_status === 'Pending' ? (
                    <button
                        onClick={() => onStartCooking(order.order_id)}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 group"
                    >
                        <span className="text-lg group-hover:scale-125 transition-transform">👨‍🍳</span>
                        Start Cooking
                    </button>
                ) : (
                    <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                        isAssignedToMe ? 'bg-gold-50 border-gold-200 text-gold-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                        <span className="text-lg">👨‍🍳</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black leading-none mb-1">Assigned Chef</span>
                            <span className="text-sm font-bold">
                                {isAssignedToMe ? 'You (Active)' : order.chef_name || 'Another Chef'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 bg-slate-50 rounded-xl p-3 mb-4 space-y-2">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                        <div className="flex gap-2 items-center">
                            <span className="font-bold text-slate-900">{item.quantity}x</span>
                            <span className="text-slate-700 font-medium">{item.item_name}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider ${
                                item.item_status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                item.item_status === 'Preparing' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                            }`}>
                                {item.item_status}
                            </span>
                            
                            {/* Only the assigned chef can update items */}
                            {isAssignedToMe && (
                                <>
                                    {item.item_status === 'Pending' && (
                                        <button
                                            onClick={() => onUpdateItemStatus(item.order_item_id, 'Preparing')}
                                            className="w-8 h-8 flex items-center justify-center bg-gold-100 hover:bg-gold-200 text-gold-700 rounded-lg transition-colors"
                                            title="Start Preparing"
                                        >
                                            👨‍🍳
                                        </button>
                                    )}
                                    {item.item_status === 'Preparing' && (
                                        <button
                                            onClick={() => onUpdateItemStatus(item.order_item_id, 'Completed')}
                                            className="w-8 h-8 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                            title="Mark Complete"
                                        >
                                            ✅
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
                {isAssignedToMe ? (
                    <>
                        {(order.order_status === 'Prepared' || order.items.every(i => i.item_status === 'Completed')) && (
                            <button
                                onClick={() => onUpdateStatus(order.order_id, 'Delivered')}
                                className={`w-full py-3 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                                    order.dining_option === 'Dine-in' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {order.dining_option === 'Dine-in' ? (
                                    <><span>🍽️</span> Dine-in Completed</>
                                ) : (
                                    <><span>🛵</span> Delivery Completed</>
                                )}
                            </button>
                        )}
                        {order.order_status === 'Preparing' && !order.items.every(i => i.item_status === 'Completed') && (
                            <div className="text-center text-xs text-gold-600 font-bold bg-gold-50 py-2 rounded-lg">
                                Complete all items to finish order
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-[10px] text-slate-400 uppercase font-black tracking-widest">
                        {isAssignedToOther ? `Busy with ${order.chef_name}` : 'Awaiting assignment'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChefOrders;
