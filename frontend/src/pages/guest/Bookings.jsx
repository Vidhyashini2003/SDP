import { useState, useEffect } from 'react';
import axios from '../../config/axios'; // Use configured axios
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import autoTable from 'jspdf-autotable';

const GuestBookings = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [bookings, setBookings] = useState({
        rooms: [],
        activities: [],
        foodOrders: [],
        vehicles: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllBookings();
    }, []);

    const fetchAllBookings = async () => {
        try {
            const [bookingsRes, ordersRes] = await Promise.all([
                axios.get('/api/guest/bookings'),
                axios.get('/api/guest/orders')
            ]);

            setBookings({
                rooms: bookingsRes.data?.rooms || [],
                activities: bookingsRes.data?.activities || [],
                foodOrders: ordersRes.data || [],
                vehicles: bookingsRes.data?.vehicles || []
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking? Cancellation is only allowed 24 hours before check-in.')) {
            return;
        }

        try {
            await axios.post(`/api/guest/bookings/rooms/${bookingId}/cancel`);
            toast.success('Booking cancelled successfully');
            fetchAllBookings(); // Refresh list
        } catch (error) {
            console.error('Cancellation error:', error);
            toast.error(error.response?.data?.error || 'Failed to cancel booking');
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'checked-in': 'bg-blue-500',
            'confirmed': 'bg-green-500',
            'pending': 'bg-yellow-500',
            'pending approval': 'bg-yellow-100 text-yellow-800',
            'pending payment': 'bg-orange-100 text-orange-800',
            'active': 'bg-blue-500',
            'booked': 'bg-green-500',
            'delivered': 'bg-green-500',
            'ordered': 'bg-yellow-500',
            'cancelled': 'bg-red-500',
            'completed': 'bg-slate-500',
            'rejected': 'bg-red-500'
        };
        return `${statusColors[status?.toLowerCase()] || 'bg-slate-500'} text-white`;
    };

    const handleVehiclePayment = async (vehicle) => {
        const amount = vehicle.vehicle_price_per_day * vehicle.vb_days;
        if (!confirm(`Confirm payment of Rs. ${amount} for ${vehicle.vehicle_type}?`)) return;

        try {
            await axios.post(`/api/guest/bookings/vehicles/${vehicle.vb_id}/pay`, {
                payment_method: 'Card', // Hardcoded for demo/simplicity or ask user
                total_amount: amount
            });
            toast.success('Payment successful! Trip confirmed.');
            window.location.reload();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Payment failed');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const downloadReceipt = (booking, type) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- Colors ---
        const primaryColor = [30, 41, 59]; // Slate 800 (Navy-ish)
        const accentColor = [218, 165, 32]; // Gold
        const grayColor = [100, 116, 139]; // Slate 500

        // --- Header ---
        // Company Info (Left)
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Janas Blue Water Corner', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text('123 Beach Road, Trincomalee', 14, 26);
        doc.text('Email: info@janasblue.com | Tel: +94 77 123 4567', 14, 31);

        // Receipt Label (Right)
        doc.setFontSize(24);
        doc.setTextColor(...accentColor);
        doc.text('RECEIPT', pageWidth - 14, 22, { align: 'right' });

        // --- Meta Data (Right below label) ---
        let id = '';
        let amount = 0;
        let date = '';
        let status = '';
        let items = [];

        // Extract Data based on Type
        if (type === 'Room') {
            id = booking.rb_id;
            amount = booking.total_price;
            date = booking.created_at || new Date().toISOString();
            status = booking.rb_status;
            items = [
                ['Room Booking', `Type: ${booking.room_type}\nCheck-in: ${formatDate(booking.check_in_date)}\nCheck-out: ${formatDate(booking.check_out_date)}`, '1', `Rs. ${amount}`]
            ];
        } else if (type === 'Activity') {
            id = booking.ab_id;
            amount = booking.total_price || 0;
            date = booking.booking_date;
            status = booking.ab_status;
            items = [
                ['Activity Booking', `${booking.activity_name}\nDate: ${formatDate(booking.booking_date)}\nDuration: ${booking.duration_hours} Hrs`, '1', `Rs. ${amount}`]
            ];
        } else if (type === 'Vehicle') {
            id = booking.vb_id;
            amount = booking.total_amount || (booking.vehicle_price_per_day * booking.vb_days);
            date = booking.booking_date;
            status = booking.vb_status;
            items = [
                ['Vehicle Rental', `${booking.vehicle_type} - ${booking.vehicle_number}\nDate: ${formatDate(booking.booking_date)}`, `${booking.vb_days} Days`, `Rs. ${amount}`]
            ];
        } else if (type === 'Food') {
            id = booking.order_id;
            amount = booking.order_total_amount;
            date = booking.order_date;
            status = booking.payment_status || booking.order_status;
            items = booking.items.map(item => [
                'Food Order',
                item.item_name,
                item.order_quantity,
                `Rs. ${item.order_total_amount || (item.item_price * item.order_quantity)}`
            ]);
        }

        const receiptNo = `${type.substring(0, 2).toUpperCase()}-${String(id).padStart(4, '0')}`;
        const issueDate = new Date().toLocaleDateString();

        doc.setFontSize(10);
        doc.setTextColor(...primaryColor);
        doc.text(`Receipt #: ${receiptNo}`, pageWidth - 14, 32, { align: 'right' });
        doc.text(`Date: ${issueDate}`, pageWidth - 14, 37, { align: 'right' });

        // --- Divider ---
        doc.setDrawColor(226, 232, 240); // Light gray line
        doc.setLineWidth(0.5);
        doc.line(14, 45, pageWidth - 14, 45);

        // --- Payment Status Badge ---
        const isPaid = !['pending', 'pending payment', 'cancelled', 'rejected', 'pending approval'].includes(status?.toLowerCase());
        const statusText = isPaid ? 'PAID' : 'NOT PAID';
        const statusColor = isPaid ? [22, 163, 74] : [220, 38, 38]; // Green or Red

        // Status Label & Box
        doc.setFontSize(10);
        doc.setTextColor(...grayColor);
        doc.text('Payment Status', 14, 53);

        doc.setFillColor(...(isPaid ? [220, 252, 231] : [254, 226, 226]));
        doc.rect(14, 56, 30, 8, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...statusColor);
        doc.text(statusText, 29, 61, { align: 'center' });

        // --- Table ---
        autoTable(doc, {
            startY: 70,
            head: [['Item', 'Description', 'Quantity', 'Amount']],
            body: items,
            theme: 'plain', // Clean theme
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'left'
            },
            styles: {
                fontSize: 10,
                cellPadding: 6,
                textColor: [51, 65, 85],
                lineColor: [226, 232, 240],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 40, fontStyle: 'bold' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 30, halign: 'center' },
                3: { cellWidth: 40, halign: 'right' }
            }
        });

        // --- Total Section ---
        const finalY = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.text('Total Amount:', pageWidth - 80, finalY);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accentColor);
        doc.text(`Rs. ${amount || 0}`, pageWidth - 14, finalY, { align: 'right' });

        // --- Footer ---
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        const footerY = doc.internal.pageSize.height - 30;

        doc.text('Thank you for your business!', 14, footerY);
        doc.text('For questions concerning this receipt, please contact our front desk.', 14, footerY + 5);

        // Brand Line at bottom
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(1);
        doc.line(14, footerY + 12, pageWidth - 14, footerY + 12);

        doc.save(`Receipt_${receiptNo}.pdf`);
    };

    const tabs = [
        { id: 'all', label: 'All Bookings', icon: '📋' },
        { id: 'rooms', label: 'Rooms', icon: '🏨' },
        { id: 'activities', label: 'Activities', icon: '🎯' },
        { id: 'food', label: 'Food Orders', icon: '🍽️' },
        { id: 'vehicles', label: 'Vehicles', icon: '🚗' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-600">Loading bookings...</div>
            </div>
        );
    }

    return (
        <div className="p-6 overflow-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">My <span className="bg-gradient-to-r from-gold-600 to-yellow-500 bg-clip-text text-transparent">Bookings</span></h1>
                <p className="text-slate-500 mt-1">View and manage all your bookings in one place</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="border-b border-slate-200 px-6">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-gold-600 border-b-2 border-gold-600'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {/* All Bookings Tab */}
                    {activeTab === 'all' && (
                        <div className="space-y-6">
                            {/* Room Bookings */}
                            {bookings.rooms.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-3">🏨 Room Bookings</h3>
                                    <div className="space-y-2">
                                        {bookings.rooms.map((booking, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-slate-900">{booking.room_type}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.rb_status)}`}>
                                                    {booking.rb_status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Food Orders */}
                            {bookings.foodOrders.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-3">🍽️ Food Orders</h3>
                                    <div className="space-y-2">
                                        {bookings.foodOrders.map((order, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-slate-900">{order.item_name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        Qty: {order.order_quantity} • Rs. {order.order_total_amount}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.item_status || order.order_status)}`}>
                                                    {order.item_status || order.order_status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Vehicles */}
                            {bookings.vehicles.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-3">🚗 Vehicle Bookings</h3>
                                    <div className="space-y-2">
                                        {bookings.vehicles.map((vehicle, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-slate-900">{vehicle.vehicle_type}</p>
                                                    <p className="text-sm text-slate-500">{vehicle.vehicle_number}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vehicle.vb_status)}`}>
                                                    {vehicle.vb_status || 'Active'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Activities */}
                            {bookings.activities.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-3">🎯 Activities</h3>
                                    <div className="space-y-2">
                                        {bookings.activities.map((activity, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-slate-900">{activity.activity_name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {formatDate(activity.booking_date)}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.ab_status)}`}>
                                                    {activity.ab_status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {bookings.rooms.length === 0 && bookings.activities.length === 0 && bookings.foodOrders.length === 0 && bookings.vehicles.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📋</div>
                                    <p className="text-slate-500">No bookings yet</p>
                                    <p className="text-sm text-slate-400 mt-1">Start booking rooms, activities, or order food!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Room Bookings Tab */}
                    {activeTab === 'rooms' && (
                        <div className="space-y-3">
                            {bookings.rooms.length > 0 ? (
                                bookings.rooms.map((booking, idx) => (
                                    <div key={idx} className="p-5 border border-slate-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-lg">{booking.room_type}</h4>
                                                <p className="text-sm text-slate-500">Booking ID: {booking.rb_id}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => downloadReceipt(booking, 'Room')}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-gold-600 hover:border-gold-200 hover:bg-gold-50 transition-all shadow-sm group"
                                                    title="Download Receipt"
                                                >
                                                    <ArrowDownTrayIcon className="w-4 h-4 text-slate-400 group-hover:text-gold-600 transition-colors" />
                                                    <span>Download Receipt</span>
                                                </button>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.rb_status)}`}>
                                                    {booking.rb_status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-500">Check-in</p>
                                                <p className="font-medium text-slate-900">{formatDate(booking.check_in_date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Check-out</p>
                                                <p className="font-medium text-slate-900">{formatDate(booking.check_out_date)}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">Rs. {booking.total_price || 'N/A'}</p>
                                            </div>
                                            {(booking.rb_status === 'Pending' || booking.rb_status === 'Confirmed' || booking.rb_status === 'Booked') && (
                                                <div className="col-span-2 mt-2">
                                                    <button
                                                        onClick={() => handleCancel(booking.rb_id)}
                                                        className="w-full text-center px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-gold-50 hover:text-gold-600 hover:border-gold-200 text-sm font-medium transition-colors"
                                                    >
                                                        Cancel Booking
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">No room bookings</div>
                            )}
                        </div>
                    )}

                    {/* Activities Tab */}
                    {activeTab === 'activities' && (
                        <div className="space-y-3">
                            {bookings.activities.length > 0 ? (
                                bookings.activities.map((activity, idx) => (
                                    <div key={idx} className="p-5 border border-slate-200 rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-lg">{activity.activity_name}</h4>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Date: {formatDate(activity.booking_date)}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    Duration: {activity.duration_hours} hours
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => downloadReceipt(activity, 'Activity')}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-gold-600 hover:border-gold-200 hover:bg-gold-50 transition-all shadow-sm group"
                                                    title="Download Receipt"
                                                >
                                                    <ArrowDownTrayIcon className="w-4 h-4 text-slate-400 group-hover:text-gold-600 transition-colors" />
                                                    <span>Download Receipt</span>
                                                </button>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.ab_status)}`}>
                                                    {activity.ab_status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">No activity bookings</div>
                            )}
                        </div>
                    )}

                    {/* Food Orders Tab */}
                    {activeTab === 'food' && (
                        <div className="space-y-4">
                            {bookings.foodOrders.length > 0 ? (
                                bookings.foodOrders.map((order, idx) => (
                                    <div key={idx} className="p-5 border border-slate-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-lg">Order #{order.order_id}</h4>
                                                <p className="text-sm text-slate-500">
                                                    {formatDate(order.order_date)} • {order.items.length} Items
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Dining: {order.dining_option}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => downloadReceipt(order, 'Food')}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-gold-600 hover:border-gold-200 hover:bg-gold-50 transition-all shadow-sm group"
                                                    title="Download Receipt"
                                                >
                                                    <ArrowDownTrayIcon className="w-4 h-4 text-slate-400 group-hover:text-gold-600 transition-colors" />
                                                    <span>Download Receipt</span>
                                                </button>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                                                    {order.order_status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {order.items.map((item, itemIdx) => (
                                                <div key={itemIdx} className="flex justify-between items-center text-sm">
                                                    <div>
                                                        <p className="font-medium text-slate-900">{item.item_name}</p>
                                                        <p className="text-slate-500 text-xs">Qty: {item.order_quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium text-slate-900">Rs. {item.order_total_amount || (item.item_price * item.order_quantity)}</p>
                                                        <span className={`text-[10px] uppercase font-bold ${item.item_status === 'Completed' ? 'text-green-600' : 'text-slate-400'}`}>
                                                            {item.item_status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                            <span className="font-semibold text-slate-900">Total Amount</span>
                                            <span className="font-bold text-lg text-gold-600">Rs. {order.order_total_amount}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">No food orders</div>
                            )}
                        </div>
                    )}

                    {/* Vehicles Tab */}
                    {activeTab === 'vehicles' && (
                        <div className="space-y-3">
                            {bookings.vehicles.length > 0 ? (
                                bookings.vehicles.map((vehicle, idx) => (
                                    <div key={idx} className="p-5 border border-slate-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-lg">{vehicle.vehicle_type}</h4>
                                                <p className="text-sm text-slate-500">{vehicle.vehicle_number}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => downloadReceipt(vehicle, 'Vehicle')}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-gold-600 hover:border-gold-200 hover:bg-gold-50 transition-all shadow-sm group"
                                                    title="Download Receipt"
                                                >
                                                    <ArrowDownTrayIcon className="w-4 h-4 text-slate-400 group-hover:text-gold-600 transition-colors" />
                                                    <span>Download Receipt</span>
                                                </button>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vehicle.vb_status)}`}>
                                                    {vehicle.vb_status || 'Active'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="text-sm">
                                                <div>
                                                    <p className="text-slate-500">Date</p>
                                                    <p className="font-medium text-slate-900">
                                                        {new Date(vehicle.booking_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {vehicle.vb_status === 'Pending Payment' && (
                                                <button
                                                    onClick={() => {
                                                        const amount = vehicle.total_amount || (vehicle.vehicle_price_per_day || 0) * (vehicle.vb_days || 1);
                                                        handleVehiclePayment(vehicle);
                                                    }}
                                                    className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white text-sm font-bold rounded-lg transition-colors"
                                                >
                                                    Pay Now
                                                </button>
                                            )}

                                            {vehicle.vb_status === 'Cancelled' && vehicle.cancel_reason && (
                                                <div className="mt-2 text-red-600 bg-red-50 p-2 rounded text-xs">
                                                    <strong>Cancelled:</strong> {vehicle.cancel_reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">No vehicle bookings</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestBookings;
