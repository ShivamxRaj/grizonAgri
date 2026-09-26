"""
Grizon Agri — Chat API Routes
Processes farmer voice/text queries through intent classification and verification guardrails.
"""
import structlog
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.agents.router import route_intent
from app.agents.verification import verify_recommendation
from app.agents.state import FarmState
from app.db.database import save_chat_message
from app.core.config import settings

logger = structlog.get_logger()
router = APIRouter()


from datetime import datetime


class ChatRequest(BaseModel):
    """Incoming chat request from farmer."""
    farmer_id: str = "pb-farmer-101"
    farmer_name: Optional[str] = None
    query: str
    language: str = "pa-IN"
    crop: Optional[str] = "Wheat"
    district: Optional[str] = "Ludhiana"
    image_url: Optional[str] = None


class StructuredCard(BaseModel):
    severity: str = "medium"  # 'high', 'medium', 'info'
    title: str
    bullets: list[str]
    dosage: Optional[str] = None


class ChatResponse(BaseModel):
    """Structured response back to farmer."""
    response_text: str
    response_audio_url: Optional[str] = None
    intent: str
    confidence_score: float
    evidence_level: str
    requires_escalation: bool
    structured_card: StructuredCard
    evidence_sources: list[str] = []


def _build_greeting_response(farmer_name: Optional[str], lang: str) -> tuple[str, StructuredCard]:
    """Build personalized greeting response card based on farmer's first name, language and time of day."""
    raw_name = (farmer_name or "").strip()
    first_name = raw_name.split()[0] if raw_name else ""
    
    now_hour = datetime.now().hour

    if lang == "hi":
        display_name = first_name if first_name else "किसान"
        greeting_header = f"नमस्ते {display_name}! 🙏"
        bullets = [
            f"नमस्ते {display_name} जी! मैं आपका ग्रीज़ोन एग्री एआई सहायक हूँ।",
            "आज मैं आपकी फसल, मंडी भाव, बीमारी या मौसम से जुड़ी क्या सहायता कर सकता हूँ?"
        ]
        dosage = "ग्रीज़ोन एग्री एआई सहायक"

    elif lang == "pa":
        display_name = first_name if first_name else "ਕਿਸਾਨ"
        greeting_header = f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {display_name}! 🙏"
        bullets = [
            f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {display_name} ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਗ੍ਰੀਜ਼ੋਨ ਐਗਰੀ ਏਆਈ ਸਹਾਇਕ ਹਾਂ।",
            "ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਫਸਲ, ਮੰਡੀ ਭਾਅ, ਬੀਮਾਰੀ ਜਾਂ ਮੌਸਮ ਸੰਬੰਧੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?"
        ]
        dosage = "ਗ੍ਰੀਜ਼ੋਨ ਐਗਰੀ ਏਆਈ ਸਹਾਇਕ"

    else:
        display_name = first_name if first_name else "Farmer"
        if 5 <= now_hour < 12:
            time_phrase = f"Good morning, {display_name}! ☀️"
        elif 12 <= now_hour < 17:
            time_phrase = f"Good afternoon, {display_name}! 🌤️"
        elif 17 <= now_hour < 21:
            time_phrase = f"Good evening, {display_name}! 🌆"
        else:
            time_phrase = f"Good night, {display_name}! 🌙"

        greeting_header = time_phrase
        bullets = [
            f"Hello {display_name}! I am your Grizon Agri AI Assistant.",
            "How can I assist you today with crop health, mandi rates, weather, or fertilizers?"
        ]
        dosage = "Grizon Agri AI Assistant"

    card = StructuredCard(
        severity="info",
        title=greeting_header,
        bullets=bullets,
        dosage=dosage
    )
    return greeting_header + " " + bullets[1], card


