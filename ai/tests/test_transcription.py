"""Exercises the real transcribe_audio() request/response handling with
httpx.post mocked at the network boundary — no live Groq call, no real
audio file, but the actual parsing/validation logic runs unmodified.
"""

from __future__ import annotations

import httpx
import pytest
from careeros_ai.capabilities.transcription import TranscriptionFailed, transcribe_audio


class _FakeResponse:
    def __init__(self, json_body: dict, status_code: int = 200):
        self._json_body = json_body
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("error", request=None, response=self)

    def json(self):
        return self._json_body


def test_transcribe_audio_returns_real_text_duration_and_segments(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key-for-test")
    monkeypatch.setattr(
        httpx,
        "post",
        lambda *a, **kw: _FakeResponse(
            {
                "text": "I led the backend migration.",
                "duration": 5.0,
                "segments": [
                    {"start": 0.0, "end": 2.0, "text": "I led"},
                    {"start": 2.0, "end": 5.0, "text": "the backend migration."},
                ],
            }
        ),
    )

    result = transcribe_audio(b"fake-audio-bytes")

    assert result.text == "I led the backend migration."
    assert result.duration_seconds == 5.0
    assert len(result.segments) == 2
    assert result.segments[0].start == 0.0
    assert result.segments[1].end == 5.0


def test_transcribe_audio_fails_honestly_without_an_api_key(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    with pytest.raises(TranscriptionFailed):
        transcribe_audio(b"fake-audio-bytes")


def test_transcribe_audio_fails_honestly_on_empty_transcript(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key-for-test")
    monkeypatch.setattr(httpx, "post", lambda *a, **kw: _FakeResponse({"text": "", "duration": 3.0, "segments": []}))

    with pytest.raises(TranscriptionFailed):
        transcribe_audio(b"fake-audio-bytes")


def test_transcribe_audio_fails_honestly_on_http_error(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key-for-test")

    def _raise(*a, **kw):
        raise httpx.ConnectError("network unreachable")

    monkeypatch.setattr(httpx, "post", _raise)

    with pytest.raises(TranscriptionFailed):
        transcribe_audio(b"fake-audio-bytes")
