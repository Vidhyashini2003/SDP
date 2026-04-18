import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    CalendarDaysIcon, 
    MapPinIcon, 
    HomeModernIcon, 
    PlusCircleIcon, 
    CurrencyDollarIcon,
    ArrowDownTrayIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import DemoPaymentGateway from '../../components/DemoPaymentGateway';

const GuestBookings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, amount: 0, vehicle: null });
    const [cancelModal, setCancelModal] = useState({ isOpen: false, type: '', id: null, reason: '', requestRefund: false, checkInDate: null });

    useEffect(() => {
        fetchGroupedBookings();
    }, []);

    const fetchGroupedBookings = async () => {
        try {
            const res = await axios.get('/api/guest/bookings/grouped');
            setTrips(res.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching grouped bookings:', error);
            toast.error('Failed to load trips');
            setLoading(false);
        }
    };

    const handleCancelRoom = async (bookingId, reason, requestRefund) => {
        try {
            await axios.post(`/api/guest/bookings/rooms/${bookingId}/cancel`, { cancelReason: reason, requestRefund });
            toast.success('Trip cancelled successfully');
            fetchGroupedBookings(); 
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cancel trip');
        }
    };

    const handleVehiclePayment = async (vehicle) => {
        const amount = vehicle.vehicle_price_per_day * vehicle.vb_days;
        setPaymentModal({ isOpen: true, amount, vehicle });
    };

    const confirmVehiclePayment = async () => {
        const { vehicle, amount } = paymentModal;
        try {
            let endpoint = `/api/guest/bookings/vehicles/${vehicle.vb_id}/pay`;
            if (vehicle.isArrivalTransport) {
                endpoint = `/api/guest/bookings/arrivals/${vehicle.vb_id}/pay`;
            } else if (vehicle.isQuickRide) {
                endpoint = `/api/guest/quickrides/${vehicle.qr_id}/pay`;
            }
                
            await axios.post(endpoint, {
                payment_method: 'Card',
                total_amount: amount
            });
            toast.success('Payment successful! Trip confirmed.');
            fetchGroupedBookings();
        } catch (error) {
            toast.error('Payment failed');
        }
    };

    const handleCancelActivity = async (activityId) => {
        if (!window.confirm('Are you sure you want to cancel this activity? As per our policy, activities are non-refundable. Do you want to proceed?')) {
            return;
        }
        try {
            await axios.put(`/api/guest/bookings/activities/${activityId}/cancel`);
            toast.success('Activity cancelled successfully');
            fetchGroupedBookings();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cancel activity');
        }
    };

    const handleCancelFoodOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this ENTIRE catering order? As per our policy, food orders are non-refundable. Do you want to proceed?')) {
            return;
        }
        try {
            await axios.put(`/api/guest/orders/${orderId}/cancel`);
            toast.success('Food order cancelled successfully');
            fetchGroupedBookings();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cancel order');
        }
    };

    const handleCancelFoodItem = async (orderId, itemId) => {
        if (!window.confirm('Are you sure you want to cancel this specific food item? As per our policy, it is non-refundable. Do you want to proceed?')) {
            return;
        }
        try {
            await axios.put(`/api/guest/orders/${orderId}/items/${itemId}/cancel`);
            toast.success('Food item cancelled successfully');
            fetchGroupedBookings();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cancel item');
        }
    };

    const handleCancelArrivalTransfer = async (transportId, reason, requestRefund) => {
        try {
            await axios.put(`/api/guest/bookings/arrivals/${transportId}/cancel`, { cancelReason: reason, requestRefund });
            toast.success('Arrival transfer cancelled. Driver has been notified.');
            fetchGroupedBookings();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cancel arrival transfer');
        }
    };

    const handleCancelVehicleHire = async (vbId, reason, requestRefund) => {
        try {
            await axios.put(`/api/guest/bookings/vehicles/${vbId}/cancel`, { cancelReason: reason, requestRefund });
            toast.success('Vehicle hire cancelled. Driver has been notified.');
            fetchGroupedBookings();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cancel vehicle hire');
        }
    };

    const handleCancelClick = (type, id, checkInDate = null) => {
        setCancelModal({ isOpen: true, type, id, reason: '', requestRefund: false, checkInDate });
    };

    const confirmCancellation = async () => {
        if (!cancelModal.reason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }

        const { type, id, reason, requestRefund } = cancelModal;

        if (type === 'room') {
            await handleCancelRoom(id, reason, requestRefund);
        } else if (type === 'arrival') {
            await handleCancelArrivalTransfer(id, reason, requestRefund);
        } else if (type === 'vehicle') {
            await handleCancelVehicleHire(id, reason, requestRefund);
        }
        
        setCancelModal({ isOpen: false, type: '', id: null, reason: '', requestRefund: false, checkInDate: null });
    };

    // Returns true if the booking is eligible for a refund (>24h before check-in date)
    const isRefundEligible = (checkInDate) => {
        if (!checkInDate) return false;
        const checkIn = new Date(checkInDate);
        const now = new Date();
        const diffMs = checkIn - now;
        return diffMs > 24 * 60 * 60 * 1000;
    };

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase() || '';
        let style = 'bg-slate-100 text-slate-500 border-slate-200';
        
        if (['confirmed', 'booked', 'delivered', 'active', 'success'].includes(s)) {
            style = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        } else if (['pending', 'pending approval', 'ordered', 'pending payment'].includes(s)) {
            style = 'bg-gold-500/10 text-gold-600 border-gold-500/20';
        } else if (['cancelled', 'rejected'].includes(s)) {
            style = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        } else if (['completed', 'checked-in'].includes(s)) {
            style = 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        }

        return (
            <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border ${style} uppercase tracking-[0.15em] whitespace-nowrap`}>
                {status}
            </span>
        );
    };

    const formatDate = (dateString, options = {}) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', ...options
        });
    };

    const downloadReceipt = (booking, type) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // --- DESIGN TOKENS ---
        const primaryColor = [15, 23, 42]; // Slate 900
        const accentColor = [184, 134, 11]; // Dark Goldenrod
        const grayColor = [100, 116, 139]; // Slate 500
        const lightGray = [248, 250, 252]; // Slate 50
        const emeraldColor = [16, 185, 129]; // Emerald 500
        const amberColor = [234, 179, 8]; // Amber 500

        // --- HEADER SECTION ---
        // Dark background header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 50, 'F');
        
        // Accent bar
        doc.setFillColor(...accentColor);
        doc.rect(0, 48, pageWidth, 2, 'F');

        // Hotel Name & Brand
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('JANAS BLUE WATER CORNER', 14, 25);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text('LUXURY HOTEL & RESORT • TRINCOMALEE, SRI LANKA', 14, 32);

        // Invoice Title
        doc.setFontSize(32);
        doc.setTextColor(...accentColor);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', pageWidth - 14, 35, { align: 'right' });

        // --- INFO SECTION ---
        let currentY = 65;

        // Bill From
        doc.setFontSize(8);
        doc.setTextColor(...accentColor);
        doc.setFont('helvetica', 'bold');
        doc.text('ISSUED BY', 14, currentY);
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(10);
        doc.text('Janas Blue Water Corner', 14, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text('73, 9 Sandy Bay Road', 14, currentY + 11);
        doc.text('Trincomalee, Sri Lanka', 14, currentY + 16);
        doc.text('+94 77 765 4321', 14, currentY + 21);
        doc.text('hotelmanagement.services17@gmail.com', 14, currentY + 26);

        // Bill To
        doc.setFontSize(8);
        doc.setTextColor(...accentColor);
        doc.setFont('helvetica', 'bold');
        doc.text('BILL TO', 85, currentY);
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(10);
        doc.text(user?.name || 'Valued Guest', 85, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text(user?.email || 'N/A', 85, currentY + 11);
        doc.text('Guest Identification: Registered', 85, currentY + 16);

        // Invoice Metadata Box
        doc.setFillColor(...lightGray);
        doc.roundedRect(140, currentY - 5, 56, 30, 2, 2, 'F');
        
        const receiptNo = `${type.substring(0, 2).toUpperCase()}-${String(booking.rb_id || booking.order_id || booking.ab_id || booking.vb_id || '0').padStart(4, '0')}`;
        
        doc.setFontSize(7);
        doc.setTextColor(...grayColor);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE NO', 145, currentY + 2);
        doc.setTextColor(...primaryColor);
        doc.setFontSize(9);
        doc.text(receiptNo, 145, currentY + 7);

        doc.setFontSize(7);
        doc.setTextColor(...grayColor);
        doc.text('DATE ISSUED', 145, currentY + 14);
        doc.setTextColor(...primaryColor);
        doc.setFontSize(9);
        doc.text(new Date().toLocaleDateString(), 145, currentY + 19);

        // --- LINE ITEMS ---
        let items = [];
        let totalAmount = 0;
        const checkPaid = (s) => !['pending', 'pending payment', 'cancelled', 'rejected', 'pending approval', 'ordered'].includes(s?.toLowerCase()) ? 'PAID' : 'PENDING';

        if (type === 'Summary') {
            // Room
            const roomPrice = parseFloat(booking.total_price || 0);
            items.push(['ROOM', `${booking.room_type || 'Room'} (#${booking.room_number || 'TBD'})\n${formatDate(booking.check_in_date)} - ${formatDate(booking.check_out_date)}`, 'STAY', `Rs. ${roomPrice.toLocaleString()}`, checkPaid(booking.rb_status)]);
            totalAmount += roomPrice;

            // Activities
            (booking.activities || []).forEach(act => {
                const p = parseFloat(act.total_price || 0);
                items.push(['ACTIVITY', `${act.activity_name || 'Activity'}\n${formatDate(act.ab_start_time, {hour:'2-digit', minute:'2-digit'})} - ${formatDate(act.ab_end_time, {hour:'2-digit', minute:'2-digit'})}`, '1', `Rs. ${p.toLocaleString()}`, checkPaid(act.ab_status)]);
                totalAmount += p;
            });

            // Food
            (booking.foodOrders || []).forEach(order => {
                const activeItems = order.items?.filter(i => i.item_status !== 'Cancelled') || [];
                const orderPrice = activeItems.reduce((sum, item) => sum + (parseFloat(item.item_price || 0) * parseInt(item.order_quantity || 0)), 0);
                if (orderPrice > 0 || activeItems.length > 0) {
                    items.push(['CATERING', `Order #${order.order_id}\n${activeItems.map(i => i.item_name).join(', ')}`, 'ORDER', `Rs. ${orderPrice.toLocaleString()}`, checkPaid(order.payment_status || order.order_status)]);
                    totalAmount += orderPrice;
                }
            });

            // Vehicles
            (booking.vehicles || []).forEach(veh => {
                const p = parseFloat(veh.vehicle_price_per_day || 0) * parseInt(veh.vb_days || 0);
                items.push(['TRANSPORT', `${veh.vehicle_type || 'Vehicle'} (${veh.vehicle_number || 'TBD'})\n${veh.vb_days || 0} Days Hiring`, 'HIRE', `Rs. ${p.toLocaleString()}`, checkPaid(veh.vb_status)]);
                totalAmount += p;
            });

            // Quick Rides
            (booking.quickRides || []).forEach(qr => {
                const p = parseFloat(qr.total_amount || 0);
                items.push(['QUICK RIDE', `${qr.veh_type || qr.vehicle_type_requested || 'Ride'}\nPickup: ${qr.pickup_location || 'Hotel'}`, 'TRIP', `Rs. ${p.toLocaleString()}`, checkPaid(qr.status === 'Completed' && p > 0 ? (qr.payment_status === 'Paid' ? 'PAID' : 'PENDING') : 'PENDING')]);
                totalAmount += p;
            });
        } else {
            // Individual types logic
            if (type === 'Room') {
                const p = parseFloat(booking.total_price || 0);
                items.push(['ROOM', booking.room_type || 'Room Stay', '1', `Rs. ${p.toLocaleString()}`, checkPaid(booking.rb_status)]);
                totalAmount = p;
            } else if (type === 'Activity') {
                const p = parseFloat(booking.total_price || 0);
                items.push(['ACTIVITY', booking.activity_name || 'Activity Booking', '1', `Rs. ${p.toLocaleString()}`, checkPaid(booking.ab_status)]);
                totalAmount = p;
            } else if (type === 'Vehicle') {
                const p = parseFloat(booking.vehicle_price_per_day || 0) * parseInt(booking.vb_days || 0);
                items.push(['TRANSPORT', `${booking.vehicle_type || 'Vehicle Hire'}\n${booking.vb_days || 0} Days`, 'HIRE', `Rs. ${p.toLocaleString()}`, checkPaid(booking.vb_status)]);
                totalAmount = p;
            }
        }

        autoTable(doc, {
            startY: currentY + 35,
            head: [['CATEGORY', 'DESCRIPTION', 'QTY', 'PRICE', 'STATUS']],
            body: items,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
            styles: { fontSize: 8.5, cellPadding: 4, textColor: [51, 65, 85], valign: 'middle' },
            columnStyles: {
                0: { cellWidth: 32, fontStyle: 'bold', textColor: accentColor },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
                4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
            },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            didParseCell: (data) => {
                if (data.column.index === 4 && data.section === 'body') {
                    if (data.cell.raw === 'PAID') data.cell.styles.textColor = emeraldColor;
                    if (data.cell.raw === 'PENDING') data.cell.styles.textColor = amberColor;
                }
            }
        });

        // --- FINANCIAL SUMMARY ---
        let finalY = doc.lastAutoTable.finalY + 15;
        if (finalY + 50 > pageHeight - 30) {
            doc.addPage();
            finalY = 20;
        }

        const getVal = (row) => parseFloat(String(row[3]).replace('Rs. ', '').replace(/,/g, '') || 0);
        const paidSum = items.filter(i => i[4] === 'PAID').reduce((sum, i) => sum + getVal(i), 0);
        const pendingSum = items.filter(i => i[4] === 'PENDING').reduce((sum, i) => sum + getVal(i), 0);

        const summaryX = pageWidth - 90;
        doc.setFillColor(...lightGray);
        doc.roundedRect(summaryX, finalY, 76, 45, 2, 2, 'F');
        
        doc.setFontSize(9);
        doc.setTextColor(...grayColor);
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal:', summaryX + 5, finalY + 10);
        doc.setTextColor(...primaryColor);
        doc.text(`Rs. ${totalAmount.toLocaleString()}`, summaryX + 71, finalY + 10, { align: 'right' });

        doc.setTextColor(...grayColor);
        doc.text('Amount Paid:', summaryX + 5, finalY + 18);
        doc.setTextColor(...emeraldColor);
        doc.text(`- Rs. ${paidSum.toLocaleString()}`, summaryX + 71, finalY + 18, { align: 'right' });

        doc.setTextColor(...grayColor);
        doc.text('Balance Due:', summaryX + 5, finalY + 26);
        doc.setTextColor(...amberColor);
        doc.text(`Rs. ${pendingSum.toLocaleString()}`, summaryX + 71, finalY + 26, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.line(summaryX + 5, finalY + 30, summaryX + 71, finalY + 30);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('GRAND TOTAL:', summaryX + 5, finalY + 38);
        doc.setTextColor(...accentColor);
        doc.setFontSize(13);
        doc.text(`Rs. ${totalAmount.toLocaleString()}`, summaryX + 71, finalY + 38, { align: 'right' });

        // --- FOOTER ---
        const footerY = pageHeight - 30;
        doc.setFontSize(10);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Thank you for choosing Janas Blue Water!', 14, footerY);
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text('Note: This is a computer-generated invoice. No signature is required.', 14, footerY + 6);
        doc.text('All payments are subject to our reservation and cancellation policy.', 14, footerY + 10);
        
        doc.setFillColor(...primaryColor);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('© 2026 JANAS BLUE WATER CORNER. ALL RIGHTS RESERVED.', pageWidth / 2, pageHeight - 5, { align: 'center' });

        doc.save(`Invoice_${receiptNo}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-10 h-10 border-4 border-gold-200 border-t-gold-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const sections = [
        { 
            id: 'in-process',
            title: 'In-Process Stays', 
            description: 'Your current residency at our hotel',
            trips: trips.filter(t => t.rb_status?.toLowerCase() === 'checked-in'),
            icon: '🛎️'
        },
        { 
            id: 'upcoming',
            title: 'Upcoming Trips', 
            description: 'Stays you have already booked or confirmed',
            trips: trips.filter(t => ['booked', 'confirmed', 'pending payment', 'pending', 'pending approval'].includes(t.rb_status?.toLowerCase()))
                        .sort((a, b) => new Date(a.check_in_date) - new Date(b.check_in_date)),
            icon: '🗓️'
        },
        { 
            id: 'completed',
            title: 'Completed Stays', 
            description: 'Memories from your previous visits',
            trips: trips.filter(t => t.rb_status?.toLowerCase() === 'completed')
                        .sort((a, b) => new Date(b.check_out_date) - new Date(a.check_out_date)),
            icon: '✅'
        },
        { 
            id: 'cancelled',
            title: 'Cancelled Bookings', 
            description: 'Trips that were cancelled or rejected',
            trips: trips.filter(t => ['cancelled', 'rejected'].includes(t.rb_status?.toLowerCase()))
                        .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date)),
            icon: '✕'
        }
    ].filter(s => s.trips.length > 0);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">My <span className="text-gold-600">Bookings</span></h1>
                <p className="text-slate-600">Manage your upcoming stays and all linked services</p>
            </div>

            {trips.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HomeModernIcon className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No bookings planned yet</h3>
                    <p className="text-slate-500 mb-6">Book a room to start planning your perfect getaway.</p>
                    <button 
                        onClick={() => navigate('/guest/rooms')}
                        className="bg-gold-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-gold-700 transition"
                    >
                        Start a New Booking
                    </button>
                </div>
            ) : (
                <div className="space-y-16">
                    {sections.map(section => (
                        <div key={section.id} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-200/50">
                                    {section.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{section.title} <span className="text-slate-300 font-medium ml-2">({section.trips.length})</span></h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{section.description}</p>
                                </div>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4"></div>
                            </div>

                            <div className="space-y-12">
                                {section.trips.map(trip => (
                                    <div key={trip.rb_id} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                                        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] min-h-[500px]">
                                            
                                            {/* LEFT COLUMN: Summary & Main Controls */}
                                            <div className="bg-slate-900 p-8 text-white flex flex-col h-full relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                                <div className="relative z-10 flex flex-col h-full">
                                                    <div className="mb-8">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            {getStatusBadge(trip.rb_status)}
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">#{trip.rb_id}</span>
                                                        </div>
                                                        <h2 className="text-2xl font-black mb-1">{trip.room_type || 'Room'}</h2>
                                                        <p className="text-gold-500 font-bold uppercase tracking-widest text-[10px]">Primary Reservation</p>
                                                    </div>

                                                    <div className="space-y-6 pt-6 border-t border-slate-800">
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Check-in / Out</p>
                                                            <div className="flex items-center gap-3">
                                                                <CalendarDaysIcon className="w-5 h-5 text-gold-500" />
                                                                <p className="font-bold text-sm">
                                                                    {formatDate(trip.check_in_date)} &mdash; {formatDate(trip.check_out_date)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Room Assigned</p>
                                                            <div className="flex items-center gap-3">
                                                                <HomeModernIcon className="w-5 h-5 text-gold-500" />
                                                                <p className="font-bold text-sm">Room {trip.room_number || 'TBD'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="relative group">
                                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-500/20 to-orange-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                                                            <div className="relative bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
                                                                {/* Condensed Breakdown */}
                                                                <div className="space-y-2 mb-5 pb-5 border-b border-slate-700/50">
                                                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                                        <span className="text-slate-400">Room Base Stay</span>
                                                                        <span className="text-white">Rs. {Number(trip.total_price).toLocaleString()}</span>
                                                                    </div>
                                                                    
                                                                    {trip.activities?.length > 0 && (
                                                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                                            <span className="text-slate-400">Activities Total</span>
                                                                            <span className="text-white">
                                                                                Rs. {trip.activities.reduce((sum, act) => sum + Number(act.total_price), 0).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {trip.foodOrders?.length > 0 && (
                                                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                                            <span className="text-slate-400">Catering Total</span>
                                                                            <span className="text-white">
                                                                                Rs. {trip.foodOrders.reduce((sum, order) => sum + order.items.filter(i => i.item_status !== 'Cancelled').reduce((s, i) => s + (Number(i.item_price) * Number(i.order_quantity)), 0), 0).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {trip.vehicles?.length > 0 && (
                                                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                                            <span className="text-slate-400">Transport Total</span>
                                                                            <span className="text-white">
                                                                                Rs. {trip.vehicles.reduce((sum, veh) => sum + (Number(veh.vehicle_price_per_day) * Number(veh.vb_days)), 0).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Grand Total Hero */}
                                                                <div>
                                                                    <p className="text-[10px] text-white font-bold uppercase tracking-[0.2em] mb-2 leading-none">Total Estimated Amount</p>
                                                                    <div className="flex items-baseline gap-1.5 text-white">
                                                                        <span className="text-lg font-black text-gold-500 underline underline-offset-4 decoration-2">Rs.</span>
                                                                        <span className="text-4xl font-black tracking-tight">
                                                                            {(
                                                                                Number(trip.total_price || 0) +
                                                                                (trip.activities || []).reduce((sum, act) => sum + Number(act.total_price || 0), 0) +
                                                                                (trip.foodOrders || []).reduce((sum, order) => sum + order.items.filter(i => i.item_status !== 'Cancelled').reduce((s, i) => s + (Number(i.item_price) * Number(i.order_quantity)), 0), 0) +
                                                                                (trip.vehicles || []).reduce((sum, veh) => sum + (Number(veh.vehicle_price_per_day) * Number(veh.vb_days)), 0) +
                                                                                (trip.quickRides || []).reduce((sum, qr) => sum + Number(qr.total_amount || 0), 0)
                                                                            ).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto pt-8 space-y-3">
                                                        <button 
                                                            onClick={() => downloadReceipt(trip, 'Summary')}
                                                            className="w-full flex items-center justify-center gap-2 py-4 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-gold-600/20 active:scale-[0.98]"
                                                        >
                                                            <ArrowDownTrayIcon className="w-4 h-4" /> Download Full Receipt
                                                        </button>
                                                        {['booked', 'confirmed', 'pending', 'pending payment'].includes(trip.rb_status?.toLowerCase()) && (
                                                            <button 
                                                                onClick={() => handleCancelClick('room', trip.rb_id, trip.check_in_date)}
                                                                className="w-full py-3 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-400/30 font-bold uppercase tracking-widest text-[9px] transition-all rounded-xl"
                                                            >
                                                                Cancel This Booking
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT COLUMN: Linked Services */}
                                            <div className="p-8 bg-white overflow-y-auto">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Service Itinerary</h3>
                                                    <div className="h-[1px] flex-1 bg-slate-100 mx-6"></div>
                                                </div>

                                                <div className="space-y-8">
                                                    {/* Activities */}
                                                    {trip.activities?.length > 0 && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 text-slate-900 mb-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                <h4 className="text-xs font-black uppercase tracking-widest">Linked Activities</h4>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {trip.activities.map(act => (
                                                                    <div key={act.ab_id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 p-4 bg-slate-50 hover:bg-gold-500/5 rounded-2xl border border-transparent hover:border-gold-500/20 transition-all group">
                                                                        <div>
                                                                            <p className="font-bold text-slate-800 text-sm">{act.activity_name}</p>
                                                                            <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5 whitespace-pre-line tracking-wider">
                                                                                {formatDate(act.ab_start_time, {hour:'2-digit', minute:'2-digit'})} {'\n'}To {formatDate(act.ab_end_time, {hour:'2-digit', minute:'2-digit'})}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right min-w-[80px]">
                                                                            <span className="text-sm font-black text-slate-900">Rs. {act.total_price}</span>
                                                                        </div>
                                                                        <div className="min-w-[100px] flex flex-col items-center gap-2">
                                                                            {getStatusBadge(act.ab_status)}
                                                                            {['pending', 'booked', 'confirmed', 'reserved'].includes(act.ab_status?.toLowerCase()) && (
                                                                                <button
                                                                                    onClick={() => handleCancelActivity(act.ab_id)}
                                                                                    className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 border border-transparent hover:border-rose-200 px-2 py-1 rounded transition-colors"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Food Orders */}
                                                    {trip.foodOrders?.length > 0 && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 text-slate-900 mb-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                                                <h4 className="text-xs font-black uppercase tracking-widest">Catering Services</h4>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {trip.foodOrders.map(order => (
                                                                    <div key={order.order_id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                                        <div className="flex justify-between items-start mb-4">
                                                                            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Status</p>
                                                                                {getStatusBadge(order.order_status)}
                                                                            </div>
                                                                            {['pending', 'ordered'].includes(order.order_status?.toLowerCase()) && (
                                                                                <button
                                                                                    onClick={() => handleCancelFoodOrder(order.order_id)}
                                                                                    className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 border border-transparent hover:border-rose-200 px-2 py-1 rounded transition-colors"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <ul className="space-y-2 mb-4">
                                                                            {order.items.map(item => (
                                                                                <li key={item.order_item_id} className={`flex justify-between items-center text-xs font-bold ${item.item_status === 'Cancelled' ? 'opacity-40 line-through grayscale' : ''}`}>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-slate-500">{item.order_quantity}x {item.item_name}</span>
                                                                                        {item.item_status === 'Cancelled' && (
                                                                                            <span className="text-[8px] text-rose-500 uppercase tracking-widest leading-none mt-1">Cancelled</span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <span className="text-slate-900">Rs. {item.order_total_amount || (item.item_price * item.order_quantity)}</span>
                                                                                        {item.item_status !== 'Cancelled' && ['pending', 'ordered'].includes(order.order_status?.toLowerCase()) && (
                                                                                            <button
                                                                                                onClick={() => handleCancelFoodItem(order.order_id, item.order_item_id)}
                                                                                                className="text-[9px] text-rose-400 hover:text-rose-600 uppercase tracking-wider bg-rose-50 hover:bg-rose-100 p-1.5 rounded transition-colors"
                                                                                                title="Cancel this item"
                                                                                            >
                                                                                                ✕
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                        <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-100">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.dining_option}</span>
                                                                            </div>
                                                                            {order.scheduled_date && (
                                                                                <span className="text-[10px] font-bold text-gold-600 uppercase whitespace-nowrap">
                                                                                    {formatDate(order.scheduled_date)} • {order.meal_type}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Vehicles */}
                                                    {(trip.vehicles?.length > 0 || trip.quickRides?.length > 0) && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 text-slate-900 mb-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                                <h4 className="text-xs font-black uppercase tracking-widest">Travel & Mobility</h4>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {trip.vehicles?.map(veh => (
                                                                    <div key={veh.isArrivalTransport ? `arr-${veh.vb_id}` : `veh-${veh.vb_id}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4 bg-slate-50 hover:bg-gold-500/5 rounded-2xl border border-transparent hover:border-gold-500/20 transition-all group">
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="font-bold text-slate-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{veh.vehicle_type}</p>
                                                                                {veh.isArrivalTransport && (
                                                                                    <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter">Arrival</span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-[10px] font-black text-slate-500 uppercase">{veh.vehicle_number || 'TBD'}</p>
                                                                        </div>
                                                                        <div className="text-right min-w-[100px] flex flex-col items-end">
                                                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Fee</p>
                                                                            <span className="text-sm font-black text-slate-900">Rs. {Number(veh.vehicle_price_per_day * veh.vb_days).toLocaleString()}</span>
                                                                            {veh.vb_status?.toLowerCase() === 'pending payment' && (
                                                                                <button 
                                                                                    onClick={() => handleVehiclePayment(veh)}
                                                                                    className="mt-2 text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
                                                                                >
                                                                                    Pay Now
                                                                                </button>
                                                                            )}
                                                                            {veh.isArrivalTransport && !['cancelled', 'completed'].includes(veh.vb_status?.toLowerCase()) && (
                                                                                <button
                                                                                    onClick={() => handleCancelClick('arrival', veh.vb_id, veh.booking_date)}
                                                                                    className="mt-2 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 border border-transparent hover:border-rose-200 px-2 py-1 rounded transition-colors"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            )}
                                                                            {!veh.isArrivalTransport && !['cancelled', 'completed'].includes(veh.vb_status?.toLowerCase()) && (
                                                                                <button
                                                                                    onClick={() => handleCancelClick('vehicle', veh.vb_id, veh.booking_date)}
                                                                                    className="mt-2 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 border border-transparent hover:border-rose-200 px-2 py-1 rounded transition-colors"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-[100px] flex justify-center">
                                                                            {getStatusBadge(veh.vb_status)}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {trip.quickRides?.map(qr => (
                                                                    <div key={`qr-${qr.qr_id}`} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 p-4 bg-slate-50 hover:bg-gold-500/5 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all group">
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="font-bold text-slate-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{qr.veh_type || qr.vehicle_type_requested}</p>
                                                                                <span className="bg-blue-100 text-blue-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter">Quick Ride</span>
                                                                            </div>
                                                                            <p className="text-[10px] font-black text-slate-500 uppercase mt-1">
                                                                                <MapPinIcon className="w-3 h-3 inline mr-1 text-green-500"/>{qr.pickup_location}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right min-w-[100px] flex flex-col items-end">
                                                                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Total Fare</p>
                                                                            <span className="text-sm font-black text-slate-900">
                                                                                {qr.total_amount ? `Rs. ${Number(qr.total_amount).toLocaleString()}` : 'Pending Fare'}
                                                                            </span>
                                                                            {qr.payment_status?.toLowerCase() === 'awaiting payment' && (
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        setPaymentModal({ isOpen: true, amount: Number(qr.total_amount), vehicle: { ...qr, isQuickRide: true } });
                                                                                    }}
                                                                                    className="mt-2 text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
                                                                                >
                                                                                    Pay Now
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-[100px] flex justify-center">
                                                                            {getStatusBadge(qr.status)}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(!trip.activities?.length && !trip.foodOrders?.length && !trip.vehicles?.length) && (
                                                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 grayscale">
                                                            <div className="text-4xl mb-4">✨</div>
                                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Personalize Your Stay Below</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {['confirmed', 'booked', 'checked-in', 'active'].includes(trip.rb_status?.toLowerCase()) && (
                                                    <div className="mt-12 pt-10 border-t border-slate-100">
                                                        <div className="flex items-center justify-center gap-4 mb-6">
                                                            <div className="h-[1px] w-12 bg-slate-200"></div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Enhance Your Stay</p>
                                                            <div className="h-[1px] w-12 bg-slate-200"></div>
                                                        </div>
                                                        <div className="flex flex-wrap justify-center gap-4">
                                                            {[
                                                                { label: 'Extend Stay', icon: <CalendarDaysIcon className="w-4 h-4" />, path: `/guest/extend-room?rb_id=${trip.rb_id}` },
                                                                { label: 'Add Food', icon: <PlusCircleIcon className="w-4 h-4" />, path: `/guest/food-orders?rb_id=${trip.rb_id}` },
                                                                { label: 'Quick Ride', icon: <MapPinIcon className="w-4 h-4" />, path: `/guest/quick-ride?rb_id=${trip.rb_id}` },
                                                                { label: 'Book Activity', icon: <PlusCircleIcon className="w-4 h-4" />, path: `/guest/activities?rb_id=${trip.rb_id}` }
                                                            ].map(btn => {
                                                                const isStaying = ['checked-in', 'active'].includes(trip.rb_status?.toLowerCase());
                                                                return (
                                                                <button 
                                                                    key={btn.label}
                                                                    onClick={() => isStaying ? navigate(btn.path) : undefined}
                                                                    disabled={!isStaying}
                                                                    className={`group flex flex-col items-center gap-3 p-5 min-w-[130px] rounded-2xl border-2 transition-all duration-300 shadow-sm relative ${
                                                                        isStaying
                                                                        ? 'bg-white hover:bg-gold-500 border-gold-500 hover:border-gold-600 text-slate-600 hover:text-white hover:shadow-xl hover:shadow-gold-500/20 active:scale-95'
                                                                        : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70 grayscale'
                                                                    }`}
                                                                >
                                                                    {!isStaying && (
                                                                        <div className="absolute -top-2.5 bg-slate-200 text-slate-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full z-10 whitespace-nowrap">
                                                                            Unavailable
                                                                        </div>
                                                                    )}
                                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                                                                        isStaying ? 'bg-slate-50 group-hover:bg-gold-400' : 'bg-slate-200'
                                                                    }`}>
                                                                        {btn.icon}
                                                                    </div>
                                                                    <span className="text-[11px] font-black uppercase tracking-wider">{btn.label}</span>
                                                                </button>
                                                            )})}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <DemoPaymentGateway 
                isOpen={paymentModal.isOpen}
                onClose={() => setPaymentModal({ isOpen: false, amount: 0, vehicle: null })}
                amount={paymentModal.amount}
                onPaymentSuccess={confirmVehiclePayment}
            />

            {/* Cancellation Reason Modal */}
            {cancelModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
                                <ExclamationTriangleIcon className="w-8 h-8 text-rose-500" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Cancel Service?</h3>
                            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                                Please tell us why you're cancelling. 
                                {cancelModal.type === 'room' && " This will cancel the entire trip and all linked services."}
                            </p>

                            {/* Refund Policy Notice */}
                            {(cancelModal.type === 'room' || cancelModal.type === 'vehicle' || cancelModal.type === 'arrival') ? (
                                <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                    <p className="font-black uppercase tracking-wider mb-1">📋 Refund Policy</p>
                                    <p>Rooms &amp; Vehicles are eligible for a refund if cancelled <strong>at least 24 hours</strong> before check-in. Activities &amp; Dining are <strong>non-refundable</strong>.</p>
                                </div>
                            ) : (
                                <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                                    <p className="font-black uppercase tracking-wider mb-1">⚠️ Non-Refundable</p>
                                    <p>As per our policy, activities and dining services are <strong>strictly non-refundable</strong>.</p>
                                </div>
                            )}

                            <textarea
                                value={cancelModal.reason}
                                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                                placeholder="Why are you cancelling?"
                                className="w-full h-28 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-gold-500 focus:bg-white transition-all outline-none text-slate-700 text-sm resize-none mb-4"
                            />

                            {/* Refund Request Checkbox - only for room/vehicle/arrival if eligible */}
                            {(cancelModal.type === 'room' || cancelModal.type === 'vehicle' || cancelModal.type === 'arrival') && (
                                isRefundEligible(cancelModal.checkInDate) ? (
                                    <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={cancelModal.requestRefund}
                                            onChange={(e) => setCancelModal({ ...cancelModal, requestRefund: e.target.checked })}
                                            className="mt-0.5 w-4 h-4 accent-gold-500 cursor-pointer"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-gold-600 transition-colors">Yes, I want to request a refund</p>
                                            <p className="text-xs text-slate-400 mt-0.5">A refund request will be submitted for review by the hotel team.</p>
                                        </div>
                                    </label>
                                ) : (
                                    <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <p className="text-xs text-slate-500">⏰ <strong>Refund not available</strong> — cancellations must be made at least 24 hours before check-in.</p>
                                    </div>
                                )
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCancelModal({ isOpen: false, type: '', id: null, reason: '', requestRefund: false, checkInDate: null })}
                                    className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-2xl transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={confirmCancellation}
                                    className="flex-1 py-4 px-6 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuestBookings;
