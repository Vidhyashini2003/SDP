/**
 * Step3WalkInCheckout
 * Same as the guest Step3ReviewCheckout but replaces the online
 * payment section with a "Card Swipe Terminal" notice.
 * The actual swipe modal is controlled by the parent wizard.
 */
const Step3WalkInCheckout = ({
    bookingData,
    setBookingData,
    getTotalAmount,
    onBack,
    onComplete,
    loading,
    selectedGuest
}) => {
    const getFoodTotal = () => {
        return bookingData.food.reduce((sum, group) => {
            return sum + group.items.reduce((iSum, item) => iSum + (item.item_price * item.quantity), 0);
        }, 0);
    };

    const getActivitiesTotal = () => {
        return bookingData.activities.reduce((sum, activity) => sum + parseFloat(activity.price || 0), 0);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Review Walk-in Booking</h2>

            {/* Guest Banner */}
            {selectedGuest && (
                <div className="mb-6 p-4 bg-slate-900 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                        {(selectedGuest.guest_name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Booking For</p>
                        <p className="text-white font-black">{selectedGuest.guest_name}</p>
                        <p className="text-slate-400 text-xs">{selectedGuest.guest_email}</p>
                    </div>
                    <div className="ml-auto">
                        <span className="px-3 py-1 bg-gold-500/10 border border-gold-500/30 rounded-full text-[10px] font-black text-gold-400 uppercase tracking-widest">
                            Walk-in
                        </span>
                    </div>
                </div>
            )}

            {/* Room Details */}
            <div className="mb-6 p-6 bg-slate-50 rounded-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-4">🏨 Room Reservation</h3>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-700">Room Type:</span>
                        <span className="font-semibold">{bookingData.room.room_type}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-700">Check-in:</span>
                        <span className="font-semibold">{new Date(bookingData.checkIn).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-700">Check-out:</span>
                        <span className="font-semibold">{new Date(bookingData.checkOut).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-700">Nights:</span>
                        <span className="font-semibold">{bookingData.nights}</span>
                    </div>
                    {bookingData.numRooms && bookingData.numRooms > 1 && (
                        <div className="flex justify-between">
                            <span className="text-slate-700">Rooms:</span>
                            <span className="font-semibold">{bookingData.numRooms}</span>
                        </div>
                    )}
                    {(bookingData.adults || bookingData.kids > 0) && (
                        <div className="flex justify-between">
                            <span className="text-slate-700">Guests:</span>
                            <span className="font-semibold">
                                {bookingData.adults || 2} adult{(bookingData.adults || 2) !== 1 ? 's' : ''}
                                {bookingData.kids > 0 ? `, ${bookingData.kids} child${bookingData.kids !== 1 ? 'ren' : ''}` : ''}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-300">
                        <span className="text-slate-700">Room Total:</span>
                        <span className="font-bold text-lg">Rs. {bookingData.roomAmount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Food Orders */}
            {bookingData.food.length > 0 && (
                <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">🍽️ Scheduled Meals</h3>
                    <div className="space-y-4">
                        {bookingData.food.map((group, gIdx) => (
                            <div key={gIdx} className="border-b border-blue-100 last:border-0 pb-2 last:pb-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                        {new Date(group.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{group.meal_type}</span>
                                </div>
                                {group.items.map((item, iIdx) => (
                                    <div key={iIdx} className="flex justify-between text-sm pl-2">
                                        <span className="text-slate-700">{item.item_name} × {item.quantity}</span>
                                        <span className="font-semibold">Rs. {(item.item_price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-blue-300">
                            <span className="text-slate-900 font-semibold">Food Subtotal:</span>
                            <span className="font-bold">Rs. {getFoodTotal().toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Activities */}
            {bookingData.activities.length > 0 && (
                <div className="mb-6 p-6 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">🏊 Activity Bookings</h3>
                    <div className="space-y-2">
                        {bookingData.activities.map((activity, index) => (
                            <div key={index} className="flex justify-between">
                                <div>
                                    <span className="text-slate-700 font-semibold">{activity.name}</span>
                                    <p className="text-xs text-slate-600">{new Date(activity.start_time).toLocaleString()}</p>
                                </div>
                                <span className="font-semibold">Rs. {parseFloat(activity.price || 0).toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-green-300">
                            <span className="text-slate-900 font-semibold">Activities Subtotal:</span>
                            <span className="font-bold">Rs. {getActivitiesTotal().toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Vehicle Hire */}
            {bookingData.vehicle && (
                <div className="mb-6 p-6 bg-amber-50 rounded-lg border border-amber-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">🚗 Vehicle Hire</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-700">Vehicle Type:</span>
                            <span className="font-semibold">{bookingData.vehicle.type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-700">Hire Date:</span>
                            <span className="font-semibold">{bookingData.vehicle.date}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-700">Duration:</span>
                            <span className="font-semibold">{bookingData.vehicle.days} day(s)</span>
                        </div>
                        <div className="pt-2 border-t border-amber-300">
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center">
                                ⏳ Vehicle payment collected separately after driver confirms
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Arrival Transport */}
            {bookingData.arrivalTransport && (
                <div className="mb-6 p-6 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-lg shadow-slate-200">
                    <h3 className="text-xl font-bold mb-4">✈️ Arrival Transport</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">Pickup Location</span>
                            <span className="font-bold">{bookingData.arrivalTransport.pickup_location}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">Scheduled At</span>
                            <span className="font-bold">
                                {new Date(bookingData.arrivalTransport.scheduled_at).toLocaleDateString()} at {new Date(bookingData.arrivalTransport.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-[10px] text-amber-400 italic font-bold text-center pt-2 border-t border-slate-700">
                            ⏳ Paid to driver upon arrival
                        </p>
                    </div>
                </div>
            )}

            {/* Total */}
            <div className="mb-6 p-6 bg-gold-50 rounded-lg border-2 border-gold-500">
                <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-slate-900">TOTAL DUE NOW</span>
                    <span className="text-3xl font-bold text-gold-600">Rs. {getTotalAmount().toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-widest">
                    * Vehicle hire &amp; arrival transport costs not included (paid separately)
                </p>
            </div>

            {/* Card Swipe Terminal Notice */}
            <div className="mb-8 p-6 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700 shadow-inner">
                        💳
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Card Swipe Terminal</h3>
                        <p className="text-slate-400 text-xs mt-0.5 font-mono">POS device required for payment</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 text-[10px] font-black uppercase tracking-widest">Terminal Ready</span>
                    </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="text-green-400">✓</span>
                        <span>Instant booking confirmation upon payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="text-green-400">✓</span>
                        <span>Receipt issued to guest after swipe</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-amber-400 font-bold">
                        <span>⚠</span>
                        <span>Ask guest to present their payment card at the terminal</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    ← Back to Extras
                </button>
                <button
                    onClick={onComplete}
                    disabled={loading}
                    className="px-12 py-4 bg-slate-900 hover:bg-gold-600 text-white font-bold text-lg rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                    <span>💳</span>
                    <span>{loading ? 'Processing...' : `Swipe Card — Rs. ${getTotalAmount().toLocaleString()}`}</span>
                </button>
            </div>
        </div>
    );
};

export default Step3WalkInCheckout;
