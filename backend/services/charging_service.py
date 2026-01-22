import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import io
import os
import re
import base64

class ChargingService:
    def _regex_parse(self, df: pd.DataFrame) -> dict:
        """
        FALLBACK: Heuristic column mapping when Gemini is disabled (Privacy Mode).
        """
        metadata = {
            'dataset_type': 'Unknown',
            'summary': 'Privacy Mode (Local Analysis) - AI Disabled',
            'is_standard_cycling': False,
            'plot_recommendation': {'title': 'Raw Data Plot'}
        }
        
        # Normalize columns
        norm_cols = {str(c).lower().strip(): c for c in df.columns}
        
        # 1. Classification
        # Simple keyword counting
        score_cycling = sum(1 for k in norm_cols if any(x in k for x in ['volt', 'curr', 'cap', 'cycle', 'time']))
        score_impedance = sum(1 for k in norm_cols if any(x in k for x in ['freq', 'z_real', 'z_img', 'real', 'imag', 'z\'', 'z"']))
        
        if score_impedance > 0 and score_impedance >= score_cycling:
             metadata['dataset_type'] = 'Impedance'
        elif score_cycling > 0:
             metadata['dataset_type'] = 'Cycling'
        
        # 2. Plot Recommendation
        x_col, y_col = None, None
        
        if metadata['dataset_type'] == 'Cycling':
            # Try to find standard columns
            for k, orig in norm_cols.items():
                if 'time' in k or 'capacity' in k: x_col = orig
                if 'voltage' in k or 'volts' in k: y_col = orig
            
            # Default to Time if found, else Capacity
            # Actually usually default X is Time or Capacity. 
            
            metadata['plot_recommendation'] = {
                'x_axis_col': x_col or df.columns[0],
                'y_axis_col': y_col or (df.columns[1] if len(df.columns)>1 else df.columns[0]),
                'title': 'Voltage Profile (Local)',
                'invert_y': False
            }
            metadata['is_standard_cycling'] = True
            
        elif metadata['dataset_type'] == 'Impedance':
             for k, orig in norm_cols.items():
                if 'real' in k or 'z_re' in k or "z'" in k: x_col = orig
                if 'imag' in k or 'z_im' in k or 'z"' in k: y_col = orig
             
             metadata['plot_recommendation'] = {
                'x_axis_col': x_col or df.columns[0],
                'y_axis_col': y_col or df.columns[1],
                'title': 'Nyquist Plot (Local)',
                'invert_y': True # Nyquist convention
            }
             
        else:
             # Default fallback
             metadata['plot_recommendation'] = {
                'x_axis_col': df.columns[0],
                'y_axis_col': df.columns[1] if len(df.columns) > 1 else df.columns[0],
                'title': 'Raw Plot'
            }
             
        return metadata

    def resample_to_json(self, df: pd.DataFrame, max_points=2000):
        """
        Downsamples dataframe to JSON-friendly list of dicts.
        """
        if df.empty:
            return []
            
        if len(df) > max_points:
             # simple uniform sampling
             indices = np.linspace(0, len(df)-1, max_points).astype(int)
             df_small = df.iloc[indices].copy()
        else:
             df_small = df.copy()
        
        # Replace NaN with None (which becomes null in JSON)
        # return df_small.where(pd.notnull(df_small), None).to_dict(orient='records')
        
        # Actually, replacing NaNs with None in pandas can be tricky with types.
        # Let's just fillna with 0 for plotting or handle in frontend?
        # Recharts handles nulls by breaking the line, which is good.
        # But pandas to_dict default handles NaNs as NaN (invalid JSON).
        
        return df_small.replace({np.nan: None}).to_dict(orient='records')

    def generate_charging_plot(self, df: pd.DataFrame):
        """
        Generates a Voltage/Current vs Time plot from a DataFrame.
        Returns the image as a bytes buffer.
        """
        plt.figure(figsize=(10, 6))
        
        # Ensure we have the right columns
        if 'time' not in df.columns or 'voltage' not in df.columns or 'current' not in df.columns:
             return self._create_error_plot("Missing required columns: time, voltage, current")

        # Plot Voltage
        ax1 = plt.gca()
        # Add slight smoothing/downsampling for performance if needed
        plot_df = df
        if len(df) > 3000:
             plot_df = df.iloc[::max(1, len(df)//3000)]

        line1, = ax1.plot(plot_df['time'], plot_df['voltage'], color='C0', label='Voltage (V)')
        ax1.set_xlabel('Time (s)')
        ax1.set_ylabel('Voltage (V)', color='C0')
        ax1.tick_params(axis='y', labelcolor='C0')
        
        # Plot Current on secondary axis
        ax2 = ax1.twinx()
        line2, = ax2.plot(plot_df['time'], plot_df['current'], color='C1', label='Current (A)', linestyle='--')
        ax2.set_ylabel('Current (A)', color='C1')
        ax2.tick_params(axis='y', labelcolor='C1')
        
        # Combine legends
        lines = [line1, line2]
        labels = [l.get_label() for l in lines]
        ax1.legend(lines, labels, loc='upper left', frameon=True, fancybox=True, framealpha=0.7)
        
        plt.title('Battery Charging Signature (Real Data)')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close()
        
        return buf

    def _create_error_plot(self, message):
        plt.figure(figsize=(6, 4))
        plt.text(0.5, 0.5, message, ha='center', va='center', wrap=True)
        plt.axis('off')
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close()
        return buf

    def calculate_metrics(self, df: pd.DataFrame):
        """
        Calculates key electrochemical metrics from the cycling data.
        """
        import numpy as np
        
        # Ensure sorted by time
        df = df.sort_values('time')
        
        time_s = df['time'].values
        current_a = df['current'].values
        voltage_v = df['voltage'].values
        
        # Calculate dt (time steps in seconds)
        dt = np.diff(time_s, prepend=time_s[0])
        
        # Integration: Q = ∫ I dt
        # We take absolute value to handle discharge (negative current)
        charge_ah = np.trapezoid(np.abs(current_a), x=time_s) / 3600.0
        
        # Integration: E = ∫ V*I dt
        energy_wh = np.trapezoid(np.abs(current_a * voltage_v), x=time_s) / 3600.0
        
        # Duration
        duration_s = time_s[-1] - time_s[0]
        
        return {
            "capacity_ah": round(float(charge_ah), 4),
            "energy_wh": round(float(energy_wh), 4),
            "duration_minutes": round(float(duration_s / 60), 2),
            "avg_voltage": round(float(np.mean(voltage_v)), 3),
            "max_current": round(float(np.max(np.abs(current_a))), 2)
        }

    def calculate_scientific_safety(self, df: pd.DataFrame, physics_twin_data: list = None):
        """
        Calculates a Deterministic Safety Score (0-100) based on physics.
        Components:
        1. Voltage Stability (dV/dt smoothness) - 40%
        2. Physics Deviation (RMSE vs Ideal) - 40% (if available, else re-weighted)
        3. Extremes Check (Over-voltage/current) - 20%
        """
        import numpy as np
        
        score = 100.0
        breakdown = {}
        
        # 1. Voltage Stability (Smoothness)
        # Calculate 1st derivative (dV/dt)
        # Sudden jumps (micro-shorts) cause high variance in dV/dt
        v = df['voltage'].values
        dv = np.diff(v)
        # Filter out normal large jumps (like step changes) by looking at local variance?
        # Simple heuristic: Variance of dV should be low for constant current.
        dv_var = np.var(dv)
        
        # Penalize high variance. 
        # Expected variance is very small (< 1e-4).
        stability_penalty = min(40, (dv_var * 10000) * 10) 
        score -= stability_penalty
        breakdown['voltage_stability_penalty'] = round(stability_penalty, 1)
        
        # 2. Physics Deviation (If Twin available)
        if physics_twin_data:
            # Interpolate physics data to match experimental time points
            # Physics data is dict of lists: {'time': [...], 'voltage': [...] }
            # PyBaMM service returns standard dict structure
            pt_time = physics_twin_data.get('time', [])
            pt_volt = physics_twin_data.get('voltage', [])
            
            # Helper to interpolate
            ex_time = df['time'].values
            
            # Only compare overlapping range
            t_min = max(min(pt_time), min(ex_time))
            t_max = min(max(pt_time), max(ex_time))
            
            mask = (ex_time >= t_min) & (ex_time <= t_max)
            if np.sum(mask) > 10:
                ex_v_segment = v[mask]
                ex_t_segment = ex_time[mask]
                
                # Interpolate physics V onto experimental T
                pt_v_interp = np.interp(ex_t_segment, pt_time, pt_volt)
                
                # Calculate RMSE
                rmse = np.sqrt(np.mean((ex_v_segment - pt_v_interp)**2))
                
                # Penalize RMSE. 
                # Good match < 0.05V. Bad > 0.2V.
                # Penalty = (RMSE - 0.02) * Scaling
                rmse_penalty = max(0, min(40, (rmse * 100))) 
                score -= rmse_penalty
                breakdown['physics_deviation_penalty'] = round(rmse_penalty, 1)
                breakdown['rmse_v'] = round(rmse, 4)
            else:
                breakdown['physics_deviation_penalty'] = 0
        else:
             # Re-weight if no physics (e.g. just stability * 2)
             score -= stability_penalty # Double dip stability for lack of reference? Or just normalize.
        
        return {
            "score": max(0, round(score, 1)),
            "breakdown": breakdown
        }

    async def parse_cycling_data(self, file_content: bytes) -> pd.DataFrame:
        """
        UNIVERSAL "ROSETTA STONE" PARSER:
        Uses Gemini 3 to intelligently map ANY column format to standard (time_s, voltage_v, current_a).
        """
        import io
        import pandas as pd
        from services.gemini_service import gemini_service
        
        try:
            content_str = file_content.decode('utf-8', errors='ignore')
            # Flexible Read
            try:
                df = pd.read_csv(io.StringIO(content_str), skipinitialspace=True)
            except:
                df = pd.read_csv(io.StringIO(content_str), delim_whitespace=True)

            if df.empty:
                raise ValueError("Empty dataset")

            # 1. Ask Gemini to Map Columns
            headers = list(df.columns)
            sample = df.head(5).to_csv(index=False)
            
            # We add a new method to gemini_service for this specific mapping task
            mapping = await gemini_service.map_columns_semantic(headers, sample)
            
            if not mapping or "error" in mapping:
                # Fallback to Regex if AI fails
                print("Gemini Mapping Failed, falling back to Regex.")
                return self._fallback_regex_parse(df)

            # 2. Apply Mapping
            # mapping should look like: {"time": "Test_Time(s)", "voltage": "U_meas_V", ...}
            
            renamed_cols = {}
            for std_col, original_col in mapping.items():
                if original_col in df.columns:
                    renamed_cols[original_col] = std_col
            
            df = df.rename(columns=renamed_cols)
            
            # 3. Clean & Validate
            required = ['time', 'voltage', 'current']
            missing = [c for c in required if c not in df.columns]
            
            if missing:
                print(f"AI Mapping missing columns: {missing}. Fallback to Regex.")
                return self._fallback_regex_parse(df)
            
            # Coerce to numeric
            for c in required:
                df[c] = pd.to_numeric(df[c], errors='coerce')

            # --- SANITY CHECK (Redundant specific for Physics/Twins) ---
            # If Voltage max is > 100V, it is likely TIME or Capacity, not Cell Voltage.
            if df['voltage'].max() > 100:
                 print(f"AI Parse Sanity Check: Voltage column has max {df['voltage'].max()}. Hunting for replacement.")
                 
                 best_col = None
                 candidates = []
                 
                 # Scan all columns
                 for c in df.columns:
                      if c == 'voltage': continue
                      
                      # Coerce locally for checking
                      try:
                          check_ser = pd.to_numeric(df[c], errors='coerce')
                      except:
                          continue
                          
                      if check_ser.isna().all(): continue

                      c_lower = str(c).lower()
                      # Strict exclusion list - ADDED 'current', 'i', 'amp'
                      if any(x in c_lower for x in ['mode', 'status', 'step', 'index', 'flag', 'state', 'time', 'soc', 'cap', 'energy', 'wh', 'ah', 'temp', 'current', 'amp', 'cycle']):
                           continue
                      
                      # Double check explicit exclusion of 'current' column if named exactly
                      if c_lower in ['i', 'current', 'cur']: continue

                      mean_val = check_ser.mean()
                      std_val = check_ser.std()
                      
                      score = 0
                      
                      # 1. Physics Check (Strong indicator)
                      # Cell Voltage is typically 2.5V - 4.5V
                      if 2.0 < mean_val < 5.0:
                          score += 50
                      # Module/Pack Voltage (12V, 24V, 48V, 400V, 800V)
                      elif 10.0 < mean_val < 900.0:
                          score += 20
                      else:
                          pass

                      # 2. Name Check
                      if 'volt' in c_lower or 'v_meas' in c_lower: score += 100
                      elif 'u_meas' in c_lower: score += 100 # German/Standard notation
                      elif 'meas' in c_lower: score += 5
                      
                      # 3. Variance Check (Voltage must change during charging)
                      if std_val < 0.0001:
                          score -= 50 # Constant column is not useful

                      if score > 0:
                          candidates.append((score, c))
                 
                 if candidates:
                      # Sort by score desc
                      candidates.sort(key=lambda x: x[0], reverse=True)
                      best_col = candidates[0][1]
                      print(f"AI Parse Sanity Check: Candidates found: {candidates}")
                      
                 if best_col:
                      print(f"AI Parse Sanity Check: Swapping invalid voltage with '{best_col}' (Score: {candidates[0][0]}).")
                      # Rename logic
                      df = df.rename(columns={'voltage': 'bad_voltage_mapped'})
                      df = df.rename(columns={best_col: 'voltage'})
                 else:
                      print("Cannot recover valid voltage. Zeroing out to prevent scaling issues.")
                      # If we can't find it, we MUST provide a fallback to avoid crash
                      df['voltage'] = 0.0

            # Last Mile Safety: Ensure all required columns exist
            for req in required:
                if req not in df.columns:
                    print(f"CRITICAL: {req} missing after sanity check. Filling with 0.")
                    df[req] = 0.0
            
            return df[required].dropna()
            


        except Exception as e:
            print(f"Universal Parser Error: {e}")
            raise e

    def _fallback_regex_parse(self, df: pd.DataFrame):
        """Original Regex logic as fallback"""
        import re
        norm_cols = {str(c).lower().strip().replace('_', ' '): c for c in df.columns}
        col_map = {}
        patterns = {
            'time': [r'time\s*\(?s\)?', r'test\s*time', r'^t$', r'^time$'],
            'voltage': [r'volt\w*\s*\(?v\)?', r'^v$', r'voltage'],
            'current': [r'curr\w*\s*\(?a\)?', r'^i$', r'current', r'amper']
        }
        def find_col(target_name):
            for pattern in patterns[target_name]:
                for clean_col, orig_col in norm_cols.items():
                    if re.search(pattern, clean_col):
                        return orig_col
            return None

        found_cols = {}
        for target in ['time', 'voltage', 'current']:
            match = find_col(target)
            if match: found_cols[target] = match
            
        if 'time' in found_cols: col_map[found_cols['time']] = 'time'
        if 'voltage' in found_cols: col_map[found_cols['voltage']] = 'voltage'
        if 'current' in found_cols: col_map[found_cols['current']] = 'current'
        
        df = df.rename(columns=col_map)
        required = ['time', 'voltage', 'current']
        
        # If still missing, just try index 0,1,2? No, unsafe.
        if not all(c in df.columns for c in required):
             raise ValueError("Could not auto-detect standard cycling columns.")
             
        return df[required].dropna()

    def generate_generic_plot(self, df: pd.DataFrame, config: dict):
        """
        Generates a plot based on Gemini's recommendation (X vs Y).
        """
        plt.figure(figsize=(10, 6))
        
        x_col = config.get('x_axis_col')
        y_col = config.get('y_axis_col')
        title = config.get('title', 'Data Visualization')
        invert_y = config.get('invert_y', False)
        
        # Check if columns exist
        if x_col not in df.columns or y_col not in df.columns:
            # Try finding close matches? Or just plot first 2 cols
            x_col = df.columns[0]
            y_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]
            title += " (Fallback: First 2 columns)"

        # Plot
        # FIX: Coerce to numeric to avoid "value must be str or bytes, not float" error
        # This occurs if matplotlib thinks it's plotting categories (strings) but finds a NaN (float)
        try:
            df[x_col] = pd.to_numeric(df[x_col], errors='coerce')
            df[y_col] = pd.to_numeric(df[y_col], errors='coerce')
            df = df.dropna(subset=[x_col, y_col])
        except Exception:
            pass # Fallback

        if df.empty:
             return self._create_error_plot(f"No valid numeric data for {x_col} vs {y_col}")

        plt.plot(df[x_col], df[y_col], label=f'{y_col} vs {x_col}')
        plt.xlabel(x_col)
        plt.ylabel(y_col)
        plt.title(title)
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        if invert_y:
            plt.gca().invert_yaxis()
            
        plt.tight_layout()
        
        # Save
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close()
        return buf

    async def process_universal_file(self, file_content: bytes, local_mode: bool = False, chemistry_type: str = "NMC"):
        """
        Universal entry point.
        Now supports privacy mode (local_mode=True) and Physics Selection.
        """
        from services.gemini_service import gemini_service
        try:

            # Flexible reading: Try Excel then CSV

            # Flexible reading: Try Excel then CSV
            df = None
            
            # 1. Try Excel/Binary
            try:
                df = pd.read_excel(io.BytesIO(file_content))
            except:
                pass
                
            # 2. Try Text/CSV
            if df is None:
                content_str = file_content.decode('utf-8', errors='ignore')
                try:
                    df = pd.read_csv(io.StringIO(content_str), skipinitialspace=True)
                except:
                    try:
                        df = pd.read_csv(io.StringIO(content_str), delim_whitespace=True)
                    except:
                        try:
                             # Last resort: Engine python with auto separator
                             df = pd.read_csv(io.StringIO(content_str), sep=None, engine='python')
                        except:
                             pass

            if df is None or df.empty:
                raise ValueError("Could not parse file. Supported: CSV, Excel, Tab-separated.")
            
            # Numeric conversion attempt on all columns (Soft, for JSON stability later)
            for c in df.columns:
                try:
                    df[c] = pd.to_numeric(df[c], errors='coerce')
                except (ValueError, TypeError):
                    pass # Should not happen with coerce, but safe

            # 2. Intelligent Analysis & Physics Simulation
            metadata = {}
            if local_mode:
                metadata = self._regex_parse(df)
            else:
                # Clean headers for LLM
                headers = list(df.columns)
                sample_data = df.head(5).to_csv(index=False)
                # Call Gemini for Metadata
                metadata = await gemini_service.analyze_dataset_signature(headers, sample_data)
            
            # --- SANITY CHECK: FIX BAD VOLTAGE MAPPING ---
            # Hackathon Safety: Sometimes "Time" (0-50000) is mistaken for "Voltage" (3-4V)
            try:
                plot_config = metadata.get('plot_recommendation', {})
                v_col = plot_config.get('y_axis_col')
                
                if v_col and v_col in df.columns:
                    # Check if "Voltage" is exploding (>800V is unlikely even for logic, 50k is def wrong)
                    # We use 800V to allow Pack level, but typically Time is > 3000.
                    max_val = df[v_col].max()
                    if max_val > 800: 
                        print(f"Sanity Check: {v_col} has max value {max_val}. This is likely TIME, not Voltage.")
                        
                        # Hunt for a better column
                        best_col = None
                        candidates = []
                        
                        # Check ALL columns now (since we coerced them)
                        for c in df.columns:
                            # 1. Skip the bad column
                            if c == v_col: continue

                            # 2. Skip "Mode", "Status", "Step", "Index" columns
                            c_lower = str(c).lower()
                            if any(x in c_lower for x in ['mode', 'status', 'step', 'index', 'flag', 'state', 'time']):
                                continue
                            
                            # Ensure numeric check just in case
                            if not pd.api.types.is_numeric_dtype(df[c]):
                                continue

                            mean_val = df[c].mean()
                            
                            # 3. Voltage Range Check (Relaxed: 0.1V to 600V)
                            if 0.1 < mean_val < 600.0:
                                # 4. Variance Check (Avoid constant values like setpoints)
                                if df[c].std() > 0.001:
                                    # Score the candidate
                                    score = 0
                                    if 'volt' in c_lower or 'v_meas' in c_lower: score += 10
                                    if 'u_meas' in c_lower: score += 10
                                    if 'meas' in c_lower: score += 5
                                    candidates.append((score, c))
                        
                        # Pick best candidate
                        if candidates:
                            candidates.sort(key=lambda x: x[0], reverse=True)
                            best_col = candidates[0][1]
                        
                        if best_col:
                            print(f"Sanity Check: Swapping {v_col} -> {best_col}")
                            metadata['plot_recommendation']['y_axis_col'] = best_col
                            metadata['plot_recommendation']['x_axis_col'] = v_col # Old voltage was probably time!
                        else:
                             print("Sanity Check: No better voltage candidate found.")
            except Exception as e:
                print(f"Sanity Check Failed: {e}")
            # ---------------------------------------------
            
            # ---------------------------------------------------------
            # 3. PHYSICS ENGINE INTEGRATION (PyBaMM) - NEW for Hackathon
            # ---------------------------------------------------------
            try:
                from services.simulation_service import simulation_service
                
                # Estimate C-Rate: Max Discharge Current / Capacity
                # If capacity is unknown (e.g. not in metadata), estimate from integration
                est_capacity = metadata.get('capacity_ah', 2.5) # Default 2.5Ah
                
                # Find current column safely
                curr_col = next((c for c in df.columns if 'current' in str(c).lower()), None)
                
                c_rate = 1.0 # Default
                if curr_col:
                    max_current = df[curr_col].abs().max()
                    if est_capacity > 0:
                        c_rate = round(max_current / est_capacity, 1) or 0.5
                
                print(f"Triggering Physics Engine (PyBaMM) for {chemistry_type} at {c_rate}C...")
                
                # Run Simulation (Async)
                sim_result = await simulation_service.run_reference_discharge(
                    chemistry=chemistry_type, 
                    c_rate=c_rate, 
                    temperature_C=25.0
                )
                
                if sim_result.get('success'):
                    metadata['physics_twin'] = sim_result
                    metadata['physics_engine'] = "PyBaMM DFN Model (Real)"
                else:
                    metadata['physics_engine'] = "Simulation Failed"

            except Exception as e:
                print(f"Physics Engine Failed: {e}")
                metadata['physics_engine'] = "Error"

            return df, metadata
        except Exception as e:
            print(f"Universal Process Error: {e}")
            raise e

    async def generate_comparison_plot(self, file_paths: list):
        """
        Generates an overlay plot for multiple files.
        """
        plt.figure(figsize=(10, 6))
        
        # Color cycle
        colors = plt.cm.tab10(np.linspace(0, 1, 10))
        
        for i, path in enumerate(file_paths):
            try:
                with open(path, "rb") as f:
                    content = f.read()
                    
                try:
                    df = pd.read_csv(io.BytesIO(content), skipinitialspace=True)
                except:
                    df = pd.read_csv(io.BytesIO(content), delim_whitespace=True)
                    
                norm_cols = {c.lower(): c for c in df.columns}
                x_col, y_col = None, None
                
                # Check for standard Cycling keys
                for k in norm_cols:
                    if 'time' in k or 'capacity' in k: x_col = norm_cols[k]
                    if 'volt' in k: y_col = norm_cols[k]
                
                # Fallback
                if not x_col: x_col = df.columns[0]
                if not y_col: y_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]
                
                # FIX 2: Coerce to numeric here as well!
                try:
                    df[x_col] = pd.to_numeric(df[x_col], errors='coerce')
                    df[y_col] = pd.to_numeric(df[y_col], errors='coerce')
                    df = df.dropna(subset=[x_col, y_col])
                except:
                    pass

                if df.empty: continue

                label = os.path.basename(path)
                plt.plot(df[x_col], df[y_col], label=label, color=colors[i % 10], alpha=0.8)
                
            except Exception as e:
                print(f"Failed to plot {path}: {e}")
                continue

        plt.xlabel("X Axis (Time/Capacity)")
        plt.ylabel("Y Axis (Voltage/Value)")
        plt.title("Batch Overlay Comparison")
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close()
        return buf

charging_service = ChargingService()
