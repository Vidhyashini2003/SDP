import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar'; // Import Sidebar
import ProtectedRoute from './components/ProtectedRoute';
import { HomeIcon, BuildingOfficeIcon, TicketIcon, CurrencyDollarIcon, ExclamationCircleIcon, TruckIcon, ClipboardDocumentListIcon, CakeIcon, ClockIcon, BellIcon, UserIcon, UserPlusIcon } from '@heroicons/react/24/outline';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ActivateAccount from './pages/auth/ActivateAccount';
import CheckEmail from './pages/auth/CheckEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Guest Pages
import GuestDashboard from './pages/guest/Dashboard';
import GuestBookings from './pages/guest/Bookings'; // Import GuestBookings
import RoomBooking from './pages/guest/RoomBooking';
import Profile from './pages/guest/Profile';
import ActivityBooking from './pages/guest/ActivityBooking';
import FoodOrders from './pages/guest/FoodOrders';
import QuickRide from './pages/guest/QuickRide';
import VehicleHire from './pages/guest/VehicleHire';
import Notifications from './pages/guest/Notifications';
import ExtendRoomBooking from './pages/guest/ExtendRoomBooking';

// Staff Pages
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import StaffManagement from './pages/admin/StaffManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import AdminReports from './pages/admin/Reports';
import ReceptionistBookings from './pages/receptionist/Bookings';
import ReceptionistActivities from './pages/receptionist/Activities';
import ReceptionistRefunds from './pages/receptionist/Refunds';
import ReceptionistDamages from './pages/receptionist/Damages';
import ManageAvailability from './pages/receptionist/ManageAvailability';
import WalkInBooking from './pages/receptionist/WalkInBooking';
import DriverDashboard from './pages/driver/Dashboard';
import DriverTrips from './pages/driver/Trips';
import DriverRefunds from './pages/driver/Refunds';
import DriverHireRequests from './pages/driver/HireRequests';

import ChefDashboard from './pages/chef/Dashboard';
import ChefOrders from './pages/chef/Orders';
import ChefMenu from './pages/chef/Menu';
import ChefDamages from './pages/chef/Damages';
import ChefHistory from './pages/chef/History';
import StaffProfile from './pages/common/StaffProfile';
import ChangePassword from './pages/common/ChangePassword';
import CommonNotifications from './pages/common/Notifications';
import ResourceManagement from './pages/common/ResourceManagement';

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
    { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
    { name: 'Staff Management', path: '/admin/staff', icon: ClipboardDocumentListIcon },
    { name: 'Customer Management', path: '/admin/customers', icon: UserIcon },
    { name: 'Manage Availability', path: '/admin/availability', icon: TruckIcon },
    { name: 'Resource Management', path: '/admin/resources', icon: BuildingOfficeIcon },
    { name: 'Reports', path: '/admin/reports', icon: ClipboardDocumentListIcon },
    { name: 'Notifications', path: '/admin/notifications', icon: BellIcon }, // Added
];

const receptionistItems = [
    { name: 'Dashboard', path: '/receptionist/dashboard', icon: HomeIcon },
    { name: 'Manage Bookings', path: '/receptionist/bookings', icon: BuildingOfficeIcon },
    { name: 'Walk-in Booking', path: '/receptionist/walkin', icon: UserPlusIcon },
    { name: 'Activity Bookings', path: '/receptionist/activities', icon: TicketIcon },
    { name: 'Manage Availability', path: '/receptionist/availability', icon: TruckIcon },
    { name: 'Resource Management', path: '/receptionist/resources', icon: BuildingOfficeIcon },
    { name: 'Refund Requests', path: '/receptionist/refunds', icon: CurrencyDollarIcon },
    { name: 'Damages', path: '/receptionist/damages', icon: ExclamationCircleIcon },
    { name: 'Notifications', path: '/receptionist/notifications', icon: BellIcon },
];

const driverItems = [
    { name: 'Dashboard', path: '/driver/dashboard', icon: HomeIcon },
    { name: 'Hire Requests', path: '/driver/requests', icon: ClipboardDocumentListIcon },
    { name: 'My Trips', path: '/driver/trips', icon: TruckIcon },
    { name: 'Refund Requests', path: '/driver/refunds', icon: CurrencyDollarIcon },
    { name: 'Notifications', path: '/driver/notifications', icon: BellIcon }, // Added
];

const chefItems = [
    { name: 'Dashboard', path: '/chef/dashboard', icon: HomeIcon },
    { name: 'Orders', path: '/chef/orders', icon: ClipboardDocumentListIcon },
    { name: 'Menu Management', path: '/chef/menu', icon: CakeIcon },
    { name: 'Damages', path: '/chef/damages', icon: ExclamationCircleIcon },
    { name: 'Order History', path: '/chef/history', icon: ClockIcon },
    { name: 'Notifications', path: '/chef/notifications', icon: BellIcon },
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
                        <Route path="/check-email" element={<CheckEmail />} />
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
                        <Route path="quick-ride" element={<QuickRide />} />
                        <Route path="vehicle-hire" element={<VehicleHire />} />
                        <Route path="extend-room" element={<ExtendRoomBooking />} />
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
                        <Route path="customers" element={<CustomerManagement />} />
                        <Route path="availability" element={<ManageAvailability />} />
                        <Route path="resources" element={<ResourceManagement />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="notifications" element={<CommonNotifications />} /> {/* Added */}
                        <Route path="profile" element={<StaffProfile />} />
                        <Route path="change-password" element={<ChangePassword />} />
                        <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>

                    {/* Receptionist Routes */}
                    <Route path="/receptionist" element={
                        <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                            <DashboardLayout items={receptionistItems} />
                        </ProtectedRoute>
                    }>
                        <Route path="dashboard" element={<ReceptionistDashboard />} />
                        <Route path="bookings" element={<ReceptionistBookings />} />
                        <Route path="walkin" element={<WalkInBooking />} />
                        <Route path="activities" element={<ReceptionistActivities />} />
                        <Route path="availability" element={<ManageAvailability />} />
                        <Route path="resources" element={<ResourceManagement />} />
                        <Route path="refunds" element={<ReceptionistRefunds />} />
                        <Route path="damages" element={<ReceptionistDamages />} />
                        <Route path="notifications" element={<CommonNotifications />} />
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
                        <Route path="notifications" element={<CommonNotifications />} /> {/* Added */}
                        <Route path="profile" element={<StaffProfile />} />
                        <Route path="change-password" element={<ChangePassword />} />
                        <Route index element={<Navigate to="dashboard" replace />} />
                    </Route>

                    {/* Chef Routes */}
                    <Route path="/chef" element={
                        <ProtectedRoute allowedRoles={['chef', 'admin']}>
                            <DashboardLayout items={chefItems} />
                        </ProtectedRoute>
                    }>
                        <Route path="dashboard" element={<ChefDashboard />} />
                        <Route path="orders" element={<ChefOrders />} />
                        <Route path="menu" element={<ChefMenu />} />
                        <Route path="damages" element={<ChefDamages />} />
                        <Route path="history" element={<ChefHistory />} />
                        <Route path="notifications" element={<CommonNotifications />} />
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
