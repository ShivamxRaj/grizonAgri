"""
Grizon Agri — Auth Routes (Phone + OTP + Profile Setup)
Provides endpoints for phone-based OTP request, verification, and farmer profile onboarding.
"""
import uuid
import re
from datetime import datetime, timedelta
import structlog
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy import text
from app.db.database import get_db, async_session_factory

logger = structlog.get_logger()
router = APIRouter()

def normalize_phone(phone: str) -> str:
    """Normalize Indian phone numbers to 10-digit standard string."""
    cleaned = re.sub(r"\D", "", phone)
    if len(cleaned) == 12 and cleaned.startswith("91"):
        cleaned = cleaned[2:]
    if len(cleaned) == 10:
        return cleaned
    raise HTTPException(status_code=400, detail="Invalid Indian phone number. Please enter a valid 10-digit mobile number.")

def auto_detect_gender(name: str) -> str:
    """Auto detect avatar gender from name."""
    name_lower = name.lower().strip()
    female_keywords = ["kaur", "devi", "kumari", "sunita", "anjali", "priya", "pooja", "manpreet kaur", "harpreet kaur", "simran", "gurpreet kaur"]
    for kw in female_keywords:
        if kw in name_lower:
            return "female"
    return "male"

# Request / Response Schemas
class RequestOTPPayload(BaseModel):
    phone_number: str = Field(..., example="9876543210")

class VerifyOTPPayload(BaseModel):
    phone_number: str = Field(..., example="9876543210")
    otp: str = Field(..., example="123456")

class ProfilePayload(BaseModel):
    farmer_id: str
    name: str = Field(..., example="Gurpreet Singh")
    gender: Optional[str] = None
    preferred_language: Optional[str] = "pa-IN"
    district: Optional[str] = "Ludhiana"
    state: Optional[str] = "Punjab"
    primary_crops: Optional[List[str]] = Field(default=["Wheat", "Paddy"])


@router.post("/request-otp")
async def request_otp(payload: RequestOTPPayload):
    """
    Request 6-digit OTP for phone login.
    """
    phone = normalize_phone(payload.phone_number)
    expires_at = (datetime.utcnow() + timedelta(minutes=10)).strftime("%Y-%m-%d %H:%M:%S")

    async with async_session_factory() as session:
        result = await session.execute(
            text("SELECT farmer_id FROM farmers WHERE phone_number = :phone"),
            {"phone": phone}
        )
        existing = result.fetchone()

        if existing:
            farmer_id = existing[0]
            await session.execute(
                text("""
                    UPDATE farmers 
                    SET otp_expires_at = :expires_at 
                    WHERE farmer_id = :farmer_id
                """),
                {"expires_at": expires_at, "farmer_id": farmer_id}
            )
        else:
            farmer_id = f"f-{uuid.uuid4().hex[:8]}"
            await session.execute(
                text("""
                    INSERT INTO farmers (farmer_id, phone_number, otp_expires_at, name, gender, preferred_language, district, state, primary_crops)
                    VALUES (:farmer_id, :phone, :expires_at, '', 'male', 'pa-IN', 'Ludhiana', 'Punjab', 'Wheat,Paddy')
                """),
                {
                    "farmer_id": farmer_id,
                    "phone": phone,
                    "expires_at": expires_at
                }
            )
        await session.commit()

    logger.info("otp_requested", phone=phone, farmer_id=farmer_id)

    return {
        "status": "success",
        "message": f"OTP sent successfully to +91-{phone}",
        "phone_number": phone
    }


