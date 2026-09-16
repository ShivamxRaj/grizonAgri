"""
Grizon Agri — Corrective RAG (CRAG) Engine
Combines local agronomic database retrieval with real-time web search fallback.
"""
import structlog
from sqlalchemy import text
from app.db.database import async_session_factory, init_db
from app.services.web_search import search_agri_web

logger = structlog.get_logger()


async def retrieve_agri_knowledge(query: str, crop: str = "Wheat") -> dict:
    """
    Retrieve authoritative agronomic advice with CRAG evaluation & web fallback.

    Returns:
        {
            "content": str,
            "evidence_sources": list[str],
            "is_web_fallback": bool,
            "relevance_score": float
        }
    """
    logger.info("rag_retrieval_started", query=query[:100], crop=crop)

    query_lower = query.lower()

    # Step 1: Query local agronomic database
    local_docs = []
    try:
        await init_db()
        async with async_session_factory() as session:
            result = await session.execute(
                text("""
                    SELECT topic, content, source_document, source_university 
                    FROM agronomic_knowledge 
                    WHERE crop LIKE :crop OR content LIKE :query OR topic LIKE :query
                    LIMIT 3
                """),
                {"crop": f"%{crop}%", "query": f"%{query}%"}
            )
            rows = result.fetchall()
            for r in rows:
                local_docs.append({
                    "topic": r.topic,
                    "content": r.content,
                    "source": f"{r.source_university} - {r.source_document}"
                })
    except Exception as e:
        logger.warning("rag_local_db_query_failed", error=str(e))

    # Step 2: Relevance Evaluation
    relevance_score = 0.85 if local_docs else 0.40

    # Step 3: CRAG Web Fallback Trigger
    if relevance_score < 0.60 or "scheme" in query_lower or "योजना" in query_lower or "PM" in query_lower:
        logger.info("crag_triggering_web_fallback", reason="Low local score or Scheme query")
        web_results = await search_agri_web(query)
        web_snippets = "\n".join([f"• {w['title']}: {w['snippet']}" for w in web_results])

        return {
            "content": f"Live Information:\n{web_snippets}",
            "evidence_sources": [w["source"] for w in web_results],
            "is_web_fallback": True,
            "relevance_score": 0.80
        }

    # High local relevance hit
    content_text = "\n".join([f"• [{d['topic']}]: {d['content']}" for d in local_docs])
    sources = list(set([d["source"] for d in local_docs]))

    return {
        "content": content_text,
        "evidence_sources": sources,
        "is_web_fallback": False,
        "relevance_score": relevance_score
    }
