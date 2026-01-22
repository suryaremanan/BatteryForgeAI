import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import { FaCamera, FaUpload, FaPlay, FaStop, FaExclamationTriangle, FaCheckCircle, FaRobot, FaMicrochip, FaYoutube, FaLink, FaDesktop } from 'react-icons/fa';

const API_URL = "http://localhost:8000/api";

const VisualScout = () => {
    const [stream, setStream] = useState(null); // For Webcam
    const [screenStream, setScreenStream] = useState(null); // For Screen Share (YouTube Analysis)
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [pendingLog, setPendingLog] = useState(null);

    // Inputs
    const [inputType, setInputType] = useState('webcam'); // 'webcam', 'upload', 'url'
    const [urlInput, setUrlInput] = useState('');
    const [activeUrl, setActiveUrl] = useState(null);
    const [videoReady, setVideoReady] = useState(false); // New reactive state for readiness

    // Refs
    const videoRef = useRef(null); // For Webcam/Upload
    const screenVideoRef = useRef(null); // Hidden video element to play screen stream for canvas
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const intervalRef = useRef(null);

    // ----------------------------------------------------
    // ANALYSIS ENGINE
    // ----------------------------------------------------
    const [backendStatus, setBackendStatus] = useState('Idle'); // 'Idle', 'Sending', 'Processing', 'Error', 'Success'

    // Refs for Loop Control (Avoid Stale Closures)
    const isAnalyzingRef = useRef(false);

    // ----------------------------------------------------
    // ANALYSIS ENGINE
    // ----------------------------------------------------
    const startAnalysis = async () => {
        // If external URL, we often need Screen Share to bypass CORS
        if (inputType === 'url' && !screenStream) {
            const confirmShare = window.confirm("To analyze external videos (like YouTube), we need to 'see' your screen. Please select the tab playing the video in the next popup.");
            if (confirmShare) {
                await startScreenShare();
            } else {
                return;
            }
        }

        setIsAnalyzing(true);
        isAnalyzingRef.current = true; // Sync ref

        // Start the loop
        processFrameLoop();
    };

    const stopAnalysis = () => {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;

        setVideoReady(false);
        setBackendStatus('Idle');
        setPendingLog(null);

        if (intervalRef.current) clearTimeout(intervalRef.current);

        // Stop screen stream if active
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
        }
    };

    const processFrameLoop = async () => {
        if (!isAnalyzingRef.current) return;

        await captureAndAnalyze();

        // Schedule next frame if still analyzing
        if (isAnalyzingRef.current) {
            intervalRef.current = setTimeout(() => {
                processFrameLoop();
            }, 1000);
        }
    };

    const captureAndAnalyze = async () => {
        if (!canvasRef.current || !isAnalyzingRef.current) return;

        // Determine Source by checking DOM refs directly (avoids stale state closures)
        let sourceVideo = null;
        let sourceName = "";

        // Priority 1: Screen Share
        if (screenVideoRef.current && screenVideoRef.current.srcObject) {
            sourceVideo = screenVideoRef.current;
            sourceName = "Screen";
        }
        // Priority 2: Webcam (srcObject)
        else if (videoRef.current && videoRef.current.srcObject) {
            sourceVideo = videoRef.current;
            sourceName = "Webcam";
        }
        // Priority 3: File/URL (src)
        else if (videoRef.current && videoRef.current.src) {
            sourceVideo = videoRef.current;
            sourceName = "File";
        }

        if (!sourceVideo) {
            setBackendStatus('Idle (No Source)');
            return;
        }

        // Ensure Video is Ready
        if (sourceVideo.readyState < 2) {
            setBackendStatus('Waiting for Video...');
            return;
        }

        const context = canvasRef.current.getContext('2d');

        // Ensure dimensions match
        if (sourceVideo.videoWidth === 0) {
            setBackendStatus('Video Dim 0');
            return;
        }

        // Update reactive state
        if (!videoReady) setVideoReady(true);

        canvasRef.current.width = sourceVideo.videoWidth;
        canvasRef.current.height = sourceVideo.videoHeight;
        context.drawImage(sourceVideo, 0, 0);

        // Update UI Status
        setBackendStatus('Sending Frame...');

        // Immediate Feedback (Scanning...)
        setPendingLog({
            timestamp: new Date().toLocaleTimeString(),
            defect_type: "Scanning...",
            severity: "info",
            description: `Analyzing ${sourceName} frame...`,
            isPending: true
        });

        // Wrap toBlob in Promise to allow awaiting
        const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/jpeg'));
        if (!blob) {
            setBackendStatus('Error (Blob)');
            return;
        }

        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        try {
            const response = await fetch(`${API_URL}/analyze/defect`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            setBackendStatus('Active');

            const timestamp = new Date().toLocaleTimeString();
            const logEntry = { ...data, timestamp };

            // Check if component is still analyzing before updating state
            if (isAnalyzingRef.current) {
                if (data.error) {
                    setBackendStatus('API Error');
                    console.error("Backend Analysis Error:", data.error);
                    // Create error entry in history to make it VISIBLE
                    setHistory(prev => [{
                        timestamp: timestamp,
                        defect_type: "API Error",
                        severity: "Critical",
                        description: `Model Error: ${data.error}`,
                        mitigation: "Check server logs."
                    }, ...prev].slice(0, 10));
                } else {
                    setAnalysisResult(data);
                    setHistory(prev => [logEntry, ...prev].slice(0, 10));
                    setPendingLog(null);
                }
            }

        } catch (err) {
            console.error("Analysis failed:", err);
            setBackendStatus(`Client Error`);
            // Also log to history if persistent
            setHistory(prev => [{
                timestamp: new Date().toLocaleTimeString(),
                defect_type: "Connection Failed",
                severity: "Critical",
                description: err.message,
                mitigation: "Ensure backend is running."
            }, ...prev].slice(0, 10));
        }
    };

    // ----------------------------------------------------
    // INPUT HANDLERS
    // ----------------------------------------------------
    const [fileUrl, setFileUrl] = useState(null); // Local blob URL for uploads

    // ... (refs)

    // ... (analysis engine code) ...

    // ----------------------------------------------------
    // INPUT HANDLERS
    // ----------------------------------------------------
    const startCamera = async () => {
        stopAnalysis();
        setVideoReady(false);
        setInputType('webcam');
        setActiveUrl(null);
        setFileUrl(null); // Clear file
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            // useEffect will handle srcObject assignment since render might change
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera.");
        }
    };

    const handleFileUpload = (e) => {
        stopAnalysis();
        setVideoReady(false);
        setInputType('upload');
        setActiveUrl(null);
        setStream(null);

        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setFileUrl(url);
            // Don't try to set videoRef here, it might not exist yet
        }
    };

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        stopAnalysis();
        setVideoReady(false);
        setInputType('url');
        setStream(null);
        setFileUrl(null);

        if (urlInput.trim()) {
            setActiveUrl(urlInput);
        }
    };

    // ... (startScreenShare) ...

    useEffect(() => {
        return () => stopAnalysis();
    }, []);

    // Reliable Stream/Source Assignment
    useEffect(() => {
        // Case 1: Screen Share (Highest Priority)
        if (screenStream && screenVideoRef.current) {
            screenVideoRef.current.srcObject = screenStream;
            screenVideoRef.current.onloadedmetadata = () => {
                screenVideoRef.current.play()
                    .then(() => setVideoReady(true))
                    .catch(e => console.error("Screen play error:", e));
            };
        }
        // Case 2: Webcam
        else if (inputType === 'webcam' && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.src = "";
            videoRef.current.play().catch(e => console.error("Webcam play error:", e));
        }
        // Case 3: File Upload
        else if (inputType === 'upload' && fileUrl && videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = fileUrl;
            videoRef.current.play().catch(e => console.error("File play error:", e));
        }
    }, [screenStream, stream, fileUrl, inputType]);

    // Color Helpers
    const getStatusColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'text-red-500 border-red-500 bg-red-500/10';
            case 'moderate': return 'text-amber-500 border-amber-500 bg-amber-500/10';
            default: return 'text-emerald-500 border-emerald-500 bg-emerald-500/10';
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                        <FaMicrochip className="text-cyan-400" />
                        Visual Thermal Runaway Scout
                    </h1>
                    <p className="text-slate-400 mt-2">Real-time Gemini Vision Analysis for Battery Safety</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={startCamera}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${inputType === 'webcam' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                    >
                        <FaCamera /> Webcam
                    </button>

                    <input
                        type="file"
                        accept="video/*,image/*"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${inputType === 'upload' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                    >
                        <FaUpload /> Upload
                    </button>

                    <form onSubmit={handleUrlSubmit} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Video URL (YouTube/MP4)"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none w-48"
                        />
                        <button type="submit" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2 rounded-lg text-slate-300">
                            <FaLink />
                        </button>
                    </form>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
                {/* Video Feed Section */}
                <section className="lg:col-span-2 flex flex-col gap-4">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black aspect-video group shadow-2xl">

                        {/* Hidden Helper Elements for Processing */}
                        <canvas ref={canvasRef} className="hidden" />

                        {/* RENDERER: Priority 1 - Screen Share */}
                        {screenStream && (
                            <video
                                ref={screenVideoRef}
                                className="w-full h-full object-contain"
                                autoPlay
                                playsInline
                                muted
                                onCanPlay={() => setVideoReady(true)}
                            />
                        )}

                        {/* RENDERER: Priority 2 - Webcam / Upload (Only if no screen share) */}
                        {!screenStream && (inputType === 'webcam' || inputType === 'upload') && (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                loop
                                className="w-full h-full object-contain"
                                onCanPlay={() => setVideoReady(true)}
                            />
                        )}

                        {/* RENDERER: Priority 3 - URL (YouTube) (Only if no screen share) */}
                        {/* Note: If screen share is active, we show that instead to verify what is being analyzed */}
                        {!screenStream && inputType === 'url' && activeUrl && (
                            <div className="w-full h-full">
                                <ReactPlayer
                                    url={activeUrl}
                                    width="100%"
                                    height="100%"
                                    controls={true}
                                    playing={true}
                                />
                            </div>
                        )}

                        {/* Overlay HUD */}
                        {analysisResult && (
                            <div className={`absolute top-4 right-4 backdrop-blur-md px-4 py-2 rounded-lg border ${getStatusColor(analysisResult.severity)} z-20 shadow-lg`}>
                                <div className="font-bold flex items-center gap-2">
                                    {analysisResult.severity === 'Critical' ? <FaExclamationTriangle /> : <FaCheckCircle />}
                                    {analysisResult.defect_type || 'Scanning...'}
                                </div>
                                <div className="text-xs opacity-80 mt-1">
                                    Confidence: {analysisResult.confidence}%
                                </div>
                            </div>
                        )}

                        {/* Screen Share Indicator Overlay */}
                        {screenStream && (
                            <div className="absolute top-4 left-4 bg-red-500/20 border border-red-500 backdrop-blur-md px-3 py-1 rounded-full text-xs text-red-200 flex items-center gap-2 z-20 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Screen Recording Active
                            </div>
                        )}

                        {/* Empty State */}
                        {!stream && !activeUrl && !videoRef.current?.src && inputType !== 'url' && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                <div className="text-center">
                                    <FaCamera className="text-6xl mx-auto mb-4 opacity-50" />
                                    <p>Select a video source to begin</p>
                                </div>
                            </div>
                        )}
                        {inputType === 'url' && !activeUrl && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                <div className="text-center">
                                    <FaYoutube className="text-6xl mx-auto mb-4 opacity-50" />
                                    <p>Enter a YouTube or Video URL above</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACTION BAR */}
                    <div className="flex flex-col items-center gap-2">
                        {!isAnalyzing ? (
                            <button
                                onClick={startAnalysis}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
                            >
                                {inputType === 'url' ? <FaDesktop /> : <FaPlay />}
                                {inputType === 'url' ? 'Start Screen Analysis' : 'Start Scout AI'}
                            </button>
                        ) : (
                            <button
                                onClick={stopAnalysis}
                                className="flex items-center gap-2 px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50 rounded-full font-bold transition-all"
                            >
                                <FaStop /> Stop Analysis
                            </button>
                        )}

                        {inputType === 'url' && !isAnalyzing && (
                            <p className="text-xs text-slate-500">
                                * For external videos (YouTube), we will ask to record the tab.
                            </p>
                        )}
                    </div>
                </section>

                {/* Analysis Log */}
                <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 overflow-hidden flex flex-col">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <FaRobot className="text-purple-400" />
                        Scout Logs
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        <AnimatePresence>
                            {/* Pending Log Indicator */}
                            {pendingLog && (
                                <motion.div
                                    key="pending"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 text-sm animate-pulse"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold uppercase tracking-wider text-xs bg-slate-800 px-2 py-1 rounded text-slate-500">
                                            {pendingLog.timestamp}
                                        </span>
                                        <span className="font-bold text-cyan-400 flex items-center gap-2">
                                            <FaMicrochip className="animate-spin" />
                                            {pendingLog.defect_type}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 italic">
                                        {pendingLog.description}
                                    </p>
                                </motion.div>
                            )}

                            {history.map((entry, i) => (
                                <motion.div
                                    key={entry.timestamp + i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`p-4 rounded-xl border ${getStatusColor(entry.severity)} bg-slate-900/50 text-sm`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold uppercase tracking-wider text-xs bg-slate-800 px-2 py-1 rounded">
                                            {entry.timestamp}
                                        </span>
                                        <span className="font-bold truncate max-w-[120px]">
                                            {entry.defect_type}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed">
                                        {entry.description}
                                    </p>
                                    {entry.mitigation && (
                                        <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-400 font-mono">
                                            Action: {entry.mitigation}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {history.length === 0 && (
                            <div className="text-slate-500 text-center py-10 italic flex flex-col gap-2">
                                <span>Waiting for analysis stream...</span>
                                {isAnalyzing && (
                                    <div className="text-xs font-mono bg-slate-900/50 p-3 rounded mt-4 text-left mx-4 border border-slate-700">
                                        <p className="text-indigo-400 font-bold mb-1">System Status:</p>
                                        <p>• Engine: <span className="text-emerald-400">Active</span></p>
                                        <p>• Video Source: {screenStream ? 'Screen Share' : inputType === 'webcam' ? 'Webcam' : 'File/URL'}</p>
                                        <p>• Video Signal: {videoReady ? <span className="text-emerald-400">Acquired</span> : <span className="text-amber-400">Buffering...</span>}</p>
                                        <p>• Backend: <span className={backendStatus.startsWith('Error') || backendStatus.startsWith('Client') ? "text-red-400" : "text-blue-400"}>{backendStatus}</span></p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default VisualScout;
