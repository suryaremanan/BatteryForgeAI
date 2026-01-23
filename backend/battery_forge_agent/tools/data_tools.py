"""
Data Tools for Battery Analysis
File parsing, EIS analysis, and knowledge base search.
"""
import json
from typing import Optional, List


def parse_charging_data(file_content: str, file_type: str = "csv") -> dict:
    """
    Parses battery charging/cycling data from various file formats.
    
    Args:
        file_content: Raw file content as string
        file_type: File type ('csv', 'txt', 'mat')
    
    Returns:
        dict: Parsed data with columns, metrics, and summary
    """
    try:
        import pandas as pd
        from io import StringIO
        
        if file_type == "csv":
            df = pd.read_csv(StringIO(file_content))
        else:
            # Attempt CSV-like parsing for other types
            df = pd.read_csv(StringIO(file_content), delimiter=None, engine='python')
        
        # Identify key columns
        columns = list(df.columns)
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        
        # Calculate basic metrics
        metrics = {}
        for col in numeric_cols[:5]:  # Limit to first 5 numeric columns
            metrics[col] = {
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "mean": float(df[col].mean()),
                "std": float(df[col].std()) if len(df) > 1 else 0
            }
        
        return {
            "status": "success",
            "file_type": file_type,
            "row_count": len(df),
            "columns": columns,
            "numeric_columns": numeric_cols,
            "metrics": metrics,
            "sample_data": df.head(5).to_dict('records'),
            "summary": f"Parsed {len(df)} rows with {len(columns)} columns"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "file_type": file_type
        }


def analyze_eis_spectrum(
    frequency: List[float],
    z_real: List[float],
    z_imag: List[float]
) -> dict:
    """
    Analyzes Electrochemical Impedance Spectroscopy (EIS) data.
    Performs multi-layer diagnosis per IEST standards.
    
    Args:
        frequency: Frequency values in Hz
        z_real: Real impedance values (Z')
        z_imag: Imaginary impedance values (Z'')
    
    Returns:
        dict: EIS analysis with layer-by-layer diagnosis
    """
    import numpy as np
    
    freq = np.array(frequency)
    real = np.array(z_real)
    imag = np.array(z_imag)
    
    # Layer 1: High Frequency (>1kHz) - Ohmic resistance
    high_freq_mask = freq > 1000
    if np.any(high_freq_mask):
        r_ohmic = float(np.min(real[high_freq_mask]))
        ohmic_status = "Normal" if r_ohmic < 0.1 else "Warning"
    else:
        r_ohmic = float(real[0]) if len(real) > 0 else 0
        ohmic_status = "Estimated"
    
    # Layer 2: Mid Frequency (1Hz-1kHz) - Charge transfer
    mid_freq_mask = (freq >= 1) & (freq <= 1000)
    if np.any(mid_freq_mask):
        # Estimate R_ct from semicircle diameter
        z_real_mid = real[mid_freq_mask]
        z_imag_mid = np.abs(imag[mid_freq_mask])
        
        # Find semicircle peak (maximum -Z'')
        peak_idx = np.argmax(z_imag_mid)
        r_ct = float(z_real_mid[peak_idx] - r_ohmic) if peak_idx < len(z_real_mid) else 0
        kinetics_status = "Normal" if r_ct < 0.5 else "Degraded" if r_ct < 1.0 else "Critical"
    else:
        r_ct = 0
        kinetics_status = "Insufficient data"
    
    # Layer 3: Low Frequency (<1Hz) - Diffusion (Warburg)
    low_freq_mask = freq < 1
    if np.any(low_freq_mask):
        z_real_low = real[low_freq_mask]
        z_imag_low = imag[low_freq_mask]
        
        # Check Warburg slope (should be ~45°)
        if len(z_real_low) > 2:
            slope = np.polyfit(z_real_low, np.abs(z_imag_low), 1)[0]
            diffusion_status = "Normal" if 0.8 < slope < 1.2 else "Anomalous"
        else:
            diffusion_status = "Insufficient data"
    else:
        diffusion_status = "No low-freq data"
    
    # Overall health assessment
    if ohmic_status == "Normal" and kinetics_status == "Normal" and diffusion_status == "Normal":
        overall = "Healthy"
    elif kinetics_status == "Critical" or ohmic_status == "Warning":
        overall = "Degraded"
    else:
        overall = "Minor Issues"
    
    return {
        "layers": {
            "ohmic": {
                "status": ohmic_status,
                "value_ohm": round(r_ohmic, 4),
                "description": f"Ohmic resistance: {r_ohmic:.4f} Ω"
            },
            "kinetics": {
                "status": kinetics_status,
                "value_ohm": round(r_ct, 4),
                "description": f"Charge transfer resistance: {r_ct:.4f} Ω"
            },
            "diffusion": {
                "status": diffusion_status,
                "description": f"Diffusion behavior: {diffusion_status}"
            }
        },
        "overall_health": overall,
        "data_points": len(frequency),
        "summary": f"EIS analysis shows {overall.lower()} cell condition. R_ohmic={r_ohmic:.4f}Ω, R_ct={r_ct:.4f}Ω"
    }


def search_knowledge_base(query: str, top_k: int = 3) -> dict:
    """
    Searches the BatteryForge knowledge base for relevant documentation.
    Uses ChromaDB vector store for semantic search.
    
    Args:
        query: Search query string
        top_k: Number of results to return
    
    Returns:
        dict: Search results with matched documents and relevance scores
    """
    try:
        from services.rag_service import rag_service
        
        results = rag_service.search(query, n_results=top_k)
        
        if results and len(results) > 0:
            return {
                "status": "success",
                "query": query,
                "result_count": len(results),
                "results": [
                    {
                        "title": r.get("title", "Unknown"),
                        "content": r.get("content", "")[:500],  # Truncate for context
                        "source": r.get("source", "Knowledge Base"),
                        "relevance": r.get("score", 0.0)
                    }
                    for r in results
                ],
                "summary": f"Found {len(results)} relevant documents for: {query}"
            }
        else:
            return {
                "status": "no_results",
                "query": query,
                "message": "No matching documents found in knowledge base"
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "query": query
        }
