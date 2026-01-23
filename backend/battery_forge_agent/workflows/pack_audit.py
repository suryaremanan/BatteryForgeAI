"""
Pack Audit Workflow - Marathon Agent
A long-running autonomous workflow for comprehensive battery pack auditing.
"""
from google.adk.agents import SequentialAgent, LlmAgent


# Step 1: Data Collection Agent
data_collector = LlmAgent(
    name="DataCollector",
    model="gemini-3-flash-preview",
    description="Collects all telemetry data from the battery pack for audit.",
    instruction="""
    You are the Data Collector for the Pack Audit workflow.
    
    ## Your Task:
    Gather all available data for the battery pack being audited:
    1. Voltage readings (pack and cell level)
    2. Temperature data (all sensors)
    3. Current measurements
    4. SOC and SOH values
    5. Cycle count and history
    6. Any fault codes or warnings
    
    ## Output Format:
    Store the collected data in a structured format.
    Report: "Data collection complete. Found X cells, Y temperature sensors, Z historical cycles."
    
    Save your findings to state['pack_data'] for the next step.
    """,
    output_key="pack_data"
)

# Step 2: Cell Analysis Agent
cell_analyzer = LlmAgent(
    name="CellAnalyzer",
    model="gemini-3-pro-preview",
    description="Analyzes individual cell health within the pack.",
    instruction="""
    You are the Cell Analyzer for the Pack Audit workflow.
    
    ## Your Task:
    Analyze the pack data from {pack_data} to assess each cell:
    
    1. **Voltage Analysis**:
       - Check for cell imbalance (ΔV > 50mV is concerning)
       - Identify outlier cells
       - Calculate voltage spread
    
    2. **Temperature Analysis**:
       - Identify hot spots
       - Check thermal gradient
       - Flag cells with ΔT > 5°C from average
    
    3. **Capacity Assessment**:
       - Compare cell capacities if available
       - Identify weak cells
    
    4. **Trend Analysis**:
       - Check if any cell is degrading faster than others
    
    ## Output Format:
    List all cells with their health status:
    - Healthy: Normal operation
    - Warning: Needs monitoring
    - Critical: Immediate attention
    
    Save findings to state['cell_analysis'] for the report generator.
    """,
    output_key="cell_analysis"
)

# Step 3: Anomaly Detection Agent
anomaly_detector = LlmAgent(
    name="AnomalyDetector",
    model="gemini-3-pro-preview",
    description="Detects anomalies and potential failure modes.",
    instruction="""
    You are the Anomaly Detector for the Pack Audit workflow.
    
    ## Your Task:
    Based on {pack_data} and {cell_analysis}, detect anomalies:
    
    1. **Statistical Anomalies**:
       - Values outside 3σ from mean
       - Sudden changes in trends
    
    2. **Known Failure Patterns**:
       - Lithium plating indicators (voltage behavior during charging)
       - SEI growth signatures (impedance increase)
       - Thermal runaway precursors
    
    3. **System-Level Issues**:
       - BMS communication errors
       - Sensor failures
       - Contactor issues
    
    ## Severity Classification:
    - **CRITICAL**: Immediate safety risk
    - **HIGH**: Action within 24 hours
    - **MEDIUM**: Action within 1 week
    - **LOW**: Monitor and document
    
    Save anomalies to state['anomalies'] for the report.
    """,
    output_key="anomalies"
)

# Step 4: Report Generator Agent
report_generator = LlmAgent(
    name="ReportGenerator",
    model="gemini-3-pro-preview",
    description="Generates comprehensive audit report from analysis results.",
    instruction="""
    You are the Report Generator for the Pack Audit workflow.
    
    ## Your Task:
    Create a comprehensive audit report from:
    - Pack Data: {pack_data}
    - Cell Analysis: {cell_analysis}
    - Anomalies: {anomalies}
    
    ## Report Structure:
    
    ### 1. Executive Summary
    - Overall pack health rating (A/B/C/D/F)
    - Critical findings count
    - Key recommendations (top 3)
    
    ### 2. Pack Overview
    - Configuration (cells, modules)
    - Total cycles, age
    - Current SOH
    
    ### 3. Cell-Level Analysis
    - Health distribution chart data
    - Outlier cells identified
    - Voltage/temperature maps
    
    ### 4. Anomalies & Risks
    - Detailed anomaly list
    - Risk assessment
    - Recommended actions per anomaly
    
    ### 5. Maintenance Schedule
    - Immediate actions (if any)
    - Short-term (1 week)
    - Long-term (1 month)
    
    ### 6. Trending & Predictions
    - Degradation forecast
    - Estimated remaining life
    
    Save the complete report to state['audit_report'].
    """,
    output_key="audit_report"
)

# Step 5: Verification Agent
verifier = LlmAgent(
    name="Verifier",
    model="gemini-3-pro-preview",
    description="Verifies report completeness and accuracy.",
    instruction="""
    You are the Quality Verifier for the Pack Audit workflow.
    
    ## Your Task:
    Review the audit report in {audit_report} for:
    
    1. **Completeness**:
       - All sections present
       - No missing data points
       - Recommendations included
    
    2. **Accuracy**:
       - Numbers are consistent
       - Classifications match data
       - No contradictions
    
    3. **Actionability**:
       - Recommendations are specific
       - Priorities are clear
       - Timeline is realistic
    
    ## Verification Output:
    - If PASS: Output "AUDIT_COMPLETE" and summarize key findings
    - If FAIL: List issues and request re-analysis
    
    Save verification status to state['verification'].
    """,
    output_key="verification"
)


# Complete Pack Audit Workflow (Marathon Agent)
pack_audit_workflow = SequentialAgent(
    name="PackAuditWorkflow",
    description="🔋 Marathon Agent: Comprehensive battery pack audit. "
                "Runs autonomously through data collection, cell analysis, "
                "anomaly detection, report generation, and verification. "
                "Typical duration: 5-30 minutes depending on pack size.",
    sub_agents=[
        data_collector,
        cell_analyzer,
        anomaly_detector,
        report_generator,
        verifier
    ]
)
