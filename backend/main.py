from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .crawler import get_markdown_from_url
from .auditor import analyze_with_llm

app = FastAPI(title="GEO Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    url: str

@app.get("/")
async def root():
    return { "message": "GEO Engine API is running" }

@app.post("/audit")
async def perform_audit(request: AuditRequest):
    try:
        markdown = await get_markdown_from_url(request.url)
        if not markdown:
            raise HTTPException(status_code=400, detail="Failed to scrape the URL")
        
        report = await analyze_with_llm(markdown, "audit")
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_assets(request: AuditRequest):
    try:
        markdown = await get_markdown_from_url(request.url)
        if not markdown:
            raise HTTPException(status_code=400, detail="Failed to scrape the URL")
        
        assets = await analyze_with_llm(markdown, "generate")
        return assets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
