import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        // Redirect to login page but preserve the attempted URL
        // Since we have multiple login pages, we redirect to home for now 
        // or we could detect intended role path.
        // For simplicity, redirect to a generic welcome or based on path segment?
        // Let's redirect to landing/home which will have login links
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User authorized but not for this role
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;
