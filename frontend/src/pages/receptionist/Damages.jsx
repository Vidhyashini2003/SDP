import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const DAMAGE_TYPES = ['Room', 'Food', 'Vehicle', 'Other'];

const TYPE_CONFIG = {
    Room:    { icon: '🏨', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    Food:    { icon: '🍽️', color: 'bg-green-100 text-green-700 border-green-200' },
    Vehicle: { icon: '🚗', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    Other:   { icon: '⚠️', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const ReceptionistDamages = () => {
    const [damages, setDamages] = useState([]);
    const [guests, setGuests] = useState([]);
    const [guestRooms, setGuestRooms] = useState([]); // rooms for selected guest only
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        guest_id: '',
        damage_type: 'Room',
        room_id: '',
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
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // When guest changes, load only their active room bookings
    const fetchGuestRooms = async (guestId) => {
        if (!guestId) { setGuestRooms([]); return; }
        setLoadingRooms(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/receptionist/bookings/rooms', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Show only current bookings: status is active AND today is within the stay dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const activeRooms = (res.data || []).filter(b => {
                if (String(b.guest_id) !== String(guestId)) return false;
                if (!['Booked', 'Checked-in'].includes(b.rb_status)) return false;
                const checkin  = new Date(b.rb_checkin);  checkin.setHours(0,0,0,0);
                const checkout = new Date(b.rb_checkout); checkout.setHours(0,0,0,0);
                return today >= checkin && today <= checkout;
            });
            setGuestRooms(activeRooms);
        } catch (err) {
            console.error('Failed to load guest rooms:', err);
            setGuestRooms([]);
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'damage_type' && value !== 'Room' ? { room_id: '' } : {})
        }));
        // When guest changes, fetch their rooms
        if (name === 'guest_id') {
            setGuestRooms([]);
            setFormData(prev => ({ ...prev, guest_id: value, room_id: '' }));
            fetchGuestRooms(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.guest_id) { toast.error('Please select a guest'); return; }
        if (!formData.description.trim()) { toast.error('Please enter a description'); return; }
        if (!formData.charge_amount || Number(formData.charge_amount) <= 0) { toast.error('Please enter a valid amount'); return; }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/receptionist/damages',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('✅ Damage reported. Guest has been notified with a payment request.');
            setFormData({ guest_id: '', damage_type: 'Room', room_id: '', description: '', charge_amount: '' });
            fetchData();
        } catch (error) {
            console.error('Error reporting damage:', error);
            toast.error('Failed to report damage');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-64">
            <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin mb-3"></div>
                <p className="text-slate-500">Loading damage reports...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Damage Reports</h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Report property damage — guests are notified immediately with a payment request
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Report Form ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                        <div className="bg-red-600 px-6 py-4">
                            <h2 className="text-white font-bold text-lg">⚠️ Report New Damage</h2>
                            <p className="text-red-100 text-xs mt-0.5">Guest will receive a payment notification immediately</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Guest */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Guest <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="guest_id"
                                    value={formData.guest_id}
                                    onChange={handleInputChange}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                                    required
                                >
                                    <option value="">— Select Guest —</option>
                                    {guests.map(g => (
                                        <option key={`${g.type || 'guest'}-${g.guest_id}`} value={g.guest_id}>
                                            {g.guest_name} {g.guest_phone ? `(${g.guest_phone})` : ''}{g.type === 'walkin' ? ' [Walk-in]' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Damage Type */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Damage Type <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {DAMAGE_TYPES.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => handleInputChange({ target: { name: 'damage_type', value: type } })}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                                formData.damage_type === type
                                                    ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-500 ring-offset-1'
                                                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span>{TYPE_CONFIG[type]?.icon}</span>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                {/* Hidden select to keep form data */}
                                <input type="hidden" name="damage_type" value={formData.damage_type} />
                            </div>

                            {/* Room dropdown — only rooms booked by selected guest */}
                            {formData.damage_type === 'Room' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Room <span className="text-red-500">*</span>
                                    </label>
                                    {loadingRooms ? (
                                        <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                                            <div className="w-4 h-4 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin"></div>
                                            Loading rooms...
                                        </div>
                                    ) : !formData.guest_id ? (
                                        <p className="text-xs text-slate-400 py-2">Select a guest first to see their booked rooms.</p>
                                    ) : guestRooms.length === 0 ? (
                                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            ⚠️ This guest has no active room bookings.
                                        </p>
                                    ) : (
                                        <select
                                            name="room_id"
                                            value={formData.room_id}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                                            required={formData.damage_type === 'Room'}
                                        >
                                            <option value="">— Select Room —</option>
                                            {guestRooms.map(b => (
                                                <option key={b.rb_id} value={b.room_id}>
                                                    Booking #{b.rb_id} — Room #{b.room_id} ({b.room_type})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    rows="3"
                                    required
                                    placeholder="Describe the damage in detail..."
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Charge Amount (Rs) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rs.</span>
                                    <input
                                        type="number"
                                        name="charge_amount"
                                        value={formData.charge_amount}
                                        onChange={handleInputChange}
                                        className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                        min="1"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>⚠️ Submit & Notify Guest</>
                                )}
                            </button>

                            <p className="text-xs text-slate-400 text-center">
                                📱 Guest will receive an instant payment notification
                            </p>
                        </form>
                    </div>
                </div>

                {/* ── Damage List ── */}
                <div className="lg:col-span-2">
                    {damages.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
                            <p className="text-3xl mb-3">✅</p>
                            <p className="text-slate-700 font-semibold">No damage reports yet</p>
                            <p className="text-slate-400 text-sm mt-1">Reports submitted will appear here</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-4 font-semibold text-slate-600">Date</th>
                                            <th className="px-5 py-4 font-semibold text-slate-600">Guest</th>
                                            <th className="px-5 py-4 font-semibold text-slate-600">Type</th>
                                            <th className="px-5 py-4 font-semibold text-slate-600">Room</th>
                                            <th className="px-5 py-4 font-semibold text-slate-600">Description</th>
                                            <th className="px-5 py-4 font-semibold text-slate-600">Amount</th>
                                            <th className="px-5 py-4 font-semibold text-slate-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {damages.map((damage) => {
                                            const cfg = TYPE_CONFIG[damage.damage_type] || TYPE_CONFIG.Other;
                                            return (
                                                <tr key={damage.damage_id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                                                        {formatDate(damage.report_date)}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-slate-900">{damage.guest_name}</p>
                                                        <p className="text-xs text-slate-400">{damage.guest_phone}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                                                            {cfg.icon} {damage.damage_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-600">
                                                        {damage.room_id ? `Room #${damage.room_id}` : '—'}
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-600 max-w-xs">
                                                        <p className="truncate">{damage.description}</p>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                                                        Rs. {Number(damage.charge_amount).toLocaleString()}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                            damage.status === 'Paid'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                            {damage.status === 'Paid' ? '✅ Paid' : '⏳ Pending'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDamages;
