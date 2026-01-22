import React, { useState, useEffect } from 'react';
import { Activity, Terminal, Microscope, Monitor, Zap, Shield, ChevronRight, BarChart3, Database, Cpu, Radio, Layers } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, trend, color, delay }) => (
    <div className={`relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 group hover:border-${color}-500/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards`} style={{ animationDelay: `${delay}ms` }}>
        {/* Background Pulse Effect */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all duration-500`} />

        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 bg-${color}-500/10 rounded-xl text-${color}-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                <Icon className="w-6 h-6" />
            </div>
            {trend && (
                <span className={`text-xs px-2 py-1 rounded-full bg-${color}-500/10 text-${color}-300 border border-${color}-500/20 font-mono shadow-[0_0_10px_rgba(0,0,0,0.1)]`}>
                    {trend}
                </span>
            )}
        </div>
        <h3 className="text-3xl font-bold text-white mb-1 tracking-tight font-mono relative z-10">{value}</h3>
        <p className="text-slate-400 text-sm font-medium relative z-10">{label}</p>
    </div>
);

const QuickAction = ({ icon: Icon, title, desc, onClick, color, delay }) => (
    <button
        onClick={onClick}
        className={`w-full text-left p-4 bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-${color}-500/30 rounded-xl transition-all duration-300 group flex items-center gap-4 animate-in fade-in slide-in-from-right-8 fill-mode-backwards`}
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`p-3 bg-slate-950 rounded-lg text-${color}-400 group-hover:text-${color}-300 ring-1 ring-white/5 group-hover:ring-${color}-500/30 transition-all shadow-lg`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
            <h4 className="text-slate-200 font-semibold group-hover:text-white transition-colors">{title}</h4>
            <p className="text-xs text-slate-500 group-hover:text-slate-400">{desc}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
    </button>
);

const HomePage = ({ onNavigate }) => {
    // 1. Fetch Real Data
    const [stats, setStats] = useState({
        active: "---",
        health: "---",
        events: "---",
        sim_hours: "---"
    });
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/fleet/data');
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && data.data.fleet_metrics) {
                        setStats({
                            active: data.data.fleet_metrics.active_packs.toLocaleString(),
                            health: data.data.fleet_metrics.avg_health + "%",
                            events: data.data.red_list ? data.data.red_list.filter(r => r.status === 'CRITICAL').length : 0,
                            sim_hours: "24h"
                        });
                    }
                }
            } catch (e) {
                console.error("Home fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // 2. Real-Time Log Stream (WebSocket)
    const [wsStatus, setWsStatus] = useState("Connecting...");

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/api/ws/logs');

        ws.onopen = () => {
            setWsStatus("Connected");
            setLogs(prev => [`[SYSTEM] Connected to Live Telemetry Stream`, ...prev]);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Schema: { timestamp, system, message, level }
                const formattedLog = `[${data.timestamp}] ${data.system}: ${data.message}`;
                setLogs(prev => [formattedLog, ...prev].slice(0, 8));
            } catch (e) {
                console.error("Log parse error", e);
            }
        };

        ws.onclose = () => {
            setWsStatus("Disconnected");
            setLogs(prev => [`[SYSTEM] Stream Connection Lost`, ...prev]);
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <div className="max-w-7xl mx-auto py-8">
            {/* Header / HUD */}
            <div className="flex items-center justify-between mb-12 animate-in fade-in zoom-in-95 duration-700">
                <div>
                    <h1 className="text-5xl font-bold text-white mb-2 tracking-tight flex items-center gap-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 py-2 pr-2">BatteryForge AI</span>
                        <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded font-mono uppercase tracking-widest">
                            Command Center
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                        Autonomous Battery Intelligence Platform Powered by Gemini 3
                    </p>
                </div>
                {/* Status Indicator */}
                <div className="hidden md:flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-full border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-bold text-emerald-400 tracking-wide">SYSTEM ONLINE</span>
                </div>
            </div>

            {/* Stats Grid - WIRE TO REAL DATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatCard
                    icon={Radio}
                    label="Active Fleet Monitor"
                    value={loading ? "Loading..." : stats.active}
                    trend="Live"
                    color="emerald"
                    delay={100}
                />
                <StatCard
                    icon={Activity}
                    label="Avg Fleet Health"
                    value={loading ? "Loading..." : stats.health}
                    trend={stats.health.startsWith('8') ? "Degraded" : "Stable"}
                    color={stats.health.startsWith('8') ? "yellow" : "indigo"}
                    delay={200}
                />
                <StatCard
                    icon={Shield}
                    label="Active Safety Events"
                    value={loading ? "Loading..." : stats.events}
                    trend={stats.events > 0 ? "CRITICAL" : "Clear"}
                    color={stats.events > 0 ? "red" : "cyan"}
                    delay={300}
                />
                <StatCard
                    icon={Cpu}
                    label="Simulation Window"
                    value={stats.sim_hours}
                    trend="Physics Engine"
                    color="purple"
                    delay={400}
                />
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Quick Actions Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-indigo-400" />
                        Mission Protocols
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <QuickAction
                            icon={Microscope}
                            title="Visual Intelligence"
                            desc="Defect Detection & Live Thermal Scout"
                            color="indigo"
                            delay={500}
                            onClick={() => onNavigate('visual')}
                        />
                        <QuickAction
                            icon={Terminal}
                            title="Log Analysis"
                            desc="Parse BMS error logs & telemetry"
                            color="amber"
                            delay={600}
                            onClick={() => onNavigate('logs')}
                        />
                        <QuickAction
                            icon={Zap}
                            title="Charging Sim"
                            desc="Run cycling simulations & aging models"
                            color="emerald"
                            delay={700}
                            onClick={() => onNavigate('sim')}
                        />
                        <QuickAction
                            icon={Database} // Changed Icon
                            title="Fleet Monitor"
                            desc="View global pack status realtime"
                            color="rose"
                            delay={800}
                            onClick={() => onNavigate('fleet')}
                        />
                        <QuickAction
                            icon={Layers}
                            title="PCB Automation"
                            desc="5-Phase Quality Control & Fabrication"
                            color="purple"
                            delay={900}
                            onClick={() => onNavigate('pcb')}
                        />
                    </div>
                </div>

                {/* System Status / Live Logs */}
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 h-fit animate-in fade-in slide-in-from-right duration-700 delay-500 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                        Live System Stream
                        <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                    </h3>

                    {/* Log Terminal Look */}
                    <div className="bg-black/40 rounded-lg p-4 font-mono text-xs h-48 overflow-hidden border border-white/10 shadow-inner">
                        <div className="space-y-2">
                            {logs.map((log, i) => (
                                <div key={i} className="text-emerald-500/80 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-slate-600 mr-2">{'>'}</span>{log}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Gemini Agent</span>
                            <span className={wsStatus === 'Connected' ? "text-emerald-400" : "text-amber-400"}>{wsStatus}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Physics Engine</span>
                            <span className="text-emerald-400">Running (60Hz)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Database</span>
                            <span className="text-emerald-400">Synced</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
