import React, { useState, useEffect, useRef } from 'react';
import {
    Zap,
    Clock,
    MapPin,
    BatteryCharging,
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Filter
} from 'lucide-react';
import { useFleet } from './shared/FleetContext';
import MetricCard from './shared/MetricCard';

const ChargingManagement = () => {
    const { chargingStations: stations, scheduleCharging } = useFleet();
    const [activeTab, setActiveTab] = useState('map');
    const [selectedStation, setSelectedStation] = useState(null);
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const markersRef = useRef([]);

    // Filter stations based on status if needed
    const availableStations = stations.filter(s => s.status === 'Available').length;
    const chargingStations = stations.filter(s => s.status === 'Charging').length;
    const offlineStations = stations.filter(s => s.status === 'Offline').length;

    // Initialize Map
    useEffect(() => {
        if (activeTab === 'map' && mapContainerRef.current && !mapRef.current) {
            // Ensure L is available from CDN
            if (!window.L) return;

            const map = window.L.map(mapContainerRef.current).setView([37.7749, -122.4194], 12);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            mapRef.current = map;
        }

        // Cleanup map on unmount or tab change
        return () => {
            if (activeTab !== 'map' && mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markersRef.current = [];
            }
        };
    }, [activeTab]);

    // Update Markers
    useEffect(() => {
        if (activeTab === 'map' && mapRef.current && window.L) {
            // Clear existing markers
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            stations.forEach(station => {
                const marker = window.L.marker([station.location.lat, station.location.lng])
                    .addTo(mapRef.current)
                    .bindPopup(`
                        <div class="p-1">
                            <strong class="block mb-1">${station.name}</strong>
                            <span class="text-xs px-2 py-0.5 rounded-full ${station.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                ${station.status} - ${station.power}kW
                            </span>
                        </div>
                    `);

                // Add click handler to update React state
                marker.on('click', () => {
                    setSelectedStation(station);
                });

                markersRef.current.push(marker);
            });
        }
    }, [activeTab, stations]);

    // Handle initial map resize if container size changes (a common leaflet quirk)
    useEffect(() => {
        if (activeTab === 'map' && mapRef.current) {
            setTimeout(() => {
                mapRef.current.invalidateSize();
            }, 100);
        }
    }, [activeTab]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Zap className="h-6 w-6 text-yellow-400" />
                        Smart Charging Management
                    </h2>
                    <p className="text-slate-400">Monitor charging infrastructure and schedule sessions</p>
                </div>

                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'map'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            }`}
                    >
                        <MapPin className="h-4 w-4" /> Station Map
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'schedule'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            }`}
                    >
                        <Calendar className="h-4 w-4" /> Schedule
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Stations"
                    value={stations.length}
                    unit=""
                    icon={Zap}
                    color="blue"
                />
                <MetricCard
                    title="Available"
                    value={availableStations}
                    unit=""
                    icon={CheckCircle2}
                    color="green"
                />
                <MetricCard
                    title="In Use"
                    value={chargingStations}
                    unit=""
                    icon={BatteryCharging}
                    color="yellow"
                />
                <MetricCard
                    title="Offline"
                    value={offlineStations}
                    unit=""
                    icon={AlertTriangle}
                    trend={{ value: 1, direction: 'up', label: 'needs attention' }}
                    color="red"
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: List or Schedule */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-blue-400" />
                                Charging Stations
                            </h3>
                            <button className="text-slate-400 hover:text-white transition-colors">
                                <Filter className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {stations.map(station => (
                                <div
                                    key={station.id}
                                    onClick={() => setSelectedStation(station)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedStation?.id === station.id
                                        ? 'bg-blue-900/20 border-blue-500/50'
                                        : 'bg-slate-700/30 border-slate-700 hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-slate-200">{station.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${station.status === 'Available' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                                            station.status === 'Charging' ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' :
                                                'bg-red-900/30 text-red-400 border-red-500/30'
                                            }`}>
                                            {station.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Zap className="h-3 w-3" /> {station.power}kW
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {station.location.lat.toFixed(3)}, {station.location.lng.toFixed(3)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Map or Detailed View */}
                <div className="lg:col-span-2">
                    {activeTab === 'map' ? (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden h-[600px] relative z-0">
                            {/* Vanilla Leaflet Map Container */}
                            <div
                                id="map"
                                ref={mapContainerRef}
                                style={{ height: "100%", width: "100%", zIndex: 0 }}
                            />

                            {/* Overlay for selected station details */}
                            {selectedStation && (
                                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-xl z-[1000] flex justify-between items-center animate-in slide-in-from-bottom-2">
                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-1">{selectedStation.name}</h4>
                                        <p className="text-slate-400 text-sm flex items-center gap-4">
                                            <span>Status: <span className="text-white">{selectedStation.status}</span></span>
                                            <span>Power: <span className="text-white">{selectedStation.power}kW</span></span>
                                            <span>Connectors: <span className="text-white">CCS, Type 2</span></span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                                            Start Charging
                                        </button>
                                        <button
                                            onClick={() => setSelectedStation(null)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center h-[600px] text-center">
                            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                                <Calendar className="h-8 w-8 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Charging Schedule</h3>
                            <p className="text-slate-400 max-w-sm mb-6">
                                Manage automated charging schedules for the entire fleet. Optimize for off-peak energy rates.
                            </p>
                            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg max-w-md w-full">
                                <p className="text-blue-300 text-sm mb-3">
                                    <Zap className="h-4 w-4 inline-block mr-2" />
                                    <strong>AI Recommendation:</strong>
                                    Shift 15 scheduled sessions to 2:00 AM to save roughly $85.
                                </p>
                                <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors">
                                    Apply Optimization
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChargingManagement;
