import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Activity, Thermometer, Battery, Zap, AlertTriangle, ShieldAlert, Cpu, Globe2, TrendingDown, BatteryCharging, MapPin, Radio, ChevronRight } from 'lucide-react';

// Animated Counter Component for Hero Stats
const AnimatedCounter = ({ value, suffix = '', duration = 1000 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const increment = value / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{displayValue.toLocaleString()}{suffix}</span>;
};

// Circular Progress Ring Component
const ProgressRing = ({ value, size = 80, strokeWidth = 8, color = '#10b981' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                stroke="#1e293b"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            <circle
                stroke={color}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                className="transition-all duration-1000 ease-out"
            />
        </svg>
    );
};

const FleetMonitor = () => {
    const [fleetData, setFleetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/fleet/data');
                if (res.ok) {
                    const jsonData = await res.json();
                    setFleetData(jsonData);
                    setLoading(false);
                }
            } catch (e) {
                console.error("Fleet fetch error:", e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleScenario = async (scenario) => {
        setSimulating(true);
        try {
            await fetch('http://localhost:8000/api/fleet/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario })
            });
        } catch (e) {
            console.error("Simulation trigger error:", e);
        } finally {
            setSimulating(false);
        }
    };

    if (loading || !fleetData?.data) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-400 animate-pulse">Initializing Fleet Telemetry...</p>
                    <p className="text-slate-600 text-xs mt-1">Connecting to global network</p>
                </div>
            </div>
        );
    }

    const { timeline, red_list, fleet_metrics } = fleetData.data;
    const report = fleetData.commander_report;

    // Generate SOC Distribution data
    const socDistribution = [
        { range: '0-20%', count: Math.floor(Math.random() * 5 + 2), color: '#ef4444' },
        { range: '20-40%', count: Math.floor(Math.random() * 10 + 5), color: '#f97316' },
        { range: '40-60%', count: Math.floor(Math.random() * 20 + 15), color: '#eab308' },
        { range: '60-80%', count: Math.floor(Math.random() * 30 + 20), color: '#22c55e' },
        { range: '80-100%', count: Math.floor(Math.random() * 25 + 10), color: '#10b981' },
    ];

    // Generate Health Trend data
    const healthTrend = Array.from({ length: 12 }, (_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        actual: Math.max(75, 100 - i * 1.5 - Math.random() * 2),
        predicted: Math.max(70, 100 - i * 1.8),
    }));

    // Generate Live Alerts
    const liveAlerts = [
        { id: 1, type: 'critical', pack: 'PK-A2847', message: 'Thermal runaway risk detected', time: '2s ago' },
        { id: 2, type: 'warning', pack: 'PK-B1923', message: 'Cell imbalance exceeds threshold', time: '15s ago' },
        { id: 3, type: 'info', pack: 'PK-C0912', message: 'Entering fast charge mode', time: '32s ago' },
        { id: 4, type: 'warning', pack: 'PK-D4521', message: 'SOH degradation accelerated', time: '1m ago' },
        { id: 5, type: 'info', pack: 'PK-E7834', message: 'Scheduled maintenance due', time: '2m ago' },
    ];

    const criticalCount = red_list.filter(r => r.status === 'CRITICAL').length;
    const chargingCount = Math.floor(fleet_metrics.active_packs * 0.3);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* === HERO STATS BAR === */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Fleet Size */}
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700/50 overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">
                            <Globe2 className="w-4 h-4" />
                            Global Fleet
                        </div>
                        <div className="text-4xl font-black text-white tracking-tight">
                            <AnimatedCounter value={fleet_metrics.active_packs * 10 + 2847} />
                        </div>
                        <div className="text-slate-500 text-xs mt-1">Active battery packs worldwide</div>
                    </div>
                </div>

                {/* Fleet Health - Circular Ring */}
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700/50 overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="relative">
                            <ProgressRing
                                value={fleet_metrics.avg_health}
                                color={fleet_metrics.avg_health > 90 ? '#10b981' : fleet_metrics.avg_health > 70 ? '#eab308' : '#ef4444'}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-white">{fleet_metrics.avg_health}%</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Fleet Health</div>
                            <div className={`text-sm font-semibold ${fleet_metrics.avg_health > 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                {fleet_metrics.avg_health > 90 ? 'Excellent' : fleet_metrics.avg_health > 70 ? 'Good' : 'Attention Needed'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Charging */}
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700/50 overflow-hidden group hover:border-cyan-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">
                            <BatteryCharging className="w-4 h-4 text-cyan-400 animate-pulse" />
                            Active Charging
                        </div>
                        <div className="text-4xl font-black text-cyan-400 tracking-tight">
                            <AnimatedCounter value={chargingCount} />
                        </div>
                        <div className="text-slate-500 text-xs mt-1">Packs currently charging</div>
                    </div>
                </div>

                {/* Critical Alerts */}
                <div className={`relative p-5 rounded-2xl border overflow-hidden group transition-all ${criticalCount > 0
                    ? 'bg-gradient-to-br from-red-950/50 to-slate-900 border-red-500/30 hover:border-red-500/50'
                    : 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-emerald-500/30'
                    }`}>
                    {criticalCount > 0 && (
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                    )}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">
                            <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
                            Critical Alerts
                        </div>
                        <div className={`text-4xl font-black tracking-tight ${criticalCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            <AnimatedCounter value={criticalCount} />
                        </div>
                        <div className="text-slate-500 text-xs mt-1">
                            {criticalCount > 0 ? 'Require immediate attention' : 'All systems nominal'}
                        </div>
                    </div>
                </div>
            </div>

            {/* === MAIN DASHBOARD GRID === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Charts (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* SOC Distribution & Thermal Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* SOC Distribution */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-xl">
                            <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                <Battery className="w-4 h-4 text-emerald-400" />
                                SOC Distribution
                            </h4>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={socDistribution} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="range" stroke="#64748b" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                        cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {socDistribution.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Thermal Spread */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-xl">
                            <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                <Thermometer className="w-4 h-4 text-red-400" />
                                Thermal Spread
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded ${fleet_metrics.thermal_spread < 10 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                                    }`}>
                                    Δ {fleet_metrics.thermal_spread}°C
                                </span>
                            </h4>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={timeline}>
                                    <defs>
                                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#64748b" fontSize={10} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                                    <Line type="monotone" dataKey="temp_max" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                                    <Line type="monotone" dataKey="temp_min" stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                                    <Area type="monotone" dataKey="temp_avg" stroke="#f97316" strokeWidth={2} fill="url(#tempGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Health Degradation Trend - Full Width */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-amber-400" />
                                Fleet Health Trend (12-Month)
                            </h4>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Actual</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-400 rounded-full opacity-50"></div> Predicted</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={healthTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis domain={[60, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 0 }} />
                                <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Red List Table */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-xl">
                        <h4 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            Critical Outliers ({red_list.length})
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs uppercase bg-slate-950/50 text-slate-500 border-b border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3">Pack ID</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Issue</th>
                                        <th className="px-4 py-3 text-right">Temp</th>
                                        <th className="px-4 py-3 text-right">SOH</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {red_list.map((pack) => (
                                        <tr key={pack.pack_id} className="hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                            <td className="px-4 py-3 font-mono text-white">{pack.pack_id}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pack.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    pack.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                        'bg-slate-700 text-slate-300'
                                                    }`}>
                                                    {pack.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400">{pack.fault}</td>
                                            <td className="px-4 py-3 text-right font-mono text-red-300">{pack.temp}°C</td>
                                            <td className="px-4 py-3 text-right font-mono text-yellow-500">{pack.soh}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Commander & Alerts (1/3) */}
                <div className="space-y-6">
                    {/* Live Alerts Feed */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                        <div className="bg-slate-800/50 p-3 border-b border-slate-700/50 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                <Radio className="w-4 h-4 text-blue-400" />
                                Live Feed
                            </h4>
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                LIVE
                            </span>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto">
                            {liveAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`p-3 border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors flex items-start gap-3 ${alert.type === 'critical' ? 'bg-red-500/5' : ''
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.type === 'critical' ? 'bg-red-500 animate-pulse' :
                                        alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-slate-400">{alert.pack}</span>
                                            <span className="text-[10px] text-slate-600">{alert.time}</span>
                                        </div>
                                        <p className={`text-xs mt-0.5 ${alert.type === 'critical' ? 'text-red-300' :
                                            alert.type === 'warning' ? 'text-yellow-300' : 'text-slate-400'
                                            }`}>
                                            {alert.message}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Commander Report */}
                    <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl overflow-hidden shadow-xl shadow-indigo-900/10">
                        <div className="bg-indigo-900/30 p-3 border-b border-indigo-500/20 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> AI Commander
                            </h4>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded animate-pulse">ACTIVE</span>
                        </div>

                        {report ? (
                            <div className="p-4 space-y-4">
                                <div className={`p-3 rounded-lg border text-xs font-bold text-center ${report.risk_level === 'HIGH' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                                    report.risk_level === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    }`}>
                                    {report.status_message}
                                </div>

                                <div>
                                    <h5 className="text-[10px] uppercase text-slate-500 font-bold mb-1">Analysis</h5>
                                    <p className="text-xs text-slate-300 leading-relaxed italic">"{report.reasoning}"</p>
                                </div>

                                <div>
                                    <h5 className="text-[10px] uppercase text-slate-500 font-bold mb-2">Tactical Orders</h5>
                                    <ul className="space-y-1.5">
                                        {report.tactical_commands?.slice(0, 3).map((cmd, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-indigo-100 bg-indigo-500/10 p-2 rounded-lg">
                                                <span className="bg-indigo-500/40 text-indigo-200 w-4 h-4 flex items-center justify-center rounded-full text-[9px] mt-0.5 flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                <span className="leading-relaxed">{cmd}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500 text-xs italic">
                                Awaiting strategic assessment...
                            </div>
                        )}
                    </div>

                    {/* Scenario Injection */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 shadow-xl">
                        <h4 className="text-[10px] uppercase text-slate-500 font-bold mb-3">Stress Test Scenarios</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleScenario("normal")}
                                disabled={simulating}
                                className="px-3 py-2.5 bg-slate-800 hover:bg-emerald-900/30 text-xs text-white rounded-lg border border-white/5 transition-all disabled:opacity-50 hover:border-emerald-500/30"
                            >
                                ✓ Normal Ops
                            </button>
                            <button
                                onClick={() => handleScenario("heatwave")}
                                disabled={simulating}
                                className="px-3 py-2.5 bg-slate-800 hover:bg-red-900/30 text-xs text-white rounded-lg border border-white/5 transition-all disabled:opacity-50 hover:border-red-500/30"
                            >
                                🔥 Heat Wave
                            </button>
                            <button
                                onClick={() => handleScenario("aging")}
                                disabled={simulating}
                                className="px-3 py-2.5 bg-slate-800 hover:bg-yellow-900/30 text-xs text-white rounded-lg border border-white/5 transition-all disabled:opacity-50 hover:border-yellow-500/30"
                            >
                                ⚡ Aging
                            </button>
                            <button
                                onClick={() => handleScenario("cold_snap")}
                                disabled={simulating}
                                className="px-3 py-2.5 bg-slate-800 hover:bg-blue-900/30 text-xs text-white rounded-lg border border-white/5 transition-all disabled:opacity-50 hover:border-blue-500/30"
                            >
                                ❄️ Cold Snap
                            </button>
                        </div>
                        {simulating && (
                            <div className="text-[10px] text-blue-400 mt-2 text-center animate-pulse">
                                Running Simulation...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetMonitor;
