"""
Quick test script — test each component independently.

Usage:
    python test.py --ping           Test API connection
    python test.py --vision FILE    Analyse a room photo
    python test.py --search         Search for art (uses sample data)
    python test.py --chat "msg"     Chat with the advisor
"""

import sys
import os
import json
import base64
import asyncio

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from anthropic import Anthropic
from config import MODEL


SAMPLE_ANALYSIS = {
    "summary": "A lovely Scandinavian reading nook with clean white shelving and warm lighting. Would benefit from botanical or abstract artwork in muted tones.",
    "art_recommendations": {
        "suggested_styles": ["botanical prints", "abstract watercolour", "minimalist photography"],
        "suggested_sizes": ["80x60cm", "70x50cm"],
        "suggested_colour_palette": ["soft greens", "muted purples", "warm greys"],
        "avoid": ["very bold pieces", "overly dark artwork"]
    }
}


def test_ping():
    print("🔑 Testing API connection...")
    client = Anthropic()
    r = client.messages.create(model=MODEL, max_tokens=50, messages=[{"role": "user", "content": "Say 'WallWise ready!'"}])
    print(f"✅ {r.content[0].text}")


def test_vision(filepath):
    from agents.vision import analyse_room

    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return

    ext = os.path.splitext(filepath)[1].lower()
    media_types = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    media_type = media_types.get(ext, "image/jpeg")

    print(f"📸 Analysing: {filepath}")
    with open(filepath, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    result = asyncio.run(analyse_room(img_b64, media_type))
    print(json.dumps(result, indent=2))

    if "summary" in result:
        print(f"\n🎨 {result['summary']}")


def test_search():
    from agents.search import search_for_artwork

    print("🔍 Searching for art (sample room)...")
    print("   This takes 30-60 seconds...\n")

    results = asyncio.run(search_for_artwork(
        SAMPLE_ANALYSIS,
        {"budget": "£50-200", "style": "botanical or abstract", "location": "UK"}
    ))

    print(f"\n✅ Found {len(results.get('artworks', []))} artworks in {results.get('turns', '?')} turns")
    for i, art in enumerate(results.get("artworks", []), 1):
        print(f"\n  [{i}] {art[:200]}")

    if results.get("summary"):
        print(f"\n📝 {results['summary'][:300]}")


def test_chat(message):
    from agents.orchestrator import conversation_manager

    print(f"💬 You: {message}")
    result = asyncio.run(conversation_manager(message, "test-session", SAMPLE_ANALYSIS))
    print(f"🤖 WallWise: {result['response']}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python test.py --ping")
        print("  python test.py --vision ~/photo.jpg")
        print("  python test.py --search")
        print('  python test.py --chat "What art should I get?"')
        sys.exit(0)

    cmd = sys.argv[1]
    if cmd == "--ping": test_ping()
    elif cmd == "--vision" and len(sys.argv) > 2: test_vision(sys.argv[2])
    elif cmd == "--search": test_search()
    elif cmd == "--chat" and len(sys.argv) > 2: test_chat(sys.argv[2])
    else: print(f"Unknown: {cmd}")
