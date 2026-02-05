import React, { useState, useRef, useEffect } from 'react';
import {
    Send, User, Bot, Sparkles, Book, Mic, Activity, AlertTriangle, Shield,
    CheckCircle, Clock, Upload, Paperclip, Battery, Thermometer, Zap, X,
    Play, XCircle, Wrench
} from 'lucide-react';
import { sendChatMessage, queryRAG, executeFleetAction } from '../api';
import KnowledgeBaseManager from './KnowledgeBaseManager';

// ============================================================
// PHASE 6: UI COMPONENTS
// ============================================================

// Fleet Status Card - Shows live fleet metrics in chat
const FleetStatusCard = ({ health, criticalCount, thermalSpread, activePacks }) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-3 border border-slate-700/50 my-2">
        <div className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Live Fleet Status
        </div>
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/50 rounded-lg p-2 text-center">
                <div className={`text-lg font-bold ${health > 90 ? 'text-emerald-400' : health > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {health?.toFixed(1) || '--'}%
                </div>
                <div className="text-[10px] text-slate-500 uppercase">Health</div>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-2 text-center">
                <div className={`text-lg font-bold ${criticalCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {criticalCount || 0}
                </div>
                <div className="text-[10px] text-slate-500 uppercase">Critical</div>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-orange-400">
                    {thermalSpread?.toFixed(1) || '--'}°C
                </div>
                <div className="text-[10px] text-slate-500 uppercase">Δ Temp</div>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-blue-400">
                    {activePacks || '--'}
                </div>
                <div className="text-[10px] text-slate-500 uppercase">Active</div>
            </div>
        </div>
    </div>
);

// Action Buttons - For executing suggested actions
const ActionButtons = ({ actions, onExecute, onReject }) => (
    <div className="flex flex-wrap gap-2 mt-2">
        {actions.map((action, idx) => (
            <div key={idx} className="flex gap-1">
                <button
                    onClick={() => onExecute(action)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors"
                >
                    <CheckCircle className="w-3 h-3" />
                    {action.label || 'Approve'}
                </button>
                <button
                    onClick={() => onReject(action)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                >
                    <XCircle className="w-3 h-3" />
                    Reject
                </button>
            </div>
        ))}
    </div>
);

// Fleet Context Bar - Shows when on Fleet workspace
const FleetContextBar = ({ health, alerts, thermalSpread }) => (
    <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/80 border-b border-slate-700 text-xs">
        <div className="flex items-center gap-1 text-slate-400">
            <Battery className="w-3 h-3" />
            <span className={health > 90 ? 'text-emerald-400' : health > 70 ? 'text-yellow-400' : 'text-red-400'}>
                {health?.toFixed(1)}%
            </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
            <Thermometer className="w-3 h-3" />
            <span className="text-orange-400">Δ{thermalSpread?.toFixed(1)}°C</span>
        </div>
        {alerts > 0 && (
            <div className="flex items-center gap-1 text-red-400 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                <span>{alerts} alerts</span>
            </div>
        )}
    </div>
);

// Proactive Alert Card - For alerts injected from FleetMonitor
const ProactiveAlertCard = ({ alert, onAction, onDismiss }) => (
    <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-3 my-2 animate-in slide-in-from-top-2">
        <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0 animate-pulse" />
                <div>
                    <div className="text-sm text-red-200">{alert.message}</div>
                    {alert.suggested_action && (
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => onAction(alert.suggested_action)}
                                className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                            >
                                <Shield className="w-3 h-3" />
                                {alert.suggested_action.label}
                            </button>
                            <button
                                onClick={() => onDismiss(alert.id)}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={() => onDismiss(alert.id)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
            </button>
        </div>
    </div>
);

const AgentTrace = ({ trace }) => {
    if (!trace || trace.length === 0) return null;

    return (
        <div className="mt-2 text-xs bg-slate-950/50 p-2 rounded border border-slate-800">
            <div className="text-slate-500 mb-2 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>Agent Execution Trace:</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {trace.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        <span className="font-mono">{step.agent}</span>
                        <span className="text-slate-500">→</span>
                        <span>{step.action}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ChatInterface = ({
    onAction,
    agentState,
    externalOpenState,
    setExternalOpenState,
    onTraceUpdate,
    onActivityChange,
    // Phase 1 & 4: Fleet integration props
    activeWorkspace,
    liveFleetData,
    proactiveAlerts = [],
    onClearAlert
}) => {
    // Fallback if not controlled externally
    const [localIsOpen, setLocalIsOpen] = useState(false);

    // Derived state
    const isOpen = externalOpenState !== undefined ? externalOpenState : localIsOpen;
    const setIsOpen = setExternalOpenState || setLocalIsOpen;

    const [messages, setMessages] = useState([
        { role: 'model', content: "Hello! I'm your BatteryForge Assistant. I can help you with defects, charging analysis, or start a full pack audit. When on the Fleet Monitor, I have real-time awareness of your battery fleet!" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [ragContext, setRagContext] = useState(null);
    const [activeWorkflow, setActiveWorkflow] = useState(null);
    const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
    const [pendingActions, setPendingActions] = useState([]); // Phase 3: Actions awaiting confirmation
    const [executingAction, setExecutingAction] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Phase 4: Inject proactive alerts as system messages
    useEffect(() => {
        if (proactiveAlerts && proactiveAlerts.length > 0) {
            const newAlerts = proactiveAlerts.filter(alert =>
                !messages.some(msg => msg.alertId === alert.id)
            );
            if (newAlerts.length > 0) {
                setMessages(prev => [
                    ...prev,
                    ...newAlerts.map(alert => ({
                        role: 'system',
                        content: alert.message,
                        isProactive: true,
                        alertId: alert.id,
                        alert: alert
                    }))
                ]);
            }
        }
    }, [proactiveAlerts]);

    // Phase 3: Handle action execution
    const handleExecuteAction = async (action) => {
        setExecutingAction(true);
        try {
            const result = await executeFleetAction(
                action.type,
                { pack_id: action.pack_id, reason: action.reason || 'user_request' },
                true // confirmed
            );

            setMessages(prev => [...prev, {
                role: 'model',
                content: result.status === 'executed'
                    ? `✅ **Action Executed:** ${result.message}`
                    : `⚠️ **Action Result:** ${result.message}`,
                isActionResult: true
            }]);

            // Clear pending actions for this action
            setPendingActions(prev => prev.filter(a => a.pack_id !== action.pack_id));
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'model',
                content: `❌ **Action Failed:** ${error.message}`,
                isActionResult: true
            }]);
        } finally {
            setExecutingAction(false);
        }
    };

    const handleRejectAction = (action) => {
        setMessages(prev => [...prev, {
            role: 'model',
            content: `ℹ️ Action "${action.type}" for ${action.pack_id} was rejected by user.`,
            isActionResult: true
        }]);
        setPendingActions(prev => prev.filter(a => a.pack_id !== action.pack_id));
    };

    const handleAlertAction = async (action) => {
        await handleExecuteAction(action);
        if (onClearAlert) {
            onClearAlert(action.id);
        }
    };

    const handleDismissAlert = (alertId) => {
        if (onClearAlert) {
            onClearAlert(alertId);
        }
        // Also remove from messages
        setMessages(prev => prev.filter(msg => msg.alertId !== alertId));
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        let userMsg = input;
        setInput('');

        // Optimistic UI update
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        // Activate agent trace
        if (onActivityChange) onActivityChange(true);

        try {
            // 1. RAG Check (Lightweight)
            if (userMsg.toLowerCase().includes('?') && !userMsg.toLowerCase().includes('audit')) {
                try {
                    const ragRes = await queryRAG(userMsg);
                    if (ragRes.results && ragRes.results.length > 0) {
                        setRagContext(ragRes.results[0]);
                    }
                } catch (err) {
                    console.warn("RAG info fetch failed", err);
                }
            }

            // 2. Identify if this is a Workflow Trigger (Client-side heuristic for immediate UI feedback)
            if (userMsg.toLowerCase().includes('audit') || userMsg.toLowerCase().includes('monitor')) {
                setActiveWorkflow("Initializing Agent Workflow...");
            }

            // 3. Send to Agent System
            // Now returns rich object: { response, actions, trace, agent_mode }
            const result = await sendChatMessage(userMsg, messages, agentState, null);

            // Update agent trace panel with real data
            if (result.trace && result.trace.length > 0 && onTraceUpdate) {
                const formattedTraces = result.trace.map((step, idx) => ({
                    agent: step.agent || 'unknown',
                    agent_name: step.agent_name || step.agent,
                    action: step.action || step.message || 'Processing...',
                    tools: step.tools || [],
                    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }));
                onTraceUpdate(formattedTraces);
            }

            // Handle Actions
            if (result.actions) {
                result.actions.forEach(action => {
                    if (action.type === 'navigate') {
                        if (action.target === 'visual') onAction('show_visual');
                        if (action.target === 'logs') onAction('show_logs');
                        if (action.target === 'sim') onAction('show_sim');
                        if (action.target === 'fleet') onAction('show_fleet');
                        if (action.target === 'pcb') onAction('show_pcb');
                        if (action.target === 'charging') onAction('show_charging');
                        if (action.target === 'home') onAction('show_home');
                    }
                    if (action.type === 'alert') {
                        if (action.level === 'emergency') onAction('trigger_red_alert');
                        if (action.level === 'clear') onAction('clear_alert');
                    }
                });
            }

            // Special handling if response suggests a workflow started
            if (result.response.includes("PackAuditWorkflow") || result.response.includes("ContinuousMonitor")) {
                setActiveWorkflow("Marathon Agent Active 🏃");
            } else if (result.response.includes("completed") || result.response.includes("finished")) {
                setActiveWorkflow(null);
            }

            // Phase 3 & 6: Parse response for pending actions and fleet data
            let pendingAction = null;
            let fleetData = null;

            // Check for PENDING_ACTION in response (from agent)
            const pendingMatch = result.response.match(/PENDING_ACTION:\s*(\{[\s\S]*?\})/);
            if (pendingMatch) {
                try {
                    pendingAction = JSON.parse(pendingMatch[1]);
                } catch (e) {
                    console.warn("Failed to parse pending action", e);
                }
            }

            // If context has fleet data and this seems like a fleet query, attach it
            if (agentState?.context?.fleet &&
                (userMsg.toLowerCase().includes('fleet') ||
                    userMsg.toLowerCase().includes('pack') ||
                    userMsg.toLowerCase().includes('health') ||
                    userMsg.toLowerCase().includes('status'))) {
                fleetData = agentState.context.fleet;
            }

            setMessages(prev => [...prev, {
                role: 'model',
                content: result.response,
                trace: result.trace,
                pendingAction: pendingAction,
                fleetData: fleetData
            }]);

            // Track pending actions
            if (pendingAction && pendingAction.requires_confirmation) {
                setPendingActions(prev => [...prev, pendingAction]);
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please ensure the backend is running." }]);
            setActiveWorkflow(null);
        } finally {
            setLoading(false);
            if (onActivityChange) onActivityChange(false);
        }
    };

    // Formatter for Code, Markdown, and Agent Artifacts
    const formatMessage = (msg) => {
        if (!msg) return null;
        const text = typeof msg === 'string' ? msg : msg.content;

        // Render trace if available
        const traceElement = msg.trace ? <AgentTrace trace={msg.trace} /> : null;

        // 1. Handle Code Blocks
        const parts = text.split(/(```[\s\S]*?```)/g);

        const content = parts.map((part, i) => {
            if (part.startsWith('```') && part.endsWith('```')) {
                const codeContent = part.slice(3, -3).replace(/^.*\n/, '');
                return (
                    <div key={i} className="bg-slate-950 p-3 rounded-lg my-2 border border-slate-700 overflow-x-auto">
                        <pre className="text-xs font-mono text-indigo-300 whitespace-pre-wrap">{codeContent}</pre>
                    </div>
                );
            }

            // 2. Standard formatting
            return (
                <span key={i} className="whitespace-pre-wrap">
                    {part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((subPart, j) => {
                        if (subPart.startsWith('**') && subPart.endsWith('**')) {
                            return <strong key={j} className="text-white font-bold">{subPart.slice(2, -2)}</strong>;
                        }
                        if (subPart.startsWith('`') && subPart.endsWith('`')) {
                            return <code key={j} className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 font-mono text-xs">{subPart.slice(1, -1)}</code>;
                        }
                        return subPart;
                    })}
                </span>
            );
        });

        return (
            <div>
                {content}
                {traceElement}
            </div>
        );
    };

    // Minimized State
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/20 transition-all hover:scale-110 z-50 animate-in zoom-in slide-in-from-bottom-5"
            >
                <Bot className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
            </button>
        );
    }

    // Open State
    return (
        <div className="fixed bottom-6 right-6 w-[450px] h-[650px] flex flex-col bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 backdrop-blur-md">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0 bg-slate-950/50 rounded-t-2xl">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-indigo-300">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="font-semibold">AI Commander</h3>
                        {activeWorkspace === 'fleet' && liveFleetData && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                                FLEET AWARE
                            </span>
                        )}
                    </div>
                    {activeWorkflow && (
                        <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>{activeWorkflow}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {ragContext && (
                        <div className="text-xs text-green-400 flex items-center gap-1 bg-green-900/20 px-2 py-1 rounded" title="Knowledge Base Context">
                            <Book className="w-3 h-3" />
                        </div>
                    )}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Phase 6: Fleet Context Bar - Shows when on Fleet tab with live data */}
            {activeWorkspace === 'fleet' && liveFleetData && (
                <FleetContextBar
                    health={liveFleetData.data?.fleet_metrics?.avg_health}
                    alerts={liveFleetData.data?.red_list?.filter(p => p.status === 'CRITICAL').length || 0}
                    thermalSpread={liveFleetData.data?.fleet_metrics?.thermal_spread}
                />
            )}

            {/* Knowledge Base Panel */}
            {showKnowledgeBase && (
                <div className="border-b border-slate-800 p-4 bg-slate-950/80 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Battery Manuals
                        </h4>
                        <button
                            onClick={() => setShowKnowledgeBase(false)}
                            className="text-slate-400 hover:text-white text-sm"
                        >
                            ✕
                        </button>
                    </div>
                    <KnowledgeBaseManager />
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                    // Phase 4: Handle proactive alert messages
                    if (msg.isProactive && msg.alert) {
                        return (
                            <ProactiveAlertCard
                                key={idx}
                                alert={msg.alert}
                                onAction={handleAlertAction}
                                onDismiss={handleDismissAlert}
                            />
                        );
                    }

                    // Phase 6: Handle system messages differently
                    if (msg.role === 'system') {
                        return (
                            <div key={idx} className="flex justify-center">
                                <div className="bg-slate-800/50 text-slate-400 text-xs px-3 py-1 rounded-full border border-slate-700">
                                    {msg.content}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : msg.isActionResult ? 'bg-emerald-700' : 'bg-slate-700'}`}>
                                {msg.role === 'user' ? (
                                    <User className="w-5 h-5 text-white" />
                                ) : msg.isActionResult ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-300" />
                                ) : (
                                    <Bot className="w-5 h-5 text-indigo-300" />
                                )}
                            </div>
                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : msg.isActionResult
                                        ? 'bg-emerald-900/30 text-emerald-200 border border-emerald-700/50'
                                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                                }`}>
                                {msg.role === 'user' ? msg.content : formatMessage(msg)}

                                {/* Phase 6: Show fleet status card if response contains fleet data */}
                                {msg.fleetData && (
                                    <FleetStatusCard
                                        health={msg.fleetData.health}
                                        criticalCount={msg.fleetData.critical_count}
                                        thermalSpread={msg.fleetData.thermal_spread}
                                        activePacks={msg.fleetData.active_packs}
                                    />
                                )}

                                {/* Phase 3: Show action buttons if pending confirmation */}
                                {msg.pendingAction && msg.pendingAction.requires_confirmation && (
                                    <ActionButtons
                                        actions={[msg.pendingAction]}
                                        onExecute={handleExecuteAction}
                                        onReject={handleRejectAction}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {activeWorkspace === 'fleet' ? 'Analyzing fleet data...' : 'Multi-agent reasoning...'}
                            </div>
                        </div>
                    </div>
                )}

                {executingAction && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center shrink-0 animate-pulse">
                            <Zap className="w-5 h-5 text-amber-300" />
                        </div>
                        <div className="bg-amber-900/30 rounded-2xl p-3 border border-amber-700/50">
                            <div className="text-xs text-amber-300">Executing action...</div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* RAG Context Snippet */}
            {ragContext && (
                <div className="px-4 py-2 bg-slate-800/80 border-t border-slate-700 text-xs">
                    <p className="text-slate-400 font-semibold mb-1 flex items-center gap-1"><Book className="w-3 h-3" /> Reference: {ragContext.title}</p>
                    <p className="text-slate-500 truncate">{ragContext.content}</p>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        activeWorkspace === 'fleet'
                            ? "Ask about fleet health, critical packs, or run simulations..."
                            : "Ask about maintenance, codes, or safety..."
                    }
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />

                <button
                    type="button"
                    onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
                    className={`p-2 ${showKnowledgeBase ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'} text-white rounded-lg transition-colors border ${showKnowledgeBase ? 'border-indigo-500' : 'border-slate-600'}`}
                    title="Upload Battery Manuals (PDFs)"
                >
                    {showKnowledgeBase ? <Book className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                </button>

                <button
                    type="button"
                    onClick={() => alert("Voice control active. Try saying 'Run audit'.")}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors border border-slate-600"
                    title="Voice Command"
                >
                    <Mic className="w-5 h-5" />
                </button>

                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>

            {/* Status Bar */}
            <div className="h-1 bg-slate-800 w-full flex">
                <div className={`h-full bg-emerald-500 transition-all duration-500 ${loading ? 'w-full animate-pulse' : 'w-0'}`}></div>
            </div>
        </div >
    );
};

export default ChatInterface;
