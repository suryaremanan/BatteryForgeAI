import React, { useState } from 'react';
import { useFleet } from './shared/FleetContext';
import {
    Search, Filter, Download, Plus, Battery,
    Thermometer, MapPin, User, Calendar
} from 'lucide-react';

/**
 * Vehicle Management - Detailed list view of all vehicles
 */
const VehicleManagement = () => {
    const { vehicles, drivers } = useFleet();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // Filter vehicles
    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const styles = {
            charging: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
            idle: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
            moving: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
            maintenance: 'bg-red-500/20 text-red-300 border-red-500/50'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    const getDriverName = (driverId) => {
        const driver = drivers.find(d => d.id === driverId);
        return driver ? driver.fullName : 'Unassigned';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Vehicle Management</h1>
                    <p className="text-slate-400 mt-1">Monitor and manage your entire fleet</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Vehicle
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-slate-900/40 rounded-xl p-4 border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, model, or plate..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="charging">Charging</option>
                            <option value="idle">Idle</option>
                            <option value="moving">Moving</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                    <div className="text-center p-2 bg-slate-950/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{filteredVehicles.length}</div>
                        <div className="text-xs text-slate-400">Total</div>
                    </div>
                    <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">
                            {filteredVehicles.filter(v => v.status === 'charging').length}
                        </div>
                        <div className="text-xs text-blue-400">Charging</div>
                    </div>
                    <div className="text-center p-2 bg-emerald-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-300">
                            {filteredVehicles.filter(v => v.status === 'moving').length}
                        </div>
                        <div className="text-xs text-emerald-400">Moving</div>
                    </div>
                    <div className="text-center p-2 bg-slate-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-slate-300">
                            {filteredVehicles.filter(v => v.status === 'idle').length}
                        </div>
                        <div className="text-xs text-slate-400">Idle</div>
                    </div>
                    <div className="text-center p-2 bg-red-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-red-300">
                            {filteredVehicles.filter(v => v.status === 'maintenance').length}
                        </div>
                        <div className="text-xs text-red-400">Maintenance</div>
                    </div>
                </div>
            </div>

            {/* Vehicle Table */}
            <div className="bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-950/50 border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Model</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Plate</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Battery</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Temp</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Distance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredVehicles.map((vehicle) => (
                                <tr
                                    key={vehicle.id}
                                    onClick={() => setSelectedVehicle(vehicle)}
                                    className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm font-mono font-semibold text-white">{vehicle.id}</td>
                                    <td className="px-4 py-3 text-sm text-slate-300">{vehicle.model}</td>
                                    <td className="px-4 py-3 text-sm font-mono text-slate-400">{vehicle.licensePlate}</td>
                                    <td className="px-4 py-3">{getStatusBadge(vehicle.status)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Battery className={`w-4 h-4 ${vehicle.currentSOC < 20 ? 'text-red-400' :
                                                    vehicle.currentSOC < 50 ? 'text-amber-400' :
                                                        'text-emerald-400'
                                                }`} />
                                            <span className="text-sm text-white font-medium">{vehicle.currentSOC}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Thermometer className={`w-4 h-4 ${vehicle.temperature > 45 ? 'text-red-400' :
                                                    vehicle.temperature > 38 ? 'text-amber-400' :
                                                        'text-slate-400'
                                                }`} />
                                            <span className="text-sm text-white">{vehicle.temperature}°C</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                        {getDriverName(vehicle.assignedDriver) || 'Unassigned'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                        {(vehicle.odometer / 1000).toFixed(1)} km
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredVehicles.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-400">No vehicles found matching your filters</p>
                    </div>
                )}
            </div>

            {/* Vehicle Detail Modal */}
            {selectedVehicle && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedVehicle(null)}>
                    <div className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{selectedVehicle.id}</h2>
                                <p className="text-slate-400">{selectedVehicle.model}</p>
                            </div>
                            <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/50 rounded-lg p-4">
                                <div className="text-xs text-slate-400 uppercase mb-1">License Plate</div>
                                <div className="text-lg font-mono text-white">{selectedVehicle.licensePlate}</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                                <div className="text-xs text-slate-400 uppercase mb-1">Status</div>
                                {getStatusBadge(selectedVehicle.status)}
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                                <div className="text-xs text-slate-400 uppercase mb-1">Battery SOC</div>
                                <div className="text-lg font-bold text-white">{selectedVehicle.currentSOC}%</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                                <div className="text-xs text-slate-400 uppercase mb-1">Battery SOH</div>
                                <div className="text-lg font-bold text-white">{selectedVehicle.currentSOH}%</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                                <div className="text-xs text-slate-400 uppercase mb-1">Temperature</div>
                                <div className="text-lg font-bold text-white">{selectedVehicle.temperature}°C</div>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-4">
                                <div className="text-xs text-slate-400 uppercase mb-1">Odometer</div>
                                <div className="text-lg font-bold text-white">{(selectedVehicle.odometer / 1000).toFixed(1)} km</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleManagement;
