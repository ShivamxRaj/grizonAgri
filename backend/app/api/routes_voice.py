"""
Grizon Agri — Voice API Routes
Handles Sarvam STT transcription and TTS synthesis.
"""
import structlog
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.sarvam import sarvam_transcribe, sarvam_synthesize

logger = structlog.get_logger()
router = APIRouter()


class TranscribeResponse(BaseModel):
    """STT transcription result."""
    transcript: str
    language: str
    confidence: float


class SynthesizeRequest(BaseModel):
    """TTS synthesis request."""
    text: str
    language: str = "pa-IN"


class SynthesizeResponse(BaseModel):
    """TTS synthesis result."""
    audio_base64: str
    duration_seconds: float


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form(default="pa-IN"),
):
    """
    Transcribe farmer voice audio to text using Sarvam Saaras v3.
    Supports Punjabi (pa-IN), Hindi (hi-IN), and code-mixed speech.
    """
    logger.info("voice_transcribe_request", filename=audio.filename, language=language)

    audio_bytes = await audio.read()

    result = await sarvam_transcribe(audio_bytes, language)

    return TranscribeResponse(
        transcript=result["transcript"],
        language=result["language"],
        confidence=result["confidence"],
    )


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_speech(request: SynthesizeRequest):
    """
    Convert text response to Punjabi/Hindi speech using Sarvam Bulbul v3.
    Returns base64-encoded audio for client playback.
    """
    logger.info("voice_synthesize_request", text_length=len(request.text), language=request.language)

    result = await sarvam_synthesize(request.text, request.language)

    return SynthesizeResponse(
        audio_base64=result["audio_base64"],
        duration_seconds=result["duration_seconds"],
    )
