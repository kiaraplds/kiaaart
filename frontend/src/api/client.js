const API_URL = import.meta.env.VITE_API_URL || '';

export async function analyseRoom(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/api/analyse-room`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`);
  return res.json();
}

export async function searchArt({ roomAnalysis, sessionId, budget, style, colours, size, location }) {
  const res = await fetch(`${API_URL}/api/search-art`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room_analysis: roomAnalysis,
      session_id: sessionId || null,
      budget: budget || '£50-200',
      style: style || 'open to suggestions',
      colours: colours || 'as recommended',
      size: size || 'as recommended',
      location: location || 'UK',
    }),
  });

  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
  return res.json();
}

export async function chat({ message, sessionId, roomAnalysis }) {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      room_analysis: roomAnalysis || null,
    }),
  });

  if (!res.ok) throw new Error(`Chat failed: ${res.statusText}`);
  return res.json();
}

export async function speak(text) {
  const res = await fetch(`${API_URL}/api/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error(`TTS failed: ${res.statusText}`);
  return res.blob();
}
