"""
Grizon Agri — Sarvam AI Voice Service
Wrapper for Sarvam Saaras v3 (STT) and Bulbul v3 (TTS).
Includes mock fallback for development without API key.
"""
import base64
import structlog
from app.core.config import settings

logger = structlog.get_logger()


async def sarvam_transcribe(audio_bytes: bytes, language: str = "pa-IN") -> dict:
    """
    Transcribe audio to text using Sarvam Saaras v3.

    Args:
        audio_bytes: Raw audio file bytes (WAV/MP3/OGG)
        language: BCP-47 language code ('pa-IN', 'hi-IN')

    Returns:
        {"transcript": str, "language": str, "confidence": float}
    """
    if not settings.SARVAM_API_KEY:
        logger.warning("sarvam_stt_mock_mode", reason="No API key configured")
        return {
            "transcript": "ਕਣਕ ਤੇ ਪੀਲਾ ਤੇਲਾ ਲੱਗ ਗਿਆ, ਕੀ ਕਰੀਏ?",  # Mock Punjabi query
            "language": language,
            "confidence": 0.95,
        }

    try:
        from sarvamai import SarvamAI
        import tempfile
        import os

        client = SarvamAI(api_subscription_key=settings.SARVAM_API_KEY)

        # Write audio to temp file (Sarvam SDK expects file path)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            response = client.speech_to_text.transcribe(
                file=tmp_path,
                language_code=language,
            )

            transcript = response.transcript if hasattr(response, "transcript") else str(response)

            logger.info("sarvam_stt_success", language=language, transcript_length=len(transcript))

            return {
                "transcript": transcript,
                "language": language,
                "confidence": 0.92,
            }
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        logger.error("sarvam_stt_error", error=str(e))
        return {
            "transcript": "",
            "language": language,
            "confidence": 0.0,
        }


async def sarvam_synthesize(text: str, language: str = "pa-IN") -> dict:
    """
    Convert text to speech using Sarvam Bulbul v3.

    Args:
        text: Text to convert to speech
        language: BCP-47 language code ('pa-IN', 'hi-IN')

    Returns:
        {"audio_base64": str, "duration_seconds": float}
    """
    if not settings.SARVAM_API_KEY:
        logger.warning("sarvam_tts_mock_mode", reason="No API key configured")
        # Return a tiny silent WAV as mock
        silent_wav = _generate_silent_wav()
        return {
            "audio_base64": base64.b64encode(silent_wav).decode("utf-8"),
            "duration_seconds": 1.0,
        }

    try:
        from sarvamai import SarvamAI
        from sarvamai.play import save

        client = SarvamAI(api_subscription_key=settings.SARVAM_API_KEY)

        audio = client.text_to_speech.convert(
            text=text,
            model="bulbul:v3",
            language_code=language,
        )

        # Convert audio object to base64
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            save(audio, tmp.name)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as f:
                audio_bytes = f.read()

            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            # Rough duration estimate: WAV file size / (sample_rate * channels * bytes_per_sample)
            duration = len(audio_bytes) / (22050 * 1 * 2)

            logger.info("sarvam_tts_success", language=language, text_length=len(text))

            return {
                "audio_base64": audio_base64,
                "duration_seconds": round(duration, 2),
            }
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        logger.error("sarvam_tts_error", error=str(e))
        silent_wav = _generate_silent_wav()
        return {
            "audio_base64": base64.b64encode(silent_wav).decode("utf-8"),
            "duration_seconds": 0.0,
        }


def _generate_silent_wav() -> bytes:
    """Generate a minimal silent WAV file for mock responses."""
    import struct

    sample_rate = 22050
    duration = 0.5
    num_samples = int(sample_rate * duration)
    data_size = num_samples * 2  # 16-bit mono

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,       # Chunk size
        1,        # PCM format
        1,        # Mono
        sample_rate,
        sample_rate * 2,
        2,        # Block align
        16,       # Bits per sample
        b"data",
        data_size,
    )

    silence = b"\x00" * data_size
    return header + silence
