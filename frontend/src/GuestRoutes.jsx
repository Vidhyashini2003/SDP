import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Outlet } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Import Guest Pages
import GuestDashboard from './pages/guest/Dashboard';
import RoomBooking from './pages/guest/RoomBooking';
// ... import other guest pages as needed

// ... existing code ...

const GuestLayout = () => (
    <div className="min-h-screen bg-slate-50">
        <Navbar />
        {/* Guest Sidebar could be added here if needed, but nav is usually enough for guests */}
        <Outlet />
    </div>
);

// ... inside App component routes ...
/*
<Route path="/guest" element={<ProtectedRoute allowedRoles={['guest']}><GuestLayout /></ProtectedRoute>}>
    <Route path="bookings" element={<GuestDashboard />} />
    <Route path="rooms" element={<RoomBooking />} />
    <Route index element={<Navigate to="bookings" replace />} />
</Route>
*/
