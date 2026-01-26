import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const VehicleAvailability = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');
    const [requiresReason, setRequiresReason] = useState(false);
    const [conflictCount, setConflictCount] = useState(0);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await axios.get('/api/receptionist/vehicles');
            setVehicles(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setLoading(false);
        }
    };

    const handleStatusClick = (vehicle, status) => {
        if (vehicle.vehicle_status === status) return;

        setSelectedVehicle(vehicle);
        setNewStatus(status);
        setRequiresReason(false);
        setConflictCount(0);
        setCancellationReason('');
        setShowStatusModal(true);
    };

    const confirmStatusChange = async (forceWithReason = false) => {
        if (requiresReason && !cancellationReason) {
            toast.error('Please provide a cancellation reason.');
            return;
        }

        try {
            const payload = {
                status: newStatus,
                reason: forceWithReason ? cancellationReason : undefined
            };

            await axios.put(`/api/receptionist/vehicles/${selectedVehicle.vehicle_id}/status`, payload);

            toast.success('Vehicle status updated successfully');
            setShowStatusModal(false);
            fetchVehicles();
        } catch (error) {
            // Check if backend requires confirmation due to conflicts
            if (error.response?.data?.requiresConfirmation) {
                setRequiresReason(true);
                setConflictCount(error.response.data.activeBookingsCount);
                toast.error('Active bookings exist. Reason required to cancel them.');
            } else {
                console.error('Status update error:', error);
                toast.error('Failed to update status');
            }
        }
    };

    if (loading) return <div className="p-8">Loading vehicles...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Vehicle Availability</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Vehicle</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Current Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vehicles.map((vehicle) => (
                            <tr key={vehicle.vehicle_id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium text-slate-900">{vehicle.vehicle_number}</td>
                                <td className="px-6 py-4 text-slate-600">{vehicle.vehicle_type}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${vehicle.vehicle_status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' :
                                            vehicle.vehicle_status === 'Maintenance' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                        {vehicle.vehicle_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusClick(vehicle, 'Available')}
                                            disabled={vehicle.vehicle_status === 'Available'}
                                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${vehicle.vehicle_status === 'Available' ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                        >
                                            Mark Available
                                        </button>
                                        <button
                                            onClick={() => handleStatusClick(vehicle, 'Maintenance')}
                                            disabled={vehicle.vehicle_status === 'Maintenance'}
                                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${vehicle.vehicle_status === 'Maintenance' ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                        >
                                            Mark Maintenance
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && selectedVehicle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            Set {selectedVehicle.vehicle_number} to {newStatus}?
                        </h3>

                        {!requiresReason ? (
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to update the status?
                            </p>
                        ) : (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-800 font-medium mb-2">⚠️ Warning: {conflictCount} Active Booking(s)</p>
                                <p className="text-sm text-red-700 mb-4">
                                    Changing status to {newStatus} will <strong>CANCEL</strong> these future bookings automatically.
                                </p>
                                <label className="block text-sm font-medium text-red-900 mb-1">
                                    Reason for Cancellation (Required):
                                </label>
                                <input
                                    type="text"
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    placeholder="e.g. Engine Breakdown, Service Required"
                                    className="w-full border-red-300 rounded focus:ring-red-500 focus:border-red-500"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmStatusChange(requiresReason)}
                                className={`px-4 py-2 text-white rounded-lg font-medium shadow-sm 
                                    ${requiresReason ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {requiresReason ? 'Confirm Cancellation' : 'Update Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleAvailability;
