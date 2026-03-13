import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const ChefMenu = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // New Item State
    const [newItem, setNewItem] = useState({
        item_name: '',
        item_price: '',
        item_availability: 'Available',
        item_image: ''
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await axios.get('/api/chef/menu');
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
            const formData = new FormData();
            formData.append('item_name', newItem.item_name);
            formData.append('item_price', newItem.item_price);
            formData.append('item_availability', newItem.item_availability);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            await axios.post('/api/chef/menu', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success('Menu item added');
            resetForm();
            fetchMenu();
        } catch (error) {
            toast.error('Failed to add item');
        }
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setNewItem({
            item_name: item.item_name,
            item_price: item.item_price,
            item_availability: item.item_availability,
            item_image: item.item_image
        });
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('item_name', newItem.item_name);
            formData.append('item_price', newItem.item_price);
            formData.append('item_availability', newItem.item_availability);
            if (imageFile) {
                formData.append('image', imageFile);
            } else {
                formData.append('item_image', newItem.item_image);
            }

            await axios.put(`/api/chef/menu/${editingItem.item_id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Menu item updated');
            resetForm();
            fetchMenu();
        } catch (error) {
            toast.error('Failed to update item');
        }
    };

    const resetForm = () => {
        setNewItem({ item_name: '', item_price: '', item_availability: 'Available', item_image: '' });
        setImageFile(null);
        setEditingItem(null);
        setIsAdding(false);
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this menu item?')) return;
        try {
            await axios.delete(`/api/chef/menu/${id}`);
            toast.success('Item deleted');
            fetchMenu();
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to delete item';
            toast.error(msg);
        }
    };

    const handleToggleAvailability = async (item) => {
        try {
            const newStatus = item.item_availability === 'Available' ? 'Unavailable' : 'Available';
            await axios.put(`/api/chef/menu/${item.item_id}`, {
                ...item,
                item_availability: newStatus
            });
            toast.success(`Marked as ${newStatus}`);
            fetchMenu();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <div className="p-8">Loading culinary menu...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Chef's Menu Management</h1>
                <button
                    onClick={() => {
                        if (isAdding) resetForm();
                        else setIsAdding(true);
                    }}
                    className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
                >
                    {isAdding ? 'Cancel' : '+ Add Item'}
                </button>
            </div>

            {/* Add Item Form */}
            {isAdding && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">
                        {editingItem ? `Edit ${editingItem.item_name}` : 'Add New Culinary Creation'}
                    </h3>
                    <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newItem.item_name}
                                    onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gold-500"
                                    placeholder="e.g. Signature Grilled Snapper"
                                />
                            </div>
                            <div className="w-full md:w-32">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Price (Rs.)</label>
                                <input
                                    type="number"
                                    required
                                    value={newItem.item_price}
                                    onChange={e => setNewItem({ ...newItem, item_price: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gold-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="w-full md:w-40">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Status</label>
                                <select
                                    value={newItem.item_availability}
                                    onChange={e => setNewItem({ ...newItem, item_availability: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gold-500"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Unavailable">Unavailable</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {editingItem ? 'Change Image' : 'Upload Image'}
                                </label>
                                <div className="flex items-center gap-4">
                                    {editingItem && newItem.item_image && !imageFile && (
                                        <div className="relative group">
                                            <img 
                                                src={newItem.item_image.startsWith('/') ? `${axios.defaults.baseURL}${newItem.item_image}` : newItem.item_image} 
                                                className="w-16 h-16 rounded-lg object-cover border border-slate-200" 
                                                alt="Current" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[8px] text-white font-bold uppercase">Current</span>
                                            </div>
                                        </div>
                                    )}
                                    {imageFile && (
                                        <div className="relative">
                                            <img 
                                                src={URL.createObjectURL(imageFile)} 
                                                className="w-16 h-16 rounded-lg object-cover border-2 border-gold-500 shadow-sm" 
                                                alt="New preview" 
                                            />
                                            <div className="absolute inset-0 bg-gold-500/10 rounded-lg flex items-center justify-center">
                                                <span className="text-[8px] text-gold-700 font-bold uppercase bg-white px-1 rounded">New</span>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setImageFile(e.target.files[0])}
                                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gold-500 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-auto mt-6 flex gap-2">
                                <button type="submit" className="flex-1 md:flex-none px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-md transition-all">
                                    {editingItem ? 'Update Item' : 'Save Item'}
                                </button>
                                {editingItem && (
                                    <button 
                                        type="button" 
                                        onClick={resetForm}
                                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Menu List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Item Name</th>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Price</th>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Status</th>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {menuItems.map((item) => (
                            <tr key={item.item_id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {item.item_image ? (
                                            <img 
                                                src={item.item_image.startsWith('/') ? `${axios.defaults.baseURL}${item.item_image}` : item.item_image} 
                                                alt={item.item_name} 
                                                className="w-12 h-12 rounded-lg object-cover border border-slate-200" 
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold">NO IMG</div>
                                        )}
                                        <div className="font-bold text-slate-900">{item.item_name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">Rs. {Number(item.item_price).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${item.item_availability === 'Available'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                        }`}>
                                        {item.item_availability}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleToggleAvailability(item)}
                                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md transition-all border ${item.item_availability === 'Available'
                                                ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                                                : 'text-green-600 border-green-200 hover:bg-green-50'
                                                }`}
                                        >
                                            {item.item_availability === 'Available' ? 'Not Available' : 'Available'}
                                        </button>
                                        <button
                                            onClick={() => handleEditClick(item)}
                                            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md transition-all border border-blue-200 text-blue-600 hover:bg-blue-50"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {menuItems.length === 0 && (
                    <div className="p-20 text-center text-slate-400 italic">
                        The Chef's menu is currently empty.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChefMenu;
