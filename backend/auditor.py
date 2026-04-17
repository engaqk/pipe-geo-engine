import httpx
import json

OLLAMA_URL = "http://ollama:11434/api/generate"

async def analyze_with_llm(markdown_content: str, prompt_type: str):
    prompts = {
        "audit": f"""
        Act as a Senior GEO (Generative Engine Optimization) Specialist. 
        Analyze the following markdown content and provide a scoring report (0-100) and analysis for the "Big 5" AI Engines:
        
        1. ChatGPT: Check for 'Entity' clarity and Q&A blocks. Is the 'About' section written in a way that defines the 'Entity' clearly for a knowledge graph?
        2. Grok: Analyze for 'Real-time X Sentiment'. Search for 'X-factor' keywords—short, punchy, and controversial enough for X sentiment analysis. Generate a 'Viral X Sentiment' score and tweet-ready snippets.
        3. Gemini: Validate Schema.org JSON-LD presence and Knowledge Graph compatibility. Check for Google-friendly Organization Schema.
        4. Claude: Check for context depth, technical documentation quality, and clear logic flows.
        5. Perplexity: Verify citation-readiness. Analyze if data is structured in Markdown tables. Perplexity extracts these first.
        
        Content:
        {markdown_content[:4000]}
        
        Output only a JSON object with this structure:
        {{
            "chatgpt": {{ "score": int, "analysis": str }},
            "grok": {{ "score": int, "analysis": str, "snippets": [str] }},
            "gemini": {{ "score": int, "analysis": str, "schema_suggestion": str }},
            "claude": {{ "score": int, "analysis": str }},
            "perplexity": {{ "score": int, "analysis": str }}
        }}
        """,
        "generate": f"""
        Act as an AI Visibility Engineer. Generate optimization assets for the following content:
        
        1. geo.txt: The new standard for AI instructions.
        2. JSON-LD Schema: Optimized Organization/Product schema.
        3. Q&A Snippets: 15+ concise Q&A blocks (under 40 words each) for Perplexity/ChatGPT.
        4. Comparison Table: A Markdown table comparing the business to generic competitors.
        
        Content:
        {markdown_content[:4000]}
        
        Output only a JSON object with keys: "geo_txt", "json_ld", "qa_snippets", "comparison_table".
        """
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OLLAMA_URL, json={
            "model": "llama3",
            "prompt": prompts[prompt_type],
            "stream": False,
            "format": "json"
        })
        result = response.json()
        return json.loads(result.get("response", "{}"))
