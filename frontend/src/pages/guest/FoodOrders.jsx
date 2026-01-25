import { useState, useEffect } from 'react';
import axios from '../../config/axios';

const FoodOrders = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [profileData, setProfileData] = useState({ guest_name: '' });
    const [currentBooking, setCurrentBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [diningOption, setDiningOption] = useState('Delivery');

    const paymentMethods = [
        { value: 'Cash', label: 'Cash', icon: '💵', description: 'Pay with cash on delivery' },
        { value: 'Card', label: 'Card', icon: '💳', description: 'Pay with credit/debit card' },
        { value: 'Online', label: 'Online Banking', icon: '🌐', description: 'Pay via online banking' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [menuRes, profileRes, bookingsRes] = await Promise.all([
                axios.get('/api/guest/menu'),
                axios.get('/api/guest/profile'),
                axios.get('/api/guest/bookings')
            ]);

            setMenuItems(menuRes.data || []);
            setProfileData(profileRes.data || {});

            const activeBooking = bookingsRes.data?.rooms?.find(
                b => b.rb_status === 'Checked-in' || b.rb_status === 'Active'
            );
            setCurrentBooking(activeBooking);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const categorizeMenu = () => {
        const categories = {
            'Main Course': [],
            'Breakfast': [],
            'Snacks': [],
            'Beverages': []
        };

        menuItems.forEach(item => {
            const name = item.item_name.toLowerCase();
            if (name.includes('kottu') || name.includes('rice') || name.includes('curry') || name.includes('biriyani')) {
                categories['Main Course'].push(item);
            } else if (name.includes('dosa') || name.includes('bread') || name.includes('egg') || name.includes('pancake')) {
                categories['Breakfast'].push(item);
            } else if (name.includes('bun') || name.includes('roll') || name.includes('sandwich') || name.includes('chicken') || name.includes('samosa')) {
                categories['Snacks'].push(item);
            } else if (name.includes('tea') || name.includes('coffee') || name.includes('juice') || name.includes('water')) {
                categories['Beverages'].push(item);
            } else {
                categories['Main Course'].push(item);
            }
        });

        return categories;
    };

    const addToCart = (item) => {
        const existingItem = cart.find(cartItem => cartItem.item_id === item.item_id);
        if (existingItem) {
            setCart(cart.map(cartItem =>
                cartItem.item_id === item.item_id
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const removeFromCart = (item_id) => {
        setCart(cart.filter(item => item.item_id !== item_id));
    };

    const updateQuantity = (item_id, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(item_id);
        } else {
            setCart(cart.map(item =>
                item.item_id === item_id ? { ...item, quantity: newQuantity } : item
            ));
        }
    };

    const getTotalAmount = () => {
        return cart.reduce((total, item) => total + (item.item_price * item.quantity), 0);
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) {
            alert('Please add items to cart before ordering');
            return;
        }

        if (!paymentMethod) {
            alert('Please select a payment method');
            return;
        }

        try {
            const orderData = {
                items: cart.map(item => ({
                    item_id: item.item_id,
                    quantity: item.quantity,
                    price: item.item_price
                })),
                total_amount: getTotalAmount(),
                payment_method: paymentMethod,
                dining_option: diningOption
            };

            await axios.post('/api/guest/orders', orderData);
            alert('Order placed successfully!');
            setCart([]);
            setPaymentMethod('');
            fetchData();
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        }
    };

    const categorizedMenu = categorizeMenu();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Menu Section */}
            <div className="flex-1 p-8 overflow-auto">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-slate-900">Food Ordering</h3>
                        <p className="text-sm text-slate-500">Order authentic Sri Lankan cuisine to your room</p>
                    </div>

                    {Object.entries(categorizedMenu).map(([category, items]) => (
                        items.length > 0 && (
                            <div key={category} className="mb-6">
                                <h4 className="font-semibold text-slate-900 mb-3">{category}</h4>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div key={item.item_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                            <div className="flex-1">
                                                <h5 className="font-semibold text-slate-900">{item.item_name}</h5>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {item.item_name.includes('Kottu') && 'Traditional chopped up fried roti with vegetables'}
                                                    {item.item_name.includes('Rice') && 'Sri Lankan style fried rice'}
                                                    {!item.item_name.includes('Kottu') && !item.item_name.includes('Rice') && 'Delicious food item'}
                                                </p>
                                                <p className="text-blue-600 font-semibold mt-2">Rs. {item.item_price}</p>
                                            </div>
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="ml-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-auto">
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🛒</span>
                        <h3 className="font-bold text-slate-900">Your Cart</h3>
                    </div>
                </div>

                {cart.length === 0 ? (
                    <p className="text-slate-500 text-sm italic text-center py-8">Your cart is empty</p>
                ) : (
                    <div className="space-y-3 mb-6">
                        {cart.map((item) => (
                            <div key={item.item_id} className="border border-slate-200 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-semibold text-slate-900 text-sm">{item.item_name}</h5>
                                    <button
                                        onClick={() => removeFromCart(item.item_id)}
                                        className="text-red-500 hover:text-red-700 text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                                            className="w-6 h-6 bg-slate-200 rounded hover:bg-slate-300 flex items-center justify-center"
                                        >
                                            -
                                        </button>
                                        <span className="font-medium text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                                            className="w-6 h-6 bg-slate-200 rounded hover:bg-slate-300 flex items-center justify-center"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="text-blue-600 font-semibold text-sm">
                                        Rs. {item.item_price * item.quantity}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {currentBooking && (
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold text-slate-900 text-sm mb-2">Order Status</h4>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-600">
                                <span className="font-medium">Room:</span> {currentBooking.room_number || 'N/A'}
                            </p>
                            <p className="text-xs text-slate-600">
                                <span className="font-medium">Status:</span>{' '}
                                <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs">
                                    {currentBooking.rb_status}
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                {cart.length > 0 && (
                    <div>
                        {/* Dining Option Selection */}
                        <div className="border-t border-slate-200 pt-4 mb-4">
                            <h4 className="font-semibold text-slate-900 mb-3">Dining Option</h4>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDiningOption('Delivery')}
                                    className={`flex-1 p-3 rounded-lg border-2 transition-all text-center font-medium ${diningOption === 'Delivery'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    🛵 Delivery
                                </button>
                                <button
                                    onClick={() => setDiningOption('Dine-in')}
                                    className={`flex-1 p-3 rounded-lg border-2 transition-all text-center font-medium ${diningOption === 'Dine-in'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    🍽️ Dine-in
                                </button>
                            </div>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="border-t border-slate-200 pt-4 mb-4">
                            <h4 className="font-semibold text-slate-900 mb-3">Payment Method</h4>
                            <div className="space-y-2">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.value}
                                        onClick={() => setPaymentMethod(method.value)}
                                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${paymentMethod === method.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{method.icon}</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900 text-sm">{method.label}</p>
                                                <p className="text-xs text-slate-500">{method.description}</p>
                                            </div>
                                            {paymentMethod === method.value && (
                                                <span className="text-blue-500">✓</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="border-t border-slate-200 pt-4 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-slate-900">Total</span>
                                <span className="font-bold text-xl text-blue-600">
                                    Rs. {getTotalAmount()}
                                </span>
                            </div>
                        </div>

                        {/* Order Button */}
                        <button
                            onClick={handlePlaceOrder}
                            disabled={!paymentMethod}
                            className={`w-full py-3 rounded-lg font-semibold transition-all ${paymentMethod
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {paymentMethod ? 'Place Order' : 'Select Payment Method'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FoodOrders;
