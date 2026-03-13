import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const ChefDamages = () => {
    const [damages, setDamages] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        guest_id: '',
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
                axios.get('/api/chef/damages'),
                axios.get('/api/chef/orders')
            ]);

            const foodDamages = damagesRes.data.filter(d => d.damage_type === 'Food' || d.reported_by === 'chef');
            setDamages(foodDamages);

            setOrders(ordersRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
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
                guest_id: order.guest_id || '',
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
            await axios.post('/api/chef/damages', {
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
            fetchData();
        } catch (error) {
            console.error('Error reporting damage:', error);
            toast.error('Failed to report damage');
        }
    };

    if (loading) return <div className="p-8 text-slate-500 font-medium italic animate-pulse">Preparing damage reports...</div>;

    const recentOrders = orders.filter(o => o.order_status !== 'Pending');

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-slate-900">Culinary Incident Reports</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Report Form */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold mb-4 text-slate-800">Report Damage</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-1">Select Order (Guest)</label>
                                <select
                                    name="selected_order_id"
                                    value={formData.selected_order_id}
                                    onChange={handleOrderChange}
                                    className="w-full rounded-xl border-slate-300 focus:ring-gold-500 focus:border-gold-500 font-medium h-12"
                                    required
                                >
                                    <option value="">-- Select Order --</option>
                                    {recentOrders.map(order => (
                                        <option key={order.order_id} value={order.order_id}>
                                            #{order.order_id} - {order.guest_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full rounded-xl border-slate-300 focus:ring-gold-500 focus:border-gold-500 font-medium"
                                    rows="4"
                                    placeholder="Describe the incident..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-1">Charge Amount (Rs)</label>
                                <input
                                    type="number"
                                    name="charge_amount"
                                    value={formData.charge_amount}
                                    onChange={handleInputChange}
                                    className="w-full rounded-xl border-slate-300 focus:ring-gold-500 focus:border-gold-500 font-bold h-12"
                                    min="0"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                Submit Report
                            </button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Date</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Guest</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Description</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Amount</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {damages.map((damage) => (
                                    <tr key={damage.damage_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-500">{new Date(damage.report_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900">{damage.guest_name}</td>
                                        <td className="px-6 py-4 text-slate-600">{damage.description}</td>
                                        <td className="px-6 py-4 font-black text-slate-900">Rs. {damage.charge_amount?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${damage.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {damage.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {damages.length === 0 && (
                            <div className="p-16 text-center text-slate-400 italic font-medium">No culinary incidents reported.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChefDamages;
