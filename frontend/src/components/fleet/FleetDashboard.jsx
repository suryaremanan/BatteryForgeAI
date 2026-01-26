import React from 'react';
import { useFleet } from './shared/FleetContext';
import MetricCard from './shared/MetricCard';
import VehicleCard from './shared/VehicleCard';
import {
    Activity, Zap, Route, Battery, Thermometer,
    AlertTriangle, TrendingUp, Users, MapPin
} from 'lucide-react';

/**
 * Main Dashboard - Mission Control for Fleet Monitoring
 */
const FleetDashboard = () => {
    const { vehicles, getFleetSummary } = useFleet();
    const summary = getFleetSummary();

    // Critical vehicles (high temp or low battery)
    const criticalVehicles = vehicles.filter(v =>
        v.temperature > 45 || v.currentSOC < 20 || v.status === 'maintenance'
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Mission Control</h1>
                    <p className="text-slate-400 mt-1">Real-time EV fleet monitoring dashboard</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400">Last Updated</div>
                    <div className="text-white font-mono">{new Date().toLocaleTimeString()}</div>
                </div>
            </div>

            {/* Critical Alerts Banner */}
            {criticalVehicles.length > 0 && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-300">
                                {criticalVehicles.length} Vehicle{criticalVehicles.length > 1 ? 's' : ''} Require Attention
                            </h3>
                            <p className="text-sm text-red-400">
                                {criticalVehicles.map(v => v.id).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Vehicles"
                    value={summary.totalVehicles}
                    icon={Activity}
                    color="blue"
                    subtitle={`${summary.activeVehicles} active`}
                />

                <MetricCard
                    title="Total Distance"
                    value={(summary.totalDistance / 1000).toFixed(1)}
                    unit="K km"
                    icon={Route}
                    color="green"
                    trend="up"
                    trendValue="+12.3%"
                />

                <MetricCard
                    title="Energy Consumed"
                    value={summary.totalEnergy.toFixed(0)}
                    unit="kWh"
                    icon={Zap}
                    color="amber"
                    trend="neutral"
                    trendValue="+3.1%"
                />

                <MetricCard
                    title="Avg Temperature"
                    value={summary.avgTemperature}
                    unit="°C"
                    icon={Thermometer}
                    color={summary.avgTemperature > 40 ? 'red' : 'purple'}
                />
            </div>

            {/* Live Status Breakdown */}
            <div className="bg-slate-900/40 rounded-xl p-6 border border-white/5">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Live Fleet Status
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Charging */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                        <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white">{summary.statusBreakdown.charging}</div>
                        <div className="text-sm text-blue-300 uppercase tracking-wider">Charging</div>
                    </div>

                    {/* Idle */}
                    <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-4 text-center">
                        <Battery className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white">{summary.statusBreakdown.idle}</div>
                        <div className="text-sm text-slate-300 uppercase tracking-wider">Idle</div>
                    </div>

                    {/* Moving */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
                        <MapPin className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white">{summary.statusBreakdown.moving}</div>
                        <div className="text-sm text-emerald-300 uppercase tracking-wider">On Move</div>
                    </div>

                    {/* Maintenance */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white">{summary.statusBreakdown.maintenance}</div>
                        <div className="text-sm text-red-300 uppercase tracking-wider">Maintenance</div>
                    </div>
                </div>
            </div>

            {/* Critical Vehicles Section */}
            {criticalVehicles.length > 0 && (
                <div className="bg-slate-900/40 rounded-xl p-6 border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        Vehicles Requiring Attention
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {criticalVehicles.slice(0, 8).map(vehicle => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onClick={(v) => console.log('Vehicle clicked:', v.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="bg-slate-900/40 rounded-xl p-6 border border-white/5">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Fleet Activity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {vehicles.slice(0, 20).map(vehicle => (
                        <VehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            onClick={(v) => console.log('Vehicle clicked:', v.id)}
                        />
                    ))}
                </div>

                {vehicles.length > 20 && (
                    <div className="mt-4 text-center">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                            View All {vehicles.length} Vehicles
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FleetDashboard;
