"""
Grizon Agri — LangGraph Agent State Definition
Central state schema shared across all agent nodes.
"""
from typing import TypedDict, Optional, Annotated
from operator import add


class FarmState(TypedDict):
    """Unified state flowing through the LangGraph agent pipeline."""

    # --- Farmer Identity ---
    farmer_id: str
    farmer_name: str
    preferred_language: str  # 'pa-IN', 'hi-IN', 'en-IN'

    # --- Location Context ---
    location: dict  # {"lat": float, "lon": float, "district": str, "state": str, "village": str}

    # --- Crop Context (from Farm Digital Twin) ---
    crop_context: dict  # {"crop": str, "variety": str, "stage": str, "sowing_date": str, "season": str}

    # --- User Input ---
    user_query: str              # Transcribed text from farmer voice/text
    user_audio_url: Optional[str]  # Original audio file path
    user_image_url: Optional[str]  # Crop/disease photo path

    # --- Intent & Routing ---
    intent: str  # CROP_ADVISORY, DISEASE, WEATHER, MANDI, SCHEME, IRRIGATION, GENERAL

    # --- Retrieved Evidence ---
    retrieved_docs: list[dict]    # RAG retrieved documents from PAU/HAU knowledge base
    weather_data: Optional[dict]  # IMD/OWM forecast data
    satellite_data: Optional[dict]  # Sentinel NDVI/SAR signals
    mandi_data: Optional[dict]    # Market price data
    soil_data: Optional[dict]     # Soil health card / satellite moisture

    # --- Agent Reasoning ---
    raw_recommendation: str       # LLM-generated draft recommendation
    evidence_sources: list[str]   # List of source references used

    # --- Verification & Safety ---
    verified_recommendation: str  # Post-guardrail verified recommendation
    confidence_score: float       # 0.0 to 1.0
    evidence_level: str           # MEASURED_FACT, AUTHORITATIVE, SATELLITE_SIGNAL, MODEL_INFERENCE, HYPOTHESIS
    requires_escalation: bool     # True if confidence < 0.8 → route to KVK expert

    # --- Response Output ---
    response_text: str            # Final text response in farmer's language
    response_audio_url: Optional[str]  # Sarvam TTS generated audio
    response_cards: list[dict]    # Structured visual cards (severity, dosage, images)
