import asyncio
from crawl4ai import WebCrawler

async def get_markdown_from_url(url: str) -> str:
    async with WebCrawler() as crawler:
        result = await crawler.arun(url=url)
        return result.markdown
