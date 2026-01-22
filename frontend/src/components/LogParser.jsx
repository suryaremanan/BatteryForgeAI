import React, { useState } from 'react';
import { FileText, Loader2, ArrowRight, Link, Upload as UploadIcon } from 'lucide-react';
import { analyzeLog, analyzeLogFile } from '../api';

const LogParser = ({ onResult, context }) => {
    const [logText, setLogText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!logText.trim()) return;

        setLoading(true);
        try {
            const result = await analyzeLog(logText, context);
            onResult(result);
        } catch (error) {
            console.error(error);
            alert("Failed to parse log");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const result = await analyzeLogFile(file, context);
            onResult(result);
            setLogText(`[File Uploaded: ${file.name}]\n(See analysis below)`);
        } catch (error) {
            console.error(error);
            alert("Failed to parse log file");
        } finally {
            setLoading(false);
            // Reset input
            e.target.value = null;
        }
    };

    return (
        <div className="bg-slate-900/40 rounded-xl p-4 border border-white/5 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-3 mb-3 text-amber-400">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold">Fault Log Parsing</h3>
                {context && (
                    <div className="ml-auto flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-mono">
                        <Link className="w-3 h-3" />
                        LINKED
                    </div>
                )}
            </div>
            <textarea
                className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-lg p-3 text-sm text-slate-300 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none font-mono"
                placeholder="Paste error logs or fault codes here..."
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
            ></textarea>

            {context && (
                <div className="text-[10px] text-slate-500 font-mono mt-1 mb-2 px-1">
                    Using Context: {context.capacity_ah?.toFixed(2)}Ah | {context.energy_wh?.toFixed(2)}Wh
                </div>
            )}

            <div className="flex justify-between mt-3">
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
                        Upload Log
                    </label>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={loading || !logText.trim()}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${loading || !logText.trim()
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20'}
          `}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading ? 'Analyzing...' : 'Parse Log'}
                </button>
            </div>
        </div>
    );
};

export default LogParser;
