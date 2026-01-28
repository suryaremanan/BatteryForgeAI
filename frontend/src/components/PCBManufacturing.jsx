import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Layers, Zap, Eye, Hammer, ShieldCheck, Upload, FileText, CheckCircle,
    AlertTriangle, Activity, CircuitBoard, Cpu, Thermometer,
    Factory, Clock, Package, TrendingUp, RefreshCw, Play, Monitor,
    Wrench, Search, AlertCircle, Settings, MessageCircle, ArrowRight,
    Square, Send, StopCircle, XCircle, Target, Scan, Focus, Crosshair,
    Shield, Camera, Image, Sparkles, Gauge, Radio, CircleDot, Box, Grid3X3,
    Server, HardDrive, Disc, Timer, Calendar, History, Bell, Power, Waves,
    BarChart3, TrendingDown, AlertOctagon, Check, X, RotateCcw
} from 'lucide-react';
import {
    analyzeGerber, optimizeMaterial, controlEtching, predictLamination,
    classifyPCB, checkDrillWear, optimizePlating, verifyETest, generateCertificate,
    // New Phase 2 API Calls
    generateSchematic, exploreDesignRoute, analyzeXRay, analyzeMaintenanceSignals,
    predictToolLife, checkSupplyRisk, forecastInventory, controlProcessLoop, parseDatasheet,
    inspectAOI,
    // Enhanced Maintenance API
    getFleetStatus, getDrillInventory, analyzeThermal, scheduleMaintenance, getAnomalyHistory
} from '../api';

// ============================================================================
// SHARED VISUAL COMPONENTS
// ============================================================================