@router.post("/query", response_model=ChatResponse)
async def chat_query(request: ChatRequest):
    """
    Main chat endpoint — processes query through Intent Router & Safety Guardrail.
    """
    logger.info("chat_query_received", farmer_id=request.farmer_id, farmer_name=request.farmer_name, query=request.query[:100])

    # Save user query to DB
    await save_chat_message(
        farmer_id=request.farmer_id,
        role="farmer",
        content=request.query,
    )

    # Initialize agent state
    state: FarmState = {
        "farmer_id": request.farmer_id,
        "farmer_name": request.farmer_name or "Sarbjit Singh",
        "preferred_language": request.language,
        "location": {"district": request.district or "Ludhiana", "state": "Punjab"},
        "crop_context": {"crop": request.crop or "Wheat", "season": "Rabi", "stage": "Vegetative"},
        "user_query": request.query,
        "user_audio_url": None,
        "user_image_url": request.image_url,
        "intent": "GENERAL",
        "retrieved_docs": [],
        "weather_data": {"temperature": 30, "wind_speed": 12},
        "satellite_data": None,
        "mandi_data": None,
        "soil_data": None,
        "raw_recommendation": "",
        "evidence_sources": ["PAU Package of Practices - Rabi 2025-26"],
        "verified_recommendation": "",
        "confidence_score": 0.85,
        "evidence_level": "AUTHORITATIVE",
        "requires_escalation": False,
        "response_text": "",
        "response_audio_url": None,
        "response_cards": [],
    }

    # Step 1: Route Intent
    state = await route_intent(state)
    intent = state.get("intent", "GENERAL")

    # Step 2: RAG / CRAG Knowledge Retrieval
    from app.services.rag_engine import retrieve_agri_knowledge
    rag_result = await retrieve_agri_knowledge(request.query, request.crop or "Wheat")
    state["evidence_sources"] = rag_result.get("evidence_sources", ["PAU Package of Practices"])

    # Step 3: Generate response draft based on intent & language
    lang_code = request.language.split("-")[0].lower() if request.language else "pa"
    raw_rec, card_data = await _generate_advisory_response(
        query=request.query, 
        intent=intent, 
        lang=lang_code, 
        rag_result=rag_result, 
        farmer_name=request.farmer_name,
        district=request.district
    )
    state["raw_recommendation"] = raw_rec

    # Step 4: Run Safety Verification Guardrail
    state = await verify_recommendation(state)

    # Save assistant response to DB
    await save_chat_message(
        farmer_id=request.farmer_id,
        role="assistant",
        content=state["verified_recommendation"],
        intent=intent,
        confidence=state.get("confidence_score", 0.85),
        evidence_level=state.get("evidence_level", "AUTHORITATIVE"),
    )

    return ChatResponse(
        response_text=state["verified_recommendation"],
        response_audio_url=state.get("response_audio_url"),
        intent=intent,
        confidence_score=state.get("confidence_score", 0.85),
        evidence_level=state.get("evidence_level", "AUTHORITATIVE"),
        requires_escalation=state.get("requires_escalation", False),
        structured_card=card_data,
        evidence_sources=state.get("evidence_sources", ["PAU Package of Practices"]),
    )


@router.get("/history/{farmer_id}")
async def get_chat_history(farmer_id: str, limit: int = 20):
    """Retrieve recent conversation history for a farmer."""
    logger.info("fetching_chat_history", farmer_id=farmer_id, limit=limit)
    return {
        "farmer_id": farmer_id,
        "conversations": [
            {
                "id": "c-101",
                "title": "ਕਣਕ ਦੀ ਬੀਮਾਰੀ ਸਲਾਹ",
                "created_at": "2026-09-12T10:00:00Z"
            }
        ],
        "total": 1,
    }


