import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import CardSwipeMachine from '../../components/CardSwipeMachine';
import { 
    ExtendStayModal, 
    AddFoodModal, 
    AddActivityModal, 
    HireVehicleModal 
} from '../../components/Receptionist/CheckedInActionModals';

const ReceptionistBookings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [bookings, setBookings] = useState({
        rooms: [],
        activities: [],
        foodOrders: [],
        vehicles: []
    });
    const [loading, setLoading] = useState(true);
    const [pendingModal, setPendingModal] = useState({ open: false, pending: null, guestName: '' });
    const [vehiclePayModal, setVehiclePayModal] = useState({ open: false, vb: null });

    // Multi-service Action State
    const [actionModal, setActionModal] = useState({ 
        type: null, // 'extend', 'food', 'activity', 'vehicle'
        booking: null 
    });
    const [actionPayment, setActionPayment] = useState({ 
        open: false, 
        amount: 0, 
        payload: null,
        label: ''
    });

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const [roomsRes, actRes, ordersRes, vehiclesRes] = await Promise.all([
                    axios.get('/api/receptionist/bookings/rooms'),
                    axios.get('/api/receptionist/bookings/activities'),
                    axios.get('/api/receptionist/bookings/orders'),
                    axios.get('/api/receptionist/bookings/vehicles')
                ]);
                setBookings({
                    rooms: roomsRes.data || [],
                    activities: actRes.data || [],
                    foodOrders: ordersRes.data || [],
                    vehicles: vehiclesRes.data || []
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching bookings:', error);
                toast.error('Failed to load bookings');
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'checked-in': 'bg-blue-500',
            'confirmed': 'bg-green-500',
            'pending': 'bg-yellow-500',
            'active': 'bg-gold-500',
            'booked': 'bg-green-500',
            'delivered': 'bg-green-500',
            'ordered': 'bg-yellow-500',
            'cancelled': 'bg-red-500',
            'completed': 'bg-slate-500',
            'rejected': 'bg-red-500'
        };
        return `${statusColors[status?.toLowerCase()] || 'bg-slate-500'} text-white`;
    };

    const handleStatusUpdate = async (type, id, newStatus, guestName = '') => {
        try {
            let endpoint = '';
            if (type === 'room') endpoint = `/api/receptionist/bookings/rooms/${id}/status`;
            else if (type === 'activity') endpoint = `/api/receptionist/bookings/activities/${id}/status`;

            if (endpoint) {
                await axios.put(endpoint, { status: newStatus });
                toast.success('Status updated');
                window.location.reload();
            }
        } catch (error) {
            // Checkout blocked by pending payments
            if (error.response?.data?.pendingPayments) {
                setPendingModal({
                    open: true,
                    pending: error.response.data.pending,
                    guestName
                });
            } else {
                toast.error('Failed to update status');
            }
        }
    };

    // Pay for a vehicle hire via card swipe (for walk-in guests)
    const handleVehiclePay = (vb) => {
        setVehiclePayModal({ open: true, vb });
    };

    const submitVehiclePayment = async () => {
        if (!vehiclePayModal.vb) return;
        try {
            await axios.post(`/api/receptionist/walkin/pay-vehicle/${vehiclePayModal.vb.vb_id}`);
            toast.success(`Vehicle hire payment recorded for ${vehiclePayModal.vb.guest_name || 'guest'}`);
            window.location.reload();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to record payment');
        }
    };

    // --- Action Modal Handlers ---
    const handleActionProceed = (amount, payload) => {
        const labels = {
            extend: 'Extend Stay',
            food: 'Add Food',
            activity: 'Book Activity',
            vehicle: 'Hire Vehicle'
        };
        setActionPayment({
            open: true,
            amount,
            payload,
            label: `${labels[actionModal.type]} — ${actionModal.booking.guest_name}`
        });
    };

    const handleActionPaymentSuccess = async (paymentId) => {
        try {
            const { type, booking } = actionModal;
            const { payload } = actionPayment;
            
            // Link guest info
            const guest_id = booking.guest_id ? { id: booking.guest_id, type: 'registered' } : { id: booking.wig_id, type: 'walkin' };
            const fullPayload = { ...payload, guest_id, payment_id: paymentId, rb_id: booking.rb_id };

            let endpoint = '';
            let method = 'post';
            if (type === 'extend') {
                endpoint = `/api/bookings/rooms/${booking.rb_id}/extend`;
                method = 'put';
            }
            else if (type === 'food') endpoint = '/api/orders';
            else if (type === 'activity') endpoint = '/api/bookings/activities';
            else if (type === 'vehicle') endpoint = '/api/bookings/vehicles';

            await axios[method](endpoint, fullPayload);
            toast.success('Service added and payment recorded successfully');
            window.location.reload();
        } catch (error) {
            console.error('Action failed:', error);
            toast.error(error.response?.data?.error || 'Failed to process request');
        }
    };

    // A vehicle is payable if: status is Confirmed/Booked/Pending Payment AND no payment yet
    const isVehiclePayable = (vb) => {
        return ['Confirmed', 'Booked', 'Pending Payment'].includes(vb.vb_status) && !vb.vb_payment_id;
    };

    const tabs = [
        { id: 'all', label: 'All Bookings', icon: '📋' },
        { id: 'rooms', label: 'Rooms', icon: '🏨' },
        { id: 'activities', label: 'Activities', icon: '🎯' },
        { id: 'food', label: 'Food Orders', icon: '🍽️' },
        { id: 'vehicles', label: 'Vehicles', icon: '🚗' }
    ];

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <>
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Manage Bookings</h1>
                <p className="text-slate-500 mt-1">View and manage all guest bookings and orders.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="border-b border-slate-200 px-6">
                    <div className="flex gap-4 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-4 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                                    ? 'text-gold-600 border-b-2 border-gold-600'
                                    : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
                                    }`}
                            >
                                <span className="text-lg">{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {/* All Bookings - Hierarchical View */}
                    {activeTab === 'all' && (
                        <div className="space-y-8">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Room Bookings & Linked Services</h3>
                            {bookings.rooms.map((roomBooking, idx) => {
                                // Find linked services
                                const linkedActivities = bookings.activities.filter(a => a.rb_id === roomBooking.rb_id);
                                const linkedFood = bookings.foodOrders.filter(f => f.rb_id === roomBooking.rb_id);
                                const linkedVehicles = bookings.vehicles.filter(v => v.rb_id === roomBooking.rb_id);

                                return (
                                    <div key={'room' + roomBooking.rb_id} className="relative overflow-hidden group">
                                        {/* Main Room Card */}
                                        <div className="p-6 border border-slate-200 rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative z-10 border-l-8 border-l-blue-500">
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h4 className="font-black text-xl text-slate-900 leading-tight">
                                                            {roomBooking.room_type}
                                                        </h4>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(roomBooking.rb_status)}`}>
                                                            {roomBooking.rb_status}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-sm text-slate-600">
                                                        <p className="flex items-center gap-2">
                                                            <span className="text-slate-400">👤 Guest:</span>
                                                            <span className="font-bold text-slate-800">{roomBooking.guest_name}</span>
                                                        </p>
                                                        <p className="flex items-center gap-2">
                                                            <span className="text-slate-400">📅 Stay:</span>
                                                            <span className="font-bold text-blue-600">{formatDate(roomBooking.rb_checkin)} — {formatDate(roomBooking.rb_checkout)}</span>
                                                        </p>
                                                        <p className="flex items-center gap-2">
                                                            <span className="text-slate-400">📞 Phone:</span>
                                                            <span className="font-medium">{roomBooking.guest_phone || 'N/A'}</span>
                                                        </p>
                                                        <p className="flex items-center gap-2">
                                                            <span className="text-slate-400">🎫 ID:</span>
                                                            <span className="font-mono text-xs">#{roomBooking.rb_id}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase block">Total Booking Value</span>
                                                        <span className="text-2xl font-black text-slate-900">
                                                            Rs. {Number(roomBooking.rb_total_amount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        {roomBooking.rb_status === 'Booked' && (
                                                            <button onClick={() => handleStatusUpdate('room', roomBooking.rb_id, 'Checked-in', roomBooking.guest_name)} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-gold-600 transition-all shadow-lg shadow-slate-200">
                                                                Check-In
                                                            </button>
                                                        )}
                                                        {roomBooking.rb_status === 'Checked-in' && (
                                                            <div className="flex flex-col gap-2">
                                                                <button onClick={() => handleStatusUpdate('room', roomBooking.rb_id, 'Checked-out', roomBooking.guest_name)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                                                    Check-Out
                                                                </button>
                                                                <div className="flex gap-1">
                                                                    <button 
                                                                        onClick={() => setActionModal({ type: 'extend', booking: roomBooking })}
                                                                        title="Extend Stay" 
                                                                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all text-xs"
                                                                    >📅</button>
                                                                    <button 
                                                                        onClick={() => setActionModal({ type: 'food', booking: roomBooking })}
                                                                        title="Add Food" 
                                                                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-xs"
                                                                    >🍽️</button>
                                                                    <button 
                                                                        onClick={() => setActionModal({ type: 'activity', booking: roomBooking })}
                                                                        title="Book Activity" 
                                                                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all text-xs"
                                                                    >🎯</button>
                                                                    <button 
                                                                        onClick={() => setActionModal({ type: 'vehicle', booking: roomBooking })}
                                                                        title="Hire Vehicle" 
                                                                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all text-xs"
                                                                    >🚗</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Linked Services Section */}
                                            {(linkedActivities.length > 0 || linkedFood.length > 0 || linkedVehicles.length > 0) && (
                                                <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Included Extras</h5>
                                                    
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                        {linkedActivities.map(act => (
                                                            <div key={'linked-act' + act.ab_id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-2xl border border-purple-100 group/item hover:border-purple-300 transition-colors">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm">🎯</div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-slate-800 truncate">{act.activity_name}</p>
                                                                    <p className="text-[10px] text-slate-500">{formatDate(act.ab_start_time)}</p>
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatusColor(act.ab_status)}`}>{act.ab_status}</span>
                                                            </div>
                                                        ))}
                                                        
                                                        {linkedVehicles.map(veh => (
                                                            <div key={'linked-veh' + veh.vb_id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl border border-orange-100 group/item hover:border-orange-300 transition-colors">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm">🚗</div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-slate-800 truncate">{veh.vehicle_type}</p>
                                                                    <p className="text-[10px] text-slate-500">{formatDate(veh.vb_date)}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatusColor(veh.vb_status)}`}>{veh.vb_status}</span>
                                                                    {isVehiclePayable(veh) && (
                                                                        <button
                                                                            onClick={() => handleVehiclePay(veh)}
                                                                            className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-xl hover:bg-gold-600 transition-all uppercase tracking-wider"
                                                                        >
                                                                            💳 Pay
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {linkedFood.map(foo => (
                                                            <div key={'linked-food' + foo.order_id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 group/item hover:border-emerald-300 transition-colors">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm">🍽️</div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-slate-800 truncate">{foo.item_details || `Order #${foo.order_id}`}</p>
                                                                    <p className="text-[10px] text-slate-500">{new Date(foo.order_date).toLocaleDateString()}</p>
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatusColor(foo.order_status)}`}>{foo.order_status}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Standalone Section */}
                            {(bookings.activities.some(a => !a.rb_id) || bookings.foodOrders.some(f => !f.rb_id) || bookings.vehicles.some(v => !v.rb_id)) && (
                                <div className="space-y-6 pt-10">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Standalone & Walk-in Services</h3>
                                        <div className="h-px w-full bg-slate-100"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {bookings.activities.filter(a => !a.rb_id).map((act, idx) => (
                                            <div key={'solo-act' + idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-lg transition-all border-l-4 border-l-purple-500">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{act.activity_name}</h4>
                                                        <p className="text-xs text-slate-500 mt-1">Guest: {act.guest_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-1">ID: #{act.ab_id}</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatusColor(act.ab_status)}`}>{act.ab_status}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {bookings.foodOrders.filter(f => !f.rb_id).map((order, idx) => (
                                            <div key={'solo-food' + idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-lg transition-all border-l-4 border-l-emerald-500">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 truncate max-w-[200px]">{order.item_details || `Order #${order.order_id}`}</h4>
                                                        <p className="text-xs text-slate-500 mt-1">Guest: {order.guest_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-1">ID: #{order.order_id}</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatusColor(order.order_status)}`}>{order.order_status}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {bookings.vehicles.filter(v => !v.rb_id).map((vb, idx) => (
                                            <div key={'solo-veh' + idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-lg transition-all border-l-4 border-l-orange-500">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{vb.vehicle_type}</h4>
                                                        <p className="text-xs text-slate-500 mt-1">Guest: {vb.guest_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-1">ID: #{vb.vb_id}</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatusColor(vb.vb_status)}`}>{vb.vb_status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rooms Tab */}
                    {activeTab === 'rooms' && (
                        <div className="space-y-6">
                            {bookings.rooms.map((booking, idx) => (
                                <div key={idx} className="p-6 border border-slate-200 rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 border-l-8 border-l-blue-500">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="font-black text-xl text-slate-900 leading-tight">{booking.room_type}</h4>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(booking.rb_status)}`}>
                                                    {booking.rb_status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-sm text-slate-600">
                                                <p className="flex items-center gap-2">
                                                    <span className="text-slate-400">👤 Guest:</span>
                                                    <span className="font-bold text-slate-800">{booking.guest_name}</span>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <span className="text-slate-400">📞 Phone:</span>
                                                    <span className="font-medium text-slate-700">{booking.guest_phone || 'N/A'}</span>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <span className="text-slate-400">📄 NIC/Pass:</span>
                                                    <span className="font-medium text-slate-700">{booking.guest_nic_passport}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Booking ID</p>
                                            <p className="font-mono text-sm text-slate-900 font-bold">#{booking.rb_id}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">
                                                Created: {new Date(booking.rb_date || booking.created_at || Date.now()).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-t border-slate-100 bg-slate-50/50 rounded-2xl px-6">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Check-in / Check-out</p>
                                            <p className="text-sm font-bold text-slate-900">
                                                {formatDate(booking.rb_checkin)} — {formatDate(booking.rb_checkout)}
                                            </p>
                                        </div>
                                        <div className="md:text-right">
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Total Stay Value</p>
                                            <p className="text-sm font-black text-blue-600">
                                                Rs. {Number(booking.rb_total_amount).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-3 justify-end pt-4 border-t border-slate-50">
                                        {booking.rb_status === 'Booked' && (
                                            <button onClick={() => handleStatusUpdate('room', booking.rb_id, 'Checked-in', booking.guest_name)} className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-gold-600 transition-all shadow-lg shadow-slate-200">
                                                Check-In Guest
                                            </button>
                                        )}
                                        {booking.rb_status === 'Checked-in' && (
                                            <button onClick={() => handleStatusUpdate('room', booking.rb_id, 'Checked-out', booking.guest_name)} className="px-6 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                                Check-Out Guest
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Activities Tab */}
                    {activeTab === 'activities' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {bookings.activities.map((booking, idx) => (
                                <div key={idx} className="p-6 border border-slate-200 rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 border-l-8 border-l-purple-500 flex flex-col justify-between">
                                    <div className="mb-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-black text-lg text-slate-900 leading-tight">{booking.activity_name}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatusColor(booking.ab_status)}`}>
                                                {booking.ab_status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600 space-y-1">
                                            <p className="font-bold text-slate-800">{booking.guest_name}</p>
                                            <p className="text-xs text-slate-500">📅 {formatDate(booking.ab_start_time)}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                        <p className="text-xs font-black text-purple-600 uppercase">Rs. {Number(booking.ab_total_amount).toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">#{booking.ab_id}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Food Tab */}
                    {activeTab === 'food' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {bookings.foodOrders.map((order, idx) => (
                                <div key={idx} className="p-6 border border-slate-200 rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 border-l-8 border-l-emerald-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-lg text-slate-900 truncate leading-tight">
                                                {order.item_details || `Order #${order.order_id}`}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1 uppercase font-black tracking-tighter">Guest: {order.guest_name}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase shrink-0 ${getStatusColor(order.order_status)}`}>
                                            {order.order_status}
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-mono">#{order.order_id}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(order.order_date).toLocaleString()}</p>
                                        </div>
                                        <p className="text-lg font-black text-emerald-600">
                                            Rs. {Number(order.order_total_amount || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Vehicles Tab */}
                    {activeTab === 'vehicles' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {bookings.vehicles.map((vb, idx) => (
                                <div key={idx} className="p-6 border border-slate-200 rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 border-l-8 border-l-orange-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-lg text-slate-900 leading-tight truncate">{vb.vehicle_type}</h4>
                                            <p className="text-xs text-slate-500 mt-1 uppercase font-black tracking-tighter">Guest: {vb.guest_name}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase shrink-0 ${getStatusColor(vb.vb_status)}`}>
                                            {vb.vb_status}
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 space-y-2">
                                        <p className="text-xs text-slate-600 flex justify-between">
                                            <span className="text-slate-400 font-bold uppercase text-[10px]">Date:</span>
                                            <span className="font-bold">{formatDate(vb.vb_date)}</span>
                                        </p>
                                        <p className="text-xs text-slate-600 flex justify-between">
                                            <span className="text-slate-400 font-bold uppercase text-[10px]">Duration:</span>
                                            <span className="font-bold text-orange-600">{vb.vb_days} Days Hire</span>
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono text-right mt-2">ID: #{vb.vb_id}</p>
                                    </div>
                                    {isVehiclePayable(vb) && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">⏳ Payment Pending</p>
                                                <button
                                                    onClick={() => handleVehiclePay(vb)}
                                                    className="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-gold-600 transition-all shadow-lg uppercase tracking-wider flex items-center gap-2"
                                                >
                                                    <span>💳</span> Pay Now
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {vb.vb_payment_id && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                                            <span className="text-green-500 text-sm">✓</span>
                                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Payment Received</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
        <PendingPaymentsModal modal={pendingModal} onClose={() => setPendingModal({ open: false, pending: null, guestName: '' })} />
        <CardSwipeMachine
            isOpen={vehiclePayModal.open}
            onClose={() => setVehiclePayModal({ open: false, vb: null })}
            onPaymentSuccess={submitVehiclePayment}
            amount={
                vehiclePayModal.vb
                    ? (parseFloat(vehiclePayModal.vb.vehicle_price_per_day || 0) * parseInt(vehiclePayModal.vb.vb_days || 1))
                    : 0
            }
            label={`Vehicle Hire — ${vehiclePayModal.vb?.guest_name || 'Guest'}`}
        />

        {/* Global Action Modals */}
        <ExtendStayModal 
            isOpen={actionModal.type === 'extend'} 
            onClose={() => setActionModal({ type: null, booking: null })}
            booking={actionModal.booking}
            onProceed={handleActionProceed}
        />
        <AddFoodModal 
            isOpen={actionModal.type === 'food'} 
            onClose={() => setActionModal({ type: null, booking: null })}
            booking={actionModal.booking}
            onProceed={handleActionProceed}
        />
        <AddActivityModal 
            isOpen={actionModal.type === 'activity'} 
            onClose={() => setActionModal({ type: null, booking: null })}
            booking={actionModal.booking}
            onProceed={handleActionProceed}
        />
        <HireVehicleModal 
            isOpen={actionModal.type === 'vehicle'} 
            onClose={() => setActionModal({ type: null, booking: null })}
            booking={actionModal.booking}
            onProceed={handleActionProceed}
        />

        {/* Action Swipe Machine */}
        <CardSwipeMachine 
            isOpen={actionPayment.open}
            onClose={() => setActionPayment({ ...actionPayment, open: false })}
            onPaymentSuccess={handleActionPaymentSuccess}
            amount={actionPayment.amount}
            label={actionPayment.label}
        />
        </>
    );
};

export default ReceptionistBookings;

// ── Pending Payments Modal (inline) ──────────────────────────────────────────
function PendingPaymentsModal({ modal, onClose }) {
    if (!modal.open) return null;
    const { pending, guestName } = modal;

    const total =
        (pending.damages || []).reduce((s, d) => s + Number(d.charge_amount), 0) +
        (pending.vehicles || []).length * 0 +
        (pending.activities || []).length * 0 +
        (pending.foodOrders || []).length * 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                <div className="bg-red-600 px-6 py-4">
                    <p className="text-2xl">🚫</p>
                    <h3 className="text-white font-bold text-lg mt-1">Cannot Check Out</h3>
                    <p className="text-red-100 text-sm mt-1">
                        {guestName || 'This guest'} has outstanding payments that must be settled first.
                    </p>
                </div>

                <div className="p-6 max-h-96 overflow-y-auto space-y-4">
                    {pending.damages?.length > 0 && (
                        <div>
                            <p className="font-bold text-slate-700 mb-2">⚠️ Unpaid Damage Charges</p>
                            {pending.damages.map(d => (
                                <div key={d.damage_id} className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-600">{d.damage_type}: {d.description?.substring(0, 50)}</span>
                                    <span className="font-bold text-red-600">Rs. {Number(d.charge_amount).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {pending.vehicles?.length > 0 && (
                        <div>
                            <p className="font-bold text-slate-700 mb-2">🚗 Unpaid Vehicle Hires</p>
                            {pending.vehicles.map(v => (
                                <div key={v.vb_id} className="text-sm py-2 border-b border-slate-100 text-slate-600">
                                    {v.vehicle_type} – {v.vb_date ? new Date(v.vb_date).toLocaleDateString() : ''}
                                </div>
                            ))}
                        </div>
                    )}
                    {pending.activities?.length > 0 && (
                        <div>
                            <p className="font-bold text-slate-700 mb-2">🏋️ Unpaid Activity Bookings</p>
                            {pending.activities.map(a => (
                                <div key={a.ab_id} className="text-sm py-2 border-b border-slate-100 text-slate-600">
                                    {a.activity_name} – {a.ab_start_time ? new Date(a.ab_start_time).toLocaleDateString() : ''}
                                </div>
                            ))}
                        </div>
                    )}
                    {pending.foodOrders?.length > 0 && (
                        <div>
                            <p className="font-bold text-slate-700 mb-2">🍽️ Unpaid Food Orders</p>
                            {pending.foodOrders.map(f => (
                                <div key={f.order_id} className="text-sm py-2 border-b border-slate-100 text-slate-600">
                                    Order #{f.order_id}{f.scheduled_date ? ` – ${new Date(f.scheduled_date).toLocaleDateString()}` : ''}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6 pt-2 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
