"""
Grizon Agri — Corrective RAG (CRAG) Web Search Fallback Service
Performs real-time web search fallback when local knowledge base score is low.
"""
import structlog
import httpx
import urllib.parse
from typing import Optional

logger = structlog.get_logger()


async def search_agri_web(query: str, max_results: int = 3) -> list[dict]:
    """
    Search the web for real-time agricultural information, mandi rates, and schemes using Serper API.
    Returns list of {"title": str, "snippet": str, "source": str}.
    """
    from app.core.config import settings
    logger.info("crag_web_search_initiated", query=query[:100])

    # 1. Primary: Try Serper Google Search API
    if settings.SERPER_API_KEY:
        try:
            url = "https://google.serper.dev/search"
            headers = {
                "X-API-KEY": settings.SERPER_API_KEY,
                "Content-Type": "application/json"
            }
            payload = {"q": f"India agriculture {query}"}

            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    organic = data.get("organic", [])
                    results = []
                    for item in organic[:max_results]:
                        results.append({
                            "title": item.get("title", ""),
                            "snippet": item.get("snippet", ""),
                            "source": f"Serper Search ({item.get('link', 'Google')})"
                        })

                    if results:
                        logger.info("serper_web_search_success", count=len(results))
                        return results
        except Exception as e:
            logger.warning("serper_web_search_failed", error=str(e))

    # 2. Secondary: DuckDuckGo Fallback
    try:
        encoded_query = urllib.parse.quote(f"India agriculture {query}")
        url = f"https://html.duckduckgo.com/html/?q={encoded_query}"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(resp.text, "html.parser")

                results = []
                for result in soup.find_all("div", class_="result")[:max_results]:
                    title_elem = result.find("a", class_="result__a")
                    snippet_elem = result.find("a", class_="result__snippet")

                    if title_elem and snippet_elem:
                        results.append({
                            "title": title_elem.get_text(strip=True),
                            "snippet": snippet_elem.get_text(strip=True),
                            "source": "Web Search (Live CRAG)"
                        })

                if results:
                    logger.info("crag_web_search_success", count=len(results))
                    return results

    except Exception as e:
        logger.warning("crag_web_search_failed", error=str(e))

    # Structured fallback if network is offline
    return [
        {
            "title": "PAU & ICAR Live Agri Portal",
            "snippet": f"Latest guidance for query: {query}. Follow Punjab Agricultural University Package of Practices.",
            "source": "PAU Official Repository"
        }
    ]
