import React, { useState } from 'react';
import { Microscope, Camera, Video, Activity } from 'lucide-react';
import UploadZone from './UploadZone';
import AnalysisResult from './AnalysisResult';
import VisualScout from './VisualScout';

const VisualIntelligence = () => {
    const [activeTab, setActiveTab] = useState('static'); // 'static' or 'live'
    const [defectResult, setDefectResult] = useState(null);

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-xl border border-white/10 text-indigo-400 shadow-lg">
                        <Microscope className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Visual Intelligence</h2>
                        <p className="text-sm text-slate-400">Comprehensive Defect Detection & Live Analysis</p>
                    </div>
                </div>

                {/* Sub-navigation Tabs */}
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5">
                    <button
                        onClick={() => setActiveTab('static')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'static'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <Camera className="w-4 h-4" />
                        Static Inspection
                    </button>
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'live'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <Video className="w-4 h-4" />
                        Live Scout
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {activeTab === 'static' ? (
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-2xl h-full overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Static Image Analysis</h3>
                            <p className="text-slate-400 text-sm">Upload high-resolution images of battery cells for defect segmentation.</p>
                        </div>
                        <UploadZone onResult={setDefectResult} />
                        <AnalysisResult data={defectResult} type="defect" />
                    </div>
                ) : (
                    <div className="h-full">
                        <VisualScout />
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisualIntelligence;
