import React, { useState } from 'react';
import { FleetProvider } from './components/fleet/shared/FleetContext';
import FleetDashboard from './components/fleet/FleetDashboard';
import VehicleManagement from './components/fleet/VehicleManagement';
import DriverManagement from './components/fleet/DriverManagement';
import FleetAnalytics from './components/fleet/FleetAnalytics';
import ChargingManagement from './components/fleet/ChargingManagement';
import RouteManagement from './components/fleet/RouteManagement';
import FleetSettings from './components/fleet/FleetSettings';
import {
    Home, Car, Users, BarChart3, Zap, Route, Wrench,
    Settings, Menu, X
} from 'lucide-react';

/**
 * Main EV Fleet Management Application
 */
function FleetApp() {
    const [activeView, setActiveView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const navigation = [
        { id: 'dashboard', name: 'Mission Control', icon: Home },
        { id: 'vehicles', name: 'Vehicles', icon: Car },
        { id: 'drivers', name: 'Drivers', icon: Users },
        { id: 'analytics', name: 'Analytics', icon: BarChart3 },
        { id: 'charging', name: 'Charging', icon: Zap },
        { id: 'routes', name: 'Routes', icon: Route },
        { id: 'maintenance', name: 'Maintenance', icon: Wrench },
        { id: 'settings', name: 'Settings', icon: Settings },
    ];

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <FleetDashboard />;
            case 'vehicles':
                return <VehicleManagement />;
            case 'drivers':
                return <DriverManagement />;
            case 'analytics':
                return <FleetAnalytics />;
            case 'charging':
                return <ChargingManagement />;
            case 'routes':
                return <RouteManagement />;
            case 'settings':
                return <FleetSettings />;
            default:
                return (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">{activeView} Module</h2>
                            <p className="text-slate-400">Coming soon...</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <FleetProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex">
                {/* Sidebar */}
                <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900/50 border-r border-white/5 transition-all duration-300 flex flex-col`}>
                    {/* Logo */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        {sidebarOpen && (
                            <div>
                                <h1 className="text-xl font-bold text-white">BatteryForge</h1>
                                <p className="text-xs text-slate-400">EV Fleet Monitor</p>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            {sidebarOpen ? <X className="w-5 h-5 text-slate-400" /> : <Menu className="w-5 h-5 text-slate-400" />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeView === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    title={!sidebarOpen ? item.name : ''}
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    {sidebarOpen && <span className="font-medium">{item.name}</span>}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            {sidebarOpen && <span>System Online</span>}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-6">
                        {renderView()}
                    </div>
                </main>
            </div>
        </FleetProvider>
    );
}

export default FleetApp;
