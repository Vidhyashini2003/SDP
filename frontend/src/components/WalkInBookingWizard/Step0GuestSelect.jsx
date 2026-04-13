import { useState, useEffect } from 'react';
import axios from '../../config/axios';

/**
 * Step0GuestSelect
 * Receptionist selects which registered guest to book for.
 */
const Step0GuestSelect = ({ selectedGuest, onSelectGuest, onNext }) => {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    // New guest state
    const [showNewForm, setShowNewForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newGuest, setNewGuest] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        nic_passport: '',
        nationality: 'Sri Lankan',
        nic_image: null
    });

    const fetchGuests = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/receptionist/guests');
            setGuests(res.data || []);
        } catch (err) {
            setError('Failed to load guests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuests();
    }, []);

    const handleCreateGuest = async (e) => {
        e.preventDefault();
        setCreating(true);

        const formData = new FormData();
        formData.append('first_name', newGuest.first_name);
        formData.append('last_name', newGuest.last_name);
        formData.append('email', newGuest.email);
        formData.append('phone', newGuest.phone);
        formData.append('nic_passport', newGuest.nic_passport);
        formData.append('nationality', newGuest.nationality);
        if (newGuest.nic_image) {
            formData.append('nic_image', newGuest.nic_image);
        }

        try {
            const res = await axios.post('/api/receptionist/walkin/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Select the new guest
            onSelectGuest(res.data.guest);
            setShowNewForm(false);
            // Refresh list in background
            fetchGuests();
            // Proceed automatically to room selection
            onNext();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to register guest');
        } finally {
            setCreating(false);
        }
    };

    const filtered = guests.filter(g => {
        const q = search.toLowerCase();
        return (
            (g.guest_name || '').toLowerCase().includes(q) ||
            (g.guest_email || '').toLowerCase().includes(q) ||
            (g.guest_phone || '').toLowerCase().includes(q) ||
            (g.guest_nic_passport || '').toLowerCase().includes(q)
        );
    });

    const handleNext = () => {
        if (!selectedGuest) {
            alert('Please select a guest to continue');
            return;
        }
        onNext();
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl shadow-lg shadow-slate-900/20">
                        👤
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 leading-tight">Walk-in Guest Selection</h2>
                        <p className="text-slate-500 text-sm mt-0.5">Pick an existing guest or book a room for new guest</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowNewForm(!showNewForm)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md ${
                        showNewForm 
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                        : 'bg-gold-500 text-white hover:bg-gold-600'
                    }`}
                >
                    {showNewForm ? '✕ Cancel' : '+ Register New Guest'}
                </button>
            </div>

            {/* New Guest Form */}
            {showNewForm && (
                <div className="mb-8 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Quick Booking</h3>
                    <form onSubmit={handleCreateGuest} className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">First Name</label>
                            <input
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-gold-500 text-sm"
                                placeholder="e.g. John"
                                value={newGuest.first_name}
                                onChange={e => setNewGuest({...newGuest, first_name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Last Name</label>
                            <input
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-gold-500 text-sm"
                                placeholder="e.g. Doe"
                                value={newGuest.last_name}
                                onChange={e => setNewGuest({...newGuest, last_name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email (Optional)</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-gold-500 text-sm"
                                placeholder="e.g. john@example.com"
                                value={newGuest.email}
                                onChange={e => setNewGuest({...newGuest, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phone Number</label>
                            <input
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-gold-500 text-sm"
                                placeholder="+94 XXXXXXXXX"
                                value={newGuest.phone}
                                onChange={e => setNewGuest({...newGuest, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">NIC / Passport Number</label>
                            <input
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-gold-500 text-sm"
                                placeholder="ID number"
                                value={newGuest.nic_passport}
                                onChange={e => setNewGuest({...newGuest, nic_passport: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nationality</label>
                            <input
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-gold-500 text-sm"
                                placeholder="e.g. Sri Lankan"
                                value={newGuest.nationality}
                                onChange={e => setNewGuest({...newGuest, nationality: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Upload NIC / Passport</label>
                            <input
                                required
                                type="file"
                                accept="image/*"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-gold-500 text-xs cursor-pointer file:mr-4 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-slate-900 file:text-white"
                                onChange={e => setNewGuest({...newGuest, nic_image: e.target.files[0]})}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            className="col-span-2 mt-2 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-gold-500 transition-all shadow-lg text-xs uppercase tracking-widest disabled:opacity-50"
                        >
                            {creating ? 'Processing...' : 'Select Guest'}
                        </button>
                    </form>
                </div>
            )}

            {!showNewForm && (
                <>
                {/* Search */}
                <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, email, phone or NIC..."
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-2xl outline-none focus:border-gold-500 focus:shadow-lg focus:shadow-gold-500/10 transition-all text-sm text-slate-700 bg-slate-50"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Guest list */}
                {loading ? (
                    <div className="text-center py-12 text-slate-400">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-3" />
                        Loading guests...
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-red-500 font-bold">{error}</div>
                ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {filtered.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">No guests found</p>
                        ) : (
                            filtered.map(guest => {
                                const isSelected = selectedGuest?.guest_id === guest.guest_id;
                                return (
                                    <button
                                        key={`${guest.type}-${guest.guest_id}`}
                                        onClick={() => onSelectGuest(guest)}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group
                                            ${isSelected
                                                ? 'border-gold-500 bg-gold-50 shadow-lg shadow-gold-500/10'
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0 transition-all
                                            ${isSelected ? 'bg-gold-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                            {(guest.guest_name || 'G').charAt(0).toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-black text-sm truncate ${isSelected ? 'text-gold-700' : 'text-slate-900'}`}>
                                                {guest.guest_name}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate mt-0.5">{guest.guest_email}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                {guest.guest_phone && (
                                                    <span className="text-[10px] text-slate-400 font-medium">📞 {guest.guest_phone}</span>
                                                )}
                                                {guest.guest_nic_passport && (
                                                    <span className="text-[10px] text-slate-400 font-medium">🪪 {guest.guest_nic_passport}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Check */}
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                                                ✓
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
                </>
            )}

            {/* Selected guest info bar */}
            {selectedGuest && (
                <div className="mt-6 p-4 bg-slate-900 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                        {(selectedGuest.guest_name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-black text-sm">{selectedGuest.guest_name}</p>
                        <p className="text-slate-400 text-[10px]">Guest selected — proceed to room selection</p>
                    </div>
                    <button
                        onClick={() => onSelectGuest(null)}
                        className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
                    >✕</button>
                </div>
            )}

            {/* Action */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={!selectedGuest || showNewForm}
                    className="px-10 py-4 bg-gold-500 hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all shadow-xl shadow-gold-500/20 uppercase tracking-widest text-sm transform active:scale-95"
                >
                    Continue to Room Selection →
                </button>
            </div>
        </div>
    );
};

export default Step0GuestSelect;
