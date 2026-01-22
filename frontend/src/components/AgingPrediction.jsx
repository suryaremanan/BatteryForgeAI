import React, { useState } from 'react';
import { TrendingDown, Calendar, AlertOctagon, Activity } from 'lucide-react';
import { predictAging } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const AgingPrediction = ({ metrics }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handlePrediction = async () => {
        setLoading(true);
        try {
            // Use real capacity if available, otherwise defaults
            const currentCap = metrics ? metrics.capacity_ah : null;
            const data = await predictAging(currentCap);

            // Transform for Recharts
            const chartData = data.data.cycles.map((c, i) => ({
                cycle: c,
                soh: data.data.soh[i]
            }));
            setResult({ ...data, chartData });
        } catch (error) {
            console.error("Aging prediction failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                        <TrendingDown className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Predictive Battery Aging (RUL)</h2>
                        {metrics && (
                            <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                Linked to Uploaded Data
                            </span>
                        )}
                    </div>
                </div>
                {/* Optional: Input for Nominal Capacity could go here */}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-slate-950/50 rounded-xl p-4 border border-white/10 min-h-[300px]">
                    {result ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={result.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="cycle" stroke="#94a3b8" label={{ value: 'Cycles', position: 'insideBottom', offset: -5 }} />
                                <YAxis stroke="#94a3b8" domain={[60, 105]} label={{ value: 'SOH %', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" label="EOL (80%)" />
                                <Line type="monotone" dataKey="soh" stroke="#c084fc" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <Calendar className="w-12 h-12 mb-2 opacity-20" />
                            <p>Run prediction to view degradation curve</p>
                            {metrics && <p className="text-xs text-purple-400 mt-2">Will project from SOH: {((metrics.capacity_ah / 3.0) * 100).toFixed(1)}%</p>}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <p className="text-slate-400 text-sm">
                        Uses <strong>Gemini 3.0</strong> to analyze historical capacity fade and predict Remaining Useful Life (RUL).
                    </p>

                    <button
                        onClick={handlePrediction}
                        disabled={loading}
                        className={`w-full py-3 px-4 bg-gradient-to-r font-semibold rounded-lg shadow-lg transition-all ${metrics
                            ? "from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20"
                            : "from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/20"
                            } text-white`}
                    >
                        {loading ? 'Calculating RUL...' : metrics ? 'Predict via AI Baseline' : 'Predict Aging (Simulated)'}
                    </button>

                    {result && result.prediction && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-right duration-500">
                            {result.data.current_metrics && (
                                <div className="p-3 bg-slate-950/50 rounded border border-white/5 text-xs text-slate-400">
                                    Based on Initial SOH: <span className="text-white font-bold">{result.data.current_metrics.calculated_soh}%</span>
                                </div>
                            )}
                            <div className="p-4 bg-purple-500/10 border border-purple-500/50 rounded-xl">
                                <span className="text-xs text-purple-300 uppercase tracking-wider block mb-1">Predicted EOL Cycle</span>
                                <span className="text-3xl font-bold text-white">{result.prediction.predicted_eol_cycle}</span>
                                <span className="text-sm text-slate-400 ml-2">cycles</span>
                            </div>

                            <div className="p-4 bg-slate-900/50 border border-white/10 rounded-xl">
                                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Remaining Useful Life</span>
                                <span className="text-2xl font-bold text-white">{result.prediction.rul_cycles}</span>
                                <span className="text-sm text-slate-400 ml-2">cycles left</span>
                            </div>

                            {result.prediction.knee_point_detected && (
                                <div className="flex items-center gap-2 text-red-300 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
                                    <AlertOctagon className="w-4 h-4" />
                                    <span>Knee Point Detected! Accelerating degradation.</span>
                                </div>
                            )}

                            <p className="text-xs text-slate-400 italic">
                                "{result.prediction.reasoning}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgingPrediction;
