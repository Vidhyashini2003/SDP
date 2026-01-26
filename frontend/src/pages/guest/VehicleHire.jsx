import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const VehicleHire = () => {
    const [vehicles, setVehicles] = useState([]);
    const [searchParams, setSearchParams] = useState({
        vb_date: '',
        vb_days: 1
    });
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requesting, setRequesting] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.get('/api/bookings/vehicles/available', {
                params: {
                    date: searchParams.vb_date,
                    days: searchParams.vb_days
                }
            });
            setVehicles(res.data || []);
            setHasSearched(true);
        } catch (error) {
            console.error('Error searching vehicles:', error);
            alert('Failed to search vehicles');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestHire = async (vehicle) => {
        if (!confirm(`Request to hire ${vehicle.vehicle_type} for ${searchParams.vb_days} days?`)) return;

        setRequesting(vehicle.vehicle_id);
        try {
            const payload = {
                vehicle_id: vehicle.vehicle_id,
                vb_date: searchParams.vb_date,
                vb_days: parseInt(searchParams.vb_days)
            };

            await axios.post('/api/bookings/vehicles', payload);
            alert('Hire request sent! Please wait for a driver to accept.');
            // Optionally remove from list or refresh
            const newVehicles = vehicles.filter(v => v.vehicle_id !== vehicle.vehicle_id);
            setVehicles(newVehicles);
        } catch (error) {
            console.error('Error requesting hire:', error);
            alert(error.response?.data?.error || 'Failed to send request');
        } finally {
            setRequesting(null);
        }
    };

    // Get today's date for min attribute
    const today = new Date().toISOString().split('T')[0];

    const getPassengerCount = (vehicleType) => {
        const type = vehicleType?.toLowerCase() || '';
        if (type.includes('van')) return '12';
        if (type.includes('mini') || type.includes('small')) return '4';
        if (type.includes('jeep')) return '5';
        if (type.includes('car')) return '4';
        if (type.includes('three') || type.includes('wheeler')) return '3';
        return '4';
    };

    return (
        <div className="p-8 overflow-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Vehicle Hire</h3>
                    <p className="text-sm text-slate-500">Search for available vehicles for your dates</p>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            required
                            min={today}
                            value={searchParams.vb_date}
                            onChange={(e) => setSearchParams({ ...searchParams, vb_date: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Number of Days</label>
                        <input
                            type="number"
                            required
                            min="1"
                            max="30"
                            value={searchParams.vb_days}
                            onChange={(e) => setSearchParams({ ...searchParams, vb_days: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                            {loading ? 'Searching...' : 'Search Vehicles'}
                        </button>
                    </div>
                </form>
            </div>

            {hasSearched && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {vehicles.length > 0 ? (
                        vehicles.map((vehicle) => (
                            <div key={vehicle.vehicle_id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-slate-900 text-lg">{vehicle.vehicle_type}</h4>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                        Available
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4 text-sm text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">🚗</span>
                                        <span>{vehicle.vehicle_number}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">👥</span>
                                        <span>{getPassengerCount(vehicle.vehicle_type)} passengers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500">💰</span>
                                        <span>Per Day: <span className="font-semibold text-blue-600">Rs. {vehicle.vehicle_price_per_day}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                                        <span className="font-bold text-slate-900">Total Est:</span>
                                        <span className="font-bold text-green-600">Rs. {vehicle.vehicle_price_per_day * searchParams.vb_days}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRequestHire(vehicle)}
                                    disabled={requesting === vehicle.vehicle_id}
                                    className="w-full py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {requesting === vehicle.vehicle_id ? 'Sending Request...' : 'Request Hire'}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
                            <p className="text-slate-500">No vehicles available for the selected dates.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VehicleHire;
