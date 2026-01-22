
import os
import shutil
import uuid
from fastapi import UploadFile

UPLOAD_DIR = "uploads"

class StorageService:
    def __init__(self, upload_dir=UPLOAD_DIR):
        self.upload_dir = upload_dir
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)

    async def save_file(self, file: UploadFile) -> str:
        """
        Saves an uploaded file to disk with a unique name.
        Returns the relative path.
        """
        extension = os.path.splitext(file.filename)[1]
        unique_name = f"{uuid.uuid4()}{extension}"
        file_path = os.path.join(self.upload_dir, unique_name)
        
        # Reset file pointer to beginning just in case
        await file.seek(0)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Reset again for subsequent reads by other services
        await file.seek(0)
        
        return file_path

    def get_file_path(self, relative_path: str) -> str:
        return os.path.abspath(relative_path)

storage_service = StorageService()
