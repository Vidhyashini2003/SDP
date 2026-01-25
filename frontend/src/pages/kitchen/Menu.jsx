import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const KitchenMenu = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Item State
    const [newItem, setNewItem] = useState({
        item_name: '',
        item_price: '',
        item_availability: 'Available'
    });

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await axios.get('/api/kitchen/menu');
            setMenuItems(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching menu:', error);
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/kitchen/menu', newItem);
            toast.success('Menu item added');
            setNewItem({ item_name: '', item_price: '', item_availability: 'Available' });
            setIsAdding(false);
            fetchMenu();
        } catch (error) {
            toast.error('Failed to add item');
        }
    };

    const handleToggleAvailability = async (item) => {
        try {
            const newStatus = item.item_availability === 'Available' ? 'Unavailable' : 'Available';
            await axios.put(`/api/kitchen/menu/${item.item_id}`, {
                ...item,
                item_availability: newStatus
            });
            toast.success(`Marked as ${newStatus}`);
            fetchMenu();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <div className="p-8">Loading menu...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Menu Management</h1>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                    {isAdding ? 'Cancel' : '+ Add Item'}
                </button>
            </div>

            {/* Add Item Form */}
            {isAdding && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">Add New Menu Item</h3>
                    <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                            <input
                                type="text"
                                required
                                value={newItem.item_name}
                                onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Grilled Chicken"
                            />
                        </div>
                        <div className="w-full md:w-32">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price (Rs.)</label>
                            <input
                                type="number"
                                required
                                value={newItem.item_price}
                                onChange={e => setNewItem({ ...newItem, item_price: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="w-full md:w-40">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                value={newItem.item_availability}
                                onChange={e => setNewItem({ ...newItem, item_availability: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Available">Available</option>
                                <option value="Unavailable">Unavailable</option>
                            </select>
                        </div>
                        <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
                            Save
                        </button>
                    </form>
                </div>
            )}

            {/* Menu List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600">Item Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Price</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {menuItems.map((item) => (
                            <tr key={item.item_id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{item.item_name}</td>
                                <td className="px-6 py-4 text-slate-600">Rs. {Number(item.item_price).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.item_availability === 'Available'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {item.item_availability}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleToggleAvailability(item)}
                                        className={`text-sm font-medium ${item.item_availability === 'Available'
                                                ? 'text-red-600 hover:text-red-700'
                                                : 'text-green-600 hover:text-green-700'
                                            }`}
                                    >
                                        {item.item_availability === 'Available' ? 'Mark Unavailable' : 'Mark Available'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default KitchenMenu;
