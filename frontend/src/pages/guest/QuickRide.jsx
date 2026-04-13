import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapPinIcon, TruckIcon, ClockIcon } from '@heroicons/react/24/outline';

const VEHICLE_TYPES = ['Van', 'Mini Van', 'Car', 'Jeep', 'Three Wheeler'];

const QuickRide = () => {
    const navigate = useNavigate();
    const [searchParamsUrl] = useSearchParams();
    const urlLinkedRbId = searchParamsUrl.get('rb_id');

    const [form, setForm] = useState({
        pickup_location: '',
        vehicle_type_requested: 'Car',
        scheduled_at: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [activeBookings, setActiveBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [hasActiveBooking, setHasActiveBooking] = useState(false);
    const [loading, setLoading] = useState(true);
    const [vehiclePrices, setVehiclePrices] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [bookingsRes, vehiclesRes] = await Promise.all([
                axios.get('/api/guest/bookings/active'),
                axios.get('/api/bookings/vehicles/available', { params: { date: new Date().toISOString().split('T')[0], days: 1 } }).catch(() => ({ data: [] }))
            ]);
            const bookingsData = bookingsRes.data;
            setHasActiveBooking(bookingsData.hasActiveBooking);
            setActiveBookings(bookingsData.bookings || []);
            if (bookingsData.bookings && bookingsData.bookings.length > 0) {
                const targetId = urlLinkedRbId ? parseInt(urlLinkedRbId, 10) : bookingsData.bookings[0].rb_id;
                setSelectedBooking(targetId);
            }
            setVehiclePrices(vehiclesRes.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.pickup_location.trim()) {
            toast.error('Please enter a pickup location.');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                rb_id: urlLinkedRbId || selectedBooking || null,
                scheduled_at: form.scheduled_at || null,
            };
            const res = await axios.post('/api/guest/quickrides', payload);
            toast.success(res.data.message || 'Quick Ride requested!');
            setForm({ pickup_location: '', vehicle_type_requested: 'Car', scheduled_at: '' });
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to request ride';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const getPriceInfo = (vtype) => {
        const v = vehiclePrices.find(x => x.vehicle_type?.toLowerCase() === vtype?.toLowerCase());
        return v ? { per_km: v.vehicle_price_per_km, waiting: v.waiting_time_price_per_hour } : null;
    };

    // Helper to format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const toLocalDateTimeStr = (d, isMax = false) => {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hh = isMax ? '23' : '00';
        const mm = isMax ? '59' : '00';
        return `${y}-${m}-${day}T${hh}:${mm}`;
    };

    if (loading) return <div className="flex items-center justify-center p-16"><div className="w-10 h-10 border-4 border-gold-200 border-t-gold-600 rounded-full animate-spin"></div></div>;

    if (!hasActiveBooking && !urlLinkedRbId) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-md text-center shadow-xl">
                    <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TruckIcon className="w-8 h-8 text-gold-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Room Booking Required</h2>
                    <p className="text-slate-500 mb-6">You need an active room booking to use Quick Ride.</p>
                    <button onClick={() => navigate('/guest/rooms')} className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 rounded-xl transition-colors">
                        Book a Room First
                    </button>
                </div>
            </div>
        );
    }

    const priceInfo = getPriceInfo(form.vehicle_type_requested);
    const currentBooking = activeBookings.find(b => b.rb_id === selectedBooking);
    const minDateTime = currentBooking ? toLocalDateTimeStr(currentBooking.check_in_date) : '';
    const maxDateTime = currentBooking ? toLocalDateTimeStr(currentBooking.check_out_date, true) : '';

    return (
        <div className="p-6 md:p-10 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-gold-50 border border-gold-200 px-4 py-1.5 rounded-full mb-4">
                    <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></div>
                    <span className="text-[11px] font-black text-gold-700 uppercase tracking-[0.15em]">On-Demand</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quick <span className="text-gold-500">Ride</span></h1>
                <p className="text-slate-500 mt-1 font-medium">Book a ride instantly — pay after completion based on km & time</p>
            </div>

            {/* Linked Booking Banner */}
            {activeBookings.length > 0 && (
                <div className="mb-6 p-4 bg-slate-900 text-white rounded-2xl flex items-center gap-3">
                    <div className="w-9 h-9 bg-gold-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-lg">🏨</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Stay</p>
                        {activeBookings.length === 1 ? (
                            <p className="font-bold text-sm truncate">{activeBookings[0].room_type} Room</p>
                        ) : (
                            <select
                                value={selectedBooking}
                                onChange={e => setSelectedBooking(parseInt(e.target.value))}
                                className="bg-transparent text-sm font-bold text-white outline-none w-full"
                            >
                                {activeBookings.map(b => (
                                    <option key={b.rb_id} value={b.rb_id} className="text-slate-900">{b.room_type} Room #{b.rb_id}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Vehicle Type */}
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Select Vehicle Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {VEHICLE_TYPES.map(vt => {
                            const isActive = form.vehicle_type_requested === vt;
                            const icon = vt === 'Van' ? '🚐' : vt === 'Mini Van' ? '🚌' : vt === 'Car' ? '🚗' : vt === 'Jeep' ? '🚙' : '🛺';
                            return (
                                <button
                                    key={vt}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, vehicle_type_requested: vt }))}
                                    className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${isActive
                                        ? 'bg-gold-500 border-gold-500 text-white shadow-lg shadow-gold-500/25 scale-[1.02]'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-gold-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">{icon}</div>
                                    <p className="text-xs font-black uppercase tracking-wide">{vt}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Pricing Info */}
                {priceInfo && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <TruckIcon className="w-4 h-4 text-gold-500" />
                            <span className="text-slate-500">Per KM:</span>
                            <span className="font-black text-slate-900">Rs. {priceInfo.per_km}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-gold-500" />
                            <span className="text-slate-500">Waiting/hr:</span>
                            <span className="font-black text-slate-900">Rs. {priceInfo.waiting}</span>
                        </div>
                    </div>
                )}

                {/* Pickup */}
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Pickup Location</label>
                    <div className="relative">
                        <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                        <input
                            type="text"
                            required
                            placeholder="e.g. Hotel Lobby, Galle Face Hotel..."
                            value={form.pickup_location}
                            onChange={e => setForm(f => ({ ...f, pickup_location: e.target.value }))}
                            className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-gold-100 focus:border-gold-500 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Optional Scheduled Time */}
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                        Scheduled Pickup Time <span className="text-slate-400 font-normal normal-case">(optional — leave blank for ASAP)</span>
                    </label>
                    <input
                        type="datetime-local"
                        min={minDateTime}
                        max={maxDateTime}
                        value={form.scheduled_at}
                        onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                        className="w-full px-4 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-gold-100 focus:border-gold-500 outline-none transition-all text-sm font-medium"
                    />
                </div>

                {/* Fare Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800 space-y-1.5">
                    <p className="font-black text-blue-900 flex items-center gap-2">💡 How Fare Works</p>
                    <p>1. Your vehicle is reserved now — <strong>no upfront payment.</strong></p>
                    <p>2. After the trip, your driver enters the actual KM and waiting time.</p>
                    <p>3. You'll receive a notification with the fare total.</p>
                    <p>4. You pay from your <strong>My Bookings</strong> page.</p>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-5 bg-gold-500 hover:bg-gold-600 text-white font-black rounded-2xl shadow-xl shadow-gold-500/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:grayscale text-lg tracking-wide"
                >
                    {submitting ? 'Requesting...' : '🚗 Request Quick Ride'}
                </button>
            </form>
        </div>
    );
};

export default QuickRide;
