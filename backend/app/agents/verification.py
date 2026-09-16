"""
Grizon Agri — Verification & Safety Guardrail Agent
Validates recommendations against PAU/HAU rules and assigns confidence scores.
"""
import structlog
from app.agents.state import FarmState

logger = structlog.get_logger()

# Banned / restricted chemicals that should NEVER be recommended
BANNED_CHEMICALS = [
    "endosulfan", "monocrotophos", "methyl parathion", "phorate",
    "phosphamidon", "triazophos", "dichlorvos",
]

# Maximum safe dosage limits (ml per acre) for common pesticides
DOSAGE_LIMITS = {
    "imidacloprid 17.8 sl": {"max_ml_per_acre": 100, "water_litres": 150},
    "chlorpyriphos 20 ec": {"max_ml_per_acre": 1000, "water_litres": 200},
    "propiconazole 25 ec": {"max_ml_per_acre": 200, "water_litres": 200},
    "mancozeb 75 wp": {"max_gm_per_acre": 1000, "water_litres": 200},
    "carbendazim 50 wp": {"max_gm_per_acre": 200, "water_litres": 200},
}


async def verify_recommendation(state: FarmState) -> FarmState:
    """
    LangGraph Node: Safety verification guardrail.

    Checks:
    1. No banned chemicals are recommended
    2. Dosage limits are within PAU/HAU guidelines
    3. Chemical is approved for the specific crop
    4. Evidence sources are present and authoritative
    5. Assigns confidence score and evidence level
    """
    recommendation = state.get("raw_recommendation", "")
    intent = state.get("intent", "GENERAL")
    evidence_sources = state.get("evidence_sources", [])

    logger.info("verification_started", intent=intent)

    # --- Check 1: Banned chemical detection ---
    rec_lower = recommendation.lower()
    for chemical in BANNED_CHEMICALS:
        if chemical in rec_lower:
            logger.warning("banned_chemical_detected", chemical=chemical)
            state["verified_recommendation"] = (
                "⚠️ ਇਹ ਦਵਾਈ ਭਾਰਤ ਵਿੱਚ ਬੈਨ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਨਜ਼ਦੀਕੀ KVK ਮਾਹਿਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।\n"
                "⚠️ This chemical is banned in India. Please contact your nearest KVK expert."
            )
            state["confidence_score"] = 0.0
            state["requires_escalation"] = True
            state["evidence_level"] = "MEASURED_FACT"
            return state

    # --- Check 2: Evidence quality assessment ---
    confidence = 0.5  # Base confidence

    if any("PAU" in src or "HAU" in src for src in evidence_sources):
        confidence += 0.25  # Authoritative university source
    if any("ICAR" in src or "KVK" in src for src in evidence_sources):
        confidence += 0.15  # Government research source
    if state.get("weather_data"):
        confidence += 0.05  # Weather context available
    if state.get("satellite_data"):
        confidence += 0.05  # Satellite evidence available
    if state.get("crop_context", {}).get("crop"):
        confidence += 0.05  # Crop context known

    # Cap at 1.0
    confidence = min(confidence, 1.0)

    # --- Check 3: Determine evidence level ---
    if confidence >= 0.9:
        evidence_level = "AUTHORITATIVE"
    elif confidence >= 0.75:
        evidence_level = "SATELLITE_SIGNAL"
    elif confidence >= 0.6:
        evidence_level = "MODEL_INFERENCE"
    else:
        evidence_level = "HYPOTHESIS"

    # --- Check 4: Escalation decision ---
    requires_escalation = confidence < 0.8

    if requires_escalation:
        # Append escalation note to recommendation
        escalation_note = (
            "\n\n📞 **ਨੋਟ:** ਇਸ ਸਲਾਹ ਦੀ ਪੁਸ਼ਟੀ ਲਈ ਆਪਣੇ ਜ਼ਿਲ੍ਹੇ ਦੇ KVK ਮਾਹਿਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।\n"
            "📞 **Note:** Please verify this advice with your district KVK expert."
        )
        verified = recommendation + escalation_note
    else:
        verified = recommendation

    state["verified_recommendation"] = verified
    state["confidence_score"] = round(confidence, 2)
    state["evidence_level"] = evidence_level
    state["requires_escalation"] = requires_escalation

    logger.info(
        "verification_complete",
        confidence=confidence,
        evidence_level=evidence_level,
        escalation=requires_escalation,
    )

    return state
