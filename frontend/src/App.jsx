import React, { useState } from 'react';
import UploadZone from './components/UploadZone';
import LogParser from './components/LogParser';
import AnalysisResult from './components/AnalysisResult';
import ChatInterface from './components/ChatInterface';
import ChargingAnalysis from './components/ChargingAnalysis';

import FleetMonitor from './components/FleetMonitor';
import VisualIntelligence from './components/VisualIntelligence';
import PCBManufacturing from './components/PCBManufacturing';
import HomePage from './components/HomePage';
import { Microscope, Activity, Cpu, Monitor, Terminal, Home, Layers } from 'lucide-react';

function App() {
    const [logResult, setLogResult] = useState(null);
    const [activeWorkspace, setActiveWorkspace] = useState('home'); // 'home', 'visual', 'logs', 'sim', 'fleet'
    const [agingMetrics, setAgingMetrics] = useState(null);
    const [alertLevel, setAlertLevel] = useState('normal'); // 'normal', 'critical'
    const [isAgentOpen, setIsAgentOpen] = useState(false); // UI State for Layout Occlusion Fix

    // ADK Standard: Formal Agent State Object
    const agentState = {
        session_id: "demo-session-001",
        workspace: {
            active_tab: activeWorkspace,
            is_loading: false,
            alert_level: alertLevel
        },
        context: {
            // Grounding Data
            log_analysis: logResult,
            telemetry: agingMetrics
        }
    };

    // This function allows the Agent (ChatInterface) to change the workspace view
    const handleAgentAction = (action) => {
        if (action === 'show_home') setActiveWorkspace('home');
        if (action === 'show_visual') setActiveWorkspace('visual');
        if (action === 'show_logs') setActiveWorkspace('logs');
        if (action === 'show_sim') setActiveWorkspace('sim');
        if (action === 'show_fleet') setActiveWorkspace('fleet');
        if (action === 'show_pcb') setActiveWorkspace('pcb');
        // 'show_visual_scout' now maps to the 'visual' workspace as it's merged
        if (action === 'show_visual_scout') setActiveWorkspace('visual');

        // Safety Actions
        if (action === 'trigger_red_alert') setAlertLevel('critical');
        if (action === 'clear_alert') setAlertLevel('normal');
    };

    return (
        <div className="h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col font-sans selection:bg-indigo-500/30 relative">

            {/* RED ALERT OVERLAY */}
            {alertLevel === 'critical' && (
                <div className="fixed inset-0 z-50 pointer-events-none animate-pulse">
                    <div className="absolute inset-0 bg-red-500/20 mix-blend-overlay"></div>
                    <div className="absolute inset-0 border-[20px] border-red-500/50 box-border"></div>
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black text-3xl px-8 py-4 rounded-b-xl shadow-[0_0_50px_rgba(220,38,38,0.8)] border border-red-400">
                        ⚠️ CORE STABILITY CRITICAL ⚠️
                    </div>
                </div>
            )}

            {/* Minimal Header - Neutral Cyber Industrial */}
            <header className={`h-14 border-b transition-colors duration-500 flex items-center justify-between px-6 shrink-0 z-20 ${alertLevel === 'critical' ? 'bg-red-950/90 border-red-500/50' : 'bg-slate-950/80 border-white/5 backdrop-blur-md'}`}>
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
                        <Cpu className="text-white w-4 h-4" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white/90">
                        BatteryForge<span className="text-slate-500 font-light">AI</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold ml-2 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                        Online
                    </span>
                </div>
                <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-white/5">
                    {/* Manual Overrides / Context Switchers */}
                    <button onClick={() => setActiveWorkspace('home')} className={`p-1.5 rounded-md transition-all ${activeWorkspace === 'home' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`} title="Home"><Home className="w-4 h-4" /></button>
                    <button onClick={() => setActiveWorkspace('visual')} className={`p-1.5 rounded-md transition-all ${activeWorkspace === 'visual' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`} title="Visual Intelligence"><Microscope className="w-4 h-4" /></button>
                    <button onClick={() => setActiveWorkspace('logs')} className={`p-1.5 rounded-md transition-all ${activeWorkspace === 'logs' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`} title="Logs"><Terminal className="w-4 h-4" /></button>
                    <button onClick={() => setActiveWorkspace('sim')} className={`p-1.5 rounded-md transition-all ${activeWorkspace === 'sim' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`} title="Simulations"><Activity className="w-4 h-4" /></button>
                    <button onClick={() => setActiveWorkspace('fleet')} className={`p-1.5 rounded-md transition-all ${activeWorkspace === 'fleet' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`} title="Fleet Monitor"><Monitor className="w-4 h-4" /></button>
                    <button onClick={() => setActiveWorkspace('pcb')} className={`p-1.5 rounded-md transition-all ${activeWorkspace === 'pcb' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`} title="PCB Factory"><Layers className="w-4 h-4" /></button>
                </div>
            </header>

            {/* Split Screen Layout */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* FLOATING AGENT (Result of UI Redesign) */}
                {/* We pass the state setter down so ChatInterface can control it, but App controls the layout */}
                <ChatInterface
                    onAction={handleAgentAction}
                    agentState={agentState}
                    externalOpenState={isAgentOpen}
                    setExternalOpenState={setIsAgentOpen}
                />

                {/* MAIN WORKSPACE */}
                {/* Dynamically adjust margin when agent is open to prevent occlusion */}
                <main
                    className={`flex-1 bg-gradient-to-br from-slate-950 to-slate-900 p-6 overflow-y-auto relative transition-all duration-300 ease-in-out ${isAgentOpen ? 'mr-[460px]' : 'mr-0'}`}
                >
                    {/* Subtle grid pattern for industrial feel */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto h-full flex flex-col relative z-0">

                        {/* HOME DASHBOARD */}
                        {activeWorkspace === 'home' && (
                            <HomePage onNavigate={setActiveWorkspace} />
                        )}

                        {activeWorkspace === 'visual' && (
                            <VisualIntelligence />
                        )}

                        {activeWorkspace === 'logs' && (
                            <div className="animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-white/10 text-amber-400 shadow-lg"><Terminal className="w-6 h-6" /></div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Log Analysis</h2>
                                        <p className="text-sm text-slate-400">Semantic Parsing of BMS Error Logs</p>
                                    </div>
                                </div>
                                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-2xl">
                                    <LogParser onResult={setLogResult} context={agingMetrics} />
                                    <AnalysisResult data={logResult} type="log" />
                                </div>
                            </div>
                        )}

                        {activeWorkspace === 'sim' && (
                            <div className="animate-in fade-in zoom-in-95 duration-500 h-full">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-white/10 text-emerald-400 shadow-lg"><Cpu className="w-6 h-6" /></div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Simulation Laboratory</h2>
                                        <p className="text-sm text-slate-400">Generative AI & Aging Prediction Models</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-8 pb-10">
                                    <ChargingAnalysis onAnalysisComplete={setAgingMetrics} />

                                </div>
                            </div>
                        )}

                        {activeWorkspace === 'fleet' && (
                            <div className="animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-white/10 text-rose-400 shadow-lg"><Monitor className="w-6 h-6" /></div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Global Fleet Monitor</h2>
                                        <p className="text-sm text-slate-400">Real-time Telemetry & Health Status</p>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <FleetMonitor />
                                </div>
                            </div>
                        )}

                        {activeWorkspace === 'pcb' && (
                            <PCBManufacturing />
                        )}
                    </div>
                </main>
            </div >
        </div >
    )
}

export default App;
