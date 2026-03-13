import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';
import DemoPaymentGateway from '../../components/DemoPaymentGateway';

const getLocalDateStr = (dInput) => {
    const d = new Date(dInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Parses YYYY-MM-DD into a strict UTC midnight timestamp
const parseYMD = (ymdStr) => {
    if (!ymdStr) return 0;
    const [y, m, d] = ymdStr.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
};

const ExtendRoomBooking = () => {
    const [searchParams] = useSearchParams();
    const rb_id = searchParams.get('rb_id');
    const navigate = useNavigate();

    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newCheckOut, setNewCheckOut] = useState('');
    const [extending, setExtending] = useState(false);
    const [extraCost, setExtraCost] = useState(0);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        if (!rb_id) {
            toast.error('No booking selected to extend');
            navigate('/guest/my-bookings');
            return;
        }
        fetchTripDetails();
    }, [rb_id]);

    const fetchTripDetails = async () => {
        try {
            const res = await axios.get('/api/guest/bookings/grouped');
            const targetTrip = res.data.find(t => t.rb_id === parseInt(rb_id));
            if (!targetTrip) {
                toast.error('Booking not found');
                navigate('/guest/my-bookings');
                return;
            }
            setTrip(targetTrip);
            
            // Set default next day
            const currentOut = new Date(targetTrip.check_out_date);
            currentOut.setDate(currentOut.getDate() + 1);
            setNewCheckOut(getLocalDateStr(currentOut));

        } catch (error) {
            console.error('Error fetching trip:', error);
            toast.error('Failed to load booking details');
            navigate('/guest/my-bookings');
        } finally {
            setLoading(false);
        }
    };

    // Calculate extra cost when date changes
    useEffect(() => {
        if (trip && newCheckOut) {
            const oldOutStr = getLocalDateStr(trip.check_out_date);
            const oldInStr = getLocalDateStr(trip.check_in_date);
            
            const oldOutUTC = parseYMD(oldOutStr);
            const oldInUTC = parseYMD(oldInStr);
            const newOutUTC = parseYMD(newCheckOut);
            
            if (newOutUTC > oldOutUTC) {
                const extraNights = Math.round((newOutUTC - oldOutUTC) / (1000 * 60 * 60 * 24));
                const originalNights = Math.max(1, Math.round((oldOutUTC - oldInUTC) / (1000 * 60 * 60 * 24)));
                const dailyRate = trip.total_price / originalNights;
                
                setExtraCost(dailyRate * extraNights);
            } else {
                setExtraCost(0);
            }
        }
    }, [newCheckOut, trip]);

    const handleExtend = () => {
        const oldOutUTC = parseYMD(getLocalDateStr(trip.check_out_date));
        const newOutUTC = parseYMD(newCheckOut);
        
        if (newOutUTC <= oldOutUTC) {
            return toast.error('New checkout date must be after your current checkout date.');
        }

        setIsPaymentModalOpen(true);
    };

    const confirmExtensionAction = async () => {
        setExtending(true);
        try {
            await axios.put(`/api/bookings/rooms/${rb_id}/extend`, {
                newCheckOut: newCheckOut,
                extraAmount: extraCost
            });
            toast.success('Room booking extended successfully!');
            navigate('/guest/my-bookings');
        } catch (error) {
            console.error('Extension error:', error);
            toast.error(error.response?.data?.error || 'Failed to extend room. The room might be booked by someone else for those dates.');
        } finally {
            setExtending(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="w-10 h-10 border-4 border-gold-200 border-t-gold-600 rounded-full animate-spin"></div>
        </div>
    );

    if (!trip) return null;

    const minDateString = getLocalDateStr(trip.check_out_date);

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gold-50 p-6 border-b border-gold-100 items-center justify-between flex">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Extend Your Stay</h1>
                        <p className="text-slate-600 text-sm mt-1">Add more days to your current booking</p>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    {/* Current Trip Summary */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Current Booking Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Room</p>
                                <p className="font-semibold text-slate-900">{trip.room_type} ({trip.room_number})</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Check-in</p>
                                <p className="font-semibold text-slate-900">{new Date(trip.check_in_date).toDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Current Check-out</p>
                                <p className="font-semibold text-rose-600">{new Date(trip.check_out_date).toDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Current Total</p>
                                <p className="font-semibold text-slate-900">Rs. {trip.total_price}</p>
                            </div>
                        </div>
                    </div>

                    {/* Extension Form */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Select New Check-out Date</label>
                        <input
                            type="date"
                            value={newCheckOut}
                            min={minDateString}
                            onChange={(e) => setNewCheckOut(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none text-slate-900 font-medium"
                        />
                        <p className="text-xs text-slate-500 mt-2">You can only extend from your current check-out date onwards.</p>
                    </div>

                    {/* Cost Summary */}
                    {extraCost > 0 && (
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                            <div>
                                <p className="text-emerald-800 font-medium">Extra Cost</p>
                                <p className="text-xs text-emerald-600">Based on your original daily rate</p>
                            </div>
                            <p className="text-xl font-bold text-emerald-700">+ Rs. {extraCost.toFixed(2)}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => navigate('/guest/my-bookings')}
                            className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExtend}
                            disabled={extending || extraCost <= 0}
                            className="flex-1 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {extending ? 'Checking Availability...' : 'Confirm Extension'}
                        </button>
                    </div>
                </div>
            </div>
            <DemoPaymentGateway 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentSuccess={confirmExtensionAction}
                amount={extraCost}
            />
        </div>
    );
};

export default ExtendRoomBooking;
