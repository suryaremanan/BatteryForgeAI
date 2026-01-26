import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Fleet Context - Global state management for EV Fleet Monitor
 * Manages vehicles, drivers, routes, charging, and real-time updates
 */

const FleetContext = createContext(null);

export const useFleet = () => {
    const context = useContext(FleetContext);
    if (!context) {
        throw new Error('useFleet must be used within FleetProvider');
    }
    return context;
};

// Mock data generators (will be replaced with API calls)
const generateMockVehicles = (count = 50) => {
    const models = ['Tesla Model 3', 'Tesla Model Y', 'Rivian R1T', 'Ford F-150 Lightning', 'Chevy Bolt'];
    const statuses = ['charging', 'idle', 'moving', 'maintenance'];

    return Array.from({ length: count }, (_, i) => ({
        id: `EV-${String(i + 1).padStart(3, '0')}`,
        model: models[Math.floor(Math.random() * models.length)],
        licensePlate: `EV${Math.floor(Math.random() * 10000)}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        batteryCapacity: 75 + Math.floor(Math.random() * 25), // 75-100 kWh
        currentSOC: 20 + Math.floor(Math.random() * 80), // 20-100%
        currentSOH: 85 + Math.floor(Math.random() * 15), // 85-100%
        odometer: Math.floor(Math.random() * 100000), // 0-100k km
        assignedDriver: Math.random() > 0.3 ? `DR-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}` : null,
        location: {
            lat: 37.7749 + (Math.random() - 0.5) * 0.5,
            lng: -122.4194 + (Math.random() - 0.5) * 0.5
        },
        temperature: 20 + Math.floor(Math.random() * 30), // 20-50°C
        lastUpdate: new Date().toISOString()
    }));
};

const generateMockDrivers = (count = 30) => {
    const names = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Wilson', 'Chris Brown',
        'Jessica Lee', 'David Martinez', 'Lisa Anderson', 'James Taylor', 'Maria Garcia'];

    return Array.from({ length: count }, (_, i) => ({
        id: `DR-${String(i + 1).padStart(3, '0')}`,
        fullName: names[i % names.length] + ` ${i + 1}`,
        phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        licenseNumber: `DL-${Math.floor(Math.random() * 100000)}`,
        assignedVehicle: Math.random() > 0.3 ? `EV-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}` : null,
        safetyScore: 70 + Math.floor(Math.random() * 30), // 70-100
        efficiencyRating: 70 + Math.floor(Math.random() * 30),
        totalTrips: Math.floor(Math.random() * 500),
        joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
};

const generateMockChargingStations = (count = 10) => {
    return Array.from({ length: count }, (_, i) => ({
        id: `CS-${String(i + 1).padStart(3, '0')}`,
        name: `Charging Station ${i + 1}`,
        location: {
            lat: 37.7749 + (Math.random() - 0.5) * 0.5,
            lng: -122.4194 + (Math.random() - 0.5) * 0.5
        },
        status: Math.random() > 0.3 ? 'available' : 'in_use',
        totalPorts: 4,
        availablePorts: Math.floor(Math.random() * 4),
        powerOutput: 150, // kW
        cost: 0.35 // $/kWh
    }));
};

const generateMockRoutes = (count = 5) => {
    return Array.from({ length: count }, (_, i) => ({
        id: `RT-${String(i + 1).padStart(3, '0')}`,
        name: `Route ${i + 1} - Downtown to Airport`,
        status: ['active', 'completed', 'scheduled'][Math.floor(Math.random() * 3)],
        assignedVehicle: `EV-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
        startLocation: { lat: 37.7749, lng: -122.4194 },
        endLocation: { lat: 37.6213, lng: -122.3790 },
        distance: 15 + Math.random() * 20, // miles
        estimatedDuration: 30 + Math.random() * 45, // mins
        waypoints: [
            { lat: 37.7749, lng: -122.4194 },
            { lat: 37.70, lng: -122.40 },
            { lat: 37.6213, lng: -122.3790 }
        ]
    }));
};

