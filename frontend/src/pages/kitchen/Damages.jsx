import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const KitchenDamages = () => {
    const [damages, setDamages] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        guest_id: '', // Will be set when Order is selected
        selected_order_id: '',
        damage_type: 'Food',
        description: '',
        charge_amount: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [damagesRes, ordersRes] = await Promise.all([
                axios.get('/api/kitchen/damages'),
                axios.get('/api/kitchen/orders')
            ]);

            const foodDamages = damagesRes.data.filter(d => d.damage_type === 'Food' || d.reported_by === 'kitchen');
            setDamages(foodDamages);

            setOrders(ordersRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            // toast.error('Failed to load data');
            setLoading(false);
        }
    };

    const handleOrderChange = (e) => {
        const orderId = Number(e.target.value);
        const order = orders.find(o => o.order_id === orderId);
        if (order) {
            setFormData({
                ...formData,
                selected_order_id: orderId,
                guest_id: order.guest_id || '', // Ensure we have guest info in order object!
                // guest_name is available in order object from getAllOrders controller
            });
        } else {
            setFormData({ ...formData, selected_order_id: '', guest_id: '' });
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.guest_id) {
            toast.error('Please select a valid order with a guest.');
            return;
        }

        try {
            // Post to kitchen damages endpoint
            await axios.post('/api/kitchen/damages', {
                guest_id: formData.guest_id,
                damage_type: 'Food',
                description: `Order #${formData.selected_order_id}: ${formData.description}`,
                charge_amount: formData.charge_amount
            });

            toast.success('Damage reported successfully');
            setFormData({
                guest_id: '',
                selected_order_id: '',
                damage_type: 'Food',
                description: '',
                charge_amount: ''
            });
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Error reporting damage:', error);
            toast.error('Failed to report damage. Check permissions.');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    // Filter relevant orders (e.g. Delivered/Prepared ones where damage is likely found)
    const recentOrders = orders.filter(o => o.order_status !== 'Pending');

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Food Order Damages</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Report Form */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold mb-4">Report New Damage</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Order (Guest)</label>
                                <select
                                    name="selected_order_id"
                                    value={formData.selected_order_id}
                                    onChange={handleOrderChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">-- Select Order --</option>
                                    {recentOrders.map(order => (
                                        <option key={order.order_id} value={order.order_id}>
                                            #{order.order_id} - {order.guest_name} (Room {order.room_number})
                                        </option>
                                    ))}
                                </select>
                                {formData.selected_order_id && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        Selected: Order #{formData.selected_order_id} (Guest ID: {formData.guest_id || 'Missing'})
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                    rows="3"
                                    placeholder="Plate broken, glass smashed, etc."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs)</label>
                                <input
                                    type="number"
                                    name="charge_amount"
                                    value={formData.charge_amount}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors"
                            >
                                Submit Report
                            </button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Guest</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {damages.map((damage) => (
                                    <tr key={damage.damage_id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-600">{new Date(damage.report_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{damage.guest_name}</td>
                                        <td className="px-6 py-4 text-slate-600">{damage.description}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">Rs. {damage.charge_amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${damage.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {damage.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {damages.length === 0 && (
                            <div className="p-8 text-center text-slate-500">No reported damages found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KitchenDamages;
