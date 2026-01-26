import React, { useState, useEffect, useRef } from 'react';
import {
    Navigation,
    Map as MapIcon,
    Clock,
    Calendar,
    Search,
    Plus,
    CheckCircle2
} from 'lucide-react';
import { useFleet } from './shared/FleetContext';
import MetricCard from './shared/MetricCard';

const RouteManagement = () => {
    const { routes } = useFleet();
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const routeLayerRef = useRef(null);

    const filteredRoutes = routes.filter(route =>
        route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeRoutes = routes.filter(r => r.status === 'active').length;
    const completedRoutes = routes.filter(r => r.status === 'completed').length;
    const scheduledRoutes = routes.filter(r => r.status === 'scheduled').length;

    // Initialize Map
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            if (!window.L) return;

            const map = window.L.map(mapContainerRef.current).setView([37.7749, -122.4194], 11);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            mapRef.current = map;
        }

        return () => {
            // We don't necessarily need to destroy the map on unmount for this component as it's not tab-switched, but good practice
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update Route on Map
    useEffect(() => {
        if (mapRef.current && window.L) {
            // Clear existing route layer
            if (routeLayerRef.current) {
                routeLayerRef.current.remove();
                routeLayerRef.current = null;
            }

            // Remove any individual markers if we added them separately (not in group) - simplified for now
            mapRef.current.eachLayer((layer) => {
                if (layer instanceof window.L.Marker || layer instanceof window.L.Polyline) {
                    // Keep tile layer? Tile layer doesn't instance check easily this way usually
                    // Better: use a LayerGroup
                }
            });

            // Re-add selected route
            if (selectedRoute) {
                const group = window.L.featureGroup();

                // Start Marker
                const startMarker = window.L.marker([selectedRoute.startLocation.lat, selectedRoute.startLocation.lng])
                    .bindPopup(`Start: ${selectedRoute.name}`)
                    .addTo(group);

                // End Marker
                const endMarker = window.L.marker([selectedRoute.endLocation.lat, selectedRoute.endLocation.lng])
                    .bindPopup(`End Destination`)
                    .addTo(group);

                // Polyline
                const latlngs = [
                    [selectedRoute.startLocation.lat, selectedRoute.startLocation.lng],
                    ...selectedRoute.waypoints.map(w => [w.lat, w.lng]),
                    [selectedRoute.endLocation.lat, selectedRoute.endLocation.lng]
                ];

                window.L.polyline(latlngs, { color: '#3b82f6' }).addTo(group);

                group.addTo(mapRef.current);
                routeLayerRef.current = group;

                // Fit bounds
                mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
            } else {
                // Reset view if no route selected
                // mapRef.current.setView([37.7749, -122.4194], 11); 
            }
        }
    }, [selectedRoute]);

    // Handle resize
    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => {
                mapRef.current.invalidateSize();
            }, 100);
        }
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Navigation className="h-6 w-6 text-emerald-400" />
                        Route Management
                    </h2>
                    <p className="text-slate-400">Optimize fleet routes and track deliveries in real-time</p>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-md">
                    <Plus className="h-4 w-4" />
                    Create New Route
                </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Active Routes"
                    value={activeRoutes}
                    unit=""
                    icon={Navigation}
                    color="green"
                />
                <MetricCard
                    title="Scheduled"
                    value={scheduledRoutes}
                    unit=""
                    icon={Calendar}
                    color="blue"
                />
                <MetricCard
                    title="Completed Today"
                    value={completedRoutes}
                    unit=""
                    icon={CheckCircle2}
                    color="slate"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Route List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search routes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[600px]">
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {filteredRoutes.map(route => (
                                <div
                                    key={route.id}
                                    onClick={() => setSelectedRoute(route)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedRoute?.id === route.id
                                        ? 'bg-blue-900/20 border-blue-500/50'
                                        : 'bg-slate-700/30 border-slate-700 hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-slate-200 block truncate">{route.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${route.status === 'active' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                                            route.status === 'scheduled' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                                                'bg-slate-700 text-slate-300 border-slate-600'
                                            }`}>
                                            {route.status}
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-xs text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            <span>Est. {Math.round(route.estimatedDuration)} mins</span>
                                            <span className="text-slate-600">|</span>
                                            <span>{route.distance.toFixed(1)} miles</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapIcon className="h-3 w-3" />
                                            <span className="truncate w-48">Assigned: {route.assignedVehicle}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Map View */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden h-[600px] relative z-0">
                        {/* Vanilla Leaflet Map Container */}
                        <div
                            id="route-map"
                            ref={mapContainerRef}
                            style={{ height: "100%", width: "100%", zIndex: 0 }}
                        />

                        {!selectedRoute && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-[400] pointer-events-none">
                                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl text-center max-w-sm">
                                    <Navigation className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                                    <h3 className="text-lg font-bold text-white mb-1">Select a Route</h3>
                                    <p className="text-slate-400 text-sm">Choose a route from the list to view its path and details on the map.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouteManagement;
