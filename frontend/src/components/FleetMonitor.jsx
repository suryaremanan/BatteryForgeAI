import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Activity, Thermometer, Battery, Zap, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';

const FleetMonitor = () => {
    // Hybrid Data State
    const [fleetData, setFleetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);

    // Poll for updates (Simulation changes)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/fleet/data');
                if (res.ok) {
                    const jsonData = await res.json();
                    // Structure: { data: { timeline: [], red_list: [], fleet_metrics: {} }, commander_report: {} }
                    setFleetData(jsonData);
                    setLoading(false);
                }
            } catch (e) {
                console.error("Fleet fetch error:", e);
            }
        };

        fetchData(); // Initial
        const interval = setInterval(fetchData, 3000); // 3s Polling
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
            // We rely on the polling loop to pick up the new data shortly
        } catch (e) {
            console.error("Simulation trigger error:", e);
        } finally {
            setSimulating(false);
        }
    };

    if (loading || !fleetData?.data) {
        return <div className="text-slate-500 text-center p-10 animate-pulse">Initializing Fleet Telemetry...</div>;
    }

    const { timeline, red_list, fleet_metrics } = fleetData.data;
    const report = fleetData.commander_report;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. Header Metrics (Aggregated) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Fleet Health</p>
                            <h3 className={`text-2xl font-bold mt-1 ${fleet_metrics.avg_health > 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                                {fleet_metrics.avg_health}%
                            </h3>
                        </div>
                        <Activity className="text-slate-600" />
                    </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Thermal Spread</p>
                            <h3 className={`text-2xl font-bold mt-1 ${fleet_metrics.thermal_spread < 10 ? 'text-emerald-400' : 'text-red-400'}`}>
                                Δ {fleet_metrics.thermal_spread}°C
                            </h3>
                        </div>
                        <Thermometer className={fleet_metrics.thermal_spread < 10 ? "text-emerald-500/50" : "text-red-500/50"} />
                    </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Active Packs</p>
                            <h3 className="text-2xl font-bold text-blue-400 mt-1">{fleet_metrics.active_packs}</h3>
                        </div>
                        <Battery className="text-blue-500/50" />
                    </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Critical Outliers</p>
                            <h3 className={`text-2xl font-bold mt-1 ${red_list.filter(r => r.status === 'CRITICAL').length > 0 ? 'text-red-500' : 'text-green-400'}`}>
                                {red_list.filter(r => r.status === 'CRITICAL').length}
                            </h3>
                        </div>
                        <AlertTriangle className="text-red-500/50" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2. Charts Section (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Thermal Spread Chart (Min/Max Band) */}
                    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 min-h-[300px]">
                        <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-red-400" />
                            Thermal Spread Distribution (Min/Max Band)
                        </h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={timeline}>
                                <defs>
                                    <linearGradient id="avgTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} />
                                <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#64748b" fontSize={12} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fca5a5' }}
                                />
                                <Line type="monotone" dataKey="temp_max" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Max Temp" />
                                <Line type="monotone" dataKey="temp_min" stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Min Temp" />
                                <Area type="monotone" dataKey="temp_avg" stroke="#ef4444" strokeWidth={2} fill="url(#avgTemp)" name="Avg Temp" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* RED LIST Outliers Table */}
                    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            Critical "Red List" Outliers
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs uppercase bg-slate-950 text-slate-500 border-b border-slate-800">
                                    <tr>
                                        <th className="px-4 py-2">Pack ID</th>
                                        <th className="px-4 py-2">Status</th>
                                        <th className="px-4 py-2">Detected Failure</th>
                                        <th className="px-4 py-2 text-right">Temp</th>
                                        <th className="px-4 py-2 text-right">Voltage</th>
                                        <th className="px-4 py-2 text-right">SOH</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {red_list.map((pack) => (
                                        <tr key={pack.pack_id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-2 font-mono text-white">{pack.pack_id}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pack.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    pack.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                        'bg-slate-700 text-slate-300'
                                                    }`}>
                                                    {pack.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-slate-400">{pack.fault}</td>
                                            <td className="px-4 py-2 text-right font-mono text-red-300">{pack.temp}°C</td>
                                            <td className="px-4 py-2 text-right font-mono">{pack.voltage}V</td>
                                            <td className="px-4 py-2 text-right font-mono text-yellow-500">{pack.soh}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 3. Commander Report (AI) - 1/3 Width */}
                <div className="space-y-4">
                    {/* Report Card */}
                    <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-0 overflow-hidden shadow-lg shadow-indigo-900/20">
                        <div className="bg-indigo-900/40 p-3 border-b border-indigo-500/20 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> Agent Commander
                            </h4>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded animate-pulse">
                                LIVE
                            </span>
                        </div>

                        {report ? (
                            <div className="p-4 space-y-4">
                                {/* Status Banner */}
                                <div className={`p-3 rounded border text-xs font-bold text-center ${report.risk_level === 'HIGH' ? 'bg-red-500/20 border-red-500/40 text-red-300' :
                                    report.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' :
                                        'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                    }`}>
                                    {report.status_message}
                                </div>

                                {/* Reasoning */}
                                <div>
                                    <h5 className="text-[10px] uppercase text-slate-500 font-bold mb-1">Analysis</h5>
                                    <p className="text-sm text-slate-300 leading-relaxed italic">
                                        "{report.reasoning}"
                                    </p>
                                </div>

                                {/* Tactical Commands */}
                                <div>
                                    <h5 className="text-[10px] uppercase text-slate-500 font-bold mb-2">Tactical Orders</h5>
                                    <ul className="space-y-2">
                                        {report.tactical_commands?.map((cmd, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-indigo-100 bg-indigo-500/10 p-2 rounded">
                                                <span className="bg-indigo-500/40 text-indigo-200 w-4 h-4 flex items-center justify-center rounded-full text-[9px] mt-0.5">
                                                    {i + 1}
                                                </span>
                                                {cmd}
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

                    {/* Quick Actions (Simulation Triggers) */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                        <h4 className="text-[10px] uppercase text-slate-500 font-bold mb-3">Inject Scenario</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleScenario("normal")}
                                disabled={simulating}
                                className="px-3 py-2 bg-slate-800 hover:bg-emerald-900/30 text-xs text-white rounded border border-white/5 transition-colors disabled:opacity-50"
                            >
                                Normal Ops
                            </button>
                            <button
                                onClick={() => handleScenario("heatwave")}
                                disabled={simulating}
                                className="px-3 py-2 bg-slate-800 hover:bg-red-900/30 text-xs text-white rounded border border-white/5 transition-colors disabled:opacity-50"
                            >
                                Heat Wave
                            </button>
                            <button
                                onClick={() => handleScenario("aging")}
                                disabled={simulating}
                                className="px-3 py-2 bg-slate-800 hover:bg-yellow-900/30 text-xs text-white rounded border border-white/5 transition-colors disabled:opacity-50"
                            >
                                Aging Acceleration
                            </button>
                            <button
                                onClick={() => handleScenario("cold_snap")}
                                disabled={simulating}
                                className="px-3 py-2 bg-slate-800 hover:bg-blue-900/30 text-xs text-white rounded border border-white/5 transition-colors disabled:opacity-50"
                            >
                                Cold Snap
                            </button>
                        </div>
                        {simulating && <div className="text-[10px] text-blue-400 mt-2 text-center animate-pulse">Running Simulation...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetMonitor;
