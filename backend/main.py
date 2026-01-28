from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from api.routes import router as api_router
from api.pcb_routes import router as pcb_router

load_dotenv()

app = FastAPI(title="BatteryForge AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(pcb_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "BatteryForge AI Backend is running", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
