import { useState, useEffect } from 'react';
import axios from '../../config/axios';

// Status badge
const StatusBadge = ({ status }) => {
    const styles = {
        Pending:      'bg-amber-100 text-amber-800 border border-amber-300',
        Acknowledged: 'bg-blue-100 text-blue-800 border border-blue-300',
        Resolved:     'bg-green-100 text-green-800 border border-green-300',
    };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {status}
        </span>
    );
};

const fmt = (iso) =>
    iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const SpecialRequests = () => {
    const [requests, setRequests]     = useState([]);
    const [bookings, setBookings]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');

    const [newNote, setNewNote] = useState('');
    const [newRbId, setNewRbId] = useState('');

    const [editingId, setEditingId] = useState(null);
    const [editNote, setEditNote]   = useState('');

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchRequests = async () => {
        try {
            const res = await axios.get('/api/guest/requests');
            setRequests(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load requests');
        }
    };

    const fetchActiveBookings = async () => {
        try {
            const res = await axios.get('/api/guest/bookings/active');
            const bks = res.data.bookings || [];
            setBookings(bks);
            if (bks.length > 0) setNewRbId(String(bks[0].rb_id));
        } catch { /* non-fatal */ }
    };

    useEffect(() => {
        Promise.all([fetchRequests(), fetchActiveBookings()]).finally(() => setLoading(false));
    }, []);

    const flash = (msg, isError = false) => {
        isError ? setError(msg) : setSuccess(msg);
        if (!isError) setError('');
        if (isError)  setSuccess('');
        setTimeout(() => { setError(''); setSuccess(''); }, 3500);
    };

    // ── CREATE ───────────────────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newRbId)        return flash('Please select a room booking.', true);
        if (!newNote.trim()) return flash('Request note cannot be empty.', true);
        setSubmitting(true);
        try {
            await axios.post('/api/guest/requests', { rb_id: Number(newRbId), request_note: newNote.trim() });
            flash('Special request submitted!');
            setNewNote('');
            fetchRequests();
        } catch (err) {
            flash(err.response?.data?.error || 'Failed to submit request.', true);
        } finally {
            setSubmitting(false);
        }
    };

    // ── UPDATE ───────────────────────────────────────────────────────────────
    const handleUpdate = async (id) => {
        if (!editNote.trim()) return flash('Note cannot be empty.', true);
        setSubmitting(true);
        try {
            await axios.put(`/api/guest/requests/${id}`, { request_note: editNote.trim() });
            flash('Request updated!');
            setEditingId(null);
            fetchRequests();
        } catch (err) {
            flash(err.response?.data?.error || 'Failed to update request.', true);
        } finally {
            setSubmitting(false);
        }
    };

    // ── DELETE ───────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this request?')) return;
        try {
            await axios.delete(`/api/guest/requests/${id}`);
            flash('Request deleted.');
            fetchRequests();
        } catch (err) {
            flash(err.response?.data?.error || 'Failed to delete request.', true);
        }
    };

    // ── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="p-8 overflow-auto">

            {/* Page Title */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Special Requests</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Submit notes for your stay — extra pillows, dietary needs, late check-out, etc.
                </p>
            </div>

            {/* Flash Messages */}
            {error   && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

            {/* ── Create Form ──────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 max-w-3xl">
                <h4 className="text-base font-bold text-slate-800 mb-4">New Request</h4>

                <form onSubmit={handleCreate} className="space-y-4">
                    {/* Booking selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Room Booking</label>
                        {bookings.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">
                                No active room bookings found. You must have a current booking to submit a request.
                            </p>
                        ) : (
                            <select
                                id="sr-booking-select"
                                value={newRbId}
                                onChange={(e) => setNewRbId(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none text-sm"
                            >
                                {bookings.map((b) => (
                                    <option key={b.rb_id} value={b.rb_id}>
                                        Booking #{b.rb_id} — {b.room_type}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Note textarea */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Your Request</label>
                        <textarea
                            id="sr-note-input"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="e.g. Please provide extra towels and a vegetarian meal option."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none text-sm resize-none"
                        />
                        <p className="text-xs text-slate-400 text-right mt-0.5">{newNote.length}/500</p>
                    </div>

                    <button
                        id="sr-submit-btn"
                        type="submit"
                        disabled={submitting || bookings.length === 0}
                        className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {submitting ? 'Submitting…' : 'Submit Request'}
                    </button>
                </form>
            </div>

            {/* ── Request List ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl">
                <h4 className="text-base font-bold text-slate-800 mb-4">My Requests</h4>

                {loading ? (
                    <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
                ) : requests.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-3xl mb-2">🗒️</p>
                        <p className="text-slate-500 text-sm">No special requests yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((req) => (
                            <div
                                key={req.request_id}
                                className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Booking #{req.rb_id} · {req.room_type}, Room {req.room_number}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Submitted: {fmt(req.created_at)}
                                            {req.updated_at !== req.created_at && ` · Edited: ${fmt(req.updated_at)}`}
                                        </p>
                                    </div>
                                    <StatusBadge status={req.status} />
                                </div>

                                {/* Note or edit inline */}
                                {editingId === req.request_id ? (
                                    <div className="mt-3 space-y-2">
                                        <textarea
                                            id={`sr-edit-${req.request_id}`}
                                            value={editNote}
                                            onChange={(e) => setEditNote(e.target.value)}
                                            rows={3}
                                            maxLength={500}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none text-sm resize-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                id={`sr-save-${req.request_id}`}
                                                onClick={() => handleUpdate(req.request_id)}
                                                disabled={submitting}
                                                className="px-4 py-1.5 bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                Save
                                            </button>
                                            <button
                                                id={`sr-cancel-edit-${req.request_id}`}
                                                onClick={() => { setEditingId(null); setEditNote(''); }}
                                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {req.request_note}
                                    </p>
                                )}

                                {/* Edit / Delete — only for Pending */}
                                {req.status === 'Pending' && editingId !== req.request_id && (
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            id={`sr-edit-btn-${req.request_id}`}
                                            onClick={() => { setEditingId(req.request_id); setEditNote(req.request_note); }}
                                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            id={`sr-delete-btn-${req.request_id}`}
                                            onClick={() => handleDelete(req.request_id)}
                                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                )}

                                {/* Locked note for acknowledged / resolved */}
                                {req.status !== 'Pending' && (
                                    <p className="mt-2 text-xs text-slate-400 italic">
                                        This request has been {req.status.toLowerCase()} by staff and can no longer be edited.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpecialRequests;
