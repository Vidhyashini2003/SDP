import { useState } from 'react';
import axios from '../../config/axios';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Step0GuestSelect from './Step0GuestSelect';
import Step1RoomSelection from '../BookingWizard/Step1RoomSelection';
import Step2AddExtras from '../BookingWizard/Step2AddExtras';
import Step3WalkInCheckout from './Step3WalkInCheckout';
import CardSwipeMachine from '../CardSwipeMachine';

const WalkInBookingWizard = () => {
    const [currentStep, setCurrentStep] = useState(0); // 0=guest, 1=room, 2=extras, 3=review
    const [loading, setLoading] = useState(false);
    const [isSwipeModalOpen, setIsSwipeModalOpen] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState(null);

    const [bookingData, setBookingData] = useState({
        checkIn: '',
        checkOut: '',
        adults: 2,
        kids: 0,
        numRooms: 1,
        room: null,
        nights: 0,
        roomAmount: 0,
        food: [],
        activities: [],
        vehicle: null,
        arrivalTransport: null,
        diningOption: 'Delivery',
        paymentMethod: 'card'
    });

    const [availableRooms, setAvailableRooms] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [availableActivities, setAvailableActivities] = useState([]);
    const [availableVehicles, setAvailableVehicles] = useState([]);

    const getTotalAmount = () => {
        let total = bookingData.roomAmount;
        bookingData.food.forEach(orderGroup => {
            if (orderGroup.items) {
                orderGroup.items.forEach(item => {
                    total += item.item_price * item.quantity;
                });
            }
        });
        bookingData.activities.forEach(activity => {
            total += parseFloat(activity.price || 0);
        });
        return total;
    };

    const calculateNights = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    };

    const handleNext = () => {
        if (currentStep === 1 && !bookingData.room) {
            alert('Please select a room');
            return;
        }
        setCurrentStep(c => c + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    const handleSkipExtras = () => setCurrentStep(3);

    // Step 0 → 1 triggered by guest selection
    const handleGuestNext = () => setCurrentStep(1);

    // Step 3 "Pay" button clicked — open card swipe modal
    const handleCompleteBooking = () => {
        setIsSwipeModalOpen(true);
    };

    // Called when card swipe confirmed
    const submitBooking = async () => {
        setLoading(true);
        try {
            const payload = {
                guest_id: { id: selectedGuest.guest_id, type: selectedGuest.type },  // receptionist books on behalf of this guest
                room: {
                    room_id: bookingData.room.room_id,
                    checkIn: bookingData.checkIn,
                    checkOut: bookingData.checkOut,
                    totalAmount: bookingData.roomAmount,
                    diningOption: bookingData.diningOption
                },
                food: bookingData.food.length > 0 ? bookingData.food : undefined,
                activities: bookingData.activities.length > 0 ? bookingData.activities : undefined,
                vehicle: bookingData.vehicle || undefined,
                arrivalTransport: bookingData.arrivalTransport || undefined,
                paymentMethod: 'card'
            };

            const response = await axios.post('/api/bookings/complete', payload);

            alert(`✅ Walk-in booking completed!\nBooking ID: #${response.data.booking.roomBookingId}\nGuest: ${selectedGuest.guest_name}`);

            // Reset wizard
            setBookingData({
                checkIn: '', checkOut: '', adults: 2, kids: 0, numRooms: 1,
                room: null, nights: 0, roomAmount: 0,
                food: [], activities: [], vehicle: null, arrivalTransport: null,
                diningOption: 'Delivery', paymentMethod: 'card'
            });
            setSelectedGuest(null);
            setCurrentStep(0);
            setAvailableRooms([]);
        } catch (error) {
            console.error('Walk-in booking error:', error);
            alert(error.response?.data?.detail || error.response?.data?.error || 'Failed to complete booking');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { label: 'Select Guest', icon: '👤' },
        { label: 'Choose Room', icon: '🏨' },
        { label: 'Add Extras', icon: '✨' },
        { label: 'Review & Pay', icon: '💳' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-lg">🚶</div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none">Walk-in Booking</h1>
                        <p className="text-slate-400 text-sm mt-0.5">Book on behalf of a walk-in guest</p>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-between">
                    {steps.map((step, idx) => (
                        <div key={idx} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all
                                        ${currentStep > idx ? 'bg-gold-500 text-white'
                                            : currentStep === idx ? 'bg-slate-900 text-white'
                                            : 'bg-slate-200 text-slate-500'}`}
                                >
                                    {currentStep > idx ? <CheckCircleIcon className="w-8 h-8" /> : step.icon}
                                </div>
                                <p className={`mt-2 text-xs font-bold text-center
                                    ${currentStep === idx ? 'text-slate-900'
                                        : currentStep > idx ? 'text-gold-600'
                                        : 'text-slate-400'}`}>
                                    {step.label}
                                </p>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`flex-1 h-1 mx-3 rounded transition-all ${currentStep > idx ? 'bg-gold-500' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Guest banner visible from step 1+ */}
            {selectedGuest && currentStep > 0 && (
                <div className="max-w-4xl mx-auto mb-4">
                    <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 rounded-2xl w-fit">
                        <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                            {(selectedGuest.guest_name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-white text-xs font-black leading-none">{selectedGuest.guest_name}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">Walk-in guest</p>
                        </div>
                        <button
                            onClick={() => { setSelectedGuest(null); setCurrentStep(0); }}
                            className="ml-2 text-slate-500 hover:text-gold-400 text-xs transition-colors font-bold"
                        >
                            change
                        </button>
                    </div>
                </div>
            )}

            {/* Step Content */}
            <div className="max-w-6xl mx-auto">
                {currentStep === 0 && (
                    <Step0GuestSelect
                        selectedGuest={selectedGuest}
                        onSelectGuest={setSelectedGuest}
                        onNext={handleGuestNext}
                    />
                )}

                {currentStep === 1 && (
                    <Step1RoomSelection
                        bookingData={bookingData}
                        setBookingData={setBookingData}
                        availableRooms={availableRooms}
                        setAvailableRooms={setAvailableRooms}
                        calculateNights={calculateNights}
                        onNext={handleNext}
                    />
                )}

                {currentStep === 2 && (
                    <Step2AddExtras
                        isWalkIn={true}
                        bookingData={bookingData}
                        setBookingData={setBookingData}
                        menuItems={menuItems}
                        setMenuItems={setMenuItems}
                        availableActivities={availableActivities}
                        setAvailableActivities={setAvailableActivities}
                        availableVehicles={availableVehicles}
                        setAvailableVehicles={setAvailableVehicles}
                        onNext={handleNext}
                        onBack={handleBack}
                        onSkip={handleSkipExtras}
                    />
                )}

                {currentStep === 3 && (
                    <Step3WalkInCheckout
                        bookingData={bookingData}
                        setBookingData={setBookingData}
                        getTotalAmount={getTotalAmount}
                        onBack={handleBack}
                        onComplete={handleCompleteBooking}
                        loading={loading}
                        selectedGuest={selectedGuest}
                    />
                )}
            </div>

            {/* Card Swipe Machine Modal */}
            <CardSwipeMachine
                isOpen={isSwipeModalOpen}
                onClose={() => setIsSwipeModalOpen(false)}
                onPaymentSuccess={submitBooking}
                amount={getTotalAmount()}
                label={`Walk-in Booking — ${selectedGuest?.guest_name || 'Guest'}`}
            />
        </div>
    );
};

export default WalkInBookingWizard;
