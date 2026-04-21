/**
 * context/AuthContext.jsx — Global Authentication State
 *
 * Purpose:
 *   Provides authentication state and helper functions to every component
 *   in the app via React Context — no need to pass user/token as props.
 *
 * What it stores:
 *   - user: { id, name, email, role } — the currently logged-in user
 *   - loading: boolean — true while restoring session from localStorage on first load
 *
 * Functions exposed to components via useAuth():
 *   - login(role, email, password) — Calls the backend login API, stores the JWT token and user info
 *   - logout()                     — Clears token from localStorage and resets user state
 *   - registerGuest(data)          — Registers a new guest account
 *   - updateUser(updatedFields)    — Updates the local user object (e.g. after profile edit)
 *
 * Token storage:
 *   The JWT token is stored in localStorage so the user stays logged in across page refreshes.
 *   On every app load, AuthContext reads the token from localStorage and sets the Axios
 *   Authorization header so all API requests automatically include "Authorization: Bearer <token>".
 *
 * Usage:
 *   import { useAuth } from '../context/AuthContext';
 *   const { user, login, logout } = useAuth();
 */

import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../config/axios';

// Create the context object that will be shared throughout the app
const AuthContext = createContext();

// Custom hook — lets any component access auth state with: const { user, login } = useAuth()
export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider wraps the entire app (in main.jsx) so all child components
 * can access authentication state via useAuth().
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);       // Currently logged-in user object, or null if not logged in
    const [loading, setLoading] = useState(true); // Prevents rendering until we've restored session from storage

    // ─── Restore session on first app load ───────────────────────────────────
    // When the page loads (or refreshes), read the token and user from localStorage.
    // This keeps the user logged in without requiring them to log in again.
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Auto-migrate legacy role names stored in old localStorage values
            // (e.g. 'kitchen' → 'chef' — standardized naming after early dev)
            if (parsedUser.role === 'kitchen' || parsedUser.role === 'chief') {
                parsedUser.role = 'chef';
                localStorage.setItem('user', JSON.stringify(parsedUser));
            }
            setUser(parsedUser);
            // Set the Authorization header so all future Axios requests include the token
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false); // Session restoration complete — allow the app to render
    }, []); // Empty dependency array → only runs once on mount

    // ─── Login ───────────────────────────────────────────────────────────────
    /**
     * Sends credentials to the backend. On success, stores the JWT token in localStorage
     * and sets the user state. The role param is kept for backward compatibility but
     * the backend now detects the role automatically from the user's email.
     */
    const login = async (role, email, password) => { // Role param kept for compatibility but ignored by backend/new frontend
        try {
            // Unified login endpoint handles role detection
            const response = await axios.post('/api/auth/login', {
                email,
                password
            });

            const { token, user } = response.data;

            // Persist token and user so they survive page refreshes
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Auto-attach the token to every future API request
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    // ─── Guest Registration ───────────────────────────────────────────────────
    /**
     * Registers a new guest account. The backend creates Users + Guest records
     * and sends an activation email. The frontend redirects to /check-email.
     */
    const registerGuest = async (data) => {
        try {
            const response = await axios.post('/api/auth/guest/register', data);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ ...user, role: 'guest' }));

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser({ ...user, role: 'guest' });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        }
    }

    // ─── Logout ───────────────────────────────────────────────────────────────
    /**
     * Clears all auth data from localStorage and Axios headers.
     * Sets user back to null, causing ProtectedRoute to redirect to home.
     */
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    // ─── Update User (local only) ─────────────────────────────────────────────
    /**
     * Merges updatedFields into the current user object and persists to localStorage.
     * Used after a profile update so the navbar/UI reflects the new name/email immediately
     * without needing a full re-login.
     */
    const updateUser = (updatedFields) => {
        const newUser = { ...user, ...updatedFields };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        // Provide user state and all auth functions to every child component
        <AuthContext.Provider value={{ user, login, logout, registerGuest, updateUser, loading }}>
            {/* Don't render children until we've finished restoring the session (avoids flash of wrong content) */}
            {!loading && children}
        </AuthContext.Provider>
    );
};
