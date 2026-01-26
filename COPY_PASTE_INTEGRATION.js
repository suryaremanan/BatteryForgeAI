/**
 * COPY-PASTE INTEGRATION FOR CONTEXT-AWARE AI
 * 
 * Just copy the code blocks below and paste them into the specified files.
 */

// =============================================================================
// FILE 1: frontend/src/main.jsx
// =============================================================================
/* 
REPLACE ENTIRE CONTENT WITH:
*/

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { WorkspaceProvider } from './context/WorkspaceContext'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <WorkspaceProvider>
            <App />
        </WorkspaceProvider>
    </React.StrictMode>,
)


// =============================================================================
// FILE 2: frontend/src/components/ChatInterface.jsx
// =============================================================================
/*
ADD THIS LINE after other imports (around line 4):
*/

import { useWorkspace } from '../context/WorkspaceContext';

/*
ADD THIS LINE inside the ChatInterface function, right after line 29:
*/

const { getStructuredContext } = useWorkspace();

/*
FIND THIS LINE (around line 87):
    const result = await sendChatMessage(userMsg, messages, agentState, null);

REPLACE IT WITH:
*/

const workspaceContext = getStructuredContext();
const result = await sendChatMessage(userMsg, messages, { ...agentState, workspace: workspaceContext }, null);


// =============================================================================
// FILE 3: frontend/src/components/PCBManufacturing.jsx
// =============================================================================
/*
ADD THIS LINE after other imports (around line 12):
*/

import { useWorkspace } from '../context/WorkspaceContext';

/*
ADD THIS LINE inside PCBManufacturing function, after line 236:
*/

const { updatePCBManufacturing } = useWorkspace();

/*
FIND THE handleVisionUpload function (around line 324)
ADD THIS LINE after setVisionResult(res):
*/

updatePCBManufacturing('visionAnalysis', res);

// The full function should look like:
const handleVisionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVisionPreview(URL.createObjectURL(file));
    setLoading(true);
    addLog(`Vision AI analyzing: ${file.name}...`);
    try {
        const res = await classifyPCB(file);
        setVisionResult(res);
        updatePCBManufacturing('visionAnalysis', res); // <-- ADD THIS LINE
        const severity = res.severity === 'FATAL' ? 'error' : res.severity === 'REPAIRABLE' ? 'warning' : 'success';
        addLog(`Defect: ${res.defect_type} | Action: ${res.recommended_action}`, severity);
    } catch (err) { addLog(err.message, 'error'); }
    setLoading(false);
};


// =============================================================================
// DONE! Now test it:
// =============================================================================
/*
1. Save all files
2. Refresh browser (frontend should auto-reload)
3. Go to PCB Manufacturing > Vision AI tab
4. Upload a PCB image
5. Wait for defect detection
6. Open chat (click bot icon bottom-right)
7. Ask: "What should I do about this?"
8. AI should respond with details about the detected defect!
*/
