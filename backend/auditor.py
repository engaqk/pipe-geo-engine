import httpx
import json
import os
import logging

logger = logging.getLogger("geo-engine")

# Configuration from environment
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434/api/generate")
DEFAULT_MODEL = os.getenv("LLM_MODEL", "llama3")

async def analyze_with_llm(markdown_content: str, prompt_type: str):
    """
    Interacts with Ollama to analyze content.
    Returns a dictionary of analysis or assets.
    """
    prompts = {
        "audit": f"""
        Act as a Senior GEO (Generative Engine Optimization) Specialist. 
        Analyze the following markdown content and provide a scoring report (0-100) and analysis for the "Big 5" AI Engines:
        
        1. ChatGPT: Check for 'Entity' clarity and Q&A blocks.
        2. Grok: Analyze for 'Real-time X Sentiment' readiness.
        3. Gemini: Validate Schema.org JSON-LD potential.
        4. Claude: Check for context depth and logic flows.
        5. Perplexity: Verify citation-readiness and Markdown table usage.
        
        Content (truncated):
        {markdown_content[:6000]}
        
        Output ONLY a JSON object:
        {{
            "chatgpt": {{ "score": int, "analysis": "Detailed 2-sentence analysis" }},
            "grok": {{ "score": int, "analysis": "...", "snippets": ["viral tweet 1"] }},
            "gemini": {{ "score": int, "analysis": "...", "schema_suggestion": "type" }},
            "claude": {{ "score": int, "analysis": "..." }},
            "perplexity": {{ "score": int, "analysis": "..." }}
        }}
        """,
        "generate": f"""
        Act as an AI Visibility Engineer. Generate optimization assets:
        1. geo.txt: Instructions for LLMs.
        2. JSON-LD Schema: Optimized schema.
        3. Q&A Snippets: 10+ FAQ blocks.
        4. Comparison Table: Markdown table.
        
        Content:
        {markdown_content[:6000]}
        
        Output ONLY a JSON object with keys: "geo_txt", "json_ld", "qa_snippets", "comparison_table".
        """
    }

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            logger.info(f"Connecting to Ollama at {OLLAMA_URL}...")
            response = await client.post(OLLAMA_URL, json={
                "model": DEFAULT_MODEL,
                "prompt": prompts[prompt_type],
                "stream": False,
                "format": "json"
            })
            
            if response.status_code != 200:
                logger.error(f"Ollama returned status {response.status_code}")
                return {"error": f"Ollama error: {response.text}"}
                
            result = response.json()
            raw_response = result.get("response", "{}")
            
            try:
                # Attempt to parse the inner JSON string returned by Ollama
                return json.loads(raw_response)
            except json.JSONDecodeError:
                logger.error(f"Failed to decode inner JSON from Ollama: {raw_response[:200]}")
                # Fallback: maybe it's not double encoded?
                return result.get("response_json", {}) 
                
    except httpx.ConnectError:
        logger.error("Could not connect to Ollama. Is it running?")
        return {"error": "AI Engine Unreachable. Ensure Ollama is running."}
    except Exception as e:
        logger.exception("Unexpected error in LLM analysis:")
        return {"error": f"Analysis failed: {str(e)}"}
