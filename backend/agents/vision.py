"""
Vision Agent — Analyses room photos for art placement.
Uses Claude's vision API to understand the space.
"""

import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from anthropic import Anthropic
from config import MODEL, VISION_SYSTEM_PROMPT

client = Anthropic()


async def analyse_room(base64_image: str, media_type: str) -> dict:
    """Send a room photo to Claude Vision and get structured analysis."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        system=VISION_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": base64_image
                    }
                },
                {
                    "type": "text",
                    "text": "Analyse this room for art placement. Focus on walls, lighting, colour palette, and style."
                }
            ]
        }]
    )

    raw_text = response.content[0].text.strip()

    # Clean markdown formatting
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    if raw_text.startswith("```"):
        raw_text = raw_text[3:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]
    raw_text = raw_text.strip()

    try:
        analysis = json.loads(raw_text)
    except json.JSONDecodeError:
        analysis = {
            "error": "Could not parse structured analysis",
            "raw_analysis": raw_text,
            "summary": raw_text[:500]
        }

    analysis["_meta"] = {
        "model": MODEL,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }

    return analysis
