import { useState, useEffect } from 'react';
import axios from '../../config/axios';

// Local food images removed - all images served from backend uploads

const Step2AddExtras = ({
    bookingData,
    setBookingData,
    menuItems,
    setMenuItems,
    availableActivities,
    setAvailableActivities,
    availableVehicles,
    setAvailableVehicles,
    onNext,
    onBack,
    onSkip,
    isWalkIn = false
}) => {
    const [activeTab, setActiveTab] = useState('food');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [activityDate, setActivityDate] = useState('');
    const [activitySlot, setActivitySlot] = useState('');

    useEffect(() => {
        fetchMenuItems();
        fetchActivities();
        fetchVehicles();
    }, []);

    const fetchMenuItems = async () => {
        try {
            const response = await axios.get('/api/guest/menu');
            setMenuItems(response.data || []);
        } catch (error) {
            console.error('Error fetching menu:', error);
        }
    };

    const fetchActivities = async () => {
        try {
            const response = await axios.get('/api/bookings/activities/available');
            setAvailableActivities(response.data || []);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const fetchVehicles = async () => {
        try {
            const response = await axios.get('/api/bookings/vehicles/available');
            setAvailableVehicles(response.data || []);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    // Food functions
    const addFoodItem = (item, date, mealType, diningOption) => {
        if (!date || !mealType) {
            alert('Please select a date and meal type for this item');
            return;
        }

        const existingGroupIndex = bookingData.food.findIndex(
            f => f.scheduled_date === date && f.meal_type === mealType
        );

        if (existingGroupIndex !== -1) {
            const group = { ...bookingData.food[existingGroupIndex] };
            const existingItem = group.items.find(i => i.item_id === item.item_id);

            // Update dining option if it was changed
            if (diningOption) {
                group.dining_option = diningOption;
            }

            if (existingItem) {
                group.items = group.items.map(i =>
                    i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i
                );
            } else {
                group.items = [...group.items, { ...item, quantity: 1 }];
            }

            const updatedFood = [...bookingData.food];
            updatedFood[existingGroupIndex] = group;
            setBookingData({ ...bookingData, food: updatedFood });
        } else {
            setBookingData({
                ...bookingData,
                food: [
                    ...bookingData.food,
                    {
                        scheduled_date: date,
                        meal_type: mealType,
                        dining_option: diningOption || 'Delivery',
                        items: [{ ...item, quantity: 1 }]
                    }
                ]
            });
        }
    };

    const removeFoodItem = (item_id, date, mealType) => {
        const updatedFood = bookingData.food.map(group => {
            if (group.scheduled_date === date && group.meal_type === mealType) {
                return {
                    ...group,
                    items: group.items.filter(i => i.item_id !== item_id)
                };
            }
            return group;
        }).filter(group => group.items.length > 0);

        setBookingData({ ...bookingData, food: updatedFood });
    };

    const updateFoodQuantity = (item_id, delta, date, mealType) => {
        const groupIndex = bookingData.food.findIndex(
            f => f.scheduled_date === date && f.meal_type === mealType
        );

        if (groupIndex !== -1) {
            const group = { ...bookingData.food[groupIndex] };
            const item = group.items.find(i => i.item_id === item_id);

            if (item) {
                const newQuantity = item.quantity + delta;
                if (newQuantity <= 0) {
                    removeFoodItem(item_id, date, mealType);
                } else {
                    group.items = group.items.map(i =>
                        i.item_id === item_id ? { ...i, quantity: newQuantity } : i
                    );
                    const updatedFood = [...bookingData.food];
                    updatedFood[groupIndex] = group;
                    setBookingData({ ...bookingData, food: updatedFood });
                }
            }
        }
    };

    const clearFoodBasket = () => {
        setBookingData({ ...bookingData, food: [] });
    };

    // Activity functions
    const addActivity = (activity, date, slot) => {
        if (!activity || !date || !slot) {
            alert('Please select an activity, date and time slot');
            return;
        }

        // Check if this activity+date+slot is already booked
        const alreadyAdded = bookingData.activities.some(
            a => a.activity_id === activity.activity_id &&
                 a.start_time === `${date}T${slot}:00`
        );
        if (alreadyAdded) {
            alert('This activity is already added for this time slot');
            return;
        }

        // Build start/end datetime (1 hour session)
        const start_time = `${date}T${slot}:00`;
        const [hours, minutes] = slot.split(':').map(Number);
        const endHour = String(hours + 1).padStart(2, '0');
        const end_time = `${date}T${endHour}:${String(minutes).padStart(2, '0')}:00`;

        const price = parseFloat(activity.activity_price_per_hour) || 0;

        setBookingData({
            ...bookingData,
            activities: [
                ...bookingData.activities,
                {
                    activity_id: activity.activity_id,
                    name: activity.activity_name,
                    start_time,
                    end_time,
                    price
                }
            ]
        });
    };

    const removeActivity = (index) => {
        setBookingData({
            ...bookingData,
            activities: bookingData.activities.filter((_, i) => i !== index)
        });
    };

    // Vehicle functions
    const selectVehicle = (vehicle, date) => {
        const start = new Date(date || bookingData.checkIn);
        const end = new Date(bookingData.checkOut);
        let calculatedDays = 1;
        if (end > start) {
            calculatedDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
        }
        setBookingData({
            ...bookingData,
            vehicle: {
                vehicle_id: vehicle.vehicle_id,
                type: vehicle.vehicle_type,
                date: date || bookingData.checkIn,
                days: calculatedDays,
                price: vehicle.vehicle_price_per_day
            }
        });
    };

    const removeVehicle = () => {
        setBookingData({ ...bookingData, vehicle: null });
    };

    const categorizeMenu = () => {
        return { 'Our Menu': menuItems };
    };

    const getExtrasCount = () => {
        const foodItemCount = bookingData.food.reduce((sum, group) => sum + group.items.length, 0);
        return foodItemCount + bookingData.activities.length + (bookingData.vehicle ? 1 : 0);
    };

    const getTotalPrice = () => {
        const foodTotal = bookingData.food.reduce((sum, group) => {
            return sum + group.items.reduce((iSum, item) => iSum + (item.item_price * item.quantity), 0);
        }, 0);
        const activityTotal = bookingData.activities.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
        const vehicleTotal = bookingData.vehicle ? (bookingData.vehicle.price * bookingData.vehicle.days) : 0;
        return foodTotal + activityTotal + vehicleTotal;
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden max-w-7xl mx-auto min-h-[700px]">
            {/* Header Area */}
            <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Personalize Your Stay</h2>
                    <p className="text-slate-400 text-sm mt-1">Enhance your experience with our premium services</p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selected Extras</span>
                    <div className="text-2xl font-black text-gold-500">
                        Rs. {getTotalPrice().toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Main Content: 2-Panel Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Panel: Tabs and Options */}
                <div className="flex-1 flex flex-col border-r border-slate-100 overflow-hidden">
                    {/* Tabs Navigation */}
                    <div className="flex px-4 pt-4 border-b border-slate-100 bg-slate-50/30">
                        <TabButton 
                            label="Schedule Meals" 
                            icon="🍽️" 
                            active={activeTab === 'food'} 
                            onClick={() => setActiveTab('food')} 
                        />
                        <TabButton 
                            label="Book Activities" 
                            icon="🏊" 
                            active={activeTab === 'activities'} 
                            onClick={() => setActiveTab('activities')} 
                        />
                        <TabButton 
                            label="Arrange Vehicle" 
                            icon="🚗" 
                            active={activeTab === 'vehicle'} 
                            onClick={() => setActiveTab('vehicle')} 
                        />
                    </div>

                    {/* Options Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {activeTab === 'food' && (
                            <FoodTab
                                categorizeMenu={categorizeMenu}
                                bookingData={bookingData}
                                setBookingData={setBookingData}
                                addFoodItem={addFoodItem}
                                removeFoodItem={removeFoodItem}
                                updateFoodQuantity={updateFoodQuantity}
                                clearFoodBasket={clearFoodBasket}
                            />
                        )}

                        {activeTab === 'activities' && (
                            <ActivitiesTab
                                availableActivities={availableActivities}
                                bookingData={bookingData}
                                addActivity={addActivity}
                                removeActivity={removeActivity}
                            />
                        )}

                        {activeTab === 'vehicle' && (
                            <VehicleTab
                                availableVehicles={availableVehicles}
                                bookingData={bookingData}
                                setBookingData={setBookingData}
                                selectVehicle={selectVehicle}
                                removeVehicle={removeVehicle}
                                isWalkIn={isWalkIn}
                            />
                        )}
                    </div>
                </div>

                {/* Right Panel: Selection Sidebar */}
                <div className="w-[380px] bg-slate-50 p-8 flex flex-col overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span>📝</span> Your Selection
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                        {/* Food Selection */}
                        {bookingData.food.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Meals</h4>
                                {bookingData.food.map((group, gIdx) => (
                                    <div key={gIdx} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded">
                                                {new Date(group.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{group.meal_type}</span>
                                        </div>
                                        {group.items.map(item => (
                                            <div key={item.item_id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm ml-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-800">{item.item_name} × {item.quantity}</span>
                                                    <span className="text-[10px] text-slate-500">Rs. {(item.item_price * item.quantity).toLocaleString()}</span>
                                                </div>
                                                <button onClick={() => removeFoodItem(item.item_id, group.scheduled_date, group.meal_type)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Activity Selection */}
                        {bookingData.activities.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activities</h4>
                                {bookingData.activities.map((activity, index) => (
                                    <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-800">{activity.name}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-500">{new Date(activity.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                <span className="text-[10px] text-gold-600 font-bold">{new Date(activity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => removeActivity(index)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Vehicle Selection */}
                        {bookingData.vehicle && (
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transport</h4>
                                <div className="bg-white p-3 rounded-xl border border-gold-200 flex justify-between items-center shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800">{bookingData.vehicle.type}</span>
                                        <span className="text-[10px] text-slate-500">{bookingData.vehicle.days} Days Selection</span>
                                    </div>
                                    <button onClick={removeVehicle} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                                </div>
                            </div>
                        )}

                        {getExtrasCount() === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mb-4 border border-slate-100 shadow-sm">🛒</div>
                                <p className="text-slate-500 text-sm font-medium">Your basket is empty</p>
                                <p className="text-slate-400 text-[10px] mt-1">Choose items from the left to enhance your stay</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Sidebar Action */}
                    <div className="mt-8 pt-6 border-t border-slate-200">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-sm font-bold text-slate-500">Total Extras</span>
                            <span className="text-xl font-black text-slate-900">
                                Rs. {getTotalPrice().toLocaleString()}
                            </span>
                        </div>
                        <button
                            onClick={onNext}
                            className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-black rounded-xl transition-all shadow-xl shadow-gold-100 transform active:scale-95"
                        >
                            Continue →
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Global Footer Navigation */}
            <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
                >
                    <span className="text-xl">←</span> Back to Room Selection
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={onSkip}
                        className="px-6 py-3 text-slate-400 hover:text-slate-600 font-bold transition-colors text-sm"
                    >
                        No thanks, just the room
                    </button>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ label, icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-8 py-4 font-bold text-sm transition-all relative flex items-center gap-2 ${active
            ? 'text-gold-600'
            : 'text-slate-400 hover:text-slate-600'
            }`}
    >
        <span className="text-lg">{icon}</span> {label}
        {active && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold-500 rounded-t-full" />
        )}
    </button>
);

const FoodTab = ({ categorizeMenu, bookingData, setBookingData, addFoodItem, removeFoodItem, updateFoodQuantity, clearFoodBasket }) => {
    const [selectedDate, setSelectedDate] = useState(bookingData.checkIn);
    const [selectedMealType, setSelectedMealType] = useState('Breakfast');
    const [selectedDiningOption, setSelectedDiningOption] = useState('Delivery');

    const getDatesInRange = (startDate, endDate) => {
        const dates = [];
        let curr = new Date(startDate);
        const last = new Date(endDate);
        while (curr <= last) {
            dates.push(new Date(curr).toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    };

    const getTodayStr = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const isMealTypeDisabled = (date, type) => {
        const now = new Date();
        const todayStr = getTodayStr();
        
        if (date < todayStr) return true;
        if (date > todayStr) return false;

        const currentHour = now.getHours();
        if (type === 'Breakfast') return currentHour >= 10;
        if (type === 'Lunch') return currentHour >= 15;
        if (type === 'Dinner') return currentHour >= 22;
        return false;
    };

    const stayDates = getDatesInRange(bookingData.checkIn, bookingData.checkOut);
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

    // Auto-select first available date and meal
    useEffect(() => {
        const todayStr = getTodayStr();
        const firstAvailableDate = stayDates.find(d => d >= todayStr) || stayDates[0];
        setSelectedDate(firstAvailableDate);

        if (isMealTypeDisabled(firstAvailableDate, 'Breakfast')) {
            const nextAvailable = mealTypes.find(t => !isMealTypeDisabled(firstAvailableDate, t));
            if (nextAvailable) setSelectedMealType(nextAvailable);
            else if (firstAvailableDate === todayStr && stayDates.length > 1) {
                // If today is fully booked, check tomorrow
                setSelectedDate(stayDates[1]);
                setSelectedMealType('Breakfast');
            }
        }
    }, []);

    // Ensure selected meal type is valid when date changes
    useEffect(() => {
        if (isMealTypeDisabled(selectedDate, selectedMealType)) {
            const nextAvailable = mealTypes.find(t => !isMealTypeDisabled(selectedDate, t));
            if (nextAvailable) setSelectedMealType(nextAvailable);
        }
    }, [selectedDate]);

    // getFoodImage fallback removed
    const categories = categorizeMenu();

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-8">
            {/* Scheduling Controls */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row gap-x-8 gap-y-6 items-stretch md:items-start">
                    <div className="flex-1 min-w-0 space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Menu Date</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {stayDates.map(date => {
                                const d = new Date(date);
                                const isActive = selectedDate === date;
                                return (
                                    <button
                                        key={date}
                                        onClick={() => setSelectedDate(date)}
                                        className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${isActive ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/20 scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString(undefined, { month: 'short' })}</span>
                                        <span className="text-xl font-black">{d.getDate()}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 w-full md:w-80 flex-shrink-0">
                        <div className="w-full space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Meal Time</label>
                            <div className="flex bg-slate-800 p-1.5 rounded-2xl">
                                {mealTypes.map(type => {
                                    const disabled = isMealTypeDisabled(selectedDate, type);
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => !disabled && setSelectedMealType(type)}
                                            disabled={disabled}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${selectedMealType === type ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'} ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
                                        >
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="w-full space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dining Option</label>
                            <div className="flex bg-slate-800 p-1.5 rounded-2xl">
                                {['Delivery', 'Dine-in'].map(opt => {
                                    const currentGroup = bookingData.food.find(
                                        f => f.scheduled_date === selectedDate && f.meal_type === selectedMealType
                                    );
                                    const activeOption = currentGroup ? currentGroup.dining_option : selectedDiningOption;
                                    
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => {
                                                setSelectedDiningOption(opt);
                                                if (currentGroup) {
                                                    const updatedFood = bookingData.food.map(g => 
                                                        (g.scheduled_date === selectedDate && g.meal_type === selectedMealType) 
                                                        ? { ...g, dining_option: opt } : g
                                                    );
                                                    setBookingData({ ...bookingData, food: updatedFood });
                                                }
                                            }}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeOption === opt ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {opt === 'Delivery' ? '🛵' : '🍽️'} {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="space-y-12 pb-10">
                {Object.entries(categories).map(([category, items]) => (
                    <div key={category}>
                        <div className="flex items-center gap-4 mb-6">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{category}</h3>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.map(item => {
                                const img = item.item_image ? (item.item_image.startsWith('/') ? `${axios.defaults.baseURL}${item.item_image}` : item.item_image) : null;
                                const displayName = item.item_name === 'Pol Sambol & Hoppers' ? 'pol rotti and sambol' : item.item_name;
                                
                                const currentGroup = bookingData.food.find(
                                    f => f.scheduled_date === selectedDate && f.meal_type === selectedMealType
                                );
                                const inCartItem = currentGroup?.items.find(i => i.item_id === item.item_id);

                                return (
                                    <div key={item.item_id} className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-4 hover:border-gold-300 hover:shadow-xl hover:shadow-gold-50 transition-all group">
                                        <div className="w-20 h-20 flex-shrink-0 relative overflow-hidden rounded-xl">
                                            {img ? (
                                                <img src={img} alt={item.item_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-2xl">🍲</div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <h5 className="font-bold text-slate-900 text-sm">{displayName}</h5>
                                            <p className="text-gold-600 font-black mt-1 text-sm">Rs. {item.item_price.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center">
                                            {!inCartItem ? (
                                                <button 
                                                    onClick={() => !isMealTypeDisabled(selectedDate, selectedMealType) && addFoodItem(item, selectedDate, selectedMealType, selectedDiningOption)}
                                                    disabled={isMealTypeDisabled(selectedDate, selectedMealType)}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all transform active:scale-95 shadow-lg shadow-slate-900/10 ${isMealTypeDisabled(selectedDate, selectedMealType) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-gold-500 text-white'}`}
                                                >
                                                    <span className="text-xl font-light">{isMealTypeDisabled(selectedDate, selectedMealType) ? '✕' : '+'}</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                                    <button onClick={() => updateFoodQuantity(item.item_id, -1, selectedDate, selectedMealType)} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center font-bold text-slate-600 shadow-sm">-</button>
                                                    <span className="font-bold text-xs w-4 text-center">{inCartItem.quantity}</span>
                                                    <button onClick={() => updateFoodQuantity(item.item_id, 1, selectedDate, selectedMealType)} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center font-bold text-slate-600 shadow-sm">+</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ActivitiesTab = ({ availableActivities, bookingData, addActivity, removeActivity }) => {
    const [selectedAct, setSelectedAct] = useState(null);
    const [actDate, setActDate] = useState(bookingData.checkIn);
    const [actSlot, setActSlot] = useState('');
    const [slotAvailability, setSlotAvailability] = useState([]); // [{time, isBooked}]
    const [loadingSlots, setLoadingSlots] = useState(false);

    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    // Fetch slot availability whenever activity or date changes
    useEffect(() => {
        if (!selectedAct || !actDate) {
            setSlotAvailability([]);
            setActSlot('');
            return;
        }
        const fetchSlots = async () => {
            setLoadingSlots(true);
            setActSlot(''); // reset selected slot when activity/date changes
            try {
                const res = await axios.get('/api/bookings/activities/slots', {
                    params: { activity_id: selectedAct.activity_id, date: actDate }
                });
                setSlotAvailability(res.data || []);
            } catch (err) {
                console.error('Failed to fetch slots:', err);
                setSlotAvailability([]);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedAct, actDate]);

    const isSlotBooked = (slot) => {
        const found = slotAvailability.find(s => s.time === slot);
        return found ? found.isBooked : false;
    };

    const isSlotPast = (date, slot) => {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (date < todayStr) return true;
        if (date > todayStr) return false;
        
        const [h, m] = slot.split(':').map(Number);
        const slotDate = new Date();
        slotDate.setHours(h, m, 0, 0);
        return now > slotDate;
    };

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-8">
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Activity</label>
                        <div className="grid grid-cols-1 gap-3">
                            {availableActivities.map(act => (
                                <button
                                    key={act.activity_id}
                                    onClick={() => setSelectedAct(act)}
                                    className={`text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${selectedAct?.activity_id === act.activity_id ? 'border-gold-500 bg-gold-50 shadow-md shadow-gold-50' : 'border-slate-100 hover:border-gold-200 bg-slate-50/50'}`}
                                >
                                    {act.activity_image ? (
                                        <img
                                            src={act.activity_image.startsWith('/') ? `${axios.defaults.baseURL}${act.activity_image}` : act.activity_image}
                                            alt={act.activity_name}
                                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-2xl flex-shrink-0">🏊</div>
                                    )}
                                    <div>
                                        <h5 className="font-bold text-slate-900 text-sm">{act.activity_name}</h5>
                                        <p className="text-[10px] font-bold text-gold-600 mt-1">Rs. {act.activity_price_per_hour}/hr</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Slot</label>
                            <input 
                                type="date" 
                                value={actDate} 
                                onChange={(e) => setActDate(e.target.value)} 
                                min={bookingData.checkIn} 
                                max={bookingData.checkOut}
                                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-gold-500/20"
                            />

                            {/* Slot grid with availability */}
                            {!selectedAct ? (
                                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm mb-3">👈</div>
                                    <p className="text-sm font-bold text-slate-600">Select an Activity</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Choose an activity from the list to see available time slots.</p>
                                </div>
                            ) : loadingSlots ? (
                                <div className="flex items-center justify-center py-6 text-slate-400 text-xs font-bold">
                                    Loading availability...
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {timeSlots.map(slot => {
                                        const booked = isSlotBooked(slot);
                                        const past = isSlotPast(actDate, slot);
                                        const selected = actSlot === slot;
                                        return (
                                            <button 
                                                key={slot} 
                                                onClick={() => !booked && !past && setActSlot(slot)}
                                                disabled={booked || past}
                                                title={booked ? 'Already booked' : past ? 'Time has passed' : slot}
                                                className={`p-3 rounded-xl border text-[10px] font-black transition-all relative flex flex-col items-center gap-0.5
                                                    ${booked || past
                                                        ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-70'
                                                        : selected
                                                            ? 'bg-slate-900 text-white shadow-lg border-slate-900'
                                                            : 'bg-white text-slate-400 hover:border-gold-200'
                                                    }`}
                                            >
                                                <span>{slot}</span>
                                                {(booked || past) && (
                                                    <span className="text-[8px] font-black text-red-400 uppercase tracking-wide leading-none text-center">
                                                        {booked ? 'Unavailable' : 'Time Passed'}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => { addActivity(selectedAct, actDate, actSlot); setActSlot(''); }}
                            disabled={!selectedAct || !actSlot}
                            className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-black rounded-2xl disabled:opacity-30 shadow-xl shadow-gold-100 transition-all transform active:scale-95"
                        >
                            Book Activity
                        </button>
                    </div>
                </div>
             </div>
        </div>
    );
};

const VehicleTab = ({ availableVehicles, bookingData, setBookingData, selectVehicle, removeVehicle, isWalkIn }) => {

    const [vehicleSubTab, setVehicleSubTab] = useState(isWalkIn ? 'hire' : 'arrival');
    const [hireStartDate, setHireStartDate] = useState(bookingData.checkIn || '');

    const getCalculatedDays = () => {
        if (!hireStartDate || !bookingData.checkOut) return bookingData.nights || 1;
        const start = new Date(hireStartDate);
        const end = new Date(bookingData.checkOut);
        if (end <= start) return 1;
        return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    };
    const calculatedDays = getCalculatedDays();

    // Arrival Transport state
    const [arrivalForm, setArrivalForm] = useState({
        pickup_location: '',
        custom_pickup_location: '',
        arrival_date: bookingData.checkIn || '',
        arrival_time: '',
        flight_train_number: '',
        num_passengers: 1,
        vehicle_type_requested: '',
        notes: ''
    });
    const [arrivalSuccess, setArrivalSuccess] = useState(null);

    const pickupLocations = [
        'Colombo Airport (BIA)',
        'Katunayake Airport',
        'Colombo Fort Railway Station',
        'Kandy Railway Station',
        'Galle Bus Stand',
        'Matara Bus Stand',
        'Port of Colombo',
        'Other'
    ];

    const vehicleTypes = [...new Set(availableVehicles.map(v => v.vehicle_type))];

    const handleArrivalSubmit = (e) => {
        e.preventDefault();
        if (!arrivalForm.pickup_location || !arrivalForm.arrival_date || !arrivalForm.arrival_time) {
            alert('Please fill in pickup location, arrival date and time.');
            return;
        }
        if (arrivalForm.pickup_location === 'Other' && !arrivalForm.custom_pickup_location) {
            alert('Please specify the custom pickup location.');
            return;
        }

        const scheduled_at = `${arrivalForm.arrival_date}T${arrivalForm.arrival_time}:00`;
        const scheduledDateTime = new Date(scheduled_at);
        const now = new Date();

        if (scheduledDateTime < now) {
            alert('You cannot schedule an arrival transfer for a past time. Please select a valid future time.');
            return;
        }

        const finalPickupLocation = arrivalForm.pickup_location === 'Other' ? arrivalForm.custom_pickup_location : arrivalForm.pickup_location;

        // Calculate estimated price locally
        let estimatedPrice = 0;
        if (arrivalForm.vehicle_type_requested) {
            const v = availableVehicles.find(v => v.vehicle_type === arrivalForm.vehicle_type_requested);
            if (v) estimatedPrice = parseFloat(v.vehicle_price_per_day);
        }

        setBookingData({
            ...bookingData,
            arrivalTransport: {
                pickup_location: finalPickupLocation,
                scheduled_at,
                flight_train_number: arrivalForm.flight_train_number || null,
                num_passengers: arrivalForm.num_passengers,
                vehicle_type_requested: arrivalForm.vehicle_type_requested || null,
                notes: arrivalForm.notes || null,
                estimatedPrice
            }
        });

        // Reset local form state
        setArrivalForm({
            pickup_location: '',
            custom_pickup_location: '',
            arrival_date: bookingData.checkIn || '',
            arrival_time: '',
            flight_train_number: '',
            num_passengers: 1,
            vehicle_type_requested: '',
            notes: ''
        });
    };

    const getMaxHireDate = () => {
        if (!bookingData.checkOut) return '';
        const d = new Date(bookingData.checkOut);
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    };
    const maxHireDate = getMaxHireDate();

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
            {/* Sub-tab navigation */}
            <div className="flex rounded-2xl bg-slate-100 p-1.5 gap-1">
                {!isWalkIn && (
                    <button
                        onClick={() => setVehicleSubTab('arrival')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${vehicleSubTab === 'arrival' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        ✈️ Arrival Transport
                    </button>
                )}
                <button
                    onClick={() => setVehicleSubTab('hire')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${vehicleSubTab === 'hire' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    🚗 Hire Vehicle
                </button>
            </div>

            {/* Terms & Conditions Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4 items-center">
                <div className="text-2xl">📜</div>
                <div className="text-xs text-amber-900">
                    <p className="font-bold">Vehicle Hire Terms:</p>
                    <ul className="list-disc ml-4 mt-1 opacity-80">
                        <li>Starting day is counted in the total number of days.</li>
                        <li>For new room bookings, vehicle hire is not available on your checkout day.</li>
                        <li>After checking in, you may hire a vehicle for your checkout day separately.</li>
                    </ul>
                </div>
            </div>

            {/* === ARRIVAL TRANSPORT === */}
            {vehicleSubTab === 'arrival' && (
                <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-xl">✈️</div>
                            <div>
                                <h4 className="font-bold text-slate-900">Arrival Transfer</h4>
                                <p className="text-xs text-slate-500">Request a pickup from airport, station or port to the hotel</p>
                            </div>
                        </div>

                        {bookingData.arrivalTransport ? (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">✅</div>
                                        <div>
                                            <h4 className="font-bold text-green-800">Transport Scheduled</h4>
                                            <p className="text-xs text-green-600">This will be confirmed with your room booking</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setBookingData({...bookingData, arrivalTransport: null})}
                                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-3 py-1 rounded-lg transition-colors border border-red-100"
                                    >
                                        Remove
                                    </button>
                                </div>
                                
                                <div className="space-y-3 bg-white/50 rounded-xl p-4 border border-green-100">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest">Pickup From</span>
                                        <span className="text-slate-900 font-bold">{bookingData.arrivalTransport.pickup_location}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest">Date & Time</span>
                                        <span className="text-slate-900 font-bold">
                                            {new Date(bookingData.arrivalTransport.scheduled_at).toLocaleDateString()} at {new Date(bookingData.arrivalTransport.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest">Vehicle Type</span>
                                        <span className="text-slate-900 font-bold">{bookingData.arrivalTransport.vehicle_type_requested || 'Any Available'}</span>
                                    </div>
                                    {bookingData.arrivalTransport.estimatedPrice > 0 && (
                                        <div className="pt-2 border-t border-green-100 mt-2 flex justify-between items-center">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">Est. Charge</span>
                                            <span className="text-gold-600 font-black text-lg">Rs. {bookingData.arrivalTransport.estimatedPrice.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleArrivalSubmit} className="space-y-4">
                                {/* Pickup Location */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pickup Location</label>
                                    <select
                                        value={arrivalForm.pickup_location}
                                        onChange={e => setArrivalForm({...arrivalForm, pickup_location: e.target.value})}
                                        required
                                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-sm outline-none focus:ring-2 focus:ring-gold-500/30"
                                    >
                                        <option value="">Select pickup location</option>
                                        {pickupLocations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                    {arrivalForm.pickup_location === 'Other' && (
                                        <div className="mt-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Add Pickup Location</label>
                                            <input
                                                type="text"
                                                value={arrivalForm.custom_pickup_location}
                                                onChange={e => setArrivalForm({...arrivalForm, custom_pickup_location: e.target.value})}
                                                placeholder="Enter pickup location"
                                                required={arrivalForm.pickup_location === 'Other'}
                                                className="w-full p-3 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-sm outline-none focus:ring-2 focus:ring-gold-500/30"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Arrival Date</label>
                                        <input
                                            type="date"
                                            value={arrivalForm.arrival_date}
                                            onChange={e => setArrivalForm({...arrivalForm, arrival_date: e.target.value})}
                                            min={bookingData.checkIn}
                                            max={bookingData.checkOut}
                                            required
                                            className="w-full p-3 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-sm outline-none focus:ring-2 focus:ring-gold-500/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Arrival Time</label>
                                        <input
                                            type="time"
                                            value={arrivalForm.arrival_time}
                                            onChange={e => setArrivalForm({...arrivalForm, arrival_time: e.target.value})}
                                            required
                                            className="w-full p-3 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-sm outline-none focus:ring-2 focus:ring-gold-500/30"
                                        />
                                    </div>
                                </div>

                                {/* Flight / Train Number & Passengers */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Flight / Train No.</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. UL 101"
                                            value={arrivalForm.flight_train_number}
                                            onChange={e => setArrivalForm({...arrivalForm, flight_train_number: e.target.value})}
                                            className="w-full p-3 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-sm outline-none focus:ring-2 focus:ring-gold-500/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">No. of Passengers</label>
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2">
                                            <button type="button" onClick={() => setArrivalForm({...arrivalForm, num_passengers: Math.max(1, arrivalForm.num_passengers - 1)})} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">-</button>
                                            <span className="flex-1 text-center font-bold text-slate-900">{arrivalForm.num_passengers}</span>
                                            <button type="button" onClick={() => setArrivalForm({...arrivalForm, num_passengers: Math.min(20, arrivalForm.num_passengers + 1)})} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">+</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle Type (optional) */}
                                {vehicleTypes.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Vehicle Type Preference <span className="text-slate-300">(optional)</span></label>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setArrivalForm({...arrivalForm, vehicle_type_requested: ''})}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${!arrivalForm.vehicle_type_requested ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                                            >
                                                Any
                                            </button>
                                            {vehicleTypes.map(type => (
                                                <button
                                                    type="button"
                                                    key={type}
                                                    onClick={() => setArrivalForm({...arrivalForm, vehicle_type_requested: type})}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${arrivalForm.vehicle_type_requested === type ? 'bg-gold-500 text-white border-gold-500' : 'bg-white text-slate-500 border-slate-200 hover:border-gold-300'}`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                        {arrivalForm.vehicle_type_requested && (() => {
                                            const v = availableVehicles.find(v => v.vehicle_type === arrivalForm.vehicle_type_requested);
                                            return v ? (
                                                <p className="text-xs text-gold-600 font-bold mt-2">
                                                    Estimated charge: Rs. {parseFloat(v.vehicle_price_per_day).toLocaleString()} (vehicle rate)
                                                </p>
                                            ) : null;
                                        })()}
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Special Notes <span className="text-slate-300">(optional)</span></label>
                                    <textarea
                                        value={arrivalForm.notes}
                                        onChange={e => setArrivalForm({...arrivalForm, notes: e.target.value})}
                                        placeholder="e.g. I have extra luggage, need child seat..."
                                        rows={2}
                                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-sm outline-none focus:ring-2 focus:ring-gold-500/30 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-black rounded-xl shadow-xl shadow-gold-100 transition-all transform active:scale-95"
                                >
                                    ✈️ Add Arrival Transfer
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* === HIRE VEHICLE === */}
            {vehicleSubTab === 'hire' && (
                <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-xl">🚗</div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900">Hire Vehicle Per Day</h4>
                                <p className="text-xs text-slate-500">
                                    Hire a vehicle for {calculatedDays} day(s) — travel anywhere freely during your stay
                                </p>
                            </div>
                            <div className="flex flex-col text-right">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Starting Date</label>
                                <input
                                    type="date"
                                    value={hireStartDate}
                                    onChange={e => {
                                        if (e.target.value === bookingData.checkOut) {
                                            alert("Vehicle hire starting on checkout day is only available after you check-in.");
                                            return;
                                        }
                                        setHireStartDate(e.target.value);
                                    }}
                                    min={bookingData.checkIn}
                                    max={maxHireDate}
                                    className="p-2 w-32 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 text-xs outline-none focus:ring-2 focus:ring-gold-500/30"
                                />
                            </div>
                        </div>
                    </div>

                    <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none">Pick your vehicle</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {availableVehicles.map(v => (
                            <div
                                key={v.vehicle_id}
                                className={`group rounded-[2rem] border transition-all overflow-hidden flex flex-col ${bookingData.vehicle?.vehicle_id === v.vehicle_id ? 'border-gold-500 bg-gold-50 shadow-xl shadow-gold-50' : 'border-slate-100 hover:border-gold-200 bg-white'}`}
                            >
                                {v.vehicle_image ? (
                                    <img
                                        src={v.vehicle_image.startsWith('/') ? `${axios.defaults.baseURL}${v.vehicle_image}` : v.vehicle_image}
                                        alt={v.vehicle_type}
                                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-36 bg-slate-50 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
                                        {v.vehicle_type === 'Car' ? '🚗' : v.vehicle_type === 'Bike' ? '🏍️' : '🚐'}
                                    </div>
                                )}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-xl font-black text-slate-900 group-hover:text-gold-600 transition-colors uppercase tracking-tight">{v.vehicle_type}</h4>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${bookingData.vehicle?.vehicle_id === v.vehicle_id ? 'bg-gold-500 text-white' : 'bg-slate-100 text-slate-300'}`}>✓</div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Plate: {v.vehicle_number}</p>
                                    
                                    <div className="pt-4 border-t border-slate-100 flex justify-between items-end mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Daily Rate</span>
                                            <span className="text-lg font-black text-slate-900 tracking-tighter">Rs. {v.vehicle_price_per_day.toLocaleString()}</span>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-[10px] font-black text-gold-500 uppercase tracking-widest leading-none mb-2">Total ({calculatedDays} d)</span>
                                            <span className="text-sm font-bold text-slate-400">Rs. {(v.vehicle_price_per_day * calculatedDays).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        {bookingData.vehicle?.vehicle_id === v.vehicle_id ? (
                                            <button 
                                                onClick={() => removeVehicle()}
                                                className="w-full py-3 bg-red-50 text-red-600 font-black rounded-xl text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all"
                                            >
                                                ✕ Remove Selection
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => selectVehicle(v, hireStartDate)}
                                                className="w-full py-3 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-gold-500 transition-all transform active:scale-95"
                                            >
                                                🚗 Add Hire Vehicle
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Step2AddExtras;
