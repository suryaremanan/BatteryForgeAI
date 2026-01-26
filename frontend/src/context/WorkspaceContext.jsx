import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Global Workspace Context - Tracks ALL user actions across the app
 * Provides context-aware AI that remembers what you've done
 */

const WorkspaceContext = createContext(null);

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within WorkspaceProvider');
    }
    return context;
};

export const WorkspaceProvider = ({ children }) => {
    const [workspaceState, setWorkspaceState] = useState({
        // Current active tab
        activeTab: 'home',

        // Visual Intelligence results
        visualIntelligence: {
            lastDefectAnalysis: null,
            uploadedImage: null,
            timestamp: null
        },

        // PCB Manufacturing results
        pcbManufacturing: {
            visionAnalysis: null,
            gerberAnalysis: null,
            materialPlan: null,
            etchingParams: null,
            drillStatus: null,
            eTestResults: null,
            activePhase: 1,
            timestamp: null
        },

        // Charging Analysis results
        chargingAnalysis: {
            lastAnalysis: null,
            metrics: null,
            plotData: null,
            anomalyDetected: false,
            fileName: null,
            timestamp: null
        },

        // Fleet Monitor status
        fleetMonitor: {
            currentScenario: null,
            criticalPacks: [],
            stats: null,
            timestamp: null
        },

        // Log Analysis results
        logAnalysis: {
            lastResult: null,
            urgency: null,
            timestamp: null
        },

        // Aging Analysis
        agingAnalysis: {
            lastPrediction: null,
            currentSOH: null,
            timestamp: null
        },

        // Recent actions history (last 10 actions)
        recentActions: []
    });

    // Update active tab
    const setActiveTab = useCallback((tab) => {
        setWorkspaceState(prev => ({
            ...prev,
            activeTab: tab,
            recentActions: [
                {
                    type: 'TAB_CHANGE',
                    tab,
                    timestamp: new Date().toISOString()
                },
                ...prev.recentActions.slice(0, 9)
            ]
        }));
    }, []);

    // Update Visual Intelligence state
    const updateVisualIntelligence = useCallback((data) => {
        setWorkspaceState(prev => ({
            ...prev,
            visualIntelligence: {
                ...data,
                timestamp: new Date().toISOString()
            },
            recentActions: [
                {
                    type: 'DEFECT_ANALYSIS',
                    defectType: data.lastDefectAnalysis?.defect_type,
                    severity: data.lastDefectAnalysis?.severity,
                    timestamp: new Date().toISOString()
                },
                ...prev.recentActions.slice(0, 9)
            ]
        }));
    }, []);

    // Update PCB Manufacturing state
    const updatePCBManufacturing = useCallback((field, data) => {
        setWorkspaceState(prev => ({
            ...prev,
            pcbManufacturing: {
                ...prev.pcbManufacturing,
                [field]: data,
                timestamp: new Date().toISOString()
            },
            recentActions: [
                {
                    type: 'PCB_ANALYSIS',
                    field,
                    defectType: field === 'visionAnalysis' ? data?.defect_type : undefined,
                    severity: field === 'visionAnalysis' ? data?.severity : undefined,
                    timestamp: new Date().toISOString()
                },
                ...prev.recentActions.slice(0, 9)
            ]
        }));
    }, []);

    // Update Charging Analysis state
    const updateChargingAnalysis = useCallback((data) => {
        setWorkspaceState(prev => ({
            ...prev,
            chargingAnalysis: {
                ...data,
                timestamp: new Date().toISOString()
            },
            recentActions: [
                {
                    type: 'CHARGING_ANALYSIS',
                    fileName: data.fileName,
                    anomaly: data.anomalyDetected,
                    timestamp: new Date().toISOString()
                },
                ...prev.recentActions.slice(0, 9)
            ]
        }));
    }, []);

    // Update Fleet Monitor state
    const updateFleetMonitor = useCallback((data) => {
        setWorkspaceState(prev => ({
            ...prev,
            fleetMonitor: {
                ...data,
                timestamp: new Date().toISOString()
            },
            recentActions: [
                {
                    type: 'FLEET_UPDATE',
                    scenario: data.currentScenario,
                    criticalCount: data.criticalPacks?.length,
                    timestamp: new Date().toISOString()
                },
                ...prev.recentActions.slice(0, 9)
            ]
        }));
    }, []);

    // Update Log Analysis state
    const updateLogAnalysis = useCallback((data) => {
        setWorkspaceState(prev => ({
            ...prev,
            logAnalysis: {
                ...data,
                timestamp: new Date().toISOString()
            },
            recentActions: [
                {
                    type: 'LOG_ANALYSIS',
                    urgency: data.urgency,
                    errorCode: data.lastResult?.error_code,
                    timestamp: new Date().toISOString()
                },
                ...prev.recentActions.slice(0, 9)
            ]
        }));
    }, []);

    // Update Aging Analysis state
    const updateAgingAnalysis = useCallback((data) => {
        setWorkspaceState(prev => ({
            ...prev,
            agingAnalysis: {
                ...data,
                timestamp: new Date().toISOString()
            },
            recentActions: [
                {
                    type: 'AGING_PREDICTION',
                    soh: data.currentSOH,
                    timestamp: new Date().toISOString()
                },
                ...prev.recentActions.slice(0, 9)
            ]
        }));
    }, []);

    // Get context summary for AI (formatted for LLM)
    const getContextForAI = useCallback(() => {
        const { activeTab, recentActions, ...allData } = workspaceState;

        // Build context string
        let context = `Current Workspace State:\n`;
        context += `Active Tab: ${activeTab}\n\n`;

        // Add relevant recent data based on active tab
        if (activeTab === 'visual' && allData.visualIntelligence.lastDefectAnalysis) {
            const defect = allData.visualIntelligence.lastDefectAnalysis;
            context += `Recent Battery Defect Analysis:\n`;
            context += `- Defect Type: ${defect.defect_type}\n`;
            context += `- Location: ${defect.location}\n`;
            context += `- Severity: ${defect.severity}\n`;
            context += `- Description: ${defect.description}\n`;
            context += `- Analyzed: ${allData.visualIntelligence.timestamp}\n\n`;
        }

        if (activeTab === 'pcb' && allData.pcbManufacturing.visionAnalysis) {
            const pcb = allData.pcbManufacturing.visionAnalysis;
            context += `Recent PCB Defect Detection:\n`;
            context += `- Defect Type: ${pcb.defect_type}\n`;
            context += `- Location: ${pcb.location || 'Not specified'}\n`;
            context += `- Severity: ${pcb.severity}\n`;
            context += `- Description: ${pcb.description || 'No description'}\n`;
            context += `- Root Cause: ${pcb.root_cause || 'Unknown'}\n`;
            context += `- Mitigation: ${pcb.mitigation || pcb.recommended_action}\n`;
            context += `- Current Phase: ${allData.pcbManufacturing.activePhase}\n\n`;
        }

        if (activeTab === 'charging' && allData.chargingAnalysis.lastAnalysis) {
            const charging = allData.chargingAnalysis;
            context += `Recent Charging Analysis:\n`;
            context += `- File: ${charging.fileName}\n`;
            context += `- Diagnosis: ${charging.lastAnalysis.diagnosis}\n`;
            context += `- Anomaly Detected: ${charging.anomalyDetected ? 'YES' : 'NO'}\n`;
            if (charging.metrics) {
                context += `- Capacity: ${charging.metrics.capacity_ah} Ah\n`;
                context += `- Energy: ${charging.metrics.energy_wh} Wh\n`;
                context += `- Max Current: ${charging.metrics.max_current} A\n`;
            }
            context += `\n`;
        }

        if (activeTab === 'fleet' && allData.fleetMonitor.stats) {
            const fleet = allData.fleetMonitor;
            context += `Fleet Monitor Status:\n`;
            context += `- Current Scenario: ${fleet.currentScenario || 'Normal Operation'}\n`;
            context += `- Critical Packs: ${fleet.criticalPacks.length}\n`;
            if (fleet.stats) {
                context += `- Average Temperature: ${fleet.stats.avgTemp}°C\n`;
                context += `- Max Temperature: ${fleet.stats.maxTemp}°C\n`;
            }
            context += `\n`;
        }

        if (allData.logAnalysis.lastResult) {
            const log = allData.logAnalysis;
            context += `Recent Log Analysis:\n`;
            context += `- Error Code: ${log.lastResult.error_code || 'None'}\n`;
            context += `- Urgency: ${log.urgency}\n`;
            context += `- Component: ${log.lastResult.component || 'Unknown'}\n`;
            context += `\n`;
        }

        // Add recent actions
        if (recentActions.length > 0) {
            context += `Recent Actions (last 10):\n`;
            recentActions.slice(0, 5).forEach((action, idx) => {
                context += `${idx + 1}. ${action.type}`;
                if (action.defectType) context += ` - ${action.defectType}`;
                if (action.severity) context += ` (${action.severity})`;
                if (action.fileName) context += ` - ${action.fileName}`;
                context += `\n`;
            });
        }

        return context;
    }, [workspaceState]);

    // Get structured context object (for API)
    const getStructuredContext = useCallback(() => {
        return {
            ...workspaceState,
            contextSummary: getContextForAI()
        };
    }, [workspaceState, getContextForAI]);

    const value = {
        workspaceState,
        setActiveTab,
        updateVisualIntelligence,
        updatePCBManufacturing,
        updateChargingAnalysis,
        updateFleetMonitor,
        updateLogAnalysis,
        updateAgingAnalysis,
        getContextForAI,
        getStructuredContext
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};
