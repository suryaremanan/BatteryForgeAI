import React from 'react';
import { Cpu, Eye, Zap, Shield, Wrench, Radio } from 'lucide-react';

const AgentTracePanel = ({ traces = [], isActive = false }) => {
    const agentIcons = {
        'commander': Cpu,
        'defect': Eye,
        'charging': Zap,
        'fleet': Radio,
        'safety': Shield,
        'maintenance': Wrench
    };

    const agentColors = {
        'commander': 'from-indigo-500 to-purple-600',
        'defect': 'from-amber-500 to-orange-600',
        'charging': 'from-emerald-500 to-teal-600',
        'fleet': 'from-rose-500 to-pink-600',
        'safety': 'from-red-500 to-rose-700',
        'maintenance': 'from-blue-500 to-cyan-600'
    };

    return (
        <div className="fixed top-20 right-6 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-30 transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center gap-3">
                <div className={`p-1.5 bg-white/20 rounded-lg ${isActive ? 'animate-pulse' : ''}`}>
                    <Cpu className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-sm text-white">Agent Trace</h3>
                    <p className="text-xs text-white/70">ADK Orchestration</p>
                </div>
                {isActive && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-emerald-300 font-semibold">LIVE</span>
                    </div>
                )}
            </div>

            {/* Trace Timeline */}
            <div className="p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {traces.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        <Cpu className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Awaiting agent activity...</p>
                        <p className="text-xs mt-1">Try chatting with BatteryForge AI</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {traces.map((trace, idx) => {
                            const Icon = agentIcons[trace.agent] || Cpu;
                            const colorClass = agentColors[trace.agent] || 'from-slate-500 to-slate-600';

                            return (
                                <div
                                    key={idx}
                                    className="animate-in slide-in-from-right duration-300"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Agent Card */}
                                    <div className={`bg-gradient-to-r ${colorClass} p-3 rounded-lg shadow-lg`}>
                                        <div className="flex items-start gap-2">
                                            <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
                                                <Icon className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h4 className="font-bold text-xs text-white uppercase tracking-wide truncate">
                                                        {trace.agent_name || trace.agent}
                                                    </h4>
                                                    <span className="text-[10px] text-white/70 shrink-0">
                                                        {trace.timestamp}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/90 leading-relaxed">
                                                    {trace.action}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tool Calls (if any) */}
                                    {trace.tools && trace.tools.length > 0 && (
                                        <div className="ml-6 mt-2 space-y-1">
                                            {trace.tools.map((tool, toolIdx) => (
                                                <div
                                                    key={toolIdx}
                                                    className="flex items-center gap-2 text-xs bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/50"
                                                >
                                                    <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                                                    <span className="text-cyan-300 font-mono font-semibold">
                                                        {tool.name}
                                                    </span>
                                                    {tool.result && (
                                                        <span className="text-slate-400 truncate ml-auto">
                                                            {tool.result}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Connection Line to Next Agent */}
                                    {idx < traces.length - 1 && (
                                        <div className="ml-6 h-4 flex items-center">
                                            <div className="w-0.5 h-full bg-gradient-to-b from-slate-600 to-slate-700"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            {traces.length > 0 && (
                <div className="bg-slate-800/50 px-4 py-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                        <span>{traces.length} agent{traces.length !== 1 ? 's' : ''} active</span>
                    </div>
                    <div className="text-slate-500">
                        {traces.reduce((sum, t) => sum + (t.tools?.length || 0), 0)} tool calls
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentTracePanel;
