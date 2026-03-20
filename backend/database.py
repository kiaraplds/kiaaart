"""
Database — SQLite storage for room analyses and artwork results.
Stores everything in a single wallwise.db file — no external DB needed.
"""

import sqlite3
import json
import os
import uuid
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "wallwise.db")


def get_db():
    """Get a database connection. Creates tables on first use."""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            room_image_path TEXT,
            room_analysis TEXT,
            preferences TEXT,
            artworks TEXT,
            summary TEXT,
            user_token TEXT
        )
    """)
    db.commit()
    return db


def save_session(session_id: str, room_analysis: dict, image_filename: str = None, user_token: str = None) -> str:
    """Save or update a session with room analysis."""
    db = get_db()
    existing = db.execute("SELECT id FROM sessions WHERE id = ?", (session_id,)).fetchone()

    if existing:
        db.execute(
            "UPDATE sessions SET room_analysis = ?, room_image_path = ? WHERE id = ?",
            (json.dumps(room_analysis), image_filename, session_id)
        )
    else:
        db.execute(
            "INSERT INTO sessions (id, created_at, room_analysis, room_image_path, user_token) VALUES (?, ?, ?, ?, ?)",
            (session_id, datetime.now().isoformat(), json.dumps(room_analysis), image_filename, user_token)
        )

    db.commit()
    db.close()
    return session_id


def save_search_results(session_id: str, preferences: dict, artworks: list, summary: str):
    """Save artwork search results to a session."""
    db = get_db()
    db.execute(
        "UPDATE sessions SET preferences = ?, artworks = ?, summary = ? WHERE id = ?",
        (json.dumps(preferences), json.dumps(artworks), summary, session_id)
    )
    db.commit()
    db.close()


def get_session(session_id: str) -> dict | None:
    """Retrieve a single session."""
    db = get_db()
    row = db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    db.close()

    if not row:
        return None

    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "room_image_path": row["room_image_path"],
        "room_analysis": json.loads(row["room_analysis"]) if row["room_analysis"] else None,
        "preferences": json.loads(row["preferences"]) if row["preferences"] else None,
        "artworks": json.loads(row["artworks"]) if row["artworks"] else None,
        "summary": row["summary"],
    }


def get_all_sessions(user_token: str = None) -> list:
    """Get all sessions, newest first. Optionally filter by user_token."""
    db = get_db()
    if user_token:
        rows = db.execute("SELECT * FROM sessions WHERE user_token = ? ORDER BY created_at DESC", (user_token,)).fetchall()
    else:
        rows = db.execute("SELECT * FROM sessions ORDER BY created_at DESC").fetchall()
    db.close()

    return [{
        "id": row["id"],
        "created_at": row["created_at"],
        "room_image_path": row["room_image_path"],
        "room_analysis": json.loads(row["room_analysis"]) if row["room_analysis"] else None,
        "preferences": json.loads(row["preferences"]) if row["preferences"] else None,
        "artworks": json.loads(row["artworks"]) if row["artworks"] else None,
        "summary": row["summary"],
    } for row in rows]


def delete_session(session_id: str):
    """Delete a session."""
    db = get_db()
    db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    db.commit()
    db.close()
