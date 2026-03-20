"""
Orchestrator — Manages conversation flow and chains agents together.
Uses tool use so Claude can trigger artwork search when it has enough info.
"""

import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from anthropic import Anthropic
from config import MODEL, CURATOR_SYSTEM_PROMPT
from agents.search import search_for_artwork

client = Anthropic()
sessions = {}

SEARCH_TOOL = {
    "name": "search_artwork",
    "description": (
        "Search for real artwork to buy online. Call this as soon as you have enough info "
        "from the user (at minimum: what kind of art they want). Don't keep asking questions — "
        "if the user says something like 'find me blue beach art for £500', that's enough to search. "
        "You can infer reasonable defaults for missing info."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "budget": {
                "type": "string",
                "description": "Budget range, e.g. 'Under £50', '£50-150', '£300-500', '£500'"
            },
            "style": {
                "type": "string",
                "description": "Art style preferences, e.g. 'abstract seascape', 'minimalist', 'blue beach art'"
            },
            "colours": {
                "type": "string",
                "description": "Preferred colour palette"
            },
            "size": {
                "type": "string",
                "description": "Preferred size, e.g. 'large statement piece', '80x100cm'"
            },
            "location": {
                "type": "string",
                "description": "User's region for platform selection. Default: 'UK'"
            },
            "room_context": {
                "type": "string",
                "description": "Brief description of the room/space if mentioned"
            }
        },
        "required": ["style"]
    }
}


from typing import Optional

async def conversation_manager(message: str, session_id: str, room_analysis: Optional[dict] = None) -> dict:
    """Handle a conversation turn. Claude can trigger search when ready."""

    if session_id not in sessions:
        sessions[session_id] = {"history": [], "room_analysis": None, "preferences": {}}

    session = sessions[session_id]

    if room_analysis:
        session["room_analysis"] = room_analysis

    # Build system prompt with room context
    system = CURATOR_SYSTEM_PROMPT + """

## IMPORTANT BEHAVIOR:
- Do NOT ask more than 1 follow-up question before searching.
- If the user gives you enough to work with (style, or a description of what they want), SEARCH IMMEDIATELY.
- Use the search_artwork tool to find real artwork. Don't just give generic advice.
- You can infer reasonable defaults: budget='£50-300' if not specified, location='UK', size='medium'.
- When the user says "find me X" or "I'm looking for X" or "show me X" — that means SEARCH NOW.
- After search results come back, write a brief friendly summary. The artwork cards are shown automatically.
"""

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
        tools=[SEARCH_TOOL],
        messages=session["history"]
    )

    # Check if Claude wants to use the search tool
    if response.stop_reason == "tool_use":
        # Extract tool call
        tool_block = next(b for b in response.content if b.type == "tool_use")
        search_params = tool_block.input

        # Get any text Claude said before calling the tool
        pre_text = "".join(b.text for b in response.content if b.type == "text").strip()

        # Build room analysis from context if we don't have one from image
        room_ctx = {
            "summary": search_params.get("room_context", "User described their space in chat"),
            "art_recommendations": {
                "suggested_styles": [search_params.get("style", "mixed")],
                "suggested_sizes": [search_params.get("size", "medium")],
                "suggested_colour_palette": [search_params.get("colours", "as recommended")],
            }
        }

        preferences = {
            "budget": search_params.get("budget", "£50-300"),
            "style": search_params.get("style", "open to suggestions"),
            "colours": search_params.get("colours", "as recommended"),
            "size": search_params.get("size", "as recommended"),
            "location": search_params.get("location", "UK"),
        }

        # Run the search
        results = await search_for_artwork(
            session["room_analysis"] or room_ctx,
            preferences
        )

        # Add to history
        assistant_content = pre_text if pre_text else "Let me find some artwork for you..."
        session["history"].append({"role": "assistant", "content": assistant_content})

        return {
            "response": results.get("summary", assistant_content),
            "has_room_analysis": session["room_analysis"] is not None,
            "session_id": session_id,
            "search_results": results,
            "artworks": results.get("artworks", []),
        }

    # Normal text response (no tool call)
    assistant_message = "".join(b.text for b in response.content if b.type == "text")
    session["history"].append({"role": "assistant", "content": assistant_message})

    return {
        "response": assistant_message,
        "has_room_analysis": session["room_analysis"] is not None,
        "session_id": session_id,
    }
