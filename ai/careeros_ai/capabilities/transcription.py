"""Speech Transcription capability (Video Interview).

Real speech-to-text via Groq's audio transcription API (Whisper), using
the same `GROQ_API_KEY` and provider already used for every chat model in
this project (`careeros_ai/llm.py`) — not a second AI vendor, just a
different Groq endpoint. This is a direct HTTP call rather than going
through `langchain-groq`'s `ChatGroq` wrapper, since that wrapper only
covers chat/completions, not the separate audio transcription endpoint.

Every value returned here is real: an actual duration and segment
timestamps as reported by Whisper, not estimated or fabricated. Nothing
in this module infers emotion, confidence, or personality from voice —
it produces a transcript and timing data only; any interpretation of
those numbers (pacing, pauses) happens in `voice_signals.py`, and is
scoped there just as narrowly.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field

import httpx

GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
DEFAULT_WHISPER_MODEL = "whisper-large-v3"


class TranscriptionFailed(Exception):
    """An honest generation failure (BR-AI-5) — the caller must not
    proceed with a fabricated or partial transcript."""


@dataclass
class TranscriptSegment:
    start: float
    end: float
    text: str


@dataclass
class TranscriptionResult:
    text: str
    duration_seconds: float
    segments: list[TranscriptSegment] = field(default_factory=list)


def transcribe_audio(audio_bytes: bytes, *, filename: str = "answer.webm") -> TranscriptionResult:
    """Sends the raw recorded audio to Groq's real Whisper endpoint and
    returns the real transcript, duration, and per-segment timestamps.
    Raises `TranscriptionFailed` on any request failure, a non-2xx
    response, or an empty transcript (a silent/unintelligible recording is
    a real failure, not a valid empty answer)."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise TranscriptionFailed("GROQ_API_KEY is not configured.")

    try:
        response = httpx.post(
            GROQ_TRANSCRIPTION_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": (filename, audio_bytes)},
            data={
                "model": os.environ.get("GROQ_WHISPER_MODEL", DEFAULT_WHISPER_MODEL),
                "response_format": "verbose_json",
            },
            timeout=60.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise TranscriptionFailed(f"Transcription request failed: {exc}") from exc

    data = response.json()
    text = (data.get("text") or "").strip()
    if not text:
        raise TranscriptionFailed(
            "Transcription produced no text — the recording may be silent, too short, or unintelligible."
        )

    segments = [
        TranscriptSegment(start=float(s["start"]), end=float(s["end"]), text=s.get("text", ""))
        for s in data.get("segments", [])
    ]
    duration = float(data.get("duration") or (segments[-1].end if segments else 0.0))
    return TranscriptionResult(text=text, duration_seconds=duration, segments=segments)
