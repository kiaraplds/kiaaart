"""
Kiaaart — Complete FastAPI Backend
All endpoints: health, room analysis, art search, chat, TTS, history
"""

import os
import uuid
import base64
import io
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from PIL import Image
import pillow_heif
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

pillow_heif.register_heif_opener()

from agents.vision import analyse_room
from agents.search import search_for_artwork
from agents.orchestrator import conversation_manager
from voice.tts import text_to_speech
from database import save_session, save_search_results, get_session, get_all_sessions, delete_session

# Create uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Kiaaart API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ── Health ──────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "kiaaart"}


# ── Room Analysis (Vision Agent) ────────────────────────────────────
@app.post("/api/analyse-room")
async def analyse_room_endpoint(file: UploadFile = File(...), user_token: str = Form(None)):
    """Upload a room photo → get AI analysis and save to history."""
    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"}
    ct = (file.content_type or "").lower()
    ext_lower = os.path.splitext(file.filename or "")[1].lower()

    if not ct.startswith("image/") and ext_lower not in (".heic", ".heif"):
        raise HTTPException(400, "Please upload an image file.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image too large. Max 10MB.")

    # Convert HEIC/HEIF to JPEG for API compatibility
    is_heic = ct in ("image/heic", "image/heif") or ext_lower in (".heic", ".heif")
    if is_heic:
        img = Image.open(io.BytesIO(contents))
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=90)
        contents = buf.getvalue()
        ct = "image/jpeg"
        ext_lower = ".jpg"

    # Save the image to disk
    session_id = str(uuid.uuid4())[:8]
    ext = ext_lower if ext_lower else os.path.splitext(file.filename or "photo.jpg")[1] or ".jpg"
    image_filename = f"{session_id}{ext}"
    image_path = os.path.join(UPLOAD_DIR, image_filename)

    with open(image_path, "wb") as f:
        f.write(contents)

    # Analyse with Vision Agent
    base64_image = base64.b64encode(contents).decode("utf-8")
    media_type = ct or "image/jpeg"

    try:
        analysis = await analyse_room(base64_image, media_type)
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {e}")

    # Save to database
    save_session(session_id, analysis, image_filename, user_token=user_token)

    # Add session info to response
    analysis["session_id"] = session_id
    analysis["image_url"] = f"/uploads/{image_filename}"

    return analysis


# ── Art Search (Search Agent) ───────────────────────────────────────
class SearchRequest(BaseModel):
    room_analysis: dict
    session_id: str | None = None
    budget: str = "£50-200"
    style: str = "open to suggestions"
    colours: str = "as recommended"
    size: str = "as recommended"
    location: str = "UK"


@app.post("/api/search-art")
async def search_art_endpoint(payload: SearchRequest):
    """Search for artwork and save results to history."""
    preferences = {
        "budget": payload.budget,
        "style": payload.style,
        "colours": payload.colours,
        "size": payload.size,
        "location": payload.location,
    }
    try:
        results = await search_for_artwork(payload.room_analysis, preferences)

        # Save to database if we have a session
        if payload.session_id:
            save_search_results(
                payload.session_id,
                preferences,
                results.get("artworks", []),
                results.get("summary", "")
            )

        return results
    except Exception as e:
        raise HTTPException(500, f"Search failed: {e}")


# ── Chat (Orchestrator) ────────────────────────────────────────────
class ChatMessage(BaseModel):
    message: str
    session_id: str
    room_analysis: dict | None = None


@app.post("/api/chat")
async def chat_endpoint(payload: ChatMessage):
    """Chat with the Kiaaart art advisor."""
    try:
        return await conversation_manager(
            message=payload.message,
            session_id=payload.session_id,
            room_analysis=payload.room_analysis,
        )
    except Exception as e:
        raise HTTPException(500, f"Chat failed: {e}")


# ── Text-to-Speech (ElevenLabs) ────────────────────────────────────
class TTSRequest(BaseModel):
    text: str
    voice_id: str | None = None


@app.post("/api/speak")
async def speak_endpoint(payload: TTSRequest):
    """Convert text to speech. Returns MP3 audio."""
    try:
        audio_bytes = await text_to_speech(payload.text, payload.voice_id)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"TTS failed: {e}")


# ── History ─────────────────────────────────────────────────────────
@app.get("/api/history")
async def get_history(user_token: str = Query(None)):
    """Get past sessions filtered by user_token."""
    sessions = get_all_sessions(user_token=user_token)
    return {"sessions": sessions}


@app.get("/api/history/{session_id}")
async def get_history_item(session_id: str):
    """Get a specific past session."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@app.delete("/api/history/{session_id}")
async def delete_history_item(session_id: str):
    """Delete a past session."""
    session = get_session(session_id)
    if session and session.get("room_image_path"):
        image_path = os.path.join(UPLOAD_DIR, session["room_image_path"])
        if os.path.exists(image_path):
            os.remove(image_path)
    delete_session(session_id)
    return {"deleted": True}


# ── Link Checker ──────────────────────────────────────────────────
import httpx
import asyncio

class LinkCheckRequest(BaseModel):
    urls: list[str]

@app.post("/api/check-links")
async def check_links(payload: LinkCheckRequest):
    """Check if artwork URLs are still live. Returns status for each URL."""
    async def check_one(http, url):
        try:
            resp = await http.head(url, headers={"User-Agent": "Mozilla/5.0"})
            return url, {"alive": resp.status_code < 400, "status": resp.status_code}
        except Exception:
            return url, {"alive": False, "status": 0}

    async with httpx.AsyncClient(timeout=5, follow_redirects=True) as http:
        checks = [check_one(http, url) for url in payload.urls[:20]]
        pairs = await asyncio.gather(*checks)
    return {"results": dict(pairs)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
