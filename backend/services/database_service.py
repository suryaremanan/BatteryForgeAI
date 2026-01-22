
import sqlite3
import json
import os
from datetime import datetime

DB_NAME = "battery_forge.db"

class DatabaseService:
    def __init__(self, db_name=DB_NAME):
        self.db_name = db_name
        self.init_db()

    def get_connection(self):
        return sqlite3.connect(self.db_name)

    def init_db(self):
        """Initialize the database schema."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Analysis History Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                dataset_type TEXT,
                metrics JSON,
                summary TEXT,
                plot_data TEXT,
                file_path TEXT
            )
        ''')
        
        # Migration for existing DBs (Idempotent)
        try:
            cursor.execute('ALTER TABLE analysis_history ADD COLUMN file_path TEXT')
        except sqlite3.OperationalError:
            pass # Column likely already exists
        
        conn.commit()
        conn.close()

    def save_record(self, filename: str, dataset_type: str, metrics: dict, summary: str, plot_data: str = None, file_path: str = None):
        """Saves a new analysis record."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        metrics_json = json.dumps(metrics) if metrics else None
        
        cursor.execute('''
            INSERT INTO analysis_history (filename, dataset_type, metrics, summary, plot_data, file_path)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (filename, dataset_type, metrics_json, summary, plot_data, file_path))
        
        record_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return record_id

    def get_history(self, limit: int = 50):
        """Retrieves recent analysis history."""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row # Access columns by name
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, filename, upload_time, dataset_type, metrics, summary, file_path 
            FROM analysis_history 
            ORDER BY upload_time DESC 
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        
        history = []
        for row in rows:
            history.append({
                "id": row["id"],
                "filename": row["filename"],
                "upload_time": row["upload_time"],
                "dataset_type": row["dataset_type"],
                "metrics": json.loads(row["metrics"]) if row["metrics"] else None,
                "summary": row["summary"],
                "file_path": row["file_path"]
            })
            
        conn.close()
        return history

    def get_files_by_ids(self, ids: list):
        """Retrieves file paths for specific IDs."""
        if not ids: return []
        
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Safe parameterized IN clause
        placeholders = ','.join('?' for _ in ids)
        query = f'SELECT file_path FROM analysis_history WHERE id IN ({placeholders})'
        
        cursor.execute(query, ids)
        rows = cursor.fetchall()
        
        paths = [row['file_path'] for row in rows if row['file_path']]
        conn.close()
        return paths

database_service = DatabaseService()
