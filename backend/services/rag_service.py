import json
import os
import google.generativeai as genai
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path

class GeminiEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __call__(self, input: list) -> list:
        # Batch embedding support
        # Note: 'models/text-embedding-004' supports batching indirectly or we loop
        embeddings = []
        for text in input:
            try:
                res = genai.embed_content(
                    model="models/text-embedding-004",
                    content=text,
                    task_type="retrieval_document"
                )
                embeddings.append(res['embedding'])
            except Exception as e:
                print(f"Embedding error: {e}")
                # Fallback to zero vector or skip (simple fallback for MVP)
                embeddings.append([0] * 768) 
        return embeddings

class RAGService:
    def __init__(self):
        self.kb_path = Path(__file__).parent.parent / "data" / "knowledge_base.json"
        
        # Persistent ChromaDB
        self.client = chromadb.PersistentClient(path="./chroma_db")
        
        # Use our custom Gemini Embedding function
        self.ef = GeminiEmbeddingFunction()
        
        self.collection = self.client.get_or_create_collection(
            name="battery_docs",
            embedding_function=self.ef
        )
        
        # Initial load if empty
        if self.collection.count() == 0:
            self._load_and_persist_knowledge_base()
        else:
            print(f"RAG Service Ready: {self.collection.count()} docs loaded in ChromaDB.")

    def _load_and_persist_knowledge_base(self):
        if not self.kb_path.exists():
            print("Knowledge base not found.")
            return

        with open(self.kb_path, 'r') as f:
            documents = json.load(f)
            
        print(f"Loading {len(documents)} docs into ChromaDB...")
        
        ids = [doc["id"] for doc in documents]
        texts = [doc["content"] for doc in documents]
        metadatas = [{"title": doc["title"]} for doc in documents]
        
        # Chroma/Gemini will handle embedding generation automatically via the `embedding_function`
        self.collection.add(
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
        print("Knowledge Base persisted to ChromaDB.")

    def add_documents(self, documents: list, metadatas: list, ids: list):
        """
        Public method to add new documents (e.g. from PDFs) to the vectordb.
        """
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Added {len(documents)} new documents to ChromaDB.")

    def search(self, query, top_k=2):
        try:
            # Chroma handles query embedding via the defined function
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k
            )
            
            # Format results for frontend
            formatted_results = []
            if results['ids']:
                for i in range(len(results['ids'][0])):
                    formatted_results.append({
                        "score": 1.0, # Chroma distance is not strictly cosine score 0-1, simplifying for UI
                        "title": results['metadatas'][0][i]['title'],
                        "content": results['documents'][0][i]
                    })
            
            return formatted_results
        except Exception as e:
            print(f"Search error: {e}")
            return []

rag_service = RAGService()
