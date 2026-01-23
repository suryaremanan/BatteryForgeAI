import pandas as pd
import numpy as np
import io
from services.gemini_service import gemini_service

class EISService:
    async def process_eis_file(self, file_content: bytes):
        """
        Parses EIS CSV/Text files and runs Multi-Layered Analysis.
        Looking for columns like: Freq, Re(Z), -Im(Z)
        """
        try:
            content_str = file_content.decode('utf-8', errors='ignore')
            
            # Improved Parsing Logic: Handle CSV, Tab, Whitespace
            df = None
            separators = [',', '\t', ';'] 
            
            # 1. Try Standard Delimiters
            for sep in separators:
                try:
                    temp_df = pd.read_csv(io.StringIO(content_str), sep=sep)
                    # If we got more than 1 column, likely correct
                    if len(temp_df.columns) > 1:
                        df = temp_df
                        break
                except:
                    continue
            
            # 2. Key Fallback: delim_whitespace=True (Matches your specific file format: "time/s    cycle...")
            if df is None or len(df.columns) <= 1:
                try:
                    df = pd.read_csv(io.StringIO(content_str), sep=r'\s+', engine='python')
                except:
                    pass
            
            if df is None or df.empty:
                 raise ValueError("Parsed dataframe is empty or invalid.")
                
            # Normalize Columns
            norm_cols = {c.lower().strip().replace('_','').replace('(','').replace(')',''): c for c in df.columns}
            
            # Find Freq
            freq_col = next((norm_cols[c] for c in norm_cols if any(x in c for x in ['freq', 'hz', 'f[Hz]'])), None)
            # Find Real Z
            real_col = next((norm_cols[c] for c in norm_cols if any(x in c for x in ['real', "z'", 'zreal', 'z_re', 're(z)'])), None)
            # Find Imag Z
            imag_col = next((norm_cols[c] for c in norm_cols if any(x in c for x in ['imag', "z''", 'zimag', 'z_im', 'im(z)', '-im(z)'])), None)
            
            # 2. Start Smart Mapping (Gemini) if simple regex fails
            if not (freq_col and real_col and imag_col):
                print("EIS: Regex detection failed. Attempting Gemini Smart Mapping...")
                try:
                    headers = list(df.columns)
                    sample = df.head(5).to_csv(index=False)
                    # Use specialized EIS mapper
                    mapping = await gemini_service.map_eis_columns(headers, sample)
                    
                    if mapping and "error" not in mapping:
                        # Apply mapped columns
                        if 'freq' in mapping and mapping['freq'] in df.columns:
                            freq_col = mapping['freq']
                        if 'real' in mapping and mapping['real'] in df.columns:
                            real_col = mapping['real']
                        if 'imag' in mapping and mapping['imag'] in df.columns:
                            imag_col = mapping['imag']
                            
                except Exception as map_err:
                    print(f"Smart Mapping Error: {map_err}")

            # Re-check cols (Post-Mapping logic to be added)
            # ...
            
            if not (freq_col and real_col and imag_col):
                 raise ValueError(f"Could not detect EIS columns (Frequency, Z-Real, Z-Imag). Found: {list(df.columns)}")
                
            # Sort by High Freq to Low Freq if needed, usually standard
            df = df.sort_values(by=freq_col, ascending=False)
            
            freq = df[freq_col].tolist()
            z_real = df[real_col].tolist()
            z_imag = df[imag_col].tolist()
            
            # Use Gemini 3 to diagnose the Multi-Layer physics
            diagnosis = await gemini_service.analyze_eis_spectrum(freq, z_real, z_imag)
            
            # Format Data for Recharts (Nyquist)
            nyquist_data = []
            for i in range(len(freq)):
                val_real = z_real[i]
                val_imag = z_imag[i]
                
                # Check for "already inverted" input
                # Standard Nyquist plots -Im(Z) on Y.
                # If input is raw Z'', it is usually negative.
                # We want a positive Y for capacitive loops.
                y_plot = -1 * val_imag if val_imag < 0 else val_imag
                
                nyquist_data.append({
                    "freq": freq[i],
                    "z_real": val_real,
                    "z_imag": val_imag,
                    "y_plot": y_plot 
                })

            # 3. SCIENTIFIC UPGRADE: ECM Fitting (Randles Circuit)
            ecm_result = None
            try:
                ecm_result = self.fit_randles_circuit(freq, z_real, z_imag)
            except Exception as ecm_err:
                print(f"ECM Fitting Failed: {ecm_err}")

            return {
                "dataset_type": "EIS",
                "metrics": {
                    "freq_range": f"{max(freq):.1e} - {min(freq):.1e} Hz",
                    "min_z_real": min(z_real),
                    "max_z_real": max(z_real)
                },
                "nyquist_data": nyquist_data,
                "ecm_fit": ecm_result,
                "analysis": diagnosis
            }

        except Exception as e:
            print(f"EIS Parsing Error: {e}")
            raise e

    def fit_randles_circuit(self, f_list, z_real_list, z_imag_list):
        """
        Fits a Randles Circuit with Warburg Element:
        Z = Rs + 1 / ( j*w*Cdl + 1/(Rct + sigma * w^-0.5 * (1-j)) )
        """
        from scipy.optimize import least_squares
        import numpy as np

        # Convert to numpy
        f = np.array(f_list)
        zr = np.array(z_real_list)
        zi = np.array(z_imag_list) # Raw Z'' (expected negative)
        omega = 2 * np.pi * f
        
        # Define Impedance Function (Vectorized)
        def randles_impedance(params, w):
            Rs, Rct, Cdl, sigma = params
            # Warburg Impedance: Zw = sigma * w^-0.5 * (1 - j)
            Zw = sigma * (w ** -0.5) * (1 - 1j)
            # Parallel Branch: Z_par = 1 / (1/(Rct + Zw) + j*w*Cdl)
            # Algebra: Z_par = (Rct + Zw) / (1 + j*w*Cdl*(Rct + Zw))
            Z_faradaic = Rct + Zw
            Z_par = Z_faradaic / (1 + 1j * w * Cdl * Z_faradaic)
            return Rs + Z_par

        # Define Residual Function
        def residuals(params):
            # Penalize negative parameters heavily
            if any(p < 0 for p in params): return 1e6
            
            Z_model = randles_impedance(params, omega)
            # Residual is distance in complex plane
            res_real = zr - Z_model.real
            res_imag = zi - Z_model.imag
            return np.concatenate([res_real, res_imag])

        # Initial Guesses (Heuristics)
        # Rs = Z_real at high freq (min real)
        rs_guess = min(zr)
        # Rct = Diameter of semi-circle (max real - min real)
        rct_guess = max(zr) - min(zr)
        # Cdl = 1 / (omega_peak * Rct) roughly, let's guess 1e-4 F
        cdl_guess = 1e-4
        # Sigma = Slope of low freq tail, guess 10.0
        sigma_guess = 10.0
        
        x0 = [rs_guess, rct_guess, cdl_guess, sigma_guess]
        bounds = ([0, 0, 0, 0], [np.inf, np.inf, np.inf, np.inf])

        # Optimize
        res = least_squares(residuals, x0, bounds=bounds)
        p_opt = res.x

        # Generate Fitted Curve for Plotting
        # Use finer mesh for smooth curve
        f_smooth = np.logspace(np.log10(min(f)), np.log10(max(f)), 50)
        w_smooth = 2 * np.pi * f_smooth
        Z_smooth = randles_impedance(p_opt, w_smooth)
        
        fit_data = []
        for i in range(len(f_smooth)):
            fit_data.append({
                "freq": float(f_smooth[i]),
                "z_real": float(Z_smooth[i].real),
                "z_imag": float(Z_smooth[i].imag),
                "y_plot": float(-1 * Z_smooth[i].imag) if float(Z_smooth[i].imag) < 0 else float(Z_smooth[i].imag)
                # Ensure we flip consistent with nyquist loop
            })
            
        return {
            "parameters": {
                "R_s (Ohmic)": float(p_opt[0]),
                "R_ct (Charge Transfer)": float(p_opt[1]),
                "C_dl (Double Layer)": float(p_opt[2]),
                "Sigma (Diffusion)": float(p_opt[3])
            },
            "fit_quality": float(res.cost), # Sum of squared residuals
            "fit_curve": fit_data
        }

eis_service = EISService()
