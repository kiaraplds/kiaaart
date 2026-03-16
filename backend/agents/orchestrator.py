"""
Orchestrator — Manages conversation flow and chains agents together.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from anthropic import Anthropic
from config import MODEL, CURATOR_SYSTEM_PROMPT

client = Anthropic()
sessions = {}


from typing import Optional

async def conversation_manager(message: str, session_id: str, room_analysis: Optional[dict] = None) -> dict:
    """Handle a conversation turn with the WallWise advisor."""

    if session_id not in sessions:
        sessions[session_id] = {"history": [], "room_analysis": None, "preferences": {}}

    session = sessions[session_id]

    if room_analysis:
        session["room_analysis"] = room_analysis

    # Build system prompt with room context
    system = CURATOR_SYSTEM_PROMPT

    if session["room_analysis"]:
        a = session["room_analysis"]
        system += f"\n\n## Room Analysis\n"
        if "summary" in a:
            system += f"{a['summary']}\n"
        if "wall_analysis" in a:
            w = a["wall_analysis"]
            system += f"Wall: {w.get('primary_colour', '?')}, {w.get('available_space', '?')} space, {w.get('lighting', '?')}\n"
        if "room_style" in a:
            system += f"Style: {a['room_style'].get('primary_style', '?')}, Mood: {a['room_style'].get('mood', '?')}\n"
        if "colour_palette" in a:
            c = a["colour_palette"]
            system += f"Colours: {', '.join(c.get('dominant_colours', []))}\n"
            system += f"Complementary: {', '.join(c.get('complementary_colours', []))}\n"
        if "art_recommendations" in a:
            r = a["art_recommendations"]
            system += f"Suggested styles: {', '.join(r.get('suggested_styles', []))}\n"
            system += f"Suggested sizes: {', '.join(r.get('suggested_sizes', []))}\n"

    session["history"].append({"role": "user", "content": message})

    response = client.messages.create(
        model=MODEL, max_tokens=1000,
        system=system,
        messages=session["history"]
    )

    assistant_message = response.content[0].text
    session["history"].append({"role": "assistant", "content": assistant_message})

    return {
        "response": assistant_message,
        "has_room_analysis": session["room_analysis"] is not None,
        "session_id": session_id,
    }