def extract_district_from_query(query: str, default: str = "Ludhiana") -> tuple[str, Optional[str]]:
    """Extract Indian district/city and optional state from user query prompt safely."""
    import re
    import difflib

    clean_q = re.sub(r'[._\-/]+', ' ', query.strip())

    known_states = ["Bihar", "Punjab", "Haryana", "Uttar Pradesh", "UP", "Rajasthan", "Madhya Pradesh", "MP", "Maharashtra", "Gujarat", "Delhi"]
    detected_state = None
    for s in known_states:
        if s.lower() in clean_q.lower():
            detected_state = s if s != "UP" else "Uttar Pradesh"
            break

    known_districts = [
        "Amritsar", "Ludhiana", "Khanna", "Jalandhar", "Patiala", "Bathinda", "Mohali", 
        "Chandigarh", "Hoshiarpur", "Gurdaspur", "Firozpur", "Sangrur", "Mansa", 
        "Barnala", "Faridkot", "Muktsar", "Moga", "Kapurthala", "Tarn Taran", "Pathankot", 
        "Fazilka", "Sonipat", "Ambala", "Hisar", "Karnal", "Rohtak", "Panipat", "Kurukshetra", 
        "Gurgaon", "Delhi", "Mumbai", "Kolkata", "Chennai", "Bangalore", "Hyderabad",
        "Shimla", "Dehradun", "Lucknow", "Jaipur", "Patna", "Ranchi", "Bhopal", "Indore", "Sonpur"
    ]

    # 1. Check exact match in known Indian districts
    for dist in known_districts:
        if re.search(r'\b' + re.escape(dist.lower()) + r'\b', clean_q.lower()):
            return dist, detected_state

    # 2. Check if query specifies location after preposition ('in', 'at', 'near')
    prep_match = re.search(r'\b(?:in|at|near|se|main|mein)\s+([a-zA-Z]{3,20})\b', clean_q, re.IGNORECASE)
    if prep_match:
        candidate = prep_match.group(1).capitalize()
        matches = difflib.get_close_matches(candidate, known_districts, n=1, cutoff=0.7)
        if matches:
            return matches[0], detected_state

    # Fall back safely to default Indian district (e.g. Ludhiana)
    return default or "Ludhiana", detected_state




async def generate_groq_llm_response(
    query: str,
    intent: str,
    lang: str,
    card_data: StructuredCard,
    farmer_name: Optional[str] = None,
    rag_result: Optional[dict] = None,
    weather_data: Optional[dict] = None
) -> str:
    """Uses dual LLM service (DeepSeek primary + Groq failover) to generate dynamic, accurate natural language advisory."""
    display_name = (farmer_name or "").strip().split()[0] if farmer_name else "Farmer"

    # Script & Language auto-detection
    import re
    if re.search(r'[\u0A00-\u0A7F]', query):  # Gurmukhi script
        target_lang = "pa"
    elif re.search(r'[\u0900-\u097F]', query):  # Devanagari script
        target_lang = "hi"
    elif any(w in query.lower() for w in ["kaise", "kya", "kab", "karna", "chahiye", "gehun", "khad", "khet", "bimar", "mausam"]):
        target_lang = "hi"
    else:
        target_lang = (lang or "en").split("-")[0].lower()

    if target_lang == "hi":
        lang_instruction = "Respond in warm, respectful, polite Hindi or Hinglish matching the farmer's query language. Address the farmer respectfully."
    elif target_lang == "pa":
        lang_instruction = "Respond in warm, respectful, polite Punjabi (ਪੰਜਾਬੀ). Address the farmer warmly with Sat Sri Akal."
    else:
        lang_instruction = "Respond in warm, polite, crystal-clear English. Address the farmer warmly."

    rag_text = ""
    if rag_result and rag_result.get("documents"):
        rag_text = "\n[VERIFIED KNOWLEDGE BASE / PAU PACKAGE OF PRACTICES]\n" + "\n".join(rag_result["documents"])

    weather_text = ""
    if weather_data and isinstance(weather_data, dict):
        weather_text = f"\n[LIVE WEATHER CONTEXT]\nLocation: {weather_data.get('district', 'Punjab')}, Temp: {weather_data.get('today_temp', 30)}°C, Condition: {weather_data.get('today_condition', 'Clear')}, Wind: {weather_data.get('today_wind_speed', 10)} km/h, Humidity: {weather_data.get('today_humidity', 50)}%"

    system_prompt = f"""You are Grizon Agri AI, an expert, warm, calm, polite, and highly accurate agricultural AI assistant for Indian farmers.
Always answer the farmer's specific query directly, thoroughly, and accurately in the EXACT SAME LANGUAGE as the farmer's input. Do NOT hallucinate.
If the farmer asks about fertilizers, sowing dates, pest control, weather, or market rates, provide accurate, practical, actionable agricultural advice.

Guidance:
- {lang_instruction}
- Provide specific names of fertilizers (e.g. Urea, DAP, MOP, Zinc Sulphate), application timings (sowing stage, tillering, panicle initiation), and exact recommended dosages per acre when asked.
- Keep the tone respectful, encouraging, and calm.

{rag_text}
{weather_text}
"""

    try:
        from app.services.llm import generate_llm_response
        res = await generate_llm_response(
            prompt=query,
            system_prompt=system_prompt,
            primary_provider="deepseek",
            temperature=0.3,
            max_tokens=400
        )
        if res and res.strip():
            return res.strip()
    except Exception as e:
        logger.warning("llm_response_generation_error", error=str(e))

    # Dynamic fallback using CRAG Web Search / Knowledge Base content
    if rag_result and rag_result.get("content"):
        return rag_result["content"]

    # Fallback to Serper real-time web search for the user's specific query
    try:
        from app.services.web_search import search_agri_web
        web_res = await search_agri_web(query)
        if web_res:
            return "\n".join([f"• {w['title']}: {w['snippet']}" for w in web_res])
    except Exception:
        pass

    return f"Regarding your query on '{query}': Please inspect your crop for leaf discoloration or pest activity, ensure proper soil moisture, and consult your nearest Krishi Vigyan Kendra (KVK) expert for customized field advice."


