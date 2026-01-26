import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const DriverTrips = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        try {
            const res = await axios.get('/api/driver/trips');
            setTrips(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching trips:', error);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (tripId, newStatus) => {
        try {
            await axios.put(`/api/driver/trips/${tripId}/status`, { status: newStatus });
            toast.success(`Trip marked as ${newStatus}`);
            fetchTrips();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    if (loading) return <div className="p-8">Loading trips...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">My Assigned Trips</h1>

            <div className="grid grid-cols-1 gap-4">
                {trips.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-slate-500">
                        No trips assigned to you yet.
                    </div>
                ) : (
                    trips.map((trip) => (
                        <div key={trip.vb_id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row justify-between lg:items-center gap-4">

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${trip.vb_status === 'Booked' ? 'bg-blue-100 text-blue-700' :
                                        trip.vb_status === 'In Progress' ? 'bg-orange-100 text-orange-700' :
                                            trip.vb_status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                trip.vb_status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {trip.vb_status}
                                    </span>
                                    <span className="text-sm text-slate-500 font-mono">#{trip.vb_id}</span>
                                </div>

                                {trip.vb_status === 'Cancelled' && trip.cancel_reason && (
                                    <div className="mb-3 bg-red-50 text-red-800 text-sm p-2 rounded border border-red-200">
                                        <span className="font-semibold">Cancellation Reason:</span> {trip.cancel_reason}
                                    </div>
                                )}

                                <div className="mb-2">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Booking Date</p>
                                    <p className="font-medium text-slate-900">{new Date(trip.vb_date).toLocaleDateString()}</p>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-6 text-sm">
                                    <div>
                                        <span className="text-slate-500">Guest: </span>
                                        <span className="font-medium text-slate-900">{trip.guest_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Phone: </span>
                                        <span className="font-medium text-slate-900">{trip.guest_phone}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Vehicle: </span>
                                        <span className="font-medium text-slate-900">{trip.vehicle_number} ({trip.vehicle_type})</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row lg:flex-col gap-2 min-w-[140px]">
                                {trip.vb_status === 'Booked' && (
                                    <button
                                        onClick={() => handleStatusUpdate(trip.vb_id, 'In Progress')}
                                        className="w-full py-2 px-4 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg transition-colors"
                                    >
                                        Start Trip
                                    </button>
                                )}

                                {trip.vb_status === 'In Progress' && (
                                    <button
                                        onClick={() => handleStatusUpdate(trip.vb_id, 'Completed')}
                                        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                                    >
                                        Complete Trip
                                    </button>
                                )}

                                {trip.vb_status === 'Completed' && (
                                    <div className="text-center py-2 px-4 bg-slate-50 text-slate-500 font-medium rounded-lg">
                                        Trip Finished
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DriverTrips;
