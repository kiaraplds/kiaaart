"""
Voice — ElevenLabs TTS integration.
Converts curator text to spoken audio.
"""

import os
import httpx


ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# A warm, knowledgeable voice — "George" from ElevenLabs library
# You can browse voices at elevenlabs.io and swap this ID
DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"
DEFAULT_MODEL = "eleven_multilingual_v2"


async def text_to_speech(text: str, voice_id: str = None) -> bytes:
    """Convert text to speech using ElevenLabs API. Returns MP3 bytes."""

    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY not set in environment")

    voice = voice_id or DEFAULT_VOICE_ID
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": DEFAULT_MODEL,
                "voice_settings": {
                    "stability": 0.6,
                    "similarity_boost": 0.75,
                }
            },
            timeout=30.0,
        )

        if response.status_code != 200:
            raise Exception(f"ElevenLabs error {response.status_code}: {response.text[:200]}")

        return response.content
