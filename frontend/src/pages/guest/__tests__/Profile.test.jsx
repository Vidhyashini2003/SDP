import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import Profile from '../Profile';
import axios from '../../../config/axios';
import { useAuth } from '../../../context/AuthContext';

// Mock axios
vi.mock('../../../config/axios');

const mockProfileData = {
    first_name: 'John',
    last_name: 'Doe',
    guest_email: 'john@example.com',
    guest_phone: '1234567890',
    guest_nic_passport: 'NIC123456',
    nationality: 'American'
};

const mockUpdateUser = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
    useAuth: vi.fn(() => ({ updateUser: mockUpdateUser }))
}));

const renderWithContext = (component) => {
    return render(component);
};

describe('GuestProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.alert = vi.fn(); // Mock alert
    });

    it('fetches and displays profile data', async () => {
        axios.get.mockResolvedValue({ data: mockProfileData });

        renderWithContext(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('John')).toBeInTheDocument();
            expect(screen.getByText('Doe')).toBeInTheDocument();
            expect(screen.getByText('john@example.com')).toBeInTheDocument();
        });
    });

    it('allows editing and saving profile', async () => {
        axios.get.mockResolvedValue({ data: mockProfileData });
        axios.put.mockResolvedValue({ data: { message: 'Success' } });

        renderWithContext(<Profile />);

        // Wait for data to load
        await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());

        // Click Edit
        await userEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));

        // Change First Name
        const firstNameInput = screen.getByDisplayValue('John');
        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'Jane');

        // Save Changes
        await userEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

        // Check if PUT was called with new data
        expect(axios.put).toHaveBeenCalledWith('/api/guest/profile', expect.objectContaining({
            first_name: 'Jane',
            last_name: 'Doe'
        }));

        // Check if AuthContext was updated
        expect(mockUpdateUser).toHaveBeenCalledWith({
            name: 'Jane Doe',
            first_name: 'Jane',
            last_name: 'Doe'
        });

        // Check if alert was shown
        expect(window.alert).toHaveBeenCalledWith('Profile updated successfully!');
    });

    it('cancels editing', async () => {
        axios.get.mockResolvedValue({ data: mockProfileData });

        renderWithContext(<Profile />);

        await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());

        await userEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));

        const firstNameInput = screen.getByDisplayValue('John');
        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'Jane');

        // Cancel
        await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));

        // Should revert back to John (text element, not input anymore)
        expect(screen.queryByDisplayValue('Jane')).not.toBeInTheDocument();
        expect(screen.getByText('John')).toBeInTheDocument();
    });
});
