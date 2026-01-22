import React from 'react';
import { AlertCircle, CheckCircle, Info, Activity } from 'lucide-react';

const AnalysisResult = ({ data, type }) => {
    if (!data) return null;

    if (type === 'defect') {
        return (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-4 rounded-xl border ${data.severity === 'Critical' ? 'bg-red-500/10 border-red-500/50' : data.severity === 'Medium' ? 'bg-orange-500/10 border-orange-500/50' : 'bg-green-500/10 border-green-500/50'}`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">{data.defect_type || 'Unknown Defect'}</h3>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${data.severity === 'Critical' ? 'text-red-300 border-red-500/30 bg-red-500/20' : 'text-green-300 border-green-500/30 bg-green-500/20'}`}>
                                    {data.severity}
                                </span>
                                <span className="text-xs text-slate-400">Confidence: {data.confidence}%</span>
                            </div>
                            {data.location && (
                                <div className="text-xs text-indigo-300 mb-2">
                                    <span className="text-slate-500">Location: </span>{data.location}
                                </div>
                            )}
                        </div>
                        {data.severity === 'Critical' ? <AlertCircle className="text-red-400 w-6 h-6" /> : <CheckCircle className="text-green-400 w-6 h-6" />}
                    </div>

                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">{data.description}</p>

                    <div className="bg-black/20 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recommended Action</h4>
                        <p className="text-sm text-indigo-200">{data.mitigation}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'log') {
        return (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-semibold text-white">Log Analysis</h3>
                        <span className={`ml-auto text-xs font-bold px-2 py-1 rounded bg-slate-700 ${data.urgency === 'Critical' ? 'text-red-400' : 'text-blue-400'}`}>
                            {data.urgency}
                        </span>
                    </div>

                    <div className="grid gap-4">
                        <div>
                            <span className="text-xs text-slate-500 block mb-1">Detection</span>
                            <p className="text-indigo-300 font-mono text-sm">{data.component}: <span className="text-white">{data.error_code}</span></p>
                        </div>

                        <div>
                            <span className="text-xs text-slate-500 block mb-1">Issue</span>
                            <p className="text-slate-300 text-sm">{data.description}</p>
                        </div>

                        {data.troubleshooting_steps && (
                            <div>
                                <span className="text-xs text-slate-500 block mb-2">Troubleshooting</span>
                                <ul className="space-y-1">
                                    {data.troubleshooting_steps.map((step, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                            <span className="text-indigo-500 mt-1">•</span>
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AnalysisResult;
