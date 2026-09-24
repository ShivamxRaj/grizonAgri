"""
Grizon Agri — LangGraph Intent Router
Classifies farmer queries into specific agricultural task intents.
"""
import structlog
from app.agents.state import FarmState
from app.core.config import settings

logger = structlog.get_logger()

# Intent classification prompt
INTENT_SYSTEM_PROMPT = """You are an agricultural intent classifier for Indian farmers.
Given a query in Punjabi, Hindi, or English, classify it into EXACTLY ONE label from this list:

- MANDI: Market rates, mandi bhav, price per quintal, rate of wheat/paddy/cotton
- DISEASE: Plant leaf diseases, yellow rust, pests, insects, leaf spots, fungal damage
- WEATHER: Rain, temperature, wind, spray weather forecast
- SCHEME: Government schemes, PM Kisan, PMFBY, subsidy, MSP
- IRRIGATION: Watering schedules, tubewell, irrigation timing
- SOIL: Soil test, NPK fertilizer, urea dosage
- CROP_ADVISORY: General crop selection, sowing, harvesting guidance
- GREETING: Hello, hi, hyy, namaste, sat sri akal, good morning, greetings
- GENERAL: Other general questions

Respond with ONLY the single label word (e.g. MANDI).

Examples:
- "What is wheat rate in Ludhiana mandi?" → MANDI
- "ਗੇਹੂ ਦਾ ਮੰਡੀ ਭਾਅ ਕੀ ਹੈ?" → MANDI
- "ਕਣਕ ਤੇ ਪੀਲਾ ਤੇਲਾ ਲੱਗ ਗਿਆ" → DISEASE
- "Is today good weather for spraying?" → WEATHER
- "hyy" → GREETING
- "namaste" → GREETING
- "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ" → GREETING
"""


async def route_intent(state: FarmState) -> FarmState:
    """
    LangGraph Node: Classify farmer query into an agricultural intent.
    Uses dual-LLM (Groq primary + DeepSeek failover) for fast classification with keyword fallback.
    """
    query = state.get("user_query", "")
    logger.info("routing_intent", query=query[:100])

    # First check exact keyword matches for high precision
    keyword_intent = _keyword_fallback(query)

    has_groq = settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here"
    has_deepseek = bool(settings.DEEPSEEK_API_KEY)
    if not has_groq and not has_deepseek:
        state["intent"] = keyword_intent
        return state

    try:
        from app.services.llm import generate_llm_response
        raw_response = await generate_llm_response(
            prompt=query,
            system_prompt=INTENT_SYSTEM_PROMPT,
            primary_provider="groq",
            temperature=0,
            max_tokens=15
        )

        if raw_response:
            raw_text = raw_response.strip().upper()
            valid_intents = ["MANDI", "DISEASE", "WEATHER", "SCHEME", "IRRIGATION", "SOIL", "CROP_ADVISORY", "GREETING", "GENERAL"]
            detected_intent = "GENERAL"

            for v in valid_intents:
                if v in raw_text:
                    detected_intent = v
                    break

            if detected_intent == "GENERAL" and keyword_intent != "GENERAL":
                detected_intent = keyword_intent

            logger.info("intent_classified", intent=detected_intent, raw_response=raw_text)
            state["intent"] = detected_intent
        else:
            state["intent"] = keyword_intent

    except Exception as e:
        logger.error("intent_classification_error", error=str(e))
        state["intent"] = keyword_intent

    return state


def _keyword_fallback(query: str) -> str:
    """Keyword-based intent detection."""
    q = query.lower().strip()

    greeting_keywords = [
        "hyy", "hy", "hii", "hi", "hello", "hey", "heyy", "namaste", "नमस्ते", 
        "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ", "sat sri akal", "sat shri akal", "ssa", 
        "good morning", "good afternoon", "good evening", "good night", "greetings", 
        "ram ram", "ਰਾਮ ਰਾਮ", "राम राम", "pranam", "ਪ੍ਰਣਾਮ", "प्रणाम"
    ]
    mandi_keywords = ["ਮੰਡੀ", "ਭਾਅ", "ਕੀਮਤ", "ਵੇਚ", "ਮੰਡੀ", "मंडी", "भाव", "दाम", "mandi", "price", "rate", "sell", "apmc", "quintal"]
    disease_keywords = ["ਬੀਮਾਰੀ", "ਪੀਲਾ", "ਤੇਲਾ", "ਕੀੜਾ", "ਧੱਬੇ", "ਕੁੰਗੀ", "रोग", "कीड़ा", "रतुआ", "disease", "pest", "yellow", "spots", "insect", "rust", "fungus"]
    weather_keywords = ["ਮੌਸਮ", "ਮੀਂਹ", "ਬਰਸਾਤ", "ਤਾਪਮਾਨ", "ਸਪਰੇਅ", "मौसम", "बारिश", "spray", "weather", "rain", "forecast", "wind"]
    scheme_keywords = ["ਸਕੀਮ", "ਸਬਸਿਡੀ", "PM", "ਕਿਸ਼ਤ", "योजना", "सब्सिडी", "scheme", "subsidy", "kisan", "pmfby"]
    irrigation_keywords = ["ਸਿੰਚਾਈ", "ਪਾਣੀ", "सिंचाई", "पानी", "irrigat", "water"]
    soil_keywords = ["ਮਿੱਟੀ", "ਸੋਇਲ", "ਮਿੱਟੀ", "मिट्टी", "soil", "npk", "ph", "urea", "dap", "ਖਾਦ", "खाद"]

    for kw in mandi_keywords:
        if kw in q:
            return "MANDI"
    for kw in disease_keywords:
        if kw in q:
            return "DISEASE"
    for kw in weather_keywords:
        if kw in q:
            return "WEATHER"
    for kw in scheme_keywords:
        if kw in q:
            return "SCHEME"
    for kw in irrigation_keywords:
        if kw in q:
            return "IRRIGATION"
    for kw in soil_keywords:
        if kw in q:
            return "SOIL"

    # Check greeting match
    words = q.split()
    if any(g == q for g in greeting_keywords) or (len(words) <= 4 and any(g in words or q.startswith(g) for g in greeting_keywords)):
        return "GREETING"

    return "GENERAL"
