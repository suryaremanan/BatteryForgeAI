import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Book, Mic } from 'lucide-react';
import { sendChatMessage, queryRAG } from '../api';

const ChatInterface = ({ onAction, agentState, externalOpenState, setExternalOpenState }) => {
    // Fallback if not controlled externally (though we just wired it up)
    const [localIsOpen, setLocalIsOpen] = useState(false);

    // Derived state
    const isOpen = externalOpenState !== undefined ? externalOpenState : localIsOpen;
    const setIsOpen = setExternalOpenState || setLocalIsOpen;

    const [messages, setMessages] = useState([
        { role: 'model', content: "Hello! I'm your BatteryForge Assistant. I can help you troubleshoot issues or search the knowledge base." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [ragContext, setRagContext] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        let userMsg = input;

        // ADK: Context is now handled by the backend's System Prompter via agentState

        setInput('');
        // Show original clean message to user, but send enriched message to backend
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        setLoading(true);

        try {
            // 1. First check RAG if it looks like a question
            if (userMsg.toLowerCase().includes('?') || userMsg.toLowerCase().includes('how') || userMsg.toLowerCase().includes('error')) {
                try {
                    const ragRes = await queryRAG(userMsg);
                    if (ragRes.results && ragRes.results.length > 0) {
                        setRagContext(ragRes.results[0]);
                    }
                } catch (err) {
                    console.warn("RAG failed", err);
                }
            }

            // 2. Send to Chat (with ADK Agent State)
            // Signature: message, history, context, image
            const result = await sendChatMessage(userMsg, messages, agentState, null);
            setMessages(prev => [...prev, { role: 'model', content: result.response }]);

            // Check for Agent Actions in response
            if (result.response.includes('[VIEW: VISUAL]')) onAction('show_visual');
            if (result.response.includes('[VIEW: LOGS]')) onAction('show_logs');
            if (result.response.includes('[VIEW: SIM]')) onAction('show_sim');
            if (result.response.includes('[VIEW: FLEET]')) onAction('show_fleet');

            // Safety Actions
            if (result.response.includes('[ACTION: RED_ALERT]')) onAction('trigger_red_alert');
            if (result.response.includes('[ACTION: CLEAR_ALERT]')) onAction('clear_alert');

        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please ensure the backend is running." }]);
        } finally {
            setLoading(false);
        }
    };

    // Custom Lightweight Formatter (Safe, no dependencies)
    const formatMessage = (text) => {
        if (!text) return null;

        // 1. Handle Code Blocks first
        // Simple splitter for triple backticks
        const parts = text.split(/(```[\s\S]*?```)/g);

        return parts.map((part, i) => {
            if (part.startsWith('```') && part.endsWith('```')) {
                const codeContent = part.slice(3, -3).replace(/^.*\n/, ''); // remove first line (lang)
                return (
                    <div key={i} className="bg-slate-950 p-3 rounded-lg my-2 border border-slate-700 overflow-x-auto">
                        <pre className="text-xs font-mono text-indigo-300 whitespace-pre-wrap">{codeContent}</pre>
                    </div>
                );
            }

            // 2. Handle standard text formatting (Bold and Inline Code)
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
    };

    // Minimized State (Floating Action Button)
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

    // Open State (Floating Card)
    return (
        <div className="fixed bottom-6 right-6 w-[450px] h-[600px] flex flex-col bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 backdrop-blur-md">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0 bg-slate-950/50 rounded-t-2xl">
                <div className="flex items-center gap-2 text-indigo-300">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-semibold">AI Commander</h3>
                </div>
                {ragContext && (
                    <div className="text-xs text-green-400 flex items-center gap-1 bg-green-900/20 px-2 py-1 rounded">
                        <Book className="w-3 h-3" />
                        Context Loaded
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                            {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-300" />}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                            {msg.role === 'user' ? msg.content : formatMessage(msg.content)}
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
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* RAG Context Snippet (if available) */}
            {ragContext && (
                <div className="px-4 py-2 bg-slate-800/80 border-t border-slate-700 text-xs">
                    <p className="text-slate-400 font-semibold mb-1">Reference Found: {ragContext.title}</p>
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

                {/* Voice Input Button */}
                <button
                    type="button"
                    onClick={() => {
                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                        if (!SpeechRecognition) {
                            alert("Voice control is not supported in this browser. Try Chrome.");
                            return;
                        }

                        const recognition = new SpeechRecognition();
                        recognition.lang = 'en-US';
                        recognition.interimResults = false;
                        recognition.maxAlternatives = 1;

                        // Visual Indicator could be added here (e.g. state change)
                        setInput("Listening...");

                        recognition.onresult = (event) => {
                            const speechResult = event.results[0][0].transcript;
                            setInput(speechResult);

                            // Auto-submit for ALL commands (Universal Voice Control)
                            // We use a timeout to ensure state is settled before triggering the click
                            setTimeout(() => {
                                const submitBtn = document.querySelector('button[type="submit"]');
                                if (submitBtn) submitBtn.click();
                            }, 100);
                        };

                        recognition.onerror = (event) => {
                            setInput(""); // clear "Listening..."
                            console.error("Speech parsing error", event.error);
                        };

                        recognition.start();
                    }}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors border border-slate-600"
                    title="Voice Command"
                >
                    <Mic className="w-5 h-5 focus:animate-pulse active:text-red-400" />
                </button>

                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>

            </form>

            {/* Close Button (Absolute) */}
            <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
                ✕
            </button>
        </div >
    );
};

export default ChatInterface;
