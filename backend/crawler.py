import asyncio
from crawl4ai import AsyncWebCrawler

async def get_markdown_from_url(url: str) -> str:
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url)
        return result.markdown
