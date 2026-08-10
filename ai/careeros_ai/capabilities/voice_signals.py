"""Voice delivery signals (Video Interview) — real, narrow, code-computed
numbers derived from a real Whisper transcript, never an LLM judgment call
and never a claim about emotion, personality, or psychological state.

Every function here computes exactly what its name says from the actual
segment timestamps or transcript text it's given — a pause is a real gap
between two spoken segments, a filler-word count is a real regex match
count, a speech rate is a real words-per-second-of-audio calculation. None
of this infers *why* — a candidate might pause because they're thinking
carefully, not because they're nervous. Callers (the interview router,
the frontend report) must present these as "observed signals," per the
product requirement that behavioral analysis never be phrased as a
diagnosis (e.g. "elevated pacing and pause frequency were observed" —
never "you seemed nervous").
"""

from __future__ import annotations

import re
from itertools import pairwise

from careeros_ai.capabilities.transcription import TranscriptSegment

_FILLER_WORD_PATTERN = re.compile(
    r"\b(um+|uh+|erm+|like|you know|i mean|sort of|kind of)\b", re.IGNORECASE
)

# A gap this long between the end of one spoken segment and the start of
# the next is counted as a real pause — short, natural inter-word gaps
# inside normal speech don't clear this bar.
DEFAULT_MIN_PAUSE_SECONDS = 0.6


def compute_speech_rate_wpm(text: str, duration_seconds: float) -> float:
    """Real words-per-minute: word count over actual audio duration. 0.0
    for a zero-duration recording rather than a division error."""
    if duration_seconds <= 0:
        return 0.0
    word_count = len(text.split())
    return round(word_count / (duration_seconds / 60.0), 1)


def compute_pause_count(segments: list[TranscriptSegment], *, min_pause_seconds: float = DEFAULT_MIN_PAUSE_SECONDS) -> int:
    """Real count of gaps >= min_pause_seconds between consecutive spoken
    segments' timestamps — not estimated from word count or duration."""
    pauses = 0
    for prev, nxt in pairwise(segments):
        if nxt.start - prev.end >= min_pause_seconds:
            pauses += 1
    return pauses


def count_filler_words(text: str) -> int:
    """Real regex match count against a fixed, explicit filler-word list
    — not a learned classifier, same "real pattern matching, not a
    placeholder" discipline as app/core/security.py's injection patterns."""
    return len(_FILLER_WORD_PATTERN.findall(text))
