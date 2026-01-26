import React, { useState } from 'react';
import { FileText, Loader2, ArrowRight, Link, Upload as UploadIcon, AlertTriangle, CheckCircle, Info, Zap, Terminal } from 'lucide-react';
import { analyzeLog, analyzeLogFile } from '../api';

const LogParser = ({ onResult, context }) => {
    const [logText, setLogText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [analysisStage, setAnalysisStage] = useState('idle'); // 'idle', 'scanning', 'analyzing', 'complete'

    const handleAnalyze = async () => {
        if (!logText.trim()) return;

        setLoading(true);
        setResult(null);
        setAnalysisStage('scanning');

        try {
            // Simulate fast regex scan
            await new Promise(resolve => setTimeout(resolve, 300));
            setAnalysisStage('analyzing');

            const analysisResult = await analyzeLog(logText, context);
            setResult(analysisResult);
            setAnalysisStage('complete');
            onResult(analysisResult);
        } catch (error) {
            console.error(error);
            alert("Failed to parse log");
            setAnalysisStage('idle');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Only read file content - user must click Parse Log to analyze
        try {
            const text = await file.text();
            setLogText(text);
            setResult(null);
            setAnalysisStage('idle');
        } catch (error) {
            console.error(error);
            alert("Failed to read log file");
        } finally {
            e.target.value = null;
        }
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency?.toLowerCase()) {
            case 'critical':
                return 'border-red-500/30 bg-red-900/20';
            case 'warning':
                return 'border-amber-500/30 bg-amber-900/20';
            default:
                return 'border-emerald-500/30 bg-emerald-900/20';
        }
    };

    const getUrgencyIcon = (urgency) => {
        switch (urgency?.toLowerCase()) {
            case 'critical':
                return <AlertTriangle className="w-5 h-5 text-red-400" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            default:
                return <CheckCircle className="w-5 h-5 text-emerald-400" />;
        }
    };

    return (
        <div className="space-y-4">
            {/* Input Section */}
            <div className="bg-slate-900/40 rounded-xl p-4 border border-white/5 backdrop-blur-md shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Terminal className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-white">Fault Log Analysis</h3>
                        <p className="text-xs text-slate-400">Upload file or paste logs, then click Parse Log</p>
                    </div>
                    {context && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-mono">
                            <Link className="w-3 h-3" />
                            CONTEXT LINKED
                        </div>
                    )}
                </div>

                <textarea
                    className="w-full h-40 bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-slate-300 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none font-mono"
                    placeholder="Paste error logs or fault codes here...
Example:
[ERROR] Cell Module 3: Voltage deviation detected
[WARN] Temp sensor 2: Reading 58°C
[CRIT] BMS Main: Overcurrent protection triggered"
                    value={logText}
                    onChange={(e) => setLogText(e.target.value)}
                    disabled={loading}
                />

                {context && (
                    <div className="text-[10px] text-slate-500 font-mono mt-2 mb-2 px-1">
                        📊 Using Context: {context.capacity_ah?.toFixed(2)}Ah | {context.energy_wh?.toFixed(2)}Wh | Max Current: {context.max_current}A
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-3">
                    <div className="relative">
                        <input
                            type="file"
                            id="log-file-upload"
                            className="hidden"
                            accept=".txt,.log,.csv"
                            onChange={handleFileUpload}
                            disabled={loading}
                        />
                        <label
                            htmlFor="log-file-upload"
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border border-dashed border-slate-600
                                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800 hover:border-slate-500 text-slate-400 hover:text-white'}
                            `}
                        >
                            <UploadIcon className="w-4 h-4" />
                            Upload Log File
                        </label>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !logText.trim()}
                        className={`
                            flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all
                            ${loading || !logText.trim()
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-lg shadow-amber-900/30'}
                        `}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {analysisStage === 'scanning' && 'Scanning...'}
                                {analysisStage === 'analyzing' && 'Analyzing...'}
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                Parse Log
                            </>
                        )}
                    </button>
                </div>

                {/* Analysis Progress */}
                {loading && (
                    <div className="mt-3 p-3 bg-slate-950/50 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                            <div className="flex-1">
                                <div className="text-xs font-semibold text-white mb-1">
                                    {analysisStage === 'scanning' && '⚡ Fast Regex Scan'}
                                    {analysisStage === 'analyzing' && '🤖 Gemini Deep Analysis'}
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ${analysisStage === 'scanning' ? 'w-1/3' : 'w-2/3'
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Analysis Result */}
            {result && analysisStage === 'complete' && (
                <div className={`rounded-xl p-5 border-2 ${getUrgencyColor(result.urgency)} shadow-xl animate-in fade-in slide-in-from-bottom duration-500`}>
                    <div className="flex items-start gap-4">
                        <div className="shrink-0">
                            {getUrgencyIcon(result.urgency)}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-lg font-bold text-white">
                                        {result.error_code || 'Analysis Complete'}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${result.urgency?.toLowerCase() === 'critical' ? 'bg-red-500/20 text-red-300' :
                                            result.urgency?.toLowerCase() === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                                                'bg-emerald-500/20 text-emerald-300'
                                        }`}>
                                        {result.urgency?.toUpperCase()}
                                    </span>
                                </div>
                                {result.component && (
                                    <p className="text-sm text-slate-400">Component: <span className="text-white font-mono">{result.component}</span></p>
                                )}
                            </div>

                            <p className="text-sm text-slate-300 leading-relaxed">
                                {result.description}
                            </p>

                            {result.troubleshooting_steps && result.troubleshooting_steps.length > 0 && (
                                <div className="mt-4">
                                    <h5 className="text-sm font-semibold text-white mb-2">Troubleshooting Steps:</h5>
                                    <ul className="space-y-1">
                                        {result.troubleshooting_steps.map((step, idx) => (
                                            <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                                <span className="text-amber-400 shrink-0">{idx + 1}.</span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogParser;