const LiveStatCard = ({ icon: Icon, label, value, unit, trend, color = 'emerald', pulse = false }) => (
    <div className={`relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-xl 
        rounded-2xl p-4 border border-white/10 overflow-hidden group
        hover:border-${color}-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-${color}-500/10`}>
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl`} />
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
                    <Icon className={`w-4 h-4 text-${color}-400`} />
                </div>
                {pulse && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </div>
            <div className="text-2xl font-bold text-white font-mono">
                {value}<span className="text-sm text-slate-400 ml-1">{unit}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
        </div>
    </div>
);

const AnimatedGauge = ({ value, max, label, unit, color = 'cyan' }) => {
    const percentage = Math.min(100, (value / max) * 100);
    return (
        <div className="relative flex flex-col items-center">
            <div className="relative w-32 h-16 overflow-hidden">
                <div className="absolute inset-0 border-8 border-slate-700 rounded-t-full" />
                <div
                    className={`absolute inset-0 border-8 border-${color}-500 rounded-t-full transition-all duration-1000 origin-bottom`}
                    style={{ transform: `rotate(${percentage * 1.8 - 180}deg)` }}
                />
            </div>
            <div className="text-center mt-2">
                <div className={`text-xl font-bold text-${color}-400 font-mono`}>{value}{unit}</div>
                <div className="text-xs text-slate-400">{label}</div>
            </div>
        </div>
    );
};

const ProcessFlowTimeline = ({ activePhase, onPhaseClick }) => {
    const phases = [
        { id: 1, name: 'Design & Supply', icon: FileText },
        { id: 2, name: 'Smart Process', icon: Zap },
        { id: 3, name: 'Vision QA', icon: Eye },
        { id: 4, name: 'Maint. & Drill', icon: Hammer },
        { id: 5, name: 'Compliance', icon: ShieldCheck },
    ];

    return (
        <div className="relative flex justify-between">
            <div className="absolute top-6 left-8 right-8 h-0.5 bg-slate-700" />
            {phases.map((phase) => (
                <button
                    key={phase.id}
                    onClick={() => onPhaseClick(phase.id)}
                    className="flex flex-col items-center group relative z-10"
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                        ${activePhase === phase.id ? 'bg-purple-600 shadow-lg scale-110' : 'bg-slate-800 border block-slate-600'}`}>
                        <phase.icon className={`w-5 h-5 ${activePhase === phase.id ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className="mt-2 text-xs font-medium text-slate-400">{phase.name}</span>
                </button>
            ))}
        </div>
    );
};

// ============================================================================
// SVG BLOCK DIAGRAM COMPONENT
// ============================================================================

const SchematicBlockDiagram = ({ designPlan }) => {
    const blocks = designPlan?.blocks || [];
    const interconnections = designPlan?.interconnections || [];

    if (blocks.length === 0) return null;

    const BLOCK_W = 230;
    const BLOCK_H = 76;
    const GAP_X = 60;
    const GAP_Y = 60;
    const COLS = Math.min(3, blocks.length);
    const PAD_X = 36;
    const PAD_Y = 36;
    const TEXT_PAD_LEFT = 28;          // space after accent bar + badge
    const MAX_CHARS_LINE = 28;         // truncate per line

    // Compute block positions in a grid
    const blockPositions = blocks.map((label, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = PAD_X + col * (BLOCK_W + GAP_X);
        const y = PAD_Y + row * (BLOCK_H + GAP_Y);
        return { label, i, x, y, cx: x + BLOCK_W / 2, cy: y + BLOCK_H / 2 };
    });

    const rows = Math.ceil(blocks.length / COLS);
    const svgW = PAD_X * 2 + COLS * BLOCK_W + (COLS - 1) * GAP_X;
    const svgH = PAD_Y * 2 + rows * BLOCK_H + (rows - 1) * GAP_Y;

    // Fuzzy-match an interconnection term to a block index
    const findBlockIndex = (term) => {
        const t = term.toLowerCase().trim();
        let idx = blocks.findIndex(b => b.toLowerCase().trim() === t);
        if (idx !== -1) return idx;
        idx = blocks.findIndex(b => {
            const bl = b.toLowerCase();
            const blBase = bl.split('(')[0].trim();
            return bl.includes(t) || t.includes(blBase);
        });
        return idx;
    };

    // Parse interconnection strings into directed edges
    const edges = [];
    const edgeSet = new Set();
    interconnections.forEach((ic) => {
        const parts = ic.split(/->|→/).map(s => s.trim());
        for (let i = 0; i < parts.length - 1; i++) {
            const fromIdx = findBlockIndex(parts[i]);
            const toIdx = findBlockIndex(parts[i + 1]);
            if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
                const key = `${fromIdx}-${toIdx}`;
                if (!edgeSet.has(key)) {
                    edgeSet.add(key);
                    edges.push({ from: fromIdx, to: toIdx });
                }
            }
        }
    });

    // Compute SVG bezier path between two blocks
    const computePath = (fromPos, toPos) => {
        const dx = toPos.cx - fromPos.cx;
        const dy = toPos.cy - fromPos.cy;
        let sx, sy, ex, ey;

        if (Math.abs(dx) >= Math.abs(dy)) {
            if (dx > 0) { sx = fromPos.x + BLOCK_W; sy = fromPos.cy; ex = toPos.x; ey = toPos.cy; }
            else { sx = fromPos.x; sy = fromPos.cy; ex = toPos.x + BLOCK_W; ey = toPos.cy; }
        } else {
            if (dy > 0) { sx = fromPos.cx; sy = fromPos.y + BLOCK_H; ex = toPos.cx; ey = toPos.y; }
            else { sx = fromPos.cx; sy = fromPos.y; ex = toPos.cx; ey = toPos.y + BLOCK_H; }
        }

        const cpx1 = sx + (ex - sx) * 0.5;
        const cpx2 = sx + (ex - sx) * 0.5;
        return `M ${sx} ${sy} C ${cpx1} ${sy}, ${cpx2} ${ey}, ${ex} ${ey}`;
    };

    // Truncate a string to maxLen, adding ellipsis
    const truncate = (str, maxLen) => str.length <= maxLen ? str : str.substring(0, maxLen - 1) + '\u2026';

    // Split label into up to 3 lines, each truncated
    const splitLabel = (label) => {
        if (label.length <= MAX_CHARS_LINE) return [label];

        const paren = label.indexOf('(');
        if (paren !== -1) {
            const main = label.substring(0, paren).trim();
            const sub = label.substring(paren).trim();
            // Split main further if still too long
            if (main.length > MAX_CHARS_LINE) {
                const midSpace = main.lastIndexOf(' ', MAX_CHARS_LINE);
                if (midSpace > 0) {
                    return [
                        truncate(main.substring(0, midSpace), MAX_CHARS_LINE),
                        truncate(main.substring(midSpace + 1), MAX_CHARS_LINE),
                        truncate(sub, MAX_CHARS_LINE)
                    ];
                }
            }
            return [truncate(main, MAX_CHARS_LINE), truncate(sub, MAX_CHARS_LINE)];
        }

        // No parens — split at word boundaries
        const words = label.split(' ');
        const lines = [];
        let current = '';
        for (const word of words) {
            const test = current ? `${current} ${word}` : word;
            if (test.length > MAX_CHARS_LINE && current) {
                lines.push(current);
                current = word;
                if (lines.length >= 2) { current = truncate(words.slice(words.indexOf(word)).join(' '), MAX_CHARS_LINE); break; }
            } else {
                current = test;
            }
        }
        if (current) lines.push(truncate(current, MAX_CHARS_LINE));
        return lines.slice(0, 3);
    };

    const accents = ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];
    const textCenterX = (bp) => bp.x + TEXT_PAD_LEFT + (BLOCK_W - TEXT_PAD_LEFT - 10) / 2;
    const LINE_H = 15;

    return (
        <div className="w-full overflow-x-auto">
            <svg
                width="100%"
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="select-none"
            >
                <defs>
                    <marker id="bd-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#06b6d4" />
                    </marker>
                    <filter id="bd-shadow">
                        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0,0,0,0.45)" />
                    </filter>
                    <pattern id="bd-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.6" fill="rgba(148,163,184,0.12)" />
                    </pattern>
                    <linearGradient id="bd-edgeGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                    </linearGradient>
                    {/* Clip paths for each block */}
                    {blockPositions.map((bp, i) => (
                        <clipPath key={`clip-${i}`} id={`bd-clip-${i}`}>
                            <rect x={bp.x + 4} y={bp.y + 4} width={BLOCK_W - 8} height={BLOCK_H - 8} rx={6} />
                        </clipPath>
                    ))}
                </defs>

                {/* Background dot grid */}
                <rect x="0" y="0" width={svgW} height={svgH} fill="url(#bd-dots)" rx="12" />

                {/* Connection edges */}
                {edges.map((edge, i) => (
                    <path
                        key={`e-${i}`}
                        d={computePath(blockPositions[edge.from], blockPositions[edge.to])}
                        stroke="url(#bd-edgeGrad)"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#bd-arrow)"
                        opacity="0.85"
                        style={{ filter: 'drop-shadow(0 0 3px rgba(6,182,212,0.3))' }}
                    />
                ))}

                {/* Blocks */}
                {blockPositions.map((bp, i) => {
                    const lines = splitLabel(bp.label);
                    const accent = accents[i % accents.length];
                    const totalTextH = lines.length * LINE_H;
                    const textStartY = bp.cy - totalTextH / 2 + LINE_H / 2;

                    return (
                        <g key={`b-${i}`} className="cursor-default">
                            {/* Block body */}
                            <rect
                                x={bp.x} y={bp.y}
                                width={BLOCK_W} height={BLOCK_H}
                                rx={10} ry={10}
                                fill="rgba(15,23,42,0.9)"
                                stroke="rgba(148,163,184,0.2)"
                                strokeWidth="1"
                                filter="url(#bd-shadow)"
                            />
                            {/* Left accent bar */}
                            <rect
                                x={bp.x} y={bp.y + 10}
                                width={3.5} height={BLOCK_H - 20}
                                rx={2}
                                fill={accent}
                            />
                            {/* Index badge */}
                            <circle cx={bp.x + 16} cy={bp.y + 16} r={9} fill={accent} opacity="0.15" />
                            <text
                                x={bp.x + 16} y={bp.y + 17}
                                textAnchor="middle" dominantBaseline="central"
                                fill={accent} fontSize="9" fontWeight="700"
                                fontFamily="ui-monospace, monospace"
                            >
                                {i + 1}
                            </text>
                            {/* Label text — clipped to block bounds */}
                            <g clipPath={`url(#bd-clip-${i})`}>
                                {lines.map((line, li) => (
                                    <text
                                        key={li}
                                        x={textCenterX(bp)}
                                        y={textStartY + li * LINE_H}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill={li === 0 ? 'white' : 'rgba(148,163,184,0.75)'}
                                        fontSize={li === 0 ? '11' : '10'}
                                        fontWeight={li === 0 ? '600' : '400'}
                                        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                                    >
                                        {line}
                                    </text>
                                ))}
                            </g>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PCBManufacturing = () => {
    const [activePhase, setActivePhase] = useState(1);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    // Data States
    const [schematic, setSchematic] = useState(null);
    const [designSpecs, setDesignSpecs] = useState("BMS 4S LiPo with USB-C PD and I2C");
    const [rlPath, setRlPath] = useState(null);
    const [supplyRisk, setSupplyRisk] = useState(null);
    const [processLoop, setProcessLoop] = useState(null);
    const [visionResult, setVisionResult] = useState(null);
    const [xrayResult, setXrayResult] = useState(null);
    const [maintResult, setMaintResult] = useState(null);
    const [toolLife, setToolLife] = useState(null);

    const [datasheetResult, setDatasheetResult] = useState(null);
    const [parsingDatasheet, setParsingDatasheet] = useState(false);

    // Clarification chat state
    const [conversationHistory, setConversationHistory] = useState([]);
    const [clarifyingQuestions, setClarifyingQuestions] = useState(null);
    const [clarifyAnswer, setClarifyAnswer] = useState('');
    const [understoodSoFar, setUnderstoodSoFar] = useState('');

    // Vision Golden Sample State
    const [useGoldenSample, setUseGoldenSample] = useState(false);
    const [goldenSampleFile, setGoldenSampleFile] = useState(null);

    // AOI Enhanced State
    const [aoiLoading, setAoiLoading] = useState(false);
    const [aoiPreviewUrl, setAoiPreviewUrl] = useState(null);
    const [xrayLoading, setXrayLoading] = useState(false);
    const [xrayPreviewUrl, setXrayPreviewUrl] = useState(null);

    // Smart Process State (Phase 2)
    const [activeProcess, setActiveProcess] = useState('etching'); // etching, lamination, plating
    const [etchingParams, setEtchingParams] = useState({ copperWeight: 1.0, concentration: 100 });
    const [etchingResult, setEtchingResult] = useState(null);
    const [laminationParams, setLaminationParams] = useState({ material: 'FR4-Standard', layers: 4 });
    const [laminationResult, setLaminationResult] = useState(null);
    const [platingParams, setPlatingParams] = useState({ width: 300, height: 400 });
    const [platingResult, setPlatingResult] = useState(null);
    const [processRunning, setProcessRunning] = useState(false);
    const [processAnimationStep, setProcessAnimationStep] = useState(0);

    // Enhanced Maintenance State (Phase 4)
    const [maintView, setMaintView] = useState('fleet'); // fleet, drills, thermal, schedule
    const [fleetData, setFleetData] = useState(null);
    const [drillInventory, setDrillInventory] = useState(null);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [thermalResult, setThermalResult] = useState(null);
    const [anomalyHistory, setAnomalyHistory] = useState(null);
    const [scheduleResult, setScheduleResult] = useState(null);
    const [fftData, setFftData] = useState([35, 42, 28, 65, 45, 30, 85, 50, 38, 25, 55, 40, 32, 70, 48]);
    const [fftAnimating, setFftAnimating] = useState(false);

    // RL animation state
    const [rlGrid, setRlGrid] = useState(null);
    const [rlPathHistory, setRlPathHistory] = useState([]);
    const [rlRunning, setRlRunning] = useState(false);
    const rlAbortRef = useRef(false);

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    // --- PHASE 1: DESIGN & SUPPLY ---
    const handleGenerateSchematic = async (answerText = null) => {
        setLoading(true);
        const specs = answerText || designSpecs;
        addLog(`Analyzing Design Requirements: "${specs.substring(0, 30)}..."`);

        // Build history for multi-turn
        let history = [...conversationHistory];
        if (answerText) {
            history.push({ role: 'user', content: answerText });
        }

        try {
            const res = await generateSchematic(specs, history.length > 0 ? history : null);

            if (res.status === 'needs_clarification' && res.clarifying_questions) {
                setClarifyingQuestions(res.clarifying_questions);
                setUnderstoodSoFar(res.understood_so_far || '');
                setSchematic(null);
                // Track conversation
                history.push({ role: 'user', content: specs });
                history.push({ role: 'assistant', content: `Questions: ${res.clarifying_questions.join('; ')}` });
                setConversationHistory(history);
                addLog("Engineering Intern needs more info — clarifying questions sent", 'warning');
            } else {
                setSchematic(res);
                setClarifyingQuestions(null);
                setUnderstoodSoFar('');
                setConversationHistory([]);
                addLog("Schematic Plan & Components Generated", 'success');
            }
        } catch (e) { addLog(e.message, 'error'); }
        setLoading(false);
    };

    const handleClarifySubmit = () => {
        if (!clarifyAnswer.trim()) return;
        const combined = `${designSpecs}. Additional info: ${clarifyAnswer}`;
        setDesignSpecs(combined);
        handleGenerateSchematic(combined);
        setClarifyAnswer('');
    };

    const handleRLRouting = async () => {
        const gridConfig = {
            grid_size: [10, 10],
            start: [0, 0],
            target: [9, 9],
            obstacles: [[2, 2], [2, 3], [3, 3], [5, 5], [5, 6], [6, 5], [7, 2], [7, 3]]
        };
        setRlGrid(gridConfig);
        setRlPathHistory([gridConfig.start]);
        setRlRunning(true);
        rlAbortRef.current = false;
        setRlPath(null);
        addLog("RL Agent started — routing trace...");

        let currentHead = [...gridConfig.start];
        const path = [currentHead];
        const maxSteps = 25;

        for (let step = 0; step < maxSteps; step++) {
            if (rlAbortRef.current) {
                addLog("RL Agent stopped by user", 'warning');
                break;
            }
            // Check if reached target
            if (currentHead[0] === gridConfig.target[0] && currentHead[1] === gridConfig.target[1]) {
                addLog("RL Agent reached target!", 'success');
                break;
            }
            try {
                const res = await exploreDesignRoute({
                    ...gridConfig,
                    current_head: currentHead
                });
                if (res.next_move) {
                    currentHead = res.next_move;
                    path.push(currentHead);
                    setRlPathHistory([...path]);
                    setRlPath(res);
                    addLog(`Step ${step + 1}: ${res.action} -> [${res.next_move}] (${(res.confidence * 100).toFixed(0)}%)`, 'info');
                } else {
                    addLog("RL Agent returned no move — stopping", 'warning');
                    break;
                }
            } catch (e) {
                addLog(`RL step failed: ${e.message}`, 'error');
                break;
            }
        }
        setRlRunning(false);
    };

    const stopRLRouting = () => {
        rlAbortRef.current = true;
    };

    const handleSupplyRisk = async () => {
        setLoading(true);
        try {
            const res = await checkSupplyRisk([{ part: "STM32", origin: "Taiwan" }]);
            setSupplyRisk(res);
            addLog("Supply Chain Risk Analysis complete", 'success');
        } catch (e) { addLog(e.message, 'error'); }
        setLoading(false);
    };

    // --- PHASE 2: SMART PROCESS ---
    const handleProcessLoop = async () => {
        setLoading(true);
        try {
            const res = await controlProcessLoop({ process: "Etching", ph_level: 3.1, copper_thickness_removed: 14, target: 18 });
            setProcessLoop(res);
            addLog("Adaptive Process Loop: Adjustment sent", 'warning');
        } catch (e) { addLog(e.message, 'error'); }
        setLoading(false);
    };

    const handleEtchingControl = async () => {
        setProcessRunning(true);
        setEtchingResult(null);
        addLog(`Running Etching Control: ${etchingParams.copperWeight}oz Cu, ${etchingParams.concentration}% conc...`);

        // Animate process steps
        for (let i = 1; i <= 4; i++) {
            setProcessAnimationStep(i);
            await new Promise(r => setTimeout(r, 500));
        }

        try {
            const res = await controlEtching({
                copper_weight_oz: etchingParams.copperWeight,
                chemical_concentration_pct: etchingParams.concentration
            });
            setEtchingResult(res);
            addLog(`Etching: Speed ${res.control_actions?.conveyor_speed_m_min}m/min, Pressure ${res.control_actions?.spray_pressure_bar}bar`, 'success');
        } catch (e) { addLog(e.message, 'error'); }

        setProcessAnimationStep(0);
        setProcessRunning(false);
    };

    const handleLaminationPredict = async () => {
        setProcessRunning(true);
        setLaminationResult(null);
        addLog(`Predicting Lamination Scaling: ${laminationParams.material}, ${laminationParams.layers} layers...`);

        for (let i = 1; i <= 4; i++) {
            setProcessAnimationStep(i);
            await new Promise(r => setTimeout(r, 400));
        }

        try {
            const res = await predictLamination({
                material_type: laminationParams.material,
                layer_count: laminationParams.layers
            });
            setLaminationResult(res);
            addLog(`Lamination: X=${res.scaling_factors?.x_comp}mils, Y=${res.scaling_factors?.y_comp}mils compensation`, 'success');
        } catch (e) { addLog(e.message, 'error'); }

        setProcessAnimationStep(0);
        setProcessRunning(false);
    };

    const handlePlatingOptimize = async () => {
        setProcessRunning(true);
        setPlatingResult(null);
        addLog(`Optimizing Plating: ${platingParams.width}x${platingParams.height}mm panel...`);

        for (let i = 1; i <= 4; i++) {
            setProcessAnimationStep(i);
            await new Promise(r => setTimeout(r, 450));
        }

        try {
            const res = await optimizePlating({
                panel_width_mm: platingParams.width,
                panel_height_mm: platingParams.height
            });
            setPlatingResult(res);
            addLog(`Plating: ${res.predicted_uniformity_score}% uniformity - ${res.suggested_setup}`, 'success');
        } catch (e) { addLog(e.message, 'error'); }

        setProcessAnimationStep(0);
        setProcessRunning(false);
    };

    // --- PHASE 3: VISION & X-RAY ---
    const handleVisionCheck = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create preview URL
        setAoiPreviewUrl(URL.createObjectURL(file));
        setAoiLoading(true);
        setVisionResult(null);
        addLog(`Starting AI-Powered AOI Inspection...`);

        try {
            const res = await inspectAOI(file, useGoldenSample ? goldenSampleFile : null);
            setVisionResult(res);
            if (res.error) {
                addLog(`AOI Error: ${res.error}`, 'error');
            } else {
                const verdict = res.verdict || 'PASS';
                const fatalCount = res.fatal_count || 0;
                addLog(`AOI Complete: ${verdict} | ${fatalCount} fatal, ${res.cosmetic_count || 0} cosmetic defects`, verdict === 'FAIL' ? 'warning' : 'success');
            }
        } catch (err) {
            addLog(err.message, 'error');
        }
        setAoiLoading(false);
    };

    const handleXRayCheck = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create preview URL
        setXrayPreviewUrl(URL.createObjectURL(file));
        setXrayLoading(true);
        setXrayResult(null);
        addLog(`Starting 3D X-Ray Analysis (AXI)...`);

        try {
            const res = await analyzeXRay(file);
            setXrayResult(res);
            if (res.error) {
                addLog(`X-Ray Error: ${res.error}`, 'error');
            } else {
                const bgaStatus = res.bga_analysis?.status || 'UNKNOWN';
                addLog(`X-Ray Complete: BGA ${bgaStatus} | Voids: ${res.bga_analysis?.max_void_percentage || 0}%`, bgaStatus === 'PASS' ? 'success' : 'warning');
            }
        } catch (err) {
            addLog(err.message, 'error');
        }
        setXrayLoading(false);
    };

    // --- PHASE 4: MAINTENANCE ---
    const handleMaintAnalysis = async () => {
        setLoading(true);
        try {
            const res = await analyzeMaintenanceSignals({ machine_id: "Drill-01", fft_peaks: [{ freq: 1200, amp: 0.9 }], rms_vibration: 1.5 });
            setMaintResult(res);

            const toolRes = await predictToolLife({ hits: 8500, resin_smear_level: "high", feed_rate_deviation: 0.1 });
            setToolLife(toolRes);
            addLog("Predictive Maintenance: Alerts found", 'warning');
        } catch (e) { addLog(e.message, 'error'); }
        setLoading(false);
    };

    // Enhanced Maintenance Handlers
    const loadFleetStatus = async () => {
        setLoading(true);
        try {
            const res = await getFleetStatus();
            setFleetData(res);
            addLog(`Fleet loaded: ${res.running} running, ${res.warnings} warnings`, res.warnings > 0 ? 'warning' : 'success');
        } catch (e) { addLog(e.message, 'error'); }
        setLoading(false);
    };

    const loadDrillInventory = async () => {
        setLoading(true);
        try {
            const res = await getDrillInventory();
            setDrillInventory(res);
            addLog(`Drill inventory: ${res.critical} critical, ${res.warning} warning`, res.critical > 0 ? 'error' : 'success');
        } catch (e) { addLog(e.message, 'error'); }
        setLoading(false);
    };

    const handleThermalAnalysis = async (machine) => {
        setSelectedMachine(machine);
        setThermalResult(null);
        setLoading(true);
        addLog(`Analyzing thermal health for ${machine.id}...`);
        try {
            const res = await analyzeThermal({
                machine_id: machine.id,
                spindle_temp_c: machine.spindle_temp_c,
                ambient_temp_c: 25,
                load_percent: 80
            });
            setThermalResult(res);
            addLog(`Thermal: ${res.thermal_status} - ${res.diagnosis}`, res.thermal_status === 'NORMAL' ? 'success' : 'warning');
        } catch (e) { addLog(e.message, 'error'); }
        setLoading(false);
    };

    const handleScheduleMaintenance = async (machineId, type, priority) => {
        setLoading(true);
        try {
            const res = await scheduleMaintenance({
                machine_id: machineId,
                maintenance_type: type,
                priority: priority
            });
            setScheduleResult(res);
            addLog(`Maintenance scheduled: ${res.work_order_id}`, 'success');
        } catch (e) { addLog(e.message, 'error'); }
        setLoading(false);
    };

    const loadAnomalyHistory = async () => {
        setLoading(true);
        try {
            const res = await getAnomalyHistory();
            setAnomalyHistory(res);
            addLog(`Anomaly history: ${res.unresolved} unresolved`, res.unresolved > 0 ? 'warning' : 'success');
        } catch (e) { addLog(e.message, 'error'); }
        setLoading(false);
    };

    const animateFFT = () => {
        setFftAnimating(true);
        const interval = setInterval(() => {
            setFftData(prev => prev.map(v => Math.max(10, Math.min(95, v + (Math.random() - 0.5) * 20))));
        }, 100);
        setTimeout(() => {
            clearInterval(interval);
            setFftAnimating(false);
        }, 3000);
    };

    // Load fleet data when maintenance tab is selected
    useEffect(() => {
        if (activePhase === 4 && !fleetData) {
            loadFleetStatus();
            loadDrillInventory();
            loadAnomalyHistory();
        }
    }, [activePhase]);

    return (
        <div className="flex flex-col h-full p-4 space-y-6 overflow-y-auto">
            {/* Custom Keyframe Animations */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s ease-in-out infinite;
                }
                .animate-marquee {
                    animation: marquee 2s linear infinite;
                }
            `}</style>

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl border border-white/10 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">PCB Factory <span className="text-purple-400">Gemini 3</span></h2>
                    <p className="text-slate-400 text-sm">Advanced Agentic Manufacturing</p>
                </div>
                <div className="flex gap-4">
                    <LiveStatCard icon={Factory} label="Active Lines" value={8} unit="" color="cyan" />
                    <LiveStatCard icon={TrendingUp} label="Yield" value={98.5} unit="%" color="emerald" pulse />
                </div>
            </div>

            {/* Timeline */}
            <ProcessFlowTimeline activePhase={activePhase} onPhaseClick={setActivePhase} />

            {/* Logs Overlay */}
            <div className="fixed bottom-4 right-4 w-80 bg-black/80 rounded-lg p-2 text-xs font-mono text-slate-300 pointer-events-none z-50">
                {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>

            {/* --- PHASE 1 CONTENT --- */}
            {activePhase === 1 && (
                <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-right fade-in duration-500">
                    {/* LEFT: Generative Design with Clarification Chat */}
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 min-w-0 overflow-hidden">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CircuitBoard className="text-purple-400" /> Generative Design (Gemini 3 Pro)
                        </h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <textarea
                                    value={designSpecs}
                                    onChange={(e) => setDesignSpecs(e.target.value)}
                                    placeholder="Describe your PCB requirements (e.g., 'BMS 4S LiPo with USB-C PD, I2C, and 50-ohm impedance traces')..."
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none h-24"
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                                    Gemini 3 "Engineering Intern" Mode
                                </div>
                            </div>

                            <button
                                onClick={() => handleGenerateSchematic()}
                                disabled={loading || !designSpecs.trim()}
                                className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-lg text-white font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? 'Analyzing Specs...' : 'Generate Schematic'}
                            </button>

                            {/* Clarification Chat UI */}
                            {clarifyingQuestions && (
                                <div className="p-4 bg-gradient-to-br from-amber-900/20 to-slate-900/80 rounded-xl border border-amber-500/30 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                        <MessageCircle className="w-4 h-4 text-amber-400" />
                                        <span className="text-amber-300 font-bold text-sm">Engineering Intern Needs Clarification</span>
                                    </div>
                                    {understoodSoFar && (
                                        <div className="text-xs text-slate-400 mb-3 bg-white/5 p-2 rounded-lg">
                                            Understood so far: <span className="text-slate-200">{understoodSoFar}</span>
                                        </div>
                                    )}
                                    <ul className="space-y-2 mb-4">
                                        {clarifyingQuestions.map((q, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                <span className="text-amber-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                                                {q}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={clarifyAnswer}
                                            onChange={(e) => setClarifyAnswer(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleClarifySubmit()}
                                            placeholder="Answer the questions above..."
                                            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                                        />
                                        <button
                                            onClick={handleClarifySubmit}
                                            disabled={loading || !clarifyAnswer.trim()}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white disabled:opacity-50 transition-all"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Block Diagram Visualization */}
                            {schematic && schematic.design_plan && (
                                <div className="p-4 bg-black/40 rounded-xl border border-purple-500/30 animate-in fade-in duration-300 space-y-4 overflow-hidden">
                                    {/* Header */}
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                            <span className="text-purple-300 font-bold text-sm">System Block Diagram</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono">{schematic.design_plan.blocks?.length || 0} subsystems</span>
                                    </div>

                                    {/* SVG Block Diagram */}
                                    <div className="bg-slate-950/60 rounded-lg border border-white/5 p-3 overflow-x-auto">
                                        <SchematicBlockDiagram designPlan={schematic.design_plan} />
                                    </div>

                                    {/* Signal Flows Legend */}
                                    {schematic.design_plan.interconnections?.length > 0 && (
                                        <div className="overflow-hidden">
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                <div className="w-4 h-[1.5px] bg-gradient-to-r from-purple-500 to-cyan-500 rounded" />
                                                Signal Flows
                                            </div>
                                            <div className="space-y-1">
                                                {schematic.design_plan.interconnections.map((ic, i) => (
                                                    <div key={i} className="text-[11px] text-cyan-300/90 bg-cyan-950/40 px-2.5 py-1.5 rounded-md font-mono border border-cyan-500/15 break-words overflow-hidden">
                                                        {ic}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Component Recommendations */}
                                    {schematic.component_recommendations?.length > 0 && (
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Component Selection</div>
                                            <div className="space-y-1.5">
                                                {schematic.component_recommendations.map((comp, i) => (
                                                    <div key={i} className="bg-white/[0.03] px-3 py-2 rounded-lg border border-white/5 hover:border-purple-500/20 transition-colors overflow-hidden">
                                                        <div className="flex items-center gap-2 mb-1 min-w-0">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                                            <span className="text-xs text-white font-medium truncate">{comp.function}</span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 pl-3.5 break-words">{comp.spec}</div>
                                                        {comp.verify && (
                                                            <div className="mt-1 pl-3.5">
                                                                <span className="text-[10px] text-amber-400/70 bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-500/10 inline-block break-words">{comp.verify}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* IPC Constraint Rules */}
                                    {schematic.constraint_definitions?.length > 0 && (
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">IPC Design Rules</div>
                                            <div className="space-y-1.5">
                                                {schematic.constraint_definitions.map((c, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-amber-300/80 bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-500/10 overflow-hidden">
                                                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-amber-500/60" />
                                                        <span className="break-words min-w-0">{c}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Fallback for schematic without design_plan structure */}
                            {schematic && !schematic.design_plan && !schematic.clarifying_questions && (
                                <div className="p-4 bg-black/40 rounded-xl border border-purple-500/30 text-xs font-mono animate-in fade-in duration-300">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                        <span className="text-purple-300 font-bold">Design Output</span>
                                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    </div>
                                    <pre className="text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-60 custom-scrollbar">
                                        {JSON.stringify(schematic, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: RL Routing, Datasheet, Supply */}
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 min-w-0 overflow-hidden">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Monitor className="text-cyan-400" /> Deep Tech RL & Supply
                        </h3>
                        <div className="flex gap-3 mb-4">
                            {!rlRunning ? (
                                <button onClick={handleRLRouting} className="flex-1 py-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500 flex items-center justify-center gap-2">
                                    <Play className="w-4 h-4" /> Run RL Agent
                                </button>
                            ) : (
                                <button onClick={stopRLRouting} className="flex-1 py-2 bg-red-600 rounded-lg text-white hover:bg-red-500 flex items-center justify-center gap-2">
                                    <StopCircle className="w-4 h-4" /> Stop RL Agent
                                </button>
                            )}
                            <button onClick={handleSupplyRisk} className="flex-1 py-2 bg-amber-600 rounded-lg text-white hover:bg-amber-500">Check Supply Risk</button>
                        </div>

                        {/* RL Grid Visualization */}
                        {rlGrid && (
                            <div className="mb-4 p-3 bg-black/40 rounded-xl border border-cyan-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-cyan-400 font-semibold">Routing Grid ({rlGrid.grid_size[0]}x{rlGrid.grid_size[1]})</span>
                                    {rlRunning && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                                    {!rlRunning && rlPathHistory.length > 1 && (
                                        <span className="text-xs text-emerald-400">{rlPathHistory.length - 1} steps</span>
                                    )}
                                </div>
                                <div className="grid gap-[2px] mx-auto w-fit" style={{ gridTemplateColumns: `repeat(${rlGrid.grid_size[1]}, 1fr)` }}>
                                    {Array.from({ length: rlGrid.grid_size[0] }).map((_, row) =>
                                        Array.from({ length: rlGrid.grid_size[1] }).map((_, col) => {
                                            const isStart = row === rlGrid.start[0] && col === rlGrid.start[1];
                                            const isTarget = row === rlGrid.target[0] && col === rlGrid.target[1];
                                            const isObstacle = rlGrid.obstacles.some(o => o[0] === row && o[1] === col);
                                            const pathIdx = rlPathHistory.findIndex(p => p[0] === row && p[1] === col);
                                            const isPath = pathIdx !== -1;
                                            const isHead = rlPathHistory.length > 0 &&
                                                rlPathHistory[rlPathHistory.length - 1][0] === row &&
                                                rlPathHistory[rlPathHistory.length - 1][1] === col;

                                            let cellClass = 'w-5 h-5 rounded-sm transition-all duration-200 ';
                                            if (isStart) cellClass += 'bg-emerald-500 shadow-lg shadow-emerald-500/30';
                                            else if (isTarget) cellClass += 'bg-purple-500 shadow-lg shadow-purple-500/30';
                                            else if (isObstacle) cellClass += 'bg-red-800/60 border border-red-500/30';
                                            else if (isHead) cellClass += 'bg-cyan-400 shadow-lg shadow-cyan-400/40 animate-pulse';
                                            else if (isPath) cellClass += 'bg-cyan-600/60 border border-cyan-500/20';
                                            else cellClass += 'bg-slate-800/80 border border-slate-700/30';

                                            return <div key={`${row}-${col}`} className={cellClass} title={`[${row},${col}]`} />;
                                        })
                                    )}
                                </div>
                                <div className="flex gap-4 mt-2 text-[10px] text-slate-500 justify-center">
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm" /> Start</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-sm" /> Target</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-800 rounded-sm" /> Obstacle</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-600 rounded-sm" /> Trace</span>
                                </div>
                            </div>
                        )}

                        {rlPath && !rlRunning && (
                            <div className="p-2.5 mb-3 bg-black/40 rounded-lg text-xs font-mono text-cyan-300 overflow-hidden">
                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                    <span>Last: {rlPath.action}</span>
                                    <span>→ [{rlPath.next_move?.join(',')}]</span>
                                    <span>Conf: {((rlPath.confidence || 0) * 100).toFixed(0)}%</span>
                                </div>
                                {rlPath.reasoning && <div className="text-slate-500 mt-1.5 break-words text-[11px] leading-relaxed">{rlPath.reasoning}</div>}
                            </div>
                        )}

                        {/* Datasheet Parser */}
                        <div className="mb-4">
                            <div className="text-xs text-slate-400 mb-2 flex items-center gap-1 font-semibold">
                                <FileText className="w-3 h-3 text-purple-400" /> Intelligent Datasheet Parsing
                            </div>

                            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all group overflow-hidden relative
                                ${parsingDatasheet ? 'border-purple-500 bg-purple-900/10' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-purple-400'}`}>

                                {parsingDatasheet ? (
                                    <div className="flex flex-col items-center animate-pulse">
                                        <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                                        <p className="text-xs text-purple-300 font-mono">Parsing Technical Data...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-6 h-6 text-slate-500 group-hover:text-purple-400 mb-2 transition-colors" />
                                        <p className="text-xs text-slate-400">
                                            <span className="font-semibold">Upload Datasheet</span> (PDF/Image)
                                        </p>
                                    </div>
                                )}

                                <div className="mt-3">
                                    <label className="block text-xs text-slate-400 mb-1">OPTIONAL: Verification Constraints</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Vin > 24V, Iout > 2A..."
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none"
                                        id="ds-constraints"
                                    />
                                </div>

                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    className="hidden"
                                    disabled={parsingDatasheet}
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        setParsingDatasheet(true);
                                        addLog(`Parsing Datasheet: ${file.name}...`);

                                        // Get constraints if any
                                        const constraintsInput = document.getElementById('ds-constraints')?.value;
                                        let constraints = null;
                                        if (constraintsInput && constraintsInput.trim()) {
                                            constraints = { requirements: constraintsInput };
                                        }

                                        try {
                                            const res = await parseDatasheet(file, constraints);
                                            if (res.error) {
                                                addLog(`Gemini Error: ${res.error}`, 'error');
                                            } else {
                                                setDatasheetResult(res);
                                                addLog(`Part Found: ${res.component_info?.part_number}`, 'success');
                                            }
                                        } catch (err) { addLog(err.message, 'error'); }
                                        setParsingDatasheet(false);
                                    }}
                                />
                            </label>

                            {datasheetResult && (
                                <div className="mt-4 bg-gradient-to-br from-slate-900/90 to-purple-900/20 rounded-xl p-0.5 border border-purple-500/30 animate-in fade-in zoom-in duration-300 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="bg-slate-900/90 rounded-[11px] p-4 relative z-10">
                                        <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-2 gap-2 overflow-hidden">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-base font-bold text-white truncate">{datasheetResult.component_info?.part_number}</span>
                                                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 shrink-0">
                                                        {datasheetResult.component_info?.manufacturer}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1 truncate">{datasheetResult.component_info?.description}</div>
                                            </div>
                                            <div className="bg-emerald-500/20 p-1.5 rounded-full shrink-0">
                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                                <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <Zap className="w-3 h-3" /> Electrical
                                                </div>
                                                <div className="text-xs font-mono text-slate-200">
                                                    <div className="flex justify-between"><span>Max Vin:</span> <span className="text-cyan-300">{datasheetResult.electrical_specs?.input_voltage_max}</span></div>
                                                    <div className="flex justify-between"><span>Max Iout:</span> <span className="text-cyan-300">{datasheetResult.electrical_specs?.output_current_max}</span></div>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                                <div className="text-[10px] text-orange-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <Thermometer className="w-3 h-3" /> Thermal
                                                </div>
                                                <div className="text-xs font-mono text-slate-200">
                                                    <div className="flex justify-between"><span>Tj Max:</span> <span className="text-orange-300">{datasheetResult.thermal_specs?.max_junction_temp}</span></div>
                                                    <div className="flex justify-between"><span>Rth:</span> <span className="text-orange-300">{datasheetResult.thermal_specs?.package_thermal_resistance}</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Constraint Check Results */}
                                        {datasheetResult.constraint_check?.length > 0 && (
                                            <div className="mb-3">
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Constraint Verification</div>
                                                <div className="space-y-1">
                                                    {datasheetResult.constraint_check.map((cc, i) => (
                                                        <div key={i} className={`text-xs px-2.5 py-1.5 rounded flex items-center justify-between gap-2 overflow-hidden
                                                            ${cc.result === 'PASS' ? 'bg-emerald-900/20 border border-emerald-500/20 text-emerald-300' : 'bg-red-900/20 border border-red-500/20 text-red-300'}`}>
                                                            <span className="truncate min-w-0">{cc.constraint}</span>
                                                            <span className="font-bold shrink-0">{cc.result}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                            <div className="text-[10px] text-slate-500 mb-1 flex justify-between">
                                                <span>DETECTED PINOUT</span>
                                                <span className="text-[10px] text-purple-400">{datasheetResult.pin_configuration?.length || 0} Pins</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {datasheetResult.pin_configuration?.map((pin, i) => (
                                                    <span key={i} className="text-[10px] pl-1.5 pr-2 py-0.5 bg-slate-800 rounded-sm text-slate-300 border-l-2 border-purple-500 flex items-center gap-1">
                                                        <span className="font-bold text-slate-500">{pin.pin}</span>
                                                        <span className="font-mono text-purple-200">{pin.name}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {supplyRisk && (
                            <div className="p-2.5 bg-black/40 rounded-lg text-xs font-mono text-amber-300 overflow-hidden">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Supply Risk Analysis</div>
                                <pre className="text-amber-300/80 overflow-x-auto whitespace-pre-wrap break-words max-h-40 custom-scrollbar text-[11px]">
                                    {JSON.stringify(supplyRisk, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* --- PHASE 2 CONTENT: SMART PROCESS CONTROL --- */}
            {activePhase === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right fade-in duration-500">
                    {/* Process Flow Header */}
                    <div className="bg-gradient-to-r from-slate-900 via-yellow-900/20 to-slate-900 p-4 rounded-xl border border-yellow-500/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-yellow-500/20 rounded-lg">
                                    <Zap className="w-6 h-6 text-yellow-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Adaptive Process Control</h2>
                                    <p className="text-sm text-slate-400">AI-Driven Closed-Loop Manufacturing (Gemini 3 Flash)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {processRunning && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                        <span className="text-xs text-yellow-300 font-medium">Processing...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Process Flow Visualization */}
                        <div className="mt-6 flex items-center justify-between px-8">
                            {[
                                { id: 'etching', icon: Zap, label: 'Chemical Etching', color: 'cyan' },
                                { id: 'lamination', icon: Layers, label: 'Hot Press Lamination', color: 'orange' },
                                { id: 'plating', icon: Box, label: 'Copper Plating', color: 'emerald' }
                            ].map((process, i) => (
                                <React.Fragment key={process.id}>
                                    <button
                                        onClick={() => setActiveProcess(process.id)}
                                        className={`relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 ${
                                            activeProcess === process.id
                                                ? `bg-${process.color}-500/20 border-2 border-${process.color}-500/50 scale-105`
                                                : 'bg-slate-800/50 border border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        {processRunning && activeProcess === process.id && (
                                            <div className="absolute inset-0 rounded-xl overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                                            </div>
                                        )}
                                        <div className={`p-3 rounded-full mb-2 ${
                                            activeProcess === process.id ? `bg-${process.color}-500/30` : 'bg-white/5'
                                        }`}>
                                            <process.icon className={`w-6 h-6 ${
                                                activeProcess === process.id ? `text-${process.color}-400` : 'text-slate-400'
                                            }`} />
                                        </div>
                                        <span className={`text-sm font-medium ${
                                            activeProcess === process.id ? 'text-white' : 'text-slate-400'
                                        }`}>{process.label}</span>
                                        {activeProcess === process.id && (
                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-${process.color}-500/50`} />
                                        )}
                                    </button>
                                    {i < 2 && (
                                        <div className="flex-1 flex items-center justify-center px-2">
                                            <div className={`h-0.5 flex-1 ${processAnimationStep > 0 ? 'bg-gradient-to-r from-cyan-500 via-yellow-500 to-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                                            <ArrowRight className={`w-5 h-5 mx-1 ${processAnimationStep > 0 ? 'text-yellow-400' : 'text-slate-600'}`} />
                                            <div className={`h-0.5 flex-1 ${processAnimationStep > 0 ? 'bg-gradient-to-r from-cyan-500 via-yellow-500 to-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Left: Process Control Panel */}
                        <div className="col-span-2 bg-slate-800/50 p-6 rounded-xl border border-white/5">
                            {/* ETCHING CONTROL */}
                            {activeProcess === 'etching' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Zap className="text-cyan-400" /> Chemical Etching Control
                                        </h3>
                                        <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full">Cupric Chloride Process</span>
                                    </div>

                                    {/* Parameter Controls */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-sm text-slate-300">Copper Weight</label>
                                                    <span className="text-lg font-bold text-cyan-400 font-mono">{etchingParams.copperWeight}oz</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="3"
                                                    step="0.5"
                                                    value={etchingParams.copperWeight}
                                                    onChange={(e) => setEtchingParams(p => ({ ...p, copperWeight: parseFloat(e.target.value) }))}
                                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                                />
                                                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                                    <span>0.5oz</span>
                                                    <span>1oz (Std)</span>
                                                    <span>2oz</span>
                                                    <span>3oz</span>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-sm text-slate-300">Chemical Concentration</label>
                                                    <span className="text-lg font-bold text-cyan-400 font-mono">{etchingParams.concentration}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="60"
                                                    max="140"
                                                    step="10"
                                                    value={etchingParams.concentration}
                                                    onChange={(e) => setEtchingParams(p => ({ ...p, concentration: parseInt(e.target.value) }))}
                                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                                />
                                                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                                    <span>60%</span>
                                                    <span>100% (Std)</span>
                                                    <span>140%</span>
                                                </div>
                                                {etchingParams.concentration > 120 && (
                                                    <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" /> High concentration - delamination risk
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Visual Process Animation */}
                                        <div className="relative bg-black/40 rounded-xl border border-cyan-500/20 p-4 overflow-hidden">
                                            <div className="absolute top-2 right-2 text-[10px] text-cyan-400">LIVE PREVIEW</div>

                                            {/* Animated Conveyor */}
                                            <div className="h-full flex flex-col justify-center items-center">
                                                <div className="relative w-full h-24 bg-slate-900 rounded-lg overflow-hidden">
                                                    {/* Conveyor belt */}
                                                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-slate-700 flex items-center">
                                                        <div className={`flex gap-2 ${processRunning ? 'animate-marquee' : ''}`} style={{ animation: processRunning ? 'marquee 2s linear infinite' : 'none' }}>
                                                            {[...Array(20)].map((_, i) => (
                                                                <div key={i} className="w-4 h-2 bg-slate-600 rounded-sm" />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* PCB on conveyor */}
                                                    <div className={`absolute bottom-4 transition-all duration-1000 ${
                                                        processRunning ? 'left-[70%]' : 'left-[10%]'
                                                    }`}>
                                                        <div className="w-16 h-10 bg-emerald-700 rounded border-2 border-emerald-500/50 flex items-center justify-center">
                                                            <span className="text-[8px] text-emerald-200">PCB</span>
                                                        </div>
                                                    </div>

                                                    {/* Spray nozzles */}
                                                    <div className="absolute top-2 left-1/4 right-1/4 flex justify-around">
                                                        {[...Array(3)].map((_, i) => (
                                                            <div key={i} className="flex flex-col items-center">
                                                                <div className="w-3 h-3 bg-slate-600 rounded-full" />
                                                                {processRunning && (
                                                                    <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="mt-4 text-xs text-slate-400 text-center">
                                                    {processRunning ? 'Etching in progress...' : 'Ready for etching'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleEtchingControl}
                                        disabled={processRunning}
                                        className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 rounded-xl text-white font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {processRunning ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" /> Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-5 h-5" /> Run Etching Control
                                            </>
                                        )}
                                    </button>

                                    {/* Results */}
                                    {etchingResult && (
                                        <div className="p-4 bg-gradient-to-r from-cyan-900/30 to-slate-900/50 rounded-xl border border-cyan-500/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle className="w-5 h-5 text-cyan-400" />
                                                <span className="text-sm font-semibold text-cyan-300">Control Actions Calculated</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="p-3 bg-black/40 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-cyan-400 font-mono">{etchingResult.control_actions?.conveyor_speed_m_min}</div>
                                                    <div className="text-[10px] text-slate-400">m/min Speed</div>
                                                </div>
                                                <div className="p-3 bg-black/40 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-cyan-400 font-mono">{etchingResult.control_actions?.spray_pressure_bar}</div>
                                                    <div className="text-[10px] text-slate-400">bar Pressure</div>
                                                </div>
                                                <div className={`p-3 rounded-lg text-center ${
                                                    etchingResult.control_actions?.oxide_safety_check === 'PASS'
                                                        ? 'bg-emerald-900/30 border border-emerald-500/30'
                                                        : 'bg-red-900/30 border border-red-500/30'
                                                }`}>
                                                    <div className={`text-2xl font-bold ${
                                                        etchingResult.control_actions?.oxide_safety_check === 'PASS' ? 'text-emerald-400' : 'text-red-400'
                                                    }`}>
                                                        {etchingResult.control_actions?.oxide_safety_check?.split(' ')[0]}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">Safety Check</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* LAMINATION CONTROL */}
                            {activeProcess === 'lamination' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Layers className="text-orange-400" /> Lamination Scaling Prediction
                                        </h3>
                                        <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">CTE Compensation</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                                <label className="text-sm text-slate-300 mb-3 block">Material Type</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {['FR4-Standard', 'Polyimide', 'Rogers-4000'].map((mat) => (
                                                        <button
                                                            key={mat}
                                                            onClick={() => setLaminationParams(p => ({ ...p, material: mat }))}
                                                            className={`p-3 rounded-lg text-left transition-all ${
                                                                laminationParams.material === mat
                                                                    ? 'bg-orange-500/20 border-2 border-orange-500/50 text-orange-300'
                                                                    : 'bg-slate-800/50 border border-white/5 text-slate-400 hover:border-white/20'
                                                            }`}
                                                        >
                                                            <div className="font-medium">{mat}</div>
                                                            <div className="text-[10px] opacity-70">
                                                                {mat === 'FR4-Standard' && 'Standard PCB material'}
                                                                {mat === 'Polyimide' && 'High-temp flex circuits'}
                                                                {mat === 'Rogers-4000' && 'RF/Microwave applications'}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-sm text-slate-300">Layer Count</label>
                                                    <span className="text-lg font-bold text-orange-400 font-mono">{laminationParams.layers}L</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="2"
                                                    max="16"
                                                    step="2"
                                                    value={laminationParams.layers}
                                                    onChange={(e) => setLaminationParams(p => ({ ...p, layers: parseInt(e.target.value) }))}
                                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                />
                                                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                                    <span>2L</span>
                                                    <span>4L</span>
                                                    <span>8L</span>
                                                    <span>16L</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Layer Stack Visualization */}
                                        <div className="relative bg-black/40 rounded-xl border border-orange-500/20 p-4 overflow-hidden">
                                            <div className="absolute top-2 right-2 text-[10px] text-orange-400">STACK-UP PREVIEW</div>

                                            <div className="h-full flex items-center justify-center">
                                                <div className="relative">
                                                    {/* Layer stack */}
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        {[...Array(Math.min(laminationParams.layers, 8))].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`w-32 h-3 rounded-sm transition-all duration-300 ${
                                                                    i % 2 === 0 ? 'bg-amber-600' : 'bg-emerald-700'
                                                                } ${processRunning ? 'animate-pulse' : ''}`}
                                                                style={{
                                                                    transform: processRunning ? `scaleY(${1 + (processAnimationStep * 0.1)})` : 'scaleY(1)',
                                                                    opacity: processRunning ? 0.7 + (i * 0.05) : 1
                                                                }}
                                                            />
                                                        ))}
                                                    </div>

                                                    {/* Press plates */}
                                                    {processRunning && (
                                                        <>
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-4 bg-slate-500 rounded animate-bounce" style={{ animationDuration: '0.5s' }} />
                                                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-4 bg-slate-500 rounded animate-bounce" style={{ animationDuration: '0.5s', animationDelay: '0.25s' }} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="absolute bottom-2 left-0 right-0 text-center">
                                                <span className="text-[10px] text-slate-500">
                                                    {processRunning ? 'Hot press cycle...' : `${laminationParams.layers}-layer stack`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLaminationPredict}
                                        disabled={processRunning}
                                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-xl text-white font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {processRunning ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" /> Calculating...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-5 h-5" /> Predict Scaling Factors
                                            </>
                                        )}
                                    </button>

                                    {/* Results */}
                                    {laminationResult && (
                                        <div className="p-4 bg-gradient-to-r from-orange-900/30 to-slate-900/50 rounded-xl border border-orange-500/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle className="w-5 h-5 text-orange-400" />
                                                <span className="text-sm font-semibold text-orange-300">Compensation Factors Calculated</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="p-3 bg-black/40 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-orange-400 font-mono">{laminationResult.scaling_factors?.x_comp}</div>
                                                    <div className="text-[10px] text-slate-400">mils/in X-Comp</div>
                                                </div>
                                                <div className="p-3 bg-black/40 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-orange-400 font-mono">{laminationResult.scaling_factors?.y_comp}</div>
                                                    <div className="text-[10px] text-slate-400">mils/in Y-Comp</div>
                                                </div>
                                                <div className="p-3 bg-emerald-900/30 rounded-lg text-center border border-emerald-500/30">
                                                    <div className="text-sm font-bold text-emerald-400">{laminationResult.drill_program_offset}</div>
                                                    <div className="text-[10px] text-slate-400">Drill Program</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PLATING CONTROL */}
                            {activeProcess === 'plating' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Box className="text-emerald-400" /> Plating Uniformity Optimization
                                        </h3>
                                        <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">Current Density FEM</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-sm text-slate-300">Panel Width</label>
                                                    <span className="text-lg font-bold text-emerald-400 font-mono">{platingParams.width}mm</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="100"
                                                    max="600"
                                                    step="50"
                                                    value={platingParams.width}
                                                    onChange={(e) => setPlatingParams(p => ({ ...p, width: parseInt(e.target.value) }))}
                                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                                />
                                            </div>

                                            <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-sm text-slate-300">Panel Height</label>
                                                    <span className="text-lg font-bold text-emerald-400 font-mono">{platingParams.height}mm</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="100"
                                                    max="600"
                                                    step="50"
                                                    value={platingParams.height}
                                                    onChange={(e) => setPlatingParams(p => ({ ...p, height: parseInt(e.target.value) }))}
                                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                                />
                                            </div>

                                            <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-400">Panel Area:</span>
                                                    <span className="text-emerald-400 font-mono">{(platingParams.width * platingParams.height / 100).toFixed(0)} cm²</span>
                                                </div>
                                                <div className="flex justify-between text-sm mt-1">
                                                    <span className="text-slate-400">Classification:</span>
                                                    <span className={`font-medium ${platingParams.width * platingParams.height > 50000 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                        {platingParams.width * platingParams.height > 50000 ? 'Large Panel' : 'Standard Panel'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Current Density Heatmap Visualization */}
                                        <div className="relative bg-black/40 rounded-xl border border-emerald-500/20 p-4 overflow-hidden">
                                            <div className="absolute top-2 right-2 text-[10px] text-emerald-400">CURRENT DENSITY MAP</div>

                                            <div className="h-full flex items-center justify-center">
                                                <div
                                                    className="relative rounded-lg overflow-hidden border-2 border-emerald-500/30"
                                                    style={{
                                                        width: `${Math.min(platingParams.width / 3, 180)}px`,
                                                        height: `${Math.min(platingParams.height / 3, 140)}px`
                                                    }}
                                                >
                                                    {/* Gradient showing edge concentration */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/60 via-emerald-500/30 to-red-500/60" />
                                                    <div className="absolute inset-0 bg-gradient-to-b from-red-500/60 via-transparent to-red-500/60" />

                                                    {/* Center label */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="text-[10px] text-white bg-black/50 px-2 py-1 rounded">
                                                            {processRunning ? 'Optimizing...' : 'Dog-bone Effect'}
                                                        </div>
                                                    </div>

                                                    {/* Animated current flow */}
                                                    {processRunning && (
                                                        <div className="absolute inset-0">
                                                            {[...Array(8)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                                                                    style={{
                                                                        left: `${10 + (i % 4) * 25}%`,
                                                                        top: `${10 + Math.floor(i / 4) * 80}%`,
                                                                        animationDelay: `${i * 0.2}s`
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[8px]">
                                                <span className="text-red-400">High Density</span>
                                                <span className="text-emerald-400">Uniform</span>
                                                <span className="text-red-400">High Density</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePlatingOptimize}
                                        disabled={processRunning}
                                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl text-white font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {processRunning ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" /> Optimizing...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-5 h-5" /> Optimize Plating Setup
                                            </>
                                        )}
                                    </button>

                                    {/* Results */}
                                    {platingResult && (
                                        <div className="p-4 bg-gradient-to-r from-emerald-900/30 to-slate-900/50 rounded-xl border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                <span className="text-sm font-semibold text-emerald-300">Optimization Complete</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-black/40 rounded-lg">
                                                    <div className="text-[10px] text-slate-500 mb-1">Suggested Setup</div>
                                                    <div className="text-sm text-white">{platingResult.suggested_setup}</div>
                                                </div>
                                                <div className="p-3 bg-black/40 rounded-lg text-center">
                                                    <div className="relative w-16 h-16 mx-auto">
                                                        <svg className="w-full h-full -rotate-90">
                                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-700" />
                                                            <circle
                                                                cx="32" cy="32" r="28"
                                                                stroke="currentColor" strokeWidth="6" fill="none"
                                                                strokeDasharray={`${(platingResult.predicted_uniformity_score || 0) * 1.76} 176`}
                                                                strokeLinecap="round"
                                                                className="text-emerald-500"
                                                            />
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-lg font-bold text-emerald-400">{platingResult.predicted_uniformity_score}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-1">Uniformity Score</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: AI Control Loop Panel */}
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Activity className="text-yellow-400" /> AI Control Loop
                            </h3>

                            <div className="space-y-4">
                                {/* Process Monitor Gauges */}
                                <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-400 mb-3">Real-Time Sensors</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center">
                                            <div className="relative w-16 h-16 mx-auto">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-700" />
                                                    <circle
                                                        cx="32" cy="32" r="28"
                                                        stroke="currentColor" strokeWidth="4" fill="none"
                                                        strokeDasharray="110 176"
                                                        className="text-cyan-500"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-white">3.1</span>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1">pH Level</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="relative w-16 h-16 mx-auto">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-700" />
                                                    <circle
                                                        cx="32" cy="32" r="28"
                                                        stroke="currentColor" strokeWidth="4" fill="none"
                                                        strokeDasharray="140 176"
                                                        className="text-orange-500"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-white">52°</span>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1">Etchant Temp</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Gemini AI Feedback */}
                                <div className="p-4 bg-gradient-to-br from-yellow-900/20 to-slate-900/50 rounded-xl border border-yellow-500/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-yellow-400" />
                                        <span className="text-xs font-semibold text-yellow-300">Gemini 3 Flash</span>
                                    </div>

                                    <button
                                        onClick={handleProcessLoop}
                                        disabled={loading}
                                        className="w-full py-2 bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm font-medium transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Analyzing...' : 'Run AI Control Loop'}
                                    </button>

                                    {processLoop && (
                                        <div className="mt-3 p-3 bg-black/40 rounded-lg animate-in fade-in duration-300">
                                            <div className={`text-sm font-bold ${
                                                processLoop.status?.includes('Under') ? 'text-amber-400' : 'text-emerald-400'
                                            }`}>
                                                {processLoop.status}
                                            </div>
                                            {processLoop.adjustment_command && (
                                                <div className="mt-2 space-y-1">
                                                    <div className="text-[10px] text-slate-400">Recommended Action:</div>
                                                    <div className="text-xs text-cyan-300">
                                                        {processLoop.adjustment_command.parameter}: {processLoop.adjustment_command.action}
                                                    </div>
                                                    <div className="text-xs text-cyan-400 font-mono">
                                                        Delta: {processLoop.adjustment_command.value_delta_percent}%
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Process Steps Indicator */}
                                <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-400 mb-3">Process Steps</div>
                                    <div className="space-y-2">
                                        {['Input Parameters', 'Physics Simulation', 'AI Optimization', 'Output Actions'].map((step, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                    processAnimationStep > i
                                                        ? 'bg-emerald-500 text-white'
                                                        : processAnimationStep === i + 1
                                                        ? 'bg-yellow-500 text-white animate-pulse'
                                                        : 'bg-slate-700 text-slate-400'
                                                }`}>
                                                    {processAnimationStep > i ? '✓' : i + 1}
                                                </div>
                                                <span className={`text-xs ${
                                                    processAnimationStep >= i + 1 ? 'text-white' : 'text-slate-500'
                                                }`}>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PHASE 3 CONTENT: INTELLIGENT QUALITY CONTROL --- */}
            {activePhase === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right fade-in duration-500">
                    {/* Header Stats Bar */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/60 p-4 rounded-xl border border-purple-500/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-500/20 rounded-lg">
                                    <Scan className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white font-mono">AOI</div>
                                    <div className="text-xs text-slate-400">Optical Inspection</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/60 p-4 rounded-xl border border-blue-500/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/20 rounded-lg">
                                    <Layers className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white font-mono">AXI</div>
                                    <div className="text-xs text-slate-400">X-Ray Inspection</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/60 p-4 rounded-xl border border-emerald-500/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-500/20 rounded-lg">
                                    <Shield className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white font-mono">IPC-A-610</div>
                                    <div className="text-xs text-slate-400">Class 2 Standard</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-900/40 to-slate-900/60 p-4 rounded-xl border border-amber-500/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500/20 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white font-mono">Gemini 3</div>
                                    <div className="text-xs text-slate-400">Vision AI Engine</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* LEFT: AI-Powered AOI */}
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 overflow-hidden">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Eye className="w-5 h-5 text-purple-400" />
                                    </div>
                                    AI-Powered Defect Classification
                                </h3>
                                <span className="text-[10px] px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                                    Replaces Rule-Based AOI
                                </span>
                            </div>

                            {/* Golden Sample Toggle */}
                            <div className="flex items-center gap-3 mb-4 bg-black/30 p-3 rounded-lg border border-white/5">
                                <Image className="w-4 h-4 text-slate-500" />
                                <div className="text-xs text-slate-400 font-medium flex-1">
                                    Golden Sample Comparison (False Positive Filter)
                                </div>
                                <button
                                    onClick={() => setUseGoldenSample(!useGoldenSample)}
                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 ${useGoldenSample ? 'bg-purple-600 shadow-lg shadow-purple-500/30' : 'bg-slate-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${useGoldenSample ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>

                            {useGoldenSample && (
                                <div className="mb-4 p-3 bg-amber-900/10 border border-amber-500/20 rounded-lg">
                                    <label className="block text-xs text-amber-300 mb-2 flex items-center gap-1">
                                        <Target className="w-3 h-3" /> Reference Board (Golden Sample)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setGoldenSampleFile(e.target.files[0])}
                                        className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-amber-600/30 file:text-amber-300 hover:file:bg-amber-600/50 cursor-pointer"
                                    />
                                    {goldenSampleFile && (
                                        <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> {goldenSampleFile.name}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Upload Zone */}
                            <label className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all group overflow-hidden
                                ${aoiLoading ? 'border-purple-500 bg-purple-900/20' : 'border-slate-600 bg-slate-900/50 hover:bg-slate-800/50 hover:border-purple-400'}
                                ${useGoldenSample && !goldenSampleFile ? 'opacity-50 cursor-not-allowed' : ''}`}>

                                {/* Animated scanning effect during loading */}
                                {aoiLoading && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 via-transparent to-transparent animate-pulse" />
                                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                                            style={{ animation: 'scan 1.5s ease-in-out infinite' }} />
                                        <style>{`
                                            @keyframes scan {
                                                0%, 100% { transform: translateY(0); opacity: 1; }
                                                50% { transform: translateY(150px); opacity: 0.5; }
                                            }
                                        `}</style>
                                    </>
                                )}

                                {/* Preview Image */}
                                {aoiPreviewUrl && !aoiLoading && (
                                    <div className="absolute inset-0 opacity-30">
                                        <img src={aoiPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="relative z-10 flex flex-col items-center justify-center">
                                    {aoiLoading ? (
                                        <>
                                            <div className="relative">
                                                <Scan className="w-10 h-10 text-purple-400 animate-pulse" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 border-2 border-purple-500/50 rounded-full animate-ping" />
                                                </div>
                                            </div>
                                            <p className="text-sm text-purple-300 mt-3 font-medium">Gemini 3 Vision Analyzing...</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Detecting defects with AI</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-purple-500/10 rounded-full mb-3 group-hover:bg-purple-500/20 transition-colors">
                                                <Camera className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <p className="text-sm text-slate-300">
                                                <span className="font-semibold text-purple-300">Upload PCB Image</span> for inspection
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1">JPG, PNG up to 10MB</p>
                                        </>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={aoiLoading || (useGoldenSample && !goldenSampleFile)}
                                    onChange={handleVisionCheck}
                                />
                            </label>

                            {/* Results Section */}
                            {visionResult && !visionResult.error && (
                                <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                                    {/* Verdict Banner */}
                                    <div className={`relative overflow-hidden rounded-xl p-4 ${
                                        visionResult.verdict === 'FAIL'
                                            ? 'bg-gradient-to-r from-red-900/60 to-red-800/40 border border-red-500/40'
                                            : 'bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 border border-emerald-500/40'
                                    }`}>
                                        {/* Animated background pulse for FAIL */}
                                        {visionResult.verdict === 'FAIL' && (
                                            <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                                        )}
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {visionResult.verdict === 'FAIL' ? (
                                                    <div className="p-2 bg-red-500/30 rounded-full">
                                                        <XCircle className="w-6 h-6 text-red-400" />
                                                    </div>
                                                ) : (
                                                    <div className="p-2 bg-emerald-500/30 rounded-full">
                                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className={`text-xl font-bold ${visionResult.verdict === 'FAIL' ? 'text-red-300' : 'text-emerald-300'}`}>
                                                        {visionResult.verdict || 'PASS'}
                                                    </div>
                                                    <div className="text-xs text-slate-300">{visionResult.inspection_standard || 'IPC-A-610'}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex gap-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-red-400 font-mono">{visionResult.fatal_count || 0}</div>
                                                        <div className="text-[10px] text-red-300/70">FATAL</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-amber-400 font-mono">{visionResult.cosmetic_count || 0}</div>
                                                        <div className="text-[10px] text-amber-300/70">COSMETIC</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-slate-400 font-mono">{visionResult.false_positives_filtered || 0}</div>
                                                        <div className="text-[10px] text-slate-400/70">FILTERED</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    {visionResult.summary && (
                                        <div className="p-3 bg-black/30 rounded-lg border border-white/5">
                                            <p className="text-sm text-slate-300">{visionResult.summary}</p>
                                        </div>
                                    )}

                                    {/* Defects Table */}
                                    {visionResult.defects_found?.length > 0 && (
                                        <div className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                                            <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                                <span className="text-xs font-semibold text-slate-300">Defect Analysis ({visionResult.defects_found.length})</span>
                                            </div>
                                            <div className="divide-y divide-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                                {visionResult.defects_found.map((defect, i) => (
                                                    <div key={i} className="p-3 hover:bg-white/5 transition-colors">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                                <div className={`mt-0.5 p-1.5 rounded-md ${
                                                                    defect.severity === 'FATAL'
                                                                        ? 'bg-red-500/20 text-red-400'
                                                                        : 'bg-amber-500/20 text-amber-400'
                                                                }`}>
                                                                    {defect.severity === 'FATAL' ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-sm font-medium text-white">{defect.type}</span>
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                                                            defect.severity === 'FATAL'
                                                                                ? 'bg-red-500/30 text-red-300'
                                                                                : 'bg-amber-500/30 text-amber-300'
                                                                        }`}>
                                                                            {defect.severity}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-slate-400 mt-0.5">{defect.location}</div>
                                                                    {defect.action && (
                                                                        <div className="text-[11px] text-cyan-400/80 mt-1.5 flex items-start gap-1">
                                                                            <Wrench className="w-3 h-3 mt-0.5 shrink-0" />
                                                                            <span>{defect.action}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* Confidence Gauge */}
                                                            <div className="text-right shrink-0">
                                                                <div className="w-12 h-12 relative">
                                                                    <svg className="w-full h-full -rotate-90">
                                                                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-700" />
                                                                        <circle
                                                                            cx="24" cy="24" r="20"
                                                                            stroke="currentColor" strokeWidth="4" fill="none"
                                                                            strokeDasharray={`${(defect.confidence || 0) * 1.256} 125.6`}
                                                                            className={defect.confidence >= 90 ? 'text-emerald-500' : defect.confidence >= 70 ? 'text-amber-500' : 'text-red-500'}
                                                                        />
                                                                    </svg>
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <span className="text-[10px] font-bold text-white">{defect.confidence || 0}%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {visionResult?.error && (
                                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-300">
                                    Error: {visionResult.error}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: X-Ray Analysis */}
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 overflow-hidden">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Layers className="w-5 h-5 text-blue-400" />
                                    </div>
                                    X-Ray Multilayer Inspection
                                </h3>
                                <span className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                                    BGA / Via / Layer Analysis
                                </span>
                            </div>

                            {/* Upload Zone */}
                            <label className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all group overflow-hidden
                                ${xrayLoading ? 'border-blue-500 bg-blue-900/20' : 'border-slate-600 bg-slate-900/50 hover:bg-slate-800/50 hover:border-blue-400'}`}>

                                {/* Animated X-ray scanning effect */}
                                {xrayLoading && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-blue-500/10 animate-pulse" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-32 h-32 border border-blue-500/30 rounded-full animate-ping opacity-50" />
                                            <div className="absolute w-24 h-24 border border-blue-500/40 rounded-full animate-ping opacity-30" style={{ animationDelay: '0.5s' }} />
                                        </div>
                                    </>
                                )}

                                {/* Preview Image */}
                                {xrayPreviewUrl && !xrayLoading && (
                                    <div className="absolute inset-0 opacity-30">
                                        <img src={xrayPreviewUrl} alt="X-Ray Preview" className="w-full h-full object-cover filter grayscale" />
                                    </div>
                                )}

                                <div className="relative z-10 flex flex-col items-center justify-center">
                                    {xrayLoading ? (
                                        <>
                                            <Radio className="w-10 h-10 text-blue-400 animate-pulse" />
                                            <p className="text-sm text-blue-300 mt-3 font-medium">Analyzing X-Ray Image...</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Detecting voids, HiP, misalignment</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-blue-500/10 rounded-full mb-3 group-hover:bg-blue-500/20 transition-colors">
                                                <Grid3X3 className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <p className="text-sm text-slate-300">
                                                <span className="font-semibold text-blue-300">Upload X-Ray Image</span> for AXI
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1">BGA slices, via cross-sections</p>
                                        </>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={xrayLoading}
                                    onChange={handleXRayCheck}
                                />
                            </label>

                            {/* X-Ray Results */}
                            {xrayResult && !xrayResult.error && (
                                <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                                    {/* Inspection Type Header */}
                                    <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-lg border border-blue-500/20">
                                        <div className="flex items-center gap-2">
                                            <Scan className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-semibold text-blue-300">{xrayResult.inspection_type || '3D AXI'}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">Gemini 3 Pro Vision</span>
                                    </div>

                                    {/* BGA Analysis Card */}
                                    {xrayResult.bga_analysis && (
                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CircleDot className="w-4 h-4 text-cyan-400" />
                                                <span className="text-sm font-semibold text-white">BGA Solder Ball Analysis</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Void Percentage Gauge */}
                                                <div className="flex flex-col items-center p-3 bg-white/5 rounded-lg">
                                                    <div className="relative w-24 h-24">
                                                        <svg className="w-full h-full -rotate-90">
                                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-700" />
                                                            <circle
                                                                cx="48" cy="48" r="40"
                                                                stroke="currentColor" strokeWidth="8" fill="none"
                                                                strokeDasharray={`${(xrayResult.bga_analysis.max_void_percentage || 0) * 2.51} 251.2`}
                                                                strokeLinecap="round"
                                                                className={
                                                                    (xrayResult.bga_analysis.max_void_percentage || 0) <= 25
                                                                        ? 'text-emerald-500'
                                                                        : (xrayResult.bga_analysis.max_void_percentage || 0) <= 40
                                                                        ? 'text-amber-500'
                                                                        : 'text-red-500'
                                                                }
                                                            />
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <span className="text-xl font-bold text-white">{xrayResult.bga_analysis.max_void_percentage || 0}%</span>
                                                            <span className="text-[10px] text-slate-400">Max Void</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-[10px] text-slate-500">IPC Limit: 25%</div>
                                                </div>
                                                {/* Status and Details */}
                                                <div className="flex flex-col justify-center space-y-3">
                                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                                        xrayResult.bga_analysis.status === 'PASS'
                                                            ? 'bg-emerald-900/30 border border-emerald-500/30'
                                                            : 'bg-red-900/30 border border-red-500/30'
                                                    }`}>
                                                        {xrayResult.bga_analysis.status === 'PASS' ? (
                                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-red-400" />
                                                        )}
                                                        <span className={`text-sm font-bold ${
                                                            xrayResult.bga_analysis.status === 'PASS' ? 'text-emerald-300' : 'text-red-300'
                                                        }`}>
                                                            {xrayResult.bga_analysis.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {xrayResult.bga_analysis.voids_found ? 'Voids detected in solder balls' : 'No significant voids detected'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Layer Alignment Card */}
                                    {xrayResult.layer_alignment && (
                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Layers className="w-4 h-4 text-purple-400" />
                                                <span className="text-sm font-semibold text-white">Layer Alignment & Via Integrity</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="p-3 bg-white/5 rounded-lg text-center">
                                                    <div className="text-lg font-bold text-cyan-300 font-mono">
                                                        {xrayResult.layer_alignment.misalignment_um || 0}<span className="text-xs text-slate-500">um</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-1">Misalignment</div>
                                                </div>
                                                <div className={`p-3 rounded-lg text-center ${
                                                    xrayResult.layer_alignment.status === 'GOOD'
                                                        ? 'bg-emerald-900/30 border border-emerald-500/20'
                                                        : 'bg-amber-900/30 border border-amber-500/20'
                                                }`}>
                                                    <div className={`text-lg font-bold ${
                                                        xrayResult.layer_alignment.status === 'GOOD' ? 'text-emerald-300' : 'text-amber-300'
                                                    }`}>
                                                        {xrayResult.layer_alignment.status}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-1">Alignment</div>
                                                </div>
                                                <div className={`p-3 rounded-lg text-center ${
                                                    !xrayResult.layer_alignment.barrel_distortion_detected
                                                        ? 'bg-emerald-900/30 border border-emerald-500/20'
                                                        : 'bg-red-900/30 border border-red-500/20'
                                                }`}>
                                                    <div className={`text-lg font-bold ${
                                                        !xrayResult.layer_alignment.barrel_distortion_detected ? 'text-emerald-300' : 'text-red-300'
                                                    }`}>
                                                        {xrayResult.layer_alignment.barrel_distortion_detected ? 'YES' : 'NO'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-1">Barrel Distortion</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Anomalies List */}
                                    {xrayResult.anomalies?.length > 0 && (
                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                                <span className="text-sm font-semibold text-white">Anomalies Detected</span>
                                            </div>
                                            <div className="space-y-2">
                                                {xrayResult.anomalies.map((anomaly, i) => (
                                                    <div key={i} className="flex items-start gap-2 p-2 bg-amber-900/20 rounded-lg border border-amber-500/20">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                                        <span className="text-xs text-amber-200">{anomaly}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {xrayResult?.error && (
                                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-300">
                                    Error: {xrayResult.error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- PHASE 4 CONTENT --- */}
            {
                activePhase === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right fade-in duration-500">
                        {/* Maintenance Header */}
                        <div className="bg-gradient-to-r from-slate-900 via-orange-900/20 to-slate-900 p-4 rounded-xl border border-orange-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-500/20 rounded-lg">
                                        <Wrench className="w-6 h-6 text-orange-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Predictive Maintenance Center</h2>
                                        <p className="text-sm text-slate-400">AI-Powered Equipment Health Monitoring</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {fleetData && (
                                        <div className="flex items-center gap-4 px-4 py-2 bg-black/30 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                                <span className="text-sm text-emerald-300">{fleetData.running} Running</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                                                <span className="text-sm text-amber-300">{fleetData.warnings} Warnings</span>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { loadFleetStatus(); loadDrillInventory(); loadAnomalyHistory(); }}
                                        className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors"
                                    >
                                        <RefreshCw className={`w-5 h-5 text-orange-400 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="flex gap-2 mt-4">
                                {[
                                    { id: 'fleet', icon: Server, label: 'Machine Fleet' },
                                    { id: 'drills', icon: Disc, label: 'Drill Inventory' },
                                    { id: 'fft', icon: Waves, label: 'FFT Analysis' },
                                    { id: 'history', icon: History, label: 'Anomaly Log' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setMaintView(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                            maintView === tab.id
                                                ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                                                : 'bg-black/20 text-slate-400 hover:text-white border border-transparent'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="grid grid-cols-3 gap-6">
                            {/* Left: Main View */}
                            <div className="col-span-2 space-y-6">
                                {/* MACHINE FLEET VIEW */}
                                {maintView === 'fleet' && (
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Server className="text-cyan-400" /> CNC Machine Fleet Status
                                        </h3>
                                        {fleetData ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {fleetData.machines.map(machine => (
                                                    <div
                                                        key={machine.id}
                                                        onClick={() => handleThermalAnalysis(machine)}
                                                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                                                            machine.status === 'WARNING'
                                                                ? 'bg-amber-900/20 border-amber-500/30 hover:border-amber-500/50'
                                                                : machine.status === 'IDLE'
                                                                ? 'bg-slate-900/50 border-slate-600/30 hover:border-slate-500/50'
                                                                : 'bg-emerald-900/20 border-emerald-500/30 hover:border-emerald-500/50'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <div className="text-sm font-bold text-white">{machine.id}</div>
                                                                <div className="text-xs text-slate-400">{machine.type}</div>
                                                            </div>
                                                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                machine.status === 'WARNING' ? 'bg-amber-500/30 text-amber-300' :
                                                                machine.status === 'IDLE' ? 'bg-slate-500/30 text-slate-300' :
                                                                'bg-emerald-500/30 text-emerald-300'
                                                            }`}>
                                                                {machine.status}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                                            <div className="text-center p-2 bg-black/30 rounded-lg">
                                                                <div className="text-lg font-bold text-cyan-400 font-mono">{machine.spindle_rpm > 0 ? (machine.spindle_rpm / 1000).toFixed(0) + 'K' : '---'}</div>
                                                                <div className="text-[9px] text-slate-500">RPM</div>
                                                            </div>
                                                            <div className="text-center p-2 bg-black/30 rounded-lg">
                                                                <div className={`text-lg font-bold font-mono ${machine.spindle_temp_c > 65 ? 'text-red-400' : machine.spindle_temp_c > 55 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                                    {machine.spindle_temp_c}°
                                                                </div>
                                                                <div className="text-[9px] text-slate-500">TEMP</div>
                                                            </div>
                                                            <div className="text-center p-2 bg-black/30 rounded-lg">
                                                                <div className={`text-lg font-bold font-mono ${machine.vibration_rms > 2.0 ? 'text-red-400' : machine.vibration_rms > 1.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                                    {machine.vibration_rms}
                                                                </div>
                                                                <div className="text-[9px] text-slate-500">RMS</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between text-[10px]">
                                                            <span className="text-slate-500">Job: {machine.current_job || 'None'}</span>
                                                            <span className="text-slate-500">{machine.uptime_hours}h uptime</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-slate-500">
                                                <Server className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                                <p>Loading fleet data...</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* DRILL INVENTORY VIEW */}
                                {maintView === 'drills' && (
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                <Disc className="text-purple-400" /> Drill Bit Inventory
                                            </h3>
                                            {drillInventory && (
                                                <div className="flex gap-3 text-xs">
                                                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded">{drillInventory.ok} OK</span>
                                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded">{drillInventory.warning} Warning</span>
                                                    <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded">{drillInventory.critical} Critical</span>
                                                </div>
                                            )}
                                        </div>
                                        {drillInventory ? (
                                            <div className="grid grid-cols-4 gap-3">
                                                {drillInventory.drills.map(drill => {
                                                    const usage = (drill.hits / drill.max_hits) * 100;
                                                    return (
                                                        <div
                                                            key={drill.id}
                                                            className={`p-3 rounded-xl border transition-all hover:scale-105 ${
                                                                drill.status === 'CRITICAL' ? 'bg-red-900/30 border-red-500/40' :
                                                                drill.status === 'WARNING' ? 'bg-amber-900/30 border-amber-500/40' :
                                                                'bg-slate-900/50 border-white/5'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="text-xs font-bold text-white">{drill.diameter_mm}mm</div>
                                                                <div className={`w-2 h-2 rounded-full ${
                                                                    drill.status === 'CRITICAL' ? 'bg-red-400 animate-pulse' :
                                                                    drill.status === 'WARNING' ? 'bg-amber-400' :
                                                                    'bg-emerald-400'
                                                                }`} />
                                                            </div>

                                                            {/* Usage Bar */}
                                                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                                                                <div
                                                                    className={`h-full transition-all ${
                                                                        usage > 90 ? 'bg-red-500' :
                                                                        usage > 70 ? 'bg-amber-500' :
                                                                        'bg-emerald-500'
                                                                    }`}
                                                                    style={{ width: `${usage}%` }}
                                                                />
                                                            </div>

                                                            <div className="flex justify-between text-[9px] text-slate-400">
                                                                <span>{drill.hits.toLocaleString()}</span>
                                                                <span>{drill.max_hits.toLocaleString()}</span>
                                                            </div>

                                                            <div className="mt-2 pt-2 border-t border-white/5 text-[9px]">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">Smear:</span>
                                                                    <span className={
                                                                        drill.resin_smear === 'high' ? 'text-red-400' :
                                                                        drill.resin_smear === 'medium' ? 'text-amber-400' :
                                                                        'text-emerald-400'
                                                                    }>{drill.resin_smear}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">Location:</span>
                                                                    <span className="text-slate-300">{drill.location}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-slate-500">Loading inventory...</div>
                                        )}
                                    </div>
                                )}

                                {/* FFT ANALYSIS VIEW */}
                                {maintView === 'fft' && (
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                <Waves className="text-cyan-400" /> Real-Time FFT Spectrum Analyzer
                                            </h3>
                                            <button
                                                onClick={animateFFT}
                                                disabled={fftAnimating}
                                                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Play className="w-4 h-4" /> {fftAnimating ? 'Analyzing...' : 'Simulate Live'}
                                            </button>
                                        </div>

                                        {/* FFT Spectrum */}
                                        <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/20">
                                            <div className="flex items-end justify-between gap-1 h-48">
                                                {fftData.map((h, i) => {
                                                    const freq = (i + 1) * 100;
                                                    const isAnomaly = h > 75;
                                                    return (
                                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                            <div
                                                                className={`w-full rounded-t transition-all duration-100 ${
                                                                    isAnomaly ? 'bg-red-500 shadow-lg shadow-red-500/30' :
                                                                    h > 50 ? 'bg-amber-500' :
                                                                    'bg-cyan-500/70'
                                                                }`}
                                                                style={{ height: `${h}%` }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex justify-between mt-2 px-1">
                                                <span className="text-[9px] text-slate-500">100Hz</span>
                                                <span className="text-[9px] text-slate-500">500Hz</span>
                                                <span className="text-[9px] text-slate-500">1kHz</span>
                                                <span className="text-[9px] text-slate-500">1.5kHz</span>
                                            </div>
                                        </div>

                                        {/* Frequency Legend */}
                                        <div className="grid grid-cols-3 gap-4 mt-4">
                                            <div className="p-3 bg-black/30 rounded-lg border border-white/5">
                                                <div className="text-[10px] text-slate-400 mb-1">Low Freq (10-100Hz)</div>
                                                <div className="text-sm text-cyan-300">Mechanical Imbalance</div>
                                            </div>
                                            <div className="p-3 bg-black/30 rounded-lg border border-white/5">
                                                <div className="text-[10px] text-slate-400 mb-1">Mid Freq (100-500Hz)</div>
                                                <div className="text-sm text-amber-300">Belt/Gear Issues</div>
                                            </div>
                                            <div className="p-3 bg-black/30 rounded-lg border border-white/5">
                                                <div className="text-[10px] text-slate-400 mb-1">High Freq (&gt;1kHz)</div>
                                                <div className="text-sm text-red-300">Bearing Wear</div>
                                            </div>
                                        </div>

                                        {/* AI Analysis Button */}
                                        <button
                                            onClick={handleMaintAnalysis}
                                            disabled={loading}
                                            className="w-full mt-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Sparkles className="w-5 h-5" /> Run Gemini AI Diagnosis
                                        </button>

                                        {maintResult && (
                                            <div className="mt-4 p-4 bg-gradient-to-r from-orange-900/30 to-slate-900/50 rounded-xl border border-orange-500/30 animate-in fade-in duration-300">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertTriangle className={`w-5 h-5 ${maintResult.health_status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`} />
                                                    <span className="font-bold text-white">{maintResult.diagnosis}</span>
                                                </div>
                                                <div className="text-sm text-slate-300 mb-2">{maintResult.maintenance_window}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {maintResult.signatures_detected?.map((sig, i) => (
                                                        <span key={i} className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded">{sig}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ANOMALY HISTORY VIEW */}
                                {maintView === 'history' && (
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                <History className="text-purple-400" /> Anomaly History
                                            </h3>
                                            {anomalyHistory && (
                                                <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                                                    {anomalyHistory.unresolved} Unresolved
                                                </span>
                                            )}
                                        </div>
                                        {anomalyHistory ? (
                                            <div className="space-y-3">
                                                {anomalyHistory.anomalies.map((anomaly, i) => (
                                                    <div
                                                        key={i}
                                                        className={`p-4 rounded-xl border ${
                                                            !anomaly.resolved
                                                                ? 'bg-red-900/20 border-red-500/30'
                                                                : 'bg-slate-900/50 border-white/5'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start gap-3">
                                                                <div className={`p-2 rounded-lg ${
                                                                    anomaly.severity === 'CRITICAL' ? 'bg-red-500/20' :
                                                                    anomaly.severity === 'WARNING' ? 'bg-amber-500/20' :
                                                                    'bg-blue-500/20'
                                                                }`}>
                                                                    {anomaly.severity === 'CRITICAL' ? <AlertOctagon className="w-5 h-5 text-red-400" /> :
                                                                     anomaly.severity === 'WARNING' ? <AlertTriangle className="w-5 h-5 text-amber-400" /> :
                                                                     <Bell className="w-5 h-5 text-blue-400" />}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-white">{anomaly.type.replace(/_/g, ' ')}</div>
                                                                    <div className="text-sm text-slate-400">{anomaly.machine_id}</div>
                                                                    <div className="text-xs text-slate-500 mt-1">
                                                                        Value: {anomaly.value} (Threshold: {anomaly.threshold})
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-xs px-2 py-0.5 rounded ${
                                                                    anomaly.resolved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                                                                }`}>
                                                                    {anomaly.resolved ? 'Resolved' : 'Active'}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 mt-1">
                                                                    {new Date(anomaly.timestamp).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-slate-500">Loading history...</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right: Thermal Analysis & Quick Actions */}
                            <div className="space-y-6">
                                {/* Thermal Analysis Panel */}
                                <div className="bg-slate-800/50 p-5 rounded-xl border border-white/5">
                                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <Thermometer className="w-4 h-4 text-red-400" /> Thermal Analysis
                                    </h4>

                                    {selectedMachine ? (
                                        <div className="space-y-4">
                                            <div className="p-3 bg-black/30 rounded-lg">
                                                <div className="text-xs text-slate-400">Selected Machine</div>
                                                <div className="text-lg font-bold text-white">{selectedMachine.id}</div>
                                            </div>

                                            {/* Temperature Gauge */}
                                            <div className="flex justify-center">
                                                <div className="relative w-32 h-32">
                                                    <svg className="w-full h-full -rotate-90">
                                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-700" />
                                                        <circle
                                                            cx="64" cy="64" r="56"
                                                            stroke="currentColor" strokeWidth="8" fill="none"
                                                            strokeDasharray={`${(selectedMachine.spindle_temp_c / 100) * 352} 352`}
                                                            strokeLinecap="round"
                                                            className={selectedMachine.spindle_temp_c > 70 ? 'text-red-500' : selectedMachine.spindle_temp_c > 60 ? 'text-amber-500' : 'text-emerald-500'}
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-3xl font-bold text-white">{selectedMachine.spindle_temp_c}°</span>
                                                        <span className="text-xs text-slate-400">Spindle</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {thermalResult && (
                                                <div className={`p-3 rounded-lg border ${
                                                    thermalResult.thermal_status === 'CRITICAL' ? 'bg-red-900/30 border-red-500/30' :
                                                    thermalResult.thermal_status === 'WARNING' ? 'bg-amber-900/30 border-amber-500/30' :
                                                    'bg-emerald-900/30 border-emerald-500/30'
                                                }`}>
                                                    <div className={`text-sm font-bold ${
                                                        thermalResult.thermal_status === 'CRITICAL' ? 'text-red-300' :
                                                        thermalResult.thermal_status === 'WARNING' ? 'text-amber-300' :
                                                        'text-emerald-300'
                                                    }`}>
                                                        {thermalResult.thermal_status}
                                                    </div>
                                                    <div className="text-xs text-slate-300 mt-1">{thermalResult.diagnosis}</div>
                                                    {thermalResult.recommended_actions && (
                                                        <div className="mt-2 space-y-1">
                                                            {thermalResult.recommended_actions.slice(0, 2).map((action, i) => (
                                                                <div key={i} className="text-[10px] text-slate-400 flex items-start gap-1">
                                                                    <Check className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                                                                    <span>{action}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-500 text-sm">
                                            <Thermometer className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            Select a machine to analyze
                                        </div>
                                    )}
                                </div>

                                {/* Tool Life Summary */}
                                <div className="bg-slate-800/50 p-5 rounded-xl border border-white/5">
                                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <Disc className="w-4 h-4 text-purple-400" /> Tool Life Prediction
                                    </h4>

                                    <button
                                        onClick={handleMaintAnalysis}
                                        disabled={loading}
                                        className="w-full py-2 mb-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm transition-colors disabled:opacity-50"
                                    >
                                        Analyze Tool Health
                                    </button>

                                    {toolLife && (
                                        <div className="space-y-3 animate-in fade-in duration-300">
                                            <div className="flex justify-center">
                                                <div className="relative w-24 h-24">
                                                    <svg className="w-full h-full -rotate-90">
                                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-700" />
                                                        <circle
                                                            cx="48" cy="48" r="40"
                                                            stroke="currentColor" strokeWidth="6" fill="none"
                                                            strokeDasharray={`${(toolLife.breakage_probability_percent / 100) * 251} 251`}
                                                            strokeLinecap="round"
                                                            className={toolLife.breakage_probability_percent > 70 ? 'text-red-500' : toolLife.breakage_probability_percent > 40 ? 'text-amber-500' : 'text-emerald-500'}
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-xl font-bold text-white">{toolLife.breakage_probability_percent}%</span>
                                                        <span className="text-[9px] text-slate-400">Break Risk</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`p-2 rounded-lg text-center ${
                                                toolLife.action === 'CHANGE_TOOL_NOW' ? 'bg-red-900/30 text-red-300' : 'bg-emerald-900/30 text-emerald-300'
                                            }`}>
                                                <div className="text-xs font-bold">{toolLife.action}</div>
                                            </div>

                                            <div className="text-xs text-slate-400">
                                                RUL: <span className="text-white font-mono">{toolLife.rul_hits}</span> hits
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Schedule Maintenance */}
                                {selectedMachine && (
                                    <div className="bg-slate-800/50 p-5 rounded-xl border border-white/5">
                                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-cyan-400" /> Quick Schedule
                                        </h4>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => handleScheduleMaintenance(selectedMachine.id, 'preventive', 'normal')}
                                                className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs transition-colors"
                                            >
                                                Schedule Preventive
                                            </button>
                                            <button
                                                onClick={() => handleScheduleMaintenance(selectedMachine.id, 'corrective', 'high')}
                                                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 text-xs transition-colors"
                                            >
                                                Schedule Corrective (High)
                                            </button>
                                        </div>
                                        {scheduleResult && (
                                            <div className="mt-3 p-2 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
                                                <Check className="w-3 h-3 inline mr-1" />
                                                {scheduleResult.work_order_id} created
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- PHASE 5: COMPLIANCE --- */}
            {
                activePhase === 5 && (
                    <div className="p-12 text-center text-slate-500">
                        <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>Compliance features integrated in background workflows.</p>
                    </div>
                )
            }

        </div >
    );
};

export default PCBManufacturing;
