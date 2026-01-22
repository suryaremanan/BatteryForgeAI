import os
import sys
from pathlib import Path
from pypdf import PdfReader
import uuid

# Add parent dir to path to import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.rag_service import rag_service

PDF_DIR = Path(__file__).parent.parent / "data" / "pdfs"

def ingest_pdfs():
    if not PDF_DIR.exists():
        print(f"Directory {PDF_DIR} does not exist.")
        return

    pdf_files = list(PDF_DIR.glob("*.pdf"))
    if not pdf_files:
        print("No PDF files found in backend/data/pdfs/")
        return

    print(f"Found {len(pdf_files)} PDFs. Processing...")

    new_docs = []
    new_metas = []
    new_ids = []

    for pdf_path in pdf_files:
        print(f"Reading {pdf_path.name}...")
        try:
            reader = PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            # Simple chunking strategy: 1000 characters with 100 overlap
            # For hackathon this is sufficient. 
            chunk_size = 1000
            overlap = 100
            
            start = 0
            while start < len(text):
                end = start + chunk_size
                chunk = text[start:end]
                
                # Metadata
                new_docs.append(chunk)
                new_metas.append({"title": f"{pdf_path.name} - Chunk {start//chunk_size}", "source": pdf_path.name})
                new_ids.append(str(uuid.uuid4()))
                
                start += (chunk_size - overlap)
                
        except Exception as e:
            print(f"Error processing {pdf_path.name}: {e}")

    if new_docs:
        print(f"Ingesting {len(new_docs)} chunks into RAG Service...")
        rag_service.add_documents(new_docs, new_metas, new_ids)
        print("Done!")
    else:
        print("No text extracted.")

if __name__ == "__main__":
    ingest_pdfs()
