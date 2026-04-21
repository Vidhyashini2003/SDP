/**
 * App.jsx — Root Application Component & Client-Side Router
 *
 * This file is the central hub of the frontend. It defines ALL routes for every
 * user role using React Router v6 nested routes.
 *
 * Architecture:
 *   - BrowserRouter: Enables URL-based navigation (using the browser history API)
 *   - AuthProvider: Wraps everything so all components can access the logged-in user
 *   - ProtectedRoute: Guards role-specific route trees; redirects unauthenticated users
 *
 * Layouts:
 *   - PublicLayout:    No header/sidebar. Used for Home, Login, Register, etc.
 *   - GuestLayout:     Full-screen guest UI with a custom sidebar (from GuestLayout.jsx)
 *   - DashboardLayout: Top navbar + collapsible sidebar (used for all staff roles)
 *
 * Role → Route Prefix mapping:
 *   - guest       → /guest/*        (GuestLayout)
 *   - admin       → /admin/*        (DashboardLayout + adminItems sidebar)
 *   - receptionist → /receptionist/* (DashboardLayout + receptionistItems sidebar)
 *   - driver      → /driver/*       (DashboardLayout + driverItems sidebar)
 *   - chef        → /chef/*         (DashboardLayout + chefItems sidebar)
 *
 * Sidebar items:
 *   Each role has a pre-defined array (e.g. adminItems, receptionistItems) that is
 *   passed to the Sidebar component to generate the left-side navigation links.
 *   Each item has: { name, path, icon }.
 */

import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar'; // Import Sidebar
import ProtectedRoute from './components/ProtectedRoute';
import { HomeIcon, BuildingOfficeIcon, TicketIcon, CurrencyDollarIcon, ExclamationCircleIcon, TruckIcon, ClipboardDocumentListIcon, CakeIcon, ClockIcon, BellIcon, UserIcon, UserPlusIcon } from '@heroicons/react/24/outline';

// ─────────────────────────────────────────────
// PUBLIC PAGE IMPORTS (no login required)
// ─────────────────────────────────────────────
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ActivateAccount from './pages/auth/ActivateAccount';
import CheckEmail from './pages/auth/CheckEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// ─────────────────────────────────────────────
// GUEST PAGE IMPORTS
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// STAFF PAGE IMPORTS
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// LAYOUTS
// ─────────────────────────────────────────────

/**
 * PublicLayout — Simple wrapper with no navigation.
 * Used for pages accessible without logging in (Home, Login, Register, etc.)
 * <Outlet /> renders whichever child route matched the current URL.
 */
const PublicLayout = () => (
    <Outlet />
);

import GuestLayoutComponent from './components/GuestLayout';

/**
 * GuestLayout — Wraps the guest portal pages inside the custom GuestLayout UI.
 * GuestLayout.jsx provides the guest-specific sidebar and header.
 */
const GuestLayout = () => (
    <GuestLayoutComponent>
        <Outlet />
    </GuestLayoutComponent>
);

/**
 * DashboardLayout — Used by all staff roles (admin, receptionist, driver, chef).
 * Renders:
 *  - Navbar: Fixed top bar with user info and logout
 *  - Sidebar: Left navigation with role-specific links (passed via `items` prop)
 *  - Content Area: The matched child route page, offset for the sidebar and navbar
 */
const DashboardLayout = ({ items }) => (
    <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Sidebar items={items} />
        <div className="md:ml-64 pt-20 px-6"> {/* Offset for sidebar and fixed header */}
            <Outlet />
        </div>
    </div>
);

// ─────────────────────────────────────────────
// SIDEBAR NAVIGATION ITEMS (per role)
// Each item: { name: string, path: string, icon: HeroIcon }
// ─────────────────────────────────────────────

/** Admin sidebar: dashboard, staff, customers, availability, resources, reports, notifications */
const adminItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
    { name: 'Staff Management', path: '/admin/staff', icon: ClipboardDocumentListIcon },
    { name: 'Customer Management', path: '/admin/customers', icon: UserIcon },
    { name: 'Manage Availability', path: '/admin/availability', icon: TruckIcon },
    { name: 'Resource Management', path: '/admin/resources', icon: BuildingOfficeIcon },
    { name: 'Reports', path: '/admin/reports', icon: ClipboardDocumentListIcon },
    { name: 'Notifications', path: '/admin/notifications', icon: BellIcon }, // Added
];

