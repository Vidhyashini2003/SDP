const Step3ReviewCheckout = ({
    bookingData,
    setBookingData,
    getTotalAmount,
    onBack,
    onComplete,
    loading
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
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Review Your Booking</h2>

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

            {/* Vehicle */}
            {bookingData.vehicle && (
                <div className="mb-6 p-6 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">🚗 Vehicle Hire</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-700">Vehicle Type:</span>
                            <span className="font-semibold">{bookingData.vehicle.type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-700">Duration:</span>
                            <span className="font-semibold">{bookingData.vehicle.days} days</span>
                        </div>
                        <p className="text-sm text-slate-600 italic">* Payment will be handled upon driver acceptance</p>
                    </div>
                </div>
            )}

            {/* Total */}
            <div className="mb-8 p-6 bg-gold-50 rounded-lg border-2 border-gold-500">
                <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-slate-900">TOTAL AMOUNT</span>
                    <span className="text-3xl font-bold text-gold-600">Rs. {getTotalAmount().toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                    * Vehicle hire cost not included (paid separately upon driver confirmation)
                </p>
            </div>

            {/* Payment Method - Simplified for mandatory card */}
            <div className="mb-8 p-6 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gold-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-gold-500/20">
                        💳
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Secure Online Payment</h3>
                        <p className="text-sm text-slate-500 italic">Required for instant room confirmation</p>
                    </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="text-gold-600">✓</span>
                        <span>Instant booking confirmation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="text-gold-600">✓</span>
                        <span>Secure SSL encrypted transaction</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700 font-bold italic">
                        <span className="text-gold-600">ⓘ</span>
                        <span>Cash payments are currenty disabled for peak season security</span>
                    </div>
                </div>
            </div>

            {/* Terms */}
            <div className="mb-8 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700">
                    By completing this booking, you agree to our terms and conditions.
                    Cancellation policy applies. Food and activity bookings are non-refundable.
                </p>
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
                    className="px-12 py-4 bg-gold-500 hover:bg-gold-600 text-white font-bold text-lg rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : `Confirm & Pay Rs. ${getTotalAmount().toLocaleString()}`}
                </button>
            </div>
        </div >
    );
};

export default Step3ReviewCheckout;
