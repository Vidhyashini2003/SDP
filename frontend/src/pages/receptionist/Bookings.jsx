import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ReceptionistBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/receptionist/bookings/rooms', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load bookings');
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/receptionist/bookings/rooms/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Booking marked as ${newStatus}`);
            fetchBookings(); // Refresh data
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-CA');
    };

    if (loading) return <div className="p-8 text-center text-slate-600">Loading bookings...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-2">Manage Room Bookings</h1>
            <p className="text-slate-600 mb-8">Check-in and check-out guests</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Guest Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Room</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Check-In</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Check-Out</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Phone</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bookings.map((booking) => (
                                <tr key={booking.rb_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{booking.guest_name}</td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {booking.room_id} - {booking.room_type}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{formatDate(booking.rb_checkin)}</td>
                                    <td className="px-6 py-4 text-slate-600">{formatDate(booking.rb_checkout)}</td>
                                    <td className="px-6 py-4 text-slate-600">{booking.guest_phone || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${booking.rb_status === 'Booked' ? 'bg-green-100 text-green-800' :
                                                booking.rb_status === 'Checked-in' ? 'bg-blue-100 text-blue-800' :
                                                    booking.rb_status === 'Checked-out' ? 'bg-slate-100 text-slate-800' :
                                                        booking.rb_status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800' // Pending
                                            }`}>
                                            {booking.rb_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {booking.rb_status === 'Booked' && (
                                            <button
                                                onClick={() => handleStatusUpdate(booking.rb_id, 'Checked-in')}
                                                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                                            >
                                                Check-In
                                            </button>
                                        )}
                                        {booking.rb_status === 'Checked-in' && (
                                            <button
                                                onClick={() => handleStatusUpdate(booking.rb_id, 'Checked-out')}
                                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
                                            >
                                                Check-Out
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        No bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistBookings;
