"""
PDF Document Ingestion Service for RAG Knowledge Base

Parses battery manuals, datasheets, and technical documents into ChromaDB
for intelligent Q&A via the chat agent.
"""

import os
import io
from pathlib import Path
from typing import List, Dict
import google.generativeai as genai
import hashlib
from datetime import datetime

class PDFIngestionService:
    def __init__(self):
        """Initialize PDF ingestion service"""
        self.upload_dir = Path(__file__).parent.parent / "uploads" / "manuals"
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
    def extract_text_from_pdf(self, pdf_bytes: bytes, filename: str) -> str:
        """
        Extract text from PDF using PyPDF2
        
        Args:
            pdf_bytes: PDF file content
            filename: Original filename
            
        Returns:
            str: Extracted text content
        """
        try:
            # Try PyPDF2 first
            import PyPDF2
            
            pdf_file = io.BytesIO(pdf_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_content = []
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    text = page.extract_text()
                    if text.strip():
                        text_content.append(f"--- Page {page_num + 1} ---\n{text}")
                except Exception as e:
                    print(f"Error extracting page {page_num + 1}: {e}")
                    continue
            
            return "\n\n".join(text_content)
            
        except ImportError:
            # Fallback: Use Gemini Vision to read PDF
            return self._extract_with_gemini(pdf_bytes, filename)
        except Exception as e:
            print(f"PyPDF2 extraction failed: {e}, trying Gemini...")
            return self._extract_with_gemini(pdf_bytes, filename)
    
    def _extract_with_gemini(self, pdf_bytes: bytes, filename: str) -> str:
        """
        Fallback: Use Gemini 3 to read PDF (multimodal)
        """
        try:
            model = genai.GenerativeModel('gemini-3-pro-preview')
            
            prompt = """
            Extract ALL text content from this technical document.
            Preserve headings, sections, tables, and technical specifications.
            Return the full text in a structured format.
            """
            
            response = model.generate_content([
                prompt,
                {"mime_type": "application/pdf", "data": pdf_bytes}
            ])
            
            return response.text
            
        except Exception as e:
            raise Exception(f"Failed to extract PDF content: {e}")
    
    def chunk_document(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """
        Split document into overlapping chunks for better retrieval
        
        Args:
            text: Full document text
            chunk_size: Target characters per chunk
            overlap: Overlap between chunks
            
        Returns:
            List of text chunks
        """
        if not text or len(text) < chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            # Find chunk end (prefer sentence boundaries)
            end = start + chunk_size
            
            if end < len(text):
                # Look for sentence end within next 100 chars
                sentence_end = text.find('. ', end, end + 100)
                if sentence_end != -1:
                    end = sentence_end + 1
            else:
                end = len(text)
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start with overlap
            start = end - overlap
            
            # Avoid infinite loops
            if start >= end:
                start = end
        
        return chunks
    
    def generate_metadata_with_gemini(self, text_sample: str, filename: str) -> Dict:
        """
        Use Gemini to extract metadata from document
        
        Args:
            text_sample: First 2000 chars of document
            filename: Original filename
            
        Returns:
            dict with extracted metadata
        """
        try:
            model = genai.GenerativeModel('gemini-3-flash-preview')
            
            prompt = f"""
            Analyze this technical document excerpt and extract metadata.
            
            Filename: {filename}
            Text Sample:
            {text_sample[:2000]}
            
            Return JSON with:
            {{
                "document_type": "Battery Manual|Datasheet|Safety Standard|Research Paper|Technical Guide",
                "title": "Extracted document title",
                "manufacturer": "Company name if applicable or 'Unknown'",
                "battery_chemistry": "NMC|LFP|LCO|NCA|Unknown",
                "topics": ["topic1", "topic2"],  // Max 5 key topics
                "summary": "One sentence summary"
            }}
            """
            
            response = model.generate_content(prompt)
            
            # Extract JSON
            import json
            result_text = response.text
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            metadata = json.loads(result_text)
            return metadata
            
        except Exception as e:
            print(f"Metadata extraction failed: {e}")
            return {
                "document_type": "Unknown",
                "title": filename,
                "manufacturer": "Unknown",
                "battery_chemistry": "Unknown",
                "topics": [],
                "summary": "No summary available"
            }
    
    async def ingest_pdf(self, pdf_bytes: bytes, filename: str) -> Dict:
        """
        Complete PDF ingestion pipeline
        
        Args:
            pdf_bytes: PDF file content
            filename: Original filename
            
        Returns:
            dict with ingestion results
        """
        try:
            # 1. Extract text
            print(f"Extracting text from {filename}...")
            full_text = self.extract_text_from_pdf(pdf_bytes, filename)
            
            if not full_text or len(full_text) < 50:
                raise Exception("Insufficient text content extracted")
            
            # 2. Generate metadata
            print(f"Generating metadata...")
            metadata = self.generate_metadata_with_gemini(full_text, filename)
            
            # 3. Chunk document
            print(f"Chunking document...")
            chunks = self.chunk_document(full_text, chunk_size=1000, overlap=200)
            
            # 4. Add to RAG service
            from services.rag_service import rag_service
            
            # Generate unique IDs
            file_hash = hashlib.md5(pdf_bytes).hexdigest()[:8]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            doc_ids = [f"{file_hash}_{timestamp}_chunk_{i}" for i in range(len(chunks))]
            
            # Metadata for each chunk
            chunk_metadatas = []
            for i in range(len(chunks)):
                chunk_meta = {
                    "title": metadata.get("title", filename),
                    "filename": filename,
                    "document_type": metadata.get("document_type", "Unknown"),
                    "manufacturer": metadata.get("manufacturer", "Unknown"),
                    "battery_chemistry": metadata.get("battery_chemistry", "Unknown"),
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "upload_date": timestamp
                }
                chunk_metadatas.append(chunk_meta)
            
            # Add to ChromaDB
            print(f"Adding {len(chunks)} chunks to vector database...")
            rag_service.add_documents(
                documents=chunks,
                metadatas=chunk_metadatas,
                ids=doc_ids
            )
            
            # Save original PDF
            pdf_path = self.upload_dir / f"{file_hash}_{filename}"
            with open(pdf_path, 'wb') as f:
                f.write(pdf_bytes)
            
            return {
                "success": True,
                "filename": filename,
                "chunks_created": len(chunks),
                "total_characters": len(full_text),
                "metadata": metadata,
                "file_id": file_hash
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "filename": filename
            }
    
    def list_ingested_documents(self) -> List[Dict]:
        """
        List all ingested documents from ChromaDB
        
        Returns:
            List of document metadata
        """
        try:
            from services.rag_service import rag_service
            
            # Get all documents from collection
            results = rag_service.collection.get()
            
            # Group by filename and deduplicate
            docs_by_file = {}
            for i, metadata in enumerate(results['metadatas']):
                filename = metadata.get('filename', metadata.get('title', 'Unknown'))
                
                if filename not in docs_by_file:
                    docs_by_file[filename] = {
                        "filename": filename,
                        "title": metadata.get('title', filename),
                        "document_type": metadata.get('document_type', 'Unknown'),
                        "manufacturer": metadata.get('manufacturer', 'Unknown'),
                        "battery_chemistry": metadata.get('battery_chemistry', 'Unknown'),
                        "chunks": 1,
                        "upload_date": metadata.get('upload_date', 'Unknown')
                    }
                else:
                    docs_by_file[filename]['chunks'] += 1
            
            return list(docs_by_file.values())
            
        except Exception as e:
            print(f"Error listing documents: {e}")
            return []


# Singleton instance
pdf_ingestion_service = PDFIngestionService()
