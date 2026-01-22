from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    image_data: Optional[str] = None # Base64 string if needed, or handle file upload in separate endpoint
