import { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-hot-toast';

const ManageAvailability = () => {
    const [activeTab, setActiveTab] = useState('vehicles');
    const [vehicles, setVehicles] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [activities, setActivities] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);
    const [resourceType, setResourceType] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');
    const [requiresReason, setRequiresReason] = useState(false);
    const [conflictCount, setConflictCount] = useState(0);

    useEffect(() => {
        // Detect if user is admin
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setIsAdmin(userData.role === 'admin');
        fetchAllData(userData.role === 'admin');
    }, []);

    const fetchAllData = async (adminUser = isAdmin) => {
        try {
            const promises = [
                axios.get('/api/receptionist/vehicles'),
                axios.get('/api/receptionist/rooms'),
                axios.get('/api/receptionist/activities')
            ];

            // If admin, also fetch menu items
            if (adminUser) {
                promises.push(axios.get('/api/admin/menu-items'));
            }

            const results = await Promise.all(promises);

            setVehicles(results[0].data);
            setRooms(results[1].data);
            setActivities(results[2].data);

            if (adminUser && results[3]) {
                setMenuItems(results[3].data);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleStatusClick = (resource, status, type) => {
        const currentStatus = type === 'vehicle' ? resource.vehicle_status :
            type === 'room' ? resource.room_status :
                type === 'activity' ? resource.activity_status :
                    resource.item_availability; // menu item

        if (currentStatus === status) return;

        setSelectedResource(resource);
        setResourceType(type);
        setNewStatus(status);
        setRequiresReason(false);
        setConflictCount(0);
        setCancellationReason('');
        setShowStatusModal(true);
    };

    const confirmStatusChange = async (forceWithReason = false) => {
        if (requiresReason && !cancellationReason) {
            toast.error('Please provide a cancellation reason.');
            return;
        }

        try {
            const payload = {
                status: newStatus,
                reason: forceWithReason ? cancellationReason : undefined
            };

            const id = resourceType === 'vehicle' ? selectedResource.vehicle_id :
                resourceType === 'room' ? selectedResource.room_id :
                    resourceType === 'activity' ? selectedResource.activity_id :
                        selectedResource.item_id; // menu item

            // Determine API endpoint
            let endpoint;
            if (resourceType === 'menuitem') {
                // Menu items use admin endpoint and don't have booking cancellation
                endpoint = `/api/admin/menu-items/${id}/status`;
            } else {
                // Properly pluralize resource type for URL
                const resourcePlural = resourceType === 'activity' ? 'activities' : `${resourceType}s`;
                endpoint = `/api/receptionist/${resourcePlural}/${id}/status`;
            }

            await axios.put(endpoint, payload);

            toast.success(`${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} status updated successfully`);
            setShowStatusModal(false);
            fetchAllData();
        } catch (error) {
            if (error.response?.data?.requiresConfirmation) {
                setRequiresReason(true);
                setConflictCount(error.response.data.activeBookingsCount);
                toast.error('Active bookings exist. Reason required to cancel them.');
            } else {
                console.error('Status update error:', error);
                toast.error('Failed to update status');
            }
        }
    };

    const getResourceName = (resource, type) => {
        if (type === 'vehicle') return resource.vehicle_number;
        if (type === 'room') return `Room ${resource.room_id} - ${resource.room_type}`;
        if (type === 'activity') return resource.activity_name;
        return resource.item_name; // menu item
    };

    const getResourceStatus = (resource, type) => {
        if (type === 'vehicle') return resource.vehicle_status;
        if (type === 'room') return resource.room_status;
        if (type === 'activity') return resource.activity_status;
        return resource.item_availability; // menu item
    };

    const renderResourceTable = (resources, type) => {
        const statusOptions = type === 'activity' || type === 'menuitem'
            ? ['Available', 'Unavailable']
            : ['Available', 'Maintenance'];

        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">
                                {type === 'vehicle' ? 'Vehicle' :
                                    type === 'room' ? 'Room' :
                                        type === 'activity' ? 'Activity' : 'Menu Item'}
                            </th>
                            {type === 'vehicle' && <th className="px-6 py-4 font-semibold text-slate-700">Type</th>}
                            {type === 'room' && <th className="px-6 py-4 font-semibold text-slate-700">Type</th>}
                            {type === 'room' && <th className="px-6 py-4 font-semibold text-slate-700">Price/Day</th>}
                            {type === 'activity' && <th className="px-6 py-4 font-semibold text-slate-700">Price/Hour</th>}
                            {type === 'menuitem' && <th className="px-6 py-4 font-semibold text-slate-700">Price</th>}
                            <th className="px-6 py-4 font-semibold text-slate-700">Current Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {resources.map((resource) => {
                            const status = getResourceStatus(resource, type);
                            const id = type === 'vehicle' ? resource.vehicle_id :
                                type === 'room' ? resource.room_id :
                                    type === 'activity' ? resource.activity_id :
                                        resource.item_id; // menu item

                            return (
                                <tr key={id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {getResourceName(resource, type)}
                                    </td>
                                    {type === 'vehicle' && <td className="px-6 py-4 text-slate-600">{resource.vehicle_type}</td>}
                                    {type === 'room' && <td className="px-6 py-4 text-slate-600">{resource.room_type}</td>}
                                    {type === 'room' && <td className="px-6 py-4 text-slate-600">LKR {resource.room_price_per_day}</td>}
                                    {type === 'activity' && <td className="px-6 py-4 text-slate-600">LKR {resource.activity_price_per_hour}</td>}
                                    {type === 'menuitem' && <td className="px-6 py-4 text-slate-600">LKR {resource.item_price}</td>}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                            ${status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' :
                                                status === 'Maintenance' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    status === 'Unavailable' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleStatusClick(resource, 'Available', type)}
                                                disabled={status === 'Available'}
                                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${status === 'Available'
                                                    ? 'bg-slate-100 text-slate-400 cursor-default'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                            >
                                                Mark Available
                                            </button>
                                            <button
                                                onClick={() => handleStatusClick(resource, statusOptions[1], type)}
                                                disabled={status === statusOptions[1]}
                                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${status === statusOptions[1]
                                                    ? 'bg-slate-100 text-slate-400 cursor-default'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                            >
                                                Mark {statusOptions[1]}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Manage Availability</h1>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'vehicles'
                        ? 'border-gold-600 text-gold-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                >
                    Vehicles ({vehicles.length})
                </button>
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'rooms'
                        ? 'border-gold-600 text-gold-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                >
                    Rooms ({rooms.length})
                </button>
                <button
                    onClick={() => setActiveTab('activities')}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'activities'
                        ? 'border-gold-600 text-gold-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                >
                    Activities ({activities.length})
                </button>
                {/* Menu Items tab - only for admin */}
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('menuitems')}
                        className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'menuitems'
                            ? 'border-gold-600 text-gold-600'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        Menu Items ({menuItems.length})
                    </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === 'vehicles' && renderResourceTable(vehicles, 'vehicle')}
            {activeTab === 'rooms' && renderResourceTable(rooms, 'room')}
            {activeTab === 'activities' && renderResourceTable(activities, 'activity')}
            {activeTab === 'menuitems' && renderResourceTable(menuItems, 'menuitem')}

            {/* Status Change Modal */}
            {showStatusModal && selectedResource && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            Set {getResourceName(selectedResource, resourceType)} to {newStatus}?
                        </h3>

                        {!requiresReason ? (
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to update the status?
                            </p>
                        ) : (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-800 font-medium mb-2">⚠️ Warning: {conflictCount} Active Booking(s)</p>
                                <p className="text-sm text-red-700 mb-4">
                                    Changing status to {newStatus} will <strong>CANCEL</strong> these future bookings automatically.
                                </p>
                                <label className="block text-sm font-medium text-red-900 mb-1">
                                    Reason for Cancellation (Required):
                                </label>
                                <input
                                    type="text"
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    placeholder="e.g. Equipment Breakdown, Renovations Required"
                                    className="w-full border-red-300 rounded focus:ring-red-500 focus:border-red-500 px-3 py-2"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmStatusChange(requiresReason)}
                                className={`px-4 py-2 text-white rounded-lg font-medium shadow-sm 
                                    ${requiresReason ? 'bg-red-600 hover:bg-red-700' : 'bg-gold-600 hover:bg-gold-700'}`}
                            >
                                {requiresReason ? 'Confirm Cancellation' : 'Update Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAvailability;
