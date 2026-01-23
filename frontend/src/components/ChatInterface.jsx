import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Book, Mic, Activity, AlertTriangle, Shield, CheckCircle, Clock } from 'lucide-react';
import { sendChatMessage, queryRAG } from '../api';

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

const ChatInterface = ({ onAction, agentState, externalOpenState, setExternalOpenState }) => {
    // Fallback if not controlled externally
    const [localIsOpen, setLocalIsOpen] = useState(false);

    // Derived state
    const isOpen = externalOpenState !== undefined ? externalOpenState : localIsOpen;
    const setIsOpen = setExternalOpenState || setLocalIsOpen;

    const [messages, setMessages] = useState([
        { role: 'model', content: "Hello! I'm your BatteryForge Assistant. I can help you with defects, charging analysis, or start a full pack audit." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [ragContext, setRagContext] = useState(null);
    const [activeWorkflow, setActiveWorkflow] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        let userMsg = input;
        setInput('');

        // Optimistic UI update
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

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

            // Handle Actions
            if (result.actions) {
                result.actions.forEach(action => {
                    if (action.type === 'navigate') {
                        if (action.target === 'visual') onAction('show_visual');
                        if (action.target === 'logs') onAction('show_logs');
                        if (action.target === 'sim') onAction('show_sim');
                        if (action.target === 'fleet') onAction('show_fleet');
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

            setMessages(prev => [...prev, {
                role: 'model',
                content: result.response,
                trace: result.trace
            }]);

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please ensure the backend is running." }]);
            setActiveWorkflow(null);
        } finally {
            setLoading(false);
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
        <div className="fixed bottom-6 right-6 w-[450px] h-[600px] flex flex-col bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 backdrop-blur-md">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0 bg-slate-950/50 rounded-t-2xl">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-indigo-300">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="font-semibold">AI Commander</h3>
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                            {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-300" />}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                            {msg.role === 'user' ? msg.content : formatMessage(msg)}
                        </div>
                    </div>
                ))}

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
                            <div className="text-xs text-slate-500 mt-1">Multi-agent reasoning...</div>
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
                    placeholder="Ask about maintenance, codes, or safety..."
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />

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
