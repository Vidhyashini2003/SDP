import { useAuth } from '../../context/AuthContext';
import RoomManagement from '../receptionist/RoomManagement';
import ActivityManagement from '../receptionist/ActivityManagement';
import VehicleManagement from '../receptionist/VehicleManagement';
import ChefMenu from '../chef/Menu';
import { useState } from 'react';
import { BuildingOffice2Icon, TicketIcon, TruckIcon, CakeIcon } from '@heroicons/react/24/outline';

const ResourceManagement = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('rooms');

    // Define tabs based on role
    const allTabs = [
        { id: 'rooms', label: 'Rooms', icon: BuildingOffice2Icon, component: <RoomManagement /> },
        { id: 'activities', label: 'Activities', icon: TicketIcon, component: <ActivityManagement /> },
        { id: 'vehicles', label: 'Vehicles', icon: TruckIcon, component: <VehicleManagement /> },
        { id: 'menu', label: 'Menu', icon: CakeIcon, component: <ChefMenu />, adminOnly: true },
    ];

    // Filter tabs: hide Menu for receptionists
    const tabs = allTabs.filter(tab => {
        if (tab.adminOnly && user?.role === 'receptionist') return false;
        return true;
    });

    const activeComponent = tabs.find(t => t.id === activeTab)?.component;

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Resource Management</h1>
                <p className="text-slate-500 mt-1">Manage rooms, activities, vehicles and menu items</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-px ${
                                activeTab === tab.id
                                    ? 'border-gold-500 text-gold-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>
                {activeComponent}
            </div>
        </div>
    );
};

export default ResourceManagement;
