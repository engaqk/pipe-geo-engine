from fastapi import FastAPI, HTTPException
import uuid
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from crawler import get_markdown_from_url
from auditor import analyze_with_llm

app = FastAPI(title="GEO Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    url: str

# In-memory simple task queue to handle long-running LLM inferences via Cloudflare
tasks_db = {}


@app.get("/")
async def root():
    return { "message": "GEO Engine API is running" }

@app.post("/audit")
async def perform_audit(request: AuditRequest):
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "processing"}

    async def _run_audit():
        try:
            url_to_crawl = request.url if request.url.startswith(('http://', 'https://')) else f"https://{request.url}"
            markdown = await get_markdown_from_url(url_to_crawl)
            if not markdown:
                tasks_db[task_id] = {"status": "error", "detail": "Failed to scrape the URL"}
                return
            
            report = await analyze_with_llm(markdown, "audit")
            tasks_db[task_id] = {"status": "completed", "result": report}
        except Exception as e:
            import traceback
            traceback.print_exc()
            tasks_db[task_id] = {"status": "error", "detail": str(e)}

    asyncio.create_task(_run_audit())
    return {"task_id": task_id, "status": "processing"}

@app.post("/generate")
async def generate_assets(request: AuditRequest):
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "processing"}

    async def _run_generate():
        try:
            url_to_crawl = request.url if request.url.startswith(('http://', 'https://')) else f"https://{request.url}"
            markdown = await get_markdown_from_url(url_to_crawl)
            if not markdown:
                tasks_db[task_id] = {"status": "error", "detail": "Failed to scrape the URL"}
                return
            
            assets = await analyze_with_llm(markdown, "generate")
            tasks_db[task_id] = {"status": "completed", "result": assets}
        except Exception as e:
            import traceback
            traceback.print_exc()
            tasks_db[task_id] = {"status": "error", "detail": str(e)}

    asyncio.create_task(_run_generate())
    return {"task_id": task_id, "status": "processing"}

@app.get("/status/{task_id}")
async def get_task_status(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks_db[task_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
