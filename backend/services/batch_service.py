
import asyncio
from fastapi import UploadFile
from typing import List, Dict
from services.charging_service import charging_service
from services.database_service import database_service
from services.storage_service import storage_service

class BatchService:
    async def process_batch(self, files: List[UploadFile]) -> Dict:
        """
        Processes multiple files.
        Returns aggregate summary.
        """
        results = []
        errors = []
        
        # We can run these in parallel using asyncio.gather if needed,
        # but for safety/memory, we'll do sequential for now or limited concurrency.
        for file in files:
            try:
                # 0. Save to Disk (for History/Comparison)
                file_path = await storage_service.save_file(file)

                # Read content
                contents = await file.read()
                filename = file.filename
                
                # 1. Analyze (Universal)
                df, metadata = await charging_service.process_universal_file(contents)
                
                # 2. Metrics (Conditional)
                metrics = None
                if metadata.get('is_standard_cycling', False) or metadata.get('dataset_type') == 'Cycling':
                    try:
                        df_std = await charging_service.parse_cycling_data(contents)
                        metrics = charging_service.calculate_metrics(df_std)
                    except:
                        pass
                
                # 3. Save to DB
                record_id = database_service.save_record(
                    filename=filename,
                    dataset_type=metadata.get('dataset_type', 'Unknown'),
                    metrics=metrics,
                    summary=metadata.get('summary', 'No summary.'),
                    file_path=file_path
                )
                
                results.append({
                    "id": record_id,
                    "filename": filename,
                    "status": "success",
                    "type": metadata.get('dataset_type'),
                    "metrics": metrics
                })
                
            except Exception as e:
                errors.append({
                    "filename": file.filename,
                    "status": "error",
                    "error": str(e)
                })
                
        return {
            "total_files": len(files),
            "processed": len(results),
            "failed": len(errors),
            "results": results,
            "errors": errors
        }

batch_service = BatchService()
