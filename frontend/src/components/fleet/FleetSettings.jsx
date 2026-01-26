import React, { useState } from 'react';
import {
    Settings,
    Bell,
    Globe,
    Shield,
    Database,
    Moon,
    Volume2,
    Save,
    RotateCcw
} from 'lucide-react';
import MetricCard from './shared/MetricCard';

const FleetSettings = () => {
    const [activeSection, setActiveSection] = useState('general');
    const [settings, setSettings] = useState({
        units: 'metric', // metric, imperial
        currency: 'USD',
        language: 'en',
        theme: 'dark',
        notifications: {
            critical_alerts: true,
            maintenance_reminders: true,
            driver_behavior: false,
            route_deviations: true,
            email: true,
            push: true
        },
        thresholds: {
            low_battery: 20,
            critical_temp: 45,
            harsh_braking: 0.5, // g-force
            idle_timeout: 15 // minutes
        },
        apis: {
            google_maps: '**********',
            gemini_ai: '**********'
        }
    });

    const handleToggle = (category, key) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: !prev[category][key]
            }
        }));
    };

    const handleChange = (category, key, value) => {
        setSettings(prev => {
            if (category) {
                return {
                    ...prev,
                    [category]: {
                        ...prev[category],
                        [key]: value
                    }
                };
            }
            return {
                ...prev,
                [key]: value
            };
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Settings className="h-6 w-6 text-slate-400" />
                        System Settings
                    </h2>
                    <p className="text-slate-400">Configure global fleet preferences and thresholds</p>
                </div>

                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700">
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-md">
                        <Save className="h-4 w-4" />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                        <nav className="flex flex-col p-2 space-y-1">
                            <button
                                onClick={() => setActiveSection('general')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === 'general' ? 'bg-blue-900/20 text-blue-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                            >
                                <Globe className="h-5 w-5" /> General
                            </button>
                            <button
                                onClick={() => setActiveSection('notifications')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === 'notifications' ? 'bg-blue-900/20 text-blue-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                            >
                                <Bell className="h-5 w-5" /> Notifications
                            </button>
                            <button
                                onClick={() => setActiveSection('thresholds')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === 'thresholds' ? 'bg-blue-900/20 text-blue-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                            >
                                <Shield className="h-5 w-5" /> Safety Thresholds
                            </button>
                            <button
                                onClick={() => setActiveSection('data')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === 'data' ? 'bg-blue-900/20 text-blue-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                            >
                                <Database className="h-5 w-5" /> Data & API
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 min-h-[500px]">

                        {/* GENERAL SETTINGS */}
                        {activeSection === 'general' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white border-b border-slate-700 pb-4">General Preferences</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Distance Units</label>
                                        <select
                                            value={settings.units}
                                            onChange={(e) => handleChange(null, 'units', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="metric">Metric (km, °C)</option>
                                            <option value="imperial">Imperial (miles, °F)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Currency</label>
                                        <select
                                            value={settings.currency}
                                            onChange={(e) => handleChange(null, 'currency', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Interface Language</label>
                                        <select
                                            value={settings.language}
                                            onChange={(e) => handleChange(null, 'language', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Theme</label>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleChange(null, 'theme', 'dark')}
                                                className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${settings.theme === 'dark' ? 'bg-slate-700 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                            >
                                                <Moon className="h-4 w-4" /> Dark
                                            </button>
                                            <button
                                                onClick={() => handleChange(null, 'theme', 'light')}
                                                className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${settings.theme === 'light' ? 'bg-slate-700 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                            >
                                                <Settings className="h-4 w-4" /> Light
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS */}
                        {activeSection === 'notifications' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white border-b border-slate-700 pb-4">Notification Channels</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400"><Bell className="h-5 w-5" /></div>
                                            <div>
                                                <h4 className="font-medium text-white">Critical Alerts</h4>
                                                <p className="text-sm text-slate-400">Immediate notifications for battery faults and accidents</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={settings.notifications.critical_alerts} onChange={() => handleToggle('notifications', 'critical_alerts')} />
                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-900/30 rounded-lg text-emerald-400"><RotateCcw className="h-5 w-5" /></div>
                                            <div>
                                                <h4 className="font-medium text-white">Maintenance Reminders</h4>
                                                <p className="text-sm text-slate-400">Scheduled service and predicted maintenance alerts</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={settings.notifications.maintenance_reminders} onChange={() => handleToggle('notifications', 'maintenance_reminders')} />
                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-900/30 rounded-lg text-amber-400"><Volume2 className="h-5 w-5" /></div>
                                            <div>
                                                <h4 className="font-medium text-white">Driver Behavior</h4>
                                                <p className="text-sm text-slate-400">Harsh braking, speeding, and rapid acceleration events</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={settings.notifications.driver_behavior} onChange={() => handleToggle('notifications', 'driver_behavior')} />
                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* THRESHOLDS */}
                        {activeSection === 'thresholds' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white border-b border-slate-700 pb-4">Safety & Operation Thresholds</h3>
                                <p className="text-slate-400 text-sm">Define the boundaries for automated alerts and system warnings.</p>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-sm font-medium text-white">Low Battery Alert (%)</label>
                                            <span className="text-blue-400 font-bold">{settings.thresholds.low_battery}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="5"
                                            max="50"
                                            value={settings.thresholds.low_battery}
                                            onChange={(e) => handleChange('thresholds', 'low_battery', e.target.value)}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-sm font-medium text-white">Critical Battery Temp (°C)</label>
                                            <span className="text-red-400 font-bold">{settings.thresholds.critical_temp}°C</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="30"
                                            max="80"
                                            value={settings.thresholds.critical_temp}
                                            onChange={(e) => handleChange('thresholds', 'critical_temp', e.target.value)}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-sm font-medium text-white">Harsh Braking Threshold (g)</label>
                                            <span className="text-amber-400 font-bold">{settings.thresholds.harsh_braking}g</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1.0"
                                            step="0.1"
                                            value={settings.thresholds.harsh_braking}
                                            onChange={(e) => handleChange('thresholds', 'harsh_braking', e.target.value)}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DATA & API */}
                        {activeSection === 'data' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white border-b border-slate-700 pb-4">API Configurations</h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Gemini AI API Key</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={settings.apis.gemini_ai}
                                                readOnly
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-500 font-mono"
                                            />
                                            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Edit</button>
                                        </div>
                                        <p className="text-xs text-slate-500">Used for conversational fleet insights and generative recommendations.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Google Maps API Key</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={settings.apis.google_maps}
                                                readOnly
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-500 font-mono"
                                            />
                                            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Edit</button>
                                        </div>
                                        <p className="text-xs text-slate-500">Used for traffic layers, geocoding, and route visualization.</p>
                                    </div>

                                    <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg mt-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database className="h-5 w-5 text-blue-400" />
                                            <h4 className="font-bold text-white">Data Export</h4>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-4">Download comprehensive fleet logs for offline analysis or compliance reporting.</p>
                                        <div className="flex gap-3">
                                            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm border border-slate-600 transition-colors">Download CSV</button>
                                            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm border border-slate-600 transition-colors">Download PDF Report</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetSettings;
