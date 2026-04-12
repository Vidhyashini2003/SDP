import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../config/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth from localStorage
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            const parsedUser = JSON.parse(storedUser);
            // Auto-migrate legacy role from localStorage
            if (parsedUser.role === 'kitchen' || parsedUser.role === 'chief') {
                parsedUser.role = 'chef';
                localStorage.setItem('user', JSON.stringify(parsedUser));
            }
            setUser(parsedUser);
            // Set default auth header for all future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (role, email, password) => { // Role param kept for compatibility but ignored by backend/new frontend
        try {
            // Unified login endpoint handles role detection
            const response = await axios.post('/api/auth/login', {
                email,
                password
            });

            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

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

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const updateUser = (updatedFields) => {
        const newUser = { ...user, ...updatedFields };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, registerGuest, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
