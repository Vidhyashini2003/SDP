import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ReceptionistActivities = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/receptionist/bookings/activities', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching activity bookings:', error);
            toast.error('Failed to load activity bookings');
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/receptionist/bookings/activities/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Activity marked as ${newStatus}`);
            fetchBookings(); // Refresh data
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-CA');
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        // Handle 'HH:mm:ss' or 'HH:mm'
        return timeString.substring(0, 5);
    };

    if (loading) return <div className="p-8 text-center text-slate-600">Loading activities...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-2">Activity Bookings</h1>
            <p className="text-slate-600 mb-8">Manage guest activities</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Guest Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Activity</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Time</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bookings.map((booking) => (
                                <tr key={booking.ab_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{booking.guest_name}</td>
                                    <td className="px-6 py-4 text-slate-600">{booking.activity_name}</td>
                                    <td className="px-6 py-4 text-slate-600">{formatDate(booking.ab_start_time)}</td>
                                    <td className="px-6 py-4 text-slate-600">{formatTime(booking.ab_start_time)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                            ${booking.ab_status === 'Reserved' || booking.ab_status === 'Pending' ? 'bg-white border-slate-200 text-slate-600' :
                                                booking.ab_status === 'Confirmed' || booking.ab_status === 'Check-In' ? 'bg-white border-slate-200 text-slate-600' :
                                                    booking.ab_status === 'In Progress' ? 'bg-teal-600 border-teal-600 text-white' :
                                                        'bg-slate-100 text-slate-800'
                                            }`}>
                                            {booking.ab_status === 'Confirmed' ? 'Check-In' : booking.ab_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(booking.ab_status === 'Reserved' || booking.ab_status === 'Pending' || booking.ab_status === 'Confirmed') && (
                                            <button
                                                onClick={() => handleStatusUpdate(booking.ab_id, 'In Progress')}
                                                className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                                            >
                                                Start
                                            </button>
                                        )}
                                        {booking.ab_status === 'In Progress' && (
                                            <button
                                                onClick={() => handleStatusUpdate(booking.ab_id, 'Completed')}
                                                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
                                            >
                                                End
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                        No activity bookings found.
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

export default ReceptionistActivities;
