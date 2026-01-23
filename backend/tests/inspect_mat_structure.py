"""
Diagnostic script to inspect the actual structure of NASA MAT files.
Run with: python3 inspect_mat_structure.py /path/to/B0038.mat
"""
import scipy.io
import numpy as np
import sys

def describe_object(obj, prefix="", depth=0, max_depth=5):
    """Recursively describe a MAT file object structure."""
    indent = "  " * depth
    
    if depth > max_depth:
        print(f"{indent}[Max depth reached]")
        return
    
    if isinstance(obj, dict):
        print(f"{indent}DICT with keys: {list(obj.keys())}")
        for k, v in obj.items():
            if not k.startswith('__'):
                print(f"{indent}  '{k}':")
                describe_object(v, f"{prefix}_{k}" if prefix else k, depth + 1)
                
    elif isinstance(obj, np.ndarray):
        dtype_info = f"dtype={obj.dtype}"
        shape_info = f"shape={obj.shape}"
        
        if obj.dtype.names:
            # Structured array
            print(f"{indent}STRUCTURED ARRAY {shape_info} with fields: {obj.dtype.names}")
            # Show first element's structure if it exists
            if obj.size > 0:
                first = obj.flat[0]
                print(f"{indent}  First element structure:")
                for name in obj.dtype.names:
                    val = first[name]
                    if isinstance(val, np.ndarray):
                        if val.dtype == 'O':
                            print(f"{indent}    '{name}': Object Array shape={val.shape}")
                            if val.size > 0:
                                describe_object(val.flat[0], f"{prefix}_{name}", depth + 2)
                        else:
                            print(f"{indent}    '{name}': Array {val.dtype} shape={val.shape}")
                    else:
                        print(f"{indent}    '{name}': {type(val).__name__} = {val}")
                        
        elif obj.dtype == 'O':
            # Object array
            print(f"{indent}OBJECT ARRAY {shape_info}")
            if obj.size > 0:
                first = obj.flat[0]
                print(f"{indent}  First element type: {type(first)}")
                if isinstance(first, np.ndarray):
                    describe_object(first, f"{prefix}[0]", depth + 1)
                elif isinstance(first, dict):
                    print(f"{indent}  Dict keys: {list(first.keys())}")
                    
        else:
            # Regular numeric array
            print(f"{indent}ARRAY {dtype_info} {shape_info}")
            if obj.size <= 5:
                print(f"{indent}  values: {obj.flatten()}")
            else:
                print(f"{indent}  first 3: {obj.flatten()[:3]} ... last: {obj.flatten()[-1]}")
    else:
        print(f"{indent}{type(obj).__name__}: {obj}")

def main():
    if len(sys.argv) < 2:
        # Try to find any .mat file in uploads folder
        import os
        uploads_dir = "/home/suryaremanan/Documents/gemini-hackathon/BatteryForgeAI/backend/uploads"
        if os.path.exists(uploads_dir):
            mat_files = [f for f in os.listdir(uploads_dir) if f.endswith('.mat')]
            if mat_files:
                filepath = os.path.join(uploads_dir, mat_files[0])
                print(f"Found MAT file: {filepath}")
            else:
                print("No .mat files found in uploads folder")
                print("Usage: python3 inspect_mat_structure.py /path/to/file.mat")
                return
        else:
            print("Usage: python3 inspect_mat_structure.py /path/to/file.mat")
            return
    else:
        filepath = sys.argv[1]
    
    print(f"\n=== Inspecting: {filepath} ===\n")
    
    try:
        mat_data = scipy.io.loadmat(filepath)
        print("Top-level keys:", [k for k in mat_data.keys() if not k.startswith('__')])
        print()
        describe_object(mat_data, "", 0)
    except Exception as e:
        print(f"Error loading file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
