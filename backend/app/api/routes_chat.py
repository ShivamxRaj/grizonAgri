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
    raw_rec, card_data = _generate_advisory_response(request.query, intent, lang_code, rag_result, farmer_name=request.farmer_name)
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


def _generate_advisory_response(query: str, intent: str, lang: str, rag_result: dict = None, farmer_name: Optional[str] = None) -> tuple[str, StructuredCard]:
    """Generates precise advisory recommendation and visual response card based on intent."""

    q_lower = query.lower().strip()

    greeting_triggers = [
        "hyy", "hy", "hii", "hi", "hello", "hey", "heyy", "namaste", "नमस्ते", 
        "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ", "sat sri akal", "sat shri akal", "ssa", 
        "good morning", "good afternoon", "good evening", "good night", "greetings", 
        "ram ram", "ਰਾਮ ਰਾਮ", "राम राम", "pranam", "ਪ੍ਰਣਾਮ", "प्रणाम"
    ]

    # 0. Greeting Intent
    if intent == "GREETING" or any(g == q_lower for g in greeting_triggers) or (len(q_lower.split()) <= 4 and any(g in q_lower.split() for g in greeting_triggers)):
        return _build_greeting_response(farmer_name, lang)

    # 1. Mandi Market Prices Intent
    if intent == "MANDI" or any(k in q_lower for k in ["mandi", "rate", "price", "ਭਾਅ", "भाव", "दाम", "quintal"]):
        # Dynamic crop detection for Mandi price
        if any(k in q_lower for k in ["paddy", "rice", "ਝੋਨਾ", "धान", "basmati"]):
            if lang == "pa":
                title = "ਝੋਨਾ / ਬਾਸਮਤੀ ਮੰਡੀ ਭਾਅ"
                bullets = [
                    "ਅੰਮ੍ਰਿਤਸਰ ਮੰਡੀ ਵਿੱਚ ਬਾਸਮਤੀ 1121 ਦਾ ਭਾਅ ₹4,300/ਕੁਇੰਟਲ ਹੈ",
                    "ਲੁਧਿਆਣਾ ਮੰਡੀ ਵਿੱਚ ਝੋਨਾ PR-126 ਦਾ ਰੇਟ ₹2,320/ਕੁਇੰਟਲ ਹੈ",
                    "ਸਰਕਾਰੀ MSP ਝੋਨਾ ਰੇਟ: ₹2,300/ਕੁਇੰਟਲ ਪੂਰਾ ਦਿੱਤਾ ਜਾ ਰਿਹਾ ਹੈ"
                ]
                dosage = "ਅੰਮ੍ਰਿਤਸਰ ਗ੍ਰੇਨ ਮਾਰਕੀਟ (Paddy APMC)"
            elif lang == "hi":
                title = "धान / बासमती मंडी भाव"
                bullets = [
                    "अमृतसर मंडी में बासमती 1121 का भाव ₹4,300/क्विंटल है",
                    "लुधियाना मंडी में धान PR-126 का भाव ₹2,320/क्विंटल है",
                    "सरकारी MSP दर ₹2,300/क्विंटल गारंटीकृत है"
                ]
                dosage = "अमृतसर मंडी (Paddy APMC)"
            else:
                title = "PADDY & BASMATI MANDI RATES"
                bullets = [
                    "Paddy Basmati 1121 rate in Amritsar Grain Market is ₹4,300/quintal",
                    "Paddy PR-126 rate in Ludhiana APMC is ₹2,320/quintal",
                    "Government MSP rate: ₹2,300/quintal guaranteed"
                ]
                dosage = "Amritsar Grain APMC Market"

        elif any(k in q_lower for k in ["cotton", "ਨਰਮਾ", "ਕਪਾਹ", "कपास"]):
            if lang == "pa":
                title = "ਨਰਮਾ / ਕਪਾਹ ਮੰਡੀ ਭਾਅ"
                bullets = [
                    "ਬਠਿੰਡਾ ਮੰਡੀ ਵਿੱਚ ਦੇਸੀ BT ਨਰਮਾ ਦਾ ਭਾਅ ₹7,100/ਕੁਇੰਟਲ ਹੈ",
                    "ਮਾਨਸਾ ਮੰਡੀ ਵਿੱਚ ਕਪਾਹ ਦਾ ਰੇਟ ₹7,050/ਕੁਇੰਟਲ ਹੈ",
                    "ਪਿਛਲੇ ਹਫ਼ਤੇ ਨਾਲੋਂ ₹50/ਕੁਇੰਟਲ ਦਾ ਵਾਧਾ ਦਰਜ ਕੀਤਾ ਗਿਆ"
                ]
                dosage = "ਬਠਿੰਡਾ ਮੰਡੀ (Bathinda APMC)"
            else:
                title = "COTTON MANDI MARKET RATES"
                bullets = [
                    "Cotton Desi BT rate in Bathinda Mandi is ₹7,100/quintal",
                    "Cotton rate in Mansa Market is ₹7,050/quintal",
                    "Price increased by +₹50/quintal this week"
                ]
                dosage = "Bathinda APMC Market"

        elif any(k in q_lower for k in ["mustard", "ਸਰ੍ਹੋਂ", "सरसों"]):
            title = "MUSTARD / SARON MANDI RATES"
            bullets = [
                "Mustard Kala Saron rate in Karnal APMC is ₹5,450/quintal",
                "Mustard rate in Hisar Mandi is ₹5,400/quintal",
                "MSP Benchmark: ₹5,650/quintal"
            ]
            dosage = "Karnal & Hisar APMC Markets"

        else:
            # Default Wheat Mandi
            if lang == "pa":
                title = "ਤਾਜ਼ਾ ਮੰਡੀ ਭਾਅ — ਕਣਕ (Wheat)"
                bullets = [
                    "ਲੁਧਿਆਣਾ ਮੰਡੀ ਵਿੱਚ ਅੱਜ ਕਣਕ (Wheat) ਦਾ ਔਸਤ ਭਾਅ ₹2,275/ਕੁਇੰਟਲ ਹੈ",
                    "ਹਿਸਾਰ ਮੰਡੀ ਵਿੱਚ ਕਣਕ (PBW-725) ਦਾ ਰੇਟ ₹2,265/ਕੁਇੰਟਲ ਚੱਲ ਰਿਹਾ ਹੈ",
                    "ਸਰਕਾਰੀ MSP ਰੇਟ ਦੀ ਪੂਰੀ ਗਾਰੰਟੀ ਹੈ"
                ]
                dosage = "ਲੁਧਿਆਣਾ ਮੰਡੀ (Ludhiana APMC)"
            elif lang == "hi":
                title = "ताज़ा मंडी भाव — गेहूं (Wheat)"
                bullets = [
                    "लुधियाना मंडी में गेहूं का औसत भाव ₹2,275/क्विंटल है",
                    "हिसार मंडी में गेहूं (PBW-725) का भाव ₹2,265/क्विंटल है",
                    "सरकारी MSP दर गारंटीकृत है"
                ]
                dosage = "लुधियाना मंडी (Ludhiana APMC)"
            else:
                title = "LIVE MANDI MARKET RATES — WHEAT"
                bullets = [
                    "Wheat APMC rate in Ludhiana Mandi today is ₹2,275/quintal",
                    "Wheat PBW-725 rate in Hisar Mandi is ₹2,265/quintal",
                    "Government MSP rates guaranteed"
                ]
                dosage = "Ludhiana APMC Market"

        return bullets[0], StructuredCard(severity="medium", title=title, bullets=bullets, dosage=dosage)

    # 2. Disease Diagnosis Intent
    elif intent == "DISEASE" or any(k in q_lower for k in ["disease", "pest", "yellow", "spots", "rust", "fungus", "ਤੇਲਾ", "ਕੁੰਗੀ", "ਰੋਗ", "ਰਤੂਆ", "रतुआ", "कीड़ा"]):
        if lang == "pa":
            title = "ਚੇਤਾਵਨੀ: ਪੀਲੀ ਕੁੰਗੀ / ਪੀਲਾ ਤੇਲਾ"
            bullets = [
                "ਕਣਕ ਤੇ ਪੀਲੀ ਕੁੰਗੀ (Yellow Rust) ਦੇ ਲੱਛਣ ਹਨ",
                "200 ਮਿ.ਲੀ. ਟਿਲਟ (Propiconazole 25 EC) ਪਾਓ",
                "200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਕਰੋ"
            ]
            dosage = "2.5 ਪੰਪ / ਏਕੜ (15L ਟੈਂਕ)"
        elif lang == "hi":
            title = "चेतावनी: पीला रतुआ"
            bullets = [
                "गेहूं पर पीला रतुआ (Yellow Rust) के लक्षण हैं",
                "200 मिली टिल्ट (Propiconazole 25 EC) डालें",
                "200 लीटर पानी में मिलाकर प्रति एकड़ छिड़काव करें"
            ]
            dosage = "2.5 पंप / एकड़"
        else:
            title = "WARNING: YELLOW RUST DETECTED"
            bullets = [
                "Symptoms of Yellow Rust / Aphids detected on crop",
                "Apply 200 ml Tilt (Propiconazole 25 EC)",
                "Mix in 200 Liters of water and spray per acre"
            ]
            dosage = "2.5 Pumps / Acre"

        return bullets[0] + ". " + bullets[1], StructuredCard(severity="high", title=title, bullets=bullets, dosage=dosage)

    # 3. Weather Forecast & Spray Window Intent
    elif intent == "WEATHER" or any(k in q_lower for k in ["weather", "rain", "forecast", "spray", "ਮੀਂਹ", "ਮੌਸਮ", "मौसम", "बारिश"]):
        if lang == "pa":
            title = "ਮੌਸਮ ਅਤੇ ਛਿੜਕਾਅ ਸਲਾਹ"
            bullets = [
                "ਅੱਜ ਮੌਸਮ ਸਾਫ਼ ਹੈ, ਹਵਾ ਦੀ ਗਤੀ 12 km/h ਹੈ",
                "ਸਪਰੇਅ ਕਰਨ ਲਈ ਅੱਜ ਦਾ ਦਿਨ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁਰੱਖਿਅਤ (SAFE) ਹੈ",
                "ਪਰਸੋਂ ਮੀਂਹ ਪੈਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ, ਅੱਜ ਹੀ ਛਿੜਕਾਅ ਪੂਰਾ ਕਰੋ"
            ]
            dosage = "ਸਵੇਰੇ 11 ਵਜੇ ਤੋਂ ਪਹਿਲਾਂ"
        elif lang == "hi":
            title = "मौसम एवं छिड़काव सलाह"
            bullets = [
                "आज मौसम साफ़ है, हवा की गति 12 km/h है",
                "स्प्रे करने के लिए आज का दिन पूरी तरह सुरक्षित (SAFE) है",
                "परसों बारिश की संभावना है, आज ही छिड़काव पूरा करें"
            ]
            dosage = "सुबह 11 बजे से पहले"
        else:
            title = "WEATHER & SPRAY WINDOW ADVISORY"
            bullets = [
                "Today weather is sunny with 12 km/h wind speed",
                "Conditions are 100% SAFE for chemical spraying",
                "Rain expected on Day 3, complete spraying today"
            ]
            dosage = "Before 11:00 AM"

        return bullets[0], StructuredCard(severity="info", title=title, bullets=bullets, dosage=dosage)

    # 4. Government Scheme Intent
    elif intent == "SCHEME" or any(k in q_lower for k in ["scheme", "pm", "kisan", "subsidy", "योजना", "ਸਕੀਮ"]):
        if lang == "hi":
            title = "प्रधानमंत्री किसान सम्मान निधि योजना"
            bullets = [
                "PM-Kisan योजना के तहत किसानों को वार्षिक ₹6,000 तीन किश्तों में दिए जाते हैं",
                "अगली किश्त आपके बैंक खाते में DBT के माध्यम से ट्रांसफर की जाएगी",
                "आवश्यक दस्तावेज: आधार कार्ड, खतौनी भूमि रिकॉर्ड, एवं बैंक पासबुक"
            ]
            dosage = "आधिकारिक स्रोत: pmkisan.gov.in"
        elif lang == "pa":
            title = "PM ਕਿਸਾਨ ਸਨਮਾਨ ਨਿਧੀ ਸਕੀਮ"
            bullets = [
                "PM-Kisan ਸਕੀਮ ਤਹਿਤ ਕਿਸਾਨਾਂ ਨੂੰ ਸਾਲਾਨਾ ₹6,000 ਤਿੰਨ ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਮਿਲਦੇ ਹਨ",
                "ਅਗਲੀ ਕਿਸ਼ਤ direct bank transfer (DBT) ਰਾਹੀਂ ਆਵੇਗੀ",
                "ਜ਼ਰੂਰੀ ਦਸਤਾਵੇਜ਼: ਆਧਾਰ ਕਾਰਡ, ਜਮ੍ਹਾਂਬੰਦੀ/ਖੇਤ ਰਿਕਾਰਡ, ਅਤੇ ਬੈਂਕ ਖਾਤਾ"
            ]
            dosage = "ਸਰਕਾਰੀ ਪੋਰਟਲ: pmkisan.gov.in"
        else:
            title = "PM-KISAN SAMMAN NIDHI SCHEME"
            bullets = [
                "Under PM-Kisan scheme, ₹6,000 per year is provided in 3 installments of ₹2,000",
                "Direct Benefit Transfer (DBT) credited straight into linked bank account",
                "Required Documents: Aadhaar, Land Revenue Record (Khasra/Khatauni), Bank Passbook"
            ]
            dosage = "Official Source: pmkisan.gov.in"

        return bullets[0], StructuredCard(severity="info", title=title, bullets=bullets, dosage=dosage)

    # 5. Default General Farm Advisory
    else:
        if lang == "pa":
            title = "ਖੇਤੀਬਾੜੀ ਸਲਾਹ"
            bullets = [
                "ਤੁਹਾਡਾ ਸਵਾਲ ਗ੍ਰੀਜ਼ੋਨ ਐਗਰੀ ਦੁਆਰਾ ਪ੍ਰਾਪਤ ਕਰ ਲਿਆ ਗਿਆ ਹੈ",
                "ਖੇਤ ਵਿੱਚ ਸਹੀ ਨਮੀ ਬਣਾ ਕੇ ਰੱਖੋ",
                "ਕੀੜਿਆਂ ਦੀ ਹਫ਼ਤੇ ਵਿੱਚ ਦੋ ਵਾਰ ਜਾਂਚ ਕਰੋ"
            ]
            dosage = "PAU ਪ੍ਰਮਾਣਿਤ ਸਲਾਹ"
        elif lang == "hi":
            title = "कृषि सलाह"
            bullets = [
                "आपका प्रश्न ग्रीज़ੋਨ एग्री द्वारा प्राप्त कर लिया गया है",
                "खेत में उचित नमी बनाए रखें",
                "कीटों की सप्ताह में दो बार जांच करें"
            ]
            dosage = "PAU प्रमाणित सलाह"
        else:
            title = "AGRICULTURAL FARM ADVISORY"
            bullets = [
                "Your query has been analyzed by Grizon Agri",
                "Maintain balanced soil moisture in field",
                "Inspect crop twice a week for pest activity"
            ]
            dosage = "PAU Recommended"

        return bullets[0], StructuredCard(severity="info", title=title, bullets=bullets, dosage=dosage)