async def _build_greeting_response(farmer_name: Optional[str], lang: str) -> tuple[str, StructuredCard]:
    """Generates warm, friendly, calm greeting via LLM (DeepSeek primary + Groq failover)."""
    display_name = (farmer_name or "").strip().split()[0] if farmer_name else ""
    name_str = f" {display_name} Ji" if display_name else " Ji"

    if lang == "pa":
        system_prompt = f"You are Grizon Agri AI, an exceptionally warm, polite, calm, and respectful Punjabi agricultural assistant. Greet the farmer{name_str} warmly with Sat Sri Akal. Ask how you can help with their crop, weather, mandi rates, or fertilizers in pure friendly Punjabi."
        user_prompt = f"Say a warm, friendly Sat Sri Akal greeting to farmer{name_str} in Punjabi."
        title = f"ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ{name_str}! 🙏"
    elif lang == "hi":
        system_prompt = f"You are Grizon Agri AI, an exceptionally warm, polite, calm, and respectful Hindi agricultural assistant. Greet the farmer{name_str} warmly with Namaste. Ask how you can help with their crop, weather, mandi rates, or fertilizers in pure friendly Hindi."
        user_prompt = f"Say a warm, friendly Namaste greeting to farmer{name_str} in Hindi."
        title = f"नमस्ते{name_str}! 🙏"
    else:
        system_prompt = f"You are Grizon Agri AI, an exceptionally warm, polite, calm, and respectful agricultural assistant for Indian farmers. Greet the farmer{name_str} warmly and ask how you can assist with crops, mandi rates, weather, or fertilizers."
        user_prompt = f"Say a warm, friendly greeting to farmer{name_str}."
        title = f"Welcome to Grizon Agri{name_str}! 🙏"

    try:
        from app.services.llm import generate_llm_response
        llm_text = await generate_llm_response(
            prompt=user_prompt,
            system_prompt=system_prompt,
            primary_provider="deepseek",
            temperature=0.6,
            max_tokens=200
        )
    except Exception:
        llm_text = None

    if not llm_text:
        if lang == "pa":
            llm_text = f"ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ{name_str}! ਮੈਂ ਤੁਹਾਡਾ ਗ੍ਰੀਜ਼ੋਨ ਐਗਰੀ ਏਆਈ ਸਹਾਇਕ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਫਸਲ, ਮੰਡੀ ਭਾਅ, ਮੌਸਮ ਜਾਂ ਖਾਦ ਸੰਬੰਧੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?"
        elif lang == "hi":
            llm_text = f"नमस्ते{name_str}! मैं आपका ग्रीज़ोन एग्री एआई सहायक हूँ। आज मैं आपकी फसल, मंडी भाव, मौसम या खाद से जुड़ी क्या सहायता कर सकता हूँ?"
        else:
            llm_text = f"Hello{name_str}! I am your Grizon Agri AI Assistant. How can I help you today with your crops, mandi rates, weather, or fertilizers?"

    card = StructuredCard(
        severity="info",
        title=title,
        bullets=[llm_text],
        dosage="Grizon Agri AI Assistant"
    )
    return llm_text, card


