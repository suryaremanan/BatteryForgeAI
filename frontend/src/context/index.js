/**
 * Auto-integration wrapper for WorkspaceContext
 * 
 * This file exports a simplified hook that components can use
 * without modifying internal logic. Just wrap analysis functions.
 */

import { useWorkspace as useWorkspaceOriginal } from './WorkspaceContext';

/**
 * Quick integration helper
 * Usage: wrap any analysis function to auto-track results
 */
export function useContextAwareAnalysis(componentName) {
    const workspace = useWorkspaceOriginal();

    /**
     * Wrap an async analysis function to auto-track results
     * @param {Function} analysisFn - The original analysis function
     * @param {string} resultKey - What key to extract from result
     */
    const trackAnalysis = (analysisFn, options = {}) => {
        return async (...args) => {
            // Run original analysis
            const result = await analysisFn(...args);

            // Auto-update workspace based on component
            if (componentName === 'pcb' && options.field) {
                workspace.updatePCBManufacturing(options.field, result);
            } else if (componentName === 'visual') {
                workspace.updateVisualIntelligence({
                    lastDefectAnalysis: result
                });
            } else if (componentName === 'charging') {
                workspace.updateChargingAnalysis({
                    lastAnalysis: result.analysis,
                    metrics: result.metrics,
                    fileName: options.fileName
                });
            } else if (componentName === 'fleet') {
                workspace.updateFleetMonitor(result);
            } else if (componentName === 'log') {
                workspace.updateLogAnalysis(result);
            }

            return result;
        };
    };

    return {
        ...workspace,
        trackAnalysis
    };
}

// Re-export everything from WorkspaceContext
export { useWorkspace, WorkspaceProvider } from './WorkspaceContext';
