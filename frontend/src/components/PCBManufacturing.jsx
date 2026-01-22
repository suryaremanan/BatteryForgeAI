
import React, { useState } from 'react';
import { Layers, Zap, Eye, Hammer, ShieldCheck, Upload, FileText, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { analyzeGerber, optimizeMaterial, controlEtching, predictLamination, classifyPCB, checkDrillWear, optimizePlating, verifyETest, generateCertificate } from '../api';

const PCBManufacturing = () => {
    const [activeTab, setActiveTab] = useState('phase1');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    // Independent States for each phase to keep it simple
    // Phase 1
    const [gerberResult, setGerberResult] = useState(null);
    const [materialPlan, setMaterialPlan] = useState(null);

    // Phase 2
    const [etchingParams, setEtchingParams] = useState(null);
    const [laminationScaling, setLaminationScaling] = useState(null);

    // Phase 3
    const [visionResult, setVisionResult] = useState(null);

    // Phase 4
    const [drillStatus, setDrillStatus] = useState(null);
    const [platingSetup, setPlatingSetup] = useState(null);

    // Phase 5
    const [coc, setCoc] = useState(null);

    const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    // HANDLERS
    const handleGerberUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        addLog(`Analyzing Gerber: ${file.name}...`);
        try {
            const res = await analyzeGerber(file);
            setGerberResult(res);
            addLog("Gerber Analysis Complete.");
        } catch (err) {
            addLog(`Error: ${err.message}`);
        }
        setLoading(false);
    };

    const handleMaterialOpt = async () => {
        setLoading(true);
        try {
            const res = await optimizeMaterial({ layer_count: 6, tg_rating: 170 });
            setMaterialPlan(res);
            addLog("Material Plan Optimized.");
        } catch (err) { addLog(err.message); }
        setLoading(false);
    };

    const handleProcessSim = async () => {
        setLoading(true);
        try {
            const etch = await controlEtching({ copper_weight_oz: 1.0, chemical_concentration_pct: 85 });
            setEtchingParams(etch);
            const lam = await predictLamination({ material_type: 'FR4', layer_count: 6 });
            setLaminationScaling(lam);
            addLog("Process Simulation Complete.");
        } catch (err) { addLog(err.message); }
        setLoading(false);
    };

    const handleVisionUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        addLog(`Running Vision AI on: ${file.name}...`);
        try {
            // In real flow we'd upload. Here we use the classifyPCB wrapper
            const res = await classifyPCB(file);
            setVisionResult(res);
            addLog(`Defect Detected: ${res.defect_type}`);
        } catch (err) { addLog(err.message); }
        setLoading(false);
    };

    const handleDrillCheck = async () => {
        setLoading(true);
        try {
            const res = await checkDrillWear("DR-2025-X", 1500);
            setDrillStatus(res);
            const plate = await optimizePlating({ panel_width_mm: 200, panel_height_mm: 300 });
            setPlatingSetup(plate);
            addLog("Drill & Plating Checked.");
        } catch (err) { addLog(err.message); }
        setLoading(false);
    };

    const handleFinalTest = async () => {
        setLoading(true);
        try {
            const cert = await generateCertificate({ batch_id: "BATCH-99", passed_count: 48, total_count: 50 });
            setCoc(cert);
            addLog("CoC Generated.");
        } catch (err) { addLog(err.message); }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 shadow-lg">
                    <Layers className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">PCB Fabrication Automation</h2>
                    <p className="text-sm text-slate-400">5-Phase Autonomous Quality Control</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 bg-slate-900/50 p-1.5 rounded-lg border border-white/5 w-fit">
                {[
                    { id: 'phase1', label: '1. Data & Prep', icon: FileText },
                    { id: 'phase2', label: '2. Process', icon: Zap },
                    { id: 'phase3', label: '3. Vision AI', icon: Eye },
                    { id: 'phase4', label: '4. Drill/Plate', icon: Hammer },
                    { id: 'phase5', label: '5. Compliance', icon: ShieldCheck },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Panel */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Phase 1: Data */}
                    {activeTab === 'phase1' && (
                        <div className="space-y-6">
                            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                                <h3 className="text-lg font-semibold text-white mb-4">Automated Gerber Analysis</h3>
                                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors">
                                    <input type="file" onChange={handleGerberUpload} className="hidden" id="gerber-upload" />
                                    <label htmlFor="gerber-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <Upload className="w-8 h-8 text-slate-500" />
                                        <span className="text-slate-400">Drop Gerber Files (RS-274X)</span>
                                    </label>
                                </div>
                                {gerberResult && (
                                    <div className="mt-4 p-4 bg-black/20 rounded-lg border border-green-500/20">
                                        <div className="text-green-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Parsing Complete</div>
                                        <pre className="text-xs text-slate-400 mt-2 overflow-x-auto">{JSON.stringify(gerberResult.analysis, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                                <h3 className="text-lg font-semibold text-white mb-4">Material Inventory Optimization</h3>
                                <button onClick={handleMaterialOpt} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-white border border-white/10">Run FIFO Algorithm</button>
                                {materialPlan && <div className="mt-4 text-xs font-mono text-cyan-400 p-2 bg-black/30 rounded">{JSON.stringify(materialPlan, null, 2)}</div>}
                            </div>
                        </div>
                    )}

                    {/* Phase 2: Process */}
                    {activeTab === 'phase2' && (
                        <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-4">Digital Twin Process Control</h3>
                            <button onClick={handleProcessSim} disabled={loading} className="w-full py-3 bg-purple-600/80 hover:bg-purple-600 rounded-lg text-white font-semibold shadow-lg transition-all flex items-center justify-center gap-2">
                                <Activity className="w-5 h-5" /> Run Simulation (Etch + Lamination)
                            </button>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                                    <h4 className="text-slate-400 text-sm mb-2">Etching Compensation</h4>
                                    {etchingParams ? <div className="text-2xl text-emerald-400 font-mono">{etchingParams.conveyor_speed_m_min} m/min</div> : <div className="text-slate-600">-</div>}
                                </div>
                                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                                    <h4 className="text-slate-400 text-sm mb-2">Scaling Factor</h4>
                                    {laminationScaling ? <div className="text-2xl text-cyan-400 font-mono">X: {laminationScaling.scaling_factor_x}%</div> : <div className="text-slate-600">-</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phase 3: Vision */}
                    {activeTab === 'phase3' && (
                        <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-4">AI Visual Inspection</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors flex flex-col items-center justify-center">
                                    <input type="file" onChange={handleVisionUpload} className="hidden" id="vision-upload" accept="image/*" />
                                    <label htmlFor="vision-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <Eye className="w-8 h-8 text-purple-400" />
                                        <span className="text-slate-400">Upload PCB Scan</span>
                                    </label>
                                </div>
                                <div className="bg-black/40 rounded-xl p-4 flex items-center justify-center border border-white/5">
                                    {visionResult ? (
                                        <div className="text-center">
                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Detected Defect</div>
                                            <div className="text-3xl font-bold text-red-400 mb-2">{visionResult.defect_type || "None"}</div>
                                            <div className="px-3 py-1 bg-red-500/10 text-red-300 rounded-full text-xs border border-red-500/20 inline-block">
                                                Confidence: {Math.round(visionResult.confidence * 100)}%
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-600 text-sm">No analysis result</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phase 4: Drill */}
                    {activeTab === 'phase4' && (
                        <div className="space-y-4">
                            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                                <h3 className="text-lg font-semibold text-white mb-4">Drill & Plating Manager</h3>
                                <button onClick={handleDrillCheck} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white border border-white/10 w-full mb-4">Run Maintenance Check</button>

                                {drillStatus && (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-sm flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5" />
                                        {drillStatus.status_message}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Phase 5: Compliance */}
                    {activeTab === 'phase5' && (
                        <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-emerald-900/20">
                            <h3 className="text-lg font-semibold text-white mb-4">Final Certification</h3>
                            <div className="text-center py-10">
                                <div className="inline-block p-4 bg-emerald-500/10 rounded-full mb-4">
                                    <ShieldCheck className="w-12 h-12 text-emerald-400" />
                                </div>
                                <p className="text-slate-300 mb-6 max-w-md mx-auto">Verify Electrical Tests, Packaging Compliance, and Generate Certificate of Conformity (CoC).</p>
                                <button onClick={handleFinalTest} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold shadow-lg shadow-emerald-500/20 transition-all">
                                    Generate CoC
                                </button>
                                {coc && (
                                    <div className="mt-6 p-4 bg-black/40 rounded-lg border border-emerald-500/30 text-emerald-300 font-mono text-sm">
                                        Certificate ID: {coc.certificate_id} <br />
                                        Status: VERIFIED
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Automation Log */}
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 h-fit backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Automation Events</h3>
                    <div className="bg-black/50 rounded-xl p-4 font-mono text-xs h-[400px] overflow-y-auto border border-white/5 custom-scrollbar">
                        {loading && <div className="text-purple-400 animate-pulse mb-2">{'>'} Processing...</div>}
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1.5 text-slate-300 border-b border-white/5 pb-1 last:border-0">
                                {log}
                            </div>
                        ))}
                        {logs.length === 0 && <div className="text-slate-600 italic">System Ready.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PCBManufacturing;
