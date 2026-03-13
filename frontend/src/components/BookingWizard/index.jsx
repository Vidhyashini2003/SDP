import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Step1RoomSelection from './Step1RoomSelection';
import Step2AddExtras from './Step2AddExtras';
import Step3ReviewCheckout from './Step3ReviewCheckout';
import DemoPaymentGateway from '../DemoPaymentGateway';

const BookingWizard = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [bookingData, setBookingData] = useState({
        // Step 1
        checkIn: '',
        checkOut: '',
        room: null,
        nights: 0,
        roomAmount: 0,

        // Step 2
        food: [],
        activities: [],
        vehicle: null,
        diningOption: 'Delivery',

        // Step 3
        paymentMethod: 'card'
    });

    // Data for available options
    const [availableRooms, setAvailableRooms] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [availableActivities, setAvailableActivities] = useState([]);
    const [availableVehicles, setAvailableVehicles] = useState([]);

    // Calculate total amount
    const getTotalAmount = () => {
        let total = bookingData.roomAmount;

        // Add food
        bookingData.food.forEach(orderGroup => {
            if (orderGroup.items) {
                orderGroup.items.forEach(item => {
                    total += item.item_price * item.quantity;
                });
            }
        });

        // Add activities
        bookingData.activities.forEach(activity => {
            total += parseFloat(activity.price || 0);
        });

        return total;
    };

    // Calculate number of nights
    const calculateNights = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Handle moving to next step
    const handleNext = () => {
        if (currentStep === 1 && !bookingData.room) {
            alert('Please select a room');
            return;
        }
        setCurrentStep(currentStep + 1);
    };

    // Handle moving to previous step
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Skip extras and go to review
    const handleSkipExtras = () => {
        setCurrentStep(3);
    };

    // Handle final booking submission
    const handleCompleteBooking = async () => {
        if (bookingData.paymentMethod === 'card') {
            setIsPaymentModalOpen(true);
            return;
        }
        await submitBooking();
    };

    const submitBooking = async () => {
        setLoading(true);
        try {
            const payload = {
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
                paymentMethod: bookingData.paymentMethod
            };

            const response = await axios.post('/api/bookings/complete', payload);

            alert(`Booking completed successfully! Booking ID: #${response.data.booking.roomBookingId}`);

            // Reset and go back to step 1
            setBookingData({
                checkIn: '',
                checkOut: '',
                room: null,
                nights: 0,
                roomAmount: 0,
                food: [],
                activities: [],
                vehicle: null,
                diningOption: 'Delivery',
                paymentMethod: 'card'
            });
            setCurrentStep(1);
            setAvailableRooms([]);
        } catch (error) {
            console.error('Booking error:', error);
            alert(error.response?.data?.detail || error.response?.data?.error || 'Failed to complete booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Progress Indicator */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <StepIndicator
                        number={1}
                        label="Select Room"
                        active={currentStep === 1}
                        completed={currentStep > 1}
                    />
                    <div className={`flex-1 h-1 mx-4 ${currentStep > 1 ? 'bg-gold-500' : 'bg-slate-300'}`} />
                    <StepIndicator
                        number={2}
                        label="Add Extras"
                        active={currentStep === 2}
                        completed={currentStep > 2}
                    />
                    <div className={`flex-1 h-1 mx-4 ${currentStep > 2 ? 'bg-gold-500' : 'bg-slate-300'}`} />
                    <StepIndicator
                        number={3}
                        label="Review & Pay"
                        active={currentStep === 3}
                        completed={false}
                    />
                </div>
            </div>

            {/* Step Content */}
            <div className="max-w-6xl mx-auto">
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
                    <Step3ReviewCheckout
                        bookingData={bookingData}
                        setBookingData={setBookingData}
                        getTotalAmount={getTotalAmount}
                        onBack={handleBack}
                        onComplete={handleCompleteBooking}
                        loading={loading}
                    />
                )}
            </div>

            <DemoPaymentGateway 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentSuccess={submitBooking}
                amount={getTotalAmount()}
            />
        </div>
    );
};

// Progress Step Indicator Component
const StepIndicator = ({ number, label, active, completed }) => (
    <div className="flex flex-col items-center">
        <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                ${completed ? 'bg-gold-500 text-white'
                    : active ? 'bg-gold-500 text-white'
                        : 'bg-slate-300 text-slate-600'}`}
        >
            {completed ? <CheckCircleIcon className="w-8 h-8" /> : number}
        </div>
        <p className={`mt-2 text-sm font-medium ${active || completed ? 'text-gold-600' : 'text-slate-500'}`}>
            {label}
        </p>
    </div>
);

export default BookingWizard;
