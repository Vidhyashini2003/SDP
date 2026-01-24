import { useState, useEffect } from 'react';
import axios from '../../config/axios';

const RoomBooking = () => {
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedRoomType, setSelectedRoomType] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [availableRooms, setAvailableRooms] = useState([]);
    const [bookingData, setBookingData] = useState({
        rb_checkin: '',
        rb_checkout: ''
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await axios.get('/api/rooms');
            const allRooms = response.data;
            setRooms(allRooms);

            // Group rooms by room_type
            const grouped = groupRoomsByType(allRooms);
            setRoomTypes(grouped);
        } catch (error) {
            console.error('Error fetching rooms:', error);
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

            if (room.room_status === 'Available') {
                groupedMap[room.room_type].availableCount++;
            }
        });

        return Object.values(groupedMap);
    };

    const handleBookNow = (roomType) => {
        setSelectedRoomType(roomType);
        const available = roomType.rooms.filter(r => r.room_status === 'Available');
        setAvailableRooms(available);
        setSelectedRoomId(available.length > 0 ? available[0].room_id : '');
        setShowBookingModal(true);
    };

    const handleBookingChange = (e) => {
        setBookingData({ ...bookingData, [e.target.name]: e.target.value });
    };

    const handleConfirmBooking = async () => {
        if (!bookingData.rb_checkin || !bookingData.rb_checkout) {
            alert('Please select check-in and check-out dates');
            return;
        }

        if (!selectedRoomId) {
            alert('Please select a room');
            return;
        }

        try {
            await axios.post('/api/guest/bookings/room', {
                room_id: selectedRoomId,
                rb_checkin: bookingData.rb_checkin,
                rb_checkout: bookingData.rb_checkout
            });

            alert('Room booked successfully!');
            setShowBookingModal(false);
            setBookingData({ rb_checkin: '', rb_checkout: '' });
            setSelectedRoomId('');
            fetchRooms();
        } catch (error) {
            console.error('Error booking room:', error);
            alert(error.response?.data?.error || 'Failed to book room');
        }
    };

    const getBedCount = (roomType) => {
        if (roomType.toLowerCase().includes('single')) return 1;
        if (roomType.toLowerCase().includes('double')) return 2;
        if (roomType.toLowerCase().includes('triple')) return 3;
        return 2;
    };

    const getMaxGuests = (roomType) => {
        if (roomType.toLowerCase().includes('single')) return 2;
        if (roomType.toLowerCase().includes('double')) return 2;
        if (roomType.toLowerCase().includes('triple')) return 3;
        return 2;
    };

    const getViewType = (roomType) => {
        if (roomType.toLowerCase().includes('sea')) return 'Sea View';
        if (roomType.toLowerCase().includes('garden')) return 'Garden View';
        return 'City View';
    };

    return (
        <div className="p-8 overflow-auto">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Room Booking</h3>
                <p className="text-slate-500 text-sm mt-1">Select from our comfortable rooms</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {roomTypes.map((roomType, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 mb-1">
                                    {roomType.room_type}
                                </h4>
                                <p className="text-sm text-slate-500">
                                    {roomType.room_description}
                                </p>
                            </div>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${roomType.availableCount > 0
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-red-500 text-white'
                                    }`}
                            >
                                {roomType.availableCount > 0 ? 'Available' : 'Booked'}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                                <span>🛏️</span>
                                <span>{getBedCount(roomType.room_type)} Beds</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>👥</span>
                                <span>Max {getMaxGuests(roomType.room_type)} Guests</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>🌊</span>
                                <span>{getViewType(roomType.room_type)}</span>
                            </div>
                        </div>

                        {/* Availability Info */}
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-700">
                                <span className="font-semibold text-blue-600">{roomType.availableCount}</span> of {roomType.totalCount} rooms available
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <div>
                                <p className="text-2xl font-bold text-blue-600">
                                    Rs. {roomType.room_price_per_day?.toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500">per night</p>
                            </div>
                            <button
                                onClick={() => handleBookNow(roomType)}
                                disabled={roomType.availableCount === 0}
                                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${roomType.availableCount > 0
                                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                Book Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {roomTypes.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No rooms available at the moment. Please check back later.
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && selectedRoomType && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Book Room</h2>
                            <button
                                onClick={() => setShowBookingModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-lg font-semibold text-slate-900">{selectedRoomType.room_type}</p>
                            <p className="text-sm text-slate-500">Rs. {selectedRoomType.room_price_per_day?.toLocaleString()} per night</p>
                        </div>

                        <div className="space-y-4">
                            {/* Room Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select Room Number
                                </label>
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Choose a room...</option>
                                    {availableRooms.map((room) => (
                                        <option key={room.room_id} value={room.room_id}>
                                            Room {room.room_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Check-in Date
                                </label>
                                <input
                                    type="datetime-local"
                                    name="rb_checkin"
                                    value={bookingData.rb_checkin}
                                    onChange={handleBookingChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Check-out Date
                                </label>
                                <input
                                    type="datetime-local"
                                    name="rb_checkout"
                                    value={bookingData.rb_checkout}
                                    onChange={handleBookingChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowBookingModal(false)}
                                className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmBooking}
                                className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all"
                            >
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomBooking;