export const FleetProvider = ({ children }) => {
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [chargingStations, setChargingStations] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [settings, setSettings] = useState({
        units: {
            distance: 'km',
            temperature: 'celsius',
            energy: 'kWh'
        },
        notifications: {
            email: true,
            sms: false,
            criticalBattery: true,
            maintenance: true
        },
        map: {
            provider: 'osm',
            defaultZoom: 10
        }
    });

    // Initialize mock data
    useEffect(() => {
        setVehicles(generateMockVehicles(50));
        setDrivers(generateMockDrivers(30));
        setDrivers(generateMockDrivers(30));
        setChargingStations(generateMockChargingStations(10));
        setRoutes(generateMockRoutes(8));
    }, []);

    // Real-time updates simulation (will be replaced with WebSocket)
    useEffect(() => {
        const interval = setInterval(() => {
            setVehicles(prev => prev.map(v => ({
                ...v,
                currentSOC: Math.max(10, Math.min(100, v.currentSOC + (Math.random() - 0.5) * 5)),
                temperature: Math.max(15, Math.min(55, v.temperature + (Math.random() - 0.5) * 2)),
                lastUpdate: new Date().toISOString()
            })));
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);

    // Fleet metrics
    const getFleetSummary = useCallback(() => {
        const statusCounts = vehicles.reduce((acc, v) => {
            acc[v.status] = (acc[v.status] || 0) + 1;
            return acc;
        }, {});

        const totalDistance = vehicles.reduce((sum, v) => sum + v.odometer, 0);
        const totalEnergy = vehicles.reduce((sum, v) => sum + (v.batteryCapacity * (100 - v.currentSOC) / 100), 0);

        return {
            totalVehicles: vehicles.length,
            activeVehicles: vehicles.filter(v => v.status !== 'maintenance').length,
            statusBreakdown: {
                charging: statusCounts.charging || 0,
                idle: statusCounts.idle || 0,
                moving: statusCounts.moving || 0,
                maintenance: statusCounts.maintenance || 0
            },
            totalDistance: Math.round(totalDistance),
            totalEnergy: Math.round(totalEnergy),
            avgTemperature: Math.round(vehicles.reduce((sum, v) => sum + v.temperature, 0) / vehicles.length)
        };
    }, [vehicles]);

    // Vehicle management
    const addVehicle = useCallback(async (vehicleData) => {
        const newVehicle = {
            id: `EV-${String(vehicles.length + 1).padStart(3, '0')}`,
            ...vehicleData,
            currentSOC: 100,
            currentSOH: 100,
            odometer: 0,
            status: 'idle',
            lastUpdate: new Date().toISOString()
        };
        setVehicles(prev => [...prev, newVehicle]);
        return newVehicle;
    }, [vehicles]);

    const updateVehicle = useCallback(async (vehicleId, updates) => {
        setVehicles(prev => prev.map(v =>
            v.id === vehicleId ? { ...v, ...updates, lastUpdate: new Date().toISOString() } : v
        ));
    }, []);

    const getVehicle = useCallback((vehicleId) => {
        return vehicles.find(v => v.id === vehicleId);
    }, [vehicles]);

    // Driver management
    const addDriver = useCallback(async (driverData) => {
        const newDriver = {
            id: `DR-${String(drivers.length + 1).padStart(3, '0')}`,
            ...driverData,
            safetyScore: 100,
            efficiencyRating: 100,
            totalTrips: 0,
            joinDate: new Date().toISOString()
        };
        setDrivers(prev => [...prev, newDriver]);
        return newDriver;
    }, [drivers]);

    const updateDriver = useCallback(async (driverId, updates) => {
        setDrivers(prev => prev.map(d =>
            d.id === driverId ? { ...d, ...updates } : d
        ));
    }, []);

    const assignDriverToVehicle = useCallback(async (driverId, vehicleId) => {
        setDrivers(prev => prev.map(d =>
            d.id === driverId ? { ...d, assignedVehicle: vehicleId } : d
        ));
        setVehicles(prev => prev.map(v =>
            v.id === vehicleId ? { ...v, assignedDriver: driverId } : v
        ));
    }, []);

    // Charging management
    const scheduleCharging = useCallback(async (vehicleId, startTime, targetSOC) => {
        // Implementation will call backend API
        console.log('Schedule charging:', vehicleId, startTime, targetSOC);
        return { success: true, scheduleId: Date.now() };
    }, []);

    // Settings management
    const updateSettings = useCallback((category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    }, []);

    const value = {
        // State
        vehicles,
        drivers,
        chargingStations,
        routes,
        settings,

        // Metrics
        getFleetSummary,

        // Vehicle operations
        addVehicle,
        updateVehicle,
        getVehicle,

        // Driver operations
        addDriver,
        updateDriver,
        assignDriverToVehicle,

        // Charging operations
        scheduleCharging,

        // Settings
        updateSettings
    };

    return (
        <FleetContext.Provider value={value}>
            {children}
        </FleetContext.Provider>
    );
};
