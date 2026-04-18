import { useState } from 'react';
import axios from '../../config/axios';
import { BuildingOffice2Icon, UserGroupIcon, UsersIcon, StarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const Step1RoomSelection = ({ bookingData, setBookingData, availableRooms, setAvailableRooms, calculateNights, onNext }) => {
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Search state with hotel-style fields
    const [searchForm, setSearchForm] = useState({
        checkIn: bookingData.checkIn || '',
        checkOut: bookingData.checkOut || '',
        adults: 2,
        kids: 0,
        numRooms: 1
    });

    const totalGuests = parseInt(searchForm.adults) + parseInt(searchForm.kids);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchForm.checkIn || !searchForm.checkOut) {
            alert('Please select check-in and check-out dates');
            return;
        }
        if (new Date(searchForm.checkIn) >= new Date(searchForm.checkOut)) {
            alert('Check-out date must be at least one day after check-in date.');
            return;
        }

        setSearching(true);
        try {
            const response = await axios.get('/api/bookings/rooms/available', {
                params: {
                    checkIn: searchForm.checkIn,
                    checkOut: searchForm.checkOut,
                    adults: searchForm.adults,
                    kids: searchForm.kids,
                    numRooms: searchForm.numRooms
                }
            });

            setAvailableRooms(response.data || []);
            setHasSearched(true);

            // Update booking dates in parent state
            setBookingData(prev => ({
                ...prev,
                checkIn: searchForm.checkIn,
                checkOut: searchForm.checkOut,
                adults: searchForm.adults,
                kids: searchForm.kids,
                numRooms: searchForm.numRooms,
                room: null,
                nights: 0,
                roomAmount: 0
            }));
        } catch (error) {
            console.error('Error searching rooms:', error);
            alert('Failed to search rooms');
        } finally {
            setSearching(false);
        }
    };

    const handleSelectRoom = (room) => {
        const nights = calculateNights(searchForm.checkIn, searchForm.checkOut);
        if (nights < 1) {
            alert('Booking must be for at least 1 night.');
            return;
        }
        const totalAmount = room.room_price_per_day * nights * (searchForm.numRooms || 1);
        setBookingData(prev => ({
            ...prev,
            room: room,
            nights: nights,
            roomAmount: totalAmount,
            checkIn: searchForm.checkIn,
            checkOut: searchForm.checkOut,
            adults: searchForm.adults,
            kids: searchForm.kids,
            numRooms: searchForm.numRooms
        }));
    };

    const groupRoomsByType = () => {
        const grouped = {};
        availableRooms.forEach(room => {
            if (!grouped[room.room_type]) {
                grouped[room.room_type] = {
                    type: room.room_type,
                    price: room.room_price_per_day,
                    image: room.room_image,
                    rooms: []
                };
            }
            grouped[room.room_type].rooms.push(room);
        });
        return Object.values(grouped);
    };

    // Smart recommendation logic: recommend best-fit based on guest count
    const getRecommendationLabel = (roomType, roomCount) => {
        const type = roomType?.toLowerCase() || '';
        if (totalGuests <= 2 && (type.includes('standard') || type.includes('deluxe'))) return 'Best for couples';
        if (totalGuests > 4 && (type.includes('suite') || type.includes('family'))) return 'Best for families';
        if (totalGuests > 2 && (type.includes('suite') || type.includes('deluxe'))) return 'Great for your group';
        return null;
    };

    const isRecommended = (roomType, roomCount) => !!getRecommendationLabel(roomType, roomCount);

    // Sort rooms: recommended first
    const sortedRoomGroups = () => {
        const groups = groupRoomsByType();
        return groups.sort((a, b) => {
            const aRec = isRecommended(a.type, a.rooms.length) ? 1 : 0;
            const bRec = isRecommended(b.type, b.rooms.length) ? 1 : 0;
            return bRec - aRec;
        });
    };

    const getBedInfo = (roomType) => {
        const type = roomType?.toLowerCase() || '';
        if (type.includes('suite')) return { beds: '1 King Bed + Sofa', size: '45 m²' };
        if (type.includes('deluxe')) return { beds: '1 Queen Bed', size: '30 m²' };
        if (type.includes('family')) return { beds: '2 Queen Beds', size: '50 m²' };
        return { beds: '2 Single Beds', size: '25 m²' };
    };

    const getRoomAmenities = (roomType) => {
        const base = ['Free WiFi', 'Air Conditioning', 'Sea View'];
        const type = roomType?.toLowerCase() || '';
        if (type.includes('suite')) return [...base, 'Jacuzzi', 'Private Balcony', 'Butler Service'];
        if (type.includes('deluxe')) return [...base, 'Mini Bar', 'Private Balcony'];
        if (type.includes('family')) return [...base, 'Kids Corner', 'Extra Beds'];
        return [...base, 'Wardrobe'];
    };

    // Get min checkout date
    const getMinCheckOut = () => {
        const date = searchForm.checkIn ? new Date(searchForm.checkIn) : new Date();
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
    };

    const today = new Date().toISOString().split('T')[0];
    const nights = calculateNights(searchForm.checkIn, searchForm.checkOut);

    return (
        <div className="space-y-6">
            {/* Hero Search Card - Hotel Style */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 p-8">
                    <div className="mb-6">
                        <h2 className="text-3xl font-black text-white tracking-tight">Find Your Perfect Room</h2>
                        <p className="text-slate-400 mt-1">We'll recommend the best options for your stay</p>
                    </div>

                    <form onSubmit={handleSearch}>
                        {/* Row 1: Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Check-in */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-gold-500/50 transition-all">
                                <label className="block text-[10px] font-black text-gold-400 uppercase tracking-widest mb-1">Check-in</label>
                                <input
                                    type="date"
                                    required
                                    min={today}
                                    value={searchForm.checkIn}
                                    onChange={(e) => {
                                        const newCheckIn = e.target.value;
                                        const nextDay = new Date(newCheckIn);
                                        nextDay.setDate(nextDay.getDate() + 1);
                                        setSearchForm(prev => ({
                                            ...prev,
                                            checkIn: newCheckIn,
                                            checkOut: prev.checkOut && new Date(prev.checkOut) > new Date(newCheckIn)
                                                ? prev.checkOut
                                                : nextDay.toISOString().split('T')[0]
                                        }));
                                        setHasSearched(false);
                                    }}
                                    className="w-full bg-transparent text-white font-bold text-lg outline-none [color-scheme:dark]"
                                />
                            </div>

                            {/* Check-out */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-gold-500/50 transition-all">
                                <label className="block text-[10px] font-black text-gold-400 uppercase tracking-widest mb-1">Check-out</label>
                                <input
                                    type="date"
                                    required
                                    min={getMinCheckOut()}
                                    value={searchForm.checkOut}
                                    onChange={(e) => {
                                        setSearchForm(prev => ({ ...prev, checkOut: e.target.value }));
                                        setHasSearched(false);
                                    }}
                                    className="w-full bg-transparent text-white font-bold text-lg outline-none [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Row 2: Guests + Rooms */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {/* Adults */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                <label className="block text-[10px] font-black text-gold-400 uppercase tracking-widest mb-2">Adults</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSearchForm(prev => ({ ...prev, adults: Math.max(1, prev.adults - 1) }))}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-gold-500 text-white font-bold transition-all flex items-center justify-center text-lg"
                                    >−</button>
                                    <span className="text-white font-black text-xl w-6 text-center">{searchForm.adults}</span>
                                    <button
                                        type="button"
                                        onClick={() => setSearchForm(prev => ({ ...prev, adults: Math.min(10, prev.adults + 1) }))}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-gold-500 text-white font-bold transition-all flex items-center justify-center text-lg"
                                    >+</button>
                                </div>
                                <p className="text-slate-500 text-[10px] mt-1">Age 18+</p>
                            </div>

                            {/* Kids */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                <label className="block text-[10px] font-black text-gold-400 uppercase tracking-widest mb-2">Children</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSearchForm(prev => ({ ...prev, kids: Math.max(0, prev.kids - 1) }))}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-gold-500 text-white font-bold transition-all flex items-center justify-center text-lg"
                                    >−</button>
                                    <span className="text-white font-black text-xl w-6 text-center">{searchForm.kids}</span>
                                    <button
                                        type="button"
                                        onClick={() => setSearchForm(prev => ({ ...prev, kids: Math.min(10, prev.kids + 1) }))}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-gold-500 text-white font-bold transition-all flex items-center justify-center text-lg"
                                    >+</button>
                                </div>
                                <p className="text-slate-500 text-[10px] mt-1">Age 0–17</p>
                            </div>

                            {/* Rooms */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                <label className="block text-[10px] font-black text-gold-400 uppercase tracking-widest mb-2">Rooms</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSearchForm(prev => ({ ...prev, numRooms: Math.max(1, prev.numRooms - 1) }))}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-gold-500 text-white font-bold transition-all flex items-center justify-center text-lg"
                                    >−</button>
                                    <span className="text-white font-black text-xl w-6 text-center">{searchForm.numRooms}</span>
                                    <button
                                        type="button"
                                        onClick={() => setSearchForm(prev => ({ ...prev, numRooms: Math.min(5, prev.numRooms + 1) }))}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-gold-500 text-white font-bold transition-all flex items-center justify-center text-lg"
                                    >+</button>
                                </div>
                                <p className="text-slate-500 text-[10px] mt-1">Max 5</p>
                            </div>
                        </div>

                        {/* Duration display */}
                        {nights > 0 && (
                            <div className="mb-4 text-center">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 border border-gold-500/30 rounded-full text-gold-400 text-sm font-bold">
                                    📅 {nights} night{nights !== 1 ? 's' : ''} · {totalGuests} guest{totalGuests !== 1 ? 's' : ''} · {searchForm.numRooms} room{searchForm.numRooms !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}

                        {/* Search Button */}
                        <button
                            type="submit"
                            disabled={searching}
                            className="w-full py-4 bg-gold-500 hover:bg-gold-600 active:scale-[0.98] text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-gold-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {searching ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Searching best rooms...
                                </>
                            ) : (
                                <>
                                    🔍 Search Available Rooms
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Search Results */}
            {hasSearched && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {sortedRoomGroups().length > 0 ? (
                        <div>
                            {/* Result summary */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black text-slate-900">
                                    {sortedRoomGroups().length} room type{sortedRoomGroups().length !== 1 ? 's' : ''} available
                                </h3>
                                <span className="text-sm text-slate-500">
                                    for {nights} night{nights !== 1 ? 's' : ''}, {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="space-y-5">
                                {sortedRoomGroups().map((roomGroup) => {
                                    const bedInfo = getBedInfo(roomGroup.type);
                                    const amenities = getRoomAmenities(roomGroup.type);
                                    const recommendLabel = getRecommendationLabel(roomGroup.type, roomGroup.rooms.length);
                                    const isSelected = bookingData.room?.room_type === roomGroup.type;
                                    const totalPrice = (roomGroup.price || 0) * nights * searchForm.numRooms;

                                    return (
                                        <div
                                            key={roomGroup.type}
                                            className={`rounded-2xl border-2 overflow-hidden transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-gold-500 shadow-xl shadow-gold-100 ring-4 ring-gold-500/10'
                                                    : 'border-slate-200 hover:border-gold-300 hover:shadow-lg'
                                            }`}
                                            onClick={() => handleSelectRoom(roomGroup.rooms[0])}
                                        >
                                            <div className="flex flex-col md:flex-row">
                                                {/* Room Image */}
                                                <div className="relative md:w-72 flex-shrink-0">
                                                    {roomGroup.image ? (
                                                        <img
                                                            src={roomGroup.image.startsWith('/')
                                                                ? `${axios.defaults.baseURL}${roomGroup.image}`
                                                                : roomGroup.image}
                                                            alt={roomGroup.type}
                                                            className="w-full h-52 md:h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-52 md:h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                            <BuildingOffice2Icon className="w-20 h-20 text-slate-300" />
                                                        </div>
                                                    )}

                                                    {/* Recommendation Badge */}
                                                    {recommendLabel && (
                                                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-gold-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                                                            <SparklesIcon className="w-3 h-3" />
                                                            {recommendLabel}
                                                        </div>
                                                    )}

                                                    {/* Selected Overlay */}
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-gold-500/20 flex items-center justify-center">
                                                            <div className="bg-gold-500 rounded-full p-2 shadow-xl">
                                                                <CheckCircleIcon className="w-10 h-10 text-white" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Room Details */}
                                                <div className="flex-1 p-6 bg-white flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="text-xl font-black text-slate-900">{roomGroup.type}</h3>
                                                                <p className="text-slate-500 text-sm mt-0.5">{bedInfo.beds} · {bedInfo.size}</p>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <div className="flex items-center gap-1 text-amber-400">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <StarIcon key={i} className="w-4 h-4 fill-current" />
                                                                    ))}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-500 mt-1 bg-slate-100 px-1.5 py-0.5 rounded">Exceptional 9.8</span>
                                                            </div>
                                                        </div>

                                                        {/* Amenities */}
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {amenities.map(a => (
                                                                <span key={a} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                                                    {a}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Urgency & Trust Signals */}
                                                        <div className="mt-4 flex flex-col gap-2">
                                                            {/* Availability Urgency */}
                                                            {roomGroup.rooms.length <= 3 ? (
                                                                <div className="flex items-center gap-1.5 text-xs font-black text-red-600 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-md w-fit shadow-sm">
                                                                    <span className="animate-pulse">🔥</span>
                                                                    In high demand! Only {roomGroup.rooms.length} room{roomGroup.rooms.length > 1 ? 's' : ''} left on our site.
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded w-fit">
                                                                    <CheckCircleIcon className="w-4 h-4" />
                                                                    {roomGroup.rooms.length} rooms available
                                                                </div>
                                                            )}
                                                            
                                                            {/* Trust Signal: Free Cancellation */}
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-fit">
                                                                <CheckCircleIcon className="w-4 h-4" />
                                                                Free Cancellation until 24h before check-in
                                                            </div>

                                                            {/* Cleanliness / Extra Trust */}
                                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                                                <SparklesIcon className="w-3.5 h-3.5 text-gold-500" />
                                                                Highly rated for cleanliness & comfort
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Pricing + Select CTA */}
                                                    <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-100">
                                                        <div>
                                                            <p className="text-3xl font-black text-gold-600">
                                                                Rs. {(roomGroup.price || 0).toLocaleString()}
                                                            </p>
                                                            <p className="text-xs text-slate-500">per room/night</p>
                                                            {nights > 0 && (
                                                                <p className="text-sm text-slate-700 font-bold mt-1">
                                                                    {searchForm.numRooms} room{searchForm.numRooms > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''} =
                                                                    <span className="text-slot-900 ml-1">Rs. {totalPrice.toLocaleString()}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${
                                                                isSelected
                                                                    ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/30'
                                                                    : 'bg-slate-900 text-white hover:bg-gold-500 hover:shadow-lg hover:shadow-gold-500/30'
                                                            }`}
                                                            onClick={(e) => { e.stopPropagation(); handleSelectRoom(roomGroup.rooms[0]); }}
                                                        >
                                                            {isSelected ? '✓ Selected' : 'Select Room'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                            <div className="text-5xl mb-4">😔</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No rooms available</h3>
                            <p className="text-slate-500">Try different dates or reduce the number of guests/rooms.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Continue Button */}
            {bookingData.room && (
                <div className="sticky bottom-4 flex justify-end">
                    <button
                        onClick={onNext}
                        className="px-10 py-4 bg-gold-500 hover:bg-gold-600 text-white font-black rounded-2xl transition-all shadow-2xl shadow-gold-500/30 transform hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        Continue to Add Extras
                        <span className="text-xl">→</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Step1RoomSelection;
