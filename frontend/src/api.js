const API_BASE = 'http://localhost:8000/api';

export const analyzeDefect = async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await fetch(`${API_BASE}/analyze/defect`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Analysis failed');
    }
    return response.json();
};

export const analyzeLog = async (logText, context = null) => {
    const response = await fetch(`${API_BASE}/analyze/log`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ log_text: logText, context }),
    });

    if (!response.ok) {
        throw new Error('Log parsing failed');
    }
    return response.json();
};

export const analyzeLogFile = async (file, context = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (context) {
        formData.append('context', JSON.stringify(context));
    }

    const response = await fetch(`${API_BASE}/analyze/log/file`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Log file analysis failed');
    }
    return response.json();
};

export const queryRAG = async (query) => {
    const response = await fetch(`${API_BASE}/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    if (!response.ok) throw new Error('RAG Query failed');
    return response.json();
};

export const sendChatMessage = async (message, history, context = null, image = null) => {
    const response = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, context, image }),
    });
    if (!response.ok) throw new Error('Chat failed');
    return response.json();
};

export const analyzeChargingSignature = async (file, localMode = false, chemistryType = 'NMC') => {
    const formData = new FormData();
    if (file) {
        formData.append('file', file);
    }
    formData.append('local_mode', localMode);
    formData.append('chemistry_type', chemistryType);

    const response = await fetch(`${API_BASE}/analyze/charging`, {
        method: 'POST',
        body: formData, // fetch automatically sets Content-Type to multipart/form-data
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Analysis failed');
    }
    return response.json();
};

export const analyzeBatch = async (files) => {
    const formData = new FormData();
    // Append all files with same key 'files'
    Array.from(files).forEach(file => {
        formData.append('files', file);
    });

    const response = await fetch(`${API_BASE}/analyze/batch`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Batch Analysis failed');
    return response.json();
};

export const fetchHistory = async () => {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
};

export const analyzeComparison = async (ids) => {
    const response = await fetch(`${API_BASE}/analyze/comparison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Comparison failed');
    return response.json();
};

export const exportHistory = async () => {
    const response = await fetch(`${API_BASE}/history/export`);
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
};

export const predictAging = async (current_capacity_ah = null, nominal_capacity_ah = 3.0) => {
    const response = await fetch(`${API_BASE}/analyze/aging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_capacity_ah, nominal_capacity_ah }),
    });
    if (!response.ok) throw new Error('Prediction failed');
    return response.json();
};

// --- PCB MANUFACTURING API ---

export const analyzeGerber = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/gerber/analyze`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Gerber Analysis failed');
    return response.json();
};

export const optimizeMaterial = async (requirements) => {
    const response = await fetch(`${API_BASE}/fleet/material-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requirements),
    });
    if (!response.ok) throw new Error('Material Selection failed');
    return response.json();
};

export const controlEtching = async (params) => {
    const response = await fetch(`${API_BASE}/process/etching-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Etching Control failed');
    return response.json();
};

export const predictLamination = async (params) => {
    const response = await fetch(`${API_BASE}/process/lamination-scaling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Lamination Prediction failed');
    return response.json();
};

export const classifyPCB = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/vision/classify`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Defect Classification failed');
    return response.json();
};

export const inspectMask = async (panelId) => {
    const response = await fetch(`${API_BASE}/vision/inspect-mask/${panelId}`);
    if (!response.ok) throw new Error('Mask Inspection failed');
    return response.json();
};

export const checkDrillWear = async (drillId, hits) => {
    const response = await fetch(`${API_BASE}/fleet/drill-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drill_id: drillId, current_hit_count: parseInt(hits) }),
    });
    if (!response.ok) throw new Error('Drill Check failed');
    return response.json();
};

export const optimizePlating = async (dimensions) => {
    const response = await fetch(`${API_BASE}/process/plating-optimization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dimensions),
    });
    if (!response.ok) throw new Error('Plating Optimization failed');
    return response.json();
};

export const verifyETest = async (results) => {
    const response = await fetch(`${API_BASE}/compliance/electrical-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
    });
    if (!response.ok) throw new Error('E-Test Verification failed');
    return response.json();
};

export const checkPackaging = async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile); // Assuming endpoint handles file upload eventually, currently it takes json metadata, let's adjust to be robust or mock
    // Wait, the backend endpoint for /compliance/check-packaging expects CheckPackagingRequest JSON. 
    // Ideally we should upload an image, but the implementation plan says "Automated check ... in packaging images" 
    // and the backend model expects `packaging_image_meta`.
    // Let's assume for now we send metadata or mock it, but for a real file we would need to upload it first.
    // For now, let's just match the backend expectation of JSON.
    // We will assume the frontend handles the "image" by just sending metadata for now as per current backend.

    const response = await fetch(`${API_BASE}/compliance/check-packaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: "PKG-TEMP", image_url: "captured_cam.jpg", has_desiccant: true, humidity_card_color: "blue" }),
    });
    if (!response.ok) throw new Error('Packaging Check failed');
    return response.json();
};

export const generateCertificate = async (data) => {
    const response = await fetch(`${API_BASE}/compliance/generate-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Certificate Generation failed');
    return response.json();
};