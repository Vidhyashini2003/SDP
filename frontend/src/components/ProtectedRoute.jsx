/**
 * components/ProtectedRoute.jsx — Role-Based Route Guard
 *
 * Purpose:
 *   Wraps any route that should only be accessible to authenticated users
 *   (or users with a specific role). Acts as a security gate in the React Router tree.
 *
 * How it works:
 *   1. Reads the current user from AuthContext (which is set from localStorage on load).
 *   2. If there is NO logged-in user → redirects to the home page ("/").
 *   3. If the user IS logged in but their role is NOT in allowedRoles → redirects to "/unauthorized".
 *   4. If the user is logged in AND has the correct role → renders the child route/component.
 *
 * Usage in App.jsx:
 *   <ProtectedRoute allowedRoles={['guest']}>
 *       <GuestLayout />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
 *       <DashboardLayout items={receptionistItems} />
 *   </ProtectedRoute>
 *
 * Props:
 *   - children: The component/layout to render when access is granted
 *   - allowedRoles: Array of role strings allowed to see this route (e.g. ['guest'], ['admin'])
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();           // Get the current logged-in user from AuthContext
    const location = useLocation();       // Used to remember what page the user was trying to visit

    // ── Guard 1: Not logged in ─────────────────────────────────────────────
    if (!user) {
        // Redirect to login page but preserve the attempted URL
        // Since we have multiple login pages, we redirect to home for now 
        // or we could detect intended role path.
        // For simplicity, redirect to a generic welcome or based on path segment?
        // Let's redirect to landing/home which will have login links
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // ── Guard 2: Wrong role ─────────────────────────────────────────────────
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User is logged in but their role is not permitted for this route
        // (e.g. a 'driver' trying to access /admin/dashboard)
        return <Navigate to="/unauthorized" replace />;
    }

    // ── Access granted ──────────────────────────────────────────────────────
    // User is authenticated and has the correct role → render the protected content
    return children;
};

export default ProtectedRoute;