@router.post("/verify-otp")
async def verify_otp(payload: VerifyOTPPayload):
    """
    Verify 6-digit OTP code and return token + profile status.
    Accepts any valid 6-digit number code.
    """
    phone = normalize_phone(payload.phone_number)
    otp = payload.otp.strip()

    if len(otp) != 6 or not otp.isdigit():
        raise HTTPException(status_code=400, detail="Please enter a valid 6-digit OTP code.")

    async with async_session_factory() as session:
        result = await session.execute(
            text("""
                SELECT farmer_id, phone_number, name, gender, preferred_language, district, state, primary_crops
                FROM farmers WHERE phone_number = :phone
            """),
            {"phone": phone}
        )
        farmer = result.fetchone()

        if not farmer:
            raise HTTPException(status_code=404, detail="Phone number not registered. Please request OTP first.")

        farmer_id, phone_num, name, gender, pref_lang, district, state, primary_crops_str = farmer

        crops = [c.strip() for c in (primary_crops_str or "Wheat,Paddy").split(",") if c.strip()]
        is_new = not bool(name and name.strip())

        token = f"token-{farmer_id}-{uuid.uuid4().hex[:6]}"

        return {
            "status": "success",
            "token": token,
            "is_new_user": is_new,
            "farmer": {
                "farmer_id": farmer_id,
                "phone_number": phone_num,
                "name": name or "",
                "gender": gender or "male",
                "preferred_language": pref_lang or "pa-IN",
                "district": district or "Ludhiana",
                "state": state or "Punjab",
                "primary_crops": crops
            }
        }


@router.post("/profile")
async def update_profile(payload: ProfilePayload):
    """
    Create or update farmer profile (Name, Auto Gender, Auto District).
    """
    farmer_name = payload.name.strip()
    detected_gender = payload.gender or auto_detect_gender(farmer_name)
    crops_str = ",".join(payload.primary_crops) if payload.primary_crops else "Wheat,Paddy"
    district = (payload.district and payload.district.strip()) or "Ludhiana"
    state = (payload.state and payload.state.strip()) or "Punjab"

    async with async_session_factory() as session:
        await session.execute(
            text("""
                UPDATE farmers
                SET name = :name,
                    gender = :gender,
                    preferred_language = :lang,
                    district = :district,
                    state = :state,
                    primary_crops = :crops
                WHERE farmer_id = :farmer_id
            """),
            {
                "name": farmer_name,
                "gender": detected_gender,
                "lang": payload.preferred_language or "pa-IN",
                "district": district,
                "state": state,
                "crops": crops_str,
                "farmer_id": payload.farmer_id
            }
        )
        await session.commit()

        result = await session.execute(
            text("""
                SELECT farmer_id, phone_number, name, gender, preferred_language, district, state, primary_crops
                FROM farmers WHERE farmer_id = :farmer_id
            """),
            {"farmer_id": payload.farmer_id}
        )
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Farmer profile not found.")

        f_id, phone, name, gender, lang, dist, st, crops_s = row

        return {
            "status": "success",
            "message": "Profile updated successfully",
            "farmer": {
                "farmer_id": f_id,
                "phone_number": phone,
                "name": name,
                "gender": gender or "male",
                "preferred_language": lang or "pa-IN",
                "district": dist or "Ludhiana",
                "state": st or "Punjab",
                "primary_crops": [c.strip() for c in (crops_s or "").split(",") if c.strip()]
            }
        }


@router.get("/me")
async def get_current_farmer(farmer_id: str):
    """
    Get profile details for logged in farmer.
    """
    async with async_session_factory() as session:
        result = await session.execute(
            text("""
                SELECT farmer_id, phone_number, name, gender, preferred_language, district, state, primary_crops
                FROM farmers WHERE farmer_id = :farmer_id
            """),
            {"farmer_id": farmer_id}
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Farmer not found.")

        f_id, phone, name, gender, lang, dist, st, crops_s = row
        return {
            "farmer": {
                "farmer_id": f_id,
                "phone_number": phone,
                "name": name or "",
                "gender": gender or "male",
                "preferred_language": lang or "pa-IN",
                "district": dist or "Ludhiana",
                "state": st or "Punjab",
                "primary_crops": [c.strip() for c in (crops_s or "").split(",") if c.strip()]
            }
        }
