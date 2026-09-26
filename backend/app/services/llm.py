"""
Grizon Agri — Unified Multi-LLM Service (DeepSeek + Groq)
Provides transparent fallback and failover between DeepSeek and Groq models.
"""
import structlog
import httpx
from typing import Optional
from app.core.config import settings

logger = structlog.get_logger()


async def call_deepseek(
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.3,
    max_tokens: int = 500
) -> Optional[str]:
    """Call DeepSeek chat API directly via HTTP."""
    if not settings.DEEPSEEK_API_KEY:
        return None

    try:
        url = "https://api.deepseek.com/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}"
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": settings.DEEPSEEK_MODEL or "deepseek-chat",
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                logger.info("deepseek_llm_success", tokens=data.get("usage", {}).get("total_tokens", 0))
                return content
            else:
                logger.warning("deepseek_llm_http_error", status_code=resp.status_code, body=resp.text[:200])
    except Exception as e:
        logger.warning("deepseek_llm_error", error=str(e))

    return None


async def call_groq(
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.3,
    max_tokens: int = 500
) -> Optional[str]:
    """Call Groq chat API directly via HTTP with valid model names."""
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your_groq_api_key_here":
        return None

    models_to_try = [
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
    ]
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.GROQ_API_KEY}"
    }

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    for model in models_to_try:
        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    logger.info("groq_llm_success", model=model)
                    return content
                else:
                    logger.warning("groq_llm_http_error", model=model, status_code=resp.status_code, body=resp.text[:200])
        except Exception as e:
            logger.warning("groq_llm_error", model=model, error=str(e))

    return None


async def generate_llm_response(
    prompt: str,
    system_prompt: str = "",
    primary_provider: str = "deepseek",
    temperature: float = 0.3,
    max_tokens: int = 500
) -> Optional[str]:
    """
    Generate response with primary provider and instant failover to secondary provider.
    - primary_provider: 'deepseek' or 'groq'
    """
    first_func, second_func = (
        (call_deepseek, call_groq) if primary_provider == "deepseek" else (call_groq, call_deepseek)
    )

    # Primary Provider Attempt
    result = await first_func(prompt, system_prompt, temperature, max_tokens)
    if result:
        return result

    # Secondary Provider Failover Attempt
    logger.info("llm_failover_trigger", primary=primary_provider, switching_to="secondary")
    result = await second_func(prompt, system_prompt, temperature, max_tokens)
    if result:
        return result

    logger.error("all_llm_providers_failed")
    return None
