import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const DriverHireRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('/api/driver/requests');
            setRequests(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching requests:', error);
            setLoading(false);
        }
    };

    const handleAccept = async (id) => {
        if (!confirm('Are you sure you want to accept this trip?')) return;

        try {
            await axios.post(`/api/driver/requests/${id}/accept`);
            toast.success('Trip accepted! Waiting for guest payment.');
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error('Error accepting trip:', error);
            toast.error(error.response?.data?.error || 'Failed to accept trip');
        }
    };

    if (loading) return <div className="p-8">Loading requests...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">New Hire Requests</h1>

            <div className="grid grid-cols-1 gap-4">
                {requests.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg shadow-sm text-center border border-slate-200">
                        <p className="text-slate-500 text-lg">No pending hire requests available.</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.vb_id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase tracking-wide">
                                        Pending Approval
                                    </span>
                                    <span className="text-sm text-slate-400 font-mono">#{req.vb_id}</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase font-semibold">Date</p>
                                        <p className="font-medium text-slate-900">{new Date(req.vb_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase font-semibold">Duration</p>
                                        <p className="font-medium text-slate-900">{req.vb_days} Days</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase font-semibold">Guest</p>
                                        <p className="font-medium text-slate-900">{req.guest_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs uppercase font-semibold">Earnings</p>
                                        <p className="font-medium text-green-600">Rs. {req.vb_days * req.vehicle_price_per_day}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                                    <span>🚗</span>
                                    <span className="font-medium">{req.vehicle_number}</span>
                                    <span className="text-slate-400">|</span>
                                    <span>{req.vehicle_type}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleAccept(req.vb_id)}
                                className="w-full md:w-auto px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                            >
                                Accept Request
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DriverHireRequests;
