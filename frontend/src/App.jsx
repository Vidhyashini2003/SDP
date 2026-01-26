import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar'; // Import Sidebar
import ProtectedRoute from './components/ProtectedRoute';
import { HomeIcon, BuildingOfficeIcon, TicketIcon, CurrencyDollarIcon, ExclamationCircleIcon, TruckIcon, ClipboardDocumentListIcon, CakeIcon, ClockIcon } from '@heroicons/react/24/outline';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ActivateAccount from './pages/auth/ActivateAccount';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Guest Pages
import GuestDashboard from './pages/guest/Dashboard';
import GuestBookings from './pages/guest/Bookings'; // Import GuestBookings
import RoomBooking from './pages/guest/RoomBooking';
import Profile from './pages/guest/Profile';
import ActivityBooking from './pages/guest/ActivityBooking';
import FoodOrders from './pages/guest/FoodOrders';
import VehicleHire from './pages/guest/VehicleHire';
import Notifications from './pages/guest/Notifications';

// Staff Pages
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import StaffManagement from './pages/admin/StaffManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import ReceptionistBookings from './pages/receptionist/Bookings';
import ReceptionistActivities from './pages/receptionist/Activities';
import ReceptionistRefunds from './pages/receptionist/Refunds';
import ReceptionistDamages from './pages/receptionist/Damages';
import VehicleAvailability from './pages/receptionist/VehicleAvailability';
import DriverDashboard from './pages/driver/Dashboard';
import DriverTrips from './pages/driver/Trips';
import DriverRefunds from './pages/driver/Refunds';
import DriverHireRequests from './pages/driver/HireRequests';

import KitchenDashboard from './pages/kitchen/Dashboard';
import KitchenOrders from './pages/kitchen/Orders';
import KitchenMenu from './pages/kitchen/Menu';
import KitchenDamages from './pages/kitchen/Damages';
import KitchenHistory from './pages/kitchen/History';
import StaffProfile from './pages/common/StaffProfile';
import ChangePassword from './pages/common/ChangePassword';

// Layouts
const PublicLayout = () => (
    <Outlet />
);

import GuestLayoutComponent from './components/GuestLayout';

const GuestLayout = () => (
    <GuestLayoutComponent>
        <Outlet />
    </GuestLayoutComponent>
);

const DashboardLayout = ({ items }) => (
    <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Sidebar items={items} />
        <div className="md:ml-64 pt-20 px-6"> {/* Offset for sidebar and fixed header */}
            <Outlet />
        </div>
    </div>
);

const adminItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Staff Management', path: '/admin/staff' },
    { name: 'Customer Management', path: '/admin/customers' },
    { name: 'Reports', path: '/admin/reports' },
    // more items...
];

const receptionistItems = [
    { name: 'Dashboard', path: '/receptionist/dashboard', icon: HomeIcon },
    { name: 'Manage Bookings', path: '/receptionist/bookings', icon: BuildingOfficeIcon },
    { name: 'Activity Bookings', path: '/receptionist/activities', icon: TicketIcon },
    { name: 'Vehicle Availability', path: '/receptionist/vehicles', icon: TruckIcon },
    { name: 'Refund Requests', path: '/receptionist/refunds', icon: CurrencyDollarIcon },
    { name: 'Damages', path: '/receptionist/damages', icon: ExclamationCircleIcon },
];

const driverItems = [
    { name: 'Dashboard', path: '/driver/dashboard', icon: HomeIcon },
    { name: 'Hire Requests', path: '/driver/requests', icon: ClipboardDocumentListIcon },
    { name: 'My Trips', path: '/driver/trips', icon: TruckIcon },
    { name: 'Refund Requests', path: '/driver/refunds', icon: CurrencyDollarIcon },
];

const kitchenItems = [
    { name: 'Dashboard', path: '/kitchen/dashboard', icon: HomeIcon },
    { name: 'Orders', path: '/kitchen/orders', icon: ClipboardDocumentListIcon },
    { name: 'Menu Management', path: '/kitchen/menu', icon: CakeIcon },
    { name: 'Damages', path: '/kitchen/damages', icon: ExclamationCircleIcon },
    { name: 'Order History', path: '/kitchen/history', icon: ClockIcon },
];

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/activate-account" element={<ActivateAccount />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                    </Route>

                    {/* Guest Routes */}
                    <Route path="/guest" element={
                        <ProtectedRoute allowedRoles={['guest']}>
                            <GuestLayout />
                        </ProtectedRoute>
                    }>
                        <Route path="bookings" element={<GuestDashboard />} />
                        <Route path="my-bookings" element={<GuestBookings />} />
                        <Route path="booking-history" element={<GuestBookings />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="change-password" element={<ChangePassword />} />
                        <Route path="rooms" element={<RoomBooking />} />
                        <Route path="activities" element={<ActivityBooking />} />
                        <Route path="food-orders" element={<FoodOrders />} />
                        <Route path="vehicle-hire" element={<VehicleHire />} />
                        <Route path="notifications" element={<Notifications />} />
                        <Route index element={<Navigate to="my-bookings" replace />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <DashboardLayout items={adminItems} />
                        </ProtectedRoute>
                    }>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="staff" element={<StaffManagement />} />
                        <Route path="customers" element={<CustomerManagement />} /> {/* Added Route */}
                        <Route path="profile" element={<StaffProfile />} />
                        <Route path="change-password" element={<ChangePassword />} />
                        <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>

                    {/* Receptionist Routes */}
                    <Route path="/receptionist" element={
                        <ProtectedRoute allowedRoles={['receptionist', 'admin']}> {/* Admin often has access */}
                            <DashboardLayout items={receptionistItems} />
                        </ProtectedRoute>
                    }>
                        <Route path="dashboard" element={<ReceptionistDashboard />} />
                        <Route path="bookings" element={<ReceptionistBookings />} />
                        <Route path="activities" element={<ReceptionistActivities />} />
                        <Route path="vehicles" element={<VehicleAvailability />} />
                        <Route path="refunds" element={<ReceptionistRefunds />} />
                        <Route path="damages" element={<ReceptionistDamages />} />
                        <Route path="profile" element={<StaffProfile />} />
                        <Route path="change-password" element={<ChangePassword />} />
                        <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>

                    {/* Driver Routes */}
                    <Route path="/driver" element={
                        <ProtectedRoute allowedRoles={['driver', 'admin']}>
                            <DashboardLayout items={driverItems} />
                        </ProtectedRoute>
                    }>
                        <Route path="dashboard" element={<DriverDashboard />} />
                        <Route path="requests" element={<DriverHireRequests />} />
                        <Route path="trips" element={<DriverTrips />} />
                        <Route path="refunds" element={<DriverRefunds />} />
                        <Route path="profile" element={<StaffProfile />} />
                        <Route path="change-password" element={<ChangePassword />} />
                        <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>

                    {/* Kitchen Routes */}
                    <Route path="/kitchen" element={
                        <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
                            <DashboardLayout items={kitchenItems} />
                        </ProtectedRoute>
                    }>
                        <Route path="dashboard" element={<KitchenDashboard />} />
                        <Route path="orders" element={<KitchenOrders />} />
                        <Route path="menu" element={<KitchenMenu />} />
                        <Route path="damages" element={<KitchenDamages />} />
                        <Route path="history" element={<KitchenHistory />} />
                        <Route path="profile" element={<StaffProfile />} />
                        <Route path="change-password" element={<ChangePassword />} />
                        <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
