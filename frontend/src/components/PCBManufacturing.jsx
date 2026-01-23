import React, { useState, useEffect, useRef } from 'react';
import {
    Layers, Zap, Eye, Hammer, ShieldCheck, Upload, FileText, CheckCircle,
    AlertTriangle, Activity, CircuitBoard, Cpu, Thermometer, Gauge,
    Factory, Clock, Package, Target, FlaskConical, Microscope,
    Workflow, TrendingUp, BarChart3, Radio, Wifi, AlertCircle,
    ChevronRight, Play, Settings, RefreshCw, Download, QrCode
} from 'lucide-react';
import {
    analyzeGerber, optimizeMaterial, controlEtching, predictLamination,
    classifyPCB, checkDrillWear, optimizePlating, verifyETest, generateCertificate
} from '../api';

// ============================================================================
// 3D PCB LAYER VISUALIZATION COMPONENT
// ============================================================================
const PCBLayerVisualization = ({ layers = 6, activePhase = 1 }) => {
    const layerColors = [
        'from-amber-600/80 to-amber-700/80',      // Copper Top
        'from-emerald-500/60 to-emerald-600/60',  // Solder Mask
        'from-yellow-500/90 to-yellow-600/90',    // Prepreg
        'from-amber-600/80 to-amber-700/80',      // Inner Copper 1
        'from-slate-600/80 to-slate-700/80',      // Core (FR4)
        'from-amber-600/80 to-amber-700/80',      // Inner Copper 2
        'from-yellow-500/90 to-yellow-600/90',    // Prepreg
        'from-emerald-500/60 to-emerald-600/60',  // Solder Mask
        'from-amber-600/80 to-amber-700/80',      // Copper Bottom
    ];

    const layerNames = ['Top Copper', 'Solder Mask', 'Prepreg', 'Inner L1', 'FR4 Core', 'Inner L2', 'Prepreg', 'Solder Mask', 'Bottom Copper'];

    return (
        <div className="relative h-64 flex items-center justify-center perspective-1000">
            <div className="relative transform-style-3d rotate-x-12 hover:rotate-x-0 transition-transform duration-700">
                {layerNames.slice(0, Math.min(layers + 3, 9)).map((name, idx) => (
                    <div
                        key={idx}
                        className={`
                            w-48 h-2 rounded-sm bg-gradient-to-r ${layerColors[idx]}
                            transform transition-all duration-500 shadow-lg
                            hover:scale-105 hover:translate-y-[-2px]
                            ${activePhase === 2 && idx === 4 ? 'animate-pulse ring-2 ring-cyan-400' : ''}
                        `}
                        style={{
                            transform: `translateY(${idx * 6}px) translateZ(${(4 - idx) * 3}px)`,
                            animationDelay: `${idx * 100}ms`
                        }}
                        title={name}
                    />
                ))}
            </div>

            {/* Animated drill holes */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute w-1.5 h-1.5 rounded-full bg-slate-900 border border-amber-500/50
                            ${activePhase === 4 ? 'animate-ping' : ''}`}
                        style={{
                            left: `${30 + i * 10}%`,
                            top: `${40 + (i % 2) * 15}%`,
                            animationDelay: `${i * 200}ms`
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// LIVE STATS CARD COMPONENT
// ============================================================================
const LiveStatCard = ({ icon: Icon, label, value, unit, trend, color = 'emerald', pulse = false }) => (
    <div className={`relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-xl 
        rounded-2xl p-4 border border-white/10 overflow-hidden group
        hover:border-${color}-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-${color}-500/10`}>

        {/* Glassmorphism glow */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl 
            group-hover:bg-${color}-500/20 transition-all duration-500`} />

        <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
                    <Icon className={`w-4 h-4 text-${color}-400`} />
                </div>
                {pulse && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </div>
            <div className="text-2xl font-bold text-white font-mono">
                {value}<span className="text-sm text-slate-400 ml-1">{unit}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
            {trend && (
                <div className={`text-xs mt-2 flex items-center gap-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                    {Math.abs(trend)}% vs last batch
                </div>
            )}
        </div>
    </div>
);

// ============================================================================
// PROCESS FLOW TIMELINE COMPONENT
// ============================================================================
const ProcessFlowTimeline = ({ activePhase, onPhaseClick }) => {
    const phases = [
        { id: 1, name: 'Data Engineering', icon: FileText, status: 'complete' },
        { id: 2, name: 'Process Control', icon: Zap, status: activePhase >= 2 ? 'active' : 'pending' },
        { id: 3, name: 'Vision AI', icon: Eye, status: activePhase >= 3 ? 'active' : 'pending' },
        { id: 4, name: 'Drill & Plate', icon: Hammer, status: activePhase >= 4 ? 'active' : 'pending' },
        { id: 5, name: 'Compliance', icon: ShieldCheck, status: activePhase >= 5 ? 'active' : 'pending' },
    ];

    return (
        <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-6 left-8 right-8 h-0.5 bg-gradient-to-r from-purple-500/50 via-cyan-500/50 to-emerald-500/50" />

            <div className="flex justify-between relative z-10">
                {phases.map((phase, idx) => (
                    <button
                        key={phase.id}
                        onClick={() => onPhaseClick(phase.id)}
                        className="flex flex-col items-center group"
                    >
                        <div className={`
                            relative w-12 h-12 rounded-full flex items-center justify-center
                            transition-all duration-500 transform group-hover:scale-110
                            ${activePhase === phase.id
                                ? 'bg-gradient-to-br from-purple-600 to-cyan-500 shadow-lg shadow-purple-500/30 ring-4 ring-purple-500/20'
                                : phase.status === 'complete'
                                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                    : 'bg-slate-800 border-2 border-slate-600'}
                        `}>
                            {phase.status === 'complete' && activePhase !== phase.id ? (
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            ) : (
                                <phase.icon className={`w-5 h-5 ${activePhase === phase.id ? 'text-white' : 'text-slate-400'}`} />
                            )}

                            {/* Pulse ring for active */}
                            {activePhase === phase.id && (
                                <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-50" />
                            )}
                        </div>
                        <span className={`mt-2 text-xs font-medium whitespace-nowrap transition-colors
                            ${activePhase === phase.id ? 'text-purple-300' : 'text-slate-500 group-hover:text-slate-300'}`}>
                            {phase.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// GAUGE VISUALIZATION
// ============================================================================
const AnimatedGauge = ({ value, max, label, unit, color = 'cyan' }) => {
    const percentage = (value / max) * 100;
    const rotation = (percentage / 100) * 180 - 90;

    return (
        <div className="relative flex flex-col items-center">
            <div className="relative w-32 h-16 overflow-hidden">
                {/* Background arc */}
                <div className="absolute inset-0 border-8 border-slate-700 rounded-t-full" />

                {/* Colored arc */}
                <div
                    className={`absolute inset-0 border-8 border-${color}-500 rounded-t-full transition-all duration-1000`}
                    style={{
                        clipPath: `polygon(0 100%, 0 0, ${percentage}% 0, ${percentage}% 100%)`
                    }}
                />

                {/* Needle */}
                <div
                    className="absolute bottom-0 left-1/2 w-1 h-14 bg-white rounded-full origin-bottom transition-transform duration-1000"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                />

                {/* Center dot */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 rounded-full border-2 border-white" />
            </div>

            <div className="text-center mt-2">
                <div className={`text-xl font-bold text-${color}-400 font-mono`}>{value}{unit}</div>
                <div className="text-xs text-slate-400">{label}</div>
            </div>
        </div>
    );
};

// ============================================================================
// DEFECT VISUALIZATION OVERLAY
// ============================================================================
const DefectOverlay = ({ defects, imageSize = { width: 300, height: 200 } }) => {
    if (!defects || defects.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none">
            {defects.map((defect, idx) => (
                <div
                    key={idx}
                    className={`absolute border-2 rounded ${defect.severity === 'FATAL' ? 'border-red-500 bg-red-500/10' :
                        defect.severity === 'REPAIRABLE' ? 'border-amber-500 bg-amber-500/10' :
                            'border-cyan-500 bg-cyan-500/10'
                        } animate-pulse`}
                    style={{
                        left: defect.bbox?.[0] || 50,
                        top: defect.bbox?.[1] || 50,
                        width: (defect.bbox?.[2] - defect.bbox?.[0]) || 50,
                        height: (defect.bbox?.[3] - defect.bbox?.[1]) || 50,
                    }}
                >
                    <span className={`absolute -top-5 left-0 text-[10px] font-bold px-1 rounded ${defect.severity === 'FATAL' ? 'bg-red-500 text-white' :
                        defect.severity === 'REPAIRABLE' ? 'bg-amber-500 text-black' :
                            'bg-cyan-500 text-black'
                        }`}>
                        {defect.type}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const PCBManufacturing = () => {
    const [activePhase, setActivePhase] = useState(1);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [liveStats, setLiveStats] = useState({
        panelsProduced: 248,
        yieldRate: 98.4,
        avgCycleTime: 12.5,
        activeMachines: 8,
    });

    // Phase States
    const [gerberResult, setGerberResult] = useState(null);
    const [materialPlan, setMaterialPlan] = useState(null);
    const [etchingParams, setEtchingParams] = useState(null);
    const [laminationScaling, setLaminationScaling] = useState(null);
    const [visionResult, setVisionResult] = useState(null);
    const [visionPreview, setVisionPreview] = useState(null);
    const [drillStatus, setDrillStatus] = useState(null);
    const [platingSetup, setPlatingSetup] = useState(null);
    const [eTestResults, setETestResults] = useState(null);
    const [coc, setCoc] = useState(null);

    // Websocket simulation for live stats
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveStats(prev => ({
                panelsProduced: prev.panelsProduced + Math.floor(Math.random() * 3),
                yieldRate: Math.max(95, Math.min(99.9, prev.yieldRate + (Math.random() - 0.5) * 0.2)),
                avgCycleTime: Math.max(10, Math.min(15, prev.avgCycleTime + (Math.random() - 0.5) * 0.3)),
                activeMachines: prev.activeMachines,
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const addLog = (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '📋';
        setLogs(prev => [`[${timestamp}] ${prefix} ${msg}`, ...prev].slice(0, 50));
    };

    // ============== HANDLERS ==============
    const handleGerberUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        addLog(`Analyzing Gerber: ${file.name}...`);
        try {
            const res = await analyzeGerber(file);
            setGerberResult(res);
            addLog("Gerber Analysis Complete.", 'success');
            if (res.engineering_questions) {
                addLog(`EQ Generated: ${res.engineering_questions.id}`, 'warning');
            }
        } catch (err) {
            addLog(`Error: ${err.message}`, 'error');
        }
        setLoading(false);
    };

    const handleMaterialOpt = async () => {
        setLoading(true);
        addLog("Running FIFO Material Optimization...");
        try {
            const res = await optimizeMaterial({ type: 'FR4-Core', quantity: 50, tg_rating: 170 });
            setMaterialPlan(res);
            addLog("Material Plan Optimized.", 'success');
        } catch (err) { addLog(err.message, 'error'); }
        setLoading(false);
    };

    const handleProcessSim = async () => {
        setLoading(true);
        addLog("Initializing Digital Twin Process Simulation...");
        try {
            const etch = await controlEtching({ copper_weight_oz: 1.0, chemical_concentration_pct: 85 });
            setEtchingParams(etch);
            addLog(`Etching: Conveyor ${etch.control_actions?.conveyor_speed_m_min}m/min`, 'success');

            const lam = await predictLamination({ material_type: 'FR4-Standard', layer_count: 6 });
            setLaminationScaling(lam);
            addLog(`Lamination Scaling: X=${lam.scaling_factors?.x_comp}mils`, 'success');
        } catch (err) { addLog(err.message, 'error'); }
        setLoading(false);
    };

    const handleVisionUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setVisionPreview(URL.createObjectURL(file));
        setLoading(true);
        addLog(`Vision AI analyzing: ${file.name}...`);
        try {
            const res = await classifyPCB(file);
            setVisionResult(res);
            const severity = res.severity === 'FATAL' ? 'error' : res.severity === 'REPAIRABLE' ? 'warning' : 'success';
            addLog(`Defect: ${res.defect_type} | Action: ${res.recommended_action}`, severity);
        } catch (err) { addLog(err.message, 'error'); }
        setLoading(false);
    };

    const handleDrillCheck = async () => {
        setLoading(true);
        addLog("Analyzing Drill Tool Wear Patterns...");
        try {
            const res = await checkDrillWear("DR-2025-X", 1450);
            setDrillStatus(res);
            const status = res.wear_status === 'CRITICAL' ? 'error' : res.wear_status === 'WARNING' ? 'warning' : 'success';
            addLog(`Drill ${res.drill_id}: ${res.wear_status} (${res.hits}/${res.max_hits} hits)`, status);

            const plate = await optimizePlating({ panel_width_mm: 250, panel_height_mm: 350 });
            setPlatingSetup(plate);
            addLog(`Plating: ${plate.suggested_setup}`, 'success');
        } catch (err) { addLog(err.message, 'error'); }
        setLoading(false);
    };

    const handleETest = async () => {
        setLoading(true);
        addLog("Running 100% Electrical Verification...");
        try {
            // Simulate test results
            const testData = {
                batch_id: "BATCH-2026-001",
                measurements: [
                    { board_id: 1, type: "CONTINUITY", value_ohm: 0.5 },
                    { board_id: 2, type: "CONTINUITY", value_ohm: 0.3 },
                    { board_id: 3, type: "ISOLATION", value_ohm: 1000000000 },
                    { board_id: 4, type: "CONTINUITY", value_ohm: 0.8 },
                ]
            };
            const res = await verifyETest(testData);
            setETestResults(res);
            addLog(`E-Test Complete: ${res.yield_rate}% yield`, res.status === 'PASS' ? 'success' : 'warning');
        } catch (err) { addLog(err.message, 'error'); }
        setLoading(false);
    };

    const handleGenerateCoc = async () => {
        setLoading(true);
        addLog("Generating Certificate of Conformity...");
        try {
            const cert = await generateCertificate({
                batch_id: "BATCH-2026-001",
                customer: "TechCorp Industries",
                part_number: "PCB-ML6-001"
            });
            setCoc(cert);
            addLog(`CoC Generated: ${cert.certificate_id}`, 'success');
        } catch (err) { addLog(err.message, 'error'); }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
            {/* ============== HERO HEADER ============== */}
            <div className="relative mb-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-cyan-900/20 to-emerald-900/30 rounded-3xl" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 rounded-3xl" />

                <div className="relative z-10 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="p-4 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl shadow-2xl shadow-purple-500/30">
                                <Factory className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                PCB Factory <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
                            </h2>
                            <p className="text-slate-400 flex items-center gap-2">
                                <Wifi className="w-4 h-4 text-emerald-400" />
                                5-Phase Autonomous Production Control
                            </p>
                        </div>
                    </div>

                    {/* Live Stats Mini Cards */}
                    <div className="flex gap-3">
                        <LiveStatCard icon={Package} label="Panels Today" value={liveStats.panelsProduced} unit="" trend={5} color="purple" pulse />
                        <LiveStatCard icon={TrendingUp} label="Yield Rate" value={liveStats.yieldRate.toFixed(1)} unit="%" color="emerald" />
                        <LiveStatCard icon={Clock} label="Cycle Time" value={liveStats.avgCycleTime.toFixed(1)} unit="min" color="cyan" />
                        <LiveStatCard icon={Cpu} label="Active Lines" value={liveStats.activeMachines} unit="/8" color="amber" />
                    </div>
                </div>
            </div>

            {/* ============== PROCESS FLOW TIMELINE ============== */}
            <div className="mb-6 p-4 bg-slate-900/40 backdrop-blur rounded-2xl border border-white/5">
                <ProcessFlowTimeline activePhase={activePhase} onPhaseClick={setActivePhase} />
            </div>

            {/* ============== MAIN CONTENT GRID ============== */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">

                {/* Main Panel (3 cols) */}
                <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">

                    {/* ============== PHASE 1: DATA ENGINEERING ============== */}
                    {activePhase === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Gerber Upload */}
                                <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <CircuitBoard className="w-5 h-5 text-purple-400" />
                                        AI-Driven Gerber Analysis
                                    </h3>
                                    <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-purple-500/50 transition-all duration-300 group">
                                        <input type="file" onChange={handleGerberUpload} className="hidden" id="gerber-upload" />
                                        <label htmlFor="gerber-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                            <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                                                <Upload className="w-8 h-8 text-purple-400" />
                                            </div>
                                            <span className="text-slate-400 group-hover:text-white transition-colors">Drop Gerber Files (RS-274X)</span>
                                            <span className="text-xs text-slate-600">Auto-generates Engineering Questions</span>
                                        </label>
                                    </div>

                                    {gerberResult && (
                                        <div className="mt-4 p-4 bg-black/30 rounded-xl border border-purple-500/20 animate-in fade-in duration-300">
                                            <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="font-semibold">Analysis Complete</span>
                                            </div>
                                            <pre className="text-xs text-slate-400 overflow-x-auto max-h-32">{JSON.stringify(gerberResult.analysis, null, 2)}</pre>
                                            {gerberResult.engineering_questions && (
                                                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                                    <div className="text-amber-400 text-sm font-semibold flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        EQ Required: {gerberResult.engineering_questions.id}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Material Inventory */}
                                <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-cyan-400" />
                                        Material Inventory (FIFO)
                                    </h3>

                                    <div className="space-y-3 mb-4">
                                        {['FR4-Core TG170', 'Prepreg 1080', 'Copper 1oz'].map((mat, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                                                <span className="text-slate-300 text-sm">{mat}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className={`px-2 py-0.5 rounded text-xs ${i === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                        {i === 1 ? '45 days left' : 'OK'}
                                                    </div>
                                                    <span className="text-slate-500 text-xs">{[120, 85, 200][i]} sheets</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleMaterialOpt}
                                        disabled={loading}
                                        className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 
                                            rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/20 
                                            transition-all duration-300 flex items-center justify-center gap-2
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                        Optimize Allocation
                                    </button>

                                    {materialPlan && (
                                        <div className="mt-4 p-3 bg-black/30 rounded-lg border border-cyan-500/20 text-xs text-cyan-300 font-mono">
                                            {JSON.stringify(materialPlan, null, 2)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3D Layer Preview */}
                            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-amber-400" />
                                    PCB Layer Stackup Preview
                                </h3>
                                <PCBLayerVisualization layers={6} activePhase={activePhase} />
                            </div>
                        </div>
                    )}

                    {/* ============== PHASE 2: PROCESS CONTROL ============== */}
                    {activePhase === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-amber-400" />
                                        Digital Twin Process Control
                                    </h3>
                                    <button
                                        onClick={handleProcessSim}
                                        disabled={loading}
                                        className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 
                                            rounded-lg text-white font-semibold shadow-lg shadow-amber-500/20 
                                            transition-all duration-300 flex items-center gap-2"
                                    >
                                        <Play className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                                        Run Simulation
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {/* Etching Line */}
                                    <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FlaskConical className="w-5 h-5 text-emerald-400" />
                                            <span className="font-semibold text-white">Etching Line</span>
                                        </div>
                                        <div className="space-y-4">
                                            <AnimatedGauge
                                                value={etchingParams?.control_actions?.conveyor_speed_m_min || 2.5}
                                                max={5}
                                                label="Conveyor Speed"
                                                unit="m/min"
                                                color="emerald"
                                            />
                                            <div className="text-center">
                                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${etchingParams?.control_actions?.oxide_safety_check === 'PASS'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    Oxide Layer: {etchingParams?.control_actions?.oxide_safety_check || 'READY'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lamination Press */}
                                    <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Thermometer className="w-5 h-5 text-red-400" />
                                            <span className="font-semibold text-white">Hot Press</span>
                                        </div>
                                        <div className="space-y-4">
                                            <AnimatedGauge
                                                value={185}
                                                max={220}
                                                label="Temperature"
                                                unit="°C"
                                                color="red"
                                            />
                                            <div className="flex justify-center gap-4 text-xs">
                                                <div className="text-center">
                                                    <div className="text-cyan-400 font-mono text-lg">{laminationScaling?.scaling_factors?.x_comp || '--'}</div>
                                                    <div className="text-slate-500">X Comp (mils)</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-cyan-400 font-mono text-lg">{laminationScaling?.scaling_factors?.y_comp || '--'}</div>
                                                    <div className="text-slate-500">Y Comp (mils)</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chemical Bath */}
                                    <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Activity className="w-5 h-5 text-cyan-400" />
                                            <span className="font-semibold text-white">Chemical Bath</span>
                                        </div>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'pH Level', value: 7.2, target: '7.0-7.5', status: 'ok' },
                                                { label: 'Cu Concentration', value: 85, target: '80-90%', status: 'ok' },
                                                { label: 'Temp', value: 52, target: '50-55°C', status: 'ok' },
                                            ].map((param, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                                                    <span className="text-xs text-slate-400">{param.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-mono text-white">{param.value}</span>
                                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3D Layer Preview */}
                            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                                <PCBLayerVisualization layers={6} activePhase={activePhase} />
                            </div>
                        </div>
                    )}

                    {/* ============== PHASE 3: VISION AI ============== */}
                    {activePhase === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                    <Microscope className="w-5 h-5 text-purple-400" />
                                    AI-Powered Defect Classification (AOI/AVI)
                                </h3>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Upload & Preview */}
                                    <div className="relative">
                                        <input type="file" onChange={handleVisionUpload} className="hidden" id="vision-upload" accept="image/*" />
                                        <label
                                            htmlFor="vision-upload"
                                            className="block cursor-pointer"
                                        >
                                            <div className="relative aspect-video bg-black/40 rounded-xl border-2 border-dashed border-slate-700 
                                                hover:border-purple-500/50 transition-all duration-300 overflow-hidden group">
                                                {visionPreview ? (
                                                    <>
                                                        <img src={visionPreview} alt="PCB" className="w-full h-full object-contain" />
                                                        {visionResult && (
                                                            <DefectOverlay defects={[{
                                                                type: visionResult.defect_type,
                                                                severity: visionResult.severity,
                                                                bbox: visionResult.bbox
                                                            }]} />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 
                                                            transition-opacity flex items-center justify-center">
                                                            <Upload className="w-8 h-8 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <Eye className="w-12 h-12 text-purple-400/50 mb-3" />
                                                        <span className="text-slate-500">Upload PCB Scan Image</span>
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    </div>

                                    {/* Results Panel */}
                                    <div className="space-y-4">
                                        {visionResult ? (
                                            <>
                                                {/* Main Result */}
                                                <div className={`p-5 rounded-xl border ${visionResult.severity === 'FATAL'
                                                    ? 'bg-red-900/20 border-red-500/30'
                                                    : visionResult.severity === 'REPAIRABLE'
                                                        ? 'bg-amber-900/20 border-amber-500/30'
                                                        : 'bg-emerald-900/20 border-emerald-500/30'
                                                    }`}>
                                                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Detected Defect</div>
                                                    <div className={`text-3xl font-bold mb-2 ${visionResult.severity === 'FATAL' ? 'text-red-400' :
                                                        visionResult.severity === 'REPAIRABLE' ? 'text-amber-400' : 'text-emerald-400'
                                                        }`}>
                                                        {visionResult.defect_type}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${visionResult.severity === 'FATAL' ? 'bg-red-500' :
                                                                    visionResult.severity === 'REPAIRABLE' ? 'bg-amber-500' : 'bg-emerald-500'
                                                                    }`}
                                                                style={{ width: `${visionResult.confidence * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-slate-400">{Math.round(visionResult.confidence * 100)}%</span>
                                                    </div>
                                                </div>

                                                {/* Action Card */}
                                                <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                                    <div className="text-xs text-slate-500 uppercase mb-2">Recommended Action</div>
                                                    <div className="flex items-center gap-3">
                                                        {visionResult.severity === 'FATAL' ? (
                                                            <AlertCircle className="w-6 h-6 text-red-400" />
                                                        ) : (
                                                            <Settings className="w-6 h-6 text-amber-400" />
                                                        )}
                                                        <span className="text-white font-semibold">{visionResult.recommended_action}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-500">
                                                Upload an image to analyze
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Defect Legend */}
                            <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                                <div className="flex items-center gap-6 justify-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span className="text-slate-400">FATAL (Scrap)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <span className="text-slate-400">REPAIRABLE (Manual)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span className="text-slate-400">WARNING (Inspect)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============== PHASE 4: DRILL & PLATING ============== */}
                    {activePhase === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Drill Management */}
                                <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-amber-400" />
                                        Drill Tool Management
                                    </h3>

                                    <button
                                        onClick={handleDrillCheck}
                                        disabled={loading}
                                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 
                                            rounded-xl text-white font-semibold shadow-lg shadow-amber-500/20 
                                            transition-all mb-4 flex items-center justify-center gap-2"
                                    >
                                        <Activity className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                                        Run Wear Analysis
                                    </button>

                                    {drillStatus && (
                                        <div className="space-y-4">
                                            <div className={`p-4 rounded-xl border ${drillStatus.wear_status === 'CRITICAL' ? 'bg-red-900/20 border-red-500/30' :
                                                drillStatus.wear_status === 'WARNING' ? 'bg-amber-900/20 border-amber-500/30' :
                                                    'bg-emerald-900/20 border-emerald-500/30'
                                                }`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-slate-400 text-sm">Drill ID</span>
                                                    <span className="text-white font-mono">{drillStatus.drill_id}</span>
                                                </div>
                                                <div className="mb-2">
                                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                        <span>Wear Progress</span>
                                                        <span>{drillStatus.hits}/{drillStatus.max_hits} hits</span>
                                                    </div>
                                                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${drillStatus.wear_status === 'CRITICAL' ? 'bg-red-500' :
                                                                drillStatus.wear_status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                                                                }`}
                                                            style={{ width: `${(drillStatus.hits / drillStatus.max_hits) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className={`text-center py-2 rounded-lg text-sm font-semibold ${drillStatus.wear_status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                                                    drillStatus.wear_status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-emerald-500/20 text-emerald-400'
                                                    }`}>
                                                    Action: {drillStatus.action}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Plating Optimization */}
                                <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Gauge className="w-5 h-5 text-cyan-400" />
                                        Plating Uniformity
                                    </h3>

                                    {platingSetup ? (
                                        <div className="space-y-4">
                                            <div className="text-center p-6 bg-black/30 rounded-xl">
                                                <div className="text-5xl font-bold text-cyan-400 mb-2">
                                                    {platingSetup.predicted_uniformity_score}%
                                                </div>
                                                <div className="text-slate-400 text-sm">Predicted Uniformity</div>
                                            </div>
                                            <div className="p-4 bg-slate-800/50 rounded-lg">
                                                <div className="text-xs text-slate-500 mb-1">Panel Dimensions</div>
                                                <div className="text-white font-mono">{platingSetup.panel_dims}</div>
                                            </div>
                                            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                                                <div className="text-xs text-cyan-400 mb-1">Recommended Setup</div>
                                                <div className="text-white text-sm">{platingSetup.suggested_setup}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-48 flex items-center justify-center text-slate-500">
                                            Run drill check to see plating analysis
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3D Preview */}
                            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                                <PCBLayerVisualization layers={6} activePhase={activePhase} />
                            </div>
                        </div>
                    )}

                    {/* ============== PHASE 5: COMPLIANCE ============== */}
                    {activePhase === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                            <div className="bg-gradient-to-br from-slate-900/80 to-emerald-900/20 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/20">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                    Final Verification & Certification
                                </h3>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* E-Test */}
                                    <div className="space-y-4">
                                        <button
                                            onClick={handleETest}
                                            disabled={loading}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold 
                                                border border-white/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Radio className="w-4 h-4" />
                                            Run Electrical Test
                                        </button>

                                        {eTestResults && (
                                            <div className={`p-4 rounded-xl border ${eTestResults.status === 'PASS' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-amber-900/20 border-amber-500/30'
                                                }`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-slate-400 text-sm">Status</span>
                                                    <span className={`font-bold ${eTestResults.status === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        {eTestResults.status}
                                                    </span>
                                                </div>
                                                <div className="text-center py-3">
                                                    <div className="text-4xl font-bold text-white mb-1">{eTestResults.yield_rate}%</div>
                                                    <div className="text-slate-400 text-sm">Yield Rate</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* CoC Generator */}
                                    <div className="space-y-4">
                                        <button
                                            onClick={handleGenerateCoc}
                                            disabled={loading}
                                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 
                                                rounded-xl text-white font-semibold shadow-lg shadow-emerald-500/20 
                                                transition-all flex items-center justify-center gap-2"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            Generate Certificate
                                        </button>

                                        {coc && (
                                            <div className="p-4 bg-black/30 rounded-xl border border-emerald-500/20">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-semibold">Certificate of Conformity</div>
                                                        <div className="text-xs text-emerald-400">{coc.certificate_id}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Customer</span>
                                                        <span className="text-white">{coc.customer}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Part #</span>
                                                        <span className="text-white font-mono">{coc.part_number}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Issued</span>
                                                        <span className="text-white">{new Date(coc.issue_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <button className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm 
                                                    flex items-center justify-center gap-2 transition-colors">
                                                    <Download className="w-4 h-4" />
                                                    Export PDF
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ============== AUTOMATION LOG PANEL ============== */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Workflow className="w-4 h-4" />
                            Automation Log
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-slate-500">Live</span>
                        </div>
                    </div>

                    <div className="flex-1 bg-black/50 rounded-xl p-3 font-mono text-xs overflow-y-auto custom-scrollbar border border-white/5">
                        {loading && (
                            <div className="text-purple-400 animate-pulse mb-2 flex items-center gap-2">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Processing...
                            </div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1.5 text-slate-300 border-b border-white/5 pb-1 last:border-0 hover:text-white transition-colors">
                                {log}
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="text-slate-600 italic flex items-center gap-2">
                                <Radio className="w-3 h-3" />
                                System Ready. Awaiting commands...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PCBManufacturing;
