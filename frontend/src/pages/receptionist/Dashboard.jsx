import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import Card from '../../components/Card';
import { toast } from 'react-hot-toast';

const ReceptionistDashboard = () => {
    const [stats, setStats] = useState({
        activeRoomBookings: 0,
        activeActivityBookings: 0,
        activeVehicleBookings: 0,
        totalGuests: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes] = await Promise.all([
                    axios.get('/api/receptionist/dashboard')
                ]);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Receptionist Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card title="Active Room Bookings" className="bg-blue-50 border-blue-100">
                    <p className="text-3xl font-bold text-blue-600">{stats.activeRoomBookings}</p>
                </Card>
                <Card title="Activity Reservations" className="bg-purple-50 border-purple-100">
                    <p className="text-3xl font-bold text-purple-600">{stats.activeActivityBookings}</p>
                </Card>
                <Card title="Vehicle Trips" className="bg-orange-50 border-orange-100">
                    <p className="text-3xl font-bold text-orange-600">{stats.activeVehicleBookings}</p>
                </Card>
                <Card title="Total Guests" className="bg-green-50 border-green-100">
                    <p className="text-3xl font-bold text-green-600">{stats.totalGuests}</p>
                </Card>
            </div>


        </div>
    );
};

export default ReceptionistDashboard;
