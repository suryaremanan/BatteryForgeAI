import React, { useState } from 'react';
import { useFleet } from './shared/FleetContext';
import {
    User, Phone, CreditCard, Car, Plus, Search,
    Award, TrendingUp, X
} from 'lucide-react';

/**
 * Driver Management - Roster and assignment management
 */
const DriverManagement = () => {
    const { drivers, vehicles, addDriver, assignDriverToVehicle } = useFleet();
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        licenseNumber: '',
        assignedVehicle: ''
    });

    const filteredDrivers = drivers.filter(d =>
        d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm) ||
        d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getVehicleInfo = (vehicleId) => {
        if (!vehicleId) return { model: 'Unassigned', id: '-' };
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle || { model: 'Unknown', id: vehicleId };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const newDriver = await addDriver(formData);

            if (formData.assignedVehicle) {
                await assignDriverToVehicle(newDriver.id, formData.assignedVehicle);
            }

            setShowAddModal(false);
            setFormData({ fullName: '', phone: '', licenseNumber: '', assignedVehicle: '' });
        } catch (error) {
            console.error('Error adding driver:', error);
            alert('Failed to add driver');
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 75) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Driver Management</h1>
                    <p className="text-slate-400 mt-1">Manage your driver roster and assignments</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Driver
                </button>
            </div>

            {/* Search and Stats */}
            <div className="bg-slate-900/40 rounded-xl p-4 border border-white/5">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search drivers by name, phone, or license..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-slate-950/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{drivers.length}</div>
                        <div className="text-xs text-slate-400">Total Drivers</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-300">
                            {drivers.filter(d => d.assignedVehicle).length}
                        </div>
                        <div className="text-xs text-emerald-400">Active</div>
                    </div>
                    <div className="text-center p-3 bg-slate-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-slate-300">
                            {drivers.filter(d => !d.assignedVehicle).length}
                        </div>
                        <div className="text-xs text-slate-400">Unassigned</div>
                    </div>
                    <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">
                            {(drivers.reduce((sum, d) => sum + d.safetyScore, 0) / drivers.length).toFixed(0)}
                        </div>
                        <div className="text-xs text-blue-400">Avg Safety</div>
                    </div>
                </div>
            </div>

            {/* Driver Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDrivers.map((driver) => {
                    const vehicleInfo = getVehicleInfo(driver.assignedVehicle);

                    return (
                        <div
                            key={driver.id}
                            className="bg-slate-900/40 rounded-xl border border-white/5 p-4 hover:border-emerald-500/30 transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <User className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{driver.fullName}</h3>
                                        <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    {driver.phone}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                    {driver.licenseNumber}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Car className="w-4 h-4 text-slate-400" />
                                    {vehicleInfo.id} {vehicleInfo.model && `(${vehicleInfo.model})`}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                                <div className="text-center p-2 bg-slate-950/50 rounded">
                                    <div className={`text-lg font-bold ${getScoreColor(driver.safetyScore)}`}>
                                        {driver.safetyScore}
                                    </div>
                                    <div className="text-xs text-slate-400">Safety</div>
                                </div>
                                <div className="text-center p-2 bg-slate-950/50 rounded">
                                    <div className={`text-lg font-bold ${getScoreColor(driver.efficiencyRating)}`}>
                                        {driver.efficiencyRating}
                                    </div>
                                    <div className="text-xs text-slate-400">Efficiency</div>
                                </div>
                            </div>

                            <div className="mt-3 text-xs text-slate-500 text-center">
                                {driver.totalTrips} trips completed
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredDrivers.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-400">No drivers found matching your search</p>
                </div>
            )}

            {/* Add Driver Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white">Add New Driver</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                                    placeholder="555-1234"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    License Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.licenseNumber}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                                    placeholder="DL-12345"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Assign Vehicle (Optional)
                                </label>
                                <select
                                    value={formData.assignedVehicle}
                                    onChange={(e) => setFormData({ ...formData, assignedVehicle: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                                >
                                    <option value="">No vehicle assigned</option>
                                    {vehicles.filter(v => !v.assignedDriver).map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.id} - {v.model}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    Add Driver
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverManagement;
