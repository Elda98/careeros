"""Pure-logic tests for voice delivery signals — real arithmetic over
scripted segment/text input, no LLM or network call involved."""

from careeros_ai.capabilities.transcription import TranscriptSegment
from careeros_ai.capabilities.voice_signals import (
    compute_pause_count,
    compute_speech_rate_wpm,
    count_filler_words,
)


def test_speech_rate_is_real_words_over_duration():
    # 12 words in 60 seconds = 12 wpm.
    text = " ".join(["word"] * 12)
    assert compute_speech_rate_wpm(text, duration_seconds=60.0) == 12.0


def test_speech_rate_handles_zero_duration_without_dividing_by_zero():
    assert compute_speech_rate_wpm("some words here", duration_seconds=0.0) == 0.0


def test_pause_count_only_counts_gaps_past_the_threshold():
    segments = [
        TranscriptSegment(start=0.0, end=2.0, text="First bit."),
        TranscriptSegment(start=2.2, end=4.0, text="Immediately continues."),  # 0.2s gap — not a pause
        TranscriptSegment(start=5.5, end=7.0, text="After a real pause."),  # 1.5s gap — a real pause
    ]
    assert compute_pause_count(segments, min_pause_seconds=0.6) == 1


def test_pause_count_is_zero_for_a_single_segment():
    assert compute_pause_count([TranscriptSegment(start=0.0, end=2.0, text="Only one.")]) == 0


def test_filler_word_count_matches_the_explicit_pattern_list():
    text = "Um, so I, uh, worked on this, you know, sort of a backend project."
    # um, uh, you know, sort of -> 4 matches.
    assert count_filler_words(text) == 4


def test_filler_word_count_is_zero_for_clean_speech():
    assert count_filler_words("I led the migration from a monolith to microservices.") == 0