/** Receptionist sidebar: dashboard, bookings, walk-in, activities, availability, resources, refunds, damages, notifications */
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

/** Driver sidebar: dashboard, hire requests, trips, refunds, notifications */
const driverItems = [
    { name: 'Dashboard', path: '/driver/dashboard', icon: HomeIcon },
    { name: 'Hire Requests', path: '/driver/requests', icon: ClipboardDocumentListIcon },
    { name: 'My Trips', path: '/driver/trips', icon: TruckIcon },
    { name: 'Refund Requests', path: '/driver/refunds', icon: CurrencyDollarIcon },
    { name: 'Notifications', path: '/driver/notifications', icon: BellIcon }, // Added
];

/** Chef sidebar: dashboard, orders, menu management, damages, order history, notifications */
const chefItems = [
    { name: 'Dashboard', path: '/chef/dashboard', icon: HomeIcon },
    { name: 'Orders', path: '/chef/orders', icon: ClipboardDocumentListIcon },
    { name: 'Menu Management', path: '/chef/menu', icon: CakeIcon },
    { name: 'Damages', path: '/chef/damages', icon: ExclamationCircleIcon },
    { name: 'Order History', path: '/chef/history', icon: ClockIcon },
    { name: 'Notifications', path: '/chef/notifications', icon: BellIcon },
];


// ─────────────────────────────────────────────
// ROOT APP COMPONENT
// ─────────────────────────────────────────────

function App() {
    return (
        <BrowserRouter>
            {/* AuthProvider makes the logged-in user available everywhere via useAuth() */}
            <AuthProvider>
                <Routes>

                    {/* ── PUBLIC ROUTES ─────────────────────────────────────── */}
                    {/* Accessible without login (Home, Login, Register, Password reset) */}
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/check-email" element={<CheckEmail />} />
                        <Route path="/activate-account" element={<ActivateAccount />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                    </Route>

                    {/* ── GUEST ROUTES (/guest/*) ────────────────────────────── */}
                    {/* Only accessible to users with role = 'guest' */}
                    <Route path="/guest" element={
                        <ProtectedRoute allowedRoles={['guest']}>
                            <GuestLayout />
                        </ProtectedRoute>
                    }>
                        <Route path="bookings" element={<GuestDashboard />} />         {/* Booking wizard */}
                        <Route path="my-bookings" element={<GuestBookings />} />       {/* View all bookings */}
                        <Route path="booking-history" element={<GuestBookings />} />   {/* Same view — alias */}
                        <Route path="profile" element={<Profile />} />
                        <Route path="change-password" element={<ChangePassword />} />
                        <Route path="rooms" element={<RoomBooking />} />
                        <Route path="activities" element={<ActivityBooking />} />
                        <Route path="food-orders" element={<FoodOrders />} />
                        <Route path="quick-ride" element={<QuickRide />} />
                        <Route path="vehicle-hire" element={<VehicleHire />} />
                        <Route path="extend-room" element={<ExtendRoomBooking />} />
                        <Route path="notifications" element={<Notifications />} />
                        <Route index element={<Navigate to="my-bookings" replace />} /> {/* Default: redirect to my bookings */}
                    </Route>

                    {/* ── ADMIN ROUTES (/admin/*) ────────────────────────────── */}
                    {/* Only accessible to users with role = 'admin' */}
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

                    {/* ── RECEPTIONIST ROUTES (/receptionist/*) ─────────────── */}
                    {/* Accessible by 'receptionist' OR 'admin' (admin can view all portals) */}
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

                    {/* ── DRIVER ROUTES (/driver/*) ──────────────────────────── */}
                    {/* Accessible by 'driver' OR 'admin' */}
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

                    {/* ── CHEF ROUTES (/chef/*) ──────────────────────────────── */}
                    {/* Accessible by 'chef' OR 'admin' */}
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
