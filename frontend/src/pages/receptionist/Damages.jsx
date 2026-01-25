import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ReceptionistDamages = () => {
    const [damages, setDamages] = useState([]);
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        guest_id: '',
        damage_type: 'Room',
        description: '',
        charge_amount: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [damagesRes, guestsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/receptionist/damages', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/receptionist/guests', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setDamages(damagesRes.data);
            setGuests(guestsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/receptionist/damages',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Damage reported successfully');
            setFormData({ guest_id: '', damage_type: 'Room', description: '', charge_amount: '' });
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Error reporting damage:', error);
            toast.error('Failed to report damage');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Room Damages</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Report Damage Form */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold mb-4">Report New Damage</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Guest</label>
                                <select
                                    name="guest_id"
                                    value={formData.guest_id}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-primary-500 focus:border-primary-500"
                                    required
                                >
                                    <option value="">Select Guest</option>
                                    {guests.map(guest => (
                                        <option key={guest.guest_id} value={guest.guest_id}>
                                            {guest.guest_name} ({guest.guest_phone})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Type is fixed to Room for Receptionist */}
                            <input type="hidden" name="damage_type" value="Room" />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-primary-500 focus:border-primary-500"
                                    rows="3"
                                    required
                                    placeholder="Describe the damage..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs)</label>
                                <input
                                    type="number"
                                    name="charge_amount"
                                    value={formData.charge_amount}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-primary-500 focus:border-primary-500"
                                    required
                                    min="0"
                                    step="0.01"
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

                {/* Damages List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Guest</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {damages.map((damage) => (
                                        <tr key={damage.damage_id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-slate-600">{formatDate(damage.report_date)}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{damage.guest_name}</td>
                                            <td className="px-6 py-4 text-slate-600">{damage.damage_type}</td>
                                            <td className="px-6 py-4 text-slate-600 truncate max-w-xs">{damage.description}</td>
                                            <td className="px-6 py-4 text-slate-900 font-medium">Rs. {Number(damage.charge_amount).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                    ${damage.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {damage.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {damages.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                                No damage reports found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDamages;
