import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReceptionistDashboard from '../Dashboard';
import axios from '../../../config/axios';
import { useAuth } from '../../../context/AuthContext';

// Mock axios
vi.mock('../../../config/axios', () => {
    return {
        default: {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
        }
    };
});

const mockUser = {
    user_id: 1,
    name: 'Test Receptionist',
    role: 'receptionist',
    email: 'receptionist@test.com'
};

vi.mock('../../../context/AuthContext', () => ({
    useAuth: vi.fn(() => ({ user: mockUser }))
}));

const renderWithContext = (component) => {
    return render(component);
};

describe('ReceptionistDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
        renderWithContext(<ReceptionistDashboard />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('fetches and displays dashboard statistics correctly', async () => {
        // Setup mock responses for the 5 API calls
        axios.get.mockImplementation((url) => {
            if (url === '/api/receptionist/dashboard') {
                return Promise.resolve({
                    data: {
                        activeRoomBookings: 12,
                        activeActivityBookings: 5,
                        activeVehicleBookings: 3,
                        totalGuests: 20
                    }
                });
            }
            return Promise.resolve({ data: [] }); // Default empty array for others
        });

        renderWithContext(<ReceptionistDashboard />);

        // Wait for the loading to finish and stats to render
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Check if the welcome message includes the user's name
        expect(screen.getByText(/Welcome back, Test Receptionist/)).toBeInTheDocument();

        // Check if the stats are rendered correctly
        expect(screen.getByText('12')).toBeInTheDocument(); // Room Bookings
        expect(screen.getByText('5')).toBeInTheDocument();  // Activities
        expect(screen.getByText('3')).toBeInTheDocument();  // Vehicles
        expect(screen.getByText('20')).toBeInTheDocument(); // Total Guests
    });

    it('handles API errors gracefully', async () => {
        // Mock a failed API call
        axios.get.mockRejectedValue(new Error('Network Error'));

        renderWithContext(<ReceptionistDashboard />);

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Even on error, the dashboard should render with default/empty state
        expect(screen.getByText('Front Desk Dashboard')).toBeInTheDocument();
        
        // Since stats failed, they should be undefined/empty, meaning '0' shouldn't appear by default unless handled
        // In the current component, it just leaves them blank if undefined
    });
});
