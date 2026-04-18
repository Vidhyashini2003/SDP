import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import ReceptionistDamages from '../Damages';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Mock axios and toast
vi.mock('axios');
vi.mock('react-hot-toast', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    }
}));

const mockDamages = [
    {
        damage_id: 1,
        report_date: '2026-04-12T09:57:00Z',
        guest_name: 'John Doe',
        guest_phone: '1234567890',
        damage_type: 'Room',
        room_id: 101,
        description: 'Broken window',
        charge_amount: 5000,
        status: 'Pending'
    }
];

const mockGuests = [
    { guest_id: 1, guest_name: 'John Doe', guest_phone: '1234567890', type: 'registered' },
    { guest_id: 2, guest_name: 'Jane Smith', type: 'walkin' }
];

describe('ReceptionistDamages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup local storage mock for token
        Storage.prototype.getItem = vi.fn(() => 'fake-token');
    });

    it('renders loading state initially', () => {
        axios.get.mockImplementation(() => new Promise(() => {}));
        render(<ReceptionistDamages />);
        expect(screen.getByText('Loading damage reports...')).toBeInTheDocument();
    });

    it('fetches and displays damages and populates guest dropdown', async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/receptionist/damages')) return Promise.resolve({ data: mockDamages });
            if (url.includes('/api/receptionist/guests')) return Promise.resolve({ data: mockGuests });
            return Promise.resolve({ data: [] });
        });

        render(<ReceptionistDamages />);

        await waitFor(() => {
            expect(screen.queryByText('Loading damage reports...')).not.toBeInTheDocument();
        });

        // Check damage list rendering
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Broken window')).toBeInTheDocument();
        expect(screen.getByText('Rs. 5,000')).toBeInTheDocument();

        // Check guest dropdown population
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /John Doe \(1234567890\)/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Jane Smith \[Walk-in\]/i })).toBeInTheDocument();
    });

    it('shows error toast when trying to submit without guest', async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/receptionist/damages')) return Promise.resolve({ data: mockDamages });
            if (url.includes('/api/receptionist/guests')) return Promise.resolve({ data: mockGuests });
            return Promise.resolve({ data: [] });
        });

        render(<ReceptionistDamages />);
        await waitFor(() => expect(screen.queryByText('Loading damage reports...')).not.toBeInTheDocument());

        // Use fireEvent.submit on the form directly to bypass native HTML5 required validation in JSDOM
        const submitButton = screen.getByRole('button', { name: /Submit & Notify Guest/i });
        fireEvent.submit(submitButton.closest('form'));

        expect(toast.error).toHaveBeenCalledWith('Please select a guest');
    });
});
