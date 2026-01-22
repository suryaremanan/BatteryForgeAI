import re

class RegexLogService:
    def __init__(self):
        # Critical patterns that require INSTANT REACTION (0ms latency)
        # These bypass the LLM for safety reasons.
        self.critical_patterns = {
            "THERMAL_RUNAWAY": [
                r"THERMAL_RUNAWAY", 
                r"T_rise.*>.*5\s*°C/s",  # Temp rise > 5 deg/s
                r"Cell.*Temp.*>.*60",    # Abs temp > 60C
                r"Smoke Detected"
            ],
            "ISOLATION_FAULT": [
                r"Isolation Fault", 
                r"Insulation Resistance.*<.*100\s*kOhms",
                r"HV Interlock Open"
            ],
            "OVERVOLTAGE": [
                r"Cell.*Voltage.*>.*4\.3", # Dangerous for NMC
                r"Pack.*Voltage.*>.*850"
            ]
        }

        # Warning patterns (Info/Maintenance)
        self.warning_patterns = {
            "IMBALANCE": [
                r"Cell Imbalance", 
                r"Delta V.*>.*100mV",
                r"Balancing Ineffective"
            ],
            "COMMUNICATION": [
                r"CAN Bus Off",
                r"Heartbeat Lost",
                r"No Response"
            ]
        }

    def scan(self, log_text: str):
        """
        Scans logs for critical patterns.
        Returns:
            {
                "detected": bool,
                "urgency": "Critical" | "Warning" | "Safe",
                "matches": [ "THERMAL_RUNAWAY found" ],
                "troubleshooting_steps": [ ... ]
            }
        """
        matches = []
        urgency = "Safe"
        
        # 1. Scan Critical
        for category, patterns in self.critical_patterns.items():
            for pattern in patterns:
                if re.search(pattern, log_text, re.IGNORECASE):
                    matches.append(f"CRITICAL: {category} DETECTED")
                    urgency = "Critical"
                    break # One hit per category is enough

        # 2. Scan Warnings (if not critical)
        if urgency != "Critical":
            for category, patterns in self.warning_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, log_text, re.IGNORECASE):
                        matches.append(f"WARNING: {category} DETECTED")
                        urgency = "Warning"

        # 3. Generate Static Troubleshooting (Instant)
        steps = []
        if urgency == "Critical":
            steps = [
                "!!! IMMEDIATE ACTION REQUIRED !!!",
                "1. OPEN contactors immediately (Emergency Stop).",
                "2. EVACUATE the pack testing area.",
                "3. Activate fire suppression systems if smoke is visible."
            ]
        elif urgency == "Warning":
            steps = [
                "1. Review recent charging/discharging session logs.",
                "2. Check wiring harness and connector seating.",
                "3. Perform manual cell balancing cycle if imbalance persists."
            ]

        return {
            "detected": urgency != "Safe",
            "urgency": urgency,
            "description": " | ".join(matches) if matches else "No standard faults detected by fast-scan.",
            "troubleshooting_steps": steps
        }

regex_log_service = RegexLogService()
