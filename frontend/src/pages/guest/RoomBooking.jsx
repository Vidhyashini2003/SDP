import { useState } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const RoomBooking = () => {
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Search State
    const [searchParams, setSearchParams] = useState({
        checkIn: '',
        checkOut: ''
    });

    // Booking Modal State
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedRoomType, setSelectedRoomType] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [availableRoomsForType, setAvailableRoomsForType] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Card');
    const [isBooking, setIsBooking] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchParams.checkIn || !searchParams.checkOut) {
            toast.error('Please select both check-in and check-out dates');
            return;
        }

        const start = new Date(searchParams.checkIn);
        const end = new Date(searchParams.checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            toast.error('Check-in date cannot be in the past');
            return;
        }

        if (end <= start) {
            toast.error('Check-out date must be after check-in date');
            return;
        }

        setIsSearching(true);
        try {
            const response = await axios.get('/api/bookings/rooms/available', {
                params: {
                    checkIn: searchParams.checkIn,
                    checkOut: searchParams.checkOut
                }
            });
            const allRooms = response.data;
            setRooms(allRooms);
            setRoomTypes(groupRoomsByType(allRooms));
            setHasSearched(true);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            toast.error('Failed to search for rooms');
        } finally {
            setIsSearching(false);
        }
    };

    const groupRoomsByType = (roomsList) => {
        const groupedMap = {};
        roomsList.forEach(room => {
            if (!groupedMap[room.room_type]) {
                groupedMap[room.room_type] = {
                    room_type: room.room_type,
                    room_description: room.room_description,
                    room_price_per_day: room.room_price_per_day,
                    rooms: [],
                    availableCount: 0,
                    totalCount: 0
                };
            }
            groupedMap[room.room_type].rooms.push(room);
            groupedMap[room.room_type].totalCount++;
            // Since the backend already filters for availability, all returned rooms are available?
            // Actually, we should double check status, but our query handles it.
            // Let's assume all returned rooms are available for these dates.
            groupedMap[room.room_type].availableCount++;
        });
        return Object.values(groupedMap);
    };

    const handleBookNow = (roomType) => {
        setSelectedRoomType(roomType);
        // The rooms in this type are already filtered by date from our search
        setAvailableRoomsForType(roomType.rooms);
        setSelectedRoomId(roomType.rooms.length > 0 ? roomType.rooms[0].room_id : '');
        setShowBookingModal(true);
    };

    const handleConfirmBooking = async () => {
        if (!selectedRoomId) {
            toast.error('Please select a room');
            return;
        }

        setIsBooking(true);

        // Calculate Amount
        const start = new Date(searchParams.checkIn);
        const end = new Date(searchParams.checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const days = diffDays === 0 ? 1 : diffDays;
        const totalAmount = days * selectedRoomType.room_price_per_day;

        try {
            await axios.post('/api/bookings/rooms', {
                room_id: selectedRoomId,
                checkIn: searchParams.checkIn,
                checkOut: searchParams.checkOut,
                totalAmount: totalAmount,
                paymentMethod: paymentMethod
            });

            toast.success('Room booked successfully!');
            setShowBookingModal(false);
            setPaymentMethod('Card');

            // Refresh search results to remove the booked room
            handleSearch({ preventDefault: () => { } });
        } catch (error) {
            console.error('Error booking room:', error);
            toast.error(error.response?.data?.error || 'Failed to book room');
        } finally {
            setIsBooking(false);
        }
    };

    const getBedCount = (roomType) => {
        const type = roomType.toLowerCase();
        if (type.includes('single')) return 1;
        if (type.includes('double')) return 2;
        if (type.includes('triple')) return 3;
        return 2;
    };

    const getMaxGuests = (roomType) => {
        const type = roomType.toLowerCase();
        if (type.includes('single')) return 2;
        if (type.includes('triple')) return 3;
        return 2;
    };

    return (
        <div className="p-8 h-full flex flex-col overflow-hidden">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Book Your Stay</h3>

                {/* Cancellation Policy */}
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ExclamationCircleIcon className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-orange-900 text-base mb-1">Cancellation Policy</h4>
                        <p className="text-sm text-orange-700 leading-relaxed">
                            Cancellations made 24 hours before check-in are eligible for a full refund. Refunds are processed within 5-7 business days.
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Check-in Date</label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={searchParams.checkIn}
                                onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-gold-500 outline-none"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Check-out Date</label>
                            <input
                                type="date"
                                required
                                min={searchParams.checkIn ? new Date(new Date(searchParams.checkIn).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                value={searchParams.checkOut}
                                onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-gold-500 outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="w-full md:w-auto px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50"
                        >
                            {isSearching ? 'Searching...' : 'Check Availability'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto">
                {!hasSearched ? (
                    <div className="text-center py-20">
                        <span className="text-6xl block mb-4">📅</span>
                        <h4 className="text-xl font-medium text-slate-600">Select dates to view available rooms</h4>
                    </div>
                ) : roomTypes.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="text-6xl block mb-4">🏠</span>
                        <h4 className="text-xl font-medium text-slate-600">No rooms available for these dates</h4>
                        <p className="text-slate-500 mt-2">Try selecting different dates</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                        {roomTypes.map((roomType, idx) => (
                            <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-1">{roomType.room_type}</h4>
                                        <p className="text-sm text-slate-500">{roomType.room_description}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                                        {roomType.availableCount} Available
                                    </span>
                                </div>

                                <div className="flex items-center gap-6 mb-6 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <span>🛏️</span> {getBedCount(roomType.room_type)} Beds
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>👥</span> Max {getMaxGuests(roomType.room_type)} Guests
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div>
                                        <p className="text-2xl font-bold text-gold-600">Rs. {roomType.room_price_per_day?.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">per night</p>
                                    </div>
                                    <button
                                        onClick={() => handleBookNow(roomType)}
                                        className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors shadow-sm"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && selectedRoomType && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <h2 className="text-2xl font-bold text-slate-900">Confirm Booking</h2>
                            <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="bg-gold-50 p-4 rounded-lg">
                                <p className="font-semibold text-gold-900">{selectedRoomType.room_type}</p>
                                <p className="text-sm text-gold-700 mt-1">
                                    {new Date(searchParams.checkIn).toLocaleDateString()} - {new Date(searchParams.checkOut).toLocaleDateString()}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Select Room Number</label>
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                                >
                                    {availableRoomsForType.map((room) => (
                                        <option key={room.room_id} value={room.room_id}>Room {room.room_number}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                                >
                                    <option value="Card">Card</option>
                                    <option value="Online">Online Banking</option>
                                    <option value="Cash">Cash</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBookingModal(false)}
                                disabled={isBooking}
                                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmBooking}
                                disabled={isBooking}
                                className="flex-1 py-3 px-4 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg shadow-lg transition-all disabled:opacity-70 flex justify-center"
                            >
                                {isBooking ? 'Processing...' : 'Pay & Book'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomBooking;
