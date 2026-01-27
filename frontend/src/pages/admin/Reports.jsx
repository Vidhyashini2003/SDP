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

    useEffect(() => {
        fetchReport();
    }, [activeTab, startDate, endDate, type, role]);

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
                                <option value="admin">Admin</option>
                                <option value="receptionist">Receptionist</option>
                                <option value="driver">Driver</option>
                                <option value="kitchen">Kitchen Staff</option>
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
                                    <tr key={idx} className="hover:bg-slate-50">
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
        </div>
    );
};

export default Reports;
