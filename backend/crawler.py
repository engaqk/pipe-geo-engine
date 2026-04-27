import asyncio
import logging
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

logger = logging.getLogger("geo-engine")

async def get_markdown_from_url(url: str) -> str:
    """
    Scrapes a website and returns its markdown content.
    Uses modern browser fingerprints to bypass basic bot detection.
    """
    browser_config = BrowserConfig(
        headless=True,
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
    )
    
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        word_count_threshold=10,
        wait_for="body",
        page_timeout=60000, # 60 seconds
    )

    try:
        async with AsyncWebCrawler(config=browser_config) as crawler:
            logger.info(f"Crawling {url}...")
            result = await crawler.arun(url=url, config=run_config)
            
            if not result.success:
                logger.error(f"Crawl failed: {result.error_message}")
                return ""
            
            return result.markdown
    except Exception as e:
        logger.exception(f"Unexpected error during crawl: {str(e)}")
        return ""