async def _generate_advisory_response(
    query: str, 
    intent: str, 
    lang: str, 
    rag_result: dict = None, 
    farmer_name: Optional[str] = None,
    district: Optional[str] = "Ludhiana"
) -> tuple[str, StructuredCard]:
    """Generates dynamic, non-hallucinated advisory recommendation directly via DeepSeek / Groq LLM without hardcoded templates."""
    q_lower = query.lower().strip()

    # Short greetings first
    greeting_triggers = [
        "hyy", "hy", "hii", "hi", "hello", "hey", "heyy", "hlo", "namaste", "नमस्ते", 
        "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ", "sat sri akal", "sat shri akal", "ssa", 
        "good morning", "good afternoon", "good evening", "good night", "greetings", 
        "ram ram", "ਰਾਮ ਰਾਮ", "राम राम", "pranam", "ਪ੍ਰਣਾਮ", "प्रणाम"
    ]
    if (intent == "GREETING" or any(g == q_lower for g in greeting_triggers)) and len(q_lower.split()) <= 2:
        return await _build_greeting_response(farmer_name, lang)

    weather_dict = None
    if intent == "WEATHER" or any(k in q_lower for k in ["weather", "rain", "forecast", "spray", "ਮੀਂਹ", "ਮੌਸਮ", "मौसम", "बारिश"]):
        from app.api.routes_weather import fetch_weather_forecast
        target_dist, target_state = extract_district_from_query(query, default=district or "Ludhiana")
        w_res = await fetch_weather_forecast(district=target_dist, state=target_state, language=lang)
        weather_dict = w_res.dict() if hasattr(w_res, 'dict') else {}
        card_title = f"WEATHER & SPRAY ADVISORY — {target_dist.upper()}"
        dosage = f"Spray Status: {w_res.today_status}"
    elif intent == "MANDI" and any(k in q_lower for k in ["mandi", "rate", "price", "ਭਾਅ", "भाव", "दाम", "quintal", "apmc", "bhav"]):
        card_title = "LIVE MANDI MARKET ADVISORY"
        dosage = "APMC Market Benchmark"
    elif intent == "DISEASE" or any(k in q_lower for k in ["disease", "pest", "yellow", "spots", "rust", "fungus", "ਤੇਲਾ", "ਕੁੰਗੀ", "ਰੋਗ", "ਰਤੂਆ", "रतुआ", "कीड़ा"]):
        card_title = "CROP DISEASE & PEST CONTROL ADVISORY"
        dosage = "PAU Recommended Dosage"
    else:
        card_title = "AGRICULTURAL FARM ADVISORY"
        dosage = "Grizon Agri AI Assistant"

    text = await generate_groq_llm_response(
        query=query, 
        intent=intent, 
        lang=lang, 
        card_data=StructuredCard(severity="info", title=card_title, bullets=[]), 
        farmer_name=farmer_name, 
        rag_result=rag_result,
        weather_data=weather_dict
    )

    card = StructuredCard(
        severity="info",
        title=card_title,
        bullets=[text],
        dosage=dosage
    )
    return text, card
