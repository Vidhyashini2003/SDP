import { useState } from 'react';
import axios from '../../config/axios';

const Step1RoomSelection = ({ bookingData, setBookingData, availableRooms, setAvailableRooms, calculateNights, onNext }) => {
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!bookingData.checkIn || !bookingData.checkOut) {
            alert('Please select check-in and check-out dates');
            return;
        }

        if (new Date(bookingData.checkIn) >= new Date(bookingData.checkOut)) {
            alert('Check-out date must be at least one day after check-in date.');
            return;
        }

        setSearching(true);
        try {
            const response = await axios.get('/api/bookings/rooms/available', {
                params: {
                    checkIn: bookingData.checkIn,
                    checkOut: bookingData.checkOut
                }
            });

            console.log('Available rooms:', response.data);
            setAvailableRooms(response.data || []);
            setHasSearched(true);
        } catch (error) {
            console.error('Error searching rooms:', error);
            alert('Failed to search rooms');
        } finally {
            setSearching(false);
        }
    };

    const handleSelectRoom = (room) => {
        const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);
        if (nights < 1) {
            alert('Booking must be for at least 1 night.');
            return;
        }
        const totalAmount = room.room_price_per_day * nights;

        setBookingData({
            ...bookingData,
            room: room,
            nights: nights,
            roomAmount: totalAmount
        });
    };

    const groupRoomsByType = () => {
        const grouped = {};
        availableRooms.forEach(room => {
            if (!grouped[room.room_type]) {
                grouped[room.room_type] = {
                    type: room.room_type,
                    price: room.room_price_per_day,
                    rooms: []
                };
            }
            grouped[room.room_type].rooms.push(room);
        });
        return Object.values(grouped);
    };

    const getBedCount = (roomType) => {
        if (roomType?.toLowerCase().includes('suite')) return '1 King Bed';
        if (roomType?.toLowerCase().includes('deluxe')) return '1 Queen Bed';
        return '2 Single Beds';
    };

    // Calculate minimum checkout date (1 day after checkin, or tomorrow)
    const getMinCheckOutDate = () => {
        const date = bookingData.checkIn ? new Date(bookingData.checkIn) : new Date();
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Select Your Room</h2>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-slate-50 rounded-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Check-in Date
                        </label>
                        <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={bookingData.checkIn}
                            onChange={(e) => {
                                const newCheckIn = e.target.value;
                                const newMinCheckOut = new Date(newCheckIn);
                                newMinCheckOut.setDate(newMinCheckOut.getDate() + 1);
                                
                                // Auto-update checkout if it's now invalid
                                const updates = { checkIn: newCheckIn };
                                if (bookingData.checkOut && new Date(bookingData.checkOut) <= new Date(newCheckIn)) {
                                    updates.checkOut = newMinCheckOut.toISOString().split('T')[0];
                                }
                                setBookingData({ ...bookingData, ...updates });
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Check-out Date
                        </label>
                        <input
                            type="date"
                            required
                            min={getMinCheckOutDate()}
                            value={bookingData.checkOut}
                            onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={searching}
                            className="w-full py-2.5 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {searching ? 'Searching...' : 'Search Rooms'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Available Rooms */}
            {hasSearched && (
                <div>
                    {groupRoomsByType().length > 0 ? (
                        <div className="space-y-6">
                            {groupRoomsByType().map((roomGroup) => (
                                <div
                                    key={roomGroup.type}
                                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${bookingData.room?.room_type === roomGroup.type
                                        ? 'border-gold-500 bg-gold-50'
                                        : 'border-slate-200 hover:border-gold-300'
                                        }`}
                                    onClick={() => handleSelectRoom(roomGroup.rooms[0])}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-slate-900">{roomGroup.type}</h3>
                                            <p className="text-slate-600 mt-1">{getBedCount(roomGroup.type)}</p>
                                            <p className="text-sm text-slate-500 mt-2">
                                                {roomGroup.rooms.length} room{roomGroup.rooms.length > 1 ? 's' : ''} available
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gold-600">
                                                Rs. {(roomGroup.price || 0).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-slate-500">per night</p>
                                            {bookingData.nights > 0 && bookingData.room?.room_type === roomGroup.type && (
                                                <p className="text-sm text-slate-700 mt-2">
                                                    {bookingData.nights} nights = <span className="font-bold">Rs. {(bookingData.roomAmount || 0).toLocaleString()}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {bookingData.room?.room_type === roomGroup.type && (
                                        <div className="mt-4 px-4 py-2 bg-gold-500 text-white rounded-lg inline-block">
                                            ✓ Selected
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-lg">
                            <p className="text-slate-500">No rooms available for the selected dates.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Next Button */}
            {bookingData.room && (
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onNext}
                        className="px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg transition-colors shadow-lg"
                    >
                        Continue to Add Extras →
                    </button>
                </div>
            )}
        </div>
    );
};

export default Step1RoomSelection;
