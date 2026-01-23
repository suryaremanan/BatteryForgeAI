"""
Continuous Monitor Workflow - Loop Agent
A loop-based workflow for continuous fleet monitoring.
"""
from google.adk.agents import LoopAgent, LlmAgent


# Monitoring Step (executed in loop)
monitor_step = LlmAgent(
    name="MonitorStep",
    model="gemini-3-flash-preview",
    description="Single monitoring iteration - checks fleet status and raises alerts.",
    instruction="""
    You are the Continuous Monitor for BatteryForge AI.
    
    ## Your Task (One Iteration):
    1. Check current fleet status
    2. Identify any new anomalies since last check
    3. Raise alerts if thresholds exceeded
    4. Update monitoring dashboard
    
    ## Alert Thresholds:
    - Temperature > 55°C: WARNING
    - Temperature > 60°C: CRITICAL
    - Voltage > 4.3V/cell: WARNING
    - Voltage > 4.35V/cell: CRITICAL
    - SOH drop > 1% in 24h: WARNING
    
    ## Loop Control:
    - If CRITICAL condition: Output "ALERT_CRITICAL" + [ACTION: RED_ALERT]
    - If stable: Output "CONTINUE_MONITORING"
    - If user requests stop: Output "STOP_LOOP"
    
    Save current status to state['monitor_status'].
    """,
    output_key="monitor_status"
)


# Continuous Monitoring Loop
continuous_monitor_workflow = LoopAgent(
    name="ContinuousMonitorWorkflow",
    description="🔄 Loop Agent: Continuous fleet monitoring. "
                "Runs indefinitely until stopped or critical condition detected. "
                "Checks fleet status every iteration and raises alerts as needed.",
    sub_agents=[monitor_step],
    max_iterations=1000,  # Safety limit
    # Loop continues while condition function returns True
    # In ADK, the loop continues until the agent outputs a stop signal
)
