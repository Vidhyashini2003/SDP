import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

export const ExtendStayModal = ({ isOpen, onClose, booking, onProceed }) => {
    const [newCheckOut, setNewCheckOut] = useState('');
    const [extraAmount, setExtraAmount] = useState(0);

    useEffect(() => {
        if (newCheckOut && booking) {
            const currentOut = new Date(booking.rb_checkout);
            const proposedOut = new Date(newCheckOut);
            const diffDays = Math.ceil((proposedOut - currentOut) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
                setExtraAmount(diffDays * parseFloat(booking.room_price_per_day));
            } else {
                setExtraAmount(0);
            }
        }
    }, [newCheckOut, booking]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-slate-900 px-6 py-6 text-white text-center">
                    <div className="text-3xl mb-2">📅</div>
                    <h3 className="font-black text-xl uppercase tracking-wider">Extend Stay</h3>
                    <p className="text-slate-400 text-xs mt-1">Booking #{booking.rb_id} — {booking.guest_name}</p>
                </div>
                
                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">New Checkout Date</label>
                        <input 
                            type="date" 
                            min={new Date(new Date(booking.rb_checkout).getTime() + 86400000).toISOString().split('T')[0]}
                            value={newCheckOut}
                            onChange={(e) => setNewCheckOut(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-gold-500 outline-none transition-all font-bold text-slate-800"
                        />
                        <p className="text-[10px] text-slate-400 mt-2 italic">Current Checkout: {new Date(booking.rb_checkout).toLocaleDateString()}</p>
                    </div>

                    {extraAmount > 0 && (
                        <div className="p-4 bg-gold-50 border border-gold-100 rounded-2xl text-center">
                            <p className="text-[10px] font-black text-gold-600 uppercase mb-1">Additional Charge</p>
                            <p className="text-2xl font-black text-slate-900">Rs. {extraAmount.toLocaleString()}</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={!newCheckOut || extraAmount <= 0}
                            onClick={() => onProceed(extraAmount, { newCheckOut, extraAmount })}
                            className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-gold-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all shadow-xl shadow-slate-200"
                        >
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AddFoodModal = ({ isOpen, onClose, booking, onProceed }) => {
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
    const [mealType, setMealType] = useState('Lunch');

    useEffect(() => {
        const fetchMenu = async () => {
            const res = await axios.get('/api/guest/menu');
            setMenu(res.data || []);
        };
        fetchMenu();
    }, []);

    const addToCart = (item) => {
        const existing = cart.find(i => i.item_id === item.item_id);
        if (existing) {
            setCart(cart.map(i => i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const total = cart.reduce((s, i) => s + (i.item_price * i.quantity), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                <div className="bg-emerald-600 px-6 py-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-2xl">🍽️</div>
                        <div>
                            <h3 className="font-black text-xl uppercase tracking-wider leading-tight">Add Food Order</h3>
                            <p className="text-emerald-100 text-[10px] uppercase font-bold tracking-widest">
                                Guest: {booking.guest_name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-emerald-100 hover:text-white text-2xl">×</button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Menu Selection */}
                    <div className="w-2/3 p-6 overflow-y-auto bg-slate-50 border-r border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            {menu.map(item => (
                                <div key={item.item_id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-lg transition-all flex flex-col justify-between group">
                                    <div className="flex gap-4">
                                        {item.item_image && (
                                            <img src={item.item_image} className="w-16 h-16 rounded-xl object-cover shadow-sm bg-slate-50 shrink-0" alt={item.item_name} />
                                        )}
                                        <div className="min-w-0">
                                            <h5 className="font-bold text-slate-900 text-sm truncate">{item.item_name}</h5>
                                            <p className="text-emerald-600 font-bold text-xs mt-1">Rs. {item.item_price}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => addToCart(item)}
                                        className="mt-4 w-full py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cart & Settings */}
                    <div className="w-1/3 p-6 flex flex-col justify-between bg-white relative">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Serving Date</label>
                                    <input 
                                        type="date" 
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Meal Type</label>
                                    <select 
                                        value={mealType}
                                        onChange={(e) => setMealType(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                                    >
                                        <option>Breakfast</option>
                                        <option>Lunch</option>
                                        <option>Dinner</option>
                                        <option>Snack</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Your Selection</h5>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {cart.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">No items added</p>}
                                    {cart.map(i => (
                                        <div key={i.item_id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                                            <span className="font-bold flex-1">{i.item_name}</span>
                                            <span className="text-slate-500 w-12 text-center underline decoration-gold-500 decoration-2">x{i.quantity}</span>
                                            <span className="font-bold w-16 text-right">Rs. {i.item_price * i.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-slate-500 font-bold text-xs uppercase">Total</span>
                                <span className="text-2xl font-black text-slate-900">Rs. {total.toLocaleString()}</span>
                            </div>
                            <button 
                                disabled={cart.length === 0}
                                onClick={() => onProceed(total, { 
                                    items: cart.map(i => ({ item_id: i.item_id, quantity: i.quantity })),
                                    total_amount: total,
                                    scheduled_date: scheduledDate,
                                    meal_type: mealType
                                })}
                                className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-100"
                            >
                                Proceed to Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AddActivityModal = ({ isOpen, onClose, booking, onProceed }) => {
    const [activities, setActivities] = useState([]);
    const [selectedAct, setSelectedAct] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');

    useEffect(() => {
        const fetchActs = async () => {
            const res = await axios.get('/api/guest/activities');
            setActivities(res.data || []);
        };
        fetchActs();
    }, []);

    useEffect(() => {
        if (selectedAct && date) {
            const fetchSlots = async () => {
                const res = await axios.get(`/api/guest/activities/slots?activity_id=${selectedAct.activity_id}&date=${date}`);
                setSlots(res.data || []);
            };
            fetchSlots();
        }
    }, [selectedAct, date]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-purple-600 px-6 py-6 text-white text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <h3 className="font-black text-xl uppercase tracking-wider">Book Activity</h3>
                    <p className="text-purple-100 text-[10px] uppercase font-bold mt-1 tracking-widest">{booking.guest_name}</p>
                </div>
                
                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Select Activity</label>
                        <select 
                            onChange={(e) => setSelectedAct(activities.find(a => a.activity_id === parseInt(e.target.value)))}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
                        >
                            <option value="">Choose activity...</option>
                            {activities.map(a => (
                                <option key={a.activity_id} value={a.activity_id}>
                                    {a.activity_name} (Rs. {a.activity_price_per_hour}/hr)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Date</label>
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Time Slot</label>
                            <select 
                                value={selectedSlot}
                                onChange={(e) => setSelectedSlot(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                                disabled={!slots.length}
                            >
                                <option value="">Select slot...</option>
                                {slots.map(s => (
                                    <option key={s.time} value={s.time} disabled={s.isBooked}>
                                        {s.time} {s.isBooked ? '(Booked)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedAct && (
                        <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl text-center">
                            <p className="text-[10px] font-black text-purple-600 uppercase mb-1">Total Amount</p>
                            <p className="text-2xl font-black text-slate-900">Rs. {selectedAct.activity_price_per_hour.toLocaleString()}</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                        <button 
                            disabled={!selectedAct || !selectedSlot}
                            onClick={() => {
                                const start = `${date}T${selectedSlot}:00`;
                                const end = new Date(new Date(start).getTime() + 3600000).toISOString().slice(0, 19).replace('T', ' ');
                                onProceed(selectedAct.activity_price_per_hour, {
                                    activity_id: selectedAct.activity_id,
                                    start_time: start.replace('T', ' '),
                                    end_time: end,
                                    total_amount: selectedAct.activity_price_per_hour
                                });
                            }}
                            className="flex-[2] py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 disabled:opacity-50 transition-all shadow-xl shadow-purple-100"
                        >
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const HireVehicleModal = ({ isOpen, onClose, booking, onProceed }) => {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVeh, setSelectedVeh] = useState(null);
    const [vbDate, setVbDate] = useState(new Date().toISOString().split('T')[0]);
    const [vbDays, setVbDays] = useState(1);

    useEffect(() => {
        const fetchVeh = async () => {
            const res = await axios.get('/api/guest/vehicles');
            setVehicles(res.data || []);
        };
        fetchVeh();
    }, []);

    const total = selectedVeh ? (parseFloat(selectedVeh.vehicle_price_per_day) * vbDays) : 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-orange-600 px-6 py-6 text-white text-center">
                    <div className="text-3xl mb-2">🚗</div>
                    <h3 className="font-black text-xl uppercase tracking-wider">Hire Vehicle</h3>
                    <p className="text-orange-100 text-[10px] uppercase font-bold mt-1 tracking-widest">{booking.guest_name}</p>
                </div>
                
                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Vehicle Type</label>
                        <select 
                            onChange={(e) => setSelectedVeh(vehicles.find(v => v.vehicle_id === parseInt(e.target.value)))}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
                        >
                            <option value="">Select vehicle...</option>
                            {vehicles.map(v => (
                                <option key={v.vehicle_id} value={v.vehicle_id}>
                                    {v.vehicle_type} (Rs. {v.vehicle_price_per_day}/day)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Start Date</label>
                            <input 
                                type="date" 
                                value={vbDate}
                                onChange={(e) => setVbDate(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Days</label>
                            <input 
                                type="number" 
                                min="1" 
                                value={vbDays}
                                onChange={(e) => setVbDays(parseInt(e.target.value))}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold"
                            />
                        </div>
                    </div>

                    {selectedVeh && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-center">
                            <p className="text-[10px] font-black text-orange-600 uppercase mb-1">Total For {vbDays} Days</p>
                            <p className="text-2xl font-black text-slate-900">Rs. {total.toLocaleString()}</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                        <button 
                            disabled={!selectedVeh}
                            onClick={() => onProceed(total, {
                                vehicle_id: selectedVeh.vehicle_id,
                                vb_date: vbDate,
                                vb_days: vbDays,
                                total_amount: total
                            })}
                            className="flex-[2] py-4 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xl shadow-orange-100"
                        >
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
