import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentArrowDownIcon, TableCellsIcon } from '@heroicons/react/24/outline';

const Reports = () => {
    // ... (state matches existing)
    const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'users'
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState('All'); // For Bookings
    const [role, setRole] = useState('All'); // For Users
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    // History Filters (Modal)
    const [hStartDate, setHStartDate] = useState('');
    const [hEndDate, setHEndDate] = useState('');
    const [hType, setHType] = useState('All');

    useEffect(() => {
        if (showHistoryModal && selectedUser) {
            fetchUserHistory(selectedUser);
        }
    }, [activeTab, startDate, endDate, type, role, hStartDate, hEndDate, hType]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = '';
            let params = {};

            if (activeTab === 'bookings') {
                url = '/api/reports/bookings';
                params = { startDate, endDate, type };
            } else {
                url = '/api/reports/users';
                params = { role };
            }

            const response = await axios.get(url, { params });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserHistory = async (user) => {
        setHistoryLoading(true);
        setSelectedUser(user);
        try {
            const res = await axios.get(`/api/reports/user-history/${user.user_id}`, {
                params: { startDate: hStartDate, endDate: hEndDate, type: hType }
            });
            setUserHistory(res.data);
        } catch (error) {
            console.error('Error fetching user history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const openHistoryModal = (user) => {
        setSelectedUser(user);
        setHStartDate('');
        setHEndDate('');
        setHType('All');
        setShowHistoryModal(true);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text('Janas Blue Water Corner - Admin Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        if (activeTab === 'bookings') {
            autoTable(doc, {
                startY: 30,
                head: [['Type', 'ID', 'Guest', 'Details', 'Date', 'Status', 'Amount']],
                body: data.map(row => [
                    row.type,
                    row.id,
                    row.guest_name,
                    row.service_details,
                    new Date(row.booking_date).toLocaleDateString(),
                    row.status,
                    row.amount ? `Rs. ${row.amount}` : '-'
                ]),
            });
        } else {
            autoTable(doc, {
                startY: 30,
                head: [['ID', 'Name', 'Email', 'Role', 'Joined Date']],
                body: data.map(row => [
                    row.user_id,
                    row.name,
                    row.email,
                    row.role,
                    new Date(row.created_at).toLocaleDateString()
                ]),
            });
        }
        doc.save(`${activeTab}_report.pdf`);
    };

    const downloadCSV = () => {
        if (data.length === 0) return;

        const headers = activeTab === 'bookings'
            ? ['Type', 'ID', 'Guest', 'Details', 'Date', 'Status', 'Amount']
            : ['ID', 'Name', 'Email', 'Role', 'Joined Date'];

        const rows = data.map(row => {
            if (activeTab === 'bookings') {
                return [
                    row.type, row.id, row.guest_name, `"${row.service_details}"`,
                    new Date(row.booking_date).toLocaleDateString(), row.status, row.amount
                ];
            } else {
                return [
                    row.user_id, row.name, row.email, row.role,
                    new Date(row.created_at).toLocaleDateString()
                ];
            }
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${activeTab}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadUserHistoryPDF = (user, history) => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`User History Report: ${user.name}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Email: ${user.email}`, 14, 22);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

        autoTable(doc, {
            startY: 35,
            head: [['Type', 'ID', 'Details', 'Date', 'Status', 'Amount']],
            body: history.map(row => [
                row.type,
                row.id,
                row.details,
                new Date(row.date).toLocaleDateString(),
                row.status,
                row.amount ? `Rs. ${row.amount}` : '-'
            ]),
        });
        doc.save(`${user.name.replace(/\s+/g, '_')}_history.pdf`);
    };

    const downloadUserHistoryCSV = (user, history) => {
        const headers = ['Type', 'ID', 'Details', 'Date', 'Status', 'Amount'];
        const rows = history.map(row => [
            row.type, row.id, `"${row.details}"`,
            new Date(row.date).toLocaleDateString(), row.status, row.amount || 0
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${user.name.replace(/\s+/g, '_')}_history.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Admin Reports</h1>
                <p className="text-slate-600">Generate and export system reports</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('bookings')}
                    className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'bookings' ? 'text-gold-600 border-b-2 border-gold-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Booking Reports
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'users' ? 'text-gold-600 border-b-2 border-gold-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    User Reports
                </button>
            </div>


            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end justify-between">
                <div className="flex flex-wrap gap-4">
                    {activeTab === 'bookings' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="All">All Types</option>
                                    <option value="Room">Rooms</option>
                                    <option value="Activity">Activities</option>
                                    <option value="Vehicle">Vehicles</option>
                                    <option value="Food">Food Orders</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border-slate-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border-slate-300 rounded-lg text-sm"
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="border-slate-300 rounded-lg text-sm"
                            >
                                <option value="All">All Roles</option>
                                <option value="guest">Guest</option>
                                <option value="receptionist">Receptionist</option>
                                <option value="driver">Driver</option>
                                <option value="chef">Chef</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                        <TableCellsIcon className="w-5 h-5" />
                        Export CSV
                    </button>
                    <button
                        onClick={downloadPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors text-sm font-medium"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600"></div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">No records found</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            {activeTab === 'bookings' ? (
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">ID</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Guest</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Details</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">ID</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Email</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Joined Date</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((row, idx) => (
                                activeTab === 'bookings' ? (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium">{row.type}</td>
                                        <td className="px-6 py-4 text-slate-500">#{row.id}</td>
                                        <td className="px-6 py-4">{row.guest_name}</td>
                                        <td className="px-6 py-4 text-slate-600">{row.service_details}</td>
                                        <td className="px-6 py-4">{new Date(row.booking_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                row.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {row.amount ? `Rs. ${row.amount}` : '-'}
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={idx} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => openHistoryModal(row)}>
                                        <td className="px-6 py-4 text-slate-500">#{row.user_id}</td>
                                        <td className="px-6 py-4 font-medium">{row.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{row.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                                                {row.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(row.created_at).toLocaleDateString()}</td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* User History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{selectedUser?.name}'s History</h2>
                                <p className="text-sm text-slate-500">{selectedUser?.email}</p>
                            </div>
                            <button 
                                onClick={() => setShowHistoryModal(false)}
                                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Toolbar */}
                        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex flex-wrap gap-2 items-center">
                                <select 
                                    value={hType} 
                                    onChange={(e) => setHType(e.target.value)}
                                    className="border-slate-300 rounded-lg text-xs"
                                >
                                    <option value="All">All Types</option>
                                    {selectedUser?.role === 'guest' ? (
                                        <>
                                            <option value="Room">Rooms</option>
                                            <option value="Activity">Activities</option>
                                            <option value="Vehicle">Vehicles</option>
                                            <option value="Food">Food Orders</option>
                                        </>
                                    ) : selectedUser?.role === 'driver' ? (
                                        <option value="Vehicle">Assignments</option>
                                    ) : (
                                        <option value="Food">Assignments</option>
                                    )}
                                </select>
                                <input 
                                    type="date" 
                                    value={hStartDate} 
                                    onChange={(e) => setHStartDate(e.target.value)} 
                                    className="border-slate-300 rounded-lg text-xs p-1"
                                />
                                <span className="text-slate-400 text-xs">to</span>
                                <input 
                                    type="date" 
                                    value={hEndDate} 
                                    onChange={(e) => setHEndDate(e.target.value)} 
                                    className="border-slate-300 rounded-lg text-xs p-1"
                                />
                            </div>
                            <div className="flex gap-2">
                             <button
                                onClick={() => downloadUserHistoryCSV(selectedUser, userHistory)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-semibold"
                            >
                                <TableCellsIcon className="w-4 h-4" />
                                Export CSV
                            </button>
                            <button
                                onClick={() => downloadUserHistoryPDF(selectedUser, userHistory)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors text-xs font-semibold"
                            >
                                <DocumentArrowDownIcon className="w-4 h-4" />
                                Export PDF
                            </button>
                        </div>
                    </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            {historyLoading ? (
                                <div className="py-12 flex flex-col items-center gap-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600"></div>
                                    <p className="text-sm text-slate-500 font-medium">Loading history...</p>
                                </div>
                            ) : userHistory.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <TableCellsIcon className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No history found for this user.</p>
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Type</th>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Details</th>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                                                <th className="px-4 py-3 font-semibold text-slate-700">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {userHistory.map((item, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-slate-800">{item.type}</td>
                                                    <td className="px-4 py-3 text-slate-600">{item.details}</td>
                                                    <td className="px-4 py-3 text-slate-500">{new Date(item.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            item.status === 'Confirmed' || item.status === 'Delivered' || item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                            item.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-900">
                                                        {item.amount ? `Rs. ${item.amount}` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
