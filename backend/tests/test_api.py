import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import json
import io

# Import app - adjust path if needed based on how pytest is run
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

# Mock Data
MOCK_DEFECT_RESPONSE = {
    "defect_type": "Swelling",
    "severity": "Critical",
    "confidence": 95,
    "description": "Visible swelling in center of pouch cell.",
    "mitigation": "Quarantine immediately."
}

MOCK_LOG_RESPONSE = {
    "error_code": "E503",
    "component": "BMS Master",
    "description": "Communication timeout",
    "urgency": "High",
    "troubleshooting_steps": ["Check CAN bus", "Reboot BMS"]
}

@pytest.fixture
def mock_gemini():
    with patch("services.gemini_service.gemini_service") as mock:
        mock.analyze_defect = AsyncMock(return_value=MOCK_DEFECT_RESPONSE)
        mock.parse_fault_log = AsyncMock(return_value=MOCK_LOG_RESPONSE)
        yield mock

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_analyze_defect(mock_gemini):
    # Create valid dummy image
    image_content = b"fake_image_bytes"
    files = {"file": ("test.jpg", image_content, "image/jpeg")}
    
    response = client.post("/api/analyze/defect", files=files)
    
    assert response.status_code == 200
    assert response.json() == MOCK_DEFECT_RESPONSE
    # Verify service called correctly
    mock_gemini.analyze_defect.assert_called_once()

def test_analyze_defect_invalid_file(mock_gemini):
    # Send text file instead of image
    files = {"file": ("test.txt", b"text content", "text/plain")}
    
    response = client.post("/api/analyze/defect", files=files)
    
    assert response.status_code == 400
    assert response.json()["detail"] == "File must be an image"

def test_analyze_log(mock_gemini):
    payload = {"log_text": "Error E503 detected"}
    
    response = client.post("/api/analyze/log", json=payload)
    
    assert response.status_code == 200
    assert response.json() == MOCK_LOG_RESPONSE
    mock_gemini.parse_fault_log.assert_called_once()

def test_analyze_log_empty():
    payload = {"log_text": ""}
    
    response = client.post("/api/analyze/log", json=payload)
    
    assert response.status_code == 400
    assert "Log text is empty" in response.json()["detail"]
