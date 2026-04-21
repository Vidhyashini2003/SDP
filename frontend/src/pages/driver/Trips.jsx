import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const DriverTrips = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fareFormOpen, setFareFormOpen] = useState(null); // stores qr_id of trip being billed
    const [fareData, setFareData] = useState({ actual_km: '', waiting_hours: '' });

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

    const handleStatusUpdate = async (tripId, newStatus, type = 'hire') => {
        try {
            await axios.put(`/api/driver/trips/${tripId}/status?type=${type}`, { status: newStatus });
            toast.success(`Trip marked as ${newStatus}`);
            if (type === 'quickride' && newStatus === 'Completed') {
                setFareFormOpen(tripId);
            } else {
                fetchTrips();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleSetFare = async (tripId) => {
        if(!fareData.actual_km || isNaN(fareData.actual_km)) {
            toast.error("Please enter a valid actual KM.");
            return;
        }

        try {
            await axios.put(`/api/driver/quickrides/${tripId}/amount`, { 
                actual_km: parseFloat(fareData.actual_km),
                waiting_hours: parseFloat(fareData.waiting_hours) || 0
            });
            toast.success("Fare computed. Guest has been notified.");
            setFareFormOpen(null);
            setFareData({ actual_km: '', waiting_hours: '' });
            fetchTrips();
        } catch(error) {
            console.error("Error setting fare:", error);
            toast.error("Failed to set fare.");
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
                    trips.map((trip) => {
                        const tripDate = new Date(trip.vb_date);
                        tripDate.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isFutureTrip = tripDate > today;

                        return (
                        <div key={`${trip.type}-${trip.vb_id}`} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row justify-between lg:items-center gap-4">

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        (trip.vb_status === 'Booked' || trip.vb_status === 'Confirmed') ? 'bg-indigo-100 text-indigo-700' :
                                        trip.vb_status === 'In Progress' ? 'bg-orange-100 text-orange-700' :
                                            trip.vb_status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                trip.vb_status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {(trip.isArrival && trip.vb_status === 'Booked') ? 'Confirm Arrival' : trip.vb_status}
                                    </span>
                                    {trip.isArrival && (
                                        <span className="bg-gold-100 text-gold-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">Arrival Transfer</span>
                                    )}
                                    {trip.isQuickRide && (
                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">Quick Ride</span>
                                    )}
                                    <span className="text-sm text-slate-500 font-mono">#{trip.vb_id}</span>
                                </div>

                                {trip.vb_status === 'Cancelled' && trip.cancel_reason && (
                                    <div className="mb-3 bg-red-50 text-red-800 text-sm p-2 rounded border border-red-200">
                                        <span className="font-semibold">Cancellation Reason:</span> {trip.cancel_reason}
                                    </div>
                                )}

                                <div className="mb-2">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">
                                        {trip.isArrival ? 'Scheduled Date' : trip.isQuickRide ? 'Ride Date' : 'Trip Start Date'}
                                    </p>
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
                                        <span className="font-medium text-slate-900">{trip.vehicle_number || 'TBD'} ({trip.vehicle_type})</span>
                                    </div>
                                    {!trip.isArrival && !trip.isQuickRide && (
                                        <div>
                                            <span className="text-slate-500">Duration: </span>
                                            <span className="font-medium text-slate-900">{trip.vb_days} Days</span>
                                        </div>
                                    )}
                                    {trip.isQuickRide && trip.total_amount && (
                                       <div>
                                            <span className="text-slate-500">Fare Computed: </span>
                                            <span className="font-bold text-green-700">Rs. {Number(trip.total_amount).toLocaleString()}</span>
                                            <span className="text-slate-500 ml-1 text-xs">({trip.payment_status})</span>
                                       </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-row lg:flex-col gap-2 min-w-[140px]">
                                {(trip.vb_status === 'Booked' || trip.vb_status === 'Confirmed') && (
                                    <button
                                        onClick={() => handleStatusUpdate(trip.vb_id, 'In Progress', trip.type)}
                                        disabled={isFutureTrip}
                                        title={isFutureTrip ? "Trip cannot be started before its scheduled date" : "Start this trip now"}
                                        className={`w-full py-2 px-4 font-bold rounded-lg transition-colors ${
                                            isFutureTrip
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-gold-500 hover:bg-gold-600 text-white'
                                        }`}
                                    >
                                        Start Trip
                                    </button>
                                )}

                                {trip.vb_status === 'In Progress' && (
                                    <button
                                        onClick={() => handleStatusUpdate(trip.vb_id, 'Completed', trip.type)}
                                        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                                    >
                                        Complete Trip
                                    </button>
                                )}

                                {trip.vb_status === 'Completed' && trip.type === 'quickride' && (!trip.total_amount || fareFormOpen === trip.vb_id) && (
                                    <div className="mt-2 space-y-2 p-2 border border-blue-200 bg-blue-50 rounded-lg">
                                        <p className="text-xs font-bold text-blue-800 uppercase text-center mb-1">Set Fare</p>
                                        <input 
                                            type="number" 
                                            placeholder="Actual KM" 
                                            value={fareData.actual_km} 
                                            onChange={e => setFareData({...fareData, actual_km: e.target.value})}
                                            className="w-full px-2 py-1 text-sm border rounded focus:ring-1 outline-none"
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="Waiting Hours (opt)" 
                                            value={fareData.waiting_hours} 
                                            onChange={e => setFareData({...fareData, waiting_hours: e.target.value})}
                                            className="w-full px-2 py-1 text-sm border rounded focus:ring-1 outline-none"
                                        />
                                        <button 
                                            onClick={() => handleSetFare(trip.vb_id)}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 rounded transition"
                                        >
                                            Submit Fare
                                        </button>
                                    </div>
                                )}

                                {trip.vb_status === 'Completed' && (trip.type !== 'quickride' || trip.total_amount) && (
                                    <div className="text-center py-2 px-4 bg-slate-50 text-slate-500 font-medium rounded-lg mt-auto">
                                        Trip Finished
                                    </div>
                                )}
                            </div>
                        </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default DriverTrips;