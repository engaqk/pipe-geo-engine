import logging
import uuid
import asyncio
import os
import time
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from crawler import get_markdown_from_url
from auditor import analyze_with_llm

# Load environment variables
load_dotenv()

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("geo-engine")

app = FastAPI(
    title="GEO Engine API",
    description="Production-ready API for Generative Engine Optimization Auditing",
    version="1.1.0"
)

# CORS Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    url: str

# Task Database with timestamps for cleanup
tasks_db: Dict[str, Dict[str, Any]] = {}

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing GEO Engine API...")
    # Start background cleanup task
    asyncio.create_task(cleanup_tasks())

async def cleanup_tasks():
    """Periodically remove old tasks from memory (older than 1 hour)"""
    while True:
        await asyncio.sleep(600)  # Check every 10 minutes
        now = time.time()
        expired_ids = [
            tid for tid, task in tasks_db.items() 
            if now - task.get("created_at", 0) > 3600
        ]
        for tid in expired_ids:
            del tasks_db[tid]
        if expired_ids:
            logger.info(f"Cleaned up {len(expired_ids)} expired tasks from memory.")

@app.api_route("/health", methods=["GET", "HEAD"])
@app.get("/")
async def health_check():
    return {
        "status": "online",
        "version": "1.1.0",
        "tasks_in_memory": len(tasks_db)
    }

async def process_task(task_id: str, url: str, mode: str):
    tasks_db[task_id]["created_at"] = time.time()
    try:
        logger.info(f"Task {task_id}: Starting {mode} for {url}")
        
        # Sanitize URL
        clean_url = url if url.startswith(('http://', 'https://')) else f"https://{url}"
        
        # 1. Crawl
        logger.info(f"Task {task_id}: Scraping {clean_url}...")
        markdown = await get_markdown_from_url(clean_url)
        
        if not markdown:
            logger.error(f"Task {task_id}: Scraping failed.")
            tasks_db[task_id].update({"status": "error", "detail": "Unable to access the website. Please check the URL."})
            return

        # 2. Analyze
        logger.info(f"Task {task_id}: Sending to AI ({mode})...")
        result = await analyze_with_llm(markdown, mode)
        
        # 3. Store
        tasks_db[task_id].update({
            "status": "completed",
            "result": result,
            "completed_at": time.time()
        })
        logger.info(f"Task {task_id}: Successfully completed.")
        
    except Exception as e:
        logger.exception(f"Task {task_id} failed:")
        tasks_db[task_id].update({"status": "error", "detail": str(e)})

@app.post("/audit")
async def perform_audit(request: AuditRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "processing", "created_at": time.time()}
    background_tasks.add_task(process_task, task_id, request.url, "audit")
    return {"task_id": task_id, "status": "processing"}

@app.post("/generate")
async def generate_assets(request: AuditRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "processing", "created_at": time.time()}
    background_tasks.add_task(process_task, task_id, request.url, "generate")
    return {"task_id": task_id, "status": "processing"}

@app.get("/status/{task_id}")
async def get_task_status(task_id: str):
    if task_id not in tasks_db:
        logger.warning(f"Status check for non-existent task: {task_id}")
        raise HTTPException(status_code=404, detail="Task not found or expired.")
    return tasks_db[task_id]

if __name__ == "__main__":
    import uvicorn
    # In production, this might be handled by Gunicorn/Uvicorn workers
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
