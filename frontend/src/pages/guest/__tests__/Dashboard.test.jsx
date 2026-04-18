import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GuestDashboard from '../Dashboard';
import axios from '../../../config/axios';

// Mock axios
vi.mock('../../../config/axios');

const mockBookings = {
    rooms: [{ rb_id: 1, check_in_date: '2026-05-01T10:00:00Z', room_type: 'Deluxe', rb_status: 'Confirmed' }],
    activities: [{ ab_id: 1, booking_date: '2026-05-02T14:00:00Z', activity_name: 'Scuba Diving', ab_status: 'Pending' }],
    vehicles: []
};

const mockOrders = [
    { order_id: 1, order_date: '2026-05-01T18:00:00Z', items: [{}], order_status: 'Delivered' }
];

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('GuestDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        axios.get.mockImplementation(() => new Promise(() => {}));
        renderWithRouter(<GuestDashboard />);
        // Checking for the spinner class since there's no text "Loading"
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('fetches and displays dashboard data correctly', async () => {
        axios.get.mockImplementation((url) => {
            if (url === '/api/guest/bookings/active') {
                return Promise.resolve({ data: { hasActiveBooking: true, bookings: [{ room_number: '101' }] } });
            }
            if (url === '/api/guest/bookings') {
                return Promise.resolve({ data: mockBookings });
            }
            if (url === '/api/guest/orders') {
                return Promise.resolve({ data: mockOrders });
            }
            return Promise.resolve({ data: [] });
        });

        renderWithRouter(<GuestDashboard />);

        await waitFor(() => {
            expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
        });

        // Check Header
        expect(screen.getByText(/Ready for your next adventure\?/)).toBeInTheDocument();

        // Check Stats values
        expect(screen.getByText('3')).toBeInTheDocument(); // Total (1 room + 1 activity + 1 order)
        expect(screen.getAllByText('1').length).toBeGreaterThan(0); // Room, Activity, Order

        // Check Recent Activity
        expect(screen.getByText('Deluxe')).toBeInTheDocument();
        expect(screen.getByText('Scuba Diving')).toBeInTheDocument();
        expect(screen.getByText('1 Items')).toBeInTheDocument();

        // Check Active Booking banner
        expect(screen.getByText('Active Stay Detected')).toBeInTheDocument();
        expect(screen.getByText(/You are currently staying in Room 101/)).toBeInTheDocument();
    });

    it('displays "No activity found" when there are no bookings', async () => {
        axios.get.mockImplementation((url) => {
            if (url === '/api/guest/bookings/active') return Promise.resolve({ data: { hasActiveBooking: false } });
            if (url === '/api/guest/bookings') return Promise.resolve({ data: { rooms: [], activities: [], vehicles: [] } });
            if (url === '/api/guest/orders') return Promise.resolve({ data: [] });
            return Promise.resolve({ data: {} });
        });

        renderWithRouter(<GuestDashboard />);

        await waitFor(() => {
            expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
        });

        expect(screen.getByText(/No activity found/i)).toBeInTheDocument();
    });
});
