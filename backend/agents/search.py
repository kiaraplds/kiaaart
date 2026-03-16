"""
Search Agent — Finds real artwork to buy using Anthropic's built-in web search.
Uses the server-side web_search tool for much better results than DuckDuckGo.
"""

import json
import sys
import os
import math
import ast
import operator

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from anthropic import Anthropic
from config import MODEL, SEARCH_SYSTEM_PROMPT, MAX_AGENT_TURNS

client = Anthropic()

# ── Tool Definitions ────────────────────────────────────────────────
# We use Anthropic's built-in web search (server-side tool) plus
# our own custom tools for notes and calculation.

SEARCH_TOOLS = [
    # Anthropic's built-in web search — much better than DuckDuckGo
    {
        "type": "web_search_20250305",
        "name": "web_search",
        "max_uses": 10,
    },
    # Custom tools
    {
        "name": "take_notes",
        "description": (
            "Save a found artwork to your shortlist, or list all saved. "
            "When saving, include all details as a JSON string with fields: "
            "title, artist, price, size, url, platform, why_it_fits"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["save", "list"],
                },
                "content": {
                    "type": "string",
                    "description": "Artwork details as JSON string (for save action)."
                }
            },
            "required": ["action"]
        }
    },
    {
        "name": "calculator",
        "description": "Calculate prices or currency conversions. E.g. '250 * 0.79' for USD to GBP.",
        "input_schema": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Math expression in Python syntax."
                }
            },
            "required": ["expression"]
        }
    }
]

# ── Custom Tool Implementations ─────────────────────────────────────

_search_notes = []


def _take_notes(action, content=""):
    global _search_notes
    if action == "save":
        if not content.strip():
            return "Error: provide content to save."
        _search_notes.append(content.strip())
        return f"Saved. Total: {len(_search_notes)}"
    elif action == "list":
        if not _search_notes:
            return "No artworks saved yet."
        return "\n\n".join(f"[{i+1}] {n}" for i, n in enumerate(_search_notes))
    return f"Unknown action: {action}"


def _calculate(expression):
    SAFE = {
        ast.Add: operator.add, ast.Sub: operator.sub,
        ast.Mult: operator.mul, ast.Div: operator.truediv,
        ast.Pow: operator.pow, ast.USub: operator.neg,
    }

    def _eval(node):
        if isinstance(node, ast.Expression): return _eval(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)): return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in SAFE:
            return SAFE[type(node.op)](_eval(node.left), _eval(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in SAFE:
            return SAFE[type(node.op)](_eval(node.operand))
        raise ValueError(f"Unsupported: {type(node)}")

    try:
        return f"{expression} = {_eval(ast.parse(expression, mode='eval'))}"
    except Exception as e:
        return f"Error: {e}"


def _execute_custom_tool(name, inputs):
    """Only handles our custom tools — web_search is handled by Anthropic's servers."""
    try:
        if name == "take_notes": return _take_notes(inputs["action"], inputs.get("content", ""))
        if name == "calculator": return _calculate(inputs["expression"])
        return f"Unknown tool: {name}"
    except Exception as e:
        return f"Tool error: {e}"


# ── Agentic Loop ────────────────────────────────────────────────────

async def search_for_artwork(room_analysis: dict, preferences: dict) -> dict:
    """Search for artwork matching room analysis and user preferences."""
    global _search_notes
    _search_notes = []

    brief = "## Search Brief\n\n"

    if "summary" in room_analysis:
        brief += f"Room: {room_analysis['summary']}\n\n"

    if "art_recommendations" in room_analysis:
        recs = room_analysis["art_recommendations"]
        brief += f"Suggested styles: {', '.join(recs.get('suggested_styles', []))}\n"
        brief += f"Suggested sizes: {', '.join(recs.get('suggested_sizes', []))}\n"
        brief += f"Colours: {', '.join(recs.get('suggested_colour_palette', []))}\n"
        if recs.get("avoid"):
            brief += f"Avoid: {', '.join(recs['avoid'])}\n"

    brief += f"\nBudget: {preferences.get('budget', 'not specified')}\n"
    brief += f"Style: {preferences.get('style', 'open to suggestions')}\n"
    brief += f"Location: {preferences.get('location', 'UK')}\n"
    brief += (
        "\nFind 4-6 real artworks available to buy online that would work in this space. "
        "Search Saatchi Art, Etsy, King & McGaw, Desenio, or other art sites. "
        "For each artwork you find, use take_notes to save it with details: "
        "title, artist, price, size, url, platform, and why_it_fits. "
        "Stay within the budget. When you have 4-6 good options, stop searching "
        "and present your final recommendations."
    )

    messages = [{"role": "user", "content": brief}]
    turns = 0

    while turns < MAX_AGENT_TURNS:
        turns += 1
        print(f"   🔍 Search Agent turn {turns}/{MAX_AGENT_TURNS}")

        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                system=SEARCH_SYSTEM_PROMPT,
                tools=SEARCH_TOOLS,
                messages=messages
            )
        except Exception as e:
            return {"error": str(e), "artworks": _search_notes}

        # Check if the agent is done
        if response.stop_reason == "end_turn":
            final_text = "".join(b.text for b in response.content if b.type == "text")
            return {"artworks": _search_notes, "summary": final_text, "turns": turns}

        elif response.stop_reason == "tool_use":
            # Add the full assistant response (includes tool_use and web search results)
            messages.append({"role": "assistant", "content": response.content})

            # Process ONLY our custom tool calls
            # Web search is handled server-side — results come back automatically
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    print(f"   🔧 {block.name}: {json.dumps(block.input)[:80]}...")
                    result = _execute_custom_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result)
                    })

            if tool_results:
                messages.append({"role": "user", "content": tool_results})

        else:
            break

    return {"artworks": _search_notes, "summary": "Search complete.", "turns": turns}
