import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

// Image helper removed - all images served from backend uploads
import DemoPaymentGateway from '../../components/DemoPaymentGateway';

const FoodOrders = () => {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [profileData, setProfileData] = useState({ guest_name: '' });
    const [activeBookings, setActiveBookings] = useState([]);
    const [hasActiveBooking, setHasActiveBooking] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [diningOption, setDiningOption] = useState('Delivery');
    
    // Scheduled Order states
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedMealType, setSelectedMealType] = useState('Breakfast');

    const [searchParams] = useSearchParams();
    const urlLinkedRbId = searchParams.get('rb_id');

    const getItemDescription = (itemName) => {
        const name = itemName.toLowerCase();
        if (name.includes('kothu') || name.includes('kottu') || name.includes('koththu')) return 'Traditional chopped roti with vegetables and spices';
        if (name.includes('pol') || name.includes('rotti') || name.includes('roti') || name.includes('sambol')) return 'Traditional Sri Lankan flatbread with spicy sambol';
        if (name.includes('dosa')) return 'South Indian crispy crepe served with chutney';
        if (name.includes('chicken') && name.includes('bun')) return 'Soft bun filled with spicy chicken';
        if (name.includes('fried') && name.includes('rice')) return 'Flavorful Sri Lankan style fried rice';
        return 'Delicious food item';
    };

    const toLocalDateStr = (d) => {
        const date = new Date(d);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [menuRes, profileRes, activeBookingsRes] = await Promise.all([
                axios.get('/api/guest/menu'),
                axios.get('/api/guest/profile'),
                axios.get('/api/guest/bookings/active')
            ]);

            setMenuItems(menuRes.data || []);
            setProfileData(profileRes.data || {});

            const bookingsData = activeBookingsRes.data;
            setHasActiveBooking(bookingsData.hasActiveBooking);
            setActiveBookings(bookingsData.bookings || []);

            if (bookingsData.bookings && bookingsData.bookings.length > 0) {
                const targetId = urlLinkedRbId ? parseInt(urlLinkedRbId, 10) : bookingsData.bookings[0].rb_id;
                setSelectedBooking(targetId);
                const b = bookingsData.bookings.find(x => x.rb_id === targetId) || bookingsData.bookings[0];
                if (b.check_in_date && !selectedDate) {
                    setSelectedDate(toLocalDateStr(b.check_in_date));
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const categorizedMenu = { 'Our Menu': menuItems };

    const addToCart = (item) => {
        // Find existing group for current selection
        const existingGroupIdx = cart.findIndex(g => g.date === selectedDate && g.mealType === selectedMealType);
        
        if (existingGroupIdx > -1) {
            const newCart = [...cart];
            const group = { ...newCart[existingGroupIdx] };
            const existingItemIdx = group.items.findIndex(i => i.item_id === item.item_id);
            
            if (existingItemIdx > -1) {
                const newItems = [...group.items];
                newItems[existingItemIdx] = { ...newItems[existingItemIdx], quantity: newItems[existingItemIdx].quantity + 1 };
                group.items = newItems;
            } else {
                group.items = [...group.items, { ...item, quantity: 1 }];
            }
            
            newCart[existingGroupIdx] = group;
            setCart(newCart);
        } else {
            // Create new group
            setCart([...cart, {
                date: selectedDate,
                mealType: selectedMealType,
                items: [{ ...item, quantity: 1 }]
            }]);
        }
    };

    const removeFromCart = (date, mealType, item_id) => {
        const newCart = cart.map(group => {
            if (group.date === date && group.mealType === mealType) {
                return { ...group, items: group.items.filter(i => i.item_id !== item_id) };
            }
            return group;
        }).filter(group => group.items.length > 0);
        setCart(newCart);
    };

    const updateQuantity = (date, mealType, item_id, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(date, mealType, item_id);
        } else {
            const newCart = cart.map(group => {
                if (group.date === date && group.mealType === mealType) {
                    return {
                        ...group,
                        items: group.items.map(i => i.item_id === item_id ? { ...i, quantity: newQuantity } : i)
                    };
                }
                return group;
            });
            setCart(newCart);
        }
    };

    const getTotalAmount = () => {
        return cart.reduce((total, group) => {
            return total + group.items.reduce((gTotal, item) => gTotal + (item.item_price * item.quantity), 0);
        }, 0);
    };

    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handlePlaceOrder = () => {
        if (cart.length === 0) {
            alert('Please add items to cart before ordering');
            return;
        }
        setShowPaymentModal(true);
    };

    const confirmPayment = async () => {
        try {
            const bulkData = {
                orderGroups: cart.map(group => ({
                    scheduled_date: group.date,
                    meal_type: group.mealType,
                    items: group.items.map(item => ({
                        item_id: item.item_id,
                        quantity: item.quantity
                    }))
                })),
                total_amount: getTotalAmount(),
                dining_option: diningOption,
                rb_id: selectedBooking
            };

            const response = await axios.post('/api/guest/orders/bulk', bulkData);
            setShowPaymentModal(false);
            alert(`Payment successful! ${response.data.orderIds.length} orders placed for your stay.`);
            setCart([]);
            fetchData();
        } catch (error) {
            console.error('Error placing bulk order:', error);
            if (error.response?.data?.requiresBooking) {
                alert(error.response.data.message || 'You must have an active room booking to order food.');
                navigate('/guest/rooms');
            } else {
                alert('Failed to place orders. Please try again.');
            }
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    if (!hasActiveBooking && !urlLinkedRbId) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md text-center shadow-lg">
                    <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🏨</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Room Booking Required</h2>
                    <p className="text-slate-500 mb-6">
                        You must have an active room booking to order food.
                    </p>
                    <button
                        onClick={() => navigate('/guest/rooms')}
                        className="w-full bg-gold-500 hover:bg-gold-600 text-white px-6 py-2.5 rounded-lg font-bold transition-colors"
                    >
                        Book a Room
                    </button>
                </div>
            </div>
        );
    }

    const currentLinkedBookingKey = urlLinkedRbId ? parseInt(urlLinkedRbId, 10) : selectedBooking;
    const currentLinkedBooking = activeBookings.find(b => b.rb_id === currentLinkedBookingKey);

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header / Linked Booking Banner */}
            <div className="bg-white border-b border-slate-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Cuisine Selection</h3>
                    <p className="text-slate-500 text-sm font-medium">Authentic flavors scheduled for your stay</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                    {/* Booking Selector */}
                    {activeBookings.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                            <span className="text-xl">🏨</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] pb-1 uppercase font-black text-slate-400 leading-none">Your Stay</span>
                                <select
                                    value={selectedBooking}
                                    onChange={(e) => {
                                        const bId = parseInt(e.target.value);
                                        setSelectedBooking(bId);
                                        const b = activeBookings.find(x => x.rb_id === bId);
                                        if (b?.check_in_date) setSelectedDate(toLocalDateStr(b.check_in_date));
                                    }}
                                    className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
                                >
                                    {activeBookings.map(b => (
                                        <option key={b.rb_id} value={b.rb_id}>
                                            {b.room_type} Room #{b.room_number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Dining Option Toggle */}
                    <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-2xl flex">
                        {['Delivery', 'Dine-in'].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setDiningOption(opt)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${diningOption === opt ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {opt === 'Delivery' ? '🛵' : '🍽️'} {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scheduled Controls Banner */}
            {currentLinkedBooking && (
                <div className="bg-slate-900 px-8 py-6 text-white flex flex-col md:flex-row gap-8 items-center border-b border-slate-800">
                    <div className="flex-1 space-y-3 w-full">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Choose Date for this Order</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {(() => {
                                const start = new Date(currentLinkedBooking.check_in_date);
                                const end = new Date(currentLinkedBooking.check_out_date);
                                const dates = [];
                                let curr = new Date(start);
                                while (toLocalDateStr(curr) <= toLocalDateStr(end)) {
                                    dates.push(toLocalDateStr(curr));
                                    curr.setDate(curr.getDate() + 1);
                                }
                                return dates.map(date => {
                                    const [y, m, d] = date.split('-').map(Number);
                                    const dispDate = new Date(y, m - 1, d);
                                    const isActive = selectedDate === date;
                                    return (
                                        <button
                                            key={date}
                                            onClick={() => setSelectedDate(date)}
                                            className={`flex-shrink-0 w-14 h-18 rounded-xl flex flex-col items-center justify-center transition-all ${isActive ? 'bg-gold-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase">{dispDate.toLocaleDateString(undefined, { month: 'short' })}</span>
                                            <span className="text-lg font-black">{dispDate.getDate()}</span>
                                        </button>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    <div className="w-full md:w-64 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Meal Slot</label>
                        <div className="grid grid-cols-3 bg-slate-800 p-1 rounded-xl">
                            {['Breakfast', 'Lunch', 'Dinner'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedMealType(type)}
                                    className={`py-2 rounded-lg text-[10px] font-black transition-all ${selectedMealType === type ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Menu List */}
                <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                    {Object.entries(categorizedMenu).map(([category, items]) => (
                        <div key={category}>
                            <h4 className="text-xl font-bold text-slate-900 mb-6 border-l-4 border-gold-500 pl-4 uppercase tracking-wide">
                                {category}
                            </h4>
                            <div className="space-y-4">
                                {items.map((item) => {
                                    const itemImage = item.item_image ? (item.item_image.startsWith('/') ? `${axios.defaults.baseURL}${item.item_image}` : item.item_image) : null;
                                    const displayName = item.item_name === 'Pol Sambol & Hoppers' ? 'pol rotti and sambol' : item.item_name;
                                    
                                    return (
                                        <div 
                                            key={item.item_id} 
                                            className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-6 hover:border-gold-400 hover:shadow-md transition-all group"
                                        >
                                            {/* Image on left */}
                                            <div className="w-28 h-28 flex-shrink-0 relative">
                                                {itemImage ? (
                                                    <img
                                                        src={itemImage}
                                                        alt={item.item_name}
                                                        className="w-full h-full object-cover rounded-xl shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-4xl">
                                                        🍽️
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details in middle */}
                                            <div className="flex-1 flex flex-col justify-center">
                                                <h5 className="font-bold text-slate-900 text-lg group-hover:text-gold-600 transition-colors">
                                                    {displayName}
                                                </h5>
                                                <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">
                                                    {getItemDescription(item.item_name)}
                                                </p>
                                                <p className="text-gold-600 font-bold mt-2 text-lg">
                                                    Rs. {item.item_price.toLocaleString()}
                                                </p>
                                            </div>

                                            {/* Add button on right */}
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-xl font-bold transition-all transform active:scale-95 shadow-md"
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Side: Cart Sidebar (Fixed/Sticky) */}
                <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-xl">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span>🛒</span> Your Cart
                        </h4>
                        <span className="bg-gold-100 text-gold-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                            {cart.reduce((acc, g) => acc + g.items.length, 0)} Items
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                <span className="text-5xl mb-4">🍲</span>
                                <p className="font-medium">Selection is empty</p>
                                <p className="text-xs mt-1">Add items from the menu to start your order</p>
                            </div>
                        ) : (
                            cart.map((group, gIdx) => (
                                <div key={`${group.date}-${group.mealType}-${gIdx}`} className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900 uppercase">
                                                {new Date(group.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-widest ${
                                                group.mealType === 'Breakfast' ? 'bg-orange-50 text-orange-600' :
                                                group.mealType === 'Lunch' ? 'bg-blue-50 text-blue-600' :
                                                'bg-purple-50 text-purple-600'
                                            }`}>
                                                {group.mealType}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {group.items.map((item) => (
                                            <div key={item.item_id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h5 className="font-bold text-slate-900 text-sm">
                                                        {item.item_name}
                                                    </h5>
                                                    <button
                                                        onClick={() => removeFromCart(group.date, group.mealType, item.item_id)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1">
                                                        <button
                                                            onClick={() => updateQuantity(group.date, group.mealType, item.item_id, item.quantity - 1)}
                                                            className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(group.date, group.mealType, item.item_id, item.quantity + 1)}
                                                            className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <p className="text-gold-600 font-bold text-sm">
                                                        Rs. {(item.item_price * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-slate-50/50 border-t border-slate-200 space-y-6">
                        {/* Summary */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-slate-400 font-medium">Total Price</span>
                                <span className="text-2xl font-bold tracking-tighter">
                                    Rs. {getTotalAmount().toLocaleString()}
                                </span>
                            </div>
                            <button
                                onClick={handlePlaceOrder}
                                disabled={cart.length === 0}
                                className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                            >
                                Confirm All Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <DemoPaymentGateway 
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                amount={getTotalAmount()}
                onPaymentSuccess={confirmPayment}
            />
        </div>
    );
};

export default FoodOrders;
