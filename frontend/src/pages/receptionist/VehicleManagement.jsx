import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const VehicleManagement = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [formData, setFormData] = useState({
        vehicle_type: '',
        vehicle_price_per_day: '',
        vehicle_price_per_km: '',
        waiting_time_price_per_hour: '',
        vehicle_status: 'Available',
        vehicle_image: ''
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await axios.get('/api/receptionist/vehicles');
            setVehicles(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('vehicle_type', formData.vehicle_type);
            data.append('vehicle_price_per_day', formData.vehicle_price_per_day);
            data.append('vehicle_price_per_km', formData.vehicle_price_per_km);
            data.append('waiting_time_price_per_hour', formData.waiting_time_price_per_hour);
            data.append('vehicle_status', formData.vehicle_status);
            if (imageFile) {
                data.append('image', imageFile);
            } else if (formData.vehicle_image) {
                data.append('vehicle_image', formData.vehicle_image);
            }

            if (editingItem) {
                await axios.put(`/api/receptionist/manage/vehicles/${editingItem.vehicle_id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Vehicle updated successfully');
            } else {
                await axios.post('/api/receptionist/manage/vehicles', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Vehicle added successfully');
            }
            resetForm();
            fetchVehicles();
        } catch (error) {
            toast.error(editingItem ? 'Failed to update vehicle' : 'Failed to add vehicle');
        }
    };

    const handleEdit = (vehicle) => {
        setEditingItem(vehicle);
        setFormData({
            vehicle_type: vehicle.vehicle_type,
            vehicle_price_per_day: vehicle.vehicle_price_per_day,
            vehicle_price_per_km: vehicle.vehicle_price_per_km,
            waiting_time_price_per_hour: vehicle.waiting_time_price_per_hour,
            vehicle_status: vehicle.vehicle_status,
            vehicle_image: vehicle.vehicle_image || ''
        });
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
        try {
            await axios.delete(`/api/receptionist/manage/vehicles/${id}`);
            toast.success('Vehicle deleted');
            fetchVehicles();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete vehicle');
        }
    };

    const resetForm = () => {
        setFormData({ 
            vehicle_type: '', 
            vehicle_price_per_day: '', 
            vehicle_price_per_km: '',
            waiting_time_price_per_hour: '',
            vehicle_status: 'Available', 
            vehicle_image: '' 
        });
        setImageFile(null);
        setEditingItem(null);
        setIsAdding(false);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading vehicles...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Vehicle Management</h2>
                <button
                    onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }}
                    className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
                >
                    {isAdding ? 'Cancel' : '+ Add Vehicle'}
                </button>
            </div>

            {isAdding && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">
                        {editingItem ? `Edit ${editingItem.vehicle_type}` : 'Add New Vehicle'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.vehicle_type}
                                    onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gold-500"
                                    placeholder="e.g. Van, Car"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Price/Day (Rs.)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.vehicle_price_per_day}
                                    onChange={e => setFormData({ ...formData, vehicle_price_per_day: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gold-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Price/KM (Rs.)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.vehicle_price_per_km}
                                    onChange={e => setFormData({ ...formData, vehicle_price_per_km: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gold-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Waiting Fee/Hr (Rs.)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.waiting_time_price_per_hour}
                                    onChange={e => setFormData({ ...formData, waiting_time_price_per_hour: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gold-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.vehicle_status}
                                    onChange={e => setFormData({ ...formData, vehicle_status: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gold-500"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Unavailable">Unavailable</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{editingItem ? 'Change Image' : 'Upload Image'}</label>
                            <div className="flex items-center gap-4">
                                {editingItem && formData.vehicle_image && !imageFile && (
                                    <img
                                        src={formData.vehicle_image.startsWith('/') ? `${axios.defaults.baseURL}${formData.vehicle_image}` : formData.vehicle_image}
                                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                                        alt="Current"
                                    />
                                )}
                                {imageFile && (
                                    <img
                                        src={URL.createObjectURL(imageFile)}
                                        className="w-12 h-12 rounded-lg object-cover border-2 border-gold-500"
                                        alt="Preview"
                                    />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setImageFile(e.target.files[0])}
                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg outline-none file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gold-50 file:text-gold-700"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-md">
                                {editingItem ? 'Update Vehicle' : 'Save Vehicle'}
                            </button>
                            {editingItem && (
                                <button type="button" onClick={resetForm} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Vehicle</th>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Type</th>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Price/Day</th>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Price/KM</th>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Waiting/Hr</th>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest">Status</th>
                            <th className="px-6 py-4 font-bold text-slate-600 uppercase text-[10px] tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vehicles.map(vehicle => (
                            <tr key={vehicle.vehicle_id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {vehicle.vehicle_image ? (
                                            <img
                                                src={vehicle.vehicle_image.startsWith('/') ? `${axios.defaults.baseURL}${vehicle.vehicle_image}` : vehicle.vehicle_image}
                                                alt={vehicle.vehicle_type}
                                                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold">NO IMG</div>
                                        )}
                                        <span className="font-medium text-slate-700">Vehicle #{vehicle.vehicle_id}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900">{vehicle.vehicle_type}</td>
                                <td className="px-6 py-4 text-slate-600">Rs. {Number(vehicle.vehicle_price_per_day).toLocaleString()}</td>
                                <td className="px-6 py-4 text-slate-600 font-medium">Rs. {Number(vehicle.vehicle_price_per_km).toLocaleString()}</td>
                                <td className="px-6 py-4 text-slate-600 font-medium">Rs. {Number(vehicle.waiting_time_price_per_hour).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                        vehicle.vehicle_status === 'Available' ? 'bg-green-100 text-green-700 border border-green-200' :
                                        vehicle.vehicle_status === 'Maintenance' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                        'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                        {vehicle.vehicle_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(vehicle)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(vehicle.vehicle_id)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {vehicles.length === 0 && (
                    <div className="p-20 text-center text-slate-400 italic">No vehicles found.</div>
                )}
            </div>
        </div>
    );
};

export default VehicleManagement;
